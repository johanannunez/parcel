-- =====================================================================
-- Parcel — Initial Schema
-- =====================================================================
-- Phase 2 of the consolidation plan. Establishes the foundational data
-- model for the owner portal, admin views, and inquiry intake.
--
-- Notes:
--   - Every table has Row Level Security (RLS) enabled explicitly.
--   - Helper functions use `language plpgsql` (NOT `language sql`) to
--     prevent inlining that strips `security definer` context and
--     causes infinite recursion on RLS policies. This bug bit FurnishPro
--     and is documented in MEMORY.md. Do not change to `language sql`.
--   - Tables use uuid primary keys with `gen_random_uuid()` defaults.
--   - All timestamps are `timestamptz` (timezone-aware) defaulting to
--     `now()` and updated via triggers where applicable.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";


-- ---------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------

-- Role determines what an authenticated user can see and do.
-- 'owner' is the default for anyone who signs up. Promotion to 'admin'
-- happens manually via SQL by a Parcel Co staff member.
create type public.user_role as enum ('owner', 'admin');

-- Property type categories. Mirrors the agent's marketing site copy
-- so visitors and owners use consistent vocabulary.
create type public.property_type as enum (
  'str',           -- short term rental (vacation rental)
  'ltr',           -- long term rental
  'arbitrage',     -- rental arbitrage (lease and re-rent)
  'mtr',           -- mid term rental (30+ days, corporate housing)
  'co-hosting'     -- managed for owner under Parcel Co arrangement
);

-- Booking source so we know where reservations come from.
create type public.booking_source as enum (
  'direct',
  'airbnb',
  'vrbo',
  'booking_com',
  'furnished_finder',
  'hospitable',
  'other'
);

-- Inquiry status for the public marketing form.
create type public.inquiry_status as enum (
  'new',
  'contacted',
  'qualified',
  'won',
  'lost'
);


-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
-- One row per authenticated user. Links to auth.users.id.
-- A trigger inserts a row automatically when a new user signs up.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  phone text,
  avatar_url text,
  role public.user_role not null default 'owner',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'User profiles. One row per auth.users entry, created automatically on signup.';


-- ---------------------------------------------------------------------
-- properties
-- ---------------------------------------------------------------------
-- A property an owner has placed under Parcel management.
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text,
  property_type public.property_type not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'US',
  bedrooms int,
  bathrooms numeric(3,1),
  square_feet int,
  guest_capacity int,
  hospitable_property_id text,
  active boolean not null default true,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index properties_owner_id_idx on public.properties (owner_id);
create index properties_active_idx on public.properties (active);

comment on table public.properties is
  'Properties under Parcel management. Each property belongs to one owner.';


-- ---------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------
-- A reservation against a property. Phase 2 stores the basics; the
-- booking sync from Hospitable will populate this in a later phase.
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  source public.booking_source not null default 'direct',
  external_id text,
  guest_name text,
  guest_email text,
  check_in date not null,
  check_out date not null,
  nights int generated always as (check_out - check_in) stored,
  total_amount numeric(10,2),
  currency text not null default 'USD',
  status text not null default 'confirmed',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_check_dates check (check_out > check_in)
);

create index bookings_property_id_idx on public.bookings (property_id);
create index bookings_check_in_idx on public.bookings (check_in);
create unique index bookings_source_external_unique
  on public.bookings (source, external_id)
  where external_id is not null;

comment on table public.bookings is
  'Reservations against properties. Populated by manual entry or Hospitable sync.';


-- ---------------------------------------------------------------------
-- payouts
-- ---------------------------------------------------------------------
-- Money paid out to an owner for a property over a period.
create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  gross_revenue numeric(10,2) not null default 0,
  fees numeric(10,2) not null default 0,
  net_payout numeric(10,2) not null default 0,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payouts_check_period check (period_end >= period_start)
);

create index payouts_property_id_idx on public.payouts (property_id);
create index payouts_period_idx on public.payouts (period_start, period_end);

comment on table public.payouts is
  'Owner payouts for a property over a billing period.';


-- ---------------------------------------------------------------------
-- connections
-- ---------------------------------------------------------------------
-- Third-party accounts an owner has linked (Hospitable, Stripe, etc.).
-- Token storage is intentionally kept out of this table; we will use
-- Supabase Vault for secrets in a later phase.
create table public.connections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  external_account_id text,
  status text not null default 'connected',
  metadata jsonb not null default '{}'::jsonb,
  connected_at timestamptz not null default now(),
  disconnected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint connections_owner_provider_unique unique (owner_id, provider)
);

create index connections_owner_id_idx on public.connections (owner_id);

comment on table public.connections is
  'Third-party integrations linked to an owner account (Hospitable, etc.).';


-- ---------------------------------------------------------------------
-- inquiries
-- ---------------------------------------------------------------------
-- Public inquiry form submissions from the marketing site
-- (apps/web/src/app/api/inquiries/route.ts).
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  property_address text,
  property_count int,
  property_type public.property_type,
  message text,
  source text,
  status public.inquiry_status not null default 'new',
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index inquiries_status_idx on public.inquiries (status);
create index inquiries_created_at_idx on public.inquiries (created_at desc);

comment on table public.inquiries is
  'Public inquiry form submissions from theparcelco.com marketing site.';


-- ---------------------------------------------------------------------
-- activity_log
-- ---------------------------------------------------------------------
-- Lightweight audit trail for admin visibility into who did what.
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index activity_log_actor_id_idx on public.activity_log (actor_id);
create index activity_log_entity_idx on public.activity_log (entity_type, entity_id);
create index activity_log_created_at_idx on public.activity_log (created_at desc);

