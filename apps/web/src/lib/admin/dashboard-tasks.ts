// apps/web/src/lib/admin/dashboard-tasks.ts
import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { TaskStatus } from '@/lib/admin/task-types';
import type { DashboardTask } from './dashboard-tasks-client';

export type { DashboardTask, DashboardTaskFilter } from './dashboard-tasks-client';
export { filterDashboardTasks } from './dashboard-tasks-client';

export async function fetchDashboardTasks(): Promise<DashboardTask[]> {
  const supabase = await createClient();

  const cutoff = new Date(Date.now() + 48 * 3600_000).toISOString();

  const { data: tasks } = await supabase
    .from('tasks')
    .select(`
      id, parent_task_id, parent_type, parent_id, title, description, status,
      assignee_id, created_by, due_at, completed_at, created_at,
      assignee:profiles!tasks_assignee_id_fkey(full_name, avatar_url),
      creator:profiles!tasks_created_by_fkey1(full_name)
    `)
    .neq('status', 'done')
    .is('parent_task_id', null)
    .lte('due_at', cutoff)
    .not('due_at', 'is', null)
    .order('due_at', { ascending: true })
    .limit(50);

  if (!tasks?.length) return [];

  const propIds = [...new Set(
    tasks
      .filter((t) => t.parent_type === 'property' && t.parent_id != null)
      .map((t) => t.parent_id as string)
  )];

  const propNames = new Map<string, string>();
  if (propIds.length > 0) {
    const { data: props } = await supabase
      .from('properties')
      .select('id, name, address_line1')
      .in('id', propIds);
    for (const p of props ?? []) {
      propNames.set(p.id, (p.name as string | null)?.trim() || (p.address_line1 as string | null) || '');
    }
  }

  return tasks.map((t): DashboardTask => {
    const assigneeData = t.assignee as { full_name: string | null; avatar_url: string | null } | null;
    const creatorData = t.creator as { full_name: string | null } | null;
    return {
      id: t.id,
      parentTaskId: t.parent_task_id,
      title: t.title,
      description: t.description,
      status: t.status as TaskStatus,
      assigneeId: t.assignee_id,
      assigneeName: assigneeData?.full_name ?? null,
      assigneeAvatarUrl: assigneeData?.avatar_url ?? null,
      createdById: t.created_by,
      createdByName: creatorData?.full_name ?? null,
      dueAt: t.due_at,
      completedAt: t.completed_at,
      createdAt: t.created_at,
      parent: t.parent_type && t.parent_id != null ? {
        type: t.parent_type as 'contact' | 'property' | 'project',
        id: t.parent_id as string,
        label: propNames.get(t.parent_id as string) ?? (t.parent_id as string),
      } : null,
      subtaskCount: 0,
      subtaskDoneCount: 0,
      propertyName: t.parent_type === 'property' && t.parent_id != null
        ? (propNames.get(t.parent_id as string) ?? null)
        : null,
    };
  });
}
