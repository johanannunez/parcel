# Plan A — Contacts Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse the separate Leads and Owners worlds into a single `contacts` table with `lifecycle_stage`, back the new `/admin/contacts` list page, introduce the `saved_views` storage that everything else will build on, and wire sidebar + redirects. Ship criterion: sign in, see all existing owners and leads unified in `/admin/contacts`, filter via Saved Views (Lead Pipeline / Active Owners / Cold / Churned), click a row → goes to the existing owner detail (unchanged this plan). `/admin/leads` and `/admin/owners` redirect to the appropriate saved view.

**Architecture:** One Supabase migration creates `contacts` + `saved_views` + lifecycle_stage enum + RLS + a backfill that mirrors every existing `profiles` row (role='owner') and every existing leads source into a contact. `properties.contact_id` is added and backfilled. A server fetcher returns unified rows; a client list view renders them with the shared chrome already shipped. Owners list stays reachable during migration via a redirect, not a duplicate UI.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4 + CSS modules, Supabase (SSR + service-role), Playwright + screenshot.mjs for visual verification.

**Verification style:** Parcel has no unit-test harness. Each task ends with one of: typecheck (`pnpm --filter web typecheck`), build (`pnpm --filter web build`), SQL verification against the linked Supabase, screenshot diff against baseline. Each task ends with a commit.

---

## File plan (create / modify)

**New files:**

- `apps/web/supabase/migrations/20260417_contacts_and_saved_views.sql` — contacts table, saved_views table, lifecycle_stage enum, backfill, `properties.contact_id` column + backfill, RLS policies, default saved views
- `apps/web/src/lib/admin/contacts-list.ts` — `fetchAdminContactsList({ view })` returns rows shaped for the list page
- `apps/web/src/lib/admin/contact-types.ts` — shared TypeScript types (`ContactRow`, `LifecycleStage`, `ContactSavedView`)
- `apps/web/src/lib/admin/lifecycle-stage.ts` — pure helpers: `stageLabel(stage)`, `stageGroup(stage)` (returns 'lead'|'onboarding'|'active'|'dormant'), `isLeadStage(stage)`
- `apps/web/src/app/(admin)/admin/contacts/page.tsx` — server component; fetches data, renders `<ContactsListView />`
- `apps/web/src/app/(admin)/admin/contacts/ContactsListView.tsx` — client component, full list UI
- `apps/web/src/app/(admin)/admin/contacts/ContactsListView.module.css` — table styles
- `apps/web/src/app/(admin)/admin/contacts/SavedViewsTabs.tsx` — tab strip rendering saved views, wired to URL `?view=…`
- `apps/web/src/app/(admin)/admin/contacts/SavedViewsTabs.module.css`
- `apps/web/src/app/(admin)/admin/contacts/layout.tsx` — sets page title via `<PageTitle />`
- `apps/web/src/app/(admin)/admin/leads/page.tsx` (overwrite) — redirect to `/admin/contacts?view=lead-pipeline`
- `apps/web/e2e/contacts-list.spec.ts` — Playwright: sign in as admin, open `/admin/contacts`, verify 1+ row, switch saved view, verify URL + filtered count

**Modified files:**

- `apps/web/src/components/admin/AdminSidebar.tsx` — rename `Owners` → `Contacts` (href `/admin/contacts`), remove `Leads` item
- `apps/web/src/app/(admin)/admin/owners/page.tsx` — change to redirect to `/admin/contacts?view=active-owners` (note: `/admin/owners/[entityId]` detail pages stay unchanged this plan)
- `apps/web/src/lib/admin/derive-page-title.ts` — add `/admin/contacts` title mapping
- `apps/web/src/components/admin/AdminBottomNav.tsx` (if present) — update mobile bottom nav similarly

**Files NOT touched this plan:**

- `OwnerDetailShell.tsx` and children — stays for contact detail routing; Plan E will evolve it. Clicking a row in `/admin/contacts` jumps to `/admin/owners/[entityId]` for now.
- `/admin/leads/*` component tree — replaced by a one-line redirect.
- Anything in `(portal)/*` — the owner portal is unaffected.

---

## Data shape

```ts
// apps/web/src/lib/admin/contact-types.ts
export type LifecycleStage =
  | 'lead_new'
  | 'qualified'
  | 'in_discussion'
  | 'contract_sent'
  | 'onboarding'
  | 'active_owner'
  | 'paused'
  | 'churned';

export type StageGroup = 'lead' | 'onboarding' | 'active' | 'dormant';

export type ContactRow = {
  id: string;
  profileId: string | null;   // link back to profiles if this contact is a signed-up user
  fullName: string;
  displayName: string | null;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  source: string | null;
  sourceDetail: string | null;
  lifecycleStage: LifecycleStage;
  stageChangedAt: string;     // ISO
  assignedTo: string | null;  // profiles.id of assigned admin
  assignedToName: string | null;
  estimatedMrr: number | null;
  propertyCount: number;      // computed from properties.contact_id
  lastActivityAt: string | null;
  createdAt: string;
};

export type ContactSavedView = {
  key: string;                // URL slug (e.g., 'lead-pipeline')
  name: string;
  filterStages: LifecycleStage[];
  orderSort: 'name_asc' | 'recent_activity' | 'stage_age';
  count: number;              // populated at fetch time
};
```

