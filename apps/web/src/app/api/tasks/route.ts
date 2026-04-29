import { NextRequest, NextResponse } from 'next/server';
import { fetchAdminTasksList } from '@/lib/admin/tasks-list';
import { createClient } from '@/lib/supabase/server';
import type { Task } from '@/lib/admin/task-types';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const view = searchParams.get('view') ?? undefined;
  const q = searchParams.get('q') ?? null;

  try {
    const { groups, views, activeView, totalCount } = await fetchAdminTasksList({
      viewKey: view,
      search: q,
    });

    const upcomingTasks = activeView.key === 'upcoming'
      ? groups.flatMap((g) => g.tasks)
      : [];

    // Fetch subtasks for all parent tasks in this view
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

    return NextResponse.json({ groups, views, activeView, totalCount, subtasksByParent, upcomingTasks });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    if (msg === 'not authenticated' || msg === 'forbidden: admins only') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
