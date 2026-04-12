// Treasury sync engine: Plaid incremental sync, Stripe payout ingestion, and deduplication
// SERVER-SIDE ONLY

import { createServiceClient as _createServiceClient } from "@/lib/supabase/service";

// Treasury tables are not yet in the generated Supabase types. Cast the client
// to `any` so we can query treasury_* tables without TS errors. Once the types
// are regenerated after the treasury migration, remove this wrapper.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createServiceClient() {
  return _createServiceClient() as any;
}
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
    metadata: opts.metadata ?? {},
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

    // Process added transactions
    for (const tx of added) {
      // Plaid convention: positive = money out, negative = money in.
      // Our DB convention: positive = money in. So invert.
      const amount = -tx.amount;

      const { error: upsertError } = await svc
        .from("treasury_transactions")
        .upsert(
          {
            connection_id: connectionId,
            plaid_transaction_id: tx.transaction_id,
            account_id: tx.account_id,
            amount,
            date: tx.date,
            name: tx.name ?? tx.merchant_name ?? "Unknown",
            original_description: tx.original_description ?? null,
            category: "other",
            source: "plaid",
            counterparties: tx.counterparties ?? null,
            payment_meta: tx.payment_meta ?? null,
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
          name: tx.name ?? tx.merchant_name ?? "Unknown",
          original_description: tx.original_description ?? null,
          counterparties: tx.counterparties ?? null,
          payment_meta: tx.payment_meta ?? null,
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
          updated_at: new Date().toISOString(),
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
      const destination = payout.destination as any;
      const destinationLast4: string | undefined = destination?.last4;

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
            name: `Stripe Payout ${payout.id}`,
            category: "stripe_payout",
            source: "stripe",
            is_duplicate: false,
            payment_meta: {
              stripe_status: payout.status,
              destination_last4: destinationLast4,
              trace_id: payout.metadata?.trace_id,
            },
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
  const accountIds = [...new Set(plaidDeposits.map((d: any) => d.account_id))];
  const { data: accounts } = await svc
    .from("treasury_accounts")
    .select("plaid_account_id, mask")
    .in("plaid_account_id", accountIds);

  const maskMap = new Map<string, string>();
  for (const acct of (accounts ?? []) as any[]) {
    if (acct.plaid_account_id && acct.mask) {
      maskMap.set(acct.plaid_account_id, acct.mask);
    }
  }

  // Build PlaidTransactionRecord array
  const plaidRecords: PlaidTransactionRecord[] = plaidDeposits.map((d: any) => ({
    id: d.id,
    plaid_transaction_id: d.plaid_transaction_id!,
    account_id: d.account_id ?? "",
    account_mask: maskMap.get(d.account_id ?? "") ?? undefined,
    amount: d.amount,
    date: d.date,
    original_description: d.original_description ?? undefined,
    counterparties: d.counterparties ?? undefined,
    payment_meta: d.payment_meta ?? undefined,
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
    ((unmatchedStripeRows ?? []) as any[]).map((r) => r.stripe_charge_id),
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

  // 9. Log sync errors as alerts if any occurred
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