## Saved views (seeded as global shared)

| Key                | Name           | Filter (lifecycle_stage in) |
|--------------------|----------------|-----------------------------|
| `all-contacts`     | All Contacts   | every stage                 |
| `lead-pipeline`    | Lead Pipeline  | lead_new, qualified, in_discussion, contract_sent |
| `onboarding`       | Onboarding     | onboarding                  |
| `active-owners`    | Active Owners  | active_owner                |
| `cold`             | Cold           | qualified, in_discussion (where last_activity > 14d) |
| `churned`          | Churned        | paused, churned             |

"Cold" filter is a compound filter stored as JSON in `saved_views.filter_jsonb`; the fetcher evaluates the `last_activity > 14d` condition in SQL. All others are stage-only filters.

---

## Sequence rationale

1. Migration first. No app code depends on it working; once shipped we can move to UI safely.
2. Pure TypeScript helpers (types, lifecycle-stage utilities) before any component that uses them.
3. Server fetcher (`fetchAdminContactsList`) before the page component.
4. List page + saved view tabs.
5. Sidebar nav and redirect last (after the new page works).
6. Playwright spec at the end confirms the whole loop.

Every task ends with a commit.

---

## Task 1: Migration — contacts, saved_views, lifecycle stage enum

**Files:**
- Create: `apps/web/supabase/migrations/20260417_contacts_and_saved_views.sql`

- [ ] **Step 1: Inspect current owners / leads data sources**

Run the following against the linked Supabase (via MCP `mcp__claude_ai_Supabase__execute_sql` or the SQL editor) to find the existing owner rows and any leads table:

```sql
-- Count profiles by role
select role, count(*) from profiles group by role;

-- Find any leads table or analogous structure
select table_name from information_schema.tables
where table_schema = 'public' and table_name ilike '%lead%';

-- Count properties without an explicit contact link
select count(*) from properties;
```

Record the outputs. Expect: profiles with `role='owner'` (the N existing owners), possibly a `leads` table (if it exists, note its columns), and all properties rows.

- [ ] **Step 2: Write the migration**

Create `apps/web/supabase/migrations/20260417_contacts_and_saved_views.sql` with:

```sql
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
  columns_jsonb   jsonb default '[]'::jsonb,
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
on conflict do nothing;

-- 6. Backfill properties.contact_id from existing owner linkage
-- Depending on current schema, properties.owner_id -> profiles.id. Link to contacts via profile_id.
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
```

- [ ] **Step 3: Apply the migration**

Use the Supabase MCP tool to apply:

```
mcp__claude_ai_Supabase__apply_migration
  project_id: pwoxwpryummqeqsxdgyc
  name: 20260417_contacts_and_saved_views
  query: <the SQL from Step 2>
```

Expected: migration succeeds; no errors.

- [ ] **Step 4: Verify migration with SQL checks**

```sql
-- Row counts
select count(*) as contacts_count from contacts;
select count(*) as properties_linked from properties where contact_id is not null;
select count(*) as properties_unlinked from properties where contact_id is null;

-- Saved views seeded
select key, name, sort_order from saved_views where entity_type = 'contact' order by sort_order;

-- Stage distribution
select lifecycle_stage, count(*) from contacts group by lifecycle_stage order by 1;
```

Expected: contacts_count equals the number of `profiles` rows with `role='owner'`; properties_linked equals the number of properties that had an owner; 6 saved views for contact entity.

- [ ] **Step 5: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/supabase/migrations/20260417_contacts_and_saved_views.sql
git commit -m "feat(db): add contacts and saved_views foundation

Creates contacts table (unified lead+owner record with lifecycle_stage
enum), saved_views storage, properties.contact_id column, backfills
from existing profiles(role='owner'), seeds 6 default contact saved
views, enables RLS. This is Plan A Task 1."
```

---

## Task 2: TypeScript helpers (lifecycle-stage, contact-types)

**Files:**
- Create: `apps/web/src/lib/admin/contact-types.ts`
- Create: `apps/web/src/lib/admin/lifecycle-stage.ts`

- [ ] **Step 1: Write the types**

`apps/web/src/lib/admin/contact-types.ts`:

```ts
export type LifecycleStage =
  | 'lead_new'
  | 'qualified'
  | 'in_discussion'
  | 'contract_sent'
  | 'onboarding'
  | 'active_owner'
  | 'paused'
  | 'churned';

export type StageGroup = 'lead' | 'onboarding' | 'active' | 'dormant';

