-- =====================================================================
-- PENDING — Parcel Onboarding Wizard v2 schema additions
-- =====================================================================
--
-- Status:        DRAFT, NOT YET APPLIED
-- Author:        agent overnight session, 2026-04-08
-- Purpose:       Backfill the columns that the new 9-section onboarding
--                wizard collects so that real owner submissions can be
--                stored end to end.
--
-- HOW TO APPLY (Johan, when you are ready):
-- ---------------------------------------------------------------------
--   1. Open Supabase Dashboard → Project parcel → SQL Editor.
--   2. Paste THIS ENTIRE FILE.
--   3. Click Run. Watch for any errors. Should run in under 2 seconds.
--   4. Tell the next agent that this migration ran, and rename this
--      file from PENDING_onboarding_v2.sql to a real timestamped
--      migration filename so `supabase db push` does not double-apply.
--   5. The wizard's server action (apps/web/src/app/(portal)/portal/
--      onboarding/property/actions.ts) needs a follow-up edit to
--      actually write all of these new columns. Until that edit lands,
--      the wizard still inserts only the basic columns and the rest
--      stay in localStorage. Adding the columns now is harmless and
--      future-proofs everything.
--
-- IF YOU SEE ERRORS:
--   - "column already exists": safe to ignore, migration is idempotent
--   - "permission denied": run as the project owner role
--   - anything else: STOP and ask the next agent
-- =====================================================================


-- ---------------------------------------------------------------------
-- profiles: owner contact and trust fields
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists preferred_name text,
  add column if not exists timezone text,
  add column if not exists contact_method text
    check (contact_method in ('email','sms','phone','whatsapp')),
  add column if not exists referral_source text,
  add column if not exists years_investing text,
  add column if not exists property_count_estimate text;

comment on column public.profiles.preferred_name is
  'What the owner wants to be called day-to-day. Falls back to full_name.';
comment on column public.profiles.timezone is
  'IANA tz string, e.g. America/Chicago. Auto-detected from address when possible.';


-- ---------------------------------------------------------------------
-- properties: physical and lifecycle metadata
-- ---------------------------------------------------------------------
alter table public.properties
  add column if not exists property_subtype text,
  add column if not exists year_built int,
  add column if not exists year_purchased int,
  add column if not exists currently_rented boolean,
  add column if not exists listed_elsewhere boolean,
  add column if not exists half_bathrooms int,
  add column if not exists stories int,
  add column if not exists parking_spaces int,
  add column if not exists parking_type text
    check (parking_type in ('garage','driveway','street','lot','none')),
  add column if not exists neighborhood text,
  add column if not exists timezone text,
  add column if not exists latitude numeric(9,6),
  add column if not exists longitude numeric(9,6);


-- ---------------------------------------------------------------------
-- property_amenities: a row per (property_id, amenity_key)
-- ---------------------------------------------------------------------
-- Booleans like wifi, pool, etc. would balloon the properties table
-- and make adding new amenities a migration. A normalized table is
-- cleaner and lets us add amenity types without DDL changes.
create table if not exists public.property_amenities (
  property_id uuid not null references public.properties(id) on delete cascade,
  amenity_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (property_id, amenity_key)
);

comment on table public.property_amenities is
  'Normalized amenity flags per property. amenity_key is a stable code like wifi, ac, pool, hot_tub, washer_dryer, dishwasher, smart_lock, workspace, grill, fenced_yard, ev_charger, hvac, etc.';


