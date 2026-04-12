// Treasury subscription detection engine
// SERVER-SIDE ONLY

import { createServiceClient as _createServiceClient } from "@/lib/supabase/service";

// Treasury tables are not yet in the generated Supabase types. Remove after types regen.
function createServiceClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return _createServiceClient() as any;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum number of transactions required to detect a subscription pattern. */
const MIN_TRANSACTION_COUNT = 3;

/** Amount consistency tolerance: all charges must be within this fraction of the median. */
const AMOUNT_TOLERANCE = 0.1;

type FrequencyLabel = "weekly" | "monthly" | "quarterly" | "annual";

interface FrequencyRange {
  label: FrequencyLabel;
  minDays: number;
  maxDays: number;
  /** Approximate charges per year, used to calculate total_annual_cost. */
  chargesPerYear: number;
}

const FREQUENCY_RANGES: FrequencyRange[] = [
  { label: "weekly",    minDays:   5, maxDays:   9, chargesPerYear: 52  },
  { label: "monthly",   minDays:  25, maxDays:  35, chargesPerYear: 12  },
  { label: "quarterly", minDays:  80, maxDays: 100, chargesPerYear:  4  },
  { label: "annual",    minDays: 330, maxDays: 400, chargesPerYear:  1  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalize a merchant name for grouping: lowercase, trimmed. */
function normalizeMerchant(name: string): string {
  return name.trim().toLowerCase();
}

/** Compute the median of a numeric array. Returns 0 for empty arrays. */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Given sorted transaction dates, return an array of day-intervals between
 * consecutive charges.
 */
function dayIntervals(sortedDates: string[]): number[] {
  const intervals: number[] = [];
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]).getTime();
    const curr = new Date(sortedDates[i]).getTime();
    const days = (curr - prev) / (1000 * 60 * 60 * 24);
    intervals.push(days);
  }
  return intervals;
}

/** Determine the recurring frequency from average interval in days, or null if irregular. */
function detectFrequency(avgIntervalDays: number): FrequencyRange | null {
  for (const range of FREQUENCY_RANGES) {
    if (avgIntervalDays >= range.minDays && avgIntervalDays <= range.maxDays) {
      return range;
    }
  }
  return null;
}

/** ISO date string for `date + intervalDays` days. */
function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + Math.round(days));
  return d.toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// Alert helper (mirrors pattern in sync.ts)
// ---------------------------------------------------------------------------

