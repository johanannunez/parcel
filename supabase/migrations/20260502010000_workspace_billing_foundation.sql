-- Workspace-first billing foundation
--
-- Stripe remains the long-term payment processor. Parcel owns the billing
-- business objects: workspaces, schedules, service lines, credits, refunds,
-- draft review, and admin-only economics.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'billing_processor') then
    create type public.billing_processor as enum ('stripe');
  end if;

  if not exists (select 1 from pg_type where typname = 'billing_payment_method_type') then
    create type public.billing_payment_method_type as enum (
      'card',
      'us_bank_account',
      'apple_pay',
      'google_pay',
      'link',
      'other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'billing_payment_method_status') then
    create type public.billing_payment_method_status as enum (
      'active',
      'verification_required',
      'expired',
      'failed',
      'removed'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'billing_item_kind') then
    create type public.billing_item_kind as enum (
      'service',
      'fee',
      'reimbursement',
      'discount',
      'credit',
      'refund',
      'tax',
      'other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'billing_schedule_status') then
    create type public.billing_schedule_status as enum (
      'draft',
      'active',
      'paused',
      'ended',
      'canceled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'billing_schedule_interval') then
    create type public.billing_schedule_interval as enum (
      'week',
      'month',
      'quarter',
      'year'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'billing_collection_method') then
    create type public.billing_collection_method as enum (
      'auto_charge',
      'send_invoice',
      'manual'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'billing_invoice_status') then
    create type public.billing_invoice_status as enum (
      'draft',
      'review_ready',
      'approved',
      'open',
      'paid',
      'payment_failed',
      'void',
      'uncollectible',
      'refunded',
      'partially_refunded'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'billing_credit_status') then
    create type public.billing_credit_status as enum (
      'available',
      'applied',
      'void'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'billing_refund_status') then
    create type public.billing_refund_status as enum (
      'pending',
      'succeeded',
      'failed',
      'canceled'
    );
  end if;
end $$;

create table if not exists public.billing_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  processor public.billing_processor not null default 'stripe',
  stripe_customer_id text unique,
  billing_email text,
  default_payment_method_id uuid,
  collection_method public.billing_collection_method not null default 'auto_charge',
  review_days_before_charge integer not null default 3 check (review_days_before_charge between 0 and 30),
  invoice_memo text,
  active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_profiles_workspace_processor_unique unique (workspace_id, processor)
);

create index if not exists billing_profiles_workspace_idx
  on public.billing_profiles (workspace_id);

create table if not exists public.billing_payment_methods (
  id uuid primary key default gen_random_uuid(),
  billing_profile_id uuid not null references public.billing_profiles(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  processor public.billing_processor not null default 'stripe',
  stripe_payment_method_id text unique,
  type public.billing_payment_method_type not null,
  wallet_type text,
  brand text,
  bank_name text,
  last4 text,
  exp_month integer check (exp_month between 1 and 12),
  exp_year integer,
  status public.billing_payment_method_status not null default 'active',
  is_default boolean not null default false,
  verified_at timestamptz,
  removed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists billing_payment_methods_profile_idx
  on public.billing_payment_methods (billing_profile_id, status);
create index if not exists billing_payment_methods_workspace_idx
  on public.billing_payment_methods (workspace_id, is_default);

alter table public.billing_profiles
  drop constraint if exists billing_profiles_default_payment_method_id_fkey;
alter table public.billing_profiles
  add constraint billing_profiles_default_payment_method_id_fkey
  foreign key (default_payment_method_id)
  references public.billing_payment_methods(id)
  on delete set null;

create table if not exists public.billing_catalog_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  kind public.billing_item_kind not null default 'service',
  unit_price_cents integer not null default 0,
  unit_cost_cents integer not null default 0,
  taxable boolean not null default false,
  tax_rate_bps integer not null default 0 check (tax_rate_bps between 0 and 10000),
  default_quantity numeric(12,2) not null default 1,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists billing_catalog_items_active_idx
  on public.billing_catalog_items (active, name);

create table if not exists public.billing_schedules (
  id uuid primary key default gen_random_uuid(),
  billing_profile_id uuid not null references public.billing_profiles(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  status public.billing_schedule_status not null default 'draft',
  collection_method public.billing_collection_method not null default 'auto_charge',
  interval public.billing_schedule_interval not null default 'month',
  interval_count integer not null default 1 check (interval_count between 1 and 36),
  first_invoice_date date not null,
  next_invoice_date date,
  end_date date,
  review_days_before_charge integer not null default 3 check (review_days_before_charge between 0 and 30),
  auto_send boolean not null default false,
  intro_message text,
  pdf_comment text,
  payment_terms_days integer not null default 0 check (payment_terms_days between 0 and 365),
  created_by uuid references public.profiles(id),
  activated_at timestamptz,
  paused_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_schedules_end_after_start check (end_date is null or end_date >= first_invoice_date)
);

create index if not exists billing_schedules_workspace_status_idx
  on public.billing_schedules (workspace_id, status, next_invoice_date);
create index if not exists billing_schedules_due_idx
  on public.billing_schedules (next_invoice_date)
  where status = 'active';

create table if not exists public.billing_schedule_lines (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.billing_schedules(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  catalog_item_id uuid references public.billing_catalog_items(id) on delete set null,
  kind public.billing_item_kind not null default 'service',
  title text not null,
  description text,
  quantity numeric(12,2) not null default 1,
  unit_price_cents integer not null default 0,
  unit_cost_cents integer not null default 0,
  discount_cents integer not null default 0,
  tax_rate_bps integer not null default 0 check (tax_rate_bps between 0 and 10000),
  taxable boolean not null default false,
  sort_order integer not null default 0,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists billing_schedule_lines_schedule_idx
  on public.billing_schedule_lines (schedule_id, sort_order);
create index if not exists billing_schedule_lines_workspace_property_idx
  on public.billing_schedule_lines (workspace_id, property_id);

create table if not exists public.billing_invoices (
  id uuid primary key default gen_random_uuid(),
  billing_profile_id uuid not null references public.billing_profiles(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  schedule_id uuid references public.billing_schedules(id) on delete set null,
  processor public.billing_processor not null default 'stripe',
  stripe_invoice_id text unique,
  stripe_payment_intent_id text,
  status public.billing_invoice_status not null default 'draft',
  collection_method public.billing_collection_method not null default 'auto_charge',
  invoice_date date not null default current_date,
  due_at timestamptz,
  paid_at timestamptz,
  payment_failed_at timestamptz,
  hosted_invoice_url text,
  subtotal_cents integer not null default 0,
  discount_cents integer not null default 0,
  tax_cents integer not null default 0,
  total_cents integer not null default 0,
  total_cost_cents integer not null default 0,
  margin_cents integer not null default 0,
  currency text not null default 'usd',
  memo text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_by uuid references public.profiles(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists billing_invoices_workspace_idx
  on public.billing_invoices (workspace_id, invoice_date desc);
create index if not exists billing_invoices_status_idx
  on public.billing_invoices (status, due_at);
create index if not exists billing_invoices_schedule_idx
  on public.billing_invoices (schedule_id, invoice_date desc);

create table if not exists public.billing_invoice_lines (
  id uuid primary key default gen_random_uuid(),
  billing_invoice_id uuid not null references public.billing_invoices(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  schedule_line_id uuid references public.billing_schedule_lines(id) on delete set null,
  catalog_item_id uuid references public.billing_catalog_items(id) on delete set null,
  kind public.billing_item_kind not null default 'service',
  title text not null,
  description text,
  quantity numeric(12,2) not null default 1,
  unit_price_cents integer not null default 0,
  unit_cost_cents integer not null default 0,
  discount_cents integer not null default 0,
  tax_rate_bps integer not null default 0 check (tax_rate_bps between 0 and 10000),
  tax_cents integer not null default 0,
  line_total_cents integer not null default 0,
  line_cost_cents integer not null default 0,
  margin_cents integer not null default 0,
  stripe_line_item_id text,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists billing_invoice_lines_invoice_idx
  on public.billing_invoice_lines (billing_invoice_id, sort_order);
create index if not exists billing_invoice_lines_workspace_property_idx
  on public.billing_invoice_lines (workspace_id, property_id);

create table if not exists public.billing_credits (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  billing_profile_id uuid references public.billing_profiles(id) on delete set null,
  billing_invoice_id uuid references public.billing_invoices(id) on delete set null,
  status public.billing_credit_status not null default 'available',
  amount_cents integer not null check (amount_cents > 0),
  remaining_cents integer not null check (remaining_cents >= 0),
  reason text not null,
  created_by uuid references public.profiles(id),
  applied_at timestamptz,
  voided_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_credits_remaining_lte_amount check (remaining_cents <= amount_cents)
);

create index if not exists billing_credits_workspace_status_idx
  on public.billing_credits (workspace_id, status);

create table if not exists public.billing_refunds (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  billing_invoice_id uuid references public.billing_invoices(id) on delete set null,
  processor public.billing_processor not null default 'stripe',
  stripe_refund_id text unique,
  status public.billing_refund_status not null default 'pending',
  amount_cents integer not null check (amount_cents > 0),
  reason text,
  created_by uuid references public.profiles(id),
  processed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists billing_refunds_workspace_idx
  on public.billing_refunds (workspace_id, created_at desc);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  billing_profile_id uuid references public.billing_profiles(id) on delete set null,
  billing_invoice_id uuid references public.billing_invoices(id) on delete set null,
  processor public.billing_processor not null default 'stripe',
  stripe_event_id text unique,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists billing_events_workspace_idx
  on public.billing_events (workspace_id, created_at desc);
create index if not exists billing_events_invoice_idx
  on public.billing_events (billing_invoice_id, created_at desc);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'billing_profiles',
    'billing_payment_methods',
    'billing_catalog_items',
    'billing_schedules',
    'billing_schedule_lines',
    'billing_invoices',
    'billing_invoice_lines',
    'billing_credits',
    'billing_refunds'
  ]
  loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', table_name, table_name);
    execute format(
      'create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name,
      table_name
    );
  end loop;
end $$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'billing_profiles',
    'billing_payment_methods',
    'billing_catalog_items',
    'billing_schedules',
    'billing_schedule_lines',
    'billing_invoices',
    'billing_invoice_lines',
    'billing_credits',
    'billing_refunds',
    'billing_events'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I_admin_all on public.%I', table_name, table_name);
    execute format(
      'create policy %I_admin_all on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      table_name,
      table_name
    );
  end loop;
end $$;

comment on table public.billing_profiles is
  'Workspace-level billing profile. Parcel owns billing logic, Stripe processes payment.';
comment on table public.billing_schedules is
  'Flexible recurring billing schedules for an Workspace. Multiple schedules can exist per Workspace.';
comment on table public.billing_invoice_lines is
  'Invoice line mirror with owner-facing amounts and admin-only unit cost and margin.';
