"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logTimelineEvent } from "@/lib/timeline";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase: null as never, error: "You must be signed in." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { supabase: null as never, error: "Admin access required." };
  }

  return { supabase, error: null };
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "...";
}

// ---------------------------------------------------------------------------
// Timeline (shared insert used by tasks/notes and the public action)
// ---------------------------------------------------------------------------

async function insertTimelineEntry(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ownerId: string,
  data: {
    eventType: string;
    title: string;
    body?: string;
    propertyId?: string;
  },
) {
  const { error } = await (supabase as any).from("owner_timeline").insert({
    owner_id: ownerId,
    event_type: data.eventType,
    title: data.title,
    body: data.body ?? null,
    property_id: data.propertyId ?? null,
  });

  return error;
}

// ---------------------------------------------------------------------------
// TASKS
// ---------------------------------------------------------------------------

export async function createOwnerTask(
  ownerId: string,
  data: {
    title: string;
    description?: string;
    propertyId?: string;
    priority?: string;
    dueDate?: string;
  },
): Promise<{ ok: boolean; message: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };

  const { error } = await (supabase as any).from("owner_tasks").insert({
    owner_id: ownerId,
    title: data.title,
    description: data.description ?? null,
    property_id: data.propertyId ?? null,
    priority: data.priority ?? "medium",
    due_date: data.dueDate ?? null,
    status: "pending",
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  void logTimelineEvent({
    ownerId,
    eventType: "task_created",
    category: "account",
    title: `Task created: ${truncate(data.title, 50)}`,
    visibility: "owner",
  });

  revalidatePath(`/admin/owners/${ownerId}`);
  return { ok: true, message: "Task created." };
}

export async function toggleTaskStatus(
  taskId: string,
  ownerId: string,
): Promise<{ ok: boolean; message: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };

  const { data: task, error: fetchError } = await (supabase as any)
    .from("owner_tasks")
    .select("status, title")
    .eq("id", taskId)
    .eq("owner_id", ownerId)
    .single();

  if (fetchError || !task) {
    return { ok: false, message: "Task not found." };
  }

  const newStatus = task.status === "done" ? "pending" : "done";

  const { error } = await (supabase as any)
    .from("owner_tasks")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("owner_id", ownerId);

  if (error) {
    return { ok: false, message: error.message };
  }

  void logTimelineEvent({
    ownerId,
    eventType: "task_status_changed",
    category: "account",
    title: `Task ${newStatus === "done" ? "completed" : "reopened"}: ${truncate(task.title, 50)}`,
    visibility: "owner",
  });

  revalidatePath(`/admin/owners/${ownerId}`);
  return { ok: true, message: `Task marked as ${newStatus}.` };
}

export async function deleteTask(
  taskId: string,
  ownerId: string,
): Promise<{ ok: boolean; message: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };

  const { data: task } = await (supabase as any)
    .from("owner_tasks")
    .select("title")
    .eq("id", taskId)
    .eq("owner_id", ownerId)
    .single();

  const { error } = await (supabase as any)
    .from("owner_tasks")
    .delete()
    .eq("id", taskId)
    .eq("owner_id", ownerId);

  if (error) {
    return { ok: false, message: error.message };
  }

  void logTimelineEvent({
    ownerId,
    eventType: "task_deleted",
    category: "account",
    title: `Task deleted: ${truncate(task?.title ?? "Unknown", 50)}`,
    visibility: "admin_only",
  });

  revalidatePath(`/admin/owners/${ownerId}`);
  return { ok: true, message: "Task deleted." };
}

// ---------------------------------------------------------------------------
// NOTES
// ---------------------------------------------------------------------------

export async function createOwnerNote(
  ownerId: string,
  data: {
    body: string;
    visibility?: "private" | "visible";
    propertyId?: string;
  },
): Promise<{ ok: boolean; message: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };

  const { error } = await (supabase as any).from("owner_notes").insert({
    owner_id: ownerId,
    body: data.body,
    visibility: data.visibility ?? "private",
    property_id: data.propertyId ?? null,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  void logTimelineEvent({
    ownerId,
    eventType: "note_added",
    category: "account",
    title: `Note added: ${truncate(data.body, 50)}`,
    visibility: "admin_only",
  });

  revalidatePath(`/admin/owners/${ownerId}`);
  return { ok: true, message: "Note saved." };
}

export async function toggleNoteVisibility(
  noteId: string,
  ownerId: string,
): Promise<{ ok: boolean; message: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };

  const { data: note, error: fetchError } = await (supabase as any)
    .from("owner_notes")
    .select("visibility")
    .eq("id", noteId)
    .eq("owner_id", ownerId)
    .single();

  if (fetchError || !note) {
    return { ok: false, message: "Note not found." };
  }

  const newVisibility = note.visibility === "private" ? "visible" : "private";

  const { error } = await (supabase as any)
    .from("owner_notes")
    .update({
      visibility: newVisibility,
      updated_at: new Date().toISOString(),
    })
    .eq("id", noteId)
    .eq("owner_id", ownerId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/admin/owners/${ownerId}`);
  return {
    ok: true,
    message: `Note is now ${newVisibility === "visible" ? "visible to owner" : "private"}.`,
  };
}

export async function deleteNote(
  noteId: string,
  ownerId: string,
): Promise<{ ok: boolean; message: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };

  const { error } = await (supabase as any)
    .from("owner_notes")
    .delete()
    .eq("id", noteId)
    .eq("owner_id", ownerId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/admin/owners/${ownerId}`);
  return { ok: true, message: "Note deleted." };
}

// ---------------------------------------------------------------------------
// TIMELINE
// ---------------------------------------------------------------------------

export async function addTimelineEntry(
  ownerId: string,
  data: {
    eventType: string;
    title: string;
    body?: string;
    propertyId?: string;
  },
): Promise<{ ok: boolean; message: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };

  const result = await logTimelineEvent({
    ownerId,
    eventType: data.eventType,
    category: "account",
    title: data.title,
    body: data.body,
    propertyId: data.propertyId,
    visibility: "owner",
  });

  if (!result.ok) {
    return { ok: false, message: result.error ?? "Failed to create entry." };
  }

  revalidatePath(`/admin/owners/${ownerId}`);
  return { ok: true, message: "Timeline entry added." };
}
