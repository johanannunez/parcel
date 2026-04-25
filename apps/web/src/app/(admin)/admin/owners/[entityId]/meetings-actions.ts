/* eslint-disable @typescript-eslint/no-explicit-any */
// owner_timeline and related tables are not yet in the generated Supabase
// types. Remove this disable once types are regenerated.
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
  assignedTo: string | null;
}

export interface CreateMeetingData {
  title: string;
  scheduledAt: string | null;
  durationMinutes: number | null;
  meetLink: string | null;
  propertyId: string | null;
  notes: string | null;
  visibility: "shared" | "private";
  meetingType?: "phone_call" | "video_call" | "in_person";
  attendeeIds?: string[] | null;
}

export interface UpdateMeetingData {
  title?: string;
  scheduledAt?: string | null;
  durationMinutes?: number | null;
  meetLink?: string | null;
  propertyId?: string | null;
  status?: "scheduled" | "completed" | "cancelled";
  transcript?: string | null;
  aiSummary?: string | null;
  actionItems?: ActionItem[];
  notes?: string | null;
  visibility?: "shared" | "private";
}

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

// ---------------------------------------------------------------------------
// MEETINGS
// ---------------------------------------------------------------------------

export async function createOwnerMeeting(
  ownerId: string,
  data: CreateMeetingData,
): Promise<{ ok: boolean; message: string; id?: string; meetLink?: string; calendarEventId?: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };

  const { data: { user } } = await supabase.auth.getUser();
  const meetingType = data.meetingType ?? "video_call";

  let meetLink = data.meetLink ?? null;
  let calendarEventId: string | null = null;

  if (user && data.scheduledAt && data.durationMinutes) {
    try {
      const { getValidAccessToken, createCalendarEvent } = await import("@/lib/admin/google-calendar");
      const accessToken = await getValidAccessToken(user.id);
      if (accessToken) {
        const endDate = new Date(data.scheduledAt);
        endDate.setMinutes(endDate.getMinutes() + data.durationMinutes);
        const created = await createCalendarEvent(accessToken, {
          title: data.title,
          startIso: data.scheduledAt,
          endIso: endDate.toISOString(),
          description: data.notes ?? "",
          attendeeEmails: [],
          addConferencing: meetingType === "video_call",
        });
        calendarEventId = created.eventId;
        if (created.meetLink) meetLink = created.meetLink;
      }
    } catch {
      // Calendar sync optional — don't block meeting creation on failure
    }
  }

  const { data: inserted, error } = await (supabase as any)
    .from("owner_meetings")
    .insert({
      owner_id: ownerId,
      property_id: data.propertyId ?? null,
      title: data.title,
      scheduled_at: data.scheduledAt ?? null,
      duration_minutes: data.durationMinutes ?? null,
      meet_link: meetLink,
      status: "scheduled",
      transcript: null,
      ai_summary: null,
      action_items: [],
      notes: data.notes ?? null,
      visibility: data.visibility,
      meeting_type: meetingType,
      attendee_ids: data.attendeeIds ?? null,
      calendar_event_id: calendarEventId,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/admin/owners/${ownerId}`);
  return { ok: true, message: "Meeting created.", id: inserted?.id, meetLink: meetLink ?? undefined, calendarEventId: calendarEventId ?? undefined };
}

export async function updateOwnerMeeting(
  meetingId: string,
  ownerId: string,
  data: UpdateMeetingData,
): Promise<{ ok: boolean; message: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.title !== undefined) patch.title = data.title;
  if (data.scheduledAt !== undefined) patch.scheduled_at = data.scheduledAt;
  if (data.durationMinutes !== undefined)
    patch.duration_minutes = data.durationMinutes;
  if (data.meetLink !== undefined) patch.meet_link = data.meetLink;
  if (data.propertyId !== undefined) patch.property_id = data.propertyId;
  if (data.status !== undefined) patch.status = data.status;
  if (data.transcript !== undefined) patch.transcript = data.transcript;
  if (data.aiSummary !== undefined) patch.ai_summary = data.aiSummary;
  if (data.actionItems !== undefined) patch.action_items = data.actionItems;
  if (data.notes !== undefined) patch.notes = data.notes;
  if (data.visibility !== undefined) patch.visibility = data.visibility;

  const { error } = await (supabase as any)
    .from("owner_meetings")
    .update(patch)
    .eq("id", meetingId)
    .eq("owner_id", ownerId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/admin/owners/${ownerId}`);
  revalidatePath("/portal/meetings");
  return { ok: true, message: "Meeting updated." };
}

