// GET /api/treasury/balance-history
// Returns daily balance snapshots for the Holdings chart.
// Admin + treasury-verified only.

import { NextResponse } from "next/server";
import { treasuryAdminGuard } from "@/lib/treasury/admin-guard";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await treasuryAdminGuard();
  if (!guard.ok) return guard.response;

  const service = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (service as any)
    .from("treasury_balance_snapshots")
    .select("date, total_balance")
    .order("date", { ascending: true }) as {
    data: Array<{ date: string; total_balance: number }> | null;
    error: { message: string } | null;
  };

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch balance history", detail: error.message },
      { status: 500 },
    );
  }

  const points = (data ?? []).map((row) => ({
    date: row.date,
    balance: Number(row.total_balance),
  }));

  return NextResponse.json({ data: points });
}