comment on table public.activity_log is
  'Audit trail of significant actions across the system.';


-- ---------------------------------------------------------------------
-- updated_at trigger function
-- ---------------------------------------------------------------------
-- Auto-updates the updated_at column on any UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

create trigger payouts_set_updated_at
  before update on public.payouts
  for each row execute function public.set_updated_at();

create trigger connections_set_updated_at
  before update on public.connections
  for each row execute function public.set_updated_at();

create trigger inquiries_set_updated_at
  before update on public.inquiries
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- handle_new_user trigger
-- ---------------------------------------------------------------------
-- Creates a profiles row automatically whenever a new user signs up
-- via Supabase Auth. Pulls email and optional full_name from
-- raw_user_meta_data passed during signUp().
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', null)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------------
-- RLS helper functions
-- ---------------------------------------------------------------------
-- IMPORTANT: language plpgsql (NOT language sql).
-- Reason: SQL functions get inlined by PostgreSQL, which strips the
-- `security definer` context and causes infinite recursion on RLS
-- policies that reference profiles. plpgsql functions are not inlined
-- and preserve the security context. This bug bit FurnishPro and is
-- documented in MEMORY.md.

-- Returns true if the current authenticated user has the 'admin' role.
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_role public.user_role;
begin
  select role into v_role
  from public.profiles
  where id = auth.uid();
  return coalesce(v_role = 'admin', false);
end;
$$;

-- Returns true if the current user owns the given property.
create or replace function public.user_owns_property(p_property_id uuid)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_owner uuid;
begin
  select owner_id into v_owner
  from public.properties
  where id = p_property_id;
  return v_owner = auth.uid();
end;
$$;


-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.properties    enable row level security;
alter table public.bookings      enable row level security;
alter table public.payouts       enable row level security;
alter table public.connections   enable row level security;
alter table public.inquiries     enable row level security;
alter table public.activity_log  enable row level security;


-- profiles: a user can see and update their own profile.
-- Admins can see and update any profile.
create policy "Users view own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "Users update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- profiles inserts come from the handle_new_user trigger which runs
-- as security definer, so no insert policy is needed for end users.


-- properties: an owner sees their own properties. Admins see all.
create policy "Owners view own properties"
  on public.properties for select
  to authenticated
  using (owner_id = auth.uid() or public.is_admin());

create policy "Owners insert own properties"
  on public.properties for insert
  to authenticated
  with check (owner_id = auth.uid() or public.is_admin());

create policy "Owners update own properties"
  on public.properties for update
  to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

create policy "Owners delete own properties"
  on public.properties for delete
  to authenticated
  using (owner_id = auth.uid() or public.is_admin());


-- bookings: visibility follows property ownership.
create policy "Owners view bookings for their properties"
  on public.bookings for select
  to authenticated
  using (public.user_owns_property(property_id) or public.is_admin());

create policy "Owners insert bookings for their properties"
  on public.bookings for insert
  to authenticated
  with check (public.user_owns_property(property_id) or public.is_admin());

create policy "Owners update bookings for their properties"
  on public.bookings for update
  to authenticated
  using (public.user_owns_property(property_id) or public.is_admin())
  with check (public.user_owns_property(property_id) or public.is_admin());

create policy "Owners delete bookings for their properties"
  on public.bookings for delete
  to authenticated
  using (public.user_owns_property(property_id) or public.is_admin());


-- payouts: visibility follows property ownership.
create policy "Owners view payouts for their properties"
  on public.payouts for select
  to authenticated
  using (public.user_owns_property(property_id) or public.is_admin());

create policy "Owners insert payouts for their properties"
  on public.payouts for insert
  to authenticated
  with check (public.user_owns_property(property_id) or public.is_admin());

create policy "Owners update payouts for their properties"
  on public.payouts for update
  to authenticated
  using (public.user_owns_property(property_id) or public.is_admin())
  with check (public.user_owns_property(property_id) or public.is_admin());

create policy "Owners delete payouts for their properties"
  on public.payouts for delete
  to authenticated
  using (public.user_owns_property(property_id) or public.is_admin());


-- connections: a user sees their own connections.
create policy "Owners view own connections"
  on public.connections for select
  to authenticated
  using (owner_id = auth.uid() or public.is_admin());

create policy "Owners insert own connections"
  on public.connections for insert
  to authenticated
  with check (owner_id = auth.uid() or public.is_admin());

create policy "Owners update own connections"
  on public.connections for update
  to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

create policy "Owners delete own connections"
  on public.connections for delete
  to authenticated
  using (owner_id = auth.uid() or public.is_admin());


-- inquiries: only admins can read, update, or delete.
-- The public marketing form INSERTS via the service role client
-- inside the /api/inquiries route, which bypasses RLS by design.
-- No insert policy is granted to anon or authenticated.
create policy "Admins view all inquiries"
  on public.inquiries for select
  to authenticated
  using (public.is_admin());

create policy "Admins update inquiries"
  on public.inquiries for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins delete inquiries"
  on public.inquiries for delete
  to authenticated
  using (public.is_admin());


-- activity_log: only admins can read. Inserts happen via service role
-- from Server Actions and route handlers, bypassing RLS.
create policy "Admins view activity log"
  on public.activity_log for select
  to authenticated
  using (public.is_admin());
