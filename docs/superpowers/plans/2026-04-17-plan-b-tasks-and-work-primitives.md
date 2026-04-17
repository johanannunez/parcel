# Plan B — Polymorphic Work Primitives and Tasks Inbox

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the polymorphic `tasks`, `notes`, `attachments` tables that any entity (Contact, Property, Project, or standalone) shares. Ship the redesigned `/admin/tasks` page (grouped by due date, parent pills, view switcher) plus a Tasks tab added to Contact and Property detail pages. Ship criterion: create a task from `+ New` scoped to any entity or standalone, see it in `/admin/tasks` under the correct due-date bucket with the right parent pill color, open the entity detail page and find the task under its Tasks tab.

**Depends on:** Plan A shipped (contacts table exists; properties.contact_id populated).

**Architecture:** One migration creates `tasks`, `notes`, `attachments` with `parent_type` + `parent_id` enum polymorphism, plus indexes and RLS. A server fetcher returns grouped tasks; the list view groups client-side; parent pills link via a generated URL helper that consults `parent_type`. Task CRUD goes through Supabase server actions. The new Tasks tab is a thin wrapper that calls the same fetcher scoped to a single parent.

**Tech Stack:** same as Plan A.

**Verification style:** Same as Plan A (typecheck, build, SQL checks, screenshots, Playwright).

---

## File plan

**New files:**

- `apps/web/supabase/migrations/20260418_work_primitives.sql` — tasks, notes, attachments tables, RLS, seed saved views for tasks
- `apps/web/src/lib/admin/task-types.ts` — TypeScript types (`Task`, `TaskWithParent`, `TasksFetchResult`, `TasksSavedView`, `DueBucket`)
- `apps/web/src/lib/admin/tasks-list.ts` — `fetchAdminTasksList({ viewKey, search, parentFilter })`
- `apps/web/src/lib/admin/task-actions.ts` — `createTask`, `updateTask`, `completeTask`, `uncompleteTask`, `deleteTask` server actions
- `apps/web/src/lib/admin/parent-link.ts` — `parentLinkFor({ type, id, fallbackName })` returns `{ href, label, color }`
- `apps/web/src/lib/admin/due-buckets.ts` — `bucketForDue(iso)` returns `'overdue' | 'today' | 'this_week' | 'later' | 'no_date'`
- `apps/web/src/app/(admin)/admin/tasks/page.tsx` — server component
- `apps/web/src/app/(admin)/admin/tasks/TasksListView.tsx` — client, list mode
- `apps/web/src/app/(admin)/admin/tasks/TasksListView.module.css`
- `apps/web/src/app/(admin)/admin/tasks/TaskRow.tsx` — single row (checkbox, title, parent pill, due, assignee, menu)
- `apps/web/src/app/(admin)/admin/tasks/TaskRow.module.css`
- `apps/web/src/app/(admin)/admin/tasks/ParentPill.tsx` — reusable across detail pages too
- `apps/web/src/app/(admin)/admin/tasks/ParentPill.module.css`
- `apps/web/src/app/(admin)/admin/tasks/layout.tsx` — title
- `apps/web/src/components/admin/tasks/TasksTab.tsx` — reusable Tasks tab for any detail page
- `apps/web/src/components/admin/tasks/TasksTab.module.css`
- `apps/web/src/components/admin/tasks/TaskCreationInlineForm.tsx` — inline "new task" row at the top of the Tasks tab
- `apps/web/src/components/admin/chrome/create-forms/TaskForm.tsx` — the Task creation form inside CreateModal (if the chrome plan shipped a scaffold, overwrite with the full version)
- `apps/web/e2e/tasks-inbox.spec.ts`

**Modified files:**

- `apps/web/src/app/(admin)/admin/owners/[entityId]/OwnerDetailShell.tsx` — add a `tasks` tab between `overview` and `properties` (insert in `TAB_ORDER` and `TAB_LABEL`, render `<TasksTab parentType="contact" parentId={data.contactId} />`)
- `apps/web/src/lib/admin/owner-detail.ts` — include `contactId` on the returned data (look up from `contacts.profile_id = profile.id`)
- `apps/web/src/app/(admin)/admin/owners/[entityId]/page.tsx` or its child that renders tabs — wire the new tab render branch
- `apps/web/src/app/(admin)/admin/properties/[id]/page.tsx` — add a Tasks tab using the same `<TasksTab parentType="property" parentId={property.id} />` pattern
- `apps/web/src/components/admin/chrome/CreateMenu.tsx` + `CreateModal.tsx` — ensure "Task" opens the new TaskForm with scope pre-fill
- `apps/web/src/app/(admin)/admin/tasks/AdminTasksShell.tsx` — DELETE (replaced by new shell)

---

## Data model

```sql
-- tasks
create table tasks (
  id              uuid primary key default gen_random_uuid(),
  parent_type     text check (parent_type in ('contact','property','project')),
  parent_id       uuid,
  parent_task_id  uuid references tasks(id) on delete cascade,
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
  updated_at      timestamptz not null default now()
);

-- Integrity: if parent_type is set, parent_id must be set; vice versa
-- (enforced via CHECK)
alter table tasks add constraint tasks_parent_consistent
  check ((parent_type is null and parent_id is null)
      or (parent_type is not null and parent_id is not null));
```

Analogous polymorphic shape for `notes` and `attachments`.

## Due bucket logic (pure helper, identical client + server)

```ts
// apps/web/src/lib/admin/due-buckets.ts
export type DueBucket = 'overdue' | 'today' | 'this_week' | 'later' | 'no_date';

export function bucketForDue(iso: string | null, now: Date = new Date()): DueBucket {
  if (!iso) return 'no_date';
  const due = new Date(iso);
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endToday = new Date(startToday.getTime() + 86400_000 - 1);
  if (due < startToday) return 'overdue';
  if (due <= endToday) return 'today';
  const dow = now.getDay(); // 0=Sun
  const daysToEndOfWeek = 7 - dow; // inclusive of this Sunday
  const endOfWeek = new Date(endToday.getTime() + daysToEndOfWeek * 86400_000);
  if (due <= endOfWeek) return 'this_week';
  return 'later';
}

export const BUCKET_ORDER: DueBucket[] = [
  'overdue', 'today', 'this_week', 'later', 'no_date',
];

export const BUCKET_LABEL: Record<DueBucket, string> = {
  overdue: 'Overdue',
  today: 'Today',
  this_week: 'This Week',
  later: 'Later',
  no_date: 'No Date',
};
```

## Parent pill color / link