export type ContactRow = {
  id: string;
  profileId: string | null;
  fullName: string;
  displayName: string | null;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  source: string | null;
  sourceDetail: string | null;
  lifecycleStage: LifecycleStage;
  stageChangedAt: string;
  assignedTo: string | null;
  assignedToName: string | null;
  estimatedMrr: number | null;
  propertyCount: number;
  lastActivityAt: string | null;
  createdAt: string;
};

export type ContactSavedView = {
  key: string;
  name: string;
  filterStages: LifecycleStage[];
  lastActivityOlderThanDays?: number;
  sort: 'name_asc' | 'recent_activity' | 'stage_age';
  viewMode: 'status' | 'gallery' | 'compact' | 'map';
  sortOrder: number;
  count: number;
};

export const CONTACT_VIEW_MODES = ['status', 'gallery', 'compact'] as const;
export type ContactViewMode = typeof CONTACT_VIEW_MODES[number];
```

- [ ] **Step 2: Write lifecycle-stage helpers**

`apps/web/src/lib/admin/lifecycle-stage.ts`:

```ts
import type { LifecycleStage, StageGroup } from './contact-types';

export const STAGE_LABEL: Record<LifecycleStage, string> = {
  lead_new: 'New lead',
  qualified: 'Qualified',
  in_discussion: 'In discussion',
  contract_sent: 'Contract sent',
  onboarding: 'Onboarding',
  active_owner: 'Active owner',
  paused: 'Paused',
  churned: 'Churned',
};

const GROUP_MAP: Record<LifecycleStage, StageGroup> = {
  lead_new: 'lead',
  qualified: 'lead',
  in_discussion: 'lead',
  contract_sent: 'lead',
  onboarding: 'onboarding',
  active_owner: 'active',
  paused: 'dormant',
  churned: 'dormant',
};

export function stageLabel(stage: LifecycleStage): string {
  return STAGE_LABEL[stage];
}

export function stageGroup(stage: LifecycleStage): StageGroup {
  return GROUP_MAP[stage];
}

export function isLeadStage(stage: LifecycleStage): boolean {
  return GROUP_MAP[stage] === 'lead';
}

export function isActiveStage(stage: LifecycleStage): boolean {
  return GROUP_MAP[stage] === 'active' || GROUP_MAP[stage] === 'onboarding';
}
```

- [ ] **Step 3: Typecheck**

```bash
cd /Users/johanannunez/workspace/parcel
pnpm --filter web typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/admin/contact-types.ts apps/web/src/lib/admin/lifecycle-stage.ts
git commit -m "feat(admin): contact types and lifecycle-stage helpers"
```

---

## Task 3: Server fetcher — fetchAdminContactsList

**Files:**
- Create: `apps/web/src/lib/admin/contacts-list.ts`

- [ ] **Step 1: Write the fetcher**

`apps/web/src/lib/admin/contacts-list.ts`:

```ts
import { createClient } from '@/lib/supabase/server';
import type {
  ContactRow,
  ContactSavedView,
  LifecycleStage,
} from './contact-types';

type FetchOptions = {
  viewKey?: string;  // saved view key; default 'all-contacts'
  search?: string | null;
};

export async function fetchContactSavedViews(): Promise<ContactSavedView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('saved_views')
    .select('key, name, filter_jsonb, sort, view_mode, sort_order')
    .eq('entity_type', 'contact')
    .eq('is_shared', true)
    .order('sort_order');
  if (error) throw error;

  const views: ContactSavedView[] = [];
  for (const row of data ?? []) {
    const filter = (row.filter_jsonb ?? {}) as {
      stages?: LifecycleStage[];
      last_activity_older_than_days?: number;
    };
    views.push({
      key: row.key,
      name: row.name,
      filterStages: filter.stages ?? [],
      lastActivityOlderThanDays: filter.last_activity_older_than_days,
      sort: (row.sort as ContactSavedView['sort']) ?? 'name_asc',
      viewMode: (row.view_mode as ContactSavedView['viewMode']) ?? 'compact',
      sortOrder: row.sort_order ?? 0,
      count: 0, // filled in by caller
    });
  }
  return views;
}

