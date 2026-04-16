// Treasury sync engine: Plaid incremental sync, Stripe payout ingestion, and deduplication
// SERVER-SIDE ONLY

import { createServiceClient } from "@/lib/supabase/service";
import type { Json } from "@/types/supabase";
import { getPlaidClient } from "./plaid";
import { getStripeClient } from "./stripe";
import { decrypt, encrypt } from "./encryption";
import { matchTransactions } from "./dedup";
import type { StripePayoutRecord, PlaidTransactionRecord } from "./dedup";
import type { AlertSeverity } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SyncResult = {
  transactions_added: number;
  balances_updated: number;
  dedup_matches: number;
  errors: string[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Unix timestamp (seconds) to ISO date string (YYYY-MM-DD). */
function unixToISODate(ts: number): string {
  return new Date(ts * 1000).toISOString().split("T")[0];
}

/** Thirty days ago as a Unix timestamp (seconds). */
function thirtyDaysAgoUnix(): number {
  return Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
}

/** Create an alert record in treasury_alerts. */
async function createAlert(
  svc: ReturnType<typeof createServiceClient>,
  opts: {
    type: string;
    severity: AlertSeverity;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
  },
) {
  await svc.from("treasury_alerts").insert({
    type: opts.type,
    severity: opts.severity,
    title: opts.title,
    message: opts.message,
    metadata: (opts.metadata ?? {}) as Json,
  });
}

// ---------------------------------------------------------------------------
// Plaid incremental sync for a single connection
// ---------------------------------------------------------------------------

async function syncPlaidTransactions(
  svc: ReturnType<typeof createServiceClient>,
  connectionId: string,
  accessToken: string,
  cursor: string | null,
): Promise<{ added: number; nextCursor: string; errors: string[] }> {
  const plaid = getPlaidClient();
  let currentCursor = cursor ?? "";
  let totalAdded = 0;
  const errors: string[] = [];
  let hasMore = true;

  while (hasMore) {
    let response;
    try {
      response = await plaid.transactionsSync({
        access_token: accessToken,
        cursor: currentCursor,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Plaid transactionsSync failed: ${msg}`);
      break;
    }

    const { added, modified, removed, next_cursor, has_more } = response.data;

    // Build a map of plaid_account_id -> supabase UUID for FK resolution
    const { data: accountRows } = await svc
      .from("treasury_accounts")
      .select("id, plaid_account_id")
      .eq("connection_id", connectionId);

    const accountIdMap = new Map<string, string>();
    for (const row of (accountRows ?? []) as { id: string; plaid_account_id: string }[]) {
      accountIdMap.set(row.plaid_account_id, row.id);
    }

    // Process added transactions
    for (const tx of added) {
      // Plaid convention: positive = money out, negative = money in.
      // Our DB convention: positive = money in. So invert.
      const amount = -tx.amount;

      // Resolve Plaid account ID to our Supabase UUID
      const supabaseAccountId = accountIdMap.get(tx.account_id) ?? null;

      const { error: upsertError } = await svc
        .from("treasury_transactions")
        .upsert(
          {
            plaid_transaction_id: tx.transaction_id,
            account_id: supabaseAccountId,
            amount,
            date: tx.date,
            merchant_name: tx.name ?? tx.merchant_name ?? "Unknown",
            original_description: tx.original_description ?? null,
            category: "other",
            source: "plaid",
            counterparties: (tx.counterparties ?? null) as unknown as Json,
            payment_meta: (tx.payment_meta ?? null) as unknown as Json,
            is_duplicate: false,
          },
          { onConflict: "plaid_transaction_id", ignoreDuplicates: true },
        );

      if (upsertError) {
        errors.push(
          `Upsert failed for plaid tx ${tx.transaction_id}: ${upsertError.message}`,
        );
      } else {
        totalAdded++;
      }
    }

    // Process modified transactions (update existing rows)
    for (const tx of modified) {
      const amount = -tx.amount;
      await svc
        .from("treasury_transactions")
        .update({
          amount,
          date: tx.date,
          merchant_name: tx.name ?? tx.merchant_name ?? "Unknown",
          original_description: tx.original_description ?? null,
          counterparties: (tx.counterparties ?? null) as unknown as Json,
          payment_meta: (tx.payment_meta ?? null) as unknown as Json,
        })
        .eq("plaid_transaction_id", tx.transaction_id);
    }

    // Process removed transactions
    for (const tx of removed) {
      await svc
        .from("treasury_transactions")
        .delete()
        .eq("plaid_transaction_id", tx.transaction_id);
    }

    currentCursor = next_cursor;
    hasMore = has_more;
  }

  return { added: totalAdded, nextCursor: currentCursor, errors };
}

// ---------------------------------------------------------------------------
// Plaid balance refresh for a single connection
// ---------------------------------------------------------------------------

async function refreshBalances(
  svc: ReturnType<typeof createServiceClient>,
  accessToken: string,
): Promise<{ updated: number; errors: string[] }> {
  const plaid = getPlaidClient();
  const errors: string[] = [];
  let updated = 0;

  try {
    const response = await plaid.accountsBalanceGet({
      access_token: accessToken,
    });

    for (const account of response.data.accounts) {
      const { error } = await svc
        .from("treasury_accounts")
        .update({
          current_balance: account.balances.current ?? 0,
          available_balance: account.balances.available ?? null,
          balance_updated_at: new Date().toISOString(),
        })
        .eq("plaid_account_id", account.account_id);

      if (error) {
        errors.push(
          `Balance update failed for account ${account.account_id}: ${error.message}`,
        );
      } else {
        updated++;
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Plaid accountsBalanceGet failed: ${msg}`);
  }

  return { updated, errors };
}

// ---------------------------------------------------------------------------
// Stripe payout ingestion
// ---------------------------------------------------------------------------

async function ingestStripePayouts(
  svc: ReturnType<typeof createServiceClient>,
): Promise<{
  added: number;
  payoutRecords: StripePayoutRecord[];
  errors: string[];
}> {
  const stripe = getStripeClient();
  const errors: string[] = [];
  let added = 0;
  const payoutRecords: StripePayoutRecord[] = [];

  try {
    const payouts = await stripe.payouts.list({
      limit: 50,
      arrival_date: { gte: thirtyDaysAgoUnix() },
      expand: ["data.destination"],
    });

    for (const payout of payouts.data) {
      const amountDollars = payout.amount / 100;
      const arrivalDate = unixToISODate(payout.arrival_date);

      // Extract last4 from the expanded destination object
      const destination = payout.destination as Record<string, unknown> | null;
      const destinationLast4 = typeof destination?.last4 === "string"
        ? destination.last4
        : undefined;

      // Build the record for dedup scoring later
      payoutRecords.push({
        id: payout.id,
        amount: payout.amount,
        arrival_date: arrivalDate,
        destination_last4: destinationLast4,
        trace_id:
          typeof payout.metadata?.trace_id === "string"
            ? payout.metadata.trace_id
            : undefined,
      });

      // Upsert into treasury_transactions with source='stripe'
      const { error: upsertError } = await svc
        .from("treasury_transactions")
        .upsert(
          {
            stripe_charge_id: payout.id,
            amount: amountDollars,
            date: arrivalDate,
            merchant_name: "Stripe",
            description: `Stripe Payout ${payout.id}`,
            category: "stripe_payout",
            source: "stripe",
            is_duplicate: false,
            payment_meta: {
              stripe_status: payout.status,
              destination_last4: destinationLast4,
              trace_id: payout.metadata?.trace_id,
            } as unknown as Json,
          },
          { onConflict: "stripe_charge_id", ignoreDuplicates: true },
        );

      if (upsertError) {
        errors.push(
          `Upsert failed for Stripe payout ${payout.id}: ${upsertError.message}`,
        );
      } else {
        added++;
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Stripe payouts.list failed: ${msg}`);
  }

  return { added, payoutRecords, errors };
}

// ---------------------------------------------------------------------------
// Deduplication pass
// ---------------------------------------------------------------------------

async function runDeduplication(
  svc: ReturnType<typeof createServiceClient>,
  stripePayouts: StripePayoutRecord[],
): Promise<{ matchCount: number; errors: string[] }> {
  const errors: string[] = [];

  if (stripePayouts.length === 0) {
    return { matchCount: 0, errors };
  }

  // Find unmatched Plaid deposit transactions (positive amount, not already
  // flagged as duplicate, from Plaid source)
  const { data: plaidDeposits, error: fetchError } = await svc
    .from("treasury_transactions")
    .select(
      "id, plaid_transaction_id, account_id, amount, date, original_description, counterparties, payment_meta",
    )
    .eq("source", "plaid")
    .eq("is_duplicate", false)
    .gt("amount", 0)
    .is("duplicate_of", null);

  if (fetchError) {
    errors.push(`Failed to fetch Plaid deposits for dedup: ${fetchError.message}`);
    return { matchCount: 0, errors };
  }

  if (!plaidDeposits || plaidDeposits.length === 0) {
    return { matchCount: 0, errors };
  }

  // Fetch account masks for the relevant accounts
  type DepositRow = Record<string, unknown>;
  const accountIds = [...new Set((plaidDeposits as DepositRow[]).map((d) => d.account_id as string))];
  const { data: accounts } = await svc
    .from("treasury_accounts")
    .select("plaid_account_id, mask")
    .in("plaid_account_id", accountIds);

  const maskMap = new Map<string, string>();
  for (const acct of (accounts ?? []) as Array<{ plaid_account_id: string; mask: string | null }>) {
    if (acct.plaid_account_id && acct.mask) {
      maskMap.set(acct.plaid_account_id, acct.mask);
    }
  }

  // Build PlaidTransactionRecord array
  const plaidRecords: PlaidTransactionRecord[] = (plaidDeposits as DepositRow[]).map((d) => ({
    id: d.id as string,
    plaid_transaction_id: d.plaid_transaction_id as string,
    account_id: (d.account_id as string) ?? "",
    account_mask: maskMap.get((d.account_id as string) ?? "") ?? undefined,
    amount: d.amount as number,
    date: d.date as string,
    original_description: (d.original_description as string) ?? undefined,
    counterparties: (d.counterparties as Array<Record<string, unknown>>) ?? undefined,
    payment_meta: (d.payment_meta as Record<string, unknown>) ?? undefined,
  }));

  // Filter to only unmatched Stripe payouts (those whose treasury_transactions
  // row has is_duplicate = false and duplicate_of = null)
  const { data: unmatchedStripeRows } = await svc
    .from("treasury_transactions")
    .select("stripe_charge_id")
    .eq("source", "stripe")
    .eq("is_duplicate", false)
    .is("duplicate_of", null)
    .not("stripe_charge_id", "is", null);

  const unmatchedStripeIds = new Set(
    ((unmatchedStripeRows ?? []) as Array<{ stripe_charge_id: string }>).map((r) => r.stripe_charge_id),
  );
  const unmatchedPayouts = stripePayouts.filter((sp) =>
    unmatchedStripeIds.has(sp.id),
  );

  if (unmatchedPayouts.length === 0) {
    return { matchCount: 0, errors };
  }

  const result = matchTransactions(unmatchedPayouts, plaidRecords);
  const allMatches = [...result.autoMatches, ...result.probableMatches];

  // Update matched records in the database
  for (const match of allMatches) {
    // Mark the Plaid transaction as a duplicate of the Stripe payout transaction
    const { error: updateError } = await svc
      .from("treasury_transactions")
      .update({
        is_duplicate: true,
        duplicate_of: match.stripe_payout_id,
      })
      .eq("plaid_transaction_id", match.plaid_transaction_id);

    if (updateError) {
      errors.push(
        `Failed to mark plaid tx ${match.plaid_transaction_id} as duplicate: ${updateError.message}`,
      );
      continue;
    }

    // Create an alert for review (especially for probable matches)
    const severity: AlertSeverity = match.auto_matched ? "info" : "warning";
    await createAlert(svc, {
      type: "duplicate_detected",
      severity,
      title: match.auto_matched
        ? "Auto-matched duplicate transaction"
        : "Probable duplicate needs review",
      message: `Plaid tx ${match.plaid_transaction_id} matched Stripe payout ${match.stripe_payout_id} with score ${match.score}/105`,
      metadata: {
        plaid_transaction_id: match.plaid_transaction_id,
        stripe_payout_id: match.stripe_payout_id,
        score: match.score,
        auto_matched: match.auto_matched,
      },
    });
  }

  return { matchCount: allMatches.length, errors };
}

// ---------------------------------------------------------------------------
// Token rotation check
// ---------------------------------------------------------------------------

async function checkTokenRotation(
  svc: ReturnType<typeof createServiceClient>,
  connectionId: string,
  accessToken: string,
  tokenRotatedAt: string | null,
): Promise<{ newToken: string | null; errors: string[] }> {
  const errors: string[] = [];

  if (!tokenRotatedAt) {
    return { newToken: null, errors };
  }

  const rotatedDate = new Date(tokenRotatedAt);
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  if (Date.now() - rotatedDate.getTime() < thirtyDaysMs) {
    return { newToken: null, errors };
  }

  const plaid = getPlaidClient();

  try {
    // Invalidate old token and get a new public token
    const invalidateResponse = await plaid.itemAccessTokenInvalidate({
      access_token: accessToken,
    });

    const newAccessToken = invalidateResponse.data.new_access_token;
    const encryptedToken = encrypt(newAccessToken);

    // Store as Base64 string (consistent with exchange-token/route.ts)
    await svc
      .from("treasury_connections")
      .update({
        access_token_encrypted: encryptedToken.toString("base64"),
        token_rotated_at: new Date().toISOString(),
      })
      .eq("id", connectionId);

    return { newToken: newAccessToken, errors };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Token rotation failed for connection ${connectionId}: ${msg}`);
    return { newToken: null, errors };
  }
}

// ---------------------------------------------------------------------------
// Daily balance snapshot
// ---------------------------------------------------------------------------

async function recordBalanceSnapshot(
  svc: ReturnType<typeof createServiceClient>,
): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  // Sum all active account balances
  const { data: accounts } = await svc
    .from("treasury_accounts")
    .select("id, current_balance");

  const totalBalance = (accounts ?? []).reduce(
    (sum, a) => sum + Number((a as { current_balance: number }).current_balance ?? 0),
    0,
  );

  // Build per-account breakdown
  const accountBalances: Record<string, number> = {};
  for (const a of (accounts ?? []) as Array<{ id: string; current_balance: number }>) {
    accountBalances[a.id] = Number(a.current_balance ?? 0);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (svc as any)
    .from("treasury_balance_snapshots")
    .upsert(
      {
        date: today,
        total_balance: totalBalance,
        account_balances: accountBalances,
      },
      { onConflict: "date" },
    );
}

// ---------------------------------------------------------------------------
// Backfill balance history from transaction data
// Works backwards from current balance using daily transaction sums.
// Only runs when we have transactions but fewer than 7 snapshots (first sync).
// ---------------------------------------------------------------------------

async function backfillBalanceHistory(
  svc: ReturnType<typeof createServiceClient>,
): Promise<void> {
  // Check if we already have enough snapshots (skip if chart is populated)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingSnapshots } = await (svc as any)
    .from("treasury_balance_snapshots")
    .select("id")
    .limit(10) as { data: Array<{ id: string }> | null };

  if ((existingSnapshots ?? []).length >= 7) return; // Already backfilled

  // Get all Plaid transactions grouped by date
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: transactions } = await (svc as any)
    .from("treasury_transactions")
    .select("date, amount, account_id")
    .eq("source", "plaid")
    .eq("is_duplicate", false)
    .order("date", { ascending: false }) as {
    data: Array<{ date: string; amount: number; account_id: string | null }> | null;
  };

  if (!transactions || transactions.length === 0) return;

  // Get current balances per account
  const { data: accounts } = await svc
    .from("treasury_accounts")
    .select("id, current_balance");

  if (!accounts || accounts.length === 0) return;

  const accountBalances = new Map<string, number>();
  let totalBalance = 0;
  for (const a of accounts as Array<{ id: string; current_balance: number }>) {
    const bal = Number(a.current_balance ?? 0);
    accountBalances.set(a.id, bal);
    totalBalance += bal;
  }

  // Group transactions by date (newest first)
  const txByDate = new Map<string, Array<{ amount: number; account_id: string | null }>>();
  for (const tx of transactions) {
    if (!txByDate.has(tx.date)) txByDate.set(tx.date, []);
    txByDate.get(tx.date)!.push({ amount: tx.amount, account_id: tx.account_id });
  }

  // Build daily snapshots working backwards from today
  const today = new Date().toISOString().split("T")[0];
  const dates = [...txByDate.keys()].sort().reverse(); // newest first

  // Start from today's known balance and subtract each day's transactions
  let runningTotal = totalBalance;
  const runningAccounts = new Map(accountBalances);
  const snapshots: Array<{ date: string; total_balance: number; account_balances: Record<string, number> }> = [];

  // Today is already recorded; work backwards through transaction dates
  for (const date of dates) {
    if (date >= today) continue; // Skip today (already have it)

    const dayTxs = txByDate.get(date) ?? [];

    // Subtract this day's transactions to get the balance BEFORE these transactions
    for (const tx of dayTxs) {
      runningTotal -= tx.amount;
      if (tx.account_id) {
        const prev = runningAccounts.get(tx.account_id) ?? 0;
        runningAccounts.set(tx.account_id, prev - tx.amount);
      }
    }

    const balObj: Record<string, number> = {};
    for (const [id, bal] of runningAccounts) {
      balObj[id] = Math.round(bal * 100) / 100;
    }

    snapshots.push({
      date,
      total_balance: Math.round(runningTotal * 100) / 100,
      account_balances: balObj,
    });
  }

  if (snapshots.length === 0) return;

  // Batch upsert all historical snapshots
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (svc as any)
    .from("treasury_balance_snapshots")
    .upsert(snapshots, { onConflict: "date", ignoreDuplicates: true });
}

// ---------------------------------------------------------------------------
// Internal transfer detection
// Finds matching transaction pairs (same date, same absolute amount, opposite
// signs, different accounts) and marks both sides as "internal_transfer".
// Also catches keyword-based transfers that may not have a matching pair
// (e.g., one side was on a removed account).
// ---------------------------------------------------------------------------

const TRANSFER_KEYWORDS = [
  "transfer automation",
  "automatic transfer",
  "internet transfer",
  "profit first rule",
  "backup account to cover",
];

async function detectInternalTransfers(
  svc: ReturnType<typeof createServiceClient>,
): Promise<void> {
  // Fetch all Plaid transactions not yet marked as internal_transfer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: transactions } = await (svc as any)
    .from("treasury_transactions")
    .select("id, date, amount, account_id, merchant_name, category")
    .eq("source", "plaid")
    .eq("is_duplicate", false)
    .neq("category", "internal_transfer") as {
    data: Array<{
      id: string; date: string; amount: number;
      account_id: string | null; merchant_name: string | null; category: string;
    }> | null;
  };

  if (!transactions || transactions.length === 0) return;

  const idsToMark = new Set<string>();

  // Pass 1: Matching pairs (same date, same |amount|, opposite signs)
  // Group by date + absolute amount for efficient lookup
  const buckets = new Map<string, typeof transactions>();
  for (const tx of transactions) {
    const key = `${tx.date}|${Math.abs(tx.amount).toFixed(2)}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(tx);
  }

  for (const group of buckets.values()) {
    if (group.length < 2) continue;
    const positives = group.filter((t) => t.amount > 0);
    const negatives = group.filter((t) => t.amount < 0);

    for (const pos of positives) {
      for (const neg of negatives) {
        // Must be different accounts (or at least one null = removed account)
        if (pos.account_id && neg.account_id && pos.account_id === neg.account_id) continue;
        idsToMark.add(pos.id);
        idsToMark.add(neg.id);
      }
    }
  }

  // Pass 2: Keyword matching for orphaned transfers (pair's other side was removed)
  for (const tx of transactions) {
    if (idsToMark.has(tx.id)) continue;
    const name = (tx.merchant_name ?? "").toLowerCase();
    if (TRANSFER_KEYWORDS.some((kw) => name.includes(kw))) {
      idsToMark.add(tx.id);
    }
  }

  if (idsToMark.size === 0) return;

  // Batch update in chunks of 100
  const ids = [...idsToMark];
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (svc as any)
      .from("treasury_transactions")
      .update({ category: "internal_transfer" })
      .in("id", chunk);
  }
}

// ---------------------------------------------------------------------------
// Main sync orchestrator
// ---------------------------------------------------------------------------

export async function runTreasurySync(): Promise<SyncResult> {
  const svc = createServiceClient();
  const result: SyncResult = {
    transactions_added: 0,
    balances_updated: 0,
    dedup_matches: 0,
    errors: [],
  };

  // 1. Fetch all active connections
  const { data: connections, error: connError } = await svc
    .from("treasury_connections")
    .select("id, access_token_encrypted, cursor, last_synced_at, token_rotated_at")
    .eq("status", "active");

  if (connError) {
    result.errors.push(`Failed to fetch connections: ${connError.message}`);
    return result;
  }

  if (!connections || connections.length === 0) {
    return result;
  }

  // 2. Sync each connection
  for (const conn of connections) {
    let accessToken: string;

    try {
      const tokenBuffer = Buffer.from(conn.access_token_encrypted, "base64");
      accessToken = decrypt(tokenBuffer);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(
        `Failed to decrypt token for connection ${conn.id}: ${msg}`,
      );
      continue;
    }

    // 3. Plaid incremental transaction sync
    const txSync = await syncPlaidTransactions(
      svc,
      conn.id,
      accessToken,
      conn.cursor,
    );
    result.transactions_added += txSync.added;
    result.errors.push(...txSync.errors);

    // 4. Refresh balances
    const balSync = await refreshBalances(svc, accessToken);
    result.balances_updated += balSync.updated;
    result.errors.push(...balSync.errors);

    // 5. Update cursor and last_synced_at
    await svc
      .from("treasury_connections")
      .update({
        cursor: txSync.nextCursor,
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", conn.id);

    // 6. Token rotation check
    const rotation = await checkTokenRotation(
      svc,
      conn.id,
      accessToken,
      conn.token_rotated_at,
    );
    result.errors.push(...rotation.errors);
  }

  // 7. Ingest Stripe payouts
  const stripeSync = await ingestStripePayouts(svc);
  result.transactions_added += stripeSync.added;
  result.errors.push(...stripeSync.errors);

  // 8. Run deduplication
  const dedup = await runDeduplication(svc, stripeSync.payoutRecords);
  result.dedup_matches = dedup.matchCount;
  result.errors.push(...dedup.errors);

  // 9. Detect internal transfers (must run before snapshot for accurate totals)
  await detectInternalTransfers(svc);

  // 10. Record daily balance snapshot + backfill history from transactions
  await recordBalanceSnapshot(svc);
  await backfillBalanceHistory(svc);

  // 11. Log sync errors as alerts if any occurred
  if (result.errors.length > 0) {
    await createAlert(svc, {
      type: "sync_failed",
      severity: "warning",
      title: "Treasury sync completed with errors",
      message: `${result.errors.length} error(s) during sync. First: ${result.errors[0]}`,
      metadata: { errors: result.errors.slice(0, 10) },
    });
  }

  return result;
}
