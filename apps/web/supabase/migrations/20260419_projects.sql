-- Projects: internal initiatives (features, onboarding, ideas, vendors).

create table if not exists public.projects (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  description         text,
  project_type        text not null
                      check (project_type in (
                        'idea','feature_build','employee_onboarding',
                        'cleaner_onboarding','vendor_onboarding','internal'
                      )),
  status              text not null default 'not_started'
                      check (status in (
                        'not_started','in_progress','blocked','done','archived'
                      )),
  owner_user_id       uuid references profiles(id),
  target_date         date,
  linked_contact_id   uuid references contacts(id) on delete set null,
  linked_property_id  uuid references properties(id) on delete set null,
  archived_at         timestamptz,
  emoji               text,
  color               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists projects_status_idx on projects (status)
  where status <> 'archived';
create index if not exists projects_type_idx on projects (project_type);
create index if not exists projects_owner_idx on projects (owner_user_id);
create index if not exists projects_linked_contact_idx
  on projects (linked_contact_id) where linked_contact_id is not null;
create index if not exists projects_linked_property_idx
  on projects (linked_property_id) where linked_property_id is not null;

create or replace function projects_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if new.status = 'archived' and (old.status is null or old.status <> 'archived') then
    new.archived_at := coalesce(new.archived_at, now());
  end if;
  if new.status <> 'archived' then
    new.archived_at := null;
  end if;
  return new;
end $$;

drop trigger if exists projects_touch_updated_at on projects;
create trigger projects_touch_updated_at
before update on projects
for each row execute function projects_touch_updated_at();

alter table projects enable row level security;

drop policy if exists projects_admin_rw on projects;
create policy projects_admin_rw on projects
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Saved views
insert into saved_views (entity_type, key, name, is_shared, sort_order, filter_jsonb, sort, view_mode)
values
  ('project','all-projects','All Projects',true,10,'{"exclude_status":["archived"]}','recent_activity','compact'),
  ('project','idea-board','Idea Board',true,20,'{"types":["idea"]}','name_asc','compact'),
  ('project','feature-builds','Feature Builds',true,30,'{"types":["feature_build"]}','target_date_asc','compact'),
  ('project','cleaner-onboarding','Cleaner Onboarding',true,40,'{"types":["cleaner_onboarding"]}','recent_activity','compact'),
  ('project','employee-onboarding','Employee Onboarding',true,50,'{"types":["employee_onboarding"]}','recent_activity','compact'),
  ('project','vendor-onboarding','Vendor Onboarding',true,60,'{"types":["vendor_onboarding"]}','recent_activity','compact'),
  ('project','archived','Archived',true,70,'{"status":["archived"]}','updated_desc','compact')
on conflict (entity_type, key, coalesce(owner_user_id::text, 'SHARED')) do nothing;
