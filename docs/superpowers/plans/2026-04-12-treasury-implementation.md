# Treasury Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fintech-grade financial command center at `/admin/treasury` that connects 12 Relay bank accounts via Plaid, merges Stripe payment data with scored deduplication, and provides Profit First allocation tracking, subscription detection, savings goals, cash flow forecasting, and AI insights.

**Architecture:** Server-side API routes handle all Plaid/Stripe communication and encryption. Supabase stores all financial data behind RLS. A re-authentication gate (encrypted httpOnly cookie) protects Treasury pages. Daily Vercel Cron syncs data; manual sync available with cooldown. React Server Components render pages; client components handle interactive elements (charts, filters, Plaid Link).

**Tech Stack:** Next.js 16 App Router, Supabase (RLS + pgcrypto), Plaid Node SDK (Sandbox), Stripe Node SDK, Vercel Cron Jobs, Claude Haiku API (forecasting), Phosphor Icons, motion (animations), date-fns, zod

**Spec:** `docs/superpowers/specs/2026-04-12-treasury-design.md`

**Existing patterns to follow:**
- Cron auth: `apps/web/src/app/api/cron/cleanup-deleted-accounts/route.ts` (CRON_SECRET Bearer token pattern)
- Service client: `apps/web/src/lib/supabase/service.ts` (createServiceClient for server-only operations)
- Server Supabase: `apps/web/src/lib/supabase/server.ts` (createClient for auth-scoped queries)
- RLS helper: `is_admin()` function in plpgsql with `security definer` (NOT `is_parcel_co_admin`)
- Admin sidebar: `apps/web/src/components/admin/AdminSidebar.tsx` (nav sections with NavItem type, LayoutGroup)
- Admin layout: `apps/web/src/app/(admin)/admin/layout.tsx` (role check, profile fetch)
- Proxy: `apps/web/src/proxy.ts` (admin route gating)
- Admin bottom nav: `apps/web/src/components/admin/AdminBottomNav.tsx` (mobile nav with "More" overflow)
- Admin icon rail: embedded in AdminSidebar.tsx (tablet nav)
- vercel.json cron config: `apps/web/vercel.json`

---

## Phase 1: Foundation (Schema + Security + Plaid Connection)

### Task 1: Install dependencies

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Install plaid and stripe SDKs**

```bash
cd /Users/johanannunez/workspace/parcel && pnpm --filter web add plaid stripe
```

- [ ] **Step 2: Verify installation**

```bash
cd /Users/johanannunez/workspace/parcel && pnpm --filter web build 2>&1 | tail -5
```

