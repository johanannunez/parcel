import { fetchAdminTasksList } from '@/lib/admin/tasks-list';
import { TaskRow } from '@/app/(admin)/admin/tasks/TaskRow';
import { TaskCreationInlineForm } from './TaskCreationInlineForm';
import type { ParentType, Task } from '@/lib/admin/task-types';
import { createClient } from '@/lib/supabase/server';
import styles from './TasksTab.module.css';

export async function TasksTab({
  parentType,
  parentId,
}: {
  parentType: ParentType;
  parentId: string;
}) {
  const { groups } = await fetchAdminTasksList({
    parentFilter: { type: parentType, id: parentId },
  });

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
      });
    }
  }

  return (
    <div className={styles.tab}>
      <TaskCreationInlineForm parentType={parentType} parentId={parentId} />
      {groups.length === 0 ? (
        <div className={styles.empty}>No tasks yet. Add one above.</div>
      ) : (
        <div className={styles.list}>
          {groups.map((g) => (
            <section key={g.bucket}>
              <header className={styles.head}>{g.bucket.replace('_', ' ')}</header>
              {g.tasks.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  subtasks={subtasksByParent[t.id] ?? []}
                />
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