export async function fetchAdminContactsList({
  viewKey = 'all-contacts',
  search = null,
}: FetchOptions = {}): Promise<{
  rows: ContactRow[];
  views: ContactSavedView[];
  activeView: ContactSavedView;
}> {
  const supabase = await createClient();
  const views = await fetchContactSavedViews();
  const activeView =
    views.find((v) => v.key === viewKey) ??
    views.find((v) => v.key === 'all-contacts') ??
    views[0];

  if (!activeView) {
    throw new Error('No saved views found for entity contact');
  }

  // Query rows
  let query = supabase
    .from('contacts')
    .select(
      `id, profile_id, full_name, display_name, company_name, email, phone,
       avatar_url, source, source_detail, lifecycle_stage, stage_changed_at,
       assigned_to, estimated_mrr, last_activity_at, created_at,
       assigned_profile:profiles!contacts_assigned_to_fkey(full_name),
       property_count:properties(count)`,
    );

  if (activeView.filterStages.length > 0) {
    query = query.in('lifecycle_stage', activeView.filterStages);
  }

  if (activeView.lastActivityOlderThanDays) {
    const cutoff = new Date(
      Date.now() - activeView.lastActivityOlderThanDays * 86400_000,
    ).toISOString();
    query = query.or(`last_activity_at.lt.${cutoff},last_activity_at.is.null`);
  }

  if (search && search.trim().length > 0) {
    const q = `%${search.trim()}%`;
    query = query.or(
      `full_name.ilike.${q},company_name.ilike.${q},email.ilike.${q}`,
    );
  }

  switch (activeView.sort) {
    case 'name_asc':
      query = query.order('full_name', { ascending: true });
      break;
    case 'recent_activity':
      query = query
        .order('last_activity_at', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false });
      break;
    case 'stage_age':
      query = query.order('stage_changed_at', { ascending: true });
      break;
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows: ContactRow[] = (data ?? []).map((r) => {
    const assignedProfile =
      Array.isArray(r.assigned_profile)
        ? r.assigned_profile[0]
        : (r.assigned_profile as { full_name?: string } | null);
    const propertyCount = Array.isArray(r.property_count)
      ? (r.property_count[0]?.count ?? 0)
      : (r.property_count as number | null) ?? 0;
    return {
      id: r.id,
      profileId: r.profile_id,
      fullName: r.full_name,
      displayName: r.display_name,
      companyName: r.company_name,
      email: r.email,
      phone: r.phone,
      avatarUrl: r.avatar_url,
      source: r.source,
      sourceDetail: r.source_detail,
      lifecycleStage: r.lifecycle_stage,
      stageChangedAt: r.stage_changed_at,
      assignedTo: r.assigned_to,
      assignedToName: assignedProfile?.full_name ?? null,
      estimatedMrr:
        r.estimated_mrr == null ? null : Number(r.estimated_mrr),
      propertyCount,
      lastActivityAt: r.last_activity_at,
      createdAt: r.created_at,
    };
  });

  // Populate counts on views
  const countsByStage = await supabase
    .from('contacts')
    .select('lifecycle_stage, count:id', { count: 'exact', head: false });
  // Simpler: one query per view. Fine for small N of views (6).
  for (const v of views) {
    if (v.filterStages.length === 0) {
      v.count = rows.length;
    } else {
      const { count } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .in('lifecycle_stage', v.filterStages);
      v.count = count ?? 0;
    }
  }

  return { rows, views, activeView };
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter web typecheck
```

Expected: no errors. If Supabase generated types complain about `contacts` and `saved_views`, regenerate types:

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm supabase:types 2>/dev/null || npx supabase gen types typescript --project-id pwoxwpryummqeqsxdgyc --schema public > src/types/supabase.ts
pnpm --filter web typecheck
```

- [ ] **Step 3: Sanity-run the fetcher**

Create a throwaway route `apps/web/src/app/api/_debug/contacts/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { fetchAdminContactsList } from '@/lib/admin/contacts-list';

export async function GET(request: Request) {
  const view = new URL(request.url).searchParams.get('view') ?? 'all-contacts';
  const result = await fetchAdminContactsList({ viewKey: view });
  return NextResponse.json({
    view: result.activeView.key,
    rowCount: result.rows.length,
    first: result.rows[0] ?? null,
    views: result.views.map((v) => ({ key: v.key, count: v.count })),
  });
}
```

Start dev:

```bash
cd /Users/johanannunez/workspace/parcel
pnpm --filter web dev
```

Open `http://localhost:4000/api/_debug/contacts?view=active-owners` in a browser. Expected JSON includes a non-zero `rowCount`, a `first` sample, and `views` with seeded counts.

Delete the debug route when verified.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/admin/contacts-list.ts
git rm -r apps/web/src/app/api/_debug 2>/dev/null || true
git commit -m "feat(admin): server fetcher for contacts list with saved view support"
```

---

## Task 4: Sidebar and page-title updates

**Files:**
- Modify: `apps/web/src/components/admin/AdminSidebar.tsx` (nav items)
- Modify: `apps/web/src/components/admin/AdminBottomNav.tsx` (mobile nav, if present)
- Modify: `apps/web/src/lib/admin/derive-page-title.ts`

- [ ] **Step 1: Update the sidebar navItems array**

In `AdminSidebar.tsx` at lines 35-43, replace the `navItems` array:

```ts
const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: <House size={18} weight="duotone" /> },
  { href: "/admin/inbox", label: "Inbox", icon: <ChatCircle size={18} weight="duotone" />, matchPrefix: "/admin/inbox" },
  { href: "/admin/tasks", label: "Tasks", icon: <ListChecks size={18} weight="duotone" />, matchPrefix: "/admin/tasks" },
  { href: "/admin/contacts", label: "Contacts", icon: <UsersThree size={18} weight="duotone" />, matchPrefix: "/admin/contacts" },
  { href: "/admin/properties", label: "Properties", icon: <Buildings size={18} weight="duotone" />, matchPrefix: "/admin/properties" },
  { href: "/admin/help", label: "Help Center", icon: <BookOpenText size={18} weight="duotone" />, matchPrefix: "/admin/help" },
];
```

Remove the unused `Target` import (formerly used for Leads). Do the same for `adminRailItems` further down in the same file (lines 439-446).

- [ ] **Step 2: Update the mobile bottom nav if it exists**

Run:

```bash
grep -l "admin/owners\|admin/leads" apps/web/src/components/admin/AdminBottomNav.tsx 2>/dev/null
```

If the file contains Owners or Leads entries, rename Owners → Contacts and remove Leads. Match the same href and matchPrefix pattern.

- [ ] **Step 3: Update derive-page-title**

In `apps/web/src/lib/admin/derive-page-title.ts`, add a mapping for `/admin/contacts`. Read the file first to match its shape; typical addition:

```ts
if (pathname.startsWith('/admin/contacts')) {
  return {
    title: 'Contacts',
    subtitle: 'Leads and owners under Parcel management',
  };
}
```

- [ ] **Step 4: Typecheck and build**

```bash
pnpm --filter web typecheck && pnpm --filter web build
```

Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/admin/AdminSidebar.tsx \
       apps/web/src/components/admin/AdminBottomNav.tsx \
       apps/web/src/lib/admin/derive-page-title.ts
git commit -m "feat(admin): rename Owners → Contacts in sidebar, remove Leads item"
```

