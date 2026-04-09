/**
 * Version history: appends a new version row to setup_field_versions
 * every time an owner saves any setup section.
 *
 * This is server-side only. Called from server actions after a successful save.
 *
 * Until the PENDING migration creates the setup_field_versions table,
 * this function will silently no-op.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export async function recordVersion(
  supabase: SupabaseClient,
  opts: {
    userId: string;
    propertyId?: string | null;
    stepKey: string;
    data: Record<string, unknown>;
  },
): Promise<void> {
  try {
    // Get the next version number
    // This uses a raw query approach since the table may not exist yet
    const { data: existing } = await supabase
      .from("setup_field_versions" as never)
      .select("version_number")
      .eq("user_id", opts.userId)
      .eq("step_key", opts.stepKey)
      .eq("property_id", opts.propertyId ?? "")
      .order("version_number", { ascending: false })
      .limit(1);

    const nextVersion =
      existing && Array.isArray(existing) && existing.length > 0
        ? ((existing[0] as { version_number: number }).version_number + 1)
        : 1;

    await supabase.from("setup_field_versions" as never).insert({
      user_id: opts.userId,
      property_id: opts.propertyId ?? null,
      step_key: opts.stepKey,
      version_number: nextVersion,
      data: opts.data,
      saved_by: opts.userId,
    } as never);
  } catch {
    // Table likely doesn't exist yet. Silently ignore until migration runs.
  }
}
