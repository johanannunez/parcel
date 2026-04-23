// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck -- projects table not yet in generated Supabase types
import { createClient } from '@/lib/supabase/server';
import type { ProjectRow } from './project-types';
import type { ProjectType, ProjectStatus } from './project-types';

export async function fetchProjectDetail(id: string): Promise<ProjectRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projects')
    .select(`
      id, name, description, project_type, status, owner_user_id, target_date,
      linked_contact_id, linked_property_id, archived_at, emoji, color,
      created_at, updated_at,
      owner_profile:profiles!projects_owner_user_id_fkey(full_name),
      linked_contact:contacts(full_name, profile_id),
      linked_property:properties(name, address_line1)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[project-detail] fetch error:', error.code, error.message);
    return null;
  }
  if (!data) return null;

  // Fetch task counts
  const { data: taskData } = await supabase
    .from('tasks')
    .select('status')
    .eq('parent_type', 'project')
    .eq('parent_id', id);

  const tasks = (taskData ?? []) as Array<{ status: string }>;

  const linkedContact = Array.isArray(data.linked_contact)
    ? data.linked_contact[0]
    : (data.linked_contact as { full_name?: string; profile_id?: string | null } | null);
  const linkedProperty = Array.isArray(data.linked_property)
    ? data.linked_property[0]
    : (data.linked_property as { name?: string; address_line1?: string } | null);
  const owner = Array.isArray(data.owner_profile)
    ? data.owner_profile[0]
    : (data.owner_profile as { full_name?: string } | null);

  return {
    id: data.id as string,
    name: data.name as string,
    description: data.description as string | null,
    projectType: data.project_type as ProjectType,
    status: data.status as ProjectStatus,
    ownerUserId: data.owner_user_id as string | null,
    ownerUserName: owner?.full_name ?? null,
    targetDate: data.target_date as string | null,
    linkedContactId: data.linked_contact_id as string | null,
    linkedContactName: linkedContact?.full_name ?? null,
    linkedContactProfileId: linkedContact?.profile_id ?? null,
    linkedPropertyId: data.linked_property_id as string | null,
    linkedPropertyName: linkedProperty?.name ?? linkedProperty?.address_line1 ?? null,
    archivedAt: data.archived_at as string | null,
    emoji: data.emoji as string | null,
    color: data.color as string | null,
    taskCount: tasks.length,
    taskDoneCount: tasks.filter((t) => t.status === 'done').length,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}
