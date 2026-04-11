import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Daily cron: hard-deletes accounts past their 30-day soft delete grace period.
 *
 * Triggered by Vercel Cron at 0 6 * * * (6 AM UTC = 1 AM CT for Johan).
 * Schedule lives in apps/web/vercel.json.
 *
 * Auth: Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`.
 * Set CRON_SECRET in Vercel env vars (Doppler) before deploying.
 *
 * Process:
 * 1. Find profiles with deleted_at older than 30 days.
 * 2. Delete the auth.users record (cascades to profile and all related data
 *    via FK constraints with ON DELETE CASCADE).
 * 3. After deleting profiles, clean up any orphaned entities (entities with
 *    zero remaining members).
 * 4. Return a summary for the Vercel Cron logs.
 */

export const dynamic = "force-dynamic";

const GRACE_PERIOD_DAYS = 30;

export async function GET(request: NextRequest) {
  // Verify cron secret. Vercel Cron sends this header automatically.
  const authHeader = request.headers.get("authorization");
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }

  if (authHeader !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const svc = createServiceClient();

  // Find profiles past their grace period
  const cutoff = new Date(
    Date.now() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: toDelete, error: findError } = await svc
    .from("profiles")
    .select("id, entity_id, email, deleted_at")
    .lt("deleted_at", cutoff);

  if (findError) {
    console.error("[Cron] Failed to find deleted profiles:", findError);
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }

  if (!toDelete || toDelete.length === 0) {
    return NextResponse.json({
      ok: true,
      deletedProfiles: 0,
      deletedEntities: 0,
      message: "No accounts past grace period",
    });
  }

  // Track entity IDs that may need orphan cleanup later
  const affectedEntityIds = [
    ...new Set(toDelete.map((p) => p.entity_id).filter(Boolean)),
  ] as string[];

  // Delete auth users one at a time. Cascade handles the profile and all
  // related data via FK constraints.
  let deletedCount = 0;
  const failures: Array<{ email: string; error: string }> = [];

  for (const profile of toDelete) {
    try {
      const { error: deleteError } = await svc.auth.admin.deleteUser(profile.id);
      if (deleteError) {
        failures.push({ email: profile.email, error: deleteError.message });
        console.error(
          `[Cron] Failed to delete user ${profile.email}:`,
          deleteError,
        );
      } else {
        deletedCount++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failures.push({ email: profile.email, error: message });
      console.error(`[Cron] Exception deleting user ${profile.email}:`, err);
    }
  }

  // Clean up orphaned entities (entities with zero remaining profiles)
  let deletedEntityCount = 0;
  for (const entityId of affectedEntityIds) {
    const { count } = await svc
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("entity_id", entityId);

    if ((count ?? 0) === 0) {
      const { error: entityDeleteError } = await svc
        .from("entities")
        .delete()
        .eq("id", entityId);

      if (!entityDeleteError) {
        deletedEntityCount++;
      }
    }
  }

  console.log(
    `[Cron] Cleanup complete. Deleted ${deletedCount} profiles, ${deletedEntityCount} orphaned entities.`,
  );

  return NextResponse.json({
    ok: true,
    deletedProfiles: deletedCount,
    deletedEntities: deletedEntityCount,
    failures: failures.length > 0 ? failures : undefined,
    timestamp: new Date().toISOString(),
  });
}
