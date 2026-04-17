# Admin Pipelines, Tasks, and Contacts — Design Spec

Date: 2026-04-16
Status: Approved design, ready for plan
Repo: parcel (apps/web)

## Why this exists

Today the admin has separate `/admin/leads`, `/admin/owners`, `/admin/properties`, `/admin/tasks`, plus an external Hubflo board where Jo informally manages a CRM pipeline, project pipeline, and ad-hoc task queue. Hubflo will be retired.

We need a single source of truth inside Parcel that handles three connected things:

1. **The CRM pipeline** for prospective owners ("leads") moving toward becoming customers.
2. **The property pipeline** for homes moving from signed to live to paused, with the operational tasks that surround each.
3. **An internal projects pipeline** for things like building features, onboarding cleaners, vendor onboarding, and the idea board. None of these exist as a first-class concept today.

All three need a coherent task system that follows work wherever it lives, plus a premium UI that matches the chrome already shipped on `/admin/owners` and `/admin/properties`.

This spec defines the data model, the new top-level entities, the pipeline view pattern (Kanban with vivid stage columns, real avatars, AI insight cards), the unified tasks inbox, the detail page evolution, and the migration from the current `/leads` + `/owners` split into a unified `/contacts`.

## Relationship to existing specs

This spec extends and complements [2026-04-16-admin-owners-and-account-system-design.md](2026-04-16-admin-owners-and-account-system-design.md). That spec defined the Owner detail page (6 tabs, smart Overview with onboarding vs operating, 10-section Settings, Stripe invoicing, owner_facts). This spec:

- **Renames the entity** from "Owner" to "Contact" so a Lead and an Owner are the same record at different lifecycle stages.
- **Adds a 7th tab** to the detail page: Tasks.
- **Extends the smart Overview** from 2 states (onboarding, operating) to 4 states (lead, onboarding, operating, dormant).
- **Reuses everything else** from the owner spec (chrome, Settings, invoicing, owner_facts, activity visibility rules, all unchanged).

The two specs together describe one coherent admin system. Where they conflict, this spec wins for the entity-level questions (table name, lifecycle stage, list page); the owner spec wins for everything tab-internal (Settings, Financials, Activity rules, owner_facts, Stripe).

## Scope

### In scope (this spec → next plan)

- New top-level entity: **Contact** (replaces the separate Lead + Owner records, single source of truth)
- New top-level entity: **Project** (internal initiatives, employee/cleaner onboarding, idea board)
- Universal **polymorphic Tasks system** (tasks belong to a Contact, Property, Project, or stand alone)
- Universal **polymorphic Notes / Attachments / Timeline Events** (already existing pattern, extended)
- New **Pipeline view** (Status mode, Kanban) for each entity, with vivid stage columns, real avatar photos, AI insight cards, top metrics bar
- New **Saved Views** per entity (filter + group + sort + columns), exposed as tabs at the top of each pipeline page
- Unified **Tasks inbox** (`/admin/tasks`) redesigned with grouping by due date, parent pills, view switcher
- Updated **detail page** with 7 tabs and smart Overview across 4 lifecycle states
- Migration: `/admin/leads` and `/admin/owners` merge into `/admin/contacts` (filtered views = Leads, Owners)
- Sidebar updated: `Owners` and `Leads` items collapse into one `Contacts` item; `Projects` added

### Out of scope (future)

- AI agent runtime itself (the visual cards are designed; the agents that populate them are a separate spec)
- Calendar redesign (admin Calendar = personal productivity, not property reservations; deferred)
- Block Requests page redesign (stays in Inbox + property detail; cosmetic redesign deferred)
- Project tab interiors past the basic shell (Tasks, Notes, Files inside a Project — design ships, polish later)
- Map view for Properties (designed only in a future spec)
- Cross-entity reporting / dashboards (a future spec)

## Approved design decisions

### Architecture: distinct entities, shared work primitives

Three top-level tables: `contacts`, `properties`, `projects`. Each has its own real shape and its own lifecycle. Four universal "work primitive" tables attach to any of them via `parent_type` + `parent_id`:

