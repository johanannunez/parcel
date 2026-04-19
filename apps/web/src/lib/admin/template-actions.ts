'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { RecurrenceRule } from './recurrence';
import { nextOccurrence } from './recurrence';

export type TaskTemplate = {
  id: string;
  name: string;
  description: string | null;
  taskType: string;
  tags: string[];
  estimatedMinutes: number | null;
  recurrenceRule: RecurrenceRule;
  preNotifyHours: number | null;
  appliesTo: 'property' | 'contact' | 'global';
};

export async function fetchActiveTaskTemplates(
  appliesTo: 'property' | 'contact' | 'global' = 'property',
): Promise<TaskTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('task_templates')
    .select('id, name, description, task_type, tags, estimated_minutes, recurrence_rule, pre_notify_hours, applies_to')
    .eq('is_active', true)
    .eq('applies_to', appliesTo)
    .order('name');
  if (error) throw error;
  return (data ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    taskType: t.task_type,
    tags: (t.tags as string[]) ?? [],
    estimatedMinutes: t.estimated_minutes,
    recurrenceRule: t.recurrence_rule as RecurrenceRule,
    preNotifyHours: t.pre_notify_hours,
    appliesTo: t.applies_to as 'property' | 'contact' | 'global',
  }));
}

export async function applyTemplateToProperty(args: {
  templateId: string;
  propertyId: string;
  firstDueAt?: string;
  assigneeId?: string | null;
}): Promise<{ taskId: string | null; linkId: string; alreadyApplied: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('not authenticated');

  // Check whether this (property, template) link already exists. If so, skip
  // both the link upsert and the task insert so re-runs don't accumulate
  // duplicate task rows.
  const { data: existingLink, error: existingErr } = await supabase
    .from('property_task_templates')
    .select('property_id, template_id')
    .eq('property_id', args.propertyId)
    .eq('template_id', args.templateId)
    .maybeSingle();
  if (existingErr) throw existingErr;

  if (existingLink) {
    return {
      taskId: null,
      linkId: `${existingLink.property_id}:${existingLink.template_id}`,
      alreadyApplied: true,
    };
  }

  const { data: t, error: tErr } = await supabase
    .from('task_templates')
    .select('*')
    .eq('id', args.templateId)
    .single();
  if (tErr) throw tErr;

  const firstDue = args.firstDueAt ?? new Date().toISOString();
  const rule = t.recurrence_rule as RecurrenceRule;
  const nextSpawn = nextOccurrence(new Date(firstDue), rule)?.toISOString() ?? null;

  const { data: task, error: taskErr } = await supabase
    .from('tasks')
    .insert({
      title: t.name,
      description: t.description,
      parent_type: 'property',
      parent_id: args.propertyId,
      assignee_id: args.assigneeId ?? null,
      created_by: user.id,
      due_at: firstDue,
      task_type: t.task_type,
      tags: (t.tags as string[]) ?? [],
      estimated_minutes: t.estimated_minutes,
      recurrence_rule: t.recurrence_rule,
      pre_notify_hours: t.pre_notify_hours,
      next_spawn_at: nextSpawn,
      linked_property_id: args.propertyId,
      status: 'todo',
    })
    .select('id')
    .single();
  if (taskErr) throw taskErr;

  // Insert the link row. We already verified above that no link exists, so a
  // plain insert is correct; keep the onConflict guard as a safety net in case
  // of a race.
  const { data: link, error: linkErr } = await supabase
    .from('property_task_templates')
    .upsert(
      {
        property_id: args.propertyId,
        template_id: args.templateId,
        assignee_id: args.assigneeId ?? null,
        last_spawned_at: new Date().toISOString(),
        next_due_at: nextSpawn,
        is_active: true,
      },
      { onConflict: 'property_id,template_id' },
    )
    .select('property_id, template_id')
    .single();
  if (linkErr) throw linkErr;

  revalidatePath(`/admin/properties/${args.propertyId}`);
  revalidatePath('/admin/tasks');
  return {
    taskId: task.id,
    linkId: `${link.property_id}:${link.template_id}`,
    alreadyApplied: false,
  };
}

export async function applyAllDefaultTemplatesToProperty(
  propertyId: string,
  assigneeId?: string | null,
): Promise<{ applied: number }> {
  const templates = await fetchActiveTaskTemplates('property');
  let applied = 0;
  for (const t of templates) {
    try {
      const result = await applyTemplateToProperty({
        templateId: t.id,
        propertyId,
        assigneeId: assigneeId ?? null,
      });
      // Only count as applied when a new link+task pair was created. A template
      // that was already linked to the property is a no-op.
      if (!result.alreadyApplied) applied++;
    } catch {
      // Non-fatal error. Continue with the remaining templates.
    }
  }
  return { applied };
}

export async function removeTemplateFromProperty(
  propertyId: string,
  templateId: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('property_task_templates')
    .update({ is_active: false })
    .eq('property_id', propertyId)
    .eq('template_id', templateId);
  if (error) throw error;

  // Existing task occurrences remain. Future spawns will stop since the
  // link is deactivated. To halt open occurrences, mark them done separately.
  revalidatePath(`/admin/properties/${propertyId}`);
}
