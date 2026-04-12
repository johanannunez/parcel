// Treasury type definitions and constants

export type BucketCategory =
  | 'income'
  | 'owners_comp'
  | 'tax'
  | 'emergency'
  | 'opex'
  | 'profit'
  | 'generosity'
  | 'growth'
  | 'cleaners'
  | 'yearly'
  | 'disbursement'
  | 'deposits'
  | 'uncategorized';

export type TransactionCategory =
  | 'revenue'
  | 'transfer'
  | 'subscription'
  | 'operating'
  | 'stripe_fee'
  | 'stripe_payout'
  | 'other';

export type AlertType =
  | 'low_balance'
  | 'large_transaction'
  | 'sync_failed'
  | 'connection_expiring'
  | 'allocation_drift'
  | 'duplicate_detected'
  | 'new_subscription'
  | 'unusual_transaction'
  | 'dedup_match'
  | 'savings_milestone'
  | 'rebalance_suggestion';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type ConnectionStatus = 'active' | 'stale' | 'error' | 'pending' | 'disconnected';

export type AuditAction =
  | 'page_view'
  | 'data_sync'
  | 'plaid_link_start'
  | 'plaid_link_complete'
  | 'account_disconnect'
  | 'forecast_run'
  | 'settings_change'
  | 'reauth_success'
  | 'reauth_failure'
  | 'sync_triggered'
  | 'mfa_enroll'
  | 'mfa_verify';

// Profit-first allocation targets (percentages)
export const ALLOCATION_TARGETS: Record<string, number> = {
  owners_comp: 50,
  tax: 16,
  emergency: 15,
  opex: 10,
  profit: 5,
  generosity: 4,
};

// All valid bucket categories (mirrors the DB CHECK constraint)
export const ALL_BUCKET_CATEGORIES: BucketCategory[] = [
  'income',
  'owners_comp',
  'tax',
  'emergency',
  'opex',
  'profit',
  'generosity',
  'growth',
  'cleaners',
  'yearly',
  'disbursement',
  'deposits',
  'uncategorized',
];

// Bucket categories visible in the active treasury UI (excludes uncategorized)
export const ACTIVE_BUCKET_CATEGORIES: BucketCategory[] = ALL_BUCKET_CATEGORIES.filter(
  (c) => c !== 'uncategorized',
);

// Deduplication confidence thresholds (0-105 scale)
// Auto: requires amount + date + at least one identifier signal (description, counterparty, etc.)
export const DEDUP_THRESHOLD_AUTO = 80;
export const DEDUP_THRESHOLD_PROBABLE = 40;

// Treasury session timeout in minutes
export const TREASURY_SESSION_TIMEOUT_MINUTES = 15;

// Minimum seconds between manual sync triggers
export const SYNC_COOLDOWN_SECONDS = 300;