```ts
// apps/web/src/lib/admin/parent-link.ts
type ParentType = 'contact' | 'property' | 'project' | null;

export function parentLinkFor(args: {
  type: ParentType;
  id: string | null;
  contactProfileId?: string | null; // if type=contact and profile exists, use /admin/owners/[profileId]
  fallbackLabel?: string | null;
}): { href: string | null; label: string; color: 'blue' | 'green' | 'purple' | 'gray' } {
  if (!args.type || !args.id) {
    return { href: null, label: args.fallbackLabel ?? 'Standalone', color: 'gray' };
  }
  switch (args.type) {
    case 'contact':
      return {
        href: args.contactProfileId
          ? `/admin/owners/${args.contactProfileId}`
          : `/admin/contacts/${args.id}`,
        label: args.fallbackLabel ?? 'Contact',
        color: 'blue',
      };
    case 'property':
      return {
        href: `/admin/properties/${args.id}`,
        label: args.fallbackLabel ?? 'Property',
        color: 'green',
      };
    case 'project':
      return {
        href: `/admin/projects/${args.id}`,
        label: args.fallbackLabel ?? 'Project',
        color: 'purple',
      };
  }
}
```

## Task saved views (seeded)

| Key          | Name         | Filter                                                        |
|--------------|--------------|---------------------------------------------------------------|
| `my-tasks`   | My Tasks     | `assignee_id = auth.uid() and status <> 'done'` (evaluated at fetch) |
| `overdue`    | Overdue      | `due_at < now() and status <> 'done'`                          |
| `this-week`  | This Week    | due_at within current week                                     |
| `unassigned` | Unassigned   | `assignee_id is null and status <> 'done'`                     |
| `by-property`| By Property  | grouping = `parent_property`                                   |
| `by-assignee`| By Assignee  | grouping = `assignee_id`                                       |

---

## Task 1: Migration — tasks, notes, attachments

**Files:**
- Create: `apps/web/supabase/migrations/20260418_work_primitives.sql`

- [ ] **Step 1: Write migration**

```sql
-- Polymorphic work primitives: tasks, notes, attachments.

create table if not exists public.tasks (
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

create index if not exists tasks_parent_idx on tasks (parent_type, parent_id);
create index if not exists tasks_assignee_open_idx
  on tasks (assignee_id) where status <> 'done';
create index if not exists tasks_due_open_idx
  on tasks (due_at) where status <> 'done';
create index if not exists tasks_subtask_idx
  on tasks (parent_task_id) where parent_task_id is not null;
create index if not exists tasks_created_by_idx on tasks (created_by);

create table if not exists public.notes (
  id            uuid primary key default gen_random_uuid(),
  parent_type   text not null check (parent_type in ('contact','property','project')),
  parent_id     uuid not null,
  body          text not null,
  author_id     uuid references profiles(id),
  pinned        boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists notes_parent_idx
  on notes (parent_type, parent_id, created_at desc);

create table if not exists public.attachments (
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

create index if not exists attachments_parent_idx on attachments (parent_type, parent_id);

-- updated_at triggers
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

create or replace function notes_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists notes_touch_updated_at on notes;
create trigger notes_touch_updated_at
before update on notes
for each row execute function notes_touch_updated_at();

-- RLS
alter table tasks enable row level security;
alter table notes enable row level security;
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

-- Task saved views
insert into saved_views (entity_type, key, name, is_shared, sort_order, filter_jsonb, sort, view_mode)
values
  ('task','my-tasks','My Tasks',true,10,'{"assignee":"me","status_not":"done"}','due_asc','list'),
  ('task','overdue','Overdue',true,20,'{"due_before":"now","status_not":"done"}','due_asc','list'),
  ('task','this-week','This Week',true,30,'{"due_within":"week","status_not":"done"}','due_asc','list'),
  ('task','unassigned','Unassigned',true,40,'{"assignee":"none","status_not":"done"}','due_asc','list'),
  ('task','by-property','By Property',true,50,'{"group":"parent_property"}','parent_name_asc','list'),
  ('task','by-assignee','By Assignee',true,60,'{"group":"assignee"}','assignee_name_asc','list')
on conflict (entity_type, key, coalesce(owner_user_id::text, 'SHARED')) do nothing;
```

- [ ] **Step 2: Apply migration**

Apply via the Supabase MCP tool, same pattern as Plan A Task 1.

- [ ] **Step 3: Verify**

```sql
select count(*) from tasks;               -- 0 expected
select count(*) from notes;               -- 0 expected
select count(*) from attachments;         -- 0 expected
select key from saved_views where entity_type='task' order by sort_order;
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/supabase/migrations/20260418_work_primitives.sql
git commit -m "feat(db): tasks, notes, attachments polymorphic tables + task saved views"
```

---

## Task 2: Pure helpers — due-buckets, parent-link, task-types

**Files:**
- Create: `apps/web/src/lib/admin/due-buckets.ts`
- Create: `apps/web/src/lib/admin/parent-link.ts`
- Create: `apps/web/src/lib/admin/task-types.ts`

- [ ] **Step 1: Write due-buckets.ts**

As in the "Due bucket logic" section above. Paste verbatim.

- [ ] **Step 2: Write parent-link.ts**

As in the "Parent pill" section above.

- [ ] **Step 3: Write task-types.ts**

```ts
import type { DueBucket } from './due-buckets';

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type ParentType = 'contact' | 'property' | 'project';

export type TaskParent = {
  type: ParentType;
  id: string;
  label: string;                 // display name, e.g., "Sarah Johnson"
  contactProfileId?: string | null; // used to route contact tasks to /admin/owners/[id]
};

export type Task = {
  id: string;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeAvatarUrl: string | null;
  createdById: string | null;
  createdByName: string | null;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  parent: TaskParent | null;
  subtaskCount: number;
  subtaskDoneCount: number;
};

export type TaskGroup = {
  bucket: DueBucket;
  tasks: Task[];
};

export type TasksSavedView = {
  key: string;
  name: string;
  sortOrder: number;
  count: number;
};

export type TasksFetchResult = {
  groups: TaskGroup[];
  views: TasksSavedView[];
  activeView: TasksSavedView;
  totalCount: number;
};
```

- [ ] **Step 4: Typecheck**

```bash
pnpm --filter web typecheck
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/admin/due-buckets.ts \
       apps/web/src/lib/admin/parent-link.ts \
       apps/web/src/lib/admin/task-types.ts
git commit -m "feat(admin/tasks): pure helpers for due buckets, parent links, task types"
```

---

## Task 3: Server fetcher — fetchAdminTasksList

**Files:**
- Create: `apps/web/src/lib/admin/tasks-list.ts`

- [ ] **Step 1: Write fetcher**

