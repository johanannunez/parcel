-- Contacts and Saved Views foundation
-- Consolidates the Lead and Owner worlds into one record with a lifecycle_stage.

-- 1. Lifecycle stage enum
do $$
begin
  if not exists (select 1 from pg_type where typname = 'contact_lifecycle_stage') then
    create type contact_lifecycle_stage as enum (
      'lead_new','qualified','in_discussion','contract_sent',
      'onboarding','active_owner','paused','churned'
    );
  end if;
end $$;

-- 2. contacts table
create table if not exists public.contacts (
  id                uuid primary key default gen_random_uuid(),
  profile_id        uuid references profiles(id) on delete set null,
  full_name         text not null,
  display_name      text,
  company_name      text,
  email             text,
  phone             text,
  avatar_url        text,
  source            text,
  source_detail     text,
  lifecycle_stage   contact_lifecycle_stage not null default 'lead_new',
  stage_changed_at  timestamptz not null default now(),
  assigned_to       uuid references profiles(id),
  estimated_mrr     numeric(10,2),
  metadata          jsonb not null default '{}'::jsonb,
  last_activity_at  timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create unique index if not exists contacts_profile_id_unique_idx
  on contacts (profile_id) where profile_id is not null;
create index if not exists contacts_lifecycle_idx on contacts (lifecycle_stage);
create index if not exists contacts_assigned_idx on contacts (assigned_to);
create index if not exists contacts_email_lower_idx on contacts (lower(email));
create index if not exists contacts_last_activity_idx on contacts (last_activity_at desc nulls last);

-- 3. properties.contact_id
alter table public.properties
  add column if not exists contact_id uuid references contacts(id);
create index if not exists properties_contact_idx on public.properties (contact_id);

-- 4. saved_views table
create table if not exists public.saved_views (
  id              uuid primary key default gen_random_uuid(),
  entity_type     text not null check (entity_type in ('contact','property','project','task')),
  key             text not null,
  name            text not null,
  owner_user_id   uuid references profiles(id) on delete cascade,
  is_shared       boolean not null default false,
  sort_order      integer not null default 0,
  filter_jsonb    jsonb not null default '{}'::jsonb,
  grouping        text,
  sort            text,
  columns_jsonb   jsonb default '[]'::jsonb,  -- ordered array of visible column keys
  view_mode       text not null default 'compact'
                  check (view_mode in ('status','gallery','compact','map','list','kanban','calendar')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create unique index if not exists saved_views_entity_key_owner_idx
  on saved_views (entity_type, key, coalesce(owner_user_id::text, 'SHARED'));
create index if not exists saved_views_entity_order_idx
  on saved_views (entity_type, sort_order);

-- 5. Backfill contacts from existing profiles (owner role)
insert into contacts (
  id, profile_id, full_name, email, phone, avatar_url,
  lifecycle_stage, stage_changed_at, created_at, updated_at
)
select
  gen_random_uuid(),
  p.id,
  coalesce(nullif(trim(p.full_name), ''), split_part(p.email, '@', 1), 'Unnamed Owner'),
  p.email,
  p.phone,
  p.avatar_url,
  case
    when p.onboarding_completed_at is not null then 'active_owner'::contact_lifecycle_stage
    else 'onboarding'::contact_lifecycle_stage
  end,
  coalesce(p.onboarding_completed_at, p.created_at, now()),
  coalesce(p.created_at, now()),
  now()
from profiles p
where p.role = 'owner'
on conflict (profile_id) where profile_id is not null do nothing;

-- 6. Backfill properties.contact_id from existing owner linkage
-- properties.owner_id -> profiles.id. Link to contacts via profile_id.
-- properties.owner_id references profiles.id. Link to contacts via the profile_id backfill above.
update properties pr
   set contact_id = c.id
  from contacts c
 where c.profile_id = pr.owner_id
   and pr.contact_id is null;

-- 7. Seed default saved views (contact entity)
insert into saved_views (entity_type, key, name, is_shared, sort_order, filter_jsonb, sort, view_mode)
values
  ('contact','all-contacts','All Contacts',true,10,'{"stages":["lead_new","qualified","in_discussion","contract_sent","onboarding","active_owner","paused","churned"]}','name_asc','compact'),
  ('contact','lead-pipeline','Lead Pipeline',true,20,'{"stages":["lead_new","qualified","in_discussion","contract_sent"]}','stage_age','status'),
  ('contact','onboarding','Onboarding',true,30,'{"stages":["onboarding"]}','recent_activity','compact'),
  ('contact','active-owners','Active Owners',true,40,'{"stages":["active_owner"]}','name_asc','compact'),
  ('contact','cold','Cold',true,50,'{"stages":["qualified","in_discussion"],"last_activity_older_than_days":14}','stage_age','compact'),
  ('contact','churned','Churned',true,60,'{"stages":["paused","churned"]}','recent_activity','compact')
on conflict (entity_type, key, coalesce(owner_user_id::text, 'SHARED')) do nothing;

-- 8. RLS
alter table contacts enable row level security;
alter table saved_views enable row level security;

drop policy if exists contacts_admin_rw on contacts;
create policy contacts_admin_rw on contacts
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Owners may only read their own contact row. All writes are admin-only.
drop policy if exists contacts_owner_self_select on contacts;
create policy contacts_owner_self_select on contacts
  for select
  using (profile_id = auth.uid());

drop policy if exists saved_views_admin_rw on saved_views;
create policy saved_views_admin_rw on saved_views
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- 9. updated_at trigger
create or replace function contacts_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if new.lifecycle_stage is distinct from old.lifecycle_stage then
    new.stage_changed_at := now();
  end if;
  return new;
end $$;

drop trigger if exists contacts_touch_updated_at on contacts;
create trigger contacts_touch_updated_at
before update on contacts
for each row execute function contacts_touch_updated_at();