- `tasks` — the work
- `notes` — rich text written by humans
- `attachments` — files
- `timeline_events` — auto-generated audit log (already exists per-entity)

Tasks can also be **standalone** (`parent_type = null`), e.g., "Call Mike R. about new referral."

Why distinct entities and not one universal Project record (Hubflo's model): each entity has fundamentally different fields. Property has units, payouts, listings. Lead has source, opportunity. Project has target launch. Forcing them into one container creates field pollution. Distinct tables keep each model honest; polymorphic primitives keep the work view unified.

### Lead/Owner unification: one Contact table

The currently separate `leads` and `owners` (or `profiles` for owners) become a single `contacts` table. A record's stage in the relationship lives on `lifecycle_stage`:

```
lead_new → qualified → in_discussion → contract_sent
       → onboarding → active_owner
       → paused → churned
```

Same Sarah Johnson row goes from Lead to Owner without copying. Properties link to `contact_id`. The "Leads" page becomes a saved view (`lifecycle_stage in ('lead_new','qualified','in_discussion','contract_sent')`); the "Owners" page becomes another saved view (`lifecycle_stage in ('onboarding','active_owner')`). One source of truth.

History is preserved (you can always see when a contact was a lead). A churned owner can be revived without a new record. If we later want stage-change analytics, a `contact_lifecycle_events` log can be layered on top without restructuring `contacts`.

### Property lifecycle stages

```
prospect → onboarding → listing_review → launch_ready → live → paused → offboarded
```

These match what the existing Properties page Status view uses, plus `prospect` (a property a lead is interested in but not signed) and `listing_review` (a discrete step before going live). `properties.status` already exists; this spec confirms the values.

### Project entity and types

Brand new. Used for internal work that does not belong to a Contact or Property.

```sql
projects: id, name, description, project_type, status, owner_user_id,
          target_date, linked_contact_id?, linked_property_id?, archived_at
```

`project_type`:

- `idea` — early exploration
- `feature_build` — building a new feature in Parcel itself
- `employee_onboarding` — onboarding a new team member
- `cleaner_onboarding` — onboarding a new cleaning partner
- `vendor_onboarding` — onboarding any other vendor
- `internal` — generic catch-all

`status`: `not_started`, `in_progress`, `blocked`, `done`, `archived`.

A Project can optionally reference a Contact or Property (e.g., "Cleaner onboarding for 5629 NE 129th" links to that property). The link is optional and informational; it does not change ownership of the work.

### Pipeline = Saved Views

A "Pipeline" in this system is a **Saved View**, not a separate table. A Saved View is a stored combination of `(entity, filter, grouping, sort, columns, view_mode)`. Each entity (Contacts, Properties, Projects) ships with default Saved Views and lets the admin create custom ones.

Default Saved Views:

- **Contacts**: All Contacts · Lead Pipeline · Active Owners · Cold (follow-up) · Churned
- **Properties**: All Properties · Onboarding · Live Homes · Map View · By City
- **Projects**: All Projects · Idea Board · Cleaner Onboarding · Feature Builds

Saved Views render as tabs on the body of the pipeline page (under the top bar, on the light surface). Active tab uses brand-blue underline. Custom views save with `+ New view`.

```sql
saved_views: id, entity_type, name, owner_user_id?, is_shared, sort_order,
             filter_jsonb, grouping, sort, columns_jsonb, view_mode,
             created_at, updated_at
```

`owner_user_id NULL` = global view (visible to all admins). Otherwise it's personal.

### Sidebar (no change to chrome)

The existing [AdminSidebar](apps/web/src/components/admin/AdminSidebar.tsx) stays as-is. Updates to nav items only:

| Today | After |
|---|---|
| Dashboard | Dashboard |
| Inbox | Inbox |
| Tasks | Tasks |
| Owners | **Contacts** (was Owners; absorbs Leads) |
| Properties | Properties |
| Leads | (removed; now a Saved View under Contacts) |
| Help Center | **Projects** (new) |
| | Help Center |

The Calendar, Treasury, and Block Requests stay where they currently live; this spec does not move them. The visual style (252px navy with brand-blue active accent on the left) stays exactly as is.

### View modes per entity (the existing toggle pattern)

Each pipeline page uses the **existing** [HomesViewSwitcher](apps/web/src/app/(admin)/admin/properties/HomesViewSwitcher.tsx) pattern (white pill on glass background, navy active text, brand-blue active icon). Every entity exposes:

- **Status** (Kanban, default for Pipeline-style boards) — see "Pipeline view" below
- **Gallery** (large card grid)
- **Compact** (table, dense)

Properties additionally exposes **Map**.

The toggle lives in the top bar's right cluster, exactly where the Properties page already places it. Saved Views and view modes are independent: pick a Saved View first, then a view mode renders the same data accordingly.

### Pipeline view (Status mode)

The headline new view. Kanban board with one column per stage. Inside the existing chrome (dark navy sidebar + blue gradient top bar + light `#F4F5F7` body).

Body layout, top to bottom:

1. **Top metrics tiles** (5 across). Featured tile uses the brand-blue gradient (`linear-gradient(135deg, #02AAEB, #1B77BE)`); others are white with subtle shadow. Per-entity:
   - **Contacts**: Pipeline value, Active owners, In onboarding, Avg time to close, Win rate
   - **Properties**: Pipeline value, Live revenue, In onboarding, Avg setup time, Avg rating
   - **Projects**: Active projects, Done this month, Avg cycle time, Stuck count, Team load
2. **Saved Views** as tabs (light body, brand-blue underline for active).
3. **Filter pills row** (white pills with `#02AAEB` count badges).
4. **Kanban board** with one column per stage value:
   - **Column header**: a vivid colored block (gradient per stage) with stage name (uppercase, weight 700), count, dollar total or relevant metric, and a sub-line.
   - **Cards** below the header.

#### Card design (Card B++)

The card pattern that emerged from the brainstorm. Same structure across all three entities; only the cover and stat row vary.

Structure (top to bottom inside each card):

1. **Cover** (88px tall):
   - Property: real `cover_photo_url`
   - Contact: gradient `linear-gradient(135deg, #02AAEB, #1B77BE)` with initials avatar centered
   - Project: project-type emoji or icon on a colored background
2. **Status pill** (top-left of cover): one of `Live` (green `#10B981`), `Setting up` (blue `#02AAEB`), `In review` (violet `#8B5CF6`), `Stuck` (red `#EF4444`), `Paused` (gray `#6b7280`).
3. **Stage badge** (top-right of cover): contextual ("Day 5", "100% occ", "Day 12").
4. **Body**: name (navy `#0F3B6B`, weight 700, 13.5px) + sub (gray `#6b7280`, 11.5px).
5. **Mini-stat row** (3 micro-stats with bar fills, separated from name by a top border).
   - Property: Setup % / Tasks open / Est /mo (or, when live: This mo / Nights / Rating)
   - Contact: Last touch / Properties / Open tasks (or Pipeline value when lead)
   - Project: Progress / Open tasks / Days left
6. **AI insight tile** (conditional, when an agent has something to say). Color-coded:
   - Purple = recommendation (`Setup Agent`, `Win-back Agent`)
   - Red = warning (`Risk Agent`)
   - Green = confirmation (`Listing QA`)
7. **Footer row**: stacked avatar photos (real, from `pravatar.cc` style; falls back to initials gradient) + due-date pill (red overdue, amber today, calm blue scheduled, green clear).

Card uses light surface treatment: white background, `#e5e7eb` border, subtle shadow (`0 1px 3px rgba(15,23,42,0.06)`).

#### Stage column gradients

```
Onboarding:      linear-gradient(135deg, #02AAEB 0%, #1B77BE 100%)
Listing Review:  linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)
Live:            linear-gradient(135deg, #10B981 0%, #047857 100%)
Paused:          linear-gradient(135deg, #6b7280 0%, #4b5563 100%)
```

For Contacts pipeline:

```
Lead stages:     linear-gradient(135deg, #02AAEB 0%, #0a7fbb 100%)
Onboarding:      linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)
Active owner:    linear-gradient(135deg, #10B981 0%, #047857 100%)
Paused/churned:  linear-gradient(135deg, #6b7280 0%, #4b5563 100%)
```

For Projects, columns are the project's `status`: `not_started`, `in_progress`, `blocked`, `done`. Same color principles (gray, blue, red, green).

### Detail page (extends owner spec)

Detail page shell from the owner spec stays. **One change**: add **Tasks** as a 7th tab.

Final tab order: `Overview · Tasks · Properties · Financials · Activity · Files · Settings`.

For Property detail: `Overview · Tasks · Bookings · Financials · Activity · Files · Settings`.

For Project detail: `Overview · Tasks · Activity · Files · Settings`.

#### Smart Overview, extended to 4 states

The existing OverviewTab.tsx auto-picks between `OverviewOnboarding` and `OverviewOperating` based on `data.overviewState`. We extend `overviewState` to four values driven by `contact.lifecycle_stage`:

| `lifecycle_stage` value | `overviewState` | Renders |
|---|---|---|
| `lead_new`, `qualified`, `in_discussion`, `contract_sent` | `lead` | new `OverviewLead` |
| `onboarding` | `onboarding` | existing `OverviewOnboarding` |
| `active_owner` | `operating` | existing `OverviewOperating` |
| `paused`, `churned` | `dormant` | new `OverviewDormant` |

**OverviewLead** content:

- Hero: opportunity tile (`$value /mo potential`), source pill, last touch, next follow-up due (highlighted if overdue)
- Potential properties list (the homes this lead might bring)
- Next-action card (top open task)
- Recent activity (3 events)

**OverviewDormant** content:

- Relationship hero: tenure ("Owner Apr 2024 to Mar 2026, 22 months"), pause reason, lifetime payouts
- Win-back hooks: AI-suggested check-in date, last positive interaction
- History snapshot: properties they had, lifetime value

OverviewOnboarding and OverviewOperating render unchanged.

#### Persistent right-rail timeline (recommended addition)

The detail page main column hosts the active tab. The right rail (280px) renders a persistent live timeline preview (the existing Timeline system feed scoped to this contact) with the bottom 30% reserved for at-a-glance metadata (Source, Owner, Created). The Activity tab remains the full searchable log; the right rail is the always-visible peek.

This is a follow-up to the owner spec, which currently uses the same surface for the metadata sidebar. The intent is to upgrade that sidebar to be timeline-led; metadata sinks to the bottom.

### Tasks inbox (`/admin/tasks`)

Same chrome as Pipeline pages.

Body, top to bottom:

1. **View switcher** in the top bar (List / Kanban / Calendar). List is default.
2. **Saved Views** as tabs: My Tasks (default) · Overdue · This Week · Unassigned · By Property · By Assignee · `+ New view`.
3. **Filters row**: search, Assignee, Status, Parent type, `+ Filter`.
4. **List**, grouped by due date with color-coded headers:
   - **OVERDUE** (red)
   - **TODAY** (amber)
   - **THIS WEEK** (neutral)
   - **LATER** (neutral)
   - **NO DATE** (gray)
5. **Each row**: checkbox, title, **parent pill** (color-coded by parent type — blue Contact, green Property, purple Project, gray Standalone, click jumps to parent detail), due date (color-coded urgency), assignee avatar (real photo).
6. **Subtasks expand inline** below their parent. Parent shows "3 / 5 subtasks" pill. Completed subtasks dim and strike through.

Kanban view groups by `tasks.status` columns (Todo, In Progress, Blocked, Done).
Calendar view places tasks on their `due_at` date.

### Visual language

Confirmed: the existing chrome is preserved exactly. New body content (Pipeline pages, Tasks inbox redesign, Project pages) follows these principles:

- **Sidebar**: unchanged (252px navy with brand-blue active accent)
- **Top bar**: unchanged (#0F3B6B → #1B77BE gradient with white view switcher pill)
- **Body surface**: light `#F4F5F7`
- **Cards**: white with `#e5e7eb` border, subtle shadow, navy headings (`#0F3B6B`), brand-blue accents (`#02AAEB`)
- **Pills**: strong saturated colors for status (Live green, Setting up blue, In review violet, Stuck red, Paused gray)
- **AI insights**: tinted backgrounds with named agent badge (purple advice, red warning, green confirmation)
- **Avatars**: real photos with initials-gradient fallback. Stack with 2px white border and -6px overlap.
- **Stage column headers**: vivid colored blocks with white text, count badge, and primary metric (dollar total, count, sub-label)

All colors stay on Parcel brand. No drift toward Monday's purple. Saturation matches the existing OverviewOperating palette already shipped.

### AI insights (visual surface only; agents are future)

The AI insight tile is a first-class card element. The runtime that populates it (which agents exist, how they decide to surface insights, what data sources they use) is out of scope for this spec.

Schema for visual support:

```sql
ai_insights: id, parent_type, parent_id,
             agent_key, severity, title, body, action_label?, action_payload?,
             created_at, dismissed_at?, expires_at?
```

`agent_key` enums (referenced in chrome, not implemented this spec): `setup_agent`, `risk_agent`, `listing_qa`, `winback_agent`, `lead_scoring`, `task_recommender`. Each has a 2-letter badge and a color theme (purple advice, red warning, green confirmation). Cards show at most one insight; insights can be dismissed.

Insights render on cards in Status view, on the detail page right rail, and as quiet alerts in the metrics bar.

## Data model additions

### New tables

```sql
-- Contacts (replaces split between leads + owners; profiles row stays for auth)
create table contacts (
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
  lifecycle_stage   text not null default 'lead_new'
                    check (lifecycle_stage in (
                      'lead_new','qualified','in_discussion','contract_sent',
                      'onboarding','active_owner','paused','churned'
                    )),
  stage_changed_at  timestamptz not null default now(),
  assigned_to       uuid references profiles(id),
  estimated_mrr     numeric(10,2),
  metadata          jsonb default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index contacts_lifecycle_idx on contacts (lifecycle_stage);
create index contacts_assigned_idx on contacts (assigned_to);
create index contacts_email_idx on contacts (lower(email));

-- Projects
create table projects (
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
  linked_contact_id   uuid references contacts(id),
  linked_property_id  uuid references properties(id),
  archived_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Universal tasks (polymorphic)
create table tasks (
  id            uuid primary key default gen_random_uuid(),
  parent_type   text check (parent_type in ('contact','property','project')),
  parent_id     uuid,
  parent_task_id uuid references tasks(id) on delete cascade,
  title         text not null,
  description   text,
  status        text not null default 'todo'
                check (status in ('todo','in_progress','blocked','done')),
  assignee_id   uuid references profiles(id),
  created_by    uuid references profiles(id),
  due_at        timestamptz,
  completed_at  timestamptz,
  metadata      jsonb default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index tasks_parent_idx on tasks (parent_type, parent_id);
create index tasks_assignee_idx on tasks (assignee_id) where status <> 'done';
create index tasks_due_idx on tasks (due_at) where status <> 'done';
create index tasks_subtask_idx on tasks (parent_task_id) where parent_task_id is not null;

-- Universal notes (polymorphic)
create table notes (
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

-- Universal attachments (polymorphic)
create table attachments (
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

-- Saved Views
create table saved_views (
  id              uuid primary key default gen_random_uuid(),
  entity_type     text not null check (entity_type in ('contact','property','project','task')),
  name            text not null,
  owner_user_id   uuid references profiles(id),
  is_shared       boolean not null default false,
  sort_order      integer not null default 0,
  filter_jsonb    jsonb not null default '{}'::jsonb,
  grouping        text,
  sort            text,
  columns_jsonb   jsonb default '[]'::jsonb,
  view_mode       text not null default 'status'
                  check (view_mode in ('status','gallery','compact','map','list','kanban','calendar')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index saved_views_entity_idx on saved_views (entity_type, sort_order);

-- AI insights (visual support; agents are future)
create table ai_insights (
  id            uuid primary key default gen_random_uuid(),
  parent_type   text not null check (parent_type in ('contact','property','project')),
  parent_id     uuid not null,
  agent_key     text not null,
  severity      text not null default 'info'
                check (severity in ('info','recommendation','warning','success')),
  title         text not null,
  body          text not null,
  action_label  text,
  action_payload jsonb,
  dismissed_at  timestamptz,
  expires_at    timestamptz,
  created_at    timestamptz not null default now()
);

create index ai_insights_parent_idx on ai_insights (parent_type, parent_id)
  where dismissed_at is null and (expires_at is null or expires_at > now());
```

### Existing tables: changes

- `properties.contact_id` (uuid, references contacts(id)) — replaces or supplements the current owner linkage. During migration we backfill from existing owner relationships.
- `properties.status` — confirm enum values include `prospect`, `onboarding`, `listing_review`, `launch_ready`, `live`, `paused`, `offboarded`. Add missing values.
- `timeline_events` — add `parent_type` + `parent_id` columns if not already polymorphic, or add `contact_id` and `project_id` columns.
- `block_requests` — no schema changes; routing stays.

### RLS

- Admin role can read/write everything in `contacts`, `projects`, `tasks`, `notes`, `attachments`, `saved_views`, `ai_insights`.
- Owner role (`profiles.role = 'owner'`): can read their own `contacts` row, can read tasks where `parent_type = 'property'` and the property belongs to them, cannot see `projects` at all, cannot see `ai_insights` table.
- Saved Views: a row with `owner_user_id IS NULL AND is_shared = true` is visible to all admins. Personal views are owner-only.

## Route structure

```
/admin
  ├─ /                              Dashboard
  ├─ /inbox                         Messages (existing)
  ├─ /tasks                         Unified tasks inbox (redesigned this spec)
  ├─ /contacts                      Contacts pipeline (NEW; replaces /leads + /owners list)
  │   └─ /[id]                      Contact detail (extends owner spec; 7 tabs)
  │       └─ /settings/[section]    Settings (from owner spec, unchanged)
  ├─ /properties                    Properties pipeline (existing page, redesigned Status view)
  │   └─ /[id]                      Property detail (7 tabs)
  ├─ /projects                      Projects pipeline (NEW)
  │   └─ /[id]                      Project detail (5 tabs)
  ├─ /calendar                      Admin productivity calendar (existing, unchanged)
  ├─ /treasury                      Treasury (existing, unchanged)
  ├─ /payouts                       Payouts (existing)
  ├─ /block-requests                Block requests (existing; surfaces in Inbox)
  └─ /help                          Help Center (existing)
```

`/admin/leads` and `/admin/owners` redirect to `/admin/contacts?view=lead-pipeline` and `/admin/contacts?view=active-owners` respectively.

## Migration from current state

1. Create `contacts` table. Backfill from existing owner records (use `profiles` rows where `role = 'owner'` plus existing leads source if any, mapping each to a `lifecycle_stage`).
2. Add `properties.contact_id` and backfill from current ownership relations.
3. Create `tasks`, `notes`, `attachments`, `saved_views`, `ai_insights` tables.
4. Migrate any existing per-page task data into the new `tasks` table with the appropriate `parent_type` + `parent_id`.
5. Build new `/admin/contacts` page (Pipeline view default, Saved Views = Lead Pipeline / Active Owners / etc.).
6. Build new `/admin/projects` page.
7. Redesign `/admin/tasks` per this spec.
8. Update `/admin/properties` Status view to the new Kanban Pipeline pattern (current Status view becomes one of the Saved Views).
9. Add Tasks tab to existing detail pages; add OverviewLead and OverviewDormant components.
10. Update sidebar nav: rename Owners → Contacts, remove Leads, add Projects.
11. Set up redirects from `/admin/leads` and `/admin/owners` to the appropriate Contacts saved view.
12. Wire AI insight surfaces (visual cards, no agents yet).
13. **Final step**: run the seed script (see "Seed data" section below) so every page has realistic content on first open.

## Seed data (final step of the build)

Ship a development seed script (`apps/web/supabase/seeds/pipeline-dev-seed.sql` or similar) that populates a realistic cross-section of data so every page has something meaningful to render on first load. This runs as the **last step** of the implementation. It is development-only and never runs in production.

What to seed:

- **Contacts** (one per lifecycle stage, eight total):
  - `lead_new`: 1 fresh lead with a source, no activity yet
  - `qualified`: 1 with a proposal sent 3 days ago
  - `in_discussion`: 1 with recent notes and upcoming meeting
  - `contract_sent`: 1 with a signed document pending
  - `onboarding`: 1 actively setting up a property
  - `active_owner`: 2, each with 1 to 2 live properties, varied tenure
  - `paused`: 1 with lifetime history and a win-back date
- **Properties** (one per stage, at least seven):
  - `prospect` (tied to a lead's potential home)
  - `onboarding`, `listing_review`, `launch_ready` (each at different completion %)
  - `live` (2, with booking/rating data on the card)
  - `paused` (1 with historical payout data)
- **Projects** (one per type):
  - 1 `idea`, 1 `feature_build` in progress, 1 `cleaner_onboarding` linked to a property, 1 `employee_onboarding`
- **Tasks** (spread across parents and dates):
  - Some overdue, some due today, some this week, some later, some with no date
  - At least one task with subtasks to verify the expand-inline pattern
  - Tasks attached to each parent type (contact, property, project, standalone) so the Tasks inbox shows every parent-pill color
- **Notes**: 2 to 3 per active owner, one or two per active project
- **AI insights**: at least four seeded rows (one per severity: info, recommendation, warning, success) so Status view cards show the AI treatment without any agent runtime
- **Saved Views**: the defaults from the spec (Lead Pipeline, Active Owners, Onboarding, Live Homes, Idea Board, My Tasks, Overdue, etc.) seeded as global shared views

The script should be idempotent (safe to re-run) and scoped to the seeded admin's test environment. Use fake names with obvious test markers (e.g., "TEST · Sarah Johnson") so a live prod import later cannot be confused with real data.

## Verification

After implementation:

1. **Visual chrome unchanged**: screenshot `/admin/properties` and `/admin/contacts` and `/admin/projects` and verify the sidebar, top bar, view switcher, and clock all render identically to existing pages. Compare against [HomesPageChrome.tsx](apps/web/src/app/(admin)/admin/properties/HomesPageChrome.tsx) and [AdminTopBar.tsx](apps/web/src/components/admin/chrome/AdminTopBar.tsx).
2. **Single source of truth for contacts**: create a Lead at `/admin/contacts`, change `lifecycle_stage` to `active_owner`, confirm the same record appears under "Active Owners" saved view without losing history. Confirm `/admin/leads` redirects.
3. **Polymorphic tasks**: create tasks attached to a Contact, a Property, a Project, and standalone. All four show up in `/admin/tasks` with the correct color-coded parent pill. Click each pill and confirm it jumps to the right detail page.
4. **Saved Views persist**: create a custom Saved View on Properties ("Stuck homes"), refresh, verify it still appears as a tab. Make it shared, verify a second admin sees it.
5. **Smart Overview switches**: change a contact from `qualified` → `onboarding` → `active_owner` → `paused`; verify Overview tab content changes between OverviewLead, OverviewOnboarding, OverviewOperating, and OverviewDormant accordingly.
6. **Status view loads with real data**: Properties Status view shows columns for each stage, populated from existing properties, with cover photos, real owner avatars, mini stat row, and at least one example AI insight card (seeded for verification).
7. **Tasks inbox grouping**: tasks group by Overdue / Today / This Week / Later / No date. Subtasks expand inline. Parent pills route correctly.
8. **No regressions**: existing routes (Owner Settings, Treasury, Inbox) work unchanged. Owner-side `/portal` routes unchanged.
9. **Mobile responsive**: Status view collapses to horizontally scrollable columns on viewports < 1024px; cards remain legible.
