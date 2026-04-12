// Treasury deduplication engine: scored matching between Stripe payouts and Plaid transactions
// SERVER-SIDE ONLY

import { DEDUP_THRESHOLD_AUTO, DEDUP_THRESHOLD_PROBABLE } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StripePayoutRecord = {
  id: string;
  amount: number; // cents
  arrival_date: string; // ISO date (YYYY-MM-DD)
  destination_last4?: string;
  trace_id?: string;
};

export type PlaidTransactionRecord = {
  id: string; // our DB uuid
  plaid_transaction_id: string;
  account_id: string;
  account_mask?: string;
  amount: number; // dollars, positive = deposit
  date: string; // ISO date (YYYY-MM-DD)
  original_description?: string;
  counterparties?: Array<Record<string, unknown>>; // jsonb from Plaid
  payment_meta?: Record<string, unknown>; // jsonb from Plaid
};

export type DedupMatch = {
  plaid_transaction_id: string;
  stripe_payout_id: string;
  score: number;
  auto_matched: boolean; // score >= 65
};

export type DedupResult = {
  autoMatches: DedupMatch[];
  probableMatches: DedupMatch[];
  unmatched: { stripe: string[]; plaid: string[] };
};

// ---------------------------------------------------------------------------
// Business day helpers
// ---------------------------------------------------------------------------

/** Returns true if the given date (YYYY-MM-DD) falls on a weekend. */
function isWeekend(d: Date): boolean {
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}

/**
 * Counts the number of business days (Mon-Fri) between two ISO date strings.
 * Result is always non-negative.
 */
