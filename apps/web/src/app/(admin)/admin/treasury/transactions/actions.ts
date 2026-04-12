"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { TransactionCategory } from "@/lib/treasury/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TransactionRow = {
  id: string;
  date: string;
  merchant_name: string | null;
  description: string | null;
  category: TransactionCategory | null;
  amount: number;
  is_duplicate: boolean;
  duplicate_of: string | null;
  source: "plaid" | "stripe" | null;
  account_id: string | null;
  account_name: string | null;
};

export type TransactionFilters = {
  accountId?: string;
  category?: TransactionCategory | "";
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type FetchTransactionsResult = {
  transactions: TransactionRow[];
  total: number;
};

export type MonthlyBurnRate = {
  subscriptions: number;
  operating: number;
};

// ---------------------------------------------------------------------------
// fetchTransactions
// ---------------------------------------------------------------------------

export async function fetchTransactions(
  filters: TransactionFilters = {},
): Promise<FetchTransactionsResult> {
  // Cast to untyped SupabaseClient: treasury tables were added after types
  // were generated and will be included in the next types regeneration.
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const { accountId, category, dateFrom, dateTo, search, page = 1, limit = 50 } = filters;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("treasury_transactions")
    .select(
      "id, date, merchant_name, description, category, amount, is_duplicate, duplicate_of, source, account_id, treasury_accounts(name)",
      { count: "exact" },
    )
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (accountId) {
    query = query.eq("account_id", accountId);
  }
  if (category) {
    query = query.eq("category", category);
  }
  if (dateFrom) {
    query = query.gte("date", dateFrom);
  }
  if (dateTo) {
    query = query.lte("date", dateTo);
  }
  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(`merchant_name.ilike.${term},description.ilike.${term}`);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("[Treasury] fetchTransactions error:", error);
    return { transactions: [], total: 0 };
  }

  const transactions: TransactionRow[] = (data ?? []).map((row) => {
    const accountsRelation = row.treasury_accounts as
      | { name: string }
      | { name: string }[]
      | null;
    const accountName = Array.isArray(accountsRelation)
      ? (accountsRelation[0]?.name ?? null)
      : (accountsRelation?.name ?? null);

    return {
      id: row.id,
      date: row.date,
      merchant_name: row.merchant_name ?? null,
      description: row.description ?? null,
      category: (row.category as TransactionCategory) ?? null,
      amount: row.amount,
      is_duplicate: row.is_duplicate ?? false,
      duplicate_of: row.duplicate_of ?? null,
      source: (row.source as "plaid" | "stripe") ?? null,
      account_id: row.account_id ?? null,
      account_name: accountName,
    };
  });

  return { transactions, total: count ?? 0 };
}

// ---------------------------------------------------------------------------
// getMonthlyBurnRate
// ---------------------------------------------------------------------------

export async function getMonthlyBurnRate(): Promise<MonthlyBurnRate> {
  // Cast to untyped SupabaseClient: treasury tables not yet in generated types.
  const supabase = (await createClient()) as unknown as SupabaseClient;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate =
    month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, "0")}-01`;

  const { data, error } = await supabase
    .from("treasury_transactions")
    .select("amount, category")
    .gte("date", startDate)
    .lt("date", endDate)
    .eq("is_duplicate", false)
    .in("category", ["subscription", "operating"]);

  if (error) {
    console.error("[Treasury] getMonthlyBurnRate error:", error);
    return { subscriptions: 0, operating: 0 };
  }

  let subscriptions = 0;
  let operating = 0;

  for (const row of data ?? []) {
    const abs = Math.abs(row.amount);
    if (row.category === "subscription") {
      subscriptions += abs;
    } else if (row.category === "operating") {
      operating += abs;
    }
  }

  return { subscriptions, operating };
}

// ---------------------------------------------------------------------------
// confirmDedupMatch
// ---------------------------------------------------------------------------

export async function confirmDedupMatch(transactionId: string): Promise<void> {
  // Cast to untyped SupabaseClient: treasury tables not yet in generated types.
  const svc = createServiceClient() as unknown as SupabaseClient;

  const { error: updateError } = await svc
    .from("treasury_transactions")
    .update({ is_duplicate: true })
    .eq("id", transactionId);

  if (updateError) {
    console.error("[Treasury] confirmDedupMatch update error:", updateError);
    return;
  }

  // Create a dedup_match alert (fire-and-forget on insert failure)
  await svc
    .from("treasury_alerts")
    .insert({
      alert_type: "duplicate_detected",
      severity: "info",
      message: `Transaction ${transactionId} confirmed as duplicate.`,
      acknowledged_at: null,
    })
    .then(() => {}, () => {});
}
