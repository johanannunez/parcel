-- apps/web/supabase/migrations/20260424_vendors.sql

create table if not exists public.vendors (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references public.profiles(id) on delete cascade,
  full_name      text not null,
  company_name   text,
  phone          text,
  email          text,
  trade          text,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists vendors_phone_idx on public.vendors (phone);
create index if not exists vendors_profile_id_idx on public.vendors (profile_id);

create table if not exists public.vendor_properties (
  vendor_id    uuid not null references public.vendors(id) on delete cascade,
  property_id  uuid not null references public.properties(id) on delete cascade,
  primary key (vendor_id, property_id)
);

alter table public.vendors enable row level security;
alter table public.vendor_properties enable row level security;

create policy "Admins can manage vendors"
  on public.vendors
  for all
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can manage vendor_properties"
  on public.vendor_properties
  for all
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