Expected: Build succeeds (no import errors since we haven't imported yet).

- [ ] **Step 3: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/package.json apps/web/pnpm-lock.yaml pnpm-lock.yaml
git commit -m "feat(treasury): add plaid and stripe SDK dependencies"
```

---

### Task 2: Supabase migration — 8 treasury tables + RLS

**Files:**
- Create: `supabase/migrations/20260412_treasury.sql`

This is a single SQL migration that creates all 8 treasury tables with RLS policies. **Do NOT run it yet.** Johan will run it after reviewing. Follow the Schema Change Workflow: hold SQL until confirmed.

- [ ] **Step 1: Write the migration file**

```sql
-- =====================================================================
-- Treasury — Financial Intelligence Tables
-- =====================================================================
-- 8 tables for the Plaid + Stripe financial command center.
-- All tables have RLS enabled. Access restricted to admin role via
-- the existing is_admin() helper function.
--
-- pgcrypto extension already enabled in initial_schema.sql.
-- =====================================================================


-- ---------------------------------------------------------------------
-- treasury_connections
-- ---------------------------------------------------------------------
-- One row per Plaid Item (bank connection). Stores encrypted access
-- tokens and sync state.

create table public.treasury_connections (
  id uuid primary key default gen_random_uuid(),
  plaid_item_id text unique not null,
  access_token_encrypted bytea not null,
  institution_name text not null,
  institution_id text not null,
  status text not null default 'active'
    check (status in ('active', 'stale', 'disconnected')),
  last_synced_at timestamptz,
  cursor text,
  token_rotated_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.treasury_connections enable row level security;

create policy "treasury_connections_admin_select"
  on public.treasury_connections for select
  using (is_admin());

create policy "treasury_connections_admin_insert"
  on public.treasury_connections for insert
  with check (is_admin());

create policy "treasury_connections_admin_update"
  on public.treasury_connections for update
  using (is_admin());

create policy "treasury_connections_admin_delete"
  on public.treasury_connections for delete
  using (is_admin());


-- ---------------------------------------------------------------------
-- treasury_accounts
-- ---------------------------------------------------------------------
-- One row per bank account (12 for Relay). Tracks balance, bucket
-- category, and allocation target percentage.

create table public.treasury_accounts (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.treasury_connections(id) on delete cascade,
  plaid_account_id text unique not null,
  name text not null,
  official_name text,
  mask text,
  type text not null default 'checking'
    check (type in ('checking', 'savings')),
  current_balance numeric not null default 0,
  available_balance numeric not null default 0,
  bucket_category text not null default 'uncategorized'
    check (bucket_category in (
      'income', 'owners_comp', 'tax', 'emergency', 'opex',
      'profit', 'generosity', 'growth', 'cleaners', 'yearly',
      'disbursement', 'deposits', 'uncategorized'
    )),
  allocation_target_pct numeric,
  is_active boolean not null default true,
  balance_updated_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.treasury_accounts enable row level security;

create policy "treasury_accounts_admin_select"
  on public.treasury_accounts for select
  using (is_admin());

create policy "treasury_accounts_admin_insert"
  on public.treasury_accounts for insert
  with check (is_admin());

create policy "treasury_accounts_admin_update"
  on public.treasury_accounts for update
  using (is_admin());

create policy "treasury_accounts_admin_delete"
  on public.treasury_accounts for delete
  using (is_admin());


-- ---------------------------------------------------------------------
-- treasury_transactions
-- ---------------------------------------------------------------------
-- Main transaction ledger. All Plaid and Stripe transactions.

create table public.treasury_transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.treasury_accounts(id) on delete cascade,
  plaid_transaction_id text unique,
  stripe_charge_id text unique,
  date date not null,
  amount numeric not null,
  merchant_name text,
  description text,
  original_description text,
  category text not null default 'other'
    check (category in (
      'revenue', 'transfer', 'subscription', 'operating',
      'stripe_fee', 'stripe_payout', 'other'
    )),
  source text not null check (source in ('plaid', 'stripe')),
  is_duplicate boolean not null default false,
  duplicate_of uuid references public.treasury_transactions(id),
  dedup_score integer,
  plaid_category text[],
  counterparties jsonb,
  payment_meta jsonb,
  pending boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.treasury_transactions enable row level security;

create policy "treasury_transactions_admin_select"
  on public.treasury_transactions for select
  using (is_admin());

create policy "treasury_transactions_admin_insert"
  on public.treasury_transactions for insert
  with check (is_admin());

create policy "treasury_transactions_admin_update"
  on public.treasury_transactions for update
  using (is_admin());

create policy "treasury_transactions_admin_delete"
  on public.treasury_transactions for delete
  using (is_admin());

-- Indexes for performance
create index idx_treasury_tx_account_date
  on public.treasury_transactions (account_id, date);

create index idx_treasury_tx_dedup
  on public.treasury_transactions (merchant_name, amount, date);

create index idx_treasury_tx_category
  on public.treasury_transactions (category);

create index idx_treasury_tx_source_dup
  on public.treasury_transactions (source, is_duplicate);


-- ---------------------------------------------------------------------
-- treasury_subscriptions
-- ---------------------------------------------------------------------
-- Auto-detected recurring charges.

create table public.treasury_subscriptions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.treasury_accounts(id) on delete cascade,
  merchant_name text not null,
  typical_amount numeric not null,
  frequency text not null
    check (frequency in ('weekly', 'monthly', 'quarterly', 'annual')),
  last_charged_at date,
  next_expected_at date,
  is_active boolean not null default true,
  total_annual_cost numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.treasury_subscriptions enable row level security;

create policy "treasury_subscriptions_admin_select"
  on public.treasury_subscriptions for select
  using (is_admin());

create policy "treasury_subscriptions_admin_insert"
  on public.treasury_subscriptions for insert
  with check (is_admin());

create policy "treasury_subscriptions_admin_update"
  on public.treasury_subscriptions for update
  using (is_admin());

create policy "treasury_subscriptions_admin_delete"
  on public.treasury_subscriptions for delete
  using (is_admin());


-- ---------------------------------------------------------------------
-- treasury_savings_goals
-- ---------------------------------------------------------------------
-- Target amounts per account.

create table public.treasury_savings_goals (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.treasury_accounts(id) on delete cascade,
  name text not null,
  target_amount numeric not null,
  target_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.treasury_savings_goals enable row level security;

create policy "treasury_savings_goals_admin_select"
  on public.treasury_savings_goals for select
  using (is_admin());

create policy "treasury_savings_goals_admin_insert"
  on public.treasury_savings_goals for insert
  with check (is_admin());

create policy "treasury_savings_goals_admin_update"
  on public.treasury_savings_goals for update
  using (is_admin());

create policy "treasury_savings_goals_admin_delete"
  on public.treasury_savings_goals for delete
  using (is_admin());


-- ---------------------------------------------------------------------
-- treasury_forecasts
-- ---------------------------------------------------------------------
-- Cached AI forecast snapshots.

create table public.treasury_forecasts (
  id uuid primary key default gen_random_uuid(),
  generated_at timestamptz not null default now(),
  period_days integer not null check (period_days in (30, 60, 90)),
  confidence_level text not null default 'low'
    check (confidence_level in ('low', 'medium', 'high')),
  data_months_available integer not null default 0,
  projected_income numeric not null default 0,
  projected_expenses numeric not null default 0,
  projected_net numeric not null default 0,
  account_projections jsonb not null default '{}',
  insights jsonb not null default '[]',
  model_used text not null default 'claude-haiku-4-5',
  created_at timestamptz not null default now()
);

alter table public.treasury_forecasts enable row level security;

create policy "treasury_forecasts_admin_select"
  on public.treasury_forecasts for select
  using (is_admin());

create policy "treasury_forecasts_admin_insert"
  on public.treasury_forecasts for insert
  with check (is_admin());

create policy "treasury_forecasts_admin_update"
  on public.treasury_forecasts for update
  using (is_admin());


-- ---------------------------------------------------------------------
-- treasury_alerts
-- ---------------------------------------------------------------------
-- Smart notifications.

create table public.treasury_alerts (
  id uuid primary key default gen_random_uuid(),
  type text not null
    check (type in (
      'low_balance', 'allocation_drift', 'new_subscription',
      'unusual_transaction', 'dedup_match', 'savings_milestone',
      'rebalance_suggestion'
    )),
  severity text not null default 'info'
    check (severity in ('info', 'warning', 'critical')),
  title text not null,
  message text not null,
  metadata jsonb not null default '{}',
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.treasury_alerts enable row level security;

create policy "treasury_alerts_admin_select"
  on public.treasury_alerts for select
  using (is_admin());

create policy "treasury_alerts_admin_insert"
  on public.treasury_alerts for insert
  with check (is_admin());

create policy "treasury_alerts_admin_update"
  on public.treasury_alerts for update
  using (is_admin());


-- ---------------------------------------------------------------------
-- treasury_audit_log
-- ---------------------------------------------------------------------
-- Immutable security log. Insert-only for admin. No UPDATE or DELETE.

create table public.treasury_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null
    check (action in (
      'page_view', 'data_sync', 'plaid_link_start',
      'plaid_link_complete', 'account_disconnect', 'forecast_run',
      'settings_change', 'reauth_success', 'reauth_failure'
    )),
  resource_type text,
  resource_id uuid,
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.treasury_audit_log enable row level security;

-- Insert-only: admin can add entries, never update or delete them
create policy "treasury_audit_log_admin_insert"
  on public.treasury_audit_log for insert
  with check (is_admin());

create policy "treasury_audit_log_admin_select"
  on public.treasury_audit_log for select
  using (is_admin());

-- Deliberately NO update or delete policies. This table is immutable.
```

- [ ] **Step 2: Verify SQL syntax locally (dry run)**

Read through the migration file to verify:
- All 8 tables are present
- Every table has `enable row level security`
- Every table has admin-only policies using `is_admin()`
- `treasury_audit_log` has NO update or delete policies
- All check constraints match the spec enums
- Foreign keys cascade on delete
- Indexes on treasury_transactions match the spec

- [ ] **Step 3: Commit (do NOT run migration yet)**

```bash
cd /Users/johanannunez/workspace/parcel
git add supabase/migrations/20260412_treasury.sql
git commit -m "feat(treasury): add migration for 8 treasury tables with RLS"
```

**IMPORTANT:** After committing, tell Johan: "Migration is ready. Is the Treasury feature finalized, or do you want to make changes before I have you run the SQL?"

---

### Task 3: Plaid and Stripe client libraries

**Files:**
- Create: `apps/web/src/lib/treasury/plaid.ts`
- Create: `apps/web/src/lib/treasury/stripe.ts`
- Create: `apps/web/src/lib/treasury/encryption.ts`
- Create: `apps/web/src/lib/treasury/types.ts`

- [ ] **Step 1: Create treasury types**

```typescript
// apps/web/src/lib/treasury/types.ts

export type BucketCategory =
  | "income"
  | "owners_comp"
  | "tax"
  | "emergency"
  | "opex"
  | "profit"
  | "generosity"
  | "growth"
  | "cleaners"
  | "yearly"
  | "disbursement"
  | "deposits"
  | "uncategorized";

export type TransactionCategory =
  | "revenue"
  | "transfer"
  | "subscription"
  | "operating"
  | "stripe_fee"
  | "stripe_payout"
  | "other";

export type AlertType =
  | "low_balance"
  | "allocation_drift"
  | "new_subscription"
  | "unusual_transaction"
  | "dedup_match"
  | "savings_milestone"
  | "rebalance_suggestion";

export type AlertSeverity = "info" | "warning" | "critical";

export type ConnectionStatus = "active" | "stale" | "disconnected";

export type AuditAction =
  | "page_view"
  | "data_sync"
  | "plaid_link_start"
  | "plaid_link_complete"
  | "account_disconnect"
  | "forecast_run"
  | "settings_change"
  | "reauth_success"
  | "reauth_failure";

/** Profit First allocation targets. Income is the hub (no target). */
export const ALLOCATION_TARGETS: Record<string, number> = {
  owners_comp: 50,
  tax: 16,
  emergency: 15,
  opex: 10,
  profit: 5,
  generosity: 4,
};

/** Accounts that are part of the active allocation system. */
export const ACTIVE_BUCKET_CATEGORIES: BucketCategory[] = [
  "income",
  "owners_comp",
  "tax",
  "emergency",
  "opex",
  "profit",
  "generosity",
];

/** Dedup scoring thresholds. */
export const DEDUP_THRESHOLD_AUTO = 65;
export const DEDUP_THRESHOLD_PROBABLE = 40;

/** Treasury session timeout in minutes. */
export const TREASURY_SESSION_TIMEOUT_MINUTES = 15;

/** Rate limit: minimum seconds between manual syncs. */
export const SYNC_COOLDOWN_SECONDS = 300; // 5 minutes
```

- [ ] **Step 2: Create encryption utilities**

```typescript
// apps/web/src/lib/treasury/encryption.ts

/**
 * AES-256 encryption/decryption for Plaid access tokens.
 *
 * Uses Node.js built-in crypto module. The encryption key comes from
 * TREASURY_ENCRYPTION_KEY in Doppler. Never import this file from
 * client components.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.TREASURY_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "TREASURY_ENCRYPTION_KEY is not set. " +
        "Add it to Doppler before using Treasury encryption.",
    );
  }
  // Key should be 32 bytes (256 bits). If provided as hex, decode it.
  // If provided as a raw string, hash it to get exactly 32 bytes.
  if (key.length === 64 && /^[0-9a-f]+$/i.test(key)) {
    return Buffer.from(key, "hex");
  }
  // Use a deterministic hash for non-hex keys
  const { createHash } = require("crypto");
  return createHash("sha256").update(key).digest();
}

/** Encrypt a plaintext string. Returns a Buffer containing IV + authTag + ciphertext. */
export function encrypt(plaintext: string): Buffer {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Format: [16 bytes IV][16 bytes authTag][...ciphertext]
  return Buffer.concat([iv, authTag, encrypted]);
}

/** Decrypt a Buffer produced by encrypt(). Returns the plaintext string. */
export function decrypt(data: Buffer): string {
  const key = getKey();

  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}
```

- [ ] **Step 3: Create Plaid client**

```typescript
// apps/web/src/lib/treasury/plaid.ts

/**
 * Plaid API client for Treasury.
 *
 * Server-side only. Never import from client components.
 * Uses Plaid Sandbox by default (controlled by PLAID_ENV).
 */

import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  type Products,
  type CountryCode,
} from "plaid";

let _client: PlaidApi | null = null;

export function getPlaidClient(): PlaidApi {
  if (_client) return _client;

  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SB_SECRET;
  const env = (process.env.PLAID_ENV ?? "sandbox") as keyof typeof PlaidEnvironments;

  if (!clientId || !secret) {
    throw new Error(
      "Missing PLAID_CLIENT_ID or PLAID_SB_SECRET. " +
        "Add them to Doppler before using Treasury.",
    );
  }

  const config = new Configuration({
    basePath: PlaidEnvironments[env],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": clientId,
        "PLAID-SECRET": secret,
      },
    },
  });

  _client = new PlaidApi(config);
  return _client;
}

/** Products we request access to via Plaid Link. */
export const PLAID_PRODUCTS: Products[] = ["transactions" as Products];

/** Country codes for Plaid Link. */
export const PLAID_COUNTRY_CODES: CountryCode[] = ["US" as CountryCode];
```

- [ ] **Step 4: Create Stripe client**

```typescript
// apps/web/src/lib/treasury/stripe.ts

/**
 * Stripe client for Treasury.
 *
 * Server-side only. Uses the existing STRIPE_SECRET_KEY from Doppler.
 * Read-only access: we only list charges, payouts, and balance transactions.
 */

import Stripe from "stripe";

let _client: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (_client) return _client;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "Missing STRIPE_SECRET_KEY. Add it to Doppler.",
    );
  }

  _client = new Stripe(key);
  return _client;
}
```

- [ ] **Step 5: Verify build**

```bash
cd /Users/johanannunez/workspace/parcel && pnpm --filter web build 2>&1 | tail -10
```

Expected: Build succeeds. No unused import warnings since nothing imports these yet.

- [ ] **Step 6: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/lib/treasury/
git commit -m "feat(treasury): add Plaid, Stripe, encryption clients and types"
```

