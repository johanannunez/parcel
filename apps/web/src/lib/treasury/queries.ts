import type { SupabaseClient } from "@supabase/supabase-js";
import { ALLOCATION_TARGETS, ACTIVE_BUCKET_CATEGORIES } from "./types";
import type { BucketCategory } from "./types";

export async function getAccounts(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("treasury_accounts")
    .select("*")
    .order("name");
  if (error) { console.error("[Treasury] Failed to fetch accounts:", error); return []; }
  return data ?? [];
}

export async function getConnectionStatus(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("treasury_connections")
    .select("id, institution_name, status, last_synced_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  return data;
}

export async function getAllConnections(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("treasury_connections")
    .select("id, institution_name, status, last_synced_at")
    .eq("status", "active")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getAlerts(supabase: SupabaseClient, limit = 10) {
  const { data } = await supabase
    .from("treasury_alerts")
    .select("*")
    .order("acknowledged_at", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getSavingsGoals(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("treasury_savings_goals")
    .select("*, treasury_accounts(current_balance, name)")
    .eq("is_active", true)
    .order("created_at");
  return data ?? [];
}

export function calculateAllocationHealth(accounts: Array<{ bucket_category: string; current_balance: number; allocation_target_pct: number | null; is_active: boolean }>) {
  const activeAccounts = accounts.filter((a) => ACTIVE_BUCKET_CATEGORIES.includes(a.bucket_category as BucketCategory));
  const totalCash = activeAccounts.reduce((sum, a) => sum + a.current_balance, 0);

  return activeAccounts
    .filter((a) => a.bucket_category !== "income")
    .map((a) => {
      const target = a.allocation_target_pct ?? ALLOCATION_TARGETS[a.bucket_category] ?? 0;
      const actual = totalCash === 0 ? 0 : (a.current_balance / totalCash) * 100;
      const drift = Math.abs(actual - target);
      const status: "on_track" | "drifting" | "off_track" = drift <= 2 ? "on_track" : drift <= 5 ? "drifting" : "off_track";
      return { category: a.bucket_category, actual_pct: Math.round(actual * 10) / 10, target_pct: target, balance: a.current_balance, status };
    });
}

export async function getMonthlyTotals(supabase: SupabaseClient, year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;

  const { data } = await supabase
    .from("treasury_transactions")
    .select("amount, category, source, is_duplicate")
    .gte("date", startDate)
    .lt("date", endDate)
    .eq("is_duplicate", false)
    .neq("category", "internal_transfer");

  const transactions = data ?? [];
  const income = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  return { income, expenses, net: income - expenses };
}
