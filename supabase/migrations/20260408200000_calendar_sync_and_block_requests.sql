-- Calendar sync + block requests
--
-- Adds:
--   * properties.ical_url         (per-property Hospitable iCal feed URL)
--   * public.block_requests       (owner requests to reserve dates for personal use)
--
-- Applied manually to production on 2026-04-08 via the Supabase SQL Editor.
-- This file exists so `supabase db push` and future environments stay in sync.
-- It is idempotent and safe to re-run.

-- 0. Enable moddatetime extension (for the updated_at trigger)
create extension if not exists moddatetime schema extensions;

-- 1. Add the iCal feed URL column to properties
alter table public.properties
  add column if not exists ical_url text;

-- 2. Create the block_requests table
create table if not exists public.block_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  note text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint block_requests_date_order check (end_date >= start_date)
);

create index if not exists block_requests_owner_idx
  on public.block_requests (owner_id, created_at desc);
create index if not exists block_requests_property_idx
  on public.block_requests (property_id, start_date);

-- 3. Enable RLS
alter table public.block_requests enable row level security;

-- 4. Policies
drop policy if exists "Owners view own block requests" on public.block_requests;
create policy "Owners view own block requests"
  on public.block_requests
  for select
  using (owner_id = auth.uid());

drop policy if exists "Owners create own block requests" on public.block_requests;
create policy "Owners create own block requests"
  on public.block_requests
  for insert
  with check (owner_id = auth.uid());

drop policy if exists "Admins view all block requests" on public.block_requests;
create policy "Admins view all block requests"
  on public.block_requests
  for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists "Admins update block requests" on public.block_requests;
create policy "Admins update block requests"
  on public.block_requests
  for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- 5. Keep updated_at fresh on update
drop trigger if exists set_block_requests_updated_at on public.block_requests;
create trigger set_block_requests_updated_at
  before update on public.block_requests
  for each row execute procedure extensions.moddatetime(updated_at);