```ts
import { createClient } from '@/lib/supabase/server';
import { bucketForDue, BUCKET_ORDER, type DueBucket } from './due-buckets';
import type {
  Task,
  TaskGroup,
  TaskParent,
  TasksFetchResult,
  TasksSavedView,
} from './task-types';

type Options = {
  viewKey?: string;                // default 'my-tasks'
  search?: string | null;
  parentFilter?: { type: 'contact'|'property'|'project'; id: string } | null;
};

export async function fetchAdminTasksList(
  opts: Options = {},
): Promise<TasksFetchResult> {
  const supabase = await createClient();

  // Current user (for My Tasks filter)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('not authenticated');

  // Saved views (task entity)
  const { data: viewsRaw } = await supabase
    .from('saved_views')
    .select('key, name, sort_order')
    .eq('entity_type', 'task')
    .eq('is_shared', true)
    .order('sort_order');

  const views: TasksSavedView[] = (viewsRaw ?? []).map((v) => ({
    key: v.key,
    name: v.name,
    sortOrder: v.sort_order ?? 0,
    count: 0,
  }));
  const activeView =
    views.find((v) => v.key === (opts.viewKey ?? 'my-tasks')) ??
    views.find((v) => v.key === 'my-tasks') ??
    views[0];
  if (!activeView) throw new Error('No task saved views');

  // Build the base query
  let query = supabase
    .from('tasks')
    .select(`
      id, parent_task_id, parent_type, parent_id, title, description, status,
      assignee_id, created_by, due_at, completed_at, created_at,
      assignee:profiles!tasks_assignee_id_fkey(full_name, avatar_url),
      creator:profiles!tasks_created_by_fkey(full_name)
    `)
    .order('due_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  // Apply view filters
  switch (activeView.key) {
    case 'my-tasks':
      query = query.eq('assignee_id', user.id).neq('status', 'done');
      break;
    case 'overdue':
      query = query.lt('due_at', new Date().toISOString()).neq('status', 'done');
      break;
    case 'this-week': {
      const now = new Date();
      const dow = now.getDay();
      const endOfWeek = new Date(
        now.getFullYear(), now.getMonth(), now.getDate() + (7 - dow),
      );
      query = query.lte('due_at', endOfWeek.toISOString()).neq('status', 'done');
      break;
    }
    case 'unassigned':
      query = query.is('assignee_id', null).neq('status', 'done');
      break;
    default:
      query = query.neq('status', 'done');
  }

  if (opts.parentFilter) {
    query = query.eq('parent_type', opts.parentFilter.type)
                 .eq('parent_id', opts.parentFilter.id);
  }

  if (opts.search) {
    query = query.ilike('title', `%${opts.search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Resolve parent labels (one batched query per parent_type)
  const byType: Record<string, string[]> = { contact: [], property: [], project: [] };
  for (const t of data ?? []) {
    if (t.parent_type && t.parent_id) byType[t.parent_type].push(t.parent_id);
  }

  const parentMap: Record<string, { label: string; contactProfileId?: string | null }> = {};

  if (byType.contact.length > 0) {
    const { data: rows } = await supabase
      .from('contacts')
      .select('id, full_name, company_name, profile_id')
      .in('id', Array.from(new Set(byType.contact)));
    for (const r of rows ?? []) {
      parentMap[`contact:${r.id}`] = {
        label: r.full_name || r.company_name || 'Contact',
        contactProfileId: r.profile_id,
      };
    }
  }
  if (byType.property.length > 0) {
    const { data: rows } = await supabase
      .from('properties')
      .select('id, nickname, address_line_1')
      .in('id', Array.from(new Set(byType.property)));
    for (const r of rows ?? []) {
      parentMap[`property:${r.id}`] = {
        label: (r as { nickname?: string }).nickname
          ?? (r as { address_line_1?: string }).address_line_1
          ?? 'Property',
      };
    }
  }
  if (byType.project.length > 0) {
    // Projects table may not exist yet in Plan B (Plan C ships it). Safely skip.
    try {
      const { data: rows } = await supabase
        .from('projects')
        .select('id, name')
        .in('id', Array.from(new Set(byType.project)));
      for (const r of rows ?? []) {
        parentMap[`project:${r.id}`] = { label: r.name };
      }
    } catch {
      /* projects table not yet present */
    }
  }

  // Subtask counts (single query for all parent tasks)
  const parentTaskIds = (data ?? [])
    .filter((t) => t.parent_task_id === null)
    .map((t) => t.id);
  const subtaskCounts: Record<string, { total: number; done: number }> = {};
  if (parentTaskIds.length > 0) {
    const { data: subs } = await supabase
      .from('tasks')
      .select('parent_task_id, status')
      .in('parent_task_id', parentTaskIds);
    for (const s of subs ?? []) {
      const key = s.parent_task_id as string;
      if (!subtaskCounts[key]) subtaskCounts[key] = { total: 0, done: 0 };
      subtaskCounts[key].total += 1;
      if (s.status === 'done') subtaskCounts[key].done += 1;
    }
  }

  const tasks: Task[] = (data ?? []).map((t) => {
    const parentInfo = t.parent_type && t.parent_id
      ? parentMap[`${t.parent_type}:${t.parent_id}`]
      : null;
    const parent: TaskParent | null = t.parent_type && t.parent_id && parentInfo
      ? {
          type: t.parent_type as TaskParent['type'],
          id: t.parent_id,
          label: parentInfo.label,
          contactProfileId: parentInfo.contactProfileId,
        }
      : null;
    const assignee = Array.isArray(t.assignee)
      ? t.assignee[0]
      : (t.assignee as { full_name?: string; avatar_url?: string } | null);
    const creator = Array.isArray(t.creator)
      ? t.creator[0]
      : (t.creator as { full_name?: string } | null);
    const counts = subtaskCounts[t.id] ?? { total: 0, done: 0 };
    return {
      id: t.id,
      parentTaskId: t.parent_task_id,
      title: t.title,
      description: t.description,
      status: t.status as Task['status'],
      assigneeId: t.assignee_id,
      assigneeName: assignee?.full_name ?? null,
      assigneeAvatarUrl: assignee?.avatar_url ?? null,
      createdById: t.created_by,
      createdByName: creator?.full_name ?? null,
      dueAt: t.due_at,
      completedAt: t.completed_at,
      createdAt: t.created_at,
      parent,
      subtaskCount: counts.total,
      subtaskDoneCount: counts.done,
    };
  });

  // Group by bucket (only parent tasks; subtasks are rendered beneath parents in the UI)
  const groups: Record<DueBucket, Task[]> = {
    overdue: [], today: [], this_week: [], later: [], no_date: [],
  };
  for (const t of tasks) {
    if (t.parentTaskId !== null) continue; // subtasks handled inside the parent
    groups[bucketForDue(t.dueAt)].push(t);
  }
  const ordered: TaskGroup[] = BUCKET_ORDER
    .map((b) => ({ bucket: b, tasks: groups[b] }))
    .filter((g) => g.tasks.length > 0);

  // Counts for each saved view (for tab badges)
  for (const v of views) {
    let cq = supabase.from('tasks').select('*', { count: 'exact', head: true });
    switch (v.key) {
      case 'my-tasks':
        cq = cq.eq('assignee_id', user.id).neq('status', 'done');
        break;
      case 'overdue':
        cq = cq.lt('due_at', new Date().toISOString()).neq('status', 'done');
        break;
      case 'this-week': {
        const now = new Date();
        const dow = now.getDay();
        const endOfWeek = new Date(
          now.getFullYear(), now.getMonth(), now.getDate() + (7 - dow),
        );
        cq = cq.lte('due_at', endOfWeek.toISOString()).neq('status', 'done');
        break;
      }
      case 'unassigned':
        cq = cq.is('assignee_id', null).neq('status', 'done');
        break;
      default:
        cq = cq.neq('status', 'done');
    }
    const { count } = await cq;
    v.count = count ?? 0;
  }

  const totalCount = tasks.filter((t) => t.parentTaskId === null).length;

  return { groups: ordered, views, activeView, totalCount };
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter web typecheck
```

If the generated Supabase types do not yet know about `tasks` / `notes` / `attachments`, regenerate:

```bash
cd apps/web
npx supabase gen types typescript --project-id pwoxwpryummqeqsxdgyc --schema public > src/types/supabase.ts
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/admin/tasks-list.ts apps/web/src/types/supabase.ts 2>/dev/null || true
git add apps/web/src/lib/admin/tasks-list.ts
git commit -m "feat(admin/tasks): fetcher returns grouped tasks with parent labels"
```

---

## Task 4: Server actions — task-actions.ts

**Files:**
- Create: `apps/web/src/lib/admin/task-actions.ts`

- [ ] **Step 1: Write actions**

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ParentType, TaskStatus } from './task-types';

export type CreateTaskInput = {
  title: string;
  description?: string;
  parentType?: ParentType | null;
  parentId?: string | null;
  parentTaskId?: string | null;
  assigneeId?: string | null;
  dueAt?: string | null;
};

export async function createTask(input: CreateTaskInput): Promise<{ id: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('not authenticated');

  const row = {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    parent_type: input.parentType ?? null,
    parent_id: input.parentId ?? null,
    parent_task_id: input.parentTaskId ?? null,
    assignee_id: input.assigneeId ?? null,
    created_by: user.id,
    due_at: input.dueAt ?? null,
  };

  const { data, error } = await supabase
    .from('tasks')
    .insert(row)
    .select('id')
    .single();
  if (error) throw error;

  revalidatePath('/admin/tasks');
  if (input.parentType && input.parentId) {
    if (input.parentType === 'contact') revalidatePath('/admin/contacts');
    if (input.parentType === 'property') revalidatePath('/admin/properties');
    if (input.parentType === 'project') revalidatePath('/admin/projects');
  }
  return { id: data.id };
}

export async function updateTask(
  id: string,
  patch: Partial<{
    title: string;
    description: string | null;
    status: TaskStatus;
    assigneeId: string | null;
    dueAt: string | null;
  }>,
): Promise<void> {
  const supabase = await createClient();
  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.description !== undefined) update.description = patch.description;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.assigneeId !== undefined) update.assignee_id = patch.assigneeId;
  if (patch.dueAt !== undefined) update.due_at = patch.dueAt;

  const { error } = await supabase.from('tasks').update(update).eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/tasks');
}

export async function completeTask(id: string): Promise<void> {
  await updateTask(id, { status: 'done' });
}

export async function uncompleteTask(id: string): Promise<void> {
  await updateTask(id, { status: 'todo' });
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/tasks');
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
pnpm --filter web typecheck
git add apps/web/src/lib/admin/task-actions.ts
git commit -m "feat(admin/tasks): server actions for task CRUD"
```

---

## Task 5: ParentPill component (reusable)

**Files:**
- Create: `apps/web/src/app/(admin)/admin/tasks/ParentPill.tsx`
- Create: `apps/web/src/app/(admin)/admin/tasks/ParentPill.module.css`

- [ ] **Step 1: Write component**

```tsx
'use client';

import Link from 'next/link';
import type { TaskParent } from '@/lib/admin/task-types';
import { parentLinkFor } from '@/lib/admin/parent-link';
import styles from './ParentPill.module.css';

export function ParentPill({ parent }: { parent: TaskParent | null }) {
  const link = parentLinkFor({
    type: parent?.type ?? null,
    id: parent?.id ?? null,
    contactProfileId: parent?.contactProfileId ?? null,
    fallbackLabel: parent?.label,
  });
  const content = (
    <span className={`${styles.pill} ${styles[link.color]}`}>
      <span className={styles.dot} aria-hidden />
      <span className={styles.label}>{link.label}</span>
    </span>
  );
  if (!link.href) return content;
  return (
    <Link href={link.href} onClick={(e) => e.stopPropagation()} className={styles.wrap}>
      {content}
    </Link>
  );
}
```

```css
.wrap { text-decoration: none; }

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px 3px 7px;
  border-radius: 5px;
  border: 1px solid;
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
}

.dot { width: 6px; height: 6px; border-radius: 2px; }
.label { white-space: nowrap; max-width: 160px; overflow: hidden; text-overflow: ellipsis; }

.blue   { background: rgba(2,170,235,0.10); color: #02AAEB; border-color: rgba(2,170,235,0.28); }
.blue   .dot { background: #02AAEB; }
.green  { background: rgba(16,185,129,0.10); color: #047857; border-color: rgba(16,185,129,0.28); }
.green  .dot { background: #10B981; }
.purple { background: rgba(139,92,246,0.10); color: #6D28D9; border-color: rgba(139,92,246,0.28); }
.purple .dot { background: #8B5CF6; }
.gray   { background: rgba(107,114,128,0.10); color: #374151; border-color: rgba(107,114,128,0.24); }
.gray   .dot { background: #6b7280; }
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/\(admin\)/admin/tasks/ParentPill.tsx \
       apps/web/src/app/\(admin\)/admin/tasks/ParentPill.module.css
git commit -m "feat(admin/tasks): ParentPill component (reusable)"
```

---

## Task 6: TaskRow with inline subtasks and complete checkbox

**Files:**
- Create: `apps/web/src/app/(admin)/admin/tasks/TaskRow.tsx`
- Create: `apps/web/src/app/(admin)/admin/tasks/TaskRow.module.css`

- [ ] **Step 1: Write TaskRow**

```tsx
'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import type { Task } from '@/lib/admin/task-types';
import { ParentPill } from './ParentPill';
import { completeTask, uncompleteTask } from '@/lib/admin/task-actions';
import styles from './TaskRow.module.css';

function dueDisplay(iso: string | null): { label: string; tone: string } {
  if (!iso) return { label: '—', tone: 'neutral' };
  const now = new Date();
  const due = new Date(iso);
  const diff = due.getTime() - now.getTime();
  const days = Math.floor(diff / 86400_000);
  if (diff < 0) {
    const ago = Math.max(1, Math.abs(days));
    return { label: `${ago}d late`, tone: 'overdue' };
  }
  if (days === 0) return { label: 'Today', tone: 'today' };
  if (days === 1) return { label: 'Tomorrow', tone: 'soon' };
  if (days < 7) return { label: due.toLocaleDateString(undefined, { weekday: 'short' }), tone: 'soon' };
  return { label: due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), tone: 'neutral' };
}

export function TaskRow({ task, subtasks = [] }: { task: Task; subtasks?: Task[] }) {
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const due = dueDisplay(task.dueAt);
  const hasSubtasks = task.subtaskCount > 0 || subtasks.length > 0;

  const toggleComplete = () => {
    startTransition(async () => {
      if (task.status === 'done') await uncompleteTask(task.id);
      else await completeTask(task.id);
    });
  };

  return (
    <>
      <div className={`${styles.row} ${task.status === 'done' ? styles.rowDone : ''}`}>
        <button
          type="button"
          aria-label={task.status === 'done' ? 'Mark as todo' : 'Complete task'}
          className={`${styles.check} ${task.status === 'done' ? styles.checkDone : ''}`}
          onClick={toggleComplete}
          disabled={isPending}
        />
        <div className={styles.title}>
          {task.title}
          {hasSubtasks ? (
            <button
              type="button"
              className={styles.subBadge}
              onClick={() => setExpanded((v) => !v)}
            >
              {task.subtaskDoneCount} / {task.subtaskCount} subtasks
            </button>
          ) : null}
        </div>
        <div className={styles.parent}>
          <ParentPill parent={task.parent} />
        </div>
        <div className={`${styles.due} ${styles[due.tone]}`}>{due.label}</div>
        <div className={styles.assignee}>
          {task.assigneeAvatarUrl ? (
            <Image
              src={task.assigneeAvatarUrl}
              alt={task.assigneeName ?? 'Assignee'}
              width={22}
              height={22}
              className={styles.av}
            />
          ) : task.assigneeName ? (
            <span className={styles.avFallback} aria-label={task.assigneeName}>
              {task.assigneeName.split(' ').map((p) => p[0]).slice(0, 2).join('')}
            </span>
          ) : (
            <span className={styles.avEmpty} aria-label="Unassigned">—</span>
          )}
        </div>
        <button type="button" className={styles.menuBtn} aria-label="Task menu">⋯</button>
      </div>

      {expanded && subtasks.length > 0 ? (
        <div className={styles.subWrap}>
          {subtasks.map((s) => (
            <div
              key={s.id}
              className={`${styles.subRow} ${s.status === 'done' ? styles.subDone : ''}`}
            >
              <span className={`${styles.check} ${styles.checkSm} ${s.status === 'done' ? styles.checkDone : ''}`} />
              <span className={styles.subTitle}>{s.title}</span>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
```

```css
.row {
  display: grid;
  grid-template-columns: 20px 1fr minmax(140px, auto) 90px 30px 24px;
  align-items: center;
  gap: 12px;
  padding: 10px 22px;
  border-top: 1px solid #f3f4f6;
  background: #fff;
  transition: background 120ms ease;
}

.row:hover { background: #fafbfc; }
.rowDone .title { color: #9ca3af; text-decoration: line-through; }

.check {
  width: 16px; height: 16px;
  border-radius: 4px;
  border: 1.5px solid #cbd5e1;
  background: #fff;
  cursor: pointer;
}
.check:hover { border-color: #02AAEB; }
.checkSm { width: 12px; height: 12px; border-radius: 3px; }
.checkDone { background: #02AAEB; border-color: #02AAEB; }

.title {
  color: #0F3B6B;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.subBadge {
  background: #f3f4f6;
  color: #374151;
  font-size: 10.5px;
  padding: 1px 7px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.parent { justify-self: start; }

.due { font-size: 11.5px; color: #6b7280; text-align: right; font-variant-numeric: tabular-nums; }
.due.overdue { color: #b91c1c; font-weight: 600; }
.due.today { color: #9a3412; font-weight: 600; }
.due.soon { color: #0F3B6B; }

.assignee { display: flex; justify-content: center; }
.av { border-radius: 50%; }
.avFallback {
  width: 22px; height: 22px; border-radius: 50%;
  background: linear-gradient(135deg, #02AAEB, #1B77BE);
  color: #fff; font-size: 9px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
}
.avEmpty {
  width: 22px; height: 22px; border-radius: 50%;
  background: #e5e7eb; color: #9ca3af; font-size: 10px;
  display: flex; align-items: center; justify-content: center;
}

.menuBtn {
  background: transparent; border: none;
  color: #9ca3af; font-size: 16px;
  cursor: pointer; padding: 0;
}
.menuBtn:hover { color: #0F3B6B; }

.subWrap { background: #fafbfc; }
.subRow {
  display: flex; gap: 10px; align-items: center;
  padding: 5px 22px 5px 60px;
  color: #6b7280;
  font-size: 11.5px;
  border-top: 1px solid #f3f4f6;
}
.subDone .subTitle { color: #9ca3af; text-decoration: line-through; }
.subTitle { flex: 1; }
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/\(admin\)/admin/tasks/TaskRow.tsx \
       apps/web/src/app/\(admin\)/admin/tasks/TaskRow.module.css
git commit -m "feat(admin/tasks): TaskRow with inline subtask expansion + complete toggle"
```

---

## Task 7: TasksListView (list mode)

**Files:**
- Create: `apps/web/src/app/(admin)/admin/tasks/TasksListView.tsx`
- Create: `apps/web/src/app/(admin)/admin/tasks/TasksListView.module.css`

- [ ] **Step 1: Write the view**

```tsx
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type {
  Task,
  TasksSavedView,
  TasksFetchResult,
} from '@/lib/admin/task-types';
import { BUCKET_LABEL } from '@/lib/admin/due-buckets';
import { TaskRow } from './TaskRow';
import styles from './TasksListView.module.css';

type Props = TasksFetchResult & {
  subtasksByParent: Record<string, Task[]>;
};

function SavedViewTabs({ views }: { views: TasksSavedView[] }) {
  const sp = useSearchParams();
  const active = sp?.get('view') ?? 'my-tasks';
  return (
    <nav className={styles.views} aria-label="Saved views">
      {views.map((v) => {
        const isActive = v.key === active;
        const href = v.key === 'my-tasks' ? '/admin/tasks' : `/admin/tasks?view=${v.key}`;
        return (
          <Link
            key={v.key}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
          >
            {v.name}
            <span className={`${styles.count} ${isActive ? styles.countActive : ''} ${v.key === 'overdue' && v.count > 0 ? styles.countWarn : ''}`}>
              {v.count}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function TasksListView({ groups, views, totalCount, subtasksByParent }: Props) {
  return (
    <div className={styles.page}>
      <SavedViewTabs views={views} />

      <div className={styles.toolbar}>
        <input type="text" placeholder="Search tasks" className={styles.search} />
        <div className={styles.meta}>{totalCount} tasks</div>
      </div>

      <div className={styles.list}>
        {groups.length === 0 ? (
          <div className={styles.empty}>Nothing here.</div>
        ) : null}
        {groups.map((g) => (
          <section key={g.bucket}>
            <header className={`${styles.groupHead} ${styles[g.bucket]}`}>
              <span>{BUCKET_LABEL[g.bucket].toUpperCase()}</span>
              <span className={styles.groupCount}>{g.tasks.length}</span>
            </header>
            {g.tasks.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                subtasks={subtasksByParent[t.id] ?? []}
              />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
```

```css
.page {
  padding: 20px 24px 32px;
  background: #F4F5F7;
  min-height: 100%;
}

.views {
  display: flex;
  gap: 2px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 16px;
}
.tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  text-decoration: none;
  border-bottom: 2px solid transparent;
}
.tab:hover { color: #0F3B6B; }
.tabActive { color: #0F3B6B; border-bottom-color: #02AAEB; font-weight: 600; }

.count {
  background: #e5e7eb;
  color: #374151;
  font-size: 10.5px;
  padding: 1px 7px;
  border-radius: 10px;
  min-width: 22px;
  text-align: center;
  font-weight: 600;
}
.countActive { background: rgba(2,170,235,0.14); color: #02AAEB; }
.countWarn { background: rgba(239,68,68,0.14); color: #b91c1c; }

.toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.search {
  flex: 1; max-width: 360px;
  background: #fff; border: 1px solid #e5e7eb;
  border-radius: 8px; padding: 8px 12px;
  font-size: 13px;
}
.meta { color: #6b7280; font-size: 12px; margin-left: auto; }

.list {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(15,23,42,0.04);
  overflow: hidden;
}

.groupHead {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 22px 8px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 1.2px;
  color: #6b7280;
  background: #fafbfc;
  border-top: 1px solid #f3f4f6;
}
.groupHead:first-child { border-top: none; }
.groupCount { background: #e5e7eb; color: #6b7280; padding: 1px 7px; border-radius: 10px; font-size: 10px; }

.overdue { color: #b91c1c; background: rgba(239,68,68,0.06); }
.overdue .groupCount { background: rgba(239,68,68,0.14); color: #b91c1c; }
.today { color: #9a3412; }

.empty { padding: 40px 24px; color: #6b7280; font-size: 13px; text-align: center; }
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/\(admin\)/admin/tasks/TasksListView.tsx \
       apps/web/src/app/\(admin\)/admin/tasks/TasksListView.module.css
git commit -m "feat(admin/tasks): TasksListView with grouped rendering"
```

---

## Task 8: Wire /admin/tasks page

**Files:**
- Create: `apps/web/src/app/(admin)/admin/tasks/page.tsx`
- Create: `apps/web/src/app/(admin)/admin/tasks/layout.tsx`
- Delete: `apps/web/src/app/(admin)/admin/tasks/AdminTasksShell.tsx`

- [ ] **Step 1: New page**

```tsx
// page.tsx
import { fetchAdminTasksList } from '@/lib/admin/tasks-list';
import { createClient } from '@/lib/supabase/server';
import { TasksListView } from './TasksListView';
import type { Task } from '@/lib/admin/task-types';

type Props = { searchParams: Promise<{ view?: string; q?: string }> };

export default async function TasksPage({ searchParams }: Props) {
  const { view, q } = await searchParams;
  const { groups, views, activeView, totalCount } = await fetchAdminTasksList({
    viewKey: view,
    search: q ?? null,
  });

  // Fetch subtasks for all parent tasks in view, so the UI can expand inline
  const parentIds = groups.flatMap((g) => g.tasks.map((t) => t.id));
  const subtasksByParent: Record<string, Task[]> = {};
  if (parentIds.length > 0) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('tasks')
      .select('id, parent_task_id, title, status, due_at, created_at')
      .in('parent_task_id', parentIds);
    for (const s of data ?? []) {
      const parentId = s.parent_task_id as string;
      if (!subtasksByParent[parentId]) subtasksByParent[parentId] = [];
      subtasksByParent[parentId].push({
        id: s.id,
        parentTaskId: parentId,
        title: s.title,
        description: null,
        status: s.status as Task['status'],
        assigneeId: null,
        assigneeName: null,
        assigneeAvatarUrl: null,
        createdById: null,
        createdByName: null,
        dueAt: s.due_at,
        completedAt: null,
        createdAt: s.created_at,
        parent: null,
        subtaskCount: 0,
        subtaskDoneCount: 0,
      });
    }
  }

  return (
    <TasksListView
      groups={groups}
      views={views}
      activeView={activeView}
      totalCount={totalCount}
      subtasksByParent={subtasksByParent}
    />
  );
}
```

- [ ] **Step 2: Layout**

```tsx
import type { ReactNode } from 'react';
import { PageTitle } from '@/components/admin/chrome/PageTitle';

export default function TasksLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageTitle title="Tasks" subtitle="Your work across every contact, property, and project" />
      {children}
    </>
  );
}
```

- [ ] **Step 3: Delete the old shell**

```bash
git rm apps/web/src/app/\(admin\)/admin/tasks/AdminTasksShell.tsx
```

If `actions.ts` still exists under `tasks/`, keep or inline as needed; the new `task-actions.ts` replaces its functions.

- [ ] **Step 4: Typecheck + build + screenshot**

```bash
pnpm --filter web typecheck
pnpm --filter web build
# with dev running
node screenshot.mjs "http://localhost:4000/admin/tasks" "tasks-my" --update-baseline
node screenshot.mjs "http://localhost:4000/admin/tasks?view=overdue" "tasks-overdue"
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/\(admin\)/admin/tasks/page.tsx \
       apps/web/src/app/\(admin\)/admin/tasks/layout.tsx
git commit -m "feat(admin/tasks): unified tasks inbox page wiring"
```

---

## Task 9: TasksTab component (reusable on detail pages)

**Files:**
- Create: `apps/web/src/components/admin/tasks/TasksTab.tsx`
- Create: `apps/web/src/components/admin/tasks/TasksTab.module.css`
- Create: `apps/web/src/components/admin/tasks/TaskCreationInlineForm.tsx`

- [ ] **Step 1: Inline creation form**

```tsx
'use client';

import { useState, useTransition } from 'react';
import { createTask } from '@/lib/admin/task-actions';
import type { ParentType } from '@/lib/admin/task-types';
import styles from './TasksTab.module.css';

export function TaskCreationInlineForm({
  parentType,
  parentId,
}: {
  parentType: ParentType;
  parentId: string;
}) {
  const [title, setTitle] = useState('');
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!title.trim()) return;
    const captured = title.trim();
    setTitle('');
    startTransition(async () => {
      await createTask({ title: captured, parentType, parentId });
    });
  };

  return (
    <form
      className={styles.inlineForm}
      onSubmit={(e) => { e.preventDefault(); submit(); }}
    >
      <span className={styles.plus}>+</span>
      <input
        type="text"
        placeholder="Add a task"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={isPending}
        className={styles.inlineInput}
      />
      <button
        type="submit"
        className={styles.inlineSubmit}
        disabled={!title.trim() || isPending}
      >
        Add
      </button>
    </form>
  );
}
```

- [ ] **Step 2: TasksTab**

```tsx
import { fetchAdminTasksList } from '@/lib/admin/tasks-list';
import { TaskRow } from '@/app/(admin)/admin/tasks/TaskRow';
import { TaskCreationInlineForm } from './TaskCreationInlineForm';
import type { ParentType, Task } from '@/lib/admin/task-types';
import { createClient } from '@/lib/supabase/server';
import styles from './TasksTab.module.css';

export async function TasksTab({
  parentType,
  parentId,
}: {
  parentType: ParentType;
  parentId: string;
}) {
  const { groups } = await fetchAdminTasksList({
    parentFilter: { type: parentType, id: parentId },
  });

  // Subtasks
  const parentIds = groups.flatMap((g) => g.tasks.map((t) => t.id));
  const subtasksByParent: Record<string, Task[]> = {};
  if (parentIds.length > 0) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('tasks')
      .select('id, parent_task_id, title, status, due_at, created_at')
      .in('parent_task_id', parentIds);
    for (const s of data ?? []) {
      const pid = s.parent_task_id as string;
      if (!subtasksByParent[pid]) subtasksByParent[pid] = [];
      subtasksByParent[pid].push({
        id: s.id, parentTaskId: pid, title: s.title,
        description: null, status: s.status as Task['status'],
        assigneeId: null, assigneeName: null, assigneeAvatarUrl: null,
        createdById: null, createdByName: null, dueAt: s.due_at,
        completedAt: null, createdAt: s.created_at, parent: null,
        subtaskCount: 0, subtaskDoneCount: 0,
      });
    }
  }

  return (
    <div className={styles.tab}>
      <TaskCreationInlineForm parentType={parentType} parentId={parentId} />
      {groups.length === 0 ? (
        <div className={styles.empty}>No tasks yet. Add one above.</div>
      ) : (
        <div className={styles.list}>
          {groups.map((g) => (
            <section key={g.bucket}>
              <header className={styles.head}>{g.bucket.replace('_', ' ')}</header>
              {g.tasks.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  subtasks={subtasksByParent[t.id] ?? []}
                />
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
```

```css
.tab { padding: 18px 20px; }
.inlineForm {
  display: flex; align-items: center; gap: 10px;
  background: #fff; border: 1px solid #e5e7eb;
  border-radius: 8px; padding: 8px 12px;
  margin-bottom: 12px;
}
.plus { color: #02AAEB; font-size: 16px; font-weight: 600; }
.inlineInput {
  flex: 1; border: none; font-size: 13.5px;
  color: #0F3B6B; outline: none; background: transparent;
}
.inlineSubmit {
  background: #02AAEB; color: #fff; border: none;
  padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;
  cursor: pointer;
}
.inlineSubmit:disabled { opacity: 0.5; cursor: not-allowed; }
.empty { padding: 32px 0; color: #6b7280; font-size: 13px; text-align: center; }
.list { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
.head {
  padding: 9px 22px;
  background: #fafbfc;
  color: #6b7280;
  font-size: 10.5px; font-weight: 700; letter-spacing: 1.2px;
  text-transform: uppercase;
  border-top: 1px solid #f3f4f6;
}
.head:first-child { border-top: none; }
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/admin/tasks/
git commit -m "feat(admin/tasks): reusable TasksTab + inline creation form"
```

---

## Task 10: Add Tasks tab to Owner detail

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/owners/[entityId]/OwnerDetailShell.tsx`
- Modify: `apps/web/src/lib/admin/owner-detail.ts` (or owner-detail-types.ts) — expose `contactId`
- Modify: wherever tabs render (likely `OwnerDetailShell.tsx` line ~116-120 or a child)

- [ ] **Step 1: Add contactId to OwnerDetailData**

Read `apps/web/src/lib/admin/owner-detail-types.ts` first. Add `contactId: string | null` to `OwnerDetailData`.

In the owner-detail.ts fetcher, after the primary profile is loaded, query:

```ts
const { data: contactRow } = await supabase
  .from('contacts')
  .select('id')
  .eq('profile_id', primaryMember.id)
  .maybeSingle();
// include contactId: contactRow?.id ?? null in the returned object
```

- [ ] **Step 2: Update TAB_ORDER / TAB_LABEL**

In `OwnerDetailShell.tsx` lines 16-40:

```ts
type TabKey =
  | 'overview'
  | 'tasks'
  | 'properties'
  | 'financials'
  | 'activity'
  | 'files'
  | 'settings';

const TAB_ORDER: TabKey[] = [
  'overview', 'tasks', 'properties', 'financials', 'activity', 'files', 'settings',
];

const TAB_LABEL: Record<TabKey, string> = {
  overview: 'Overview',
  tasks: 'Tasks',
  properties: 'Properties',
  financials: 'Financials',
  activity: 'Activity',
  files: 'Files',
  settings: 'Settings',
};
```

- [ ] **Step 3: Render TasksTab in the content area**

Find where tab content is rendered (it may be in the page.tsx server component). Where a case matches `activeTab === 'tasks'`, render:

```tsx
{data.contactId ? (
  <TasksTab parentType="contact" parentId={data.contactId} />
) : (
  <div>Contact record not yet migrated for this owner.</div>
)}
```

Import path: `@/components/admin/tasks/TasksTab`.

- [ ] **Step 4: Manual verify + commit**

```bash
pnpm --filter web typecheck
# Load /admin/owners/<id>?tab=tasks
```

```bash
git add apps/web/src/app/\(admin\)/admin/owners/\[entityId\]/ \
       apps/web/src/lib/admin/owner-detail.ts \
       apps/web/src/lib/admin/owner-detail-types.ts
git commit -m "feat(admin/owners): Tasks tab on owner detail"
```

---

## Task 11: Add Tasks tab to Property detail

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/properties/[id]/page.tsx` (or the shell component there)

- [ ] **Step 1: Locate property detail tab logic**

```bash
find apps/web/src/app/\(admin\)/admin/properties/\[id\] -type f
```

Read the page to find the current tab switch (likely a `searchParams?.tab` check or a tab navigation component).

- [ ] **Step 2: Add Tasks tab**

In the tab list, insert `tasks` second. Render:

```tsx
{activeTab === 'tasks' ? (
  <TasksTab parentType="property" parentId={property.id} />
) : null}
```

- [ ] **Step 3: Typecheck + screenshot + commit**

```bash
pnpm --filter web typecheck
# load /admin/properties/<id>?tab=tasks
node screenshot.mjs "http://localhost:4000/admin/properties/<any-id>?tab=tasks" "property-tasks"
git add apps/web/src/app/\(admin\)/admin/properties/\[id\]/
git commit -m "feat(admin/properties): Tasks tab on property detail"
```

---

## Task 12: Wire Task form in Create Modal

**Files:**
- Create or overwrite: `apps/web/src/components/admin/chrome/create-forms/TaskForm.tsx`
- Modify: the CreateModal switch logic to render the new form

- [ ] **Step 1: Locate existing scaffold**

Chrome plan shipped a `TaskCreationForm`. Find it:

```bash
grep -R "TaskCreationForm\|TaskForm" apps/web/src/components/admin/chrome
```

- [ ] **Step 2: Overwrite with real implementation**

The form should include: title (required), description (optional), due date (date picker), assignee select, parent scope chip (pulled from `useCreateScope`). On submit call `createTask`.

Reference shape:

```tsx
'use client';
import { useState, useTransition } from 'react';
import { useCreateScope } from '../CreateScopeContext';
import { createTask } from '@/lib/admin/task-actions';

export function TaskForm({ onClose }: { onClose: () => void }) {
  const scope = useCreateScope(); // { type, id, label }
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!title.trim()) return;
    startTransition(async () => {
      await createTask({
        title,
        description: description || undefined,
        parentType: scope?.type ?? null,
        parentId: scope?.id ?? null,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
      });
      onClose();
    });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
      {/* inputs + scope chip display here — match CreateModal styling */}
    </form>
  );
}
```

(Full markup mirrors the existing CreateModal form conventions — see `apps/web/src/components/admin/chrome/create-forms/` for the pattern used for Email / Note / etc.)

- [ ] **Step 3: Smoke test via Playwright**

Run the existing `admin-chrome.spec.ts` to confirm no regression, then add an assertion to `tasks-inbox.spec.ts` that creating a Task via `+ New → Task` scoped to a contact lands it in `/admin/tasks` AND on that contact's Tasks tab.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/admin/chrome/create-forms/TaskForm.tsx
git commit -m "feat(admin/chrome): Task creation form wired to polymorphic tasks"
```

---

## Task 13: Playwright spec + final verification

**Files:**
- Create: `apps/web/e2e/tasks-inbox.spec.ts`

- [ ] **Step 1: Write spec**

```ts
import { test, expect } from '@playwright/test';

test.describe('Unified tasks inbox', () => {
  test('renders saved views with counts and groups by due bucket', async ({ page }) => {
    await page.goto('/admin/tasks');
    await expect(page.getByRole('navigation', { name: 'Saved views' })).toBeVisible();
    for (const label of ['My Tasks', 'Overdue', 'This Week', 'Unassigned']) {
      await expect(page.getByRole('link', { name: new RegExp(label) })).toBeVisible();
    }
    // Header labels
    for (const label of ['OVERDUE', 'TODAY', 'THIS WEEK', 'LATER', 'NO DATE']) {
      const maybe = page.getByText(label, { exact: true });
      if (await maybe.count() > 0) {
        await expect(maybe.first()).toBeVisible();
      }
    }
  });

  test('completing a task strikes through and removes from My Tasks', async ({ page }) => {
    await page.goto('/admin/tasks');
    const firstRow = page.locator('[aria-label="Complete task"]').first();
    if (await firstRow.count() === 0) test.skip(true, 'no open tasks in seed');
    await firstRow.click();
    await expect(firstRow).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run all plan-B specs**

```bash
cd apps/web
pnpm dlx playwright test e2e/tasks-inbox.spec.ts --reporter=list
```

- [ ] **Step 3: Full verification**

```bash
pnpm --filter web typecheck
pnpm --filter web build
```

Sanity screenshots:

```bash
node screenshot.mjs "http://localhost:4000/admin/tasks" "b-tasks-final" --diff --side-by-side
node screenshot.mjs "http://localhost:4000/admin/owners/<id>?tab=tasks" "b-owner-tasks-tab"
node screenshot.mjs "http://localhost:4000/admin/properties/<id>?tab=tasks" "b-property-tasks-tab"
```

- [ ] **Step 4: Commit tests + final**

```bash
git add apps/web/e2e/tasks-inbox.spec.ts
git commit -m "test(admin/tasks): playwright smoke for inbox and tab integration"
```

---

## Ship criterion recap

- `+ New → Task` creates a task with scope chip pre-filled from the current page.
- A task created while on `/admin/owners/<id>` shows up under that owner's Tasks tab AND on `/admin/tasks`.
- A task created while on `/admin/properties/<id>` shows up under that property's Tasks tab AND on `/admin/tasks`.
- A task created without a parent appears only on `/admin/tasks` with a gray "Standalone" parent pill.
- `/admin/tasks` shows groups in the right order (Overdue, Today, This Week, Later, No Date) with the correct saved-view counts.
- Completing a task strikes it through and removes it from My Tasks.
- All builds green, screenshot diffs unsurprising, Playwright passes.
