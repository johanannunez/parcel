/* eslint-disable @typescript-eslint/no-explicit-any */
// owner_timeline table is not yet in the generated Supabase types.
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Fetch recent timeline entries for the admin dashboard.
 * Returns non-deleted entries ordered by newest first.
 */
export async function getRecentTimelineEntries(limit = 5) {
  const svc = createServiceClient();

  const { data } = await (svc as any)
    .from("owner_timeline")
    .select(
      "id, owner_id, event_type, category, title, body, created_at, property_id",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as {
    id: string;
    owner_id: string;
    event_type: string;
    category: string;
    title: string;
    body: string | null;
    created_at: string;
    property_id: string | null;
  }[];
}

/**
 * Fetch activity counts by date for the heatmap (last 90 days).
 * Groups owner_timeline entries by calendar date and returns an
 * array of { date, count } objects sorted oldest to newest.
 */
export async function getActivityHeatmapData() {
  const svc = createServiceClient();

  const now = new Date();
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89);
  const cutoff = ninetyDaysAgo.toISOString();

  const { data } = await (svc as any)
    .from("owner_timeline")
    .select("created_at")
    .is("deleted_at", null)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: true });

  if (!data || data.length === 0) return [] as { date: string; count: number }[];

  // Group by date string (YYYY-MM-DD)
  const counts = new Map<string, number>();
  for (const row of data as { created_at: string }[]) {
    const dateKey = row.created_at.slice(0, 10);
    counts.set(dateKey, (counts.get(dateKey) ?? 0) + 1);
  }

  const result: { date: string; count: number }[] = [];
  for (const [date, count] of counts) {
    result.push({ date, count });
  }

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Log a page view for engagement tracking.
 * Fire-and-forget: never throws, logs errors to console.
 */
export async function logPageView(userId: string, page: string) {
  try {
    const svc = createServiceClient();

    await (svc as any).from("activity_log").insert({
      actor_id: userId,
      entity_type: "page_view",
      action: page,
      metadata: {},
    });
  } catch (err) {
    console.error(
      "[timeline-queries] logPageView failed:",
      err instanceof Error ? err.message : "Unknown error",
    );
  }
}
