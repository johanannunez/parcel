"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateForecast } from "@/lib/treasury/forecast";
import type { ForecastResult } from "@/lib/treasury/forecast";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StoredForecast = ForecastResult & {
  id: string;
  generated_at: string;
};

// ---------------------------------------------------------------------------
// generateForecastAction
// ---------------------------------------------------------------------------

export async function generateForecastAction(
  periodDays: 30 | 60 | 90,
): Promise<{ ok: true; data: ForecastResult } | { ok: false; error: string }> {
  try {
    const result = await generateForecast(periodDays);

    // Audit log — use service client since treasury_audit_log requires admin profile check
    // and server actions run in the user's session
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const svc = createServiceClient() as any;
      await svc.from("treasury_audit_log").insert({
        user_id: user.id,
        action: "forecast_run",
        resource_type: "treasury_forecasts",
        metadata: {
          period_days: periodDays,
          confidence_level: result.confidence_level,
          data_months: result.data_months,
        },
      });
    }

    return { ok: true, data: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error generating forecast";
    console.error("[Forecast Action] generateForecastAction error:", err);
    return { ok: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// getLatestForecast
// ---------------------------------------------------------------------------

export async function getLatestForecast(): Promise<StoredForecast | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = createServiceClient() as any;
    const { data, error } = await svc
      .from("treasury_forecasts")
      .select("*")
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    const projections = data.account_projections as {
      savings_projections?: ForecastResult["savings_projections"];
      rebalancing?: ForecastResult["rebalancing"];
    } | null;

    return {
      id: data.id,
      generated_at: data.generated_at,
      period_days: data.period_days,
      confidence_level: data.confidence_level as ForecastResult["confidence_level"],
      data_months: data.data_months_available ?? 0,
      projected_income: Number(data.projected_income ?? 0),
      projected_expenses: Number(data.projected_expenses ?? 0),
      projected_net: Number(data.projected_net ?? 0),
      savings_projections: projections?.savings_projections ?? [],
      rebalancing: projections?.rebalancing ?? [],
    };
  } catch (err) {
    console.error("[Forecast Action] getLatestForecast error:", err);
    return null;
  }
}