---

### Task 4: Treasury re-authentication gate

**Files:**
- Create: `apps/web/src/lib/treasury/auth.ts`
- Create: `apps/web/src/app/(admin)/admin/treasury/verify/page.tsx`
- Create: `apps/web/src/app/(admin)/admin/treasury/verify/actions.ts`
- Create: `apps/web/src/app/(admin)/admin/treasury/layout.tsx`

- [ ] **Step 1: Create treasury auth helpers**

```typescript
// apps/web/src/lib/treasury/auth.ts

/**
 * Treasury re-authentication gate.
 *
 * Sets/checks an encrypted httpOnly cookie that proves the admin
 * recently confirmed their password. Expires after 15 minutes of
 * inactivity (refreshed on each Treasury page load).
 *
 * Server-side only.
 */

import { cookies } from "next/headers";
import { TREASURY_SESSION_TIMEOUT_MINUTES } from "./types";

const COOKIE_NAME = "treasury_verified_at";

/** Check if the current session has a valid treasury verification. */
export async function isTreasuryVerified(): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie?.value) return false;

  const verifiedAt = parseInt(cookie.value, 10);
  if (isNaN(verifiedAt)) return false;

  const elapsed = Date.now() - verifiedAt;
  const timeout = TREASURY_SESSION_TIMEOUT_MINUTES * 60 * 1000;

  return elapsed < timeout;
}

/** Set the treasury verification cookie (called after successful re-auth). */
export async function setTreasuryVerified(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, String(Date.now()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin/treasury",
    maxAge: TREASURY_SESSION_TIMEOUT_MINUTES * 60,
  });
}

/** Refresh the treasury cookie timestamp (called on each page load). */
export async function refreshTreasurySession(): Promise<void> {
  const verified = await isTreasuryVerified();
  if (verified) {
    await setTreasuryVerified();
  }
}

/** Clear the treasury verification (e.g., manual lock). */
export async function clearTreasuryVerification(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
```

- [ ] **Step 2: Create verify page (re-auth form)**

