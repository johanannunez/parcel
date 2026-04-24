/* eslint-disable @typescript-eslint/no-explicit-any */
// owner_meetings is not in the generated Supabase types — cast through any.
import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ClientMeeting = {
  id: string;
  title: string;
  scheduled_at: string | null;
  duration_minutes: number | null;
  meet_link: string | null;
  status: string;
  transcript: string | null;
  ai_summary: string | null;
  action_items: Array<{ id: string; text: string; completed: boolean; assignedTo: string | null }>;
  notes: string | null;
  visibility: string;
  property_id: string | null;
  propertyLabel: string | null;
  created_at: string;
};

export async function fetchClientMeetings(profileId: string): Promise<ClientMeeting[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("owner_meetings")
    .select(`
      id, title, scheduled_at, duration_minutes, meet_link,
      status, transcript, ai_summary, action_items, notes, visibility,
      property_id, created_at,
      property:properties(address_line1, city, state)
    `)
    .eq("owner_id", profileId)
    .order("scheduled_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("[client-meetings] fetch error:", error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, any>) => {
    const prop = row.property as {
      address_line1: string | null;
      city: string | null;
      state: string | null;
    } | null;
    const propertyLabel = prop
      ? [prop.address_line1, prop.city, prop.state].filter(Boolean).join(", ")
      : null;
    const rawItems = Array.isArray(row.action_items) ? row.action_items : [];
    return {
      id: row.id as string,
      title: row.title as string,
      scheduled_at: (row.scheduled_at as string | null) ?? null,
      duration_minutes: (row.duration_minutes as number | null) ?? null,
      meet_link: (row.meet_link as string | null) ?? null,
      status: (row.status as string) ?? "scheduled",
      transcript: (row.transcript as string | null) ?? null,
      ai_summary: (row.ai_summary as string | null) ?? null,
      action_items: rawItems.map((item: Record<string, unknown>) => ({
        id: String(item.id ?? ""),
        text: String(item.text ?? ""),
        completed: Boolean(item.completed),
        assignedTo: item.assignedTo != null ? String(item.assignedTo) : null,
      })),
      notes: (row.notes as string | null) ?? null,
      visibility: (row.visibility as string) ?? "private",
      property_id: (row.property_id as string | null) ?? null,
      propertyLabel: propertyLabel || null,
      created_at: row.created_at as string,
    };
  });
}
