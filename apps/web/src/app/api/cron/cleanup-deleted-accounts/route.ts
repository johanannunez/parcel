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

  // Delete profiles one at a time. We delete the profile FIRST (which cascades
  // to all related data via FK ON DELETE CASCADE), then try to clean up the
  // auth.users row as a best-effort step. This ordering ensures data is always
  // removed even if the auth admin API call fails for any reason.
  let deletedCount = 0;
  const failures: Array<{ email: string; error: string }> = [];

  for (const profile of toDelete) {
    try {
      // Step 1: Delete the profile (cascades to messages, properties, bookings,
      // payouts, notifications, push_subscriptions, session_log, etc.)
      const { error: profileDeleteError } = await svc
        .from("profiles")
        .delete()
        .eq("id", profile.id);

      if (profileDeleteError) {
        failures.push({ email: profile.email, error: `Profile delete: ${profileDeleteError.message}` });
        console.error(
          `[Cron] Failed to delete profile ${profile.email}:`,
          profileDeleteError,
        );
        continue;
      }

      // Step 2: Best-effort auth user cleanup. Don't count this as a failure
      // since the actual user data is already gone.
      try {
        await svc.auth.admin.deleteUser(profile.id);
      } catch (authErr) {
        console.warn(
          `[Cron] Profile ${profile.email} deleted but auth user cleanup failed:`,
          authErr,
        );
      }

      deletedCount++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failures.push({ email: profile.email, error: message });
      console.error(`[Cron] Exception deleting ${profile.email}:`, err);
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
