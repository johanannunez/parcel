// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck — tasks table not yet in generated Supabase types
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ParentType, TaskStatus, TaskType } from './task-types';

export type CreateTaskInput = {
  title: string;
  description?: string;
  parentType?: ParentType | null;
  parentId?: string | null;
  parentTaskId?: string | null;
  assigneeId?: string | null;
  dueAt?: string | null;
  taskType?: TaskType | null;
  tags?: string[];
  estimatedMinutes?: number | null;
};

export async function createTask(input: CreateTaskInput): Promise<{ id: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('not authenticated');

  const row = {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    parent_type: input.parentType ?? null,
    parent_id: input.parentId ?? null,
    parent_task_id: input.parentTaskId ?? null,
    assignee_id: input.assigneeId ?? null,
    created_by: user.id,
    due_at: input.dueAt ?? null,
    task_type: input.taskType ?? null,
    tags: input.tags && input.tags.length > 0 ? input.tags : null,
    estimated_minutes: input.estimatedMinutes ?? null,
  };

  const { data, error } = await supabase
    .from('tasks')
    .insert(row)
    .select('id')
    .single();
  if (error) throw error;

  revalidatePath('/admin/tasks');
  if (input.parentType && input.parentId) {
    if (input.parentType === 'contact') revalidatePath('/admin/contacts');
    if (input.parentType === 'property') revalidatePath('/admin/properties');
    if (input.parentType === 'project') revalidatePath('/admin/projects');
  }
  return { id: data.id };
}

export async function updateTask(
  id: string,
  patch: Partial<{
    title: string;
    description: string | null;
    status: TaskStatus;
    assigneeId: string | null;
    dueAt: string | null;
    taskType: TaskType | null;
    tags: string[];
    estimatedMinutes: number | null;
  }>,
): Promise<void> {
  const supabase = await createClient();
  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.description !== undefined) update.description = patch.description;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.assigneeId !== undefined) update.assignee_id = patch.assigneeId;
  if (patch.dueAt !== undefined) update.due_at = patch.dueAt;
  if (patch.taskType !== undefined) update.task_type = patch.taskType;
  if (patch.tags !== undefined) update.tags = patch.tags && patch.tags.length > 0 ? patch.tags : null;
  if (patch.estimatedMinutes !== undefined) update.estimated_minutes = patch.estimatedMinutes;

  const { error } = await supabase.from('tasks').update(update).eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/tasks');
}

export async function completeTask(id: string): Promise<void> {
  await updateTask(id, { status: 'done' });
}

export async function uncompleteTask(id: string): Promise<void> {
  await updateTask(id, { status: 'todo' });
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/tasks');
}
