# Treasury: Financial Intelligence Command Center

**Date:** 2026-04-12
**Status:** Design approved, pending implementation
**Location:** `/admin/treasury/*` (admin-only, never visible to owners)

## Overview

Treasury is Parcel Co's financial command center. It connects to all 12 Relay bank accounts via Plaid and pulls Stripe payment data to give Johan a single, real-time view of the business's financial health. Built around the Profit First model with allocation tracking, subscription detection, savings goal projections, cash flow forecasting, and AI-powered insights.

## Why

Johan currently checks the Relay bank app manually to understand the state of the business finances. There is no unified view of income vs. expenses, no way to see if Profit First allocations are on track, no subscription tracking, and no forecasting. Treasury replaces that manual process with an intelligent, automated financial dashboard.

## Income Streams

1. **20% revenue split** from guest stays (paid out by Airbnb/VRBO/Hospitable into the Income Account)
2. **Technology fees** (monthly, via Stripe)
3. **Onboarding fees** (one-time, via Stripe)

Cleaning fees are moving off Parcel's responsibility (guest pays owner directly). The Cleaners account is being wound down.

## Bank Account Structure (Profit First)

12 Relay accounts. Allocations run twice monthly (1st and 15th). Income Account is the hub; excess distributes to buckets:

| Bucket | Type | Allocation | Status |
|--------|------|-----------|--------|
| Income Account | Checking | Hub (excess flows out) | Active |
| Owners Compensation | Checking | 50% | Active |
| Tax Account | Checking | 16% | Active |
| Emergency Account | Checking | 15% | Active |
| OPEX | Checking | 10% | Active |
| Profit Account | Savings | 5% | Active |
| Generosity Fund | Checking | 4% | Active |
| Growth Fund | Savings | -- | Manually funded |
| Cleaners | Checking | -- | Winding down |
| Yearly Expenses | Checking | -- | Manual / may be removed |
| Client Disbursement | Checking | -- | Manual / may be removed |
| Deposits Account | Checking | -- | Manually funded |

## Navigation

Treasury becomes its own section in the admin sidebar, placed between Operations and Communications. The Payouts link is removed from the sidebar (route remains accessible via direct URL for legacy access).

```
MANAGEMENT
  Overview
  Owners
  Properties

OPERATIONS
  Calendar
  Reservations

TREASURY
  Overview        /admin/treasury
  Accounts        /admin/treasury/accounts
  Transactions    /admin/treasury/transactions
  Forecast        /admin/treasury/forecast

COMMUNICATIONS
  Inquiries
  Messages
  ...
```

## Pages

### 1. Overview (`/admin/treasury`)

The daily financial snapshot. Command center layout: dense, everything visible without scrolling.

**Top bar:** "Treasury" title, last synced timestamp, "Sync Now" button (5 min cooldown), month selector dropdown.

**Stat cards row (4 across):**
- Total Cash (sum of all accounts, % change vs. last month)
- Monthly Income (revenue split + Stripe, source breakdown)
- Monthly Expenses (total outflows, % change vs. last month)
- Net Profit (income minus expenses, margin %)

**Two-column section:**

Left: **Profit First Allocation Health.** Each of the 6 active buckets shown with a progress bar comparing actual allocation % vs. target %. Color-coded: green = within 2% of target, amber = drifting (2-5% off), red = off track (>5% off).

Right: **Savings Goals.** Progress bars for each goal (Emergency Fund, Growth Fund, Deposits Reserve, etc.) with current amount, target amount, and projected completion date based on current deposit rate.

**Alerts section:** Chronological list of smart alerts:
- Allocation drift warnings
- New subscription detections
- Stripe/Plaid dedup confirmations
- Low balance warnings
- Unusual transaction flags
- Savings milestones
- Rebalancing suggestions

### 2. Accounts (`/admin/treasury/accounts`)

All 12 Relay accounts displayed as cards, grouped into two sections:

**Active Buckets:** The 7 accounts that are part of the allocation system. Each card shows: account name, type (checking/savings), current balance, sparkline trend (last 30 days), allocation target %. Click to drill into that account's transaction history.

**Other Accounts:** Growth Fund, Cleaners, Yearly Expenses, Client Disbursement, Deposits. Shown in a secondary section with a note about their status (winding down, manually funded, etc.).

**Stripe Revenue Card:** Separate card showing tech fee revenue and onboarding fee revenue from Stripe. Not a bank account, but presented alongside for full picture.

**Connect/Disconnect:** Plaid Link button to connect or reconnect bank accounts. Disconnect option per connection (with confirmation).

### 3. Transactions (`/admin/treasury/transactions`)

Unified transaction feed across all accounts.

**Filters:** Account selector, category dropdown, date range picker, amount range, search by merchant/description.

