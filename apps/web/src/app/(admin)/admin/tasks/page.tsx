import { fetchAdminTasksList } from '@/lib/admin/tasks-list';
import { createClient } from '@/lib/supabase/server';
import { TasksListView } from './TasksListView';
import type { Task } from '@/lib/admin/task-types';

type Props = { searchParams: Promise<{ view?: string; q?: string }> };

export default async function TasksPage({ searchParams }: Props) {
  const { view, q } = await searchParams;
  const { groups, views, activeView, totalCount } = await fetchAdminTasksList({
    viewKey: view,
    search: q ?? null,
  });

  // Fetch subtasks for all parent tasks currently in view (for inline expansion).
  const parentIds = groups.flatMap((g) => g.tasks.map((t) => t.id));
  const subtasksByParent: Record<string, Task[]> = {};
  if (parentIds.length > 0) {
    const supabase = await createClient();
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
      });
    }
  }

  return (
    <TasksListView
      groups={groups}
      views={views}
      activeView={activeView}
      totalCount={totalCount}
      subtasksByParent={subtasksByParent}
    />
  );
}
