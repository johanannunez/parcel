// PATCH /api/treasury/accounts/[id]
// Updates bucket_category and allocation_target_pct on a treasury_accounts row.
// Admin + treasury-verified only.

import { NextRequest, NextResponse } from "next/server";
import { treasuryAdminGuard } from "@/lib/treasury/admin-guard";
import { createServiceClient } from "@/lib/supabase/service";
import type { BucketCategory } from "@/lib/treasury/types";

export const dynamic = "force-dynamic";

const ALL_BUCKET_CATEGORIES: BucketCategory[] = [
  "income",
  "owners_comp",
  "tax",
  "emergency",
  "opex",
  "profit",
  "generosity",
  "growth",
  "cleaners",
  "yearly",
  "disbursement",
  "deposits",
  "uncategorized",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await treasuryAdminGuard();
  if (!guard.ok) return guard.response;

  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
  }

  let body: { bucket_category?: string; allocation_target_pct?: number | null };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { bucket_category, allocation_target_pct } = body;

  // Validate bucket_category if provided
  if (
    bucket_category !== undefined &&
    !ALL_BUCKET_CATEGORIES.includes(bucket_category as BucketCategory)
  ) {
    return NextResponse.json(
      { error: "Invalid bucket_category", valid: ALL_BUCKET_CATEGORIES },
      { status: 400 },
    );
  }

  // Validate allocation_target_pct if provided
  if (
    allocation_target_pct !== undefined &&
    allocation_target_pct !== null &&
    (typeof allocation_target_pct !== "number" ||
      allocation_target_pct < 0 ||
      allocation_target_pct > 100)
  ) {
    return NextResponse.json(
      { error: "allocation_target_pct must be a number between 0 and 100" },
      { status: 400 },
    );
  }

  // Build update payload — only include fields that were sent
  const updates: Record<string, unknown> = {};
  if (bucket_category !== undefined) updates.bucket_category = bucket_category;
  if (allocation_target_pct !== undefined) updates.allocation_target_pct = allocation_target_pct;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = createServiceClient() as any;

  const { data, error } = await service
    .from("treasury_accounts")
    .update(updates)
    .eq("id", id)
    .select()
    .single() as { data: Record<string, unknown> | null; error: { message: string } | null };

  if (error) {
    return NextResponse.json(
      { error: "Failed to update account", detail: error.message },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, account: data });
}