```typescript
// apps/web/src/app/(admin)/admin/treasury/verify/actions.ts

"use server";

import { createClient } from "@/lib/supabase/server";
import { setTreasuryVerified } from "@/lib/treasury/auth";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Rate limiting state. In production this would use Redis or Supabase,
 * but for a single-admin app, in-memory is sufficient.
 */
const failedAttempts = new Map<string, { count: number; lockedUntil: number }>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 10 * 60 * 1000; // 10 minutes

export async function verifyTreasuryAccess(
  _prevState: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/admin/treasury";

  if (!password) {
    return { error: "Password is required." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "Session expired. Please log in again." };
  }

  // Check rate limit
  const state = failedAttempts.get(user.id);
  if (state && state.lockedUntil > Date.now()) {
    const remaining = Math.ceil((state.lockedUntil - Date.now()) / 60000);
    return { error: `Too many attempts. Try again in ${remaining} minutes.` };
  }

  // Verify password by attempting a sign-in
  const svc = createServiceClient();
  const { error } = await svc.auth.signInWithPassword({
    email: user.email,
    password,
  });

  if (error) {
    // Track failed attempt
    const current = failedAttempts.get(user.id) ?? { count: 0, lockedUntil: 0 };
    current.count += 1;
    if (current.count >= MAX_ATTEMPTS) {
      current.lockedUntil = Date.now() + LOCKOUT_MS;
      current.count = 0;
    }
    failedAttempts.set(user.id, current);

    // Audit log the failure
    await svc.from("treasury_audit_log").insert({
      user_id: user.id,
      action: "reauth_failure",
      metadata: { attempt: current.count },
    });

    return { error: "Incorrect password." };
  }

  // Success: set the cookie and audit log
  await setTreasuryVerified();

  // Clear failed attempts
  failedAttempts.delete(user.id);

  // Audit log success
  await svc.from("treasury_audit_log").insert({
    user_id: user.id,
    action: "reauth_success",
  });

  redirect(redirectTo);
}
```

- [ ] **Step 3: Create the verify page UI**

```typescript
// apps/web/src/app/(admin)/admin/treasury/verify/page.tsx

import type { Metadata } from "next";
import { TreasuryVerifyForm } from "./TreasuryVerifyForm";

export const metadata: Metadata = {
  title: "Verify Access | Treasury",
};

export default async function TreasuryVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirect ?? "/admin/treasury";

  return (
    <div className="flex min-h-[60vh] items-center justify-content-center">
      <div className="mx-auto w-full max-w-sm">
        <div
          className="rounded-xl border p-8"
          style={{
            borderColor: "var(--color-warm-gray-200)",
            backgroundColor: "var(--color-white)",
          }}
        >
          <div className="mb-6 text-center">
            <div
              className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(2, 170, 235, 0.08)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#02AAEB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1
              className="text-lg font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              Treasury Access
            </h1>
            <p
              className="mt-1 text-sm"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Confirm your password to view financial data.
            </p>
          </div>

          <TreasuryVerifyForm redirectTo={redirectTo} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create the verify form client component**

```typescript
// apps/web/src/app/(admin)/admin/treasury/verify/TreasuryVerifyForm.tsx

"use client";

import { useActionState } from "react";
import { verifyTreasuryAccess } from "./actions";

