import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * POST /api/admin/generate-payouts
 *
 * Aggregates non-cancelled bookings into monthly payout records per
 * property, grouped by the calendar month of check_out. Idempotent:
 * uses ON CONFLICT to upsert existing rows.
 *
 * Admin-only. Checks the caller's profile role before proceeding.
 */
export async function POST() {
  // --- Auth check: must be admin ---
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // --- Fetch all non-cancelled bookings ---
  const service = createServiceClient();
  const { data: bookings, error: bookingsError } = await service
    .from("bookings")
    .select("property_id, check_out, total_amount")
    .neq("status", "cancelled");

  if (bookingsError) {
    return Response.json(
      { error: "Failed to fetch bookings", detail: bookingsError.message },
      { status: 500 },
    );
  }

  if (!bookings || bookings.length === 0) {
    return Response.json({ message: "No bookings found", upserted: 0 });
  }

  // --- Group by property_id + month of check_out ---
  const groups = new Map<
    string,
    { propertyId: string; periodStart: string; periodEnd: string; total: number }
  >();

  for (const b of bookings) {
    const co = new Date(b.check_out);
    const y = co.getFullYear();
    const m = co.getMonth();
    const periodStart = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const periodEnd = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    const key = `${b.property_id}::${periodStart}`;

    const existing = groups.get(key);
    if (existing) {
      existing.total += Number(b.total_amount ?? 0);
    } else {
      groups.set(key, {
        propertyId: b.property_id,
        periodStart,
        periodEnd,
        total: Number(b.total_amount ?? 0),
      });
    }
  }

  // --- Upsert into payouts ---
  const rows = Array.from(groups.values()).map((g) => ({
    property_id: g.propertyId,
    period_start: g.periodStart,
    period_end: g.periodEnd,
    gross_revenue: g.total,
    fees: 0,
    net_payout: g.total,
  }));

  const { error: upsertError } = await service
    .from("payouts")
    .upsert(rows, {
      onConflict: "property_id,period_start",
      ignoreDuplicates: false,
    });

  if (upsertError) {
    return Response.json(
      { error: "Upsert failed", detail: upsertError.message },
      { status: 500 },
    );
  }

  return Response.json({
    message: "Payouts generated successfully",
    upserted: rows.length,
  });
}