function businessDaysBetween(a: string, b: string): number {
  let start = new Date(a + "T00:00:00Z");
  let end = new Date(b + "T00:00:00Z");

  if (start > end) {
    [start, end] = [end, start];
  }

  let count = 0;
  const cursor = new Date(start);
  // Move day by day from start+1 to end (inclusive)
  cursor.setUTCDate(cursor.getUTCDate() + 1);

  while (cursor <= end) {
    if (!isWeekend(cursor)) {
      count++;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return count;
}

/**
 * Returns true if the two ISO date strings are within `maxDays` business days
 * of each other (inclusive). Same-day always returns true.
 */
export function isWithinBusinessDays(
  date1: string,
  date2: string,
  maxDays: number,
): boolean {
  if (date1 === date2) return true;
  return businessDaysBetween(date1, date2) <= maxDays;
}

// ---------------------------------------------------------------------------
// Signal scoring
// ---------------------------------------------------------------------------

/**
 * Scores a single (Stripe payout, Plaid transaction) pair.
 *
 * Signals and weights:
 *   +40  Exact amount match (Stripe cents/100 = Plaid dollars, positive comparison)
 *   +25  Date within 2 business days of Stripe arrival_date
 *   +15  original_description contains "PARCELCO" or "STRIPE" (case-insensitive)
 *   +10  counterparties array has entry with name containing "Stripe" (case-insensitive)
 *    +5  Bank account last4 matches Stripe destination last4
 *    +5  payment_meta.payment_processor === "Stripe" (case-insensitive)
 *    +5  payment_meta.reference_number === Stripe trace_id (if both non-null)
 */
function scorePair(
  stripe: StripePayoutRecord,
  plaid: PlaidTransactionRecord,
): number {
  let score = 0;

  // 1. Amount match (+40): Stripe is cents, Plaid is dollars
  const stripeAmountDollars = Math.round(stripe.amount) / 100;
  if (Math.abs(stripeAmountDollars - plaid.amount) < 0.005) {
    score += 40;
  }

  // 2. Date proximity (+25): within 2 business days
  if (isWithinBusinessDays(stripe.arrival_date, plaid.date, 2)) {
    score += 25;
  }

  // 3. Description keywords (+15)
  const desc = (plaid.original_description ?? "").toLowerCase();
  if (desc.includes("parcelco") || desc.includes("stripe")) {
    score += 15;
  }

  // 4. Counterparties containing "Stripe" (+10)
  if (Array.isArray(plaid.counterparties)) {
    const hasStripe = plaid.counterparties.some((cp) => {
      const name = typeof cp === "object" && cp !== null
        ? (cp as Record<string, unknown>).name ?? ""
        : "";
      return String(name).toLowerCase().includes("stripe");
    });
    if (hasStripe) {
      score += 10;
    }
  }

  // 5. Account last4 match (+5)
  if (
    stripe.destination_last4 &&
    plaid.account_mask &&
    stripe.destination_last4 === plaid.account_mask
  ) {
    score += 5;
  }

  // 6. payment_processor === "Stripe" (+5)
  const processor =
    plaid.payment_meta?.payment_processor ?? plaid.payment_meta?.paymentProcessor;
  if (typeof processor === "string" && processor.toLowerCase() === "stripe") {
    score += 5;
  }

  // 7. reference_number matches trace_id (+5)
  const refNum =
    plaid.payment_meta?.reference_number ?? plaid.payment_meta?.referenceNumber;
  if (stripe.trace_id && refNum && stripe.trace_id === refNum) {
    score += 5;
  }

  return score;
}

// ---------------------------------------------------------------------------
// Main matcher
// ---------------------------------------------------------------------------

/**
 * Matches Stripe payouts to Plaid deposit transactions using a 7-signal
 * scoring algorithm.
 *
 * Each Stripe payout is matched to at most one Plaid transaction (the highest
 * scoring candidate). Each Plaid transaction is matched to at most one payout.
 *
 * Returns auto matches (score >= 65), probable matches (40-64), and the IDs
 * of unmatched records on both sides.
 */
export function matchTransactions(
  stripePayouts: StripePayoutRecord[],
  plaidTransactions: PlaidTransactionRecord[],
): DedupResult {
  const autoMatches: DedupMatch[] = [];
  const probableMatches: DedupMatch[] = [];

  // Build a scored pair list for greedy matching
  const scoredPairs: Array<{
    stripeId: string;
    plaidTxId: string;
    score: number;
  }> = [];

  for (const sp of stripePayouts) {
    for (const pt of plaidTransactions) {
      const score = scorePair(sp, pt);
      if (score >= DEDUP_THRESHOLD_PROBABLE) {
        scoredPairs.push({
          stripeId: sp.id,
          plaidTxId: pt.plaid_transaction_id,
          score,
        });
      }
    }
  }

  // Sort descending by score so highest confidence matches are assigned first
  scoredPairs.sort((a, b) => b.score - a.score);

  const matchedStripe = new Set<string>();
  const matchedPlaid = new Set<string>();

  for (const pair of scoredPairs) {
    if (matchedStripe.has(pair.stripeId) || matchedPlaid.has(pair.plaidTxId)) {
      continue;
    }

    const match: DedupMatch = {
      plaid_transaction_id: pair.plaidTxId,
      stripe_payout_id: pair.stripeId,
      score: pair.score,
      auto_matched: pair.score >= DEDUP_THRESHOLD_AUTO,
    };

    if (pair.score >= DEDUP_THRESHOLD_AUTO) {
      autoMatches.push(match);
    } else {
      probableMatches.push(match);
    }

    matchedStripe.add(pair.stripeId);
    matchedPlaid.add(pair.plaidTxId);
  }

  const unmatchedStripe = stripePayouts
    .filter((sp) => !matchedStripe.has(sp.id))
    .map((sp) => sp.id);

  const unmatchedPlaid = plaidTransactions
    .filter((pt) => !matchedPlaid.has(pt.plaid_transaction_id))
    .map((pt) => pt.plaid_transaction_id);

  return {
    autoMatches,
    probableMatches,
    unmatched: { stripe: unmatchedStripe, plaid: unmatchedPlaid },
  };
}
