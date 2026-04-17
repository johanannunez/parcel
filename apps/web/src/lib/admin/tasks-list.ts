import { createClient } from '@/lib/supabase/server';
import { bucketForDue, BUCKET_ORDER, type DueBucket } from './due-buckets';
import type {
  Task,
  TaskGroup,
  TaskParent,
  TasksFetchResult,
  TasksSavedView,
} from './task-types';

type Options = {
  viewKey?: string;
  search?: string | null;
  parentFilter?: { type: 'contact' | 'property' | 'project'; id: string } | null;
};

export async function fetchAdminTasksList(
  opts: Options = {},
): Promise<TasksFetchResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('not authenticated');

  const { data: viewsRaw } = await supabase
    .from('saved_views')
    .select('key, name, sort_order')
    .eq('entity_type', 'task')
    .eq('is_shared', true)
    .order('sort_order');

  const views: TasksSavedView[] = (viewsRaw ?? []).map((v) => ({
    key: v.key,
    name: v.name,
    sortOrder: v.sort_order ?? 0,
    count: 0,
  }));
  const activeView =
    views.find((v) => v.key === (opts.viewKey ?? 'my-tasks')) ??
    views.find((v) => v.key === 'my-tasks') ??
    views[0];
  if (!activeView) throw new Error('No task saved views');

  let query = supabase
    .from('tasks')
    .select(`
      id, parent_task_id, parent_type, parent_id, title, description, status,
      assignee_id, created_by, due_at, completed_at, created_at,
      assignee:profiles!tasks_assignee_id_fkey(full_name, avatar_url),
      creator:profiles!tasks_created_by_fkey1(full_name)
    `)
    .order('due_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  switch (activeView.key) {
    case 'my-tasks':
      query = query.eq('assignee_id', user.id).neq('status', 'done');
      break;
    case 'overdue':
      query = query.lt('due_at', new Date().toISOString()).neq('status', 'done');
      break;
    case 'this-week': {
      const now = new Date();
      const dow = now.getDay();
      const endOfWeek = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + (7 - dow),
      );
      query = query.lte('due_at', endOfWeek.toISOString()).neq('status', 'done');
      break;
    }
    case 'unassigned':
      query = query.is('assignee_id', null).neq('status', 'done');
      break;
    default:
      query = query.neq('status', 'done');
  }

  if (opts.parentFilter) {
    query = query
      .eq('parent_type', opts.parentFilter.type)
      .eq('parent_id', opts.parentFilter.id);
  }

  if (opts.search) {
    // Wrap in double quotes to avoid PostgREST .or() grammar issues if search is extended later.
    const safe = opts.search.trim().replaceAll('"', '""');
    query = query.ilike('title', `%${safe}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  const byType: Record<'contact' | 'property' | 'project', string[]> = {
    contact: [],
    property: [],
    project: [],
  };
  for (const t of data ?? []) {
    if (t.parent_type && t.parent_id) {
      byType[t.parent_type as keyof typeof byType].push(t.parent_id);
    }
  }

  const parentMap: Record<string, { label: string; contactProfileId?: string | null }> = {};

  if (byType.contact.length > 0) {
    const { data: rows } = await supabase
      .from('contacts')
      .select('id, full_name, company_name, profile_id')
      .in('id', Array.from(new Set(byType.contact)));
    for (const r of rows ?? []) {
      parentMap[`contact:${r.id}`] = {
        label: r.full_name || r.company_name || 'Contact',
        contactProfileId: r.profile_id,
      };
    }
  }
  if (byType.property.length > 0) {
    const { data: rows } = await supabase
      .from('properties')
      .select('id, name, address_line1')
      .in('id', Array.from(new Set(byType.property)));
    for (const r of rows ?? []) {
      const label = r.name ?? r.address_line1 ?? 'Property';
      parentMap[`property:${r.id}`] = { label };
    }
  }
  if (byType.project.length > 0) {
    try {
      // Cast to `any` so TypeScript does not reject the table name.
      // The projects table ships in Plan C; until then this no-ops at runtime.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rows } = await (supabase as any)
        .from('projects')
        .select('id, name')
        .in('id', Array.from(new Set(byType.project)));
      for (const r of (rows ?? []) as { id: string; name?: string }[]) {
        parentMap[`project:${r.id}`] = { label: r.name ?? 'Project' };
      }
    } catch {
      // projects table may not exist yet (Plan C ships it). Skip silently.
    }
  }

  // Subtask counts for parent tasks in this view
  const parentTaskIds = (data ?? [])
    .filter((t) => t.parent_task_id === null)
    .map((t) => t.id);
  const subtaskCounts: Record<string, { total: number; done: number }> = {};
  if (parentTaskIds.length > 0) {
    const { data: subs } = await supabase
      .from('tasks')
      .select('parent_task_id, status')
      .in('parent_task_id', parentTaskIds);
    for (const s of subs ?? []) {
      const key = s.parent_task_id as string;
      if (!subtaskCounts[key]) subtaskCounts[key] = { total: 0, done: 0 };
      subtaskCounts[key].total += 1;
      if (s.status === 'done') subtaskCounts[key].done += 1;
    }
  }

  const tasks: Task[] = (data ?? []).map((t) => {
    const parentInfo =
      t.parent_type && t.parent_id
        ? parentMap[`${t.parent_type}:${t.parent_id}`]
        : null;
    const parent: TaskParent | null =
      t.parent_type && t.parent_id && parentInfo
        ? {
            type: t.parent_type as TaskParent['type'],
            id: t.parent_id,
            label: parentInfo.label,
            contactProfileId: parentInfo.contactProfileId,
          }
        : null;
    const assignee = Array.isArray(t.assignee)
      ? t.assignee[0]
      : (t.assignee as { full_name?: string; avatar_url?: string } | null);
    const creator = Array.isArray(t.creator)
      ? t.creator[0]
      : (t.creator as { full_name?: string } | null);
    const counts = subtaskCounts[t.id] ?? { total: 0, done: 0 };
    return {
      id: t.id,
      parentTaskId: t.parent_task_id,
      title: t.title,
      description: t.description,
      status: t.status as Task['status'],
      assigneeId: t.assignee_id,
      assigneeName: assignee?.full_name ?? null,
      assigneeAvatarUrl: assignee?.avatar_url ?? null,
      createdById: t.created_by,
      createdByName: creator?.full_name ?? null,
      dueAt: t.due_at,
      completedAt: t.completed_at,
      createdAt: t.created_at,
      parent,
      subtaskCount: counts.total,
      subtaskDoneCount: counts.done,
    };
  });

  // Group parent tasks by due bucket; subtasks render inline under their parents.
  const groups: Record<DueBucket, Task[]> = {
    overdue: [], today: [], this_week: [], later: [], no_date: [],
  };
  for (const t of tasks) {
    if (t.parentTaskId !== null) continue;
    groups[bucketForDue(t.dueAt)].push(t);
  }
  const ordered: TaskGroup[] = BUCKET_ORDER
    .map((b) => ({ bucket: b, tasks: groups[b] }))
    .filter((g) => g.tasks.length > 0);

  // Per-view counts (mirror the active-view filters per key)
  for (const v of views) {
    let cq = supabase.from('tasks').select('*', { count: 'exact', head: true });
    switch (v.key) {
      case 'my-tasks':
        cq = cq.eq('assignee_id', user.id).neq('status', 'done');
        break;
      case 'overdue':
        cq = cq.lt('due_at', new Date().toISOString()).neq('status', 'done');
        break;
      case 'this-week': {
        const now = new Date();
        const dow = now.getDay();
        const endOfWeek = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + (7 - dow),
        );
        cq = cq.lte('due_at', endOfWeek.toISOString()).neq('status', 'done');
        break;
      }
      case 'unassigned':
        cq = cq.is('assignee_id', null).neq('status', 'done');
        break;
      default:
        cq = cq.neq('status', 'done');
    }
    const { count } = await cq;
    v.count = count ?? 0;
  }

  const totalCount = tasks.filter((t) => t.parentTaskId === null).length;

  return { groups: ordered, views, activeView, totalCount };
}