---

## Task 5: SavedViewsTabs component

**Files:**
- Create: `apps/web/src/app/(admin)/admin/contacts/SavedViewsTabs.tsx`
- Create: `apps/web/src/app/(admin)/admin/contacts/SavedViewsTabs.module.css`

The tab strip that renders beneath the top bar, on the light body surface. Matches the design brief (brand-blue underline for active, count badges).

- [ ] **Step 1: Write the component**

`SavedViewsTabs.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { ContactSavedView } from '@/lib/admin/contact-types';
import styles from './SavedViewsTabs.module.css';

export function SavedViewsTabs({ views }: { views: ContactSavedView[] }) {
  const searchParams = useSearchParams();
  const activeKey = searchParams?.get('view') ?? 'all-contacts';

  return (
    <nav className={styles.row} aria-label="Saved views">
      {views.map((v) => {
        const isActive = v.key === activeKey;
        const href = v.key === 'all-contacts'
          ? '/admin/contacts'
          : `/admin/contacts?view=${v.key}`;
        return (
          <Link
            key={v.key}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
          >
            <span>{v.name}</span>
            <span className={`${styles.count} ${isActive ? styles.countActive : ''}`}>
              {v.count}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
```

`SavedViewsTabs.module.css`:

```css
.row {
  display: flex;
  align-items: center;
  gap: 2px;
  border-bottom: 1px solid #e5e7eb;
  margin: 0 0 16px 0;
  padding: 0;
}

.tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px 12px;
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  border-bottom: 2px solid transparent;
  line-height: 1;
  transition: color 120ms ease, border-color 120ms ease;
}

.tab:hover {
  color: #0F3B6B;
}

.tabActive {
  color: #0F3B6B;
  border-bottom-color: #02AAEB;
  font-weight: 600;
}

.count {
  background: #e5e7eb;
  color: #374151;
  font-size: 10.5px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 10px;
  min-width: 22px;
  text-align: center;
}

.countActive {
  background: rgba(2, 170, 235, 0.14);
  color: #02AAEB;
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter web typecheck
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/(admin)/admin/contacts/SavedViewsTabs.tsx \
       apps/web/src/app/(admin)/admin/contacts/SavedViewsTabs.module.css
git commit -m "feat(admin/contacts): SavedViewsTabs component"
```

---

## Task 6: ContactsListView (Compact view mode)

**Files:**
- Create: `apps/web/src/app/(admin)/admin/contacts/ContactsListView.tsx`
- Create: `apps/web/src/app/(admin)/admin/contacts/ContactsListView.module.css`

Only the Compact view mode ships in this plan. Gallery and Status modes land in Plan D. Compact is a dense table: avatar + name + company | email | phone | stage pill | properties count | last activity | overflow menu.

- [ ] **Step 1: Write the component**

`ContactsListView.tsx`:

```tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import type { ContactRow, ContactSavedView } from '@/lib/admin/contact-types';
import { stageLabel, stageGroup } from '@/lib/admin/lifecycle-stage';
import { SavedViewsTabs } from './SavedViewsTabs';
import styles from './ContactsListView.module.css';

type Props = {
  rows: ContactRow[];
  views: ContactSavedView[];
  activeView: ContactSavedView;
};

const STAGE_PILL_CLASS: Record<ReturnType<typeof stageGroup>, string> = {
  lead: styles.pillLead,
  onboarding: styles.pillOnboarding,
  active: styles.pillActive,
  dormant: styles.pillDormant,
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function relativeTime(iso: string | null): string {
  if (!iso) return '-';
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86400_000);
  if (days < 1) return 'today';
  if (days === 1) return '1d';
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(months / 12)}y`;
}