export async function deleteOwnerMeeting(
  meetingId: string,
  ownerId: string,
): Promise<{ ok: boolean; message: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };

  const { error } = await (supabase as any)
    .from("owner_meetings")
    .delete()
    .eq("id", meetingId)
    .eq("owner_id", ownerId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/admin/owners/${ownerId}`);
  return { ok: true, message: "Meeting deleted." };
}

// ---------------------------------------------------------------------------
// AI SUMMARY
// ---------------------------------------------------------------------------

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

interface AnthropicResponse {
  content: Array<{ type: string; text: string }>;
}

interface SummaryPayload {
  summary: string;
  keyPoints: string[];
  actionItems: ActionItem[];
}

export async function generateMeetingSummary(
  meetingId: string,
  ownerId: string,
): Promise<{
  ok: boolean;
  message: string;
  summary?: string;
  actionItems?: ActionItem[];
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ok: false, message: "AI summary requires ANTHROPIC_API_KEY." };
  }

  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };

  const { data: meeting, error: fetchError } = await (supabase as any)
    .from("owner_meetings")
    .select("transcript")
    .eq("id", meetingId)
    .eq("owner_id", ownerId)
    .single();

  if (fetchError || !meeting) {
    return { ok: false, message: "Meeting not found." };
  }

  const transcript: string | null = meeting.transcript;
  if (!transcript || transcript.trim().length === 0) {
    return {
      ok: false,
      message: "No transcript available. Add a transcript first.",
    };
  }

  const systemPrompt =
    "You are an expert meeting summarizer for a property management company called Parcel. " +
    "Given a meeting transcript, produce: " +
    "1) A concise 2-3 sentence summary, " +
    "2) A bullet list of key decisions or updates, " +
    "3) A list of action items as structured JSON. " +
    "Return your response as JSON with keys: " +
    "summary (string), " +
    "keyPoints (string[]), " +
    "actionItems (array of {id: string (uuid), text: string, completed: false, assignedTo: null}).";

  const messages: AnthropicMessage[] = [
    { role: "user", content: transcript },
  ];

  let payload: SummaryPayload;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        ok: false,
        message: `AI API error (${response.status}): ${errorText}`,
      };
    }

    const result = (await response.json()) as AnthropicResponse;
    const rawText = result.content?.[0]?.text ?? "";

    // Strip markdown code fences if present
    const jsonText = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    payload = JSON.parse(jsonText) as SummaryPayload;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error calling AI.";
    return { ok: false, message: `Failed to generate summary: ${message}` };
  }

  const { error: updateError } = await (supabase as any)
    .from("owner_meetings")
    .update({
      ai_summary: payload.summary,
      action_items: payload.actionItems,
      updated_at: new Date().toISOString(),
    })
    .eq("id", meetingId)
    .eq("owner_id", ownerId);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  revalidatePath(`/admin/owners/${ownerId}`);
  revalidatePath("/portal/meetings");
  return {
    ok: true,
    message: "AI summary generated.",
    summary: payload.summary,
    actionItems: payload.actionItems,
  };
}

// ---------------------------------------------------------------------------
// ACTION ITEMS
// ---------------------------------------------------------------------------

export async function toggleActionItem(
  meetingId: string,
  ownerId: string,
  actionItemId: string,
  completed: boolean,
): Promise<{ ok: boolean; message: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };

  const { data: meeting, error: fetchError } = await (supabase as any)
    .from("owner_meetings")
    .select("action_items")
    .eq("id", meetingId)
    .eq("owner_id", ownerId)
    .single();

  if (fetchError || !meeting) {
    return { ok: false, message: "Meeting not found." };
  }

  const items: ActionItem[] = Array.isArray(meeting.action_items)
    ? (meeting.action_items as ActionItem[])
    : [];

  const index = items.findIndex((item) => item.id === actionItemId);
  if (index === -1) {
    return { ok: false, message: "Action item not found." };
  }

  const updated: ActionItem[] = items.map((item) =>
    item.id === actionItemId ? { ...item, completed } : item,
  );

  const { error } = await (supabase as any)
    .from("owner_meetings")
    .update({
      action_items: updated,
      updated_at: new Date().toISOString(),
    })
    .eq("id", meetingId)
    .eq("owner_id", ownerId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/admin/owners/${ownerId}`);
  return {
    ok: true,
    message: `Action item marked as ${completed ? "complete" : "incomplete"}.`,
  };
}

// ---------------------------------------------------------------------------
// PUSH TASKS
// ---------------------------------------------------------------------------

export async function pushMeetingTasksToContact(
  meetingId: string,
  ownerId: string,
  contactId: string,
): Promise<{ ok: boolean; message: string; pushed: number }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError, pushed: 0 };

  const { data: meeting, error: fetchError } = await (supabase as any)
    .from("owner_meetings")
    .select("action_items")
    .eq("id", meetingId)
    .eq("owner_id", ownerId)
    .single();

  if (fetchError || !meeting) {
    return { ok: false, message: "Meeting not found.", pushed: 0 };
  }

  const items: ActionItem[] = Array.isArray(meeting.action_items)
    ? (meeting.action_items as ActionItem[])
    : [];

  const unpushed = items.filter((item) => !item.completed && !(item as any).pushed);

  if (unpushed.length === 0) {
    return { ok: true, message: "No items to push.", pushed: 0 };
  }

  const { createTask } = await import("@/lib/admin/task-actions");

  for (const item of unpushed) {
    try {
      await createTask({
        title: item.text,
        parentType: "contact",
        parentId: contactId,
        taskType: "todo",
        tags: ["meeting-followup"],
      });
    } catch {
      // Continue pushing remaining items if one fails
    }
  }

  const updatedItems = items.map((item) =>
    !item.completed && !(item as any).pushed
      ? { ...item, pushed: true }
      : item,
  );

  await (supabase as any)
    .from("owner_meetings")
    .update({ action_items: updatedItems, updated_at: new Date().toISOString() })
    .eq("id", meetingId)
    .eq("owner_id", ownerId);

  revalidatePath(`/admin/owners/${ownerId}`);
  return { ok: true, message: `${unpushed.length} task${unpushed.length > 1 ? "s" : ""} added to contact.`, pushed: unpushed.length };
}
