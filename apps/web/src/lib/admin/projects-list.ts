// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck -- projects table not yet in generated Supabase types
import { createClient } from '@/lib/supabase/server';
import type {
  ProjectRow,
  ProjectSavedView,
  ProjectType,
  ProjectStatus,
} from './project-types';

type Options = { viewKey?: string; search?: string | null };

export async function fetchAdminProjectsList(
  opts: Options = {},
): Promise<{
  rows: ProjectRow[];
  views: ProjectSavedView[];
  activeView: ProjectSavedView;
}> {
  const supabase = await createClient();

  const { data: viewsRaw } = await supabase
    .from('saved_views')
    .select('key, name, sort_order, filter_jsonb')
    .eq('entity_type', 'project')
    .eq('is_shared', true)
    .order('sort_order');

  const views: ProjectSavedView[] = (viewsRaw ?? []).map((v) => ({
    key: v.key,
    name: v.name,
    sortOrder: v.sort_order ?? 0,
    count: 0,
  }));
  const activeView =
    views.find((v) => v.key === (opts.viewKey ?? 'all-projects')) ??
    views[0];
  if (!activeView) throw new Error('No project saved views');
  const activeFilter = (viewsRaw?.find((r) => r.key === activeView.key)?.filter_jsonb ?? {}) as {
    types?: ProjectType[];
    status?: ProjectStatus[];
    exclude_status?: ProjectStatus[];
  };

  let query = supabase
    .from('projects')
    .select(`
      id, name, description, project_type, status, owner_user_id, target_date,
      linked_contact_id, linked_property_id, archived_at, emoji, color,
      created_at, updated_at,
      owner_profile:profiles!projects_owner_user_id_fkey(full_name),
      linked_contact:contacts(full_name, profile_id),
      linked_property:properties(name, address_line1)
    `)
    .order('updated_at', { ascending: false });

  if (activeFilter.types?.length) query = query.in('project_type', activeFilter.types);
  if (activeFilter.status?.length) query = query.in('status', activeFilter.status);
  if (activeFilter.exclude_status?.length) {
    query = query.not('status', 'in', `(${activeFilter.exclude_status.map((s) => `"${s}"`).join(',')})`);
  }
  if (opts.search) query = query.ilike('name', `%${opts.search.trim()}%`);

  const { data, error } = await query;
  if (error) throw error;

  // Fetch task counts for all projects in this view (tasks uses parent_type/parent_id)
  const projectIds = (data ?? []).map((r) => r.id as string);
  const tasksByProject: Record<string, { total: number; done: number }> = {};
  if (projectIds.length > 0) {
    const { data: taskData } = await supabase
      .from('tasks')
      .select('parent_id, status')
      .eq('parent_type', 'project')
      .in('parent_id', projectIds);
    for (const t of (taskData ?? []) as Array<{ parent_id: string; status: string }>) {
      if (!t.parent_id) continue;
      if (!tasksByProject[t.parent_id]) tasksByProject[t.parent_id] = { total: 0, done: 0 };
      tasksByProject[t.parent_id].total++;
      if (t.status === 'done') tasksByProject[t.parent_id].done++;
    }
  }

  const rows: ProjectRow[] = (data ?? []).map((r) => {
    const taskStats = tasksByProject[r.id as string] ?? { total: 0, done: 0 };
    const linkedContact = Array.isArray(r.linked_contact)
      ? r.linked_contact[0]
      : (r.linked_contact as { full_name?: string; profile_id?: string | null } | null);
    const linkedProperty = Array.isArray(r.linked_property)
      ? r.linked_property[0]
      : (r.linked_property as { name?: string; address_line1?: string } | null);
    const owner = Array.isArray(r.owner_profile)
      ? r.owner_profile[0]
      : (r.owner_profile as { full_name?: string } | null);
    return {
      id: r.id as string,
      name: r.name as string,
      description: r.description as string | null,
      projectType: r.project_type as ProjectType,
      status: r.status as ProjectStatus,
      ownerUserId: r.owner_user_id as string | null,
      ownerUserName: owner?.full_name ?? null,
      targetDate: r.target_date as string | null,
      linkedContactId: r.linked_contact_id as string | null,
      linkedContactName: linkedContact?.full_name ?? null,
      linkedContactProfileId: linkedContact?.profile_id ?? null,
      linkedPropertyId: r.linked_property_id as string | null,
      linkedPropertyName: linkedProperty?.name ?? linkedProperty?.address_line1 ?? null,
      archivedAt: r.archived_at as string | null,
      emoji: r.emoji as string | null,
      color: r.color as string | null,
      taskCount: taskStats.total,
      taskDoneCount: taskStats.done,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    };
  });

  // Per-view counts
  for (const v of views) {
    const vRaw = viewsRaw?.find((r) => r.key === v.key);
    const f = (vRaw?.filter_jsonb ?? {}) as typeof activeFilter;
    let cq = supabase.from('projects').select('*', { count: 'exact', head: true });
    if (f.types?.length) cq = cq.in('project_type', f.types);
    if (f.status?.length) cq = cq.in('status', f.status);
    if (f.exclude_status?.length) {
      cq = cq.not('status', 'in', `(${f.exclude_status.map((s: string) => `"${s}"`).join(',')})`);
    }
    const { count } = await cq;
    v.count = count ?? 0;
  }

  return { rows, views, activeView };
}
