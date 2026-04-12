// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck — tasks tables not yet in generated Supabase types
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { user: null, supabase };
  return { user, supabase };
}

export async function createTask(data: {
  title: string;
  description?: string;
  task_type: string;
  status: string;
  priority: string;
  due_date?: string;
  owner_id?: string;
  property_id?: string;
  assignee_ids?: string[];
}): Promise<{ error?: string }> {
  const { user, supabase } = await getAdminUser();
  if (!user) return { error: "Not authenticated" };

  const { assignee_ids, ...taskFields } = data;

  const { data: task, error: insertError } = await supabase
    .from("tasks")
    .insert({
      ...taskFields,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertError || !task) {
    return { error: insertError?.message ?? "Failed to create task" };
  }

  if (assignee_ids && assignee_ids.length > 0) {
    const assigneeRows = assignee_ids.map((profile_id) => ({
      task_id: task.id,
      profile_id,
    }));
    const { error: assigneeError } = await supabase
      .from("task_assignees")
      .insert(assigneeRows);
    if (assigneeError) {
      return { error: assigneeError.message };
    }
  }

  revalidatePath("/admin/tasks");
  return {};
}

export async function updateTask(
  taskId: string,
  updates: Partial<{
    title: string;
    description: string | null;
    task_type: string;
    status: string;
    priority: string;
    due_date: string | null;
    owner_id: string | null;
    property_id: string | null;
    completed_at: string | null;
  }>,
): Promise<{ error?: string }> {
  const { user, supabase } = await getAdminUser();
  if (!user) return { error: "Not authenticated" };

  const payload: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() };

  // Auto-set completed_at when status flips to done
  if (updates.status === "done" && !("completed_at" in updates)) {
    payload.completed_at = new Date().toISOString();
  } else if (updates.status && updates.status !== "done" && !("completed_at" in updates)) {
    payload.completed_at = null;
  }

  const { error } = await supabase
    .from("tasks")
    .update(payload)
    .eq("id", taskId);

  if (error) return { error: error.message };

  revalidatePath("/admin/tasks");
  return {};
}

export async function deleteTask(taskId: string): Promise<{ error?: string }> {
  const { user, supabase } = await getAdminUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) return { error: error.message };

  revalidatePath("/admin/tasks");
  return {};
}

export async function toggleSubtask(
  subtaskId: string,
  completed: boolean,
): Promise<{ error?: string }> {
  const { user, supabase } = await getAdminUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("task_subtasks")
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", subtaskId);

  if (error) return { error: error.message };

  revalidatePath("/admin/tasks");
  return {};
}

export async function addSubtask(
  taskId: string,
  title: string,
): Promise<{ error?: string }> {
  const { user, supabase } = await getAdminUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("task_subtasks")
    .select("sort_order")
    .eq("task_id", taskId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? (existing[0].sort_order ?? 0) + 1 : 0;

  const { error } = await supabase.from("task_subtasks").insert({
    task_id: taskId,
    title: title.trim(),
    completed: false,
    sort_order: nextOrder,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/tasks");
  return {};
}

export async function addComment(
  taskId: string,
  content: string,
): Promise<{ error?: string }> {
  const { user, supabase } = await getAdminUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("task_comments").insert({
    task_id: taskId,
    author_id: user.id,
    content: content.trim(),
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/tasks");
  return {};
}

export async function createFromTemplate(
  templateId: string,
  ownerId?: string,
  propertyId?: string,
): Promise<{ taskId?: string; error?: string }> {
  const { user, supabase } = await getAdminUser();
  if (!user) return { error: "Not authenticated" };

  const { data: template, error: tplError } = await supabase
    .from("task_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (tplError || !template) {
    return { error: tplError?.message ?? "Template not found" };
  }

  const dueDate = (template as { due_offset_days?: number | null }).due_offset_days
    ? (() => {
        const d = new Date();
        d.setDate(d.getDate() + ((template as { due_offset_days: number }).due_offset_days));
        return d.toISOString().slice(0, 10);
      })()
    : null;

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .insert({
      title: (template as { name: string }).name,
      description: (template as { description?: string | null }).description ?? null,
      task_type: (template as { task_type: string }).task_type,
      status: "todo",
      priority: (template as { default_priority?: string }).default_priority ?? "medium",
      due_date: dueDate,
      owner_id: ownerId ?? null,
      property_id: propertyId ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (taskError || !task) {
    return { error: taskError?.message ?? "Failed to create task" };
  }

  const subtasks = (template as { subtasks?: { title: string }[] }).subtasks;
  if (subtasks && subtasks.length > 0) {
    const subtaskRows = subtasks.map((s, i) => ({
      task_id: task.id,
      title: s.title,
      completed: false,
      sort_order: i,
    }));
    await supabase.from("task_subtasks").insert(subtaskRows);
  }

  revalidatePath("/admin/tasks");
  return { taskId: task.id };
}

export async function updateTaskAssignees(
  taskId: string,
  profileIds: string[],
): Promise<{ error?: string }> {
  const { user, supabase } = await getAdminUser();
  if (!user) return { error: "Not authenticated" };

  const { error: deleteError } = await supabase
    .from("task_assignees")
    .delete()
    .eq("task_id", taskId);
  if (deleteError) return { error: deleteError.message };

  if (profileIds.length > 0) {
    const rows = profileIds.map((profile_id) => ({ task_id: taskId, profile_id }));
    const { error: insertError } = await supabase.from("task_assignees").insert(rows);
    if (insertError) return { error: insertError.message };
  }

  revalidatePath("/admin/tasks");
  return {};
}
