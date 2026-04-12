"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Server action to fetch heatmap data for the admin timeline page.
 * Uses the authenticated server client (respects RLS for admin).
 * Groups owner_timeline entries by calendar date for the last 90 days.
 */
export async function getHeatmapData(): Promise<
  { date: string; count: number }[]
> {
  const supabase = await createClient();

  const now = new Date();
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89);
  const cutoff = ninetyDaysAgo.toISOString();

  const { data, error } = await (supabase as any)
    .from("owner_timeline")
    .select("created_at")
    .is("deleted_at", null)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[heatmap-data] Failed to fetch timeline data:", error.message);
    return [];
  }

  if (!data || data.length === 0) return [];

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
