// Treasury sync API route
// Supports two auth modes: Vercel Cron (Bearer CRON_SECRET) and manual admin trigger.

import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient as _createServiceClient } from "@/lib/supabase/service";

// Treasury tables not yet in generated Supabase types. See sync.ts for context.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createServiceClient = () => _createServiceClient() as any;
import { treasuryAdminGuard } from "@/lib/treasury/admin-guard";
import { runTreasurySync } from "@/lib/treasury/sync";
import { SYNC_COOLDOWN_SECONDS } from "@/lib/treasury/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60s for full sync cycle

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const isCron =
    !!process.env.CRON_SECRET &&
    authHeader === `Bearer ${process.env.CRON_SECRET}`;

  // ---------------------------------------------------------------------------
  // Auth: either Vercel Cron secret or admin session
  // ---------------------------------------------------------------------------
  let userId: string | undefined;

  if (!isCron) {
    const guard = await treasuryAdminGuard();
    if (!guard.ok) return guard.response;
    userId = guard.user.id;

    // Manual sync cooldown: 5 minutes between triggers
    const svc = createServiceClient();
    const { data: latestConn } = await svc
      .from("treasury_connections")
      .select("last_synced_at")
      .eq("status", "active")
      .order("last_synced_at", { ascending: false })
      .limit(1)
      .single();

    if (latestConn?.last_synced_at) {
      const lastSync = new Date(latestConn.last_synced_at).getTime();
      const elapsed = (Date.now() - lastSync) / 1000;

      if (elapsed < SYNC_COOLDOWN_SECONDS) {
        const waitSeconds = Math.ceil(SYNC_COOLDOWN_SECONDS - elapsed);
        return NextResponse.json(
          {
            error: "Sync cooldown active",
            retry_after_seconds: waitSeconds,
          },
          { status: 429 },
        );
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Run sync
  // ---------------------------------------------------------------------------
  try {
    const result = await runTreasurySync();

    // Audit log (user_id is nullable for cron-triggered syncs)
    const svc = createServiceClient();
    await svc.from("treasury_audit_log").insert({
      action: "sync_triggered",
      user_id: userId ?? null,
      metadata: {
        trigger: isCron ? "cron" : "manual",
        transactions_added: result.transactions_added,
        balances_updated: result.balances_updated,
        dedup_matches: result.dedup_matches,
        error_count: result.errors.length,
      },
    });

    return NextResponse.json({
      ok: true,
      ...result,
      // Truncate error details in the response to avoid leaking internals
      errors: result.errors.length > 0 ? result.errors.slice(0, 5) : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Treasury Sync] Unhandled error:", err);

    return NextResponse.json(
      { error: "Sync failed", detail: message },
      { status: 500 },
    );
  }
}
