-- Task upgrades for polish pass, rich editor, and recurring tasks.
-- Non-destructive. Backfills existing tasks to safe defaults.

-- 1. task_type enum
do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_kind') then
    create type task_kind as enum ('todo','call','meeting','email','milestone');
  end if;
end $$;

-- 2. New columns on tasks
alter table public.tasks
  add column if not exists task_type task_kind not null default 'todo',
  add column if not exists tags text[] not null default '{}',
  add column if not exists estimated_minutes integer,
  add column if not exists linked_contact_id uuid references contacts(id) on delete set null,
  add column if not exists linked_property_id uuid references properties(id) on delete set null,
  add column if not exists recurrence_rule jsonb,
  add column if not exists spawned_from_task_id uuid references tasks(id) on delete set null,
  add column if not exists next_spawn_at timestamptz,
  add column if not exists pre_notify_hours integer;

create index if not exists tasks_type_idx on tasks (task_type);
create index if not exists tasks_tags_idx on tasks using gin (tags);
create index if not exists tasks_recurrence_idx on tasks (next_spawn_at) where recurrence_rule is not null;
create index if not exists tasks_linked_contact_idx on tasks (linked_contact_id) where linked_contact_id is not null;
create index if not exists tasks_linked_property_idx on tasks (linked_property_id) where linked_property_id is not null;

-- 3. task_templates for per-property recurring maintenance
create table if not exists public.task_templates (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  description        text,
  task_type          task_kind not null default 'todo',
  tags               text[] not null default '{}',
  estimated_minutes  integer,
  recurrence_rule    jsonb not null,
  pre_notify_hours   integer,
  applies_to         text not null default 'property' check (applies_to in ('property','contact','global')),
  is_active          boolean not null default true,
  created_by         uuid references profiles(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists task_templates_applies_to_idx on task_templates (applies_to) where is_active = true;

drop trigger if exists task_templates_touch_updated_at on task_templates;
create trigger task_templates_touch_updated_at
before update on task_templates
for each row execute function public.touch_updated_at();

-- 4. property_task_template_instances: tracks which templates are active per property
create table if not exists public.property_task_templates (
  property_id         uuid not null references properties(id) on delete cascade,
  template_id         uuid not null references task_templates(id) on delete cascade,
  assignee_id         uuid references profiles(id),
  last_spawned_at     timestamptz,
  next_due_at         timestamptz,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  primary key (property_id, template_id)
);

create index if not exists property_task_templates_next_due_idx
  on property_task_templates (next_due_at) where is_active = true;

-- 5. RLS on new tables
alter table task_templates enable row level security;
alter table property_task_templates enable row level security;

drop policy if exists task_templates_admin_rw on task_templates;
create policy task_templates_admin_rw on task_templates
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists property_task_templates_admin_rw on property_task_templates;
create policy property_task_templates_admin_rw on property_task_templates
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- 6. Seed a few default task templates owners can use out of the box
insert into task_templates (name, description, task_type, tags, estimated_minutes, recurrence_rule, pre_notify_hours, applies_to)
values
  ('HVAC filter change', 'Swap the HVAC air filter. Standard 16x20x1 unless spec overridden.', 'todo', array['maintenance','hvac'], 15,
   jsonb_build_object('freq','monthly','interval',6,'notes','every 6 months'),
   336, 'property'),
  ('Smoke & CO detector test', 'Press and verify all smoke + CO detectors beep.', 'todo', array['maintenance','safety'], 10,
   jsonb_build_object('freq','monthly','interval',3,'notes','every 3 months'),
   168, 'property'),
  ('Deep clean deep dive', 'Schedule a seasonal deep clean with the primary cleaner.', 'meeting', array['cleaning'], 30,
   jsonb_build_object('freq','monthly','interval',3,'notes','quarterly'),
   336, 'property'),
  ('STR license renewal reminder', 'Confirm short-term rental permit is not within 60 days of expiry.', 'todo', array['compliance'], 20,
   jsonb_build_object('freq','yearly','interval',1,'notes','annual'),
   1440, 'property')
on conflict do nothing;
