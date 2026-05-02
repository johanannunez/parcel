import { fetchAdminTasksList } from '@/lib/admin/tasks-list';
import { createClient } from '@/lib/supabase/server';
import { TasksListView } from './TasksListView';
import type { Task, TaskLabel } from '@/lib/admin/task-types';

type Props = { searchParams: Promise<{ view?: string; q?: string }> };

export default async function TasksPage({ searchParams }: Props) {
  const { view, q } = await searchParams;
  const { groups, views, activeView, totalCount } = await fetchAdminTasksList({
    viewKey: view,
    search: q ?? null,
  });

  const upcomingTasks = view === 'upcoming' ? groups.flatMap((g) => g.tasks) : [];

  // Fetch subtasks for all parent tasks currently in view (for inline expansion).
  const parentIds = groups.flatMap((g) => g.tasks.map((t) => t.id));
  const subtasksByParent: Record<string, Task[]> = {};

  const supabase = await createClient();

  if (parentIds.length > 0) {
    const { data } = await supabase
      .from('tasks')
      .select('id, parent_task_id, title, status, due_at, created_at')
      .in('parent_task_id', parentIds);
    for (const s of data ?? []) {
      const pid = s.parent_task_id as string;
      if (!subtasksByParent[pid]) subtasksByParent[pid] = [];
      subtasksByParent[pid].push({
        id: s.id,
        parentTaskId: pid,
        title: s.title,
        description: null,
        status: s.status as Task['status'],
        priority: 4 as const,
        assigneeId: null,
        assigneeName: null,
        assigneeAvatarUrl: null,
        createdById: null,
        createdByName: null,
        dueAt: s.due_at,
        completedAt: null,
        createdAt: s.created_at,
        parent: null,
        subtaskCount: 0,
        subtaskDoneCount: 0,
        tags: [],
        labelIds: [],
        linkedPropertyId: null,
        linkedContactId: null,
        linkedProjectId: null,
      });
    }
  }

  // Fetch current user and labels concurrently.
  const [{ data: { user: currentUser } }, labelsResult] = await Promise.all([
    supabase.auth.getUser(),
    (supabase as any).from('task_labels').select('id, name, color, sort_order').order('sort_order'),
  ]);

  const labels: TaskLabel[] = (labelsResult.data ?? []).map((l: { id: string; name: string; color: string; sort_order: number }) => ({
    id: l.id,
    name: l.name,
    color: l.color,
    sortOrder: l.sort_order ?? 0,
  }));

  const currentUserName: string | null =
    (currentUser?.user_metadata?.full_name as string | undefined) ??
    (currentUser?.user_metadata?.name as string | undefined) ??
    (currentUser?.email as string | undefined) ??
    null;

  const currentUserAvatarUrl: string | null =
    (currentUser?.user_metadata?.avatar_url as string | undefined) ?? null;

  return (
    <TasksListView
      groups={groups}
      views={views}
      activeView={activeView}
      totalCount={totalCount}
      subtasksByParent={subtasksByParent}
      upcomingTasks={upcomingTasks}
      labels={labels}
      currentUserId={currentUser?.id ?? null}
      currentUserName={currentUserName}
      currentUserAvatarUrl={currentUserAvatarUrl}
    />
  );
}
