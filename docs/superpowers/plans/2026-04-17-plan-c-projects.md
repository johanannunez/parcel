# Plan C — Projects Entity

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce Projects as a first-class top-level entity. Ship `/admin/projects` list page (Compact view, Saved Views by project type), a Project detail page (5 tabs: Overview, Tasks, Activity, Files, Settings), and a sidebar nav entry. Ship criterion: create a project via `+ New → Project`, set its type, optionally link a contact or property, see it in `/admin/projects`, click through to the detail page, add tasks via the existing TasksTab.

**Depends on:** Plan A (contacts), Plan B (tasks, TasksTab, ParentPill).

**Architecture:** One migration creates `projects` with `project_type` and `status` enums, the linked contact/property columns, and seeded saved views by type. Server fetcher returns project rows + saved view counts (same pattern as contacts). List view uses the same Saved Views tab strip pattern; Status view is deferred to Plan D. Project detail shell mirrors the Contact detail shell (identity band + horizontal tabs), the Overview is a simple status/progress card this plan (smart Overview comes in Plan E).

---

## File plan

**New files:**

- `apps/web/supabase/migrations/20260419_projects.sql`
- `apps/web/src/lib/admin/project-types.ts`
- `apps/web/src/lib/admin/projects-list.ts` — list fetcher
- `apps/web/src/lib/admin/project-detail.ts` — detail fetcher
- `apps/web/src/lib/admin/project-actions.ts` — create/update/archive
- `apps/web/src/app/(admin)/admin/projects/page.tsx`
- `apps/web/src/app/(admin)/admin/projects/ProjectsListView.tsx`
- `apps/web/src/app/(admin)/admin/projects/ProjectsListView.module.css`
- `apps/web/src/app/(admin)/admin/projects/layout.tsx`
- `apps/web/src/app/(admin)/admin/projects/[id]/page.tsx`
- `apps/web/src/app/(admin)/admin/projects/[id]/ProjectDetailShell.tsx`
- `apps/web/src/app/(admin)/admin/projects/[id]/ProjectDetailShell.module.css`
- `apps/web/src/app/(admin)/admin/projects/[id]/OverviewTab.tsx` — minimal overview this plan (Plan E evolves)
- `apps/web/src/app/(admin)/admin/projects/[id]/ActivityTab.tsx` — thin stub that renders timeline scoped to project
- `apps/web/src/app/(admin)/admin/projects/[id]/FilesTab.tsx` — stub reads `attachments` polymorphic
- `apps/web/src/app/(admin)/admin/projects/[id]/SettingsTab.tsx` — basic form (name, description, type, status, target_date, linked contact/property, archive)
- `apps/web/src/components/admin/chrome/create-forms/ProjectForm.tsx`
- `apps/web/e2e/projects.spec.ts`

**Modified files:**

- `apps/web/src/components/admin/AdminSidebar.tsx` — add `/admin/projects` nav item with `Kanban` icon (use `@phosphor-icons/react` — e.g., `SquaresFour` or `Kanban`)
- `apps/web/src/components/admin/AdminBottomNav.tsx` — same
- `apps/web/src/lib/admin/derive-page-title.ts` — `/admin/projects` mapping
- `apps/web/src/components/admin/chrome/CreateMenu.tsx` — add "Project" item routing to ProjectForm

---

## Project types and saved views (seeded)

| Key                     | Name                 | Filter                          |
|-------------------------|----------------------|---------------------------------|
| `all-projects`          | All Projects         | all types, status ≠ archived    |
| `idea-board`            | Idea Board           | project_type = 'idea'           |
| `feature-builds`        | Feature Builds       | project_type = 'feature_build'  |
| `cleaner-onboarding`    | Cleaner Onboarding   | project_type = 'cleaner_onboarding' |
| `employee-onboarding`   | Employee Onboarding  | project_type = 'employee_onboarding' |
| `vendor-onboarding`     | Vendor Onboarding    | project_type = 'vendor_onboarding'   |
| `archived`              | Archived             | status = 'archived'             |

---

## Task 1: Migration

**Files:**
- Create: `apps/web/supabase/migrations/20260419_projects.sql`

- [ ] **Step 1: Write migration**

```sql
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
```

- [ ] **Step 2: Apply and verify**

Apply via Supabase MCP. Then:

```sql
select count(*) from projects; -- 0
select key from saved_views where entity_type='project' order by sort_order;
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/supabase/migrations/20260419_projects.sql
git commit -m "feat(db): projects table + type/status enums + saved views"
```

---

## Task 2: TypeScript types

**Files:**
- Create: `apps/web/src/lib/admin/project-types.ts`

- [ ] **Step 1: Write types**

