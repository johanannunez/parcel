// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck -- projects table not yet in generated Supabase types
'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ProjectStatus, ProjectType } from './project-types';

export type CreateProjectInput = {
  name: string;
  description?: string;
  projectType: ProjectType;
  status?: ProjectStatus;
  targetDate?: string;
  linkedContactId?: string | null;
  linkedPropertyId?: string | null;
  emoji?: string | null;
  color?: string | null;
};

export async function createProject(input: CreateProjectInput): Promise<{ id: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('not authenticated');

  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      project_type: input.projectType,
      status: input.status ?? 'not_started',
      owner_user_id: user.id,
      target_date: input.targetDate ?? null,
      linked_contact_id: input.linkedContactId ?? null,
      linked_property_id: input.linkedPropertyId ?? null,
      emoji: input.emoji ?? null,
      color: input.color ?? null,
    })
    .select('id')
    .single();
  if (error) throw error;
  revalidatePath('/admin/projects');
  return { id: data.id as string };
}

export async function updateProject(
  id: string,
  patch: Partial<Omit<CreateProjectInput, 'projectType'>> & { projectType?: ProjectType; status?: ProjectStatus },
): Promise<void> {
  const supabase = await createClient();
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.description !== undefined) update.description = patch.description;
  if (patch.projectType !== undefined) update.project_type = patch.projectType;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.targetDate !== undefined) update.target_date = patch.targetDate;
  if (patch.linkedContactId !== undefined) update.linked_contact_id = patch.linkedContactId;
  if (patch.linkedPropertyId !== undefined) update.linked_property_id = patch.linkedPropertyId;
  if (patch.emoji !== undefined) update.emoji = patch.emoji;
  if (patch.color !== undefined) update.color = patch.color;

  const { error } = await supabase.from('projects').update(update).eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/projects');
  revalidatePath(`/admin/projects/${id}`);
}

export async function archiveProject(id: string): Promise<void> {
  await updateProject(id, { status: 'archived' });
}