async function createAlert(
  svc: ReturnType<typeof createServiceClient>,
  opts: {
    type: string;
    severity: string;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await svc.from("treasury_alerts").insert({
    type: opts.type,
    severity: opts.severity,
    title: opts.title,
    message: opts.message,
    metadata: opts.metadata ?? {},
  });
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function detectSubscriptions(): Promise<{
  detected: number;
  new: number;
}> {
  const svc = createServiceClient();

  // 1. Fetch all non-duplicate outflows from the last 12 months.
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
  const cutoff = twelveMonthsAgo.toISOString().split("T")[0];

  const { data: transactions, error: fetchError } = await svc
    .from("treasury_transactions")
    .select("id, account_id, merchant_name, amount, date")
    .lt("amount", 0)
    .eq("is_duplicate", false)
    .gte("date", cutoff)
    .not("merchant_name", "is", null)
    .order("date", { ascending: true });

  if (fetchError) {
    console.error("[Treasury] detectSubscriptions: failed to fetch transactions:", fetchError);
    return { detected: 0, new: 0 };
  }

  const rows: Array<{
    id: string;
    account_id: string | null;
    merchant_name: string;
    amount: number;
    date: string;
  }> = transactions ?? [];

  // 2. Group by account_id + normalized merchant_name.
  //    Key: `${account_id}::${normalizedMerchant}`
  const groups = new Map<
    string,
    Array<{ id: string; account_id: string; amount: number; date: string }>
  >();

  for (const row of rows) {
    if (!row.merchant_name || !row.account_id) continue;
    const key = `${row.account_id}::${normalizeMerchant(row.merchant_name)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push({
      id: row.id,
      account_id: row.account_id,
      amount: row.amount,
      date: row.date,
    });
  }

  // 3. Fetch existing subscription records so we can track which ones are still active.
  const { data: existingRows } = await svc
    .from("treasury_subscriptions")
    .select("id, account_id, merchant_name, is_active");

  // Build a set of existing subscription keys (account_id::normalizedMerchant)
  const existingKeys = new Map<string, { id: string; is_active: boolean }>();
  for (const row of (existingRows ?? []) as Array<{
    id: string;
    account_id: string;
    merchant_name: string;
    is_active: boolean;
  }>) {
    const key = `${row.account_id}::${normalizeMerchant(row.merchant_name)}`;
    existingKeys.set(key, { id: row.id, is_active: row.is_active });
  }

  let detected = 0;
  let newCount = 0;
  const detectedKeys = new Set<string>();

  // 4. Evaluate each merchant group.
  for (const [key, charges] of groups.entries()) {
    // a. Need at least MIN_TRANSACTION_COUNT charges.
    if (charges.length < MIN_TRANSACTION_COUNT) continue;

    // Sort by date ascending (should already be, but be safe).
    const sorted = [...charges].sort((a, b) =>
      a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
    );

    // b. Calculate day intervals between consecutive charges.
    const intervals = dayIntervals(sorted.map((c) => c.date));
    if (intervals.length === 0) continue;

    const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;

    // c. Determine frequency.
    const frequency = detectFrequency(avgInterval);
    if (!frequency) continue;

    // d. Check amount consistency: all amounts within 10% of the median.
    //    Amounts are negative (outflows); compare absolute values.
    const absAmounts = sorted.map((c) => Math.abs(c.amount));
    const medianAmount = median(absAmounts);
    if (medianAmount === 0) continue;

    const allConsistent = absAmounts.every(
      (a) => Math.abs(a - medianAmount) / medianAmount <= AMOUNT_TOLERANCE,
    );
    if (!allConsistent) continue;

    // e. This is a confirmed subscription.
    detected++;
    detectedKeys.add(key);

    const lastCharge = sorted[sorted.length - 1];
    const typicalAmount = medianAmount;
    const totalAnnualCost = typicalAmount * frequency.chargesPerYear;
    const nextExpectedAt = addDays(lastCharge.date, avgInterval);

    // Find the case-preserved merchant name from the first transaction in the group.
    const originalName = rows.find((r) => r.id === charges[0].id)?.merchant_name
      ?? charges[0].account_id;

    // f. Upsert into treasury_subscriptions (match on account_id + merchant_name).
    const { data: upserted, error: upsertError } = await svc
      .from("treasury_subscriptions")
      .upsert(
        {
          account_id: lastCharge.account_id,
          merchant_name: originalName,
          frequency: frequency.label,
          typical_amount: typicalAmount,
          total_annual_cost: totalAnnualCost,
          next_expected_at: nextExpectedAt,
          is_active: true,
          last_detected_at: new Date().toISOString(),
        },
        {
          onConflict: "account_id,merchant_name",
          ignoreDuplicates: false,
        },
      )
      .select("id, created_at, updated_at")
      .single();

    if (upsertError) {
      console.error(
        `[Treasury] detectSubscriptions: upsert failed for ${originalName}:`,
        upsertError,
      );
      continue;
    }

    // g. If this is a newly inserted row (created_at == updated_at within a
    //    second tolerance), create a new_subscription alert.
    if (upserted) {
      const createdAt = new Date(upserted.created_at).getTime();
      const updatedAt = new Date(upserted.updated_at).getTime();
      const isNew = Math.abs(createdAt - updatedAt) < 2000;

      if (isNew) {
        newCount++;
        await createAlert(svc, {
          type: "new_subscription",
          severity: "info",
          title: "New recurring subscription detected",
          message: `${originalName} detected as a ${frequency.label} subscription at $${typicalAmount.toFixed(2)}/charge ($${totalAnnualCost.toFixed(2)}/year).`,
          metadata: {
            subscription_id: upserted.id,
            merchant_name: originalName,
            frequency: frequency.label,
            typical_amount: typicalAmount,
            total_annual_cost: totalAnnualCost,
            next_expected_at: nextExpectedAt,
          },
        });
      }
    }
  }

  // 5. Mark any existing active subscriptions not found in current detection as inactive.
  for (const [key, existing] of existingKeys.entries()) {
    if (existing.is_active && !detectedKeys.has(key)) {
      await svc
        .from("treasury_subscriptions")
        .update({ is_active: false })
        .eq("id", existing.id);
    }
  }

  return { detected, new: newCount };
}
