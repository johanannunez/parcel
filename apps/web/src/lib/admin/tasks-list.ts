import { createClient } from '@/lib/supabase/server';
import { bucketForDue, BUCKET_ORDER, type DueBucket } from './due-buckets';
import { getShowTestData } from './test-data';
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
  month?: string;
};

export async function fetchAdminTasksList(
  opts: Options = {},
): Promise<TasksFetchResult> {
  const supabase = await createClient();
  const showTestData = await getShowTestData();

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
    views.find((v) => v.key === (opts.viewKey ?? 'today')) ??
    views.find((v) => v.key === 'today') ??
    views[0];
  if (!activeView) throw new Error('No task saved views');

  // Cast through `any` so that columns not yet in generated Supabase types
  // (e.g. priority, caldav_uid) do not produce a SelectQueryError that
  // poisons all property accesses on the result rows.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('tasks')
    .select(`
      id, parent_task_id, parent_type, parent_id, title, description, status, priority,
      assignee_id, created_by, due_at, completed_at, created_at, tags,
      label_ids, linked_property_id, linked_contact_id, linked_project_id,
      assignee:profiles!tasks_assignee_id_fkey(full_name, avatar_url),
      creator:profiles!tasks_created_by_fkey1(full_name)
    `)
    switch (activeView.key) {
    case 'inbox':
      query = query
        .is('due_at', null)
        .is('parent_task_id', null)
        .neq('status', 'done');
      break;
    case 'today': {
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      query = query
        .lte('due_at', endOfToday.toISOString())
        .neq('status', 'done');
      break;
    }
    case 'upcoming': {
      // Start from tomorrow so upcoming and today views don't overlap
      const startOfTomorrow = new Date();
      startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
      startOfTomorrow.setHours(0, 0, 0, 0);
      const in14 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      query = query
        .not('due_at', 'is', null)
        .gte('due_at', startOfTomorrow.toISOString())
        .lte('due_at', in14)
        .neq('status', 'done');
      break;
    }
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
    case 'calendar': {
      const month = opts.month ?? new Date().toISOString().slice(0, 7);
      const start = new Date(`${month}-01T00:00:00.000Z`).toISOString();
      const end = new Date(new Date(`${month}-01`).setMonth(new Date(`${month}-01`).getMonth() + 1)).toISOString();
      query = query.gte('due_at', start).lt('due_at', end);
      break;
    }
    default:
      query = query.neq('status', 'done');
  }

  // Apply ordering after switch so today view can use priority-first sort
  if (activeView.key === 'today') {
    query = (query as any)
      .order('priority', { ascending: true })
      .order('due_at', { ascending: true, nullsFirst: false });
  } else {
    query = query
      .order('due_at', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });
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

  if (!showTestData) {
    query = query.not('id', 'like', '0000%');
  }

  type RawTaskRow = {
    id: string;
    parent_task_id: string | null;
    parent_type: string | null;
    parent_id: string | null;
    title: string;
    description: string | null;
    status: string;
    priority: number | null;
    assignee_id: string | null;
    created_by: string | null;
    due_at: string | null;
    completed_at: string | null;
    created_at: string;
    tags: string[] | null;
    assignee: { full_name?: string; avatar_url?: string } | { full_name?: string; avatar_url?: string }[] | null;
    creator: { full_name?: string } | { full_name?: string }[] | null;
  };
  const { data: dataRaw, error } = await query;
  const data = dataRaw as RawTaskRow[] | null;
  if (error) {
    console.error('[tasks-list] tasks fetch error:', error.code, error.message);
    return { groups: [], views, activeView, totalCount: 0 };
  }

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

  // Collect subtask parent IDs in parallel with the parent-label queries
  const parentTaskIds = (data ?? [])
    .filter((t) => t.parent_task_id === null)
    .map((t) => t.id);

  const [contactRows, propertyRows, projectRows, subsData] = await Promise.all([
    byType.contact.length > 0
      ? supabase
          .from('contacts')
          .select('id, full_name, company_name, profile_id')
          .in('id', Array.from(new Set(byType.contact)))
          .then((r) => r.data ?? [])
      : Promise.resolve([]),
    byType.property.length > 0
      ? supabase
          .from('properties')
          .select('id, name, address_line1')
          .in('id', Array.from(new Set(byType.property)))
          .then((r) => r.data ?? [])
      : Promise.resolve([]),
    byType.project.length > 0
      // Cast to `any` so TypeScript does not reject the table name.
      // The projects table ships in Plan C; until then this no-ops at runtime.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase as any)
          .from('projects')
          .select('id, name')
          .in('id', Array.from(new Set(byType.project)))
          .then((r: { data?: { id: string; name?: string }[] }) => r.data ?? [])
          .catch(() => [])
      : Promise.resolve([]),
    parentTaskIds.length > 0
      ? supabase
          .from('tasks')
          .select('parent_task_id, status')
          .in('parent_task_id', parentTaskIds)
          .then((r) => r.data ?? [])
      : Promise.resolve([]),
  ]);

  for (const r of contactRows as { id: string; full_name?: string | null; company_name?: string | null; profile_id?: string | null }[]) {
    parentMap[`contact:${r.id}`] = {
      label: r.full_name || r.company_name || 'Contact',
      contactProfileId: r.profile_id,
    };
  }
  for (const r of propertyRows as { id: string; name?: string | null; address_line1?: string | null }[]) {
    const label = r.name ?? r.address_line1 ?? 'Property';
    parentMap[`property:${r.id}`] = { label };
  }
  for (const r of projectRows as { id: string; name?: string }[]) {
    parentMap[`project:${r.id}`] = { label: r.name ?? 'Project' };
  }

  // Subtask counts for parent tasks in this view
  const subtaskCounts: Record<string, { total: number; done: number }> = {};
  for (const s of subsData as { parent_task_id: string | null; status: string }[]) {
    const key = s.parent_task_id as string;
    if (!subtaskCounts[key]) subtaskCounts[key] = { total: 0, done: 0 };
    subtaskCounts[key].total += 1;
    if (s.status === 'done') subtaskCounts[key].done += 1;
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
      priority: ((t as any).priority ?? 4) as 1 | 2 | 3 | 4,
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
      tags: t.tags ?? [],
      labelIds: (t as any).label_ids ?? [],
      linkedPropertyId: (t as any).linked_property_id ?? null,
      linkedContactId: (t as any).linked_contact_id ?? null,
      linkedProjectId: (t as any).linked_project_id ?? null,
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

  // Per-view counts (mirror the active-view filters per key) — run all concurrently
  const viewCounts = await Promise.all(
    views.map((v) => {
      let cq = supabase.from('tasks').select('*', { count: 'exact', head: true });
      switch (v.key) {
        case 'inbox':
          cq = (cq as any).is('due_at', null).is('parent_task_id', null).neq('status', 'done');
          break;
        case 'today': {
          const eot = new Date();
          eot.setHours(23, 59, 59, 999);
          cq = cq.lte('due_at', eot.toISOString()).neq('status', 'done');
          break;
        }
        case 'upcoming': {
          const startOfTomorrow2 = new Date();
          startOfTomorrow2.setDate(startOfTomorrow2.getDate() + 1);
          startOfTomorrow2.setHours(0, 0, 0, 0);
          const in14c = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
          cq = (cq as any).not('due_at', 'is', null).gte('due_at', startOfTomorrow2.toISOString()).lte('due_at', in14c).neq('status', 'done');
          break;
        }
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
      if (!showTestData) {
        cq = cq.not('id', 'like', '0000%');
      }
      return cq.then(({ count }) => count ?? 0);
    }),
  );
  for (let i = 0; i < views.length; i++) {
    views[i].count = viewCounts[i];
  }

  const totalCount = tasks.filter((t) => t.parentTaskId === null).length;

  return { groups: ordered, views, activeView, totalCount };
}
