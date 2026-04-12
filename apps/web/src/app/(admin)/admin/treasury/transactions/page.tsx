import type { Metadata } from "next";
import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { isTreasuryVerified } from "@/lib/treasury/auth";
import { createClient } from "@/lib/supabase/server";
import { fetchTransactions, getMonthlyBurnRate } from "./actions";
import TransactionsShell, { type AccountOption } from "./TransactionsShell";

export const metadata: Metadata = {
  title: "Transactions | Treasury | Admin",
};

export const dynamic = "force-dynamic";

export default async function TreasuryTransactionsPage() {
  const verified = await isTreasuryVerified();
  if (!verified) {
    redirect("/admin/treasury/verify?redirect=/admin/treasury/transactions");
  }

  // Cast to untyped SupabaseClient: treasury tables not yet in generated types.
  const supabase = (await createClient()) as unknown as SupabaseClient;

  const [accountsResult, initialData, burnRate] = await Promise.all([
    supabase
      .from("treasury_accounts")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
    fetchTransactions({ page: 1, limit: 50 }),
    getMonthlyBurnRate(),
  ]);

  const accounts: AccountOption[] = (accountsResult.data ?? []).map((a) => ({
    id: a.id,
    name: a.name,
  }));

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10 lg:py-14">
      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

        {/* Header */}
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--color-text-primary)",
            }}
          >
            Transactions
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "13px",
              color: "var(--color-text-tertiary)",
            }}
          >
            {initialData.total.toLocaleString()} transaction
            {initialData.total !== 1 ? "s" : ""} across all accounts
          </p>
        </div>

        {/* Shell (client, handles all filters + pagination) */}
        <TransactionsShell
          accounts={accounts}
          initialTransactions={initialData.transactions}
          initialTotal={initialData.total}
          initialBurnRate={burnRate}
        />
      </div>
    </div>
  );
}