-- ---------------------------------------------------------------------
-- property_rules: house rules and policy preferences
-- ---------------------------------------------------------------------
create table if not exists public.property_rules (
  property_id uuid primary key references public.properties(id) on delete cascade,
  check_in_time text,
  check_out_time text,
  min_nights int,
  max_nights int,
  pets_allowed boolean,
  smoking_policy text
    check (smoking_policy in ('no','outdoor','designated')),
  events_allowed boolean,
  children_welcome boolean,
  quiet_hours text,
  cancellation_policy text,
  damage_deposit numeric(10,2),
  cleaning_fee numeric(10,2),
  pet_fee numeric(10,2),
  extra_guest_fee numeric(10,2),
  extra_guest_threshold int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- property_compliance: permits, insurance, HOA, regulatory
-- ---------------------------------------------------------------------
create table if not exists public.property_compliance (
  property_id uuid primary key references public.properties(id) on delete cascade,
  permit_required text
    check (permit_required in ('yes','no','unsure')),
  permit_number text,
  permit_expires date,
  permit_document_url text,
  insurance_carrier text,
  insurance_policy_number text,
  insurance_expires date,
  insurance_document_url text,
  hoa_exists boolean,
  hoa_allows_str text
    check (hoa_allows_str in ('yes','no','unsure')),
  hoa_contact text,
  hoa_fees numeric(10,2),
  mortgage_holder text,
  mortgage_allows_str boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- property_team: cleaner, handyman, photographer contacts
-- ---------------------------------------------------------------------
create table if not exists public.property_team (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  role text not null
    check (role in ('cleaner','handyman','photographer','landscaper','poolservice','locksmith','other')),
  name text,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists property_team_property_id_idx
  on public.property_team (property_id);


-- ---------------------------------------------------------------------
-- onboarding_drafts: server-side draft persistence (future)
-- ---------------------------------------------------------------------
-- Right now drafts live in localStorage. Once the wizard is mature,
-- we will mirror to this table so an owner can continue from a
-- different device. Schema is ready, code wiring is not.
create table if not exists public.onboarding_drafts (
  owner_id uuid primary key references public.profiles(id) on delete cascade,
  draft jsonb not null default '{}'::jsonb,
  current_section text,
  updated_at timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- updated_at triggers for the new tables
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists property_rules_set_updated_at on public.property_rules;
create trigger property_rules_set_updated_at
  before update on public.property_rules
  for each row execute function public.set_updated_at();

drop trigger if exists property_compliance_set_updated_at on public.property_compliance;
create trigger property_compliance_set_updated_at
  before update on public.property_compliance
  for each row execute function public.set_updated_at();

drop trigger if exists property_team_set_updated_at on public.property_team;
create trigger property_team_set_updated_at
  before update on public.property_team
  for each row execute function public.set_updated_at();

drop trigger if exists onboarding_drafts_set_updated_at on public.onboarding_drafts;
create trigger onboarding_drafts_set_updated_at
  before update on public.onboarding_drafts
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.property_amenities enable row level security;
alter table public.property_rules enable row level security;
alter table public.property_compliance enable row level security;
alter table public.property_team enable row level security;
alter table public.onboarding_drafts enable row level security;

-- Helper: an owner has access to a row if they own the parent property.
-- Reuses the existing pattern from the initial migration.

drop policy if exists "Owners view own amenities" on public.property_amenities;
create policy "Owners view own amenities"
  on public.property_amenities for select
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_amenities.property_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Owners write own amenities" on public.property_amenities;
create policy "Owners write own amenities"
  on public.property_amenities for all
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_amenities.property_id
        and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.properties p
      where p.id = property_amenities.property_id
        and p.owner_id = auth.uid()
    )
  );

-- Same pattern for the other per-property tables. Kept verbose so
-- the policies are obvious to anyone reading the schema.

drop policy if exists "Owners view own rules" on public.property_rules;
create policy "Owners view own rules"
  on public.property_rules for select
  using (
    exists (select 1 from public.properties p
      where p.id = property_rules.property_id and p.owner_id = auth.uid())
  );

drop policy if exists "Owners write own rules" on public.property_rules;
create policy "Owners write own rules"
  on public.property_rules for all
  using (
    exists (select 1 from public.properties p
      where p.id = property_rules.property_id and p.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.properties p
      where p.id = property_rules.property_id and p.owner_id = auth.uid())
  );

drop policy if exists "Owners view own compliance" on public.property_compliance;
create policy "Owners view own compliance"
  on public.property_compliance for select
  using (
    exists (select 1 from public.properties p
      where p.id = property_compliance.property_id and p.owner_id = auth.uid())
  );

drop policy if exists "Owners write own compliance" on public.property_compliance;
create policy "Owners write own compliance"
  on public.property_compliance for all
  using (
    exists (select 1 from public.properties p
      where p.id = property_compliance.property_id and p.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.properties p
      where p.id = property_compliance.property_id and p.owner_id = auth.uid())
  );

drop policy if exists "Owners view own team" on public.property_team;
create policy "Owners view own team"
  on public.property_team for select
  using (
    exists (select 1 from public.properties p
      where p.id = property_team.property_id and p.owner_id = auth.uid())
  );

drop policy if exists "Owners write own team" on public.property_team;
create policy "Owners write own team"
  on public.property_team for all
  using (
    exists (select 1 from public.properties p
      where p.id = property_team.property_id and p.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.properties p
      where p.id = property_team.property_id and p.owner_id = auth.uid())
  );

drop policy if exists "Owners read own draft" on public.onboarding_drafts;
create policy "Owners read own draft"
  on public.onboarding_drafts for select
  using (owner_id = auth.uid());

drop policy if exists "Owners write own draft" on public.onboarding_drafts;
create policy "Owners write own draft"
  on public.onboarding_drafts for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());


-- ---------------------------------------------------------------------
-- DONE
-- ---------------------------------------------------------------------
-- After running, regenerate the TypeScript types:
--
--   supabase gen types typescript --project-id pwoxwpryummqeqsxdgyc \
--     --schema public > apps/web/src/types/supabase.ts
--
-- Then the wizard server action can be expanded to write into the
-- new tables. That edit is a follow-up commit, not part of this SQL.
-- =====================================================================
