// Treasury data purge cron endpoint
// Runs monthly to delete expired alerts, forecasts, and deactivated subscriptions.
// Required by Plaid Attestation 8 (data retention / deletion policy).

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const svc = createServiceClient();

  try {
    // 1. Purge expired alerts
    const { data: deletedAlerts } = await svc
      .from("treasury_alerts")
      .delete()
      .not("retention_expires_at", "is", null)
      .lt("retention_expires_at", new Date().toISOString())
      .select("id");

    const alertsCount = deletedAlerts?.length ?? 0;

    // 2. Purge expired forecasts
    const { data: deletedForecasts } = await svc
      .from("treasury_forecasts")
      .delete()
      .not("retention_expires_at", "is", null)
      .lt("retention_expires_at", new Date().toISOString())
      .select("id");

    const forecastsCount = deletedForecasts?.length ?? 0;

    // 3. Purge subscriptions deactivated more than 90 days ago
    const ninetyDaysAgo = new Date(
      Date.now() - 90 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data: deletedSubs } = await svc
      .from("treasury_subscriptions")
      .delete()
      .eq("is_active", false)
      .not("deactivated_at", "is", null)
      .lt("deactivated_at", ninetyDaysAgo)
      .select("id");

    const subscriptionsCount = deletedSubs?.length ?? 0;

    // 4. Audit log
    await svc.from("treasury_audit_log").insert({
      user_id: null,
      action: "data_purge",
      resource_type: "treasury",
      metadata: {
        alerts_purged: alertsCount,
        forecasts_purged: forecastsCount,
        subscriptions_purged: subscriptionsCount,
        triggered_by: "cron",
      },
    });

    return NextResponse.json({
      ok: true,
      alerts_purged: alertsCount,
      forecasts_purged: forecastsCount,
      subscriptions_purged: subscriptionsCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Treasury Purge] Unhandled error:", err);

    // Best-effort audit log for failed purge
    try {
      await svc.from("treasury_audit_log").insert({
        user_id: null,
        action: "data_purge",
        resource_type: "treasury",
        metadata: {
          error: message,
          triggered_by: "cron",
          status: "failed",
        },
      });
    } catch {
      // If audit logging also fails, we still return the 500
      console.error("[Treasury Purge] Failed to write audit log for error");
    }

    return NextResponse.json(
      { error: "Purge failed", detail: message },
      { status: 500 },
    );
  }
}