```ts
export type ProjectType =
  | 'idea'
  | 'feature_build'
  | 'employee_onboarding'
  | 'cleaner_onboarding'
  | 'vendor_onboarding'
  | 'internal';

export type ProjectStatus =
  | 'not_started'
  | 'in_progress'
  | 'blocked'
  | 'done'
  | 'archived';

export type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  projectType: ProjectType;
  status: ProjectStatus;
  ownerUserId: string | null;
  ownerUserName: string | null;
  targetDate: string | null;
  linkedContactId: string | null;
  linkedContactName: string | null;
  linkedContactProfileId: string | null;
  linkedPropertyId: string | null;
  linkedPropertyName: string | null;
  archivedAt: string | null;
  emoji: string | null;
  color: string | null;
  taskCount: number;
  taskDoneCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectSavedView = {
  key: string;
  name: string;
  sortOrder: number;
  count: number;
};

export const PROJECT_TYPE_LABEL: Record<ProjectType, string> = {
  idea: 'Idea',
  feature_build: 'Feature build',
  employee_onboarding: 'Employee onboarding',
  cleaner_onboarding: 'Cleaner onboarding',
  vendor_onboarding: 'Vendor onboarding',
  internal: 'Internal',
};

export const PROJECT_TYPE_EMOJI: Record<ProjectType, string> = {
  idea: '💡',
  feature_build: '🛠',
  employee_onboarding: '👋',
  cleaner_onboarding: '🧼',
  vendor_onboarding: '🤝',
  internal: '📋',
};

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  blocked: 'Blocked',
  done: 'Done',
  archived: 'Archived',
};
```

- [ ] **Step 2: Commit**

```bash
pnpm --filter web typecheck
git add apps/web/src/lib/admin/project-types.ts
git commit -m "feat(admin/projects): project types and labels"
```

---

## Task 3: List fetcher

**Files:**
- Create: `apps/web/src/lib/admin/projects-list.ts`

- [ ] **Step 1: Write fetcher**

```ts
import { createClient } from '@/lib/supabase/server';
import type {
  ProjectRow,
  ProjectSavedView,
  ProjectType,
  ProjectStatus,
} from './project-types';

type Options = { viewKey?: string; search?: string | null };

export async function fetchAdminProjectsList(
  opts: Options = {},
): Promise<{
  rows: ProjectRow[];
  views: ProjectSavedView[];
  activeView: ProjectSavedView;
}> {
  const supabase = await createClient();

  const { data: viewsRaw } = await supabase
    .from('saved_views')
    .select('key, name, sort_order, filter_jsonb')
    .eq('entity_type', 'project')
    .eq('is_shared', true)
    .order('sort_order');

  const views: ProjectSavedView[] = (viewsRaw ?? []).map((v) => ({
    key: v.key,
    name: v.name,
    sortOrder: v.sort_order ?? 0,
    count: 0,
  }));
  const activeView =
    views.find((v) => v.key === (opts.viewKey ?? 'all-projects')) ??
    views[0];
  if (!activeView) throw new Error('No project saved views');
  const activeFilter = (viewsRaw?.find((r) => r.key === activeView.key)?.filter_jsonb ?? {}) as {
    types?: ProjectType[];
    status?: ProjectStatus[];
    exclude_status?: ProjectStatus[];
  };

  let query = supabase
    .from('projects')
    .select(`
      id, name, description, project_type, status, owner_user_id, target_date,
      linked_contact_id, linked_property_id, archived_at, emoji, color,
      created_at, updated_at,
      owner_profile:profiles!projects_owner_user_id_fkey(full_name),
      linked_contact:contacts(full_name, profile_id),
      linked_property:properties(nickname, address_line_1),
      tasks:tasks(id, status)
    `)
    .order('updated_at', { ascending: false });

  if (activeFilter.types?.length) query = query.in('project_type', activeFilter.types);
  if (activeFilter.status?.length) query = query.in('status', activeFilter.status);
  if (activeFilter.exclude_status?.length) {
    query = query.not('status', 'in', `(${activeFilter.exclude_status.map((s) => `"${s}"`).join(',')})`);
  }
  if (opts.search) query = query.ilike('name', `%${opts.search.trim()}%`);

  const { data, error } = await query;
  if (error) throw error;

  const rows: ProjectRow[] = (data ?? []).map((r) => {
    const tasks = (r.tasks as { status: string }[] | null) ?? [];
    const linkedContact = Array.isArray(r.linked_contact)
      ? r.linked_contact[0]
      : (r.linked_contact as { full_name?: string; profile_id?: string | null } | null);
    const linkedProperty = Array.isArray(r.linked_property)
      ? r.linked_property[0]
      : (r.linked_property as { nickname?: string; address_line_1?: string } | null);
    const owner = Array.isArray(r.owner_profile)
      ? r.owner_profile[0]
      : (r.owner_profile as { full_name?: string } | null);
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      projectType: r.project_type,
      status: r.status,
      ownerUserId: r.owner_user_id,
      ownerUserName: owner?.full_name ?? null,
      targetDate: r.target_date,
      linkedContactId: r.linked_contact_id,
      linkedContactName: linkedContact?.full_name ?? null,
      linkedContactProfileId: linkedContact?.profile_id ?? null,
      linkedPropertyId: r.linked_property_id,
      linkedPropertyName: linkedProperty?.nickname ?? linkedProperty?.address_line_1 ?? null,
      archivedAt: r.archived_at,
      emoji: r.emoji,
      color: r.color,
      taskCount: tasks.length,
      taskDoneCount: tasks.filter((t) => t.status === 'done').length,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  });

  // Per-view counts
  for (const v of views) {
    const vRaw = viewsRaw?.find((r) => r.key === v.key);
    const f = (vRaw?.filter_jsonb ?? {}) as typeof activeFilter;
    let cq = supabase.from('projects').select('*', { count: 'exact', head: true });
    if (f.types?.length) cq = cq.in('project_type', f.types);
    if (f.status?.length) cq = cq.in('status', f.status);
    if (f.exclude_status?.length) {
      cq = cq.not('status', 'in', `(${f.exclude_status.map((s) => `"${s}"`).join(',')})`);
    }
    const { count } = await cq;
    v.count = count ?? 0;
  }

  return { rows, views, activeView };
}
```

