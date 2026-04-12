-- Treasury module: 8 tables for Plaid/Stripe financial data, forecasting, and audit logging.
-- All tables use admin-only RLS via the existing public.is_admin() function.
-- pgcrypto extension is already enabled.

-- ─── 1. treasury_connections ─────────────────────────────────────────────────
-- Stores Plaid Items (one per bank connection).

create table public.treasury_connections (
  id                    uuid primary key default gen_random_uuid(),
  plaid_item_id         text unique not null,
  access_token_encrypted bytea not null,
  institution_name      text,
  institution_id        text,
  status                text not null check (status in ('active', 'stale', 'error', 'pending', 'disconnected')),
  last_synced_at        timestamptz,
  cursor                text,
  token_rotated_at      timestamptz,
  created_at            timestamptz default now()
);

alter table public.treasury_connections enable row level security;

create policy "treasury_connections_admin_select" on public.treasury_connections
  for select using (public.is_admin());

create policy "treasury_connections_admin_insert" on public.treasury_connections
  for insert with check (public.is_admin());

create policy "treasury_connections_admin_update" on public.treasury_connections
  for update using (public.is_admin());

create policy "treasury_connections_admin_delete" on public.treasury_connections
  for delete using (public.is_admin());


-- ─── 2. treasury_accounts ────────────────────────────────────────────────────
-- Bank accounts linked to a Plaid connection.

create table public.treasury_accounts (
  id                    uuid primary key default gen_random_uuid(),
  connection_id         uuid not null references public.treasury_connections (id) on delete cascade,
  plaid_account_id      text unique not null,
  name                  text,
  official_name         text,
  mask                  text,
  type                  text check (type in ('checking', 'savings')),
  current_balance       numeric default 0,
  available_balance     numeric default 0,
  bucket_category       text check (bucket_category in (
                          'income', 'owners_comp', 'tax', 'emergency', 'opex',
                          'profit', 'generosity', 'growth', 'cleaners',
                          'yearly', 'disbursement', 'deposits', 'uncategorized'
                        )),
  allocation_target_pct numeric,
  is_active             boolean default true,
  balance_updated_at    timestamptz,
  created_at            timestamptz default now()
);

alter table public.treasury_accounts enable row level security;

create policy "treasury_accounts_admin_select" on public.treasury_accounts
  for select using (public.is_admin());

create policy "treasury_accounts_admin_insert" on public.treasury_accounts
  for insert with check (public.is_admin());

create policy "treasury_accounts_admin_update" on public.treasury_accounts
  for update using (public.is_admin());

create policy "treasury_accounts_admin_delete" on public.treasury_accounts
  for delete using (public.is_admin());


-- ─── 3. treasury_transactions ────────────────────────────────────────────────
-- Full transaction ledger from Plaid and Stripe.

create table public.treasury_transactions (
  id                    uuid primary key default gen_random_uuid(),
  account_id            uuid references public.treasury_accounts (id) on delete cascade,
  plaid_transaction_id  text unique,
  stripe_charge_id      text unique,
  date                  date not null,
  amount                numeric not null,
  merchant_name         text,
  description           text,
  original_description  text,
  category              text check (category in (
                          'revenue', 'transfer', 'subscription', 'operating',
                          'stripe_fee', 'stripe_payout', 'other'
                        )),
  source                text check (source in ('plaid', 'stripe')),
  is_duplicate          boolean default false,
  duplicate_of          uuid references public.treasury_transactions (id),
  dedup_score           integer,
  plaid_category        text[],
  counterparties        jsonb,
  payment_meta          jsonb,
  pending               boolean default false,
  created_at            timestamptz default now()
);

create index treasury_transactions_account_date_idx
  on public.treasury_transactions (account_id, date);

create index treasury_transactions_merchant_amount_date_idx
  on public.treasury_transactions (merchant_name, amount, date);

create index treasury_transactions_category_idx
  on public.treasury_transactions (category);

create index treasury_transactions_source_dedup_idx
  on public.treasury_transactions (source, is_duplicate);

alter table public.treasury_transactions enable row level security;

create policy "treasury_transactions_admin_select" on public.treasury_transactions
  for select using (public.is_admin());

create policy "treasury_transactions_admin_insert" on public.treasury_transactions
  for insert with check (public.is_admin());

create policy "treasury_transactions_admin_update" on public.treasury_transactions
  for update using (public.is_admin());

create policy "treasury_transactions_admin_delete" on public.treasury_transactions
  for delete using (public.is_admin());


-- ─── 4. treasury_subscriptions ───────────────────────────────────────────────
-- Detected or manually tracked recurring charges.

create table public.treasury_subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  account_id          uuid not null references public.treasury_accounts (id) on delete cascade,
  merchant_name       text not null,
  typical_amount      numeric,
  frequency           text check (frequency in ('weekly', 'monthly', 'quarterly', 'annual')),
  last_charged_at     date,
  next_expected_at    date,
  is_active           boolean default true,
  deactivated_at      timestamptz,
  total_annual_cost   numeric default 0,
  created_at          timestamptz default now()
);

alter table public.treasury_subscriptions enable row level security;

create policy "treasury_subscriptions_admin_select" on public.treasury_subscriptions
  for select using (public.is_admin());

create policy "treasury_subscriptions_admin_insert" on public.treasury_subscriptions
  for insert with check (public.is_admin());