export function ContactsListView({ rows, views, activeView }: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      (r.fullName + ' ' + (r.companyName ?? '') + ' ' + (r.email ?? ''))
        .toLowerCase()
        .includes(q),
    );
  }, [rows, search]);

  return (
    <div className={styles.page}>
      <SavedViewsTabs views={views} />

      <div className={styles.toolbar}>
        <input
          type="text"
          className={styles.search}
          placeholder={`Search ${activeView.name.toLowerCase()}`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className={styles.toolbarMeta}>
          {filtered.length} of {rows.length}
        </div>
      </div>

      <div className={styles.tableWrap}>
        <div className={styles.rowHead}>
          <div>Contact</div>
          <div>Email</div>
          <div>Phone</div>
          <div>Stage</div>
          <div className={styles.numCol}>Properties</div>
          <div className={styles.numCol}>Last activity</div>
          <div />
        </div>

        {filtered.map((r) => {
          const href = r.profileId
            ? `/admin/owners/${r.profileId}`
            : `/admin/contacts/${r.id}`;
          const pillClass = STAGE_PILL_CLASS[stageGroup(r.lifecycleStage)];
          return (
            <Link key={r.id} href={href} className={styles.row}>
              <div className={styles.cellContact}>
                {r.avatarUrl ? (
                  <Image
                    src={r.avatarUrl}
                    alt=""
                    width={36}
                    height={36}
                    className={styles.avatar}
                  />
                ) : (
                  <div className={styles.avatarFallback} aria-hidden>
                    {initials(r.fullName)}
                  </div>
                )}
                <div className={styles.name}>
                  <div className={styles.nameText}>{r.fullName}</div>
                  {r.companyName ? (
                    <div className={styles.company}>{r.companyName}</div>
                  ) : null}
                </div>
              </div>
              <div className={styles.cellMono}>{r.email ?? '-'}</div>
              <div className={styles.cellMono}>{r.phone ?? '-'}</div>
              <div>
                <span className={`${styles.pill} ${pillClass}`}>
                  {stageLabel(r.lifecycleStage)}
                </span>
              </div>
              <div className={styles.numCol}>{r.propertyCount}</div>
              <div className={styles.numCol}>
                {relativeTime(r.lastActivityAt)}
              </div>
              <div className={styles.chevron}>›</div>
            </Link>
          );
        })}

        {filtered.length === 0 ? (
          <div className={styles.empty}>
            No contacts match this view{search ? ` with "${search}"` : ''}.
          </div>
        ) : null}
      </div>
    </div>
  );
}
```

`ContactsListView.module.css`:

```css
.page {
  padding: 20px 24px 32px;
  background: #F4F5F7;
  min-height: 100%;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.search {
  flex: 1;
  max-width: 360px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: #111827;
}

.search:focus {
  outline: none;
  border-color: rgba(2, 170, 235, 0.5);
  box-shadow: 0 0 0 3px rgba(2, 170, 235, 0.14);
}

.toolbarMeta {
  color: #6b7280;
  font-size: 12px;
  margin-left: auto;
}

.tableWrap {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.rowHead,
.row {
  display: grid;
  grid-template-columns: minmax(240px, 2fr) minmax(200px, 1.4fr) minmax(130px, 1fr) minmax(130px, 0.9fr) 110px 130px 24px;
  align-items: center;
  padding: 0 18px;
}

.rowHead {
  height: 40px;
  color: #6b7280;
  font-size: 10.5px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  font-weight: 600;
  border-bottom: 1px solid #e5e7eb;
  background: #fafbfc;
}

.row {
  height: 62px;
  border-bottom: 1px solid #f3f4f6;
  color: #111827;
  font-size: 13px;
  text-decoration: none;
  transition: background 120ms ease;
}

.row:hover {
  background: #fafbfc;
}

.row:last-child { border-bottom: none; }

.cellContact {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}

.avatar,
.avatarFallback {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
}

.avatarFallback {
  background: linear-gradient(135deg, #02AAEB, #1B77BE);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.name { min-width: 0; }
.nameText {
  color: #0F3B6B;
  font-weight: 600;
  font-size: 13.5px;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.company {
  color: #6b7280;
  font-size: 11.5px;
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cellMono {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12px;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.numCol {
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: #374151;
}

.pill {
  padding: 3px 10px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.pillLead { background: rgba(2, 170, 235, 0.14); color: #02AAEB; }
.pillOnboarding { background: rgba(139, 92, 246, 0.14); color: #8B5CF6; }
.pillActive { background: rgba(16, 185, 129, 0.14); color: #047857; }
.pillDormant { background: rgba(107, 114, 128, 0.14); color: #374151; }

.chevron {
  color: #9ca3af;
  font-size: 18px;
  text-align: right;
}

.empty {
  padding: 40px 24px;
  text-align: center;
  color: #6b7280;
  font-size: 13px;
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm --filter web typecheck
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/(admin)/admin/contacts/ContactsListView.tsx \
       apps/web/src/app/(admin)/admin/contacts/ContactsListView.module.css
git commit -m "feat(admin/contacts): ContactsListView (Compact view) with saved view tabs"
```

---

## Task 7: Contacts page wiring + layout

**Files:**
- Create: `apps/web/src/app/(admin)/admin/contacts/page.tsx`
- Create: `apps/web/src/app/(admin)/admin/contacts/layout.tsx`

- [ ] **Step 1: Write the page**

`apps/web/src/app/(admin)/admin/contacts/page.tsx`:

```tsx
import { fetchAdminContactsList } from '@/lib/admin/contacts-list';
import { ContactsListView } from './ContactsListView';

type Props = {
  searchParams: Promise<{ view?: string; q?: string }>;
};

export default async function ContactsPage({ searchParams }: Props) {
  const { view, q } = await searchParams;
  const { rows, views, activeView } = await fetchAdminContactsList({
    viewKey: view,
    search: q ?? null,
  });

  return (
    <ContactsListView rows={rows} views={views} activeView={activeView} />
  );
}
```

`apps/web/src/app/(admin)/admin/contacts/layout.tsx`:

```tsx
import type { ReactNode } from 'react';
import { PageTitle } from '@/components/admin/chrome/PageTitle';

export default function ContactsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageTitle
        title="Contacts"
        subtitle="Leads and owners under Parcel management"
      />
      {children}
    </>
  );
}
```

- [ ] **Step 2: Typecheck + build**

```bash
pnpm --filter web typecheck && pnpm --filter web build
```

- [ ] **Step 3: Start dev and screenshot the page**

```bash
cd /Users/johanannunez/workspace/parcel
pnpm --filter web dev
# In another terminal after login at localhost:4000:
node screenshot.mjs "http://localhost:4000/admin/contacts" "contacts-all" --update-baseline
node screenshot.mjs "http://localhost:4000/admin/contacts?view=lead-pipeline" "contacts-leads"
node screenshot.mjs "http://localhost:4000/admin/contacts?view=active-owners" "contacts-owners"
```

Read each screenshot with the Read tool. Verify:
- Top bar renders with the blue gradient and "Contacts / Leads and owners under Parcel management" title.
- Saved view tabs row under the top bar; active tab has brand-blue underline and filled count badge.
- Table rows render with avatar, name, stage pill with correct color, property count.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/(admin)/admin/contacts/page.tsx \
       apps/web/src/app/(admin)/admin/contacts/layout.tsx
git commit -m "feat(admin/contacts): wire /admin/contacts page"
```

---

## Task 8: Redirects from /admin/leads and /admin/owners list

**Files:**
- Overwrite: `apps/web/src/app/(admin)/admin/leads/page.tsx`
- Modify: `apps/web/src/app/(admin)/admin/owners/page.tsx`

- [ ] **Step 1: Overwrite leads page to redirect**

`apps/web/src/app/(admin)/admin/leads/page.tsx`:

```ts
import { redirect } from 'next/navigation';

export default function LeadsRedirect() {
  redirect('/admin/contacts?view=lead-pipeline');
}
```

Remove any other files under `/admin/leads` that defined routes (sub-pages), unless any are known to be in use elsewhere. Run to confirm:

```bash
find apps/web/src/app/\(admin\)/admin/leads -type f
```

If only `page.tsx` exists, nothing else to remove.

- [ ] **Step 2: Overwrite owners root page to redirect**

Read the existing `apps/web/src/app/(admin)/admin/owners/page.tsx` first to confirm shape. Replace with:

```ts
import { redirect } from 'next/navigation';

export default function OwnersRedirect() {
  redirect('/admin/contacts?view=active-owners');
}
```

The detail route `/admin/owners/[entityId]` stays completely unchanged (still reached by the link in ContactsListView).

- [ ] **Step 3: Manual verification**

With dev running:

```
# Redirects
http://localhost:4000/admin/leads   →  /admin/contacts?view=lead-pipeline
http://localhost:4000/admin/owners  →  /admin/contacts?view=active-owners

# Detail routing still works
# Click any row in /admin/contacts → should land on /admin/owners/<id> detail (unchanged)
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\(admin\)/admin/leads/page.tsx \
       apps/web/src/app/\(admin\)/admin/owners/page.tsx
git commit -m "feat(admin): redirect /admin/leads and /admin/owners to /admin/contacts views"
```

---

## Task 9: Playwright smoke test

**Files:**
- Create: `apps/web/e2e/contacts-list.spec.ts`

Assumes a Playwright config already exists (it does per the admin-chrome-foundation plan). If it does not, copy from `apps/web/e2e/admin-chrome.spec.ts` pattern.

- [ ] **Step 1: Write the spec**

`apps/web/e2e/contacts-list.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('Admin contacts list', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in helper. Adjust to match the project's existing admin auth pattern
    // (e.g., storage-state from global-setup). The chrome plan likely set this up.
    await page.goto('/admin/contacts');
    // If auth redirects to /login, replace with the project's test-auth helper.
  });

  test('renders saved view tabs with counts', async ({ page }) => {
    await expect(
      page.getByRole('navigation', { name: 'Saved views' }),
    ).toBeVisible();

    for (const label of ['All Contacts', 'Lead Pipeline', 'Active Owners']) {
      await expect(page.getByRole('link', { name: new RegExp(label) }))
        .toBeVisible();
    }
  });

  test('switching saved view updates URL and row count', async ({ page }) => {
    const allCountText = await page
      .locator('nav[aria-label="Saved views"] a[aria-current="page"] span')
      .last()
      .textContent();
    expect(allCountText).toMatch(/^\d+$/);

    await page.getByRole('link', { name: /Lead Pipeline/ }).click();
    await expect(page).toHaveURL(/view=lead-pipeline/);
    await expect(
      page.getByRole('link', { name: /Lead Pipeline/ }),
    ).toHaveAttribute('aria-current', 'page');
  });

  test('redirects /admin/owners → Active Owners view', async ({ page }) => {
    await page.goto('/admin/owners');
    await expect(page).toHaveURL('/admin/contacts?view=active-owners');
  });

  test('redirects /admin/leads → Lead Pipeline view', async ({ page }) => {
    await page.goto('/admin/leads');
    await expect(page).toHaveURL('/admin/contacts?view=lead-pipeline');
  });
});
```

- [ ] **Step 2: Run the spec**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm dlx playwright test e2e/contacts-list.spec.ts --reporter=list
```

Expected: 4 passing tests. If auth is required and the helper is not present, add an auth fixture following the project's existing e2e setup.

- [ ] **Step 3: Commit**

```bash
git add apps/web/e2e/contacts-list.spec.ts
git commit -m "test(admin/contacts): playwright smoke for list + saved views + redirects"
```

---

## Task 10: Final verification pass

- [ ] **Step 1: Full build + typecheck**

```bash
cd /Users/johanannunez/workspace/parcel
pnpm --filter web typecheck
pnpm --filter web build
```

Expected: both pass.

- [ ] **Step 2: Screenshot pass on the real chrome**

With dev running, open `http://localhost:4000/admin/contacts` in a browser. Verify by eye:

- Sidebar shows: Dashboard, Inbox, Tasks, **Contacts** (active), Properties, Help Center. No Leads, no Owners.
- Top bar shows "Contacts" title, blue gradient, clock on the right.
- Tabs row underneath body: All Contacts (active) / Lead Pipeline / Onboarding / Active Owners / Cold / Churned, each with a count badge.
- Table rows render with avatar, name + company, email, phone, stage pill, property count, relative last activity.

Screenshot command (diff against baseline):

```bash
node screenshot.mjs "http://localhost:4000/admin/contacts" "contacts-final" --diff --threshold 0.1 --side-by-side
```

- [ ] **Step 3: Data integrity check**

Run in Supabase SQL editor or via `mcp__claude_ai_Supabase__execute_sql`:

```sql
-- Every owner profile has a contact
select count(*) as owners_without_contact
from profiles p
where p.role = 'owner'
  and not exists (select 1 from contacts c where c.profile_id = p.id);

-- Every owned property has a contact_id
select count(*) as owned_properties_without_contact
from properties pr
where pr.owner_id is not null and pr.contact_id is null;
```

Both counts MUST be 0.

- [ ] **Step 4: Update spec checkbox**

If the spec tracks per-plan status, edit [2026-04-16-admin-pipelines-tasks-and-contacts-design.md](../specs/2026-04-16-admin-pipelines-tasks-and-contacts-design.md) with a `- [x] Plan A shipped (commit ref)` note in the migration section.

- [ ] **Step 5: Final commit**

```bash
git log --oneline | head -15
```

Confirm a clean sequence of commits scoped to Plan A. Nothing left over.

---

## Ship criterion recap

- Sign in as admin at `localhost:4000/admin/contacts`.
- See every existing owner as a contact row with stage `active_owner` or `onboarding`.
- Switch saved views: Lead Pipeline, Active Owners, Onboarding, Cold, Churned. URL updates, rows filter.
- Click a row: land on the existing `/admin/owners/[entityId]` detail (unchanged).
- `/admin/leads` redirects to `/admin/contacts?view=lead-pipeline`.
- `/admin/owners` redirects to `/admin/contacts?view=active-owners`.
- Sidebar shows "Contacts" where "Owners" used to be. No "Leads" item.
- Playwright + screenshot pass.
- Migration data integrity check returns 0 on both counts.