- [ ] **Step 2: Commit**

```bash
pnpm --filter web typecheck
git add apps/web/src/lib/admin/projects-list.ts
git commit -m "feat(admin/projects): list fetcher with saved view support"
```

---

## Task 4: Server actions

**Files:**
- Create: `apps/web/src/lib/admin/project-actions.ts`

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ProjectStatus, ProjectType } from './project-types';

export type CreateProjectInput = {
  name: string;
  description?: string;
  projectType: ProjectType;
  status?: ProjectStatus;
  targetDate?: string;
  linkedContactId?: string | null;
  linkedPropertyId?: string | null;
  emoji?: string | null;
  color?: string | null;
};

export async function createProject(input: CreateProjectInput): Promise<{ id: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('not authenticated');

  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      project_type: input.projectType,
      status: input.status ?? 'not_started',
      owner_user_id: user.id,
      target_date: input.targetDate ?? null,
      linked_contact_id: input.linkedContactId ?? null,
      linked_property_id: input.linkedPropertyId ?? null,
      emoji: input.emoji ?? null,
      color: input.color ?? null,
    })
    .select('id')
    .single();
  if (error) throw error;
  revalidatePath('/admin/projects');
  return { id: data.id };
}

export async function updateProject(
  id: string,
  patch: Partial<Omit<CreateProjectInput, 'projectType'>> & { projectType?: ProjectType; status?: ProjectStatus },
): Promise<void> {
  const supabase = await createClient();
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.description !== undefined) update.description = patch.description;
  if (patch.projectType !== undefined) update.project_type = patch.projectType;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.targetDate !== undefined) update.target_date = patch.targetDate;
  if (patch.linkedContactId !== undefined) update.linked_contact_id = patch.linkedContactId;
  if (patch.linkedPropertyId !== undefined) update.linked_property_id = patch.linkedPropertyId;
  if (patch.emoji !== undefined) update.emoji = patch.emoji;
  if (patch.color !== undefined) update.color = patch.color;

  const { error } = await supabase.from('projects').update(update).eq('id', id);
  if (error) throw error;
  revalidatePath('/admin/projects');
  revalidatePath(`/admin/projects/${id}`);
}

export async function archiveProject(id: string): Promise<void> {
  await updateProject(id, { status: 'archived' });
}
```

Commit:

```bash
pnpm --filter web typecheck
git add apps/web/src/lib/admin/project-actions.ts
git commit -m "feat(admin/projects): server actions"
```

---

## Task 5: ProjectsListView (Compact)

**Files:**
- Create: `apps/web/src/app/(admin)/admin/projects/ProjectsListView.tsx`
- Create: `apps/web/src/app/(admin)/admin/projects/ProjectsListView.module.css`

Structure mirrors `ContactsListView` (saved view tabs + compact table). Columns: Name (emoji + name + type), Linked (contact or property), Owner (avatar), Target date, Progress (tasks done/total with a bar), Status pill, chevron.

- [ ] **Step 1: Write the component**

```tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import type { ProjectRow, ProjectSavedView } from '@/lib/admin/project-types';
import {
  PROJECT_STATUS_LABEL,
  PROJECT_TYPE_EMOJI,
  PROJECT_TYPE_LABEL,
} from '@/lib/admin/project-types';
import styles from './ProjectsListView.module.css';