**Auto-categorization:** Each transaction tagged as one of: Revenue, Transfer, Subscription, Operating, Stripe Fee, Stripe Payout, Other.

**Subscription detection:** Recurring charges automatically identified and highlighted with a "Recurring" badge. Detection logic: same merchant + similar amount (within 10%) + regular interval (weekly/monthly/quarterly/annual) + at least 3 occurrences.

**Dedup display:** Stripe payout deposits show a "Matched" badge linking to the corresponding Stripe payout. Both records visible for transparency, but the duplicate is excluded from calculations.

**Monthly burn rate summary:** At the top of the page, show total subscriptions/month and total operating expenses/month.

### 4. Forecast (`/admin/treasury/forecast`)

Cash flow projections and scenario modeling.

**Confidence indicator:** Prominent display of data history depth. "Based on X months of data" with confidence level (low/medium/high). Low = less than 3 months, medium = 3 to 6 months, high = 6+ months.

**Projection chart:** 30/60/90-day cash flow projections. Line chart showing projected income, expenses, and net cash position. Shaded confidence band that narrows as data history grows.

**Savings goal projections:** For each active savings goal, show: "At current rate, you reach $X by [date]." If the goal has a target date, show whether you're ahead or behind pace.

**Rebalancing suggestions:** Actionable recommendations like "Move $171 from Income to Emergency to reach your 15% target." Based on current allocation drift.

**"What if" scenarios:** Adjustable inputs:
- "What if I add N more properties?" (estimate income increase based on average per-property revenue)
- "What if I change allocation percentages?" (show projected impact on each bucket)
- "What if income drops by X%?" (stress test)

**AI insights:** Claude Haiku-powered observations generated weekly. Examples: "Your OPEX spending has increased 12% over the last 3 months, primarily driven by software subscriptions." Stored in treasury_forecasts table, regenerated weekly.

## Data Sync

**Daily auto-sync (Vercel Cron Job):**
- Vercel Cron triggers `POST /api/treasury/sync` once per day at 6:00 AM ET
- Cron route protected by `CRON_SECRET` env var (Vercel auto-injects for cron requests)
- Pulls new transactions from Plaid using incremental sync (cursor-based)
- Pulls new charges and payouts from Stripe API
- Runs deduplication matching
- Updates account balances
- Triggers subscription detection
- Generates alerts for any anomalies
- Logs sync action to audit trail

**Manual "Sync Now" button:**
- Same logic as daily sync, triggered by admin click
- 5-minute cooldown between manual syncs
- Shows spinner and "Syncing..." state during execution
- Cooldown enforced server-side (not just UI)

