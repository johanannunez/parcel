// Treasury forecast engine
// SERVER-SIDE ONLY

import { createServiceClient } from "@/lib/supabase/service";
import { ALLOCATION_TARGETS } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ForecastResult = {
  period_days: number;
  confidence_level: "low" | "medium" | "high";
  data_months: number;
  projected_income: number;
  projected_expenses: number;
  projected_net: number;
  savings_projections: Array<{
    goal_name: string;
    current: number;
    target: number;
    projected_date: string | null;
    on_pace: boolean;
  }>;
  rebalancing: Array<{
    from_account: string;
    to_account: string;
    amount: number;
    reason: string;
  }>;
};

type MonthBucket = {
  year: number;
  month: number;
  income: number;
  expenses: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Weighted linear trend projection. Recent months count more. */
function projectTrend(values: number[]): number {
  const n = values.length;
  if (n === 0) return 0;
  if (n === 1) return values[0];

  // Assign weights: most recent month = n, oldest = 1
  let weightedSum = 0;
  let totalWeight = 0;
  for (let i = 0; i < n; i++) {
    const weight = i + 1; // older months get lower weight
    weightedSum += values[i] * weight;
    totalWeight += weight;
  }
  return weightedSum / totalWeight;
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function generateForecast(
  periodDays: 30 | 60 | 90,
): Promise<ForecastResult> {
  const svc = createServiceClient();

  // 1. Fetch all non-duplicate transactions, ordered by date asc
  const { data: txRows, error: txError } = await svc
    .from("treasury_transactions")
    .select("amount, date, category")
    .eq("is_duplicate", false)
    .order("date", { ascending: true });

  if (txError) {
    console.error("[Forecast] Failed to fetch transactions:", txError);
  }

  const transactions: Array<{ amount: number; date: string; category: string | null }> =
    txRows ?? [];

  // 2. Calculate data_months_available
  let dataMonths = 0;
  let confidenceLevel: "low" | "medium" | "high" = "low";

  if (transactions.length >= 2) {
    const earliest = new Date(transactions[0].date);
    const latest = new Date(transactions[transactions.length - 1].date);
    const diffMs = latest.getTime() - earliest.getTime();
    dataMonths = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30)));
  }

  if (dataMonths >= 6) {
    confidenceLevel = "high";
  } else if (dataMonths >= 3) {
    confidenceLevel = "medium";
  } else {
    confidenceLevel = "low";
  }

  // 3. Group transactions by calendar month
  const monthMap = new Map<string, MonthBucket>();

  for (const tx of transactions) {
    const d = new Date(tx.date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const key = monthKey(year, month);

    if (!monthMap.has(key)) {
      monthMap.set(key, { year, month, income: 0, expenses: 0 });
    }

    const bucket = monthMap.get(key)!;
    if (tx.amount > 0) {
      bucket.income += tx.amount;
    } else {
      bucket.expenses += Math.abs(tx.amount);
    }
  }

  const monthBuckets = Array.from(monthMap.values()).sort((a, b) =>
    monthKey(a.year, a.month).localeCompare(monthKey(b.year, b.month)),
  );

  // 4. Project forward using weighted trend
  const incomeValues = monthBuckets.map((b) => b.income);
  const expenseValues = monthBuckets.map((b) => b.expenses);

  const monthsInPeriod = Math.max(1, Math.round(periodDays / 30));
  const baseMonthlyIncome = projectTrend(incomeValues);
  const baseMonthlyExpenses = projectTrend(expenseValues);

  const projectedIncome = Math.round(baseMonthlyIncome * monthsInPeriod * 100) / 100;
  const projectedExpenses = Math.round(baseMonthlyExpenses * monthsInPeriod * 100) / 100;
  const projectedNet = Math.round((projectedIncome - projectedExpenses) * 100) / 100;

  // 5. Savings goal projections
  const { data: goalsData } = await svc
    .from("treasury_savings_goals")
    .select("name, target_amount, is_active, treasury_accounts(current_balance, name)")
    .eq("is_active", true)
    .order("created_at");

  type GoalRow = {
    name: string;
    target_amount: number;
    is_active: boolean | null;
    treasury_accounts: { current_balance: number | null; name: string | null } | null;
  };

  const goals: GoalRow[] = goalsData ?? [];

  // Average monthly deposits = average positive-net months / data months
  const avgMonthlyNet = dataMonths > 0 ? projectedNet / monthsInPeriod : 0;

  const savingsProjections = goals.map((goal) => {
    const current = goal.treasury_accounts?.current_balance ?? 0;
    const target = goal.target_amount;
    const remaining = target - current;

    let projectedDate: string | null = null;
    let onPace = false;

    if (remaining <= 0) {
      // Already funded
      onPace = true;
      projectedDate = new Date().toISOString().split("T")[0];
    } else if (avgMonthlyNet > 0) {
      const monthsNeeded = Math.ceil(remaining / avgMonthlyNet);
      const targetDate = addMonths(new Date(), monthsNeeded);
      projectedDate = targetDate.toISOString().split("T")[0];

      // On pace means goal reachable within 12 months
      onPace = monthsNeeded <= 12;
    }

    return {
      goal_name: goal.name,
      current,
      target,
      projected_date: projectedDate,
      on_pace: onPace,
    };
  });

  // 6. Rebalancing suggestions based on allocation drift
  const { data: accountsData } = await svc
    .from("treasury_accounts")
    .select("id, name, bucket_category, current_balance, allocation_target_pct, is_active")
    .eq("is_active", true);

  type AccountRow = {
    id: string;
    name: string | null;
    bucket_category: string | null;
    current_balance: number | null;
    allocation_target_pct: number | null;
    is_active: boolean | null;
  };

  const accounts: AccountRow[] = accountsData ?? [];

  const rebalancingCategories = Object.keys(ALLOCATION_TARGETS);
  const relevantAccounts = accounts.filter(
    (a) => a.bucket_category && rebalancingCategories.includes(a.bucket_category),
  );

  const totalCash = relevantAccounts.reduce((sum, a) => sum + (a.current_balance ?? 0), 0);

  const rebalancing: ForecastResult["rebalancing"] = [];

  if (totalCash > 0) {
    // Find over-funded and under-funded buckets
    type BucketStatus = {
      account: AccountRow;
      target: number;
      actual: number;
      targetBalance: number;
      delta: number; // positive = over-funded, negative = under-funded
    };

    const statuses: BucketStatus[] = relevantAccounts.map((account) => {
      const targetPct = account.allocation_target_pct
        ?? ALLOCATION_TARGETS[account.bucket_category ?? ""] ?? 0;
      const balance = account.current_balance ?? 0;
      const actual = (balance / totalCash) * 100;
      const targetBalance = (targetPct / 100) * totalCash;
      const delta = balance - targetBalance;
      return { account, target: targetPct, actual, targetBalance, delta };
    });

    const overFunded = statuses.filter((s) => s.delta > 50).sort((a, b) => b.delta - a.delta);
    const underFunded = statuses.filter((s) => s.delta < -50).sort((a, b) => a.delta - b.delta);

    for (const under of underFunded) {
      const needed = Math.abs(under.delta);
      // Find the best over-funded bucket to source from
      const source = overFunded.find((o) => o.delta >= 50);
      if (!source) break;

      const moveAmount = Math.min(needed, source.delta);
      const rounded = Math.round(moveAmount * 100) / 100;

      if (rounded < 1) continue;

      const targetPct = under.account.allocation_target_pct
        ?? ALLOCATION_TARGETS[under.account.bucket_category ?? ""] ?? 0;

      const sourceName = source.account.name ?? "Unknown";
      const underName = under.account.name ?? "Unknown";

      rebalancing.push({
        from_account: sourceName,
        to_account: underName,
        amount: rounded,
        reason: `Move ${formatCurrencySimple(rounded)} from ${sourceName} to reach ${targetPct}% target for ${underName}`,
      });

      // Reduce source delta so it isn't used multiple times beyond capacity
      source.delta -= moveAmount;
    }
  }

  // 7. Store forecast in treasury_forecasts
  const forecastPayload = {
    period_days: periodDays,
    confidence_level: confidenceLevel,
    data_months_available: dataMonths,
    projected_income: projectedIncome,
    projected_expenses: projectedExpenses,
    projected_net: projectedNet,
    account_projections: {
      savings_projections: savingsProjections,
      rebalancing,
    },
    insights: [],
    model_used: "linear-trend-v1",
  };

  const { error: insertError } = await svc
    .from("treasury_forecasts")
    .insert(forecastPayload);

  if (insertError) {
    console.error("[Forecast] Failed to store forecast:", insertError);
  }

  return {
    period_days: periodDays,
    confidence_level: confidenceLevel,
    data_months: dataMonths,
    projected_income: projectedIncome,
    projected_expenses: projectedExpenses,
    projected_net: projectedNet,
    savings_projections: savingsProjections,
    rebalancing,
  };
}

function formatCurrencySimple(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