const STATUS_PILL_CLASS: Record<string, string> = {
  not_started: styles.pillGray,
  in_progress: styles.pillBlue,
  blocked: styles.pillRed,
  done: styles.pillGreen,
  archived: styles.pillGray,
};

function SavedViewTabs({ views }: { views: ProjectSavedView[] }) {
  const sp = useSearchParams();
  const active = sp?.get('view') ?? 'all-projects';
  return (
    <nav className={styles.views} aria-label="Saved views">
      {views.map((v) => {
        const isActive = v.key === active;
        const href = v.key === 'all-projects' ? '/admin/projects' : `/admin/projects?view=${v.key}`;
        return (
          <Link
            key={v.key}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
          >
            {v.name}
            <span className={`${styles.count} ${isActive ? styles.countActive : ''}`}>
              {v.count}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function ProjectsListView({
  rows,
  views,
}: {
  rows: ProjectRow[];
  views: ProjectSavedView[];
}) {
  return (
    <div className={styles.page}>
      <SavedViewTabs views={views} />

      <div className={styles.tableWrap}>
        <div className={styles.rowHead}>
          <div>Project</div>
          <div>Linked</div>
          <div>Owner</div>
          <div>Target</div>
          <div>Progress</div>
          <div>Status</div>
          <div />
        </div>

        {rows.map((p) => {
          const progress =
            p.taskCount > 0 ? Math.round((p.taskDoneCount / p.taskCount) * 100) : 0;
          return (
            <Link
              key={p.id}
              href={`/admin/projects/${p.id}`}
              className={styles.row}
            >
              <div className={styles.projectCell}>
                <span className={styles.emoji}>
                  {p.emoji ?? PROJECT_TYPE_EMOJI[p.projectType]}
                </span>
                <div>
                  <div className={styles.name}>{p.name}</div>
                  <div className={styles.sub}>{PROJECT_TYPE_LABEL[p.projectType]}</div>
                </div>
              </div>
              <div className={styles.linked}>
                {p.linkedContactName
                  ? <span className={styles.linkTag}>● {p.linkedContactName}</span>
                  : p.linkedPropertyName
                    ? <span className={styles.linkTag}>● {p.linkedPropertyName}</span>
                    : <span className={styles.muted}>—</span>}
              </div>
              <div className={styles.owner}>
                {p.ownerUserName
                  ? <span className={styles.ownerInitials}>
                      {p.ownerUserName.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                    </span>
                  : <span className={styles.muted}>—</span>}
              </div>
              <div className={styles.mono}>
                {p.targetDate
                  ? new Date(p.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                  : '—'}
              </div>
              <div className={styles.progressCell}>
                <span className={styles.progressText}>
                  {p.taskDoneCount} / {p.taskCount || 0}
                </span>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div>
                <span className={`${styles.pill} ${STATUS_PILL_CLASS[p.status]}`}>
                  {PROJECT_STATUS_LABEL[p.status]}
                </span>
              </div>
              <div className={styles.chevron}>›</div>
            </Link>
          );
        })}

        {rows.length === 0 ? (
          <div className={styles.empty}>No projects in this view yet.</div>
        ) : null}
      </div>
    </div>
  );
}
```

`ProjectsListView.module.css`: mirror the ContactsListView styles with grid columns tuned for the project row. Use the same saved-view tab styles.

```css
.page { padding: 20px 24px 32px; background: #F4F5F7; min-height: 100%; }

.views {
  display: flex; gap: 2px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 16px;
}
.tab {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 9px 14px 12px;
  font-size: 13px; font-weight: 500;
  color: #6b7280; text-decoration: none;
  border-bottom: 2px solid transparent;
}
.tab:hover { color: #0F3B6B; }
.tabActive { color: #0F3B6B; border-bottom-color: #02AAEB; font-weight: 600; }
.count {
  background: #e5e7eb; color: #374151; font-size: 10.5px;
  padding: 1px 7px; border-radius: 10px;
  min-width: 22px; text-align: center; font-weight: 600;
}
.countActive { background: rgba(2,170,235,0.14); color: #02AAEB; }

.tableWrap {
  background: #fff; border: 1px solid #e5e7eb;
  border-radius: 12px; overflow: hidden;
  box-shadow: 0 1px 3px rgba(15,23,42,0.04);
}
.rowHead, .row {
  display: grid;
  grid-template-columns: minmax(240px, 2fr) minmax(180px, 1fr) 80px 90px minmax(140px, 1fr) 120px 24px;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
}
.rowHead {
  height: 40px; color: #6b7280;
  font-size: 10.5px; letter-spacing: 0.6px; text-transform: uppercase;
  font-weight: 600; border-bottom: 1px solid #e5e7eb;
  background: #fafbfc;
}
.row {
  height: 64px; border-bottom: 1px solid #f3f4f6;
  text-decoration: none; color: #111827;
  transition: background 120ms ease;
}
.row:hover { background: #fafbfc; }
.row:last-child { border-bottom: none; }

.projectCell { display: flex; gap: 10px; align-items: center; }
.emoji { font-size: 20px; }
.name { color: #0F3B6B; font-weight: 600; font-size: 13.5px; }
.sub { color: #6b7280; font-size: 11px; margin-top: 1px; }

.linked .linkTag { color: #0F3B6B; font-size: 12px; }
.linked .muted { color: #9ca3af; }

.owner .ownerInitials {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 50%;
  background: linear-gradient(135deg, #02AAEB, #1B77BE);
  color: #fff; font-size: 10px; font-weight: 600;
}

.mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #374151; }

.progressCell { display: flex; flex-direction: column; gap: 4px; }
.progressText { font-size: 11px; color: #374151; font-variant-numeric: tabular-nums; }
.progressBar { background: #e5e7eb; border-radius: 3px; height: 4px; overflow: hidden; }
.progressFill { background: linear-gradient(90deg, #02AAEB, #1B77BE); height: 100%; }

.pill {
  padding: 3px 10px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}
.pillBlue { background: rgba(2,170,235,0.14); color: #02AAEB; }
.pillGreen { background: rgba(16,185,129,0.14); color: #047857; }
.pillRed { background: rgba(239,68,68,0.14); color: #b91c1c; }
.pillGray { background: rgba(107,114,128,0.14); color: #374151; }

.chevron { color: #9ca3af; font-size: 18px; text-align: right; }
.empty { padding: 40px 24px; color: #6b7280; font-size: 13px; text-align: center; }
.muted { color: #9ca3af; }
```

- [ ] **Step 2: Commit**

```bash
pnpm --filter web typecheck
git add apps/web/src/app/\(admin\)/admin/projects/ProjectsListView.tsx \
       apps/web/src/app/\(admin\)/admin/projects/ProjectsListView.module.css
git commit -m "feat(admin/projects): list view with saved views and progress bars"
```

---

## Task 6: /admin/projects page + layout

**Files:**
- Create: `apps/web/src/app/(admin)/admin/projects/page.tsx`
- Create: `apps/web/src/app/(admin)/admin/projects/layout.tsx`

```tsx
// page.tsx
import { fetchAdminProjectsList } from '@/lib/admin/projects-list';
import { ProjectsListView } from './ProjectsListView';

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string }>;
}) {
  const { view, q } = await searchParams;
  const { rows, views } = await fetchAdminProjectsList({
    viewKey: view,
    search: q ?? null,
  });
  return <ProjectsListView rows={rows} views={views} />;
}
```

```tsx
// layout.tsx
import type { ReactNode } from 'react';
import { PageTitle } from '@/components/admin/chrome/PageTitle';

export default function ProjectsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageTitle
        title="Projects"
        subtitle="Internal initiatives, onboardings, and ideas"
      />
      {children}
    </>
  );
}
```

Commit:

```bash
pnpm --filter web typecheck && pnpm --filter web build
git add apps/web/src/app/\(admin\)/admin/projects/page.tsx \
       apps/web/src/app/\(admin\)/admin/projects/layout.tsx
git commit -m "feat(admin/projects): page + layout"
```

---

## Task 7: Sidebar nav + CreateMenu

**Files:**
- Modify: `apps/web/src/components/admin/AdminSidebar.tsx`
- Modify: `apps/web/src/components/admin/AdminBottomNav.tsx` (if present)
- Modify: `apps/web/src/components/admin/chrome/CreateMenu.tsx`
- Modify: `apps/web/src/lib/admin/derive-page-title.ts`

- [ ] **Step 1: Add Projects to sidebar navItems**

In `AdminSidebar.tsx`, import a new icon (`Kanban` or `SquaresFour` from `@phosphor-icons/react`) and append:

```ts
{ href: '/admin/projects', label: 'Projects', icon: <Kanban size={18} weight="duotone" />, matchPrefix: '/admin/projects' },
```

Place it between Properties and Help Center. Mirror the same change in `adminRailItems`.

- [ ] **Step 2: Add to CreateMenu**

In the menu items, insert:

```ts
{ key: 'project', label: 'Project', shortcut: 'P' },
```

In CreateModal render logic, when `key === 'project'` render `<ProjectForm />`.

- [ ] **Step 3: derive-page-title**

Add:

```ts
if (pathname.startsWith('/admin/projects')) {
  return {
    title: 'Projects',
    subtitle: 'Internal initiatives, onboardings, and ideas',
  };
}
```

- [ ] **Step 4: Commit**

```bash
pnpm --filter web typecheck
git add apps/web/src/components/admin/AdminSidebar.tsx \
       apps/web/src/components/admin/AdminBottomNav.tsx \
       apps/web/src/components/admin/chrome/CreateMenu.tsx \
       apps/web/src/lib/admin/derive-page-title.ts
git commit -m "feat(admin): sidebar + CreateMenu + page-title for Projects"
```

---

## Task 8: ProjectForm in Create Modal

**Files:**
- Create: `apps/web/src/components/admin/chrome/create-forms/ProjectForm.tsx`

```tsx
'use client';

import { useState, useTransition } from 'react';
import { createProject } from '@/lib/admin/project-actions';
import {
  PROJECT_TYPE_LABEL,
  PROJECT_TYPE_EMOJI,
  type ProjectType,
} from '@/lib/admin/project-types';

const TYPES: ProjectType[] = [
  'idea','feature_build','employee_onboarding',
  'cleaner_onboarding','vendor_onboarding','internal',
];

export function ProjectForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('idea');
  const [targetDate, setTargetDate] = useState('');
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      await createProject({
        name,
        description: description || undefined,
        projectType,
        targetDate: targetDate || undefined,
      });
      onClose();
    });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <label>Name
        <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </label>
      <label>Type
        <select value={projectType} onChange={(e) => setProjectType(e.target.value as ProjectType)}>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {PROJECT_TYPE_EMOJI[t]} {PROJECT_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </label>
      <label>Target date
        <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
      </label>
      <label>Description
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </label>
      <div>
        <button type="button" onClick={onClose}>Cancel</button>
        <button type="submit" disabled={!name.trim() || isPending}>Create</button>
      </div>
    </form>
  );
}
```

Styling to match the existing CreateModal form conventions (see TaskForm for the reference pattern).

Commit:

```bash
git add apps/web/src/components/admin/chrome/create-forms/ProjectForm.tsx
git commit -m "feat(admin/projects): ProjectForm in Create Modal"
```

---

## Task 9: Project detail shell (5 tabs) + detail fetcher

**Files:**
- Create: `apps/web/src/lib/admin/project-detail.ts`
- Create: `apps/web/src/app/(admin)/admin/projects/[id]/page.tsx`
- Create: `apps/web/src/app/(admin)/admin/projects/[id]/ProjectDetailShell.tsx`
- Create: `apps/web/src/app/(admin)/admin/projects/[id]/ProjectDetailShell.module.css`

- [ ] **Step 1: Detail fetcher**

```ts
// project-detail.ts
import { createClient } from '@/lib/supabase/server';
import type { ProjectRow } from './project-types';

export async function fetchProjectDetail(id: string): Promise<ProjectRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projects')
    .select(`
      id, name, description, project_type, status, owner_user_id, target_date,
      linked_contact_id, linked_property_id, archived_at, emoji, color,
      created_at, updated_at,
      owner_profile:profiles!projects_owner_user_id_fkey(full_name),
      linked_contact:contacts(full_name, profile_id),
      linked_property:properties(nickname, address_line_1),
      tasks:tasks(id, status)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const tasks = (data.tasks as { status: string }[] | null) ?? [];
  const linkedContact = Array.isArray(data.linked_contact)
    ? data.linked_contact[0]
    : (data.linked_contact as { full_name?: string; profile_id?: string | null } | null);
  const linkedProperty = Array.isArray(data.linked_property)
    ? data.linked_property[0]
    : (data.linked_property as { nickname?: string; address_line_1?: string } | null);
  const owner = Array.isArray(data.owner_profile)
    ? data.owner_profile[0]
    : (data.owner_profile as { full_name?: string } | null);

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    projectType: data.project_type,
    status: data.status,
    ownerUserId: data.owner_user_id,
    ownerUserName: owner?.full_name ?? null,
    targetDate: data.target_date,
    linkedContactId: data.linked_contact_id,
    linkedContactName: linkedContact?.full_name ?? null,
    linkedContactProfileId: linkedContact?.profile_id ?? null,
    linkedPropertyId: data.linked_property_id,
    linkedPropertyName: linkedProperty?.nickname ?? linkedProperty?.address_line_1 ?? null,
    archivedAt: data.archived_at,
    emoji: data.emoji,
    color: data.color,
    taskCount: tasks.length,
    taskDoneCount: tasks.filter((t) => t.status === 'done').length,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
```

- [ ] **Step 2: Detail shell**

```tsx
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { ProjectRow } from '@/lib/admin/project-types';
import {
  PROJECT_STATUS_LABEL,
  PROJECT_TYPE_EMOJI,
  PROJECT_TYPE_LABEL,
} from '@/lib/admin/project-types';
import styles from './ProjectDetailShell.module.css';
import type { ReactNode } from 'react';

const TABS = ['overview', 'tasks', 'activity', 'files', 'settings'] as const;
type Tab = typeof TABS[number];

const TAB_LABEL: Record<Tab, string> = {
  overview: 'Overview',
  tasks: 'Tasks',
  activity: 'Activity',
  files: 'Files',
  settings: 'Settings',
};

export function ProjectDetailShell({
  project,
  children,
}: {
  project: ProjectRow;
  children: ReactNode;
}) {
  const sp = useSearchParams();
  const active: Tab = (sp?.get('tab') as Tab) ?? 'overview';

  return (
    <div className={styles.shell}>
      <header className={styles.band}>
        <div className={styles.emoji}>
          {project.emoji ?? PROJECT_TYPE_EMOJI[project.projectType]}
        </div>
        <div className={styles.info}>
          <h1 className={styles.name}>{project.name}</h1>
          <p className={styles.sub}>
            {PROJECT_TYPE_LABEL[project.projectType]}
            {project.linkedContactName ? ` · ${project.linkedContactName}` : ''}
            {project.linkedPropertyName ? ` · ${project.linkedPropertyName}` : ''}
            {project.targetDate ? ` · target ${new Date(project.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ''}
          </p>
        </div>
        <span className={`${styles.pill} ${styles['status_' + project.status]}`}>
          {PROJECT_STATUS_LABEL[project.status]}
        </span>
      </header>

      <nav className={styles.tabs} aria-label="Project sections">
        {TABS.map((t) => (
          <Link
            key={t}
            href={t === 'overview' ? `/admin/projects/${project.id}` : `/admin/projects/${project.id}?tab=${t}`}
            aria-current={t === active ? 'page' : undefined}
            className={`${styles.tab} ${t === active ? styles.tabActive : ''}`}
          >
            {TAB_LABEL[t]}
          </Link>
        ))}
      </nav>

      <div className={styles.content}>{children}</div>
    </div>
  );
}
```

```css
.shell { padding: 0; background: #F4F5F7; min-height: 100%; }

.band {
  display: flex; align-items: center; gap: 16px;
  padding: 20px 24px 16px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}
.emoji { font-size: 44px; }
.info { flex: 1; min-width: 0; }
.name {
  color: #0F3B6B; font-size: 22px; font-weight: 700;
  line-height: 1.2; margin: 0;
}
.sub { color: #6b7280; font-size: 13px; margin: 4px 0 0; }

.pill {
  padding: 4px 11px; border-radius: 6px;
  font-size: 11.5px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.3px;
}
.status_not_started { background: rgba(107,114,128,0.14); color: #374151; }
.status_in_progress { background: rgba(2,170,235,0.14); color: #02AAEB; }
.status_blocked { background: rgba(239,68,68,0.14); color: #b91c1c; }
.status_done { background: rgba(16,185,129,0.14); color: #047857; }
.status_archived { background: rgba(107,114,128,0.10); color: #6b7280; }

.tabs {
  display: flex; gap: 4px;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}
.tab {
  padding: 11px 14px;
  font-size: 13px; font-weight: 500;
  color: #6b7280; text-decoration: none;
  border-bottom: 2px solid transparent;
}
.tab:hover { color: #0F3B6B; }
.tabActive { color: #0F3B6B; border-bottom-color: #02AAEB; font-weight: 600; }

.content { padding: 18px 24px 32px; }
```

- [ ] **Step 3: Detail page router**

```tsx
// page.tsx
import { notFound } from 'next/navigation';
import { fetchProjectDetail } from '@/lib/admin/project-detail';
import { ProjectDetailShell } from './ProjectDetailShell';
import { OverviewTab } from './OverviewTab';
import { ActivityTab } from './ActivityTab';
import { FilesTab } from './FilesTab';
import { SettingsTab } from './SettingsTab';
import { TasksTab } from '@/components/admin/tasks/TasksTab';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function ProjectDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab = 'overview' } = await searchParams;
  const project = await fetchProjectDetail(id);
  if (!project) notFound();

  let body;
  if (tab === 'tasks') body = <TasksTab parentType="project" parentId={project.id} />;
  else if (tab === 'activity') body = <ActivityTab projectId={project.id} />;
  else if (tab === 'files') body = <FilesTab projectId={project.id} />;
  else if (tab === 'settings') body = <SettingsTab project={project} />;
  else body = <OverviewTab project={project} />;

  return (
    <ProjectDetailShell project={project}>
      {body}
    </ProjectDetailShell>
  );
}
```

Commit:

```bash
git add apps/web/src/lib/admin/project-detail.ts \
       apps/web/src/app/\(admin\)/admin/projects/\[id\]/
git commit -m "feat(admin/projects): detail page + shell + tab routing"
```

---

## Task 10: Tab stubs (Overview, Activity, Files, Settings)

Each tab is a small component. Keep them minimal this plan; Plan E will upgrade OverviewTab with a smart Overview.

**OverviewTab.tsx** (minimal):

```tsx
import type { ProjectRow } from '@/lib/admin/project-types';
import { PROJECT_STATUS_LABEL } from '@/lib/admin/project-types';

export function OverviewTab({ project }: { project: ProjectRow }) {
  const pct = project.taskCount > 0
    ? Math.round((project.taskDoneCount / project.taskCount) * 100)
    : 0;
  return (
    <div>
      <section>
        <h2>Progress</h2>
        <p>{project.taskDoneCount} of {project.taskCount} tasks · {pct}%</p>
      </section>
      {project.description ? (
        <section><h2>Description</h2><p>{project.description}</p></section>
      ) : null}
      <section>
        <h2>Status</h2>
        <p>{PROJECT_STATUS_LABEL[project.status]}</p>
      </section>
      {project.linkedContactName ? (
        <section><h2>Linked contact</h2><p>{project.linkedContactName}</p></section>
      ) : null}
      {project.linkedPropertyName ? (
        <section><h2>Linked property</h2><p>{project.linkedPropertyName}</p></section>
      ) : null}
    </div>
  );
}
```

**ActivityTab.tsx** stub: pulls recent `timeline_events` for this project (the timeline system already exists per-entity — follow its existing pattern). If the timeline component cannot scope by project, render a placeholder "Activity coming soon" + list of recent task status changes from the `tasks` table scoped to this project.

**FilesTab.tsx** stub: query `attachments` where `parent_type='project' and parent_id=projectId`. Render a simple list with filename and upload date. No upload UI this plan.

**SettingsTab.tsx**: a form that calls `updateProject` / `archiveProject`. Include inputs for name, description, project_type, status, target_date, linked_contact_id (searchable), linked_property_id (searchable), plus an Archive button.

Commit each piece as a separate commit. After all stubs exist:

```bash
pnpm --filter web typecheck && pnpm --filter web build
git add apps/web/src/app/\(admin\)/admin/projects/\[id\]/
git commit -m "feat(admin/projects): tab stubs (Overview/Activity/Files/Settings)"
```

---

## Task 11: Playwright spec

**Files:**
- Create: `apps/web/e2e/projects.spec.ts`

```ts
import { test, expect } from '@playwright/test';

test('Projects page renders with saved view tabs', async ({ page }) => {
  await page.goto('/admin/projects');
  await expect(page.getByRole('navigation', { name: 'Saved views' })).toBeVisible();
  for (const label of ['All Projects', 'Idea Board', 'Feature Builds']) {
    await expect(page.getByRole('link', { name: new RegExp(label) })).toBeVisible();
  }
});

test('Create project via + New and see it in list', async ({ page }) => {
  await page.goto('/admin/projects');
  await page.getByRole('button', { name: /\+/ }).first().click();
  await page.getByRole('menuitem', { name: 'Project' }).click();
  await page.getByLabel('Name').fill('TEST · Playwright Project');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByText('TEST · Playwright Project')).toBeVisible();
});

test('Project detail renders 5 tabs', async ({ page }) => {
  await page.goto('/admin/projects');
  const firstLink = page.locator('a[href^="/admin/projects/"]').first();
  await firstLink.click();
  for (const label of ['Overview', 'Tasks', 'Activity', 'Files', 'Settings']) {
    await expect(page.getByRole('link', { name: label })).toBeVisible();
  }
});
```

Run:

```bash
cd apps/web
pnpm dlx playwright test e2e/projects.spec.ts --reporter=list
```

Commit:

```bash
git add apps/web/e2e/projects.spec.ts
git commit -m "test(admin/projects): playwright smoke"
```

---

## Task 12: Final verification

- [ ] **Step 1: Build**

```bash
pnpm --filter web typecheck && pnpm --filter web build
```

- [ ] **Step 2: Screenshot pass**

```bash
node screenshot.mjs "http://localhost:4000/admin/projects" "projects-all" --update-baseline
node screenshot.mjs "http://localhost:4000/admin/projects?view=feature-builds" "projects-features"
# after creating a project
node screenshot.mjs "http://localhost:4000/admin/projects/<id>" "project-detail-overview"
node screenshot.mjs "http://localhost:4000/admin/projects/<id>?tab=tasks" "project-detail-tasks"
```

- [ ] **Step 3: Sidebar verification**

Sidebar shows the Projects item between Properties and Help Center. The icon matches Parcel duotone family.

---

## Ship criterion recap

- `+ New → Project` creates a Project with a type, optional target date, optional linked contact/property.
- `/admin/projects` lists all projects with saved view tabs (Idea Board, Feature Builds, etc.), progress bars, status pills.
- `/admin/projects/[id]` renders 5 tabs (Overview · Tasks · Activity · Files · Settings).
- Tasks tab on a project works end to end (add task → shows in `/admin/tasks` with purple Project parent pill).
- Sidebar Projects item is present.
- Build + tests + screenshots pass.