create policy "treasury_subscriptions_admin_update" on public.treasury_subscriptions
  for update using (public.is_admin());

create policy "treasury_subscriptions_admin_delete" on public.treasury_subscriptions
  for delete using (public.is_admin());


-- ─── 5. treasury_savings_goals ───────────────────────────────────────────────
-- Savings targets tied to specific accounts.

create table public.treasury_savings_goals (
  id            uuid primary key default gen_random_uuid(),
  account_id    uuid not null references public.treasury_accounts (id) on delete cascade,
  name          text not null,
  target_amount numeric not null,
  target_date   date,
  is_active     boolean default true,
  created_at    timestamptz default now()
);

alter table public.treasury_savings_goals enable row level security;

create policy "treasury_savings_goals_admin_select" on public.treasury_savings_goals
  for select using (public.is_admin());

create policy "treasury_savings_goals_admin_insert" on public.treasury_savings_goals
  for insert with check (public.is_admin());

create policy "treasury_savings_goals_admin_update" on public.treasury_savings_goals
  for update using (public.is_admin());

create policy "treasury_savings_goals_admin_delete" on public.treasury_savings_goals
  for delete using (public.is_admin());


-- ─── 6. treasury_forecasts ───────────────────────────────────────────────────
-- AI-generated financial snapshots. Immutable by design — insert only in practice,
-- but the delete policy allows pruning old snapshots.

create table public.treasury_forecasts (
  id                      uuid primary key default gen_random_uuid(),
  generated_at            timestamptz default now(),
  period_days             int not null check (period_days in (30, 60, 90)),
  confidence_level        text not null default 'low' check (confidence_level in ('low', 'medium', 'high')),
  data_months_available   int default 0,
  projected_income        numeric default 0,
  projected_expenses      numeric default 0,
  projected_net           numeric default 0,
  account_projections     jsonb default '{}',
  insights                jsonb default '[]',
  model_used              text default 'claude-haiku-4-5',
  retention_expires_at    timestamptz,
  created_at              timestamptz default now()
);

alter table public.treasury_forecasts enable row level security;

create policy "treasury_forecasts_admin_select" on public.treasury_forecasts
  for select using (public.is_admin());

create policy "treasury_forecasts_admin_insert" on public.treasury_forecasts
  for insert with check (public.is_admin());

create policy "treasury_forecasts_admin_update" on public.treasury_forecasts
  for update using (public.is_admin());

create policy "treasury_forecasts_admin_delete" on public.treasury_forecasts
  for delete using (public.is_admin());


-- ─── 7. treasury_alerts ──────────────────────────────────────────────────────
-- Actionable notifications surfaced to the admin.

create table public.treasury_alerts (
  id               uuid primary key default gen_random_uuid(),
  type             text not null check (type in (
                     'low_balance', 'allocation_drift', 'new_subscription',
                     'unusual_transaction', 'dedup_match', 'savings_milestone',
                     'rebalance_suggestion', 'sync_failed', 'connection_expiring',
                     'duplicate_detected', 'large_transaction'
                   )),
  severity         text not null default 'info' check (severity in ('info', 'warning', 'critical')),
  title            text not null,
  message          text not null,
  metadata         jsonb default '{}',
  acknowledged_at      timestamptz,
  retention_expires_at timestamptz,
  created_at           timestamptz default now()
);

alter table public.treasury_alerts enable row level security;

create policy "treasury_alerts_admin_select" on public.treasury_alerts
  for select using (public.is_admin());

create policy "treasury_alerts_admin_insert" on public.treasury_alerts
  for insert with check (public.is_admin());

create policy "treasury_alerts_admin_update" on public.treasury_alerts
  for update using (public.is_admin());

create policy "treasury_alerts_admin_delete" on public.treasury_alerts
  for delete using (public.is_admin());


-- ─── 8. treasury_audit_log ───────────────────────────────────────────────────
-- IMMUTABLE security log. Only INSERT and SELECT policies are created.
-- No UPDATE or DELETE policies intentionally — rows must never be altered or removed.

create table public.treasury_audit_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles (id) on delete set null,
  action        text not null check (action in (
                  'page_view', 'data_sync', 'plaid_link_start', 'plaid_link_complete',
                  'account_disconnect', 'forecast_run', 'settings_change',
                  'reauth_success', 'reauth_failure', 'sync_triggered',
                  'access_review', 'data_purge', 'mfa_enroll', 'mfa_verify'
                )),
  resource_type text,
  resource_id   uuid,
  ip_address    inet,
  user_agent    text,
  metadata      jsonb default '{}',
  created_at    timestamptz default now()
);

alter table public.treasury_audit_log enable row level security;

-- INSERT only: admin can write audit entries (service role bypasses RLS for server-side writes)
create policy "treasury_audit_log_admin_insert" on public.treasury_audit_log
  for insert with check (public.is_admin());

-- SELECT only: admin can read the full audit trail
create policy "treasury_audit_log_admin_select" on public.treasury_audit_log
  for select using (public.is_admin());

-- NO update policy — audit log rows are immutable
-- NO delete policy — audit log rows are permanent

-- ─── Plaid Compliance Notes ──────────────────────────────────────────────────
-- retention_expires_at columns support Attestation 8 (Data Deletion & Retention Policy).
-- deactivated_at on treasury_subscriptions supports 90-day inactive purge.
-- Extended audit_log actions support Attestations 5 (Access Reviews), 6 (MFA), and 8 (Purge).