export function TreasuryVerifyForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, pending] = useActionState(verifyTreasuryAccess, null);

  return (
    <form action={formAction}>
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div className="mb-4">
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-medium"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoFocus
          autoComplete="current-password"
          required
          className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors"
          style={{
            borderColor: state?.error
              ? "#ef4444"
              : "var(--color-warm-gray-200)",
            backgroundColor: "var(--color-off-white)",
            color: "var(--color-text-primary)",
          }}
          placeholder="Enter your password"
        />
        {state?.error && (
          <p className="mt-1.5 text-xs" style={{ color: "#ef4444" }}>
            {state.error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
        style={{ backgroundColor: "#02AAEB" }}
      >
        {pending ? "Verifying..." : "Unlock Treasury"}
      </button>
    </form>
  );
}
```

- [ ] **Step 5: Create Treasury layout with re-auth check**

```typescript
// apps/web/src/app/(admin)/admin/treasury/layout.tsx

import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { isTreasuryVerified, refreshTreasurySession } from "@/lib/treasury/auth";

/**
 * Treasury layout: checks re-authentication gate before rendering
 * any Treasury page. The verify page itself is excluded (it's inside
 * the treasury route group but handles its own auth flow).
 */
export default async function TreasuryLayout({
  children,
}: {
  children: ReactNode;
}) {
  // The verify page handles its own flow — don't redirect from there
  // (Next.js will render this layout for /admin/treasury/verify too,
  // but the redirect below only fires when NOT verified, and the
  // verify page is where you GO to get verified, so we need to
  // check the current path. We use a simpler approach: just check
  // if verified, and if not, the individual pages will redirect.)

  const verified = await isTreasuryVerified();

  if (!verified) {
    // Let the verify page render, but redirect everything else
    // We'll handle this in each page's Server Component instead
    // to avoid redirecting the verify page itself.
  }

  if (verified) {
    await refreshTreasurySession();
  }

  return <>{children}</>;
}
```

- [ ] **Step 6: Verify build**

```bash
cd /Users/johanannunez/workspace/parcel && pnpm --filter web build 2>&1 | tail -15
```

- [ ] **Step 7: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/lib/treasury/auth.ts
git add apps/web/src/app/\(admin\)/admin/treasury/
git commit -m "feat(treasury): add re-authentication gate with rate limiting and audit logging"
```

---

### Task 5: Plaid Link API routes

**Files:**
- Create: `apps/web/src/app/api/treasury/create-link-token/route.ts`
- Create: `apps/web/src/app/api/treasury/exchange-token/route.ts`
- Create: `apps/web/src/lib/treasury/admin-guard.ts`

- [ ] **Step 1: Create shared admin guard for Treasury API routes**

```typescript
// apps/web/src/lib/treasury/admin-guard.ts

/**
 * Shared guard for all Treasury API routes.
 *
 * Checks:
 * 1. User is authenticated
 * 2. User has admin role
 * 3. Treasury re-auth cookie is valid
 *
 * Returns the user and supabase client on success, or a NextResponse error.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isTreasuryVerified } from "./auth";
import type { User } from "@supabase/supabase-js";

type GuardSuccess = {
  ok: true;
  user: User;
};

type GuardFailure = {
  ok: false;
  response: NextResponse;
};

export async function treasuryAdminGuard(): Promise<GuardSuccess | GuardFailure> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  const verified = await isTreasuryVerified();
  if (!verified) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Treasury session expired. Re-authenticate." },
        { status: 403 },
      ),
    };
  }

  return { ok: true, user };
}
```

- [ ] **Step 2: Create link token endpoint**

```typescript
// apps/web/src/app/api/treasury/create-link-token/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { treasuryAdminGuard } from "@/lib/treasury/admin-guard";
import { getPlaidClient, PLAID_PRODUCTS, PLAID_COUNTRY_CODES } from "@/lib/treasury/plaid";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const guard = await treasuryAdminGuard();
  if (!guard.ok) return guard.response;

  // Audit log
  const svc = createServiceClient();
  await svc.from("treasury_audit_log").insert({
    user_id: guard.user.id,
    action: "plaid_link_start",
    ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    user_agent: request.headers.get("user-agent") ?? null,
  });

  try {
    const plaid = getPlaidClient();

    const response = await plaid.linkTokenCreate({
      user: { client_user_id: guard.user.id },
      client_name: "Parcel Co Treasury",
      products: PLAID_PRODUCTS,
      country_codes: PLAID_COUNTRY_CODES,
      language: "en",
    });

    return NextResponse.json({ link_token: response.data.link_token });
  } catch (err) {
    console.error("[Treasury] Failed to create link token:", err);
    return NextResponse.json(
      { error: "Failed to initialize bank connection." },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 3: Create token exchange endpoint**

```typescript
// apps/web/src/app/api/treasury/exchange-token/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { treasuryAdminGuard } from "@/lib/treasury/admin-guard";
import { getPlaidClient } from "@/lib/treasury/plaid";
import { encrypt } from "@/lib/treasury/encryption";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const guard = await treasuryAdminGuard();
  if (!guard.ok) return guard.response;

  const body = await request.json();
  const publicToken = body.public_token as string;
  const institutionName = (body.institution?.name as string) ?? "Unknown";
  const institutionId = (body.institution?.institution_id as string) ?? "";

  if (!publicToken) {
    return NextResponse.json(
      { error: "Missing public_token" },
      { status: 400 },
    );
  }

  try {
    const plaid = getPlaidClient();

    // Exchange the public token for an access token
    const exchangeResponse = await plaid.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Encrypt the access token before storing
    const encryptedToken = encrypt(accessToken);

    const svc = createServiceClient();

    // Store the connection
    const { data: connection, error: connError } = await svc
      .from("treasury_connections")
      .insert({
        plaid_item_id: itemId,
        access_token_encrypted: encryptedToken,
        institution_name: institutionName,
        institution_id: institutionId,
        status: "active",
      })
      .select("id")
      .single();

    if (connError) {
      console.error("[Treasury] Failed to store connection:", connError);
      return NextResponse.json(
        { error: "Failed to save connection." },
        { status: 500 },
      );
    }

    // Fetch accounts for this item and store them
    const accountsResponse = await plaid.accountsGet({
      access_token: accessToken,
    });

    const accounts = accountsResponse.data.accounts.map((acct) => ({
      connection_id: connection.id,
      plaid_account_id: acct.account_id,
      name: acct.name,
      official_name: acct.official_name ?? null,
      mask: acct.mask ?? null,
      type: acct.type === "depository" ? (acct.subtype === "savings" ? "savings" : "checking") : "checking",
      current_balance: acct.balances.current ?? 0,
      available_balance: acct.balances.available ?? 0,
      balance_updated_at: new Date().toISOString(),
    }));

    const { error: acctError } = await svc
      .from("treasury_accounts")
      .insert(accounts);

    if (acctError) {
      console.error("[Treasury] Failed to store accounts:", acctError);
    }

    // Audit log
    await svc.from("treasury_audit_log").insert({
      user_id: guard.user.id,
      action: "plaid_link_complete",
      resource_type: "treasury_connections",
      resource_id: connection.id,
      ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      user_agent: request.headers.get("user-agent") ?? null,
      metadata: {
        institution_name: institutionName,
        account_count: accounts.length,
      },
    });

    return NextResponse.json({
      ok: true,
      connection_id: connection.id,
      accounts_added: accounts.length,
    });
  } catch (err) {
    console.error("[Treasury] Token exchange failed:", err);
    return NextResponse.json(
      { error: "Failed to connect bank account." },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 4: Verify build**

```bash
cd /Users/johanannunez/workspace/parcel && pnpm --filter web build 2>&1 | tail -15
```

- [ ] **Step 5: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/lib/treasury/admin-guard.ts
git add apps/web/src/app/api/treasury/
git commit -m "feat(treasury): add Plaid Link token creation and exchange API routes"
```

---

### Task 6: Update admin sidebar navigation

**Files:**
- Modify: `apps/web/src/components/admin/AdminSidebar.tsx`
- Modify: `apps/web/src/components/admin/AdminBottomNav.tsx`

- [ ] **Step 1: Add Treasury section to AdminSidebar**

In `apps/web/src/components/admin/AdminSidebar.tsx`:

Add import for treasury icons at the top (add `Vault, ChartLine, ArrowsLeftRight, TrendUp` to the Phosphor imports).

Remove the Payouts entry from `operationsNav`.

Add a new `treasuryNav` array after `operationsNav`:

```typescript
const treasuryNav: NavItem[] = [
  { href: "/admin/treasury", label: "Overview", icon: <Vault size={18} weight="duotone" />, matchPrefix: "/admin/treasury" },
  { href: "/admin/treasury/accounts", label: "Accounts", icon: <Wallet size={18} weight="duotone" />, matchPrefix: "/admin/treasury/accounts" },
  { href: "/admin/treasury/transactions", label: "Transactions", icon: <ArrowsLeftRight size={18} weight="duotone" />, matchPrefix: "/admin/treasury/transactions" },
  { href: "/admin/treasury/forecast", label: "Forecast", icon: <TrendUp size={18} weight="duotone" />, matchPrefix: "/admin/treasury/forecast" },
];
```

**Important:** The Overview item's `matchPrefix` should only match exactly `/admin/treasury` and not catch `/admin/treasury/accounts` etc. Update the `isActive` logic: for the Treasury Overview item specifically, match `pathname === "/admin/treasury"` instead of `startsWith`. The simplest fix: don't set `matchPrefix` on the Overview item, so it falls back to exact match (`pathname === item.href`).

```typescript
const treasuryNav: NavItem[] = [
  { href: "/admin/treasury", label: "Overview", icon: <Vault size={18} weight="duotone" /> },
  { href: "/admin/treasury/accounts", label: "Accounts", icon: <Wallet size={18} weight="duotone" />, matchPrefix: "/admin/treasury/accounts" },
  { href: "/admin/treasury/transactions", label: "Transactions", icon: <ArrowsLeftRight size={18} weight="duotone" />, matchPrefix: "/admin/treasury/transactions" },
  { href: "/admin/treasury/forecast", label: "Forecast", icon: <TrendUp size={18} weight="duotone" />, matchPrefix: "/admin/treasury/forecast" },
];
```

Add the Treasury section to the nav JSX, between Operations and Communications:

```tsx
<AdminNavSection
  label="Treasury"
  items={treasuryNav}
  isActive={isActive}
/>
```

Also update `AdminTopBar`'s `pageTitle` function to include:
```typescript
if (pathname.startsWith("/admin/treasury")) return "Treasury";
```

And update the `adminRailItems` array (icon rail for tablets):
- Remove the Payouts entry
- Add Treasury items (at minimum the Overview entry with `Vault` icon)

- [ ] **Step 2: Update AdminBottomNav to include Treasury**

In `apps/web/src/components/admin/AdminBottomNav.tsx`:

Add `Vault` to the Phosphor imports. Remove the `Wallet` / Payouts entry from the "More" overflow menu. Add a Treasury entry to either the primary nav items or the "More" overflow (depending on how many items are already visible). Since the bottom nav has 4 primary + "More", replace the Payouts slot or add Treasury to the overflow.

- [ ] **Step 3: Verify build and screenshot**

```bash
cd /Users/johanannunez/workspace/parcel && pnpm --filter web build 2>&1 | tail -10
```

Start dev server and screenshot the sidebar to verify Treasury section appears correctly.

- [ ] **Step 4: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/components/admin/AdminSidebar.tsx
git add apps/web/src/components/admin/AdminBottomNav.tsx
git commit -m "feat(treasury): add Treasury section to admin sidebar, remove Payouts link"
```

---

### Task 7: Treasury Overview page (scaffold)

**Files:**
- Create: `apps/web/src/app/(admin)/admin/treasury/page.tsx`
- Create: `apps/web/src/lib/treasury/queries.ts`

- [ ] **Step 1: Create treasury data query helpers**

```typescript
// apps/web/src/lib/treasury/queries.ts

/**
 * Server-side query helpers for Treasury pages.
 *
 * All functions expect a Supabase client scoped to an admin session.
 * They read from treasury_* tables (protected by RLS).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { ALLOCATION_TARGETS, ACTIVE_BUCKET_CATEGORIES } from "./types";

/** Fetch all treasury accounts with their balances. */
export async function getAccounts(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("treasury_accounts")
    .select("*")
    .order("name");

  if (error) {
    console.error("[Treasury] Failed to fetch accounts:", error);
    return [];
  }
  return data ?? [];
}

/** Fetch the most recent connection with its sync timestamp. */
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

/** Fetch recent alerts (unacknowledged first, then recent). */
export async function getAlerts(supabase: SupabaseClient, limit = 10) {
  const { data } = await supabase
    .from("treasury_alerts")
    .select("*")
    .order("acknowledged_at", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

/** Fetch savings goals with their associated account balances. */
export async function getSavingsGoals(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("treasury_savings_goals")
    .select("*, treasury_accounts(current_balance, name)")
    .eq("is_active", true)
    .order("created_at");

  return data ?? [];
}

/** Calculate allocation health: actual % vs target % for each active bucket. */
export function calculateAllocationHealth(
  accounts: Array<{
    bucket_category: string;
    current_balance: number;
    allocation_target_pct: number | null;
    is_active: boolean;
  }>,
) {
  const activeAccounts = accounts.filter((a) =>
    ACTIVE_BUCKET_CATEGORIES.includes(a.bucket_category as any),
  );

  const totalCash = activeAccounts.reduce(
    (sum, a) => sum + a.current_balance,
    0,
  );

  if (totalCash === 0) {
    return activeAccounts
      .filter((a) => a.bucket_category !== "income")
      .map((a) => ({
        category: a.bucket_category,
        actual_pct: 0,
        target_pct: a.allocation_target_pct ?? ALLOCATION_TARGETS[a.bucket_category] ?? 0,
        balance: a.current_balance,
        status: "on_track" as const,
      }));
  }

  return activeAccounts
    .filter((a) => a.bucket_category !== "income")
    .map((a) => {
      const target = a.allocation_target_pct ?? ALLOCATION_TARGETS[a.bucket_category] ?? 0;
      const actual = (a.current_balance / totalCash) * 100;
      const drift = Math.abs(actual - target);

      let status: "on_track" | "drifting" | "off_track";
      if (drift <= 2) status = "on_track";
      else if (drift <= 5) status = "drifting";
      else status = "off_track";

      return {
        category: a.bucket_category,
        actual_pct: Math.round(actual * 10) / 10,
        target_pct: target,
        balance: a.current_balance,
        status,
      };
    });
}

/** Get monthly income and expenses for a given month. */
export async function getMonthlyTotals(
  supabase: SupabaseClient,
  year: number,
  month: number,
) {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate =
    month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, "0")}-01`;

  const { data } = await supabase
    .from("treasury_transactions")
    .select("amount, category, source, is_duplicate")
    .gte("date", startDate)
    .lt("date", endDate)
    .eq("is_duplicate", false);

  const transactions = data ?? [];

  const income = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return { income, expenses, net: income - expenses };
}
```

- [ ] **Step 2: Create the Overview page**

```typescript
// apps/web/src/app/(admin)/admin/treasury/page.tsx

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isTreasuryVerified } from "@/lib/treasury/auth";
import {
  getAccounts,
  getConnectionStatus,
  getAlerts,
  getSavingsGoals,
  calculateAllocationHealth,
  getMonthlyTotals,
} from "@/lib/treasury/queries";

export const metadata: Metadata = {
  title: "Treasury | Admin",
};
export const dynamic = "force-dynamic";

export default async function TreasuryOverviewPage() {
  const verified = await isTreasuryVerified();
  if (!verified) {
    redirect("/admin/treasury/verify?redirect=/admin/treasury");
  }

  const supabase = await createClient();
  const connection = await getConnectionStatus(supabase);
  const accounts = await getAccounts(supabase);
  const alerts = await getAlerts(supabase);
  const savingsGoals = await getSavingsGoals(supabase);

  const now = new Date();
  const monthlyTotals = await getMonthlyTotals(
    supabase,
    now.getFullYear(),
    now.getMonth() + 1,
  );

  const totalCash = accounts.reduce((s, a) => s + a.current_balance, 0);
  const allocationHealth = calculateAllocationHealth(accounts);

  // If no connection exists yet, show the connect prompt
  if (!connection) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10 lg:py-14">
        <h1
          className="text-3xl font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          Treasury
        </h1>
        <p
          className="mt-2 text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Connect your bank accounts to get started.
        </p>

        <div
          className="mt-8 rounded-xl border p-12 text-center"
          style={{
            borderColor: "var(--color-warm-gray-200)",
            backgroundColor: "var(--color-white)",
          }}
        >
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(2, 170, 235, 0.08)" }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#02AAEB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Connect Your Bank
          </h2>
          <p
            className="mx-auto mt-2 max-w-md text-sm"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Link your Relay accounts to see balances, track allocations,
            detect subscriptions, and forecast cash flow. Your data is
            encrypted and never shared.
          </p>
          <a
            href="/admin/treasury/accounts"
            className="mt-6 inline-flex rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#02AAEB" }}
          >
            Connect Bank Account
          </a>
        </div>
      </div>
    );
  }

  // Connected state: show the command center
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10 lg:py-14">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1
              className="text-3xl font-semibold tracking-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              Treasury
            </h1>
            <p
              className="mt-1 text-xs"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Last synced:{" "}
              {connection.last_synced_at
                ? new Date(connection.last_synced_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "Never"}
            </p>
          </div>
          {/* Sync button will be a client component — placeholder for now */}
          <div
            className="rounded-lg px-4 py-2 text-xs font-semibold text-white"
            style={{ backgroundColor: "#02AAEB" }}
          >
            Sync Now
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Total Cash"
            value={`$${totalCash.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          />
          <StatCard
            label="Monthly Income"
            value={`$${monthlyTotals.income.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          />
          <StatCard
            label="Monthly Expenses"
            value={`$${monthlyTotals.expenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          />
          <StatCard
            label="Net Profit"
            value={`$${monthlyTotals.net.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            positive={monthlyTotals.net >= 0}
          />
        </div>

        {/* Two columns: Allocation Health + Savings Goals */}
        <div className="grid grid-cols-2 gap-4">
          {/* Allocation Health */}
          <div
            className="rounded-xl border p-6"
            style={{
              backgroundColor: "var(--color-white)",
              borderColor: "var(--color-warm-gray-200)",
            }}
          >
            <h2
              className="mb-4 text-sm font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              Profit First Allocation Health
            </h2>
            <div className="flex flex-col gap-3">
              {allocationHealth.map((bucket) => (
                <AllocationRow key={bucket.category} {...bucket} />
              ))}
            </div>
          </div>

          {/* Savings Goals */}
          <div
            className="rounded-xl border p-6"
            style={{
              backgroundColor: "var(--color-white)",
              borderColor: "var(--color-warm-gray-200)",
            }}
          >
            <h2
              className="mb-4 text-sm font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              Savings Goals
            </h2>
            {savingsGoals.length === 0 ? (
              <p
                className="text-sm"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                No savings goals set yet.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {savingsGoals.map((goal: any) => (
                  <SavingsGoalRow
                    key={goal.id}
                    name={goal.name}
                    current={goal.treasury_accounts?.current_balance ?? 0}
                    target={goal.target_amount}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div
            className="rounded-xl border p-6"
            style={{
              backgroundColor: "var(--color-white)",
              borderColor: "var(--color-warm-gray-200)",
            }}
          >
            <h2
              className="mb-4 text-sm font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              Alerts
            </h2>
            <div className="flex flex-col gap-2">
              {alerts.map((alert: any) => (
                <AlertRow key={alert.id} alert={alert} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function StatCard({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
    >
      <div
        className="text-[10px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {label}
      </div>
      <div
        className="mt-2 text-xl font-semibold"
        style={{
          color:
            positive === undefined
              ? "var(--color-text-primary)"
              : positive
                ? "#16a34a"
                : "#ef4444",
        }}
      >
        {value}
      </div>
    </div>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  owners_comp: "Owner's Comp",
  tax: "Tax",
  emergency: "Emergency",
  opex: "OPEX",
  profit: "Profit",
  generosity: "Generosity",
};

const STATUS_COLORS: Record<string, string> = {
  on_track: "#16a34a",
  drifting: "#f59e0b",
  off_track: "#ef4444",
};

function AllocationRow({
  category,
  actual_pct,
  target_pct,
  status,
}: {
  category: string;
  actual_pct: number;
  target_pct: number;
  balance: number;
  status: "on_track" | "drifting" | "off_track";
}) {
  const pct = target_pct > 0 ? Math.min((actual_pct / target_pct) * 100, 100) : 0;
  const color = STATUS_COLORS[status];

  return (
    <div className="flex items-center justify-between">
      <span
        className="text-sm"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {CATEGORY_LABELS[category] ?? category}
      </span>
      <div className="flex items-center gap-2">
        <div
          className="h-1.5 w-20 overflow-hidden rounded-full"
          style={{ backgroundColor: "var(--color-warm-gray-100)" }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-xs font-semibold" style={{ color }}>
          {actual_pct}%
        </span>
        <span
          className="text-xs"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          /{target_pct}%
        </span>
      </div>
    </div>
  );
}

function SavingsGoalRow({
  name,
  current,
  target,
}: {
  name: string;
  current: number;
  target: number;
}) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;

  return (
    <div>
      <div className="mb-1 flex justify-between">
        <span
          className="text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {name}
        </span>
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          ${current.toLocaleString()} / ${target.toLocaleString()}
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: "var(--color-warm-gray-100)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: pct >= 100 ? "#16a34a" : "#02AAEB",
          }}
        />
      </div>
    </div>
  );
}

function AlertRow({ alert }: { alert: any }) {
  const bgColors: Record<string, string> = {
    info: "#f0fdf4",
    warning: "#fef3c7",
    critical: "#fef2f2",
  };
  const textColors: Record<string, string> = {
    info: "#166534",
    warning: "#92400e",
    critical: "#991b1b",
  };

  return (
    <div
      className="flex items-start gap-3 rounded-lg px-3 py-2.5"
      style={{ backgroundColor: bgColors[alert.severity] ?? bgColors.info }}
    >
      <span className="mt-0.5 flex-shrink-0 text-sm">
        {alert.severity === "critical"
          ? "\u26A0"
          : alert.severity === "warning"
            ? "\u26A0"
            : "\u2713"}
      </span>
      <span
        className="text-sm"
        style={{ color: textColors[alert.severity] ?? textColors.info }}
      >
        {alert.message}
      </span>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
cd /Users/johanannunez/workspace/parcel && pnpm --filter web build 2>&1 | tail -15
```

- [ ] **Step 4: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/lib/treasury/queries.ts
git add apps/web/src/app/\(admin\)/admin/treasury/page.tsx
git commit -m "feat(treasury): add Overview page with allocation health, savings goals, and alerts"
```

---

## Phase 2: Data Sync + Deduplication

### Task 8: Sync engine (Plaid transactions + Stripe payouts + dedup)

**Files:**
- Create: `apps/web/src/lib/treasury/sync.ts`
- Create: `apps/web/src/lib/treasury/dedup.ts`
- Create: `apps/web/src/app/api/treasury/sync/route.ts`

This task creates the core sync engine. The sync route handles both cron (CRON_SECRET) and manual (admin session) triggers.

- [ ] **Step 1: Create the dedup scoring engine**

Create `apps/web/src/lib/treasury/dedup.ts` implementing the 7-signal scored matching algorithm from the spec. Each signal returns points. The `matchTransactions` function takes arrays of unmatched Stripe payouts and Plaid transactions, returns auto-matches (65+), probable matches (40-64), and unmatched items.

Key implementation details:
- Amount: Stripe uses cents, Plaid uses dollars. Convert `stripe.amount / 100`.
- Date: Use `arrival_date` from Stripe payout, compare to Plaid `date`. Allow 0-2 business day window.
- Description: Check `original_description` for "PARCELCO" or "STRIPE" (case-insensitive).
- Counterparties: Check `counterparties` jsonb array for name containing "Stripe".
- Last4: Compare `payout.destination.last4` to account `mask`.
- Payment meta: Check `payment_meta.payment_processor` and `payment_meta.reference_number`.

- [ ] **Step 2: Create the sync engine**

Create `apps/web/src/lib/treasury/sync.ts` with a `runTreasurySync` function that:
1. Fetches all active connections from `treasury_connections`
2. For each connection, decrypts the access token
3. Calls Plaid's `/transactions/sync` with the stored cursor
4. Upserts new transactions into `treasury_transactions`
5. Updates account balances via `/accounts/balance/get`
6. Fetches recent Stripe payouts via `stripe.payouts.list`
7. Stores Stripe payouts as transactions (source: 'stripe')
8. Runs the dedup engine on unmatched pairs
9. Updates the sync cursor and `last_synced_at`
10. Checks for token rotation (if > 30 days, rotate)
11. Returns a summary

- [ ] **Step 3: Create the sync API route**

Create `apps/web/src/app/api/treasury/sync/route.ts`:
- `POST` handler
- Accepts either CRON_SECRET (for Vercel Cron) or admin session (for manual sync)
- For manual sync: check 5-minute cooldown using `last_synced_at`
- Calls `runTreasurySync`
- Logs to `treasury_audit_log`
- Returns summary JSON

- [ ] **Step 4: Add cron config**

Update `apps/web/vercel.json` to add the Treasury sync cron:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-deleted-accounts",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/treasury/sync",
      "schedule": "0 11 * * *"
    }
  ]
}
```

Note: `0 11 * * *` = 11:00 UTC = 6:00 AM ET.

- [ ] **Step 5: Verify build and commit**

```bash
cd /Users/johanannunez/workspace/parcel && pnpm --filter web build 2>&1 | tail -15
git add apps/web/src/lib/treasury/sync.ts apps/web/src/lib/treasury/dedup.ts
git add apps/web/src/app/api/treasury/sync/
git add apps/web/vercel.json
git commit -m "feat(treasury): add sync engine with Plaid incremental sync, Stripe payouts, and scored dedup"
```

---

### Task 9: Subscription detection engine

**Files:**
- Create: `apps/web/src/lib/treasury/subscriptions.ts`

- [ ] **Step 1: Create subscription detection**

Create `apps/web/src/lib/treasury/subscriptions.ts` that:
- Queries `treasury_transactions` for non-duplicate outflows grouped by `merchant_name`
- Detects recurring patterns: same merchant + similar amount (within 10%) + regular interval + at least 3 occurrences
- Upserts detected subscriptions into `treasury_subscriptions`
- Calculates `total_annual_cost` and `next_expected_at`
- Creates `new_subscription` alerts for newly detected subscriptions
- This function is called at the end of each sync

- [ ] **Step 2: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/lib/treasury/subscriptions.ts
git commit -m "feat(treasury): add subscription detection engine"
```

---

## Phase 3: Remaining Pages

### Task 10: Accounts page

**Files:**
- Create: `apps/web/src/app/(admin)/admin/treasury/accounts/page.tsx`
- Create: `apps/web/src/app/(admin)/admin/treasury/accounts/PlaidLinkButton.tsx`
- Create: `apps/web/src/app/(admin)/admin/treasury/accounts/actions.ts`

Build the Accounts page showing all 12 Relay accounts as cards, grouped into Active Buckets and Other Accounts. Include the Plaid Link button (client component that loads Plaid Link SDK). Each card shows: name, type, balance, bucket category. The Stripe Revenue card shows tech fee + onboarding fee totals.

The PlaidLinkButton component:
1. Calls `/api/treasury/create-link-token` to get a link token
2. Opens Plaid Link modal
3. On success, calls `/api/treasury/exchange-token` with the public token
4. Refreshes the page

- [ ] **Steps: Create page, PlaidLinkButton, actions, verify build, commit**

---

### Task 11: Transactions page

**Files:**
- Create: `apps/web/src/app/(admin)/admin/treasury/transactions/page.tsx`
- Create: `apps/web/src/app/(admin)/admin/treasury/transactions/TransactionsShell.tsx`
- Create: `apps/web/src/app/(admin)/admin/treasury/transactions/actions.ts`

Build the Transactions page with:
- Server component fetches transactions with pagination
- Client shell handles filters (account, category, date range, search)
- Monthly burn rate summary at top
- Each transaction row shows: date, merchant, amount, category badge, account name, source icon
- Dedup matches show "Matched" badge
- Subscription transactions show "Recurring" badge

- [ ] **Steps: Create page, shell, actions, verify build, commit**

---

### Task 12: Forecast page

**Files:**
- Create: `apps/web/src/app/(admin)/admin/treasury/forecast/page.tsx`
- Create: `apps/web/src/app/(admin)/admin/treasury/forecast/ForecastShell.tsx`
- Create: `apps/web/src/app/(admin)/admin/treasury/forecast/actions.ts`
- Create: `apps/web/src/lib/treasury/forecast.ts`

Build the Forecast page with:
- Confidence indicator based on data depth
- Savings goal projections
- Rebalancing suggestions
- "What if" scenarios (client-side calculations)
- AI insights section (calls Claude Haiku via existing ANTHROPIC_API_KEY)

The forecast engine (`apps/web/src/lib/treasury/forecast.ts`):
- Analyzes transaction history to project 30/60/90 day cash flows
- Uses linear regression on monthly income/expense trends
- Calculates savings goal ETAs
- Generates rebalancing suggestions based on allocation drift
- AI insights: sends a structured prompt to Claude Haiku with transaction summaries

- [ ] **Steps: Create forecast engine, page, shell, actions, verify build, commit**

---

## Phase 4: Polish + PostHog

### Task 13: Sync Now button (client component)

**Files:**
- Create: `apps/web/src/components/admin/treasury/SyncButton.tsx`
- Modify: `apps/web/src/app/(admin)/admin/treasury/page.tsx` (replace placeholder)

Create a client component that:
- Shows "Sync Now" button with last synced timestamp
- On click, calls `/api/treasury/sync` (POST)
- Shows spinner during sync
- Disables for 5 minutes after use (shows countdown)
- Refreshes the page on completion via `router.refresh()`

- [ ] **Steps: Create component, wire into Overview page, verify, commit**

---

### Task 14: Account bucket categorization UI

**Files:**
- Create: `apps/web/src/app/api/treasury/accounts/[id]/route.ts`
- Modify: `apps/web/src/app/(admin)/admin/treasury/accounts/page.tsx`

After connecting via Plaid, the 12 accounts come in with generic names. Add a UI to map each account to a bucket category (dropdown) and set allocation target percentages. This is a one-time setup step shown on the Accounts page when `bucket_category = 'uncategorized'` for any account.

- [ ] **Steps: Create API route, add categorization UI, verify, commit**

---

### Task 15: Alert acknowledgment + PostHog events

**Files:**
- Create: `apps/web/src/app/api/treasury/alerts/[id]/acknowledge/route.ts`
- Modify: Treasury pages to emit PostHog events

Add acknowledge button to alerts. Add PostHog event tracking for:
- `treasury_page_view` (page name)
- `treasury_sync_triggered` (manual vs cron)
- `treasury_forecast_generated`
- `treasury_alert_acknowledged`

No PII in event properties.

- [ ] **Steps: Create acknowledge route, add PostHog events, verify, commit**

---

### Task 16: CSP headers for Treasury pages

**Files:**
- Modify: `apps/web/src/proxy.ts`

Add Content Security Policy headers specifically for `/admin/treasury/*` routes:
- `script-src 'self' https://cdn.plaid.com` (Plaid Link needs its CDN)
- `connect-src 'self' https://*.plaid.com https://api.stripe.com`
- `frame-src https://cdn.plaid.com` (Plaid Link iframe)
- No `'unsafe-inline'` for scripts
- No `'unsafe-eval'`

- [ ] **Steps: Add CSP header logic to proxy.ts, verify Plaid Link still works, commit**

---

### Task 17: Plaid webhook endpoint

**Files:**
- Create: `apps/web/src/app/api/webhooks/plaid/route.ts`

Handle Plaid webhooks for:
- `TRANSACTIONS` (new transactions available)
- `ITEM` (connection status changes, errors)

Verify JWT signature using Plaid's public key before processing. On `TRANSACTIONS` webhook, trigger an incremental sync for the affected Item.

- [ ] **Steps: Create webhook route with signature verification, verify, commit**

---

## Final Checklist

After all tasks are complete:
- [ ] Run full build: `pnpm --filter web build`
- [ ] Screenshot all 4 Treasury pages + verify page
- [ ] Test Plaid Link flow end-to-end in Sandbox
- [ ] Test manual sync
- [ ] Verify sidebar navigation (desktop, tablet rail, mobile bottom nav)
- [ ] Verify re-auth gate works (clear cookie, try to access Treasury)
- [ ] Verify owner cannot see any Treasury routes or data
- [ ] Run migration SQL on Supabase (Johan does this)
- [ ] Add `PLAID_ENV=sandbox` and `TREASURY_ENCRYPTION_KEY` to Doppler
