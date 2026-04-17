-- Stripe billing tables
-- We mirror Stripe objects locally so queries are fast and admin UI doesn't
-- round-trip Stripe for every page load.

-- stripe_customers: one per profile
create table if not exists public.stripe_customers (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  stripe_customer_id text not null unique,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stripe_customers_stripe_id_idx
  on public.stripe_customers (stripe_customer_id);

drop trigger if exists set_stripe_customers_updated_at on public.stripe_customers;
create trigger set_stripe_customers_updated_at
  before update on public.stripe_customers
  for each row execute function public.set_updated_at();

alter table public.stripe_customers enable row level security;

drop policy if exists stripe_customers_admin_all on public.stripe_customers;
create policy stripe_customers_admin_all on public.stripe_customers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists stripe_customers_owner_read on public.stripe_customers;
create policy stripe_customers_owner_read on public.stripe_customers
  for select to authenticated using (profile_id = auth.uid());

-- invoices
do $$
begin
  if not exists (select 1 from pg_type where typname = 'invoice_kind') then
    create type public.invoice_kind as enum ('onboarding_fee','tech_fee','adhoc');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'invoice_status') then
    create type public.invoice_status as enum ('draft','open','paid','uncollectible','void');
  end if;
end $$;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  stripe_invoice_id text unique,
  kind public.invoice_kind not null default 'adhoc',
  amount_cents integer not null default 0,
  currency text not null default 'usd',
  status public.invoice_status not null default 'draft',
  due_at timestamptz,
  paid_at timestamptz,
  hosted_invoice_url text,
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_owner_idx on public.invoices (owner_id, created_at desc);
create index if not exists invoices_status_idx on public.invoices (status) where status in ('open','uncollectible');

drop trigger if exists set_invoices_updated_at on public.invoices;
create trigger set_invoices_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

alter table public.invoices enable row level security;

drop policy if exists invoices_admin_all on public.invoices;
create policy invoices_admin_all on public.invoices
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists invoices_owner_read on public.invoices;
create policy invoices_owner_read on public.invoices
  for select to authenticated using (owner_id = auth.uid());

-- invoice_items
create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  amount_cents integer not null default 0,
  quantity integer not null default 1,
  stripe_line_item_id text,
  created_at timestamptz not null default now()
);

create index if not exists invoice_items_invoice_idx on public.invoice_items (invoice_id);

alter table public.invoice_items enable row level security;

drop policy if exists invoice_items_admin_all on public.invoice_items;
create policy invoice_items_admin_all on public.invoice_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists invoice_items_owner_read on public.invoice_items;
create policy invoice_items_owner_read on public.invoice_items
  for select to authenticated
  using (exists (select 1 from public.invoices i where i.id = invoice_id and i.owner_id = auth.uid()));

-- subscriptions
do $$
begin
  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type public.subscription_status as enum ('active','past_due','canceled','incomplete','incomplete_expired','trialing','unpaid','paused');
  end if;
end $$;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  stripe_subscription_id text unique,
  stripe_price_id text,
  price_cents integer not null default 0,
  currency text not null default 'usd',
  interval text not null default 'month' check (interval in ('day','week','month','year')),
  status public.subscription_status not null default 'active',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_owner_idx on public.subscriptions (owner_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status) where status in ('past_due','unpaid','incomplete');

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

drop policy if exists subscriptions_admin_all on public.subscriptions;
create policy subscriptions_admin_all on public.subscriptions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists subscriptions_owner_read on public.subscriptions;
create policy subscriptions_owner_read on public.subscriptions
  for select to authenticated using (owner_id = auth.uid());

comment on table public.invoices is 'Local mirror of Stripe Invoice objects scoped to a Parcel owner.';
comment on table public.subscriptions is 'Local mirror of Stripe Subscription objects (tech fee, etc.).';
