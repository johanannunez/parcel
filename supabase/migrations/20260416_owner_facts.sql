-- owner_facts: structured facts about an owner.
-- v1: populated manually from admin UI.
-- v2 (future): populated by AI extraction from meetings, emails, documents.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'owner_fact_source_type') then
    create type public.owner_fact_source_type as enum ('manual','meeting','email','message','document','ai_summary');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'owner_fact_category') then
    create type public.owner_fact_category as enum ('communication','background','relationships','property_knowledge','business','personal','other');
  end if;
end $$;

create table if not exists public.owner_facts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  source_type public.owner_fact_source_type not null default 'manual',
  source_id uuid,
  category public.owner_fact_category,
  confidence numeric(3,2) not null default 1.0,
  pinned boolean not null default false,
  suppressed boolean not null default false,
  expires_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists owner_facts_owner_idx on public.owner_facts (owner_id) where suppressed = false;
create index if not exists owner_facts_pending_idx on public.owner_facts (owner_id) where pinned = false and source_type <> 'manual' and suppressed = false;

-- Updated_at trigger
drop trigger if exists set_owner_facts_updated_at on public.owner_facts;
create trigger set_owner_facts_updated_at
  before update on public.owner_facts
  for each row
  execute function public.set_updated_at();

-- RLS: admin-only, owners never see this table
alter table public.owner_facts enable row level security;

drop policy if exists owner_facts_admin_read on public.owner_facts;
create policy owner_facts_admin_read
  on public.owner_facts for select
  to authenticated
  using (public.is_admin());

drop policy if exists owner_facts_admin_write on public.owner_facts;
create policy owner_facts_admin_write
  on public.owner_facts for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

comment on table public.owner_facts is
  'Structured facts about an owner. Admin-only. V1: manual notes. V2: AI-extracted from meetings/emails/docs.';
