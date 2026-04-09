-- Block request wizard: new columns for the multi-step owner stay flow
-- Run this in the Supabase SQL Editor as a single block.

-- 1. Add new columns to block_requests
alter table public.block_requests
  add column if not exists check_in_time text,
  add column if not exists check_out_time text,
  add column if not exists reason text,
  add column if not exists is_owner_staying boolean not null default true,
  add column if not exists guest_name text,
  add column if not exists guest_email text,
  add column if not exists guest_phone text,
  add column if not exists adults int not null default 1,
  add column if not exists children int not null default 0,
  add column if not exists pets int not null default 0,
  add column if not exists needs_lock_code boolean not null default false,
  add column if not exists requested_lock_code text,
  add column if not exists wants_cleaning boolean not null default false,
  add column if not exists cleaning_fee numeric(10,2),
  add column if not exists damage_acknowledged boolean not null default false,
  add column if not exists confirmed_at timestamptz;

-- 2. Add check constraints
alter table public.block_requests
  add constraint block_requests_adults_check check (adults >= 0 and adults <= 30),
  add constraint block_requests_children_check check (children >= 0 and children <= 20),
  add constraint block_requests_pets_check check (pets >= 0 and pets <= 10);
