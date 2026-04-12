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
  | 'allocation_drift'
  | 'duplicate_detected';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type ConnectionStatus = 'active' | 'error' | 'pending' | 'disconnected';

export type AuditAction =
  | 'view_balance'
  | 'view_transactions'
  | 'sync_triggered'
  | 'allocation_updated'
  | 'bucket_created'
  | 'bucket_deleted'
  | 'connection_added'
  | 'connection_removed'
  | 'token_rotated';

// Profit-first allocation targets (percentages)
export const ALLOCATION_TARGETS: Record<string, number> = {
  owners_comp: 50,
  tax: 16,
  emergency: 15,
  opex: 10,
  profit: 5,
  generosity: 4,
};

// Bucket categories visible in the active treasury UI
export const ACTIVE_BUCKET_CATEGORIES: BucketCategory[] = [
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
];

// Deduplication confidence thresholds (0-100)
export const DEDUP_THRESHOLD_AUTO = 65;
export const DEDUP_THRESHOLD_PROBABLE = 40;

// Treasury session timeout in minutes
export const TREASURY_SESSION_TIMEOUT_MINUTES = 15;

// Minimum seconds between manual sync triggers
export const SYNC_COOLDOWN_SECONDS = 300;