**Plaid product usage:**
- **Transactions:** incremental sync via `/transactions/sync` (cursor-based, efficient)
- **Balance:** real-time balance check via `/accounts/balance/get`
- **Auth:** not needed (we don't need full account numbers)
- **Liabilities:** not needed (no debt tracking)

## Stripe + Plaid Deduplication

### The Problem

When Stripe pays out to the bank account, two records appear:
- Stripe sees: Payout of $380.00 to bank account
- Plaid sees: Deposit of $380.00 from "PARCELCO" or "STRIPE"

### Scored Matching Algorithm

Each candidate Plaid transaction is scored against each unmatched Stripe payout:

| Signal | Points | Reliability | Source |
|--------|--------|-------------|--------|
| Exact amount match (Stripe cents / 100 = Plaid dollars) | 40 | Always available | `payout.amount` vs. `transaction.amount` |
| Date within 2 business days of Stripe `arrival_date` | 25 | Always available | `payout.arrival_date` vs. `transaction.date` |
| `original_description` contains "PARCELCO" or "STRIPE" | 15 | High | `transaction.original_description` |
| Plaid `counterparties[].name` includes "Stripe" | 10 | Medium-High | `transaction.counterparties` |
| Bank account last4 matches Stripe destination last4 | 5 | Always available | `payout.destination.last4` vs. `account.mask` |
| `payment_meta.payment_processor` = "Stripe" | 5 | Medium | `transaction.payment_meta` |
| `payment_meta.reference_number` = Stripe `trace_id.value` | 5 | Low (often null) | Both fields bank-dependent |

**Note:** Stripe payout statement descriptor has been set to `PARCELCO` in Stripe Dashboard settings (done 2026-04-12).

### Thresholds

- **65+ points = Auto-match.** Amount + date + description alone = 80 points. High confidence.
- **40 to 64 points = Probable match.** Flagged for manual review in the Transactions page. Admin can confirm or dismiss.
- **Below 40 = No match.** Treated as independent transactions.

### Match Resolution

When a match is confirmed (auto or manual):
- The Plaid transaction is the primary record
- The Stripe transaction is stored with `is_duplicate = true` and `duplicate_of` pointing to the Plaid record
- Dashboard calculations exclude `is_duplicate = true` rows
- An info-level alert is created for transparency
- Both records remain visible in the Transactions page with a "Matched" badge

### Edge Cases

- **Multiple same-amount payouts on same day:** Matched by chronological order; remaining unmatched ones flagged as probable for manual review
- **Partial matches (2 of 3 tier-1 criteria):** Scored, flagged if 40-64, ignored if below 40
- **Stripe refunds:** Negative amounts matched against Plaid withdrawals using the same algorithm
- **Weekend/holiday delays:** The 2-business-day window accounts for ACH timing and bank processing delays
- **Stripe `trace_id` availability:** May take up to 10 days after payout is marked `paid`; dedup runs retroactively on subsequent syncs

## Security Model (12 Layers)

### Access Control (Layers 1-4)

**Layer 1: proxy.ts gate.** Any request to `/admin/treasury/*` checks auth session. No session = redirect to `/login`. Non-admin role = redirect to `/portal/dashboard`. Same pattern as all admin routes.

**Layer 2: Admin layout.tsx double-check.** Server Component verifies `profile.role === 'admin'` on every render. Redirects non-admins even if proxy is bypassed. Already exists.

**Layer 3: Re-authentication gate.** Entering Treasury requires password confirmation even with an active admin session. Sets a `treasury_verified_at` timestamp in a server-side httpOnly cookie (encrypted, SameSite=Strict). The cookie is checked on every Treasury page load and API call. Prevents "left my laptop open" exposure. Same pattern used by banks and GitHub for sensitive settings.

**Layer 4: API route admin verification.** Every `/api/treasury/*` endpoint independently checks admin role + `treasury_verified` flag before returning any data.

### Data Protection (Layers 5-8)

**Layer 5: Supabase RLS.** All `treasury_*` tables have Row Level Security policies that only allow access when `is_parcel_co_admin()` returns true.

**Layer 6: Encrypted secrets at rest.** Plaid access tokens encrypted via pgcrypto (AES-256) in `treasury_connections`. Decryption key stored as `TREASURY_ENCRYPTION_KEY` in Doppler, never in the database. Decryption only server-side in API route handlers.

**Layer 7: Data minimization.** Only masked account numbers stored (last 4 digits via Plaid's `mask` field). Full account numbers and routing numbers are never persisted. We store the minimum data needed for features to work.

**Layer 8: Plaid token rotation.** Access tokens rotated automatically every 30 days during the daily sync cron. Old token invalidated, new one encrypted and stored. Even if a token leaked, it expires within a month.

### Monitoring & Defense (Layers 9-12)

**Layer 9: Audit trail.** `treasury_audit_log` table records every action: page views, data syncs, Plaid Link sessions, account connects/disconnects, forecast runs, re-auth attempts. Logs user ID, IP address, user agent, timestamp, and action type. Immutable: insert-only RLS policy, no updates or deletes.

**Layer 10: Treasury session timeout.** The `treasury_verified` flag expires after 15 minutes of inactivity. After expiry, password re-entry required to continue viewing Treasury. Regular admin session stays alive for other pages.

**Layer 11: Rate limiting.** Treasury API routes: max 60 requests per minute per session. Sync endpoint: max 1 request per 5 minutes. Failed re-auth attempts: locked for 10 minutes after 5 failures. All enforced server-side.

**Layer 12: Webhook signature verification + CSP headers.** Plaid webhook endpoint cryptographically verifies JWT signatures using Plaid's public key before processing any event. Treasury pages serve strict Content Security Policy headers: no inline scripts, restricted fetch origins, no eval.

### Owner Visibility

**None. Zero. Never.**

- No Treasury link in portal sidebar
- No Treasury routes in portal route group
- No financial data in any portal API response
- RLS prevents accidental data leaks at the database level
- Five independent layers would need to fail simultaneously for any data exposure

## Supabase Schema (8 New Tables)

### treasury_connections
One row per Plaid Item (bank connection).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| plaid_item_id | text | unique, from Plaid |
| access_token_encrypted | bytea | AES-256 encrypted via pgcrypto |
| institution_name | text | e.g. "Relay" |
| institution_id | text | Plaid institution ID |
| status | text | 'active', 'stale', 'disconnected' |
| last_synced_at | timestamptz | |
| cursor | text | Plaid sync cursor for incremental fetches |
| token_rotated_at | timestamptz | Last token rotation date |
| created_at | timestamptz | default now() |

### treasury_accounts
One row per bank account (12 for Relay).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| connection_id | uuid | FK to treasury_connections |
| plaid_account_id | text | unique, from Plaid |
| name | text | e.g. "Income Account" |
| official_name | text | Bank's official name |
| mask | text | Last 4 digits only |
| type | text | 'checking' or 'savings' |
| current_balance | numeric | |
| available_balance | numeric | |
| bucket_category | text | income, owners_comp, tax, emergency, opex, profit, generosity, growth, cleaners, yearly, disbursement, deposits, uncategorized |
| allocation_target_pct | numeric | nullable, e.g. 50 for Owners Comp |
| is_active | boolean | false for winding-down accounts |
| balance_updated_at | timestamptz | |
| created_at | timestamptz | |

### treasury_transactions
Main transaction ledger. All Plaid and Stripe transactions.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| account_id | uuid | FK to treasury_accounts |
| plaid_transaction_id | text | unique, nullable (null for Stripe-only) |
| stripe_charge_id | text | unique, nullable (null for Plaid-only) |
| date | date | Posted date |
| amount | numeric | positive = money in, negative = money out |
| merchant_name | text | |
| description | text | |
| original_description | text | Raw bank description (for dedup matching) |
| category | text | revenue, transfer, subscription, operating, stripe_fee, stripe_payout, other |
| source | text | 'plaid' or 'stripe' |
| is_duplicate | boolean | default false |
| duplicate_of | uuid | nullable, FK to self |
| dedup_score | integer | nullable, match score (0-100) |
| plaid_category | text[] | Plaid's category tree |
| counterparties | jsonb | Plaid counterparties array |
| payment_meta | jsonb | Plaid payment metadata |
| pending | boolean | |
| created_at | timestamptz | |

**Indexes:** (account_id, date), (merchant_name, amount, date) for dedup, (category), (source, is_duplicate)

### treasury_subscriptions
Auto-detected recurring charges.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| account_id | uuid | FK to treasury_accounts |
| merchant_name | text | |
| typical_amount | numeric | |
| frequency | text | weekly, monthly, quarterly, annual |
| last_charged_at | date | |
| next_expected_at | date | |
| is_active | boolean | |
| total_annual_cost | numeric | Computed from amount * frequency |
| created_at | timestamptz | |

### treasury_savings_goals
Target amounts per account.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| account_id | uuid | FK to treasury_accounts |
| name | text | e.g. "Emergency Fund Target" |
| target_amount | numeric | |
| target_date | date | nullable |
| is_active | boolean | |
| created_at | timestamptz | |

### treasury_forecasts
Cached AI forecast snapshots.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| generated_at | timestamptz | |
| period_days | integer | 30, 60, or 90 |
| confidence_level | text | low, medium, high |
| data_months_available | integer | |
| projected_income | numeric | |
| projected_expenses | numeric | |
| projected_net | numeric | |
| account_projections | jsonb | Per-bucket forecasts |
| insights | jsonb | AI-generated observations |
| model_used | text | e.g. "claude-haiku-4-5" |
| created_at | timestamptz | |

### treasury_alerts
Smart notifications.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| type | text | low_balance, allocation_drift, new_subscription, unusual_transaction, dedup_match, savings_milestone, rebalance_suggestion |
| severity | text | info, warning, critical |
| title | text | |
| message | text | |
| metadata | jsonb | |
| acknowledged_at | timestamptz | nullable |
| created_at | timestamptz | |

### treasury_audit_log
Immutable security log.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK to profiles |
| action | text | page_view, data_sync, plaid_link_start, plaid_link_complete, account_disconnect, forecast_run, settings_change, reauth_success, reauth_failure |
| resource_type | text | nullable |
| resource_id | uuid | nullable |
| ip_address | inet | |
| user_agent | text | |
| metadata | jsonb | |
| created_at | timestamptz | |

**RLS:** Insert-only for admin. No UPDATE or DELETE policies.

## Payouts Page Deprecation

The existing `/admin/payouts` page is being retired. Hospitable is the single source of truth for guest reservations and revenue. The Payouts link is removed from the admin sidebar. The route and page remain accessible via direct URL (`/admin/payouts`) for legacy reference but are not linked from anywhere in the UI.

## Environment Variables Required

| Variable | Location | Purpose |
|----------|----------|---------|
| PLAID_CLIENT_ID | Doppler (dev) | Plaid API client identifier |
| PLAID_SB_SECRET | Doppler (dev) | Plaid Sandbox secret key |
| PLAID_ENV | Doppler (dev, to add) | "sandbox" now, "production" later |
| STRIPE_SECRET_KEY | Doppler (prd) | Already exists, read-only for Treasury |
| TREASURY_ENCRYPTION_KEY | Doppler (to add) | AES-256 key for Plaid token encryption |
| CRON_SECRET | Vercel (auto) | Vercel-injected secret for cron job auth |

## Dependencies (npm packages)

- `plaid` (official Plaid Node.js client)
- `stripe` (official Stripe Node.js client, may already be installed)
- No other external dependencies

## PostHog Integration

Treasury actions (page views, syncs, forecast runs) should emit PostHog events for analytics. No PII in event properties. Track: feature adoption, sync frequency, forecast usage, alert acknowledgment rates.
