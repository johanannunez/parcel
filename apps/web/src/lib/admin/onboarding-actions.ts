'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminUser } from './auth';
import { ONBOARDING_TASKS, phaseTag } from './onboarding-templates';

/**
 * Seed the full onboarding task checklist for every property belonging to
 * a contact. Safe to call multiple times — skips if tasks already exist.
 *
 * Call this immediately after updating a contact's lifecycle_stage to
 * 'onboarding'.
 */
export async function seedOnboardingTasks(contactId: string): Promise<void> {
  const { supabase, user } = await requireAdminUser();

  const { data: contact } = await supabase
    .from('contacts')
    .select('profile_id')
    .eq('id', contactId)
    .maybeSingle();

  if (!contact?.profile_id) return;

  const [{ data: direct }, { data: coOwned }] = await Promise.all([
    supabase.from('properties').select('id').eq('owner_id', contact.profile_id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('property_owners')
      .select('property_id')
      .eq('owner_id', contact.profile_id) as Promise<{
      data: Array<{ property_id: string }> | null;
    }>,
  ]);

  const propertyIds = Array.from(
    new Set([
      ...(direct ?? []).map((p: { id: string }) => p.id),
      ...(coOwned ?? []).map((p) => p.property_id),
    ]),
  );

  if (propertyIds.length === 0) return;

  // Skip if any onboarding tasks already exist for these properties.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('tasks')
    .select('id')
    .eq('parent_type', 'property')
    .in('parent_id', propertyIds)
    .contains('tags', ['onboarding'])
    .limit(1);

  if ((existing ?? []).length > 0) return;

  const rows = propertyIds.flatMap((propertyId) =>
    ONBOARDING_TASKS.map((task) => ({
      title: task.title,
      parent_type: 'property',
      parent_id: propertyId,
      created_by: user.id,
      tags: ['onboarding', phaseTag(task.phase)],
      estimated_minutes: task.estimatedMinutes,
      status: 'todo',
      task_type: 'todo',
    })),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (supabase as any).from('tasks').insert(rows);
  if (insertError) throw new Error(`Failed to seed onboarding tasks: ${insertError.message}`);

  revalidatePath('/admin/tasks');
  revalidatePath('/admin/workspaces');
}
