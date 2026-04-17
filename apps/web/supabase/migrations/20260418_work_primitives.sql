-- =============================================================
-- 20260418_work_primitives.sql
--
-- Half 1: Rename existing task_manager cluster to *_legacy.
--   Data preserved; old /admin/tasks UI continues to work until
--   it is replaced later in Plan B. Enum types (task_type,
--   task_status, task_priority) stay attached to the renamed
--   legacy columns — no action needed on them.
--   Triggers and RLS policies follow the table rename automatically.
-- =============================================================

alter table if exists public.tasks           rename to tasks_legacy;
alter table if exists public.task_assignees  rename to task_assignees_legacy;
alter table if exists public.task_comments   rename to task_comments_legacy;
alter table if exists public.task_label_map  rename to task_label_map_legacy;
alter table if exists public.task_labels     rename to task_labels_legacy;
alter table if exists public.task_subtasks   rename to task_subtasks_legacy;
alter table if exists public.task_templates  rename to task_templates_legacy;
alter table if exists public.owner_tasks     rename to owner_tasks_legacy;

-- =============================================================
-- Half 2: New polymorphic tasks, notes, attachments.
-- =============================================================

-- ---- tasks --------------------------------------------------
create table public.tasks (
  id              uuid primary key default gen_random_uuid(),
  parent_type     text check (parent_type in ('contact','property','project')),
  parent_id       uuid,
  parent_task_id  uuid references public.tasks(id) on delete cascade,
  title           text not null,
  description     text,
  status          text not null default 'todo'
                  check (status in ('todo','in_progress','blocked','done')),
  assignee_id     uuid references profiles(id),
  created_by      uuid references profiles(id),
  due_at          timestamptz,
  completed_at    timestamptz,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint tasks_parent_consistent
    check ((parent_type is null and parent_id is null)
        or (parent_type is not null and parent_id is not null))
);

create index tasks_parent_idx       on tasks (parent_type, parent_id);
create index tasks_assignee_open_idx on tasks (assignee_id) where status <> 'done';
create index tasks_due_open_idx     on tasks (due_at)       where status <> 'done';
create index tasks_subtask_idx      on tasks (parent_task_id) where parent_task_id is not null;
create index tasks_created_by_idx   on tasks (created_by);

-- ---- notes --------------------------------------------------
create table public.notes (
  id            uuid primary key default gen_random_uuid(),
  parent_type   text not null check (parent_type in ('contact','property','project')),
  parent_id     uuid not null,
  body          text not null,
  author_id     uuid references profiles(id),
  pinned        boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index notes_parent_idx on notes (parent_type, parent_id, created_at desc);

-- ---- attachments --------------------------------------------
create table public.attachments (
  id            uuid primary key default gen_random_uuid(),
  parent_type   text not null check (parent_type in ('contact','property','project')),
  parent_id     uuid not null,
  filename      text not null,
  storage_path  text not null,
  mime_type     text,
  size_bytes    bigint,
  uploaded_by   uuid references profiles(id),
  created_at    timestamptz not null default now()
);

create index attachments_parent_idx on attachments (parent_type, parent_id);

-- ---- triggers -----------------------------------------------
-- Bespoke trigger for tasks: handles updated_at + completed_at logic
create or replace function tasks_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if new.status = 'done' and old.status is distinct from 'done' then
    new.completed_at := now();
  elsif new.status <> 'done' and old.status = 'done' then
    new.completed_at := null;
  end if;
  return new;
end $$;

drop trigger if exists tasks_touch_updated_at on tasks;
create trigger tasks_touch_updated_at
before update on tasks
for each row execute function tasks_touch_updated_at();

-- notes reuses the shared helper from 20260417T2
drop trigger if exists notes_touch_updated_at on notes;
create trigger notes_touch_updated_at
before update on notes
for each row execute function public.touch_updated_at();

-- ---- RLS ----------------------------------------------------
alter table tasks       enable row level security;
alter table notes       enable row level security;
alter table attachments enable row level security;

drop policy if exists tasks_admin_rw on tasks;
create policy tasks_admin_rw on tasks
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists tasks_owner_read_own on tasks;
create policy tasks_owner_read_own on tasks
  for select using (
    parent_type = 'property'
    and exists (
      select 1 from properties pr
      where pr.id = tasks.parent_id
        and pr.owner_id = auth.uid()
    )
  );

drop policy if exists notes_admin_rw on notes;
create policy notes_admin_rw on notes
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists attachments_admin_rw on attachments;
create policy attachments_admin_rw on attachments
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ---- task saved views ---------------------------------------
-- saved_views has no unique constraint on (entity_type, key, owner_user_id),
-- so we guard with where not exists to stay idempotent.
insert into saved_views (entity_type, key, name, is_shared, sort_order, filter_jsonb, sort, view_mode)
select v.entity_type, v.key, v.name, v.is_shared, v.sort_order, v.filter_jsonb::jsonb, v.sort, v.view_mode
from (values
  ('task','my-tasks',   'My Tasks',    true, 10, '{"assignee":"me","status_not":"done"}',         'due_asc',            'list'),
  ('task','overdue',    'Overdue',     true, 20, '{"due_before":"now","status_not":"done"}',       'due_asc',            'list'),
  ('task','this-week',  'This Week',   true, 30, '{"due_within":"week","status_not":"done"}',      'due_asc',            'list'),
  ('task','unassigned', 'Unassigned',  true, 40, '{"assignee":"none","status_not":"done"}',        'due_asc',            'list'),
  ('task','by-property','By Property', true, 50, '{"group":"parent_property"}',                   'parent_name_asc',    'list'),
  ('task','by-assignee','By Assignee', true, 60, '{"group":"assignee"}',                          'assignee_name_asc',  'list')
) as v(entity_type, key, name, is_shared, sort_order, filter_jsonb, sort, view_mode)
where not exists (
  select 1 from saved_views sv
  where sv.entity_type = v.entity_type
    and sv.key = v.key
    and sv.owner_user_id is null
);
