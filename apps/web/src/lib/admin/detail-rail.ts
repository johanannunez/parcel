import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Normalised event shape for the persistent right-rail timeline.
 * Mapped from the existing `owner_timeline` table (which uses owner_id /
 * property_id instead of a generic parent_id column).
 */
export type RailEvent = {
  id: string;
  at: string;
  actorName: string | null;
  summary: string;
  kind: string;
};

/**
 * Fetch the most recent timeline events for a given parent.
 *
 * `parentType` controls which foreign-key column is used:
 *   'contact'  — owner_timeline.owner_id matched against profileId
 *   'property' — owner_timeline.property_id
 *
 * For contacts we look up the profiles.id from the contacts row so the
 * caller can pass the contact UUID directly; internally we resolve to the
 * linked profile UUID.
 */
export async function fetchRecentActivity(
  parentType: "contact" | "property" | "project",
  parentId: string,
  limit = 8,
): Promise<RailEvent[]> {
  const supabase = await createClient();

  // Resolve the owner_id to use for the query. For contacts, parentId is the
  // contacts.id — we need the linked profile_id for owner_timeline.
  let ownerProfileId: string | null = null;
  let resolvedPropertyId: string | null = null;

  if (parentType === "contact") {
    const { data: contact } = await supabase
      .from("contacts")
      .select("profile_id")
      .eq("id", parentId)
      .maybeSingle();
    ownerProfileId = contact?.profile_id ?? null;
  } else if (parentType === "property") {
    resolvedPropertyId = parentId;
  }

  // Build the query based on what we resolved.
  let query = supabase
    .from("owner_timeline")
    .select("id, owner_id, property_id, event_type, title, body, created_by, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (parentType === "contact" && ownerProfileId) {
    query = query.eq("owner_id", ownerProfileId);
  } else if (parentType === "property" && resolvedPropertyId) {
    query = query.eq("property_id", resolvedPropertyId);
  } else {
    // Can't resolve — return empty.
    return [];
  }

  const { data } = await query;

  if (!data || data.length === 0) return [];

  // Resolve actor names for created_by UUIDs.
  const actorIds = Array.from(
    new Set(data.map((r) => r.created_by).filter(Boolean)),
  ) as string[];
  const actorNameById = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: actors } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", actorIds);
    for (const a of actors ?? []) {
      actorNameById.set(a.id, a.full_name?.trim() || a.email || "Someone");
    }
  }

  return data.map((r) => ({
    id: r.id,
    at: r.created_at,
    actorName: r.created_by ? (actorNameById.get(r.created_by) ?? null) : null,
    summary: r.title ?? r.event_type ?? "Event",
    kind: r.event_type ?? "note",
  }));
}
