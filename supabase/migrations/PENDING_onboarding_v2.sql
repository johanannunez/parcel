-- ============================================================
-- PENDING Onboarding v2 Schema Additions
-- Paste into Supabase SQL Editor when ready.
-- ============================================================

-- 1. Owner setup drafts (auto-save partial owner-level form data)
create table if not exists public.owner_setup_drafts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.owner_setup_drafts enable row level security;
create policy "Owners manage own drafts" on public.owner_setup_drafts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2. Property setup drafts (auto-save partial property-level form data)
create table if not exists public.property_setup_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  unique (user_id, property_id)
);
alter table public.property_setup_drafts enable row level security;
create policy "Owners manage own property drafts" on public.property_setup_drafts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3. Owner KYC (identity verification)
create table if not exists public.owner_kyc (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  legal_name text,
  license_number text,
  issuing_state text,
  expiration_date date,
  front_photo_url text,
  back_photo_url text,
  consent_given boolean not null default false,
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.owner_kyc enable row level security;
create policy "Owners manage own kyc" on public.owner_kyc
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 4. Signed documents (BoldSign tracking)
create table if not exists public.signed_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  boldsign_document_id text not null,
  template_name text not null,
  status text not null default 'pending',
  signed_at timestamptz,
  signed_pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.signed_documents enable row level security;
create policy "Owners read own documents" on public.signed_documents
  for select using (auth.uid() = user_id);
create policy "Service role inserts documents" on public.signed_documents
  for insert with check (true);
create policy "Service role updates documents" on public.signed_documents
  for update using (true);

-- 5. Setup field versions (append-only version history)
create table if not exists public.setup_field_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid references public.properties(id) on delete set null,
  step_key text not null,
  version_number int not null default 1,
  data jsonb not null default '{}',
  saved_at timestamptz not null default now(),
  saved_by uuid not null references public.profiles(id) on delete cascade
);
alter table public.setup_field_versions enable row level security;
create policy "Owners read own versions" on public.setup_field_versions
  for select using (auth.uid() = user_id);
create policy "Owners insert own versions" on public.setup_field_versions
  for insert with check (auth.uid() = user_id);

-- Index for fast version lookups
create index if not exists idx_setup_field_versions_lookup
  on public.setup_field_versions (user_id, property_id, step_key, version_number desc);

-- 6. Supabase Storage bucket for property photos
insert into storage.buckets (id, name, public)
  values ('property-photos', 'property-photos', true)
  on conflict (id) do nothing;

-- Storage RLS: owners can upload to their own folder
create policy "Owners upload property photos" on storage.objects
  for insert with check (
    bucket_id = 'property-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "Anyone can view property photos" on storage.objects
  for select using (bucket_id = 'property-photos');
create policy "Owners delete own property photos" on storage.objects
  for delete using (
    bucket_id = 'property-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 7. New columns on public.properties
alter table public.properties
  add column if not exists amenities jsonb,
  add column if not exists bed_arrangements jsonb,
  add column if not exists house_rules jsonb,
  add column if not exists wifi_details jsonb,
  add column if not exists guidebook_spots jsonb,
  add column if not exists cleaning_choice text,
  add column if not exists cleaning_team jsonb,
  add column if not exists compliance_details jsonb,
  add column if not exists photos jsonb,
  add column if not exists financial_baseline jsonb,
  add column if not exists agreement_acknowledged_at timestamptz,
  add column if not exists agreement_signed_at timestamptz,
  add column if not exists setup_status text not null default 'in_progress';

-- 8. New columns on public.profiles for owner account step
alter table public.profiles
  add column if not exists phone text,
  add column if not exists mailing_address jsonb;
