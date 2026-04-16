# Admin Owners and Account System — Design Spec

Date: 2026-04-16
Status: Approved design, ready for plan
Repo: parcel (apps/web)

## Why this exists

Two connected problems:

1. The admin **Owners** page is visually dissonant. Four stacked vertical zones (admin nav + owners list + vertical tab rail + content) compete for attention. Owners list and owner detail don't feel like one surface.
2. The owner's **Account** area is a single long scroll with nine loose sections. There's no "full developed settings menu" like what Stripe, Linear, or Notion offer. Admin and portal account surfaces drift instead of sharing structure.

This spec defines a unified admin-first account system: an Owners list page, a full-page Owner detail with six tabs, a Settings sub-system with ten sections, and a mirrored owner-side `/portal/account`. Plus: a shared admin chrome (sidebar search + global `+ New`, deeper-blue top bar with utility cluster), a unified search that scopes to the current page, a context-aware creation flow, Stripe-backed invoicing, Hospitable-fed listing health, and a foundation for future Owner Intelligence (AI-extracted facts per owner).

## Scope

### In scope (this spec → next plan)

- New admin chrome: sidebar (search + `+ New`), simplified top bar, owner identity header, horizontal tabs
- Admin Owners list page (`/admin/owners`) with unified search, sort, column toggle, entity grouping
- Admin Owner detail page (`/admin/owners/[entityId]`) with six tabs: Overview, Properties, Financials, Activity, Files, Settings
- Overview tab with two rendering states (onboarding vs operating) driven by Launchpad completion
- Settings tab with left-nav of ten sections, form pattern, admin-only fields, impersonation banner
- Owner-side mirror at `/portal/account` using the same ten-section IA, minus admin-only cards
- Activity visibility split (admin sees everything; owner sees what affects them)
- Invoicing data model scaffolded for Stripe (one-time and recurring), wired from `+ New → Invoice`
- Internal notes v1 (manual textarea, admin-only), with `owner_facts` data model ready for future AI enrichment

### Out of scope (future phases)

- Polishing the Financials, Files, Activity tab interiors (this spec designs the frame; content lives in separate specs)
- Full Owner Intelligence pipeline (transcription, Claude extraction, review queue UX)
- Hospitable webhook wiring for per-channel listing status (we design the alert surface, not the integration plumbing)
- Actual Stripe subscription dunning and payment UX in portal
- Command palette (⌘K) as a standalone interface — the sidebar search IS the palette; we ship it as-is
- The portal-side `+ New → Request` dropdown variants (parallel spec once admin ships)

## Approved design decisions

Every choice below was made in brainstorming. Do not revisit unless new information contradicts them.

### Layout

- **Full-page Owner detail** (not master+detail split). Clicking an owner navigates to `/admin/owners/[entityId]`. A caret next to the owner's name opens a command-K style switcher for jumping between owners without going back.
- **Six tabs** on the owner detail: Overview, Properties, Financials, Activity, Files, Settings.
- **Ten settings sections**, flat (no group headers): Personal info, Account & security, Business entity, Notifications, Payments & payout, Property defaults, Region & language, App preferences, Data & privacy, Danger zone.

### Chrome

- **Admin sidebar** (fixed left, dark navy `#0F1B2C`) holds: brand mark + ADMIN label, search bar, `+` button for creation, primary nav (Dashboard, Inbox, Tasks, Owners, Properties, Leads, Help Center), user profile pinned to bottom.
- **Search** placeholder copy is simply `"Search"`. The `⌘K` hint is not shown in the input (fades in on focus for power users). Search is the only search on any page.
- **`+ New` menu** is slim (Task, Email, Meeting, Note, Property, Invoice, divider, Owner, Lead). No context chips inline. Scope lives in the creation modal.
- **Creation modal** pre-fills a `For: [Owner] ×` chip when launched from within an owner's page. Clicking the chip opens a picker. A "Keep global (no target)" option clears the scope without hunting for the `×`.
- **Top bar** (admin-blue gradient: `#0F3B6B → #1B77BE`) holds: left = back crumb + page title + subtitle; right = utility cluster (Help, Notifications, clock with date + live seconds).
- Top bar subtitle on detail pages summarizes identity ("Cyprien Holdings · 2 properties · Owner for 14 months"). No secondary page navigation.

### Unified search

- Default scope = current page. On `/admin/owners` typing filters owners in place and shows a dropdown below with:
  - **On this page** — filtered results from the list
  - **Jump to** — matching items elsewhere (Files, Tasks, Messages, Properties, Leads)
  - **Actions** — quick create suggestions ("Invite owner named cas")
- A sub-toolbar **filter context chip** ("Filtered by search: cas ×") mirrors the active filter even after the search loses focus.
- On pages without a filterable list (Dashboard, Owner Overview), typing opens the global-only palette.
- `⌘K` focuses the search and clears any current scope.

### Owners list page (`/admin/owners`)

- Edge-to-edge. No card wrapper around the rows; no rounded border around the list.
- Fluid column widths via `minmax` + `fr`. No horizontal scroll at any viewport.
- **Default columns**: Owner (avatar + name + "Added [month]" sub), Email, Phone, Entity, Properties (count), Status, row menu. Email/Phone/Entity are **per-cell** copy on hover (only the cell you're over reveals its copy button; not a whole-row thing).
- **Columns popover** toggles optional columns: Onboarding progress, Last activity, Co-owners, Added date. Owner column is always on.
- **Sort pills**: `A → Z` (default) and `Group by entity`. Group view uses collapsible entity headers (avatar + name + "X members · Y properties" + Open entity link); solo owners fall into a "No entity" group at the bottom.
- **No pagination.** Continuous vertical scroll. Alphabetical section headers (A, C, D, L...) in `A → Z` mode keep you oriented as the list grows.
- **Status pills**: Active, Invited, Not invited, Setting up.
- **Row interactions**: hover reveals a single overflow menu button on the right (not multiple icons). Clicking anywhere except a button opens the owner detail. The menu: Edit profile, Send message, Copy invite link, Impersonate, Remove.
- Fallback narrowing when viewport < ~1120px: Entity column drops first, then Phone. Everything stays reachable in the detail view.

### Owner detail page (`/admin/owners/[entityId]`)

- **Top bar**: back crumb `← Owners` + owner name as the page title + identity subtitle ("Hirtle Holdings LLC · 2 properties · Owner since Apr 2026"). Right cluster unchanged from rest of admin.
- **Owner identity band** (below top bar, white background): large 64px avatar, name with switcher caret, status pill, email + phone sub, and three right-aligned actions: Impersonate (ghost), Message (secondary), primary contextual action (Invite owner for not-invited, Schedule check-in for active).
- **Horizontal tabs** below the band: Overview · Properties · Financials · Activity · Files · Settings. Active tab uses `#1B77BE` underline.
- **Content area** uses `#F6F8FB` surface background; panels are white with `#E6ECF2` borders and 12–14px radius.

### Overview tab — two states

The Overview renders differently based on Launchpad completion. Threshold: if any property has Launchpad completion < 95%, render the **onboarding state**. Otherwise render the **operating state**. (Threshold is one value stored in config; tune after seeing real data.)

**Both states omit the revenue stat and any Hospitable-derived dollar amounts.** Parcel is not the source of truth for owner financials coming off the channel manager.

**Onboarding state:**

- Launchpad panel (Rocketlane-style, hero):
  - Aggregate headline: percent complete + "X of Y tasks across N properties" + "On track" status pill
  - Segmented progress bar with four colors (completed = green, in progress = amber, stuck = red, not started = gray)
  - Legend with counts
  - Per-property rows: thumb + address + `pct · fraction` + View link, and three phase cards (Documents / Finances / Listings) with mini progress bars and per-phase status ("Stuck · ACH form", "Not started", "In progress")
- Below: `Recent activity` + `Open tasks` as a 1.2fr/1fr grid
- Below that: `Properties` compact list

**Operating state** (post-onboarding):

- **Relationship health** hero card: pill (Healthy / Attention / At risk) + one-sentence summary, then four metrics side-by-side: tenure ("14 mo"), Last contact ("3 days"), Next touchpoint ("May 4"), Avg response time ("4h 12m · Faster than 80% of owners")
- **Alerts row** (conditional, up to 3 shown; empty state renders nothing):
  - Document expirations (W9, ACH auth, STR license, STR permit, insurance, owner ID, credit card — any doc with `expires_at`)
  - Task overdue
  - Message thread aging > 48h
  - No-contact streak > 30 days
  - Pending block requests not acted on
  - Missing critical profile fields (no phone, no payout method)
  - Channel-health alerts (VRBO/Airbnb/Booking/Direct paused or degraded) — **only when Hospitable integration is wired** (deferred to future phase)
- **Launchpad collapsed** to a single status line with a green checkmark: "Onboarding complete · Finished Jun 2025 · 64 of 64 tasks · View history"
- **Activity + Tasks** grid unchanged
- **Properties snapshot** — per-property row with status (Live / Paused), listed date, next booking date, per-property health pill

### Settings tab — 10 sections

Left nav lists the ten sections in fixed order. Each section is a dedicated route:

- `/admin/owners/[entityId]/settings/personal`
- `/admin/owners/[entityId]/settings/account`
- `/admin/owners/[entityId]/settings/entity`
- `/admin/owners/[entityId]/settings/notifications`
- `/admin/owners/[entityId]/settings/payments`
- `/admin/owners/[entityId]/settings/property-defaults`
- `/admin/owners/[entityId]/settings/region`
- `/admin/owners/[entityId]/settings/app`
- `/admin/owners/[entityId]/settings/data`
- `/admin/owners/[entityId]/settings/danger`

Each section renders:

1. **Impersonation banner** at the top ("You are editing Cassandra's settings as an admin. Changes are logged to her activity timeline."), amber. Admin-only; never renders on owner side.
2. **Section title + subtitle** (e.g., "Personal info" / "Name, photo, and how we reach the owner.").
3. **One or more cards** — each card has a body of form rows and a footer.
4. **Card footer** (admin-side only): "Last updated [timestamp] by [person name]" + Cancel / Save actions. Only Save is active once the card is dirty.

Form pattern: **180px label column** on the left (label + 11px hint), field column on the right. Focus ring is brand blue at 10% alpha.

Example: Personal info has one main card (Profile photo, Legal name, Preferred name, Email + Verified pill, Phone, Preferred contact segmented control) and one admin-only card ("Internal notes", ADMIN ONLY badge). Each card has independent Save.

**Side-specific visibility:**

- Admin side renders admin-only cards (Internal notes, payout routing, Stripe customer ID, admin-tagged attributes) on relevant sections.
- Owner side at `/portal/account/[section]` renders the same IA and the same form rows, without admin-only cards. Card footers omit the "Last updated by [person]" line entirely.
- Sensitive sections (Security, Sessions, Danger zone, Data export) are hidden from admin's settings view during impersonation sessions.

### Activity visibility rules

| Event type | Owner sees | Admin sees |
|---|---|---|
| Owner edits their own info | "You updated your phone" | "Cassandra updated phone" |
| Admin edits owner personal info | "Your phone was updated" (no admin name) | "Johanan updated Cassandra's phone" |
| Admin edits admin-only fields (internal notes, tags, owner intelligence, internal attributes) | Hidden | Full detail |
| Property / document / task milestones | Yes | Yes |
| Billing events (invoice paid, tech fee charged) | Yes | Yes |
| Meetings / messages they're part of | Yes | Yes |
| Admin impersonation sessions | Hidden | "Johanan impersonated for 12 min" |
| System events (syncs, migrations) | Hidden | Yes |

Principle: owner sees what affects them or what they did; admin sees everything. Admin name is only attached to events that already involved the owner directly (a message, a meeting, a shared change to their data).

### Invoicing (Stripe)

Scaffold now, polish UI later. Purpose: replace HubFlow for owner billing (onboarding fee + monthly technology fee).

**Tables (Supabase):**

- `stripe_customers` — one per owner, links `profiles.id` → `stripe_customer_id`
- `invoices` — Parcel mirror of Stripe Invoice object; fields include `owner_id`, `property_id?`, `stripe_invoice_id`, `kind` (`onboarding_fee` | `tech_fee` | `adhoc`), `amount_cents`, `currency`, `status` (draft | open | paid | uncollectible | void), `due_at`, `paid_at`, `hosted_invoice_url`
- `invoice_items` — line items for an invoice; `description`, `amount_cents`, `quantity`
- `subscriptions` — Parcel mirror of Stripe Subscription; `owner_id`, `property_id?`, `stripe_subscription_id`, `price_cents`, `interval` (`month` | `year`), `status`, `current_period_end`, `cancel_at_period_end`

**Wiring:**

- `+ New → Invoice` opens the creation modal pre-scoped to the current owner. Fields: kind (one-time or recurring), amount, description, due date, property link (optional).
- Recurring creates a Stripe Subscription; one-time creates a Stripe Invoice.
- Stripe webhooks (`invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`) update the local rows.
- Failed payments feed the Overview Alerts row.
- Financials tab is the canonical view: invoices list with status pills, subscription summary cards, "Invoice owner" button.

Ship data model + Stripe wiring this cycle. Polish Financials tab interior in a later spec.

### Internal notes + Owner Intelligence

**Phase 1 (ships now):**

- Settings → Personal info has an admin-only "Internal notes" card — a textarea with save footer.
- **Storage**: `owner_facts` table, not a plain text column. Every saved note becomes a row with `source_type = 'manual'`, `confidence = 1.0`, `created_by = admin_user_id`, no category.

**Phase 2 (future, not this spec):**

- Same table, now populated by AI extraction from transcripts, emails, messages, documents.
- Fields that are already in the schema but unused in v1: `source_type` (`meeting`, `email`, `message`, `document`, `manual`, `ai_summary`), `source_id` (FK to the originating record), `category` (communication / background / relationships / property_knowledge / business / personal / other), `confidence` (0–1), `pinned`, `suppressed`, `expires_at`.
- UI becomes "Owner intelligence" with hero summary, stats, category tabs, Pending review and Pinned lists, Add context row (paste transcript / upload audio / forward email / type note).
- Capture pipeline is **tool-agnostic**: Parcel accepts transcripts from Granola, Fireflies, Otter, or manual input; audio files transcribed via Whisper or AssemblyAI; email ingested via forwarding address. No hard dependency on any one capture tool. Claude is the extraction layer.

Phase 2 is a separate future spec.

### Table schema — `owner_facts`

```sql
create table owner_facts (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references profiles(id) on delete cascade,
  text            text not null,
  source_type     text not null check (source_type in ('manual','meeting','email','message','document','ai_summary')),
  source_id       uuid,
  category        text check (category in ('communication','background','relationships','property_knowledge','business','personal','other')),
  confidence      numeric(3,2) not null default 1.0,
  pinned          boolean not null default false,
  suppressed      boolean not null default false,
  expires_at      timestamptz,
  created_by      uuid references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index owner_facts_owner_idx on owner_facts (owner_id) where suppressed = false;
create index owner_facts_pending_idx on owner_facts (owner_id) where pinned = false and source_type <> 'manual' and suppressed = false;
```

RLS: only admins (`profiles.role = 'admin'`) can select, insert, update, delete rows in `owner_facts`. Owners never see this table.

### Hospitable integration (confirm scope only)

Hospitable stays as the channel manager. Parcel syncs per-listing per-channel status (Airbnb / VRBO / Booking.com / Direct) so the Overview Alerts row can fire on pauses or degradations.

**What Parcel does NOT pull from Hospitable:** owner-facing dollar amounts (revenue, payouts, net). Those live in Hospitable.

**What Parcel DOES pull** (deferred to future phase; designed here as a surface only):

- Per-channel listing status per property (nightly sync + webhook if supported)
- Upcoming reservations (count for the Overview stat)
- Calendar blocks (for the owner portal calendar)

The Overview Alert template for channel health exists but is gated by a feature flag until the sync is live.

## Data model additions summary

New tables: `owner_facts`, `stripe_customers`, `invoices`, `invoice_items`, `subscriptions`.

New columns on existing tables (reconcile with current schema during plan; add only what's missing):

- `profiles.stripe_customer_id` (text, nullable)
- `profiles.preferred_name` (text, nullable)
- `documents.expires_at` (timestamptz, nullable, indexed)
- `documents.document_type` (enum covering W9, ACH auth, STR license, STR permit, insurance, owner ID, other)

Existing tables that stay but get new RLS or indexes:

- `profiles` — add indexes for name/email search
- `activity` (if not already present; otherwise create) — normalized event log with `actor_id`, `owner_id`, `event_type`, `payload jsonb`, `visibility` enum (`admin_only` | `both`) driving the activity visibility split

## Route structure

```
/admin
  /owners                                list page
  /owners/[entityId]                     redirects to /overview
  /owners/[entityId]/overview
  /owners/[entityId]/properties
  /owners/[entityId]/financials
  /owners/[entityId]/activity
  /owners/[entityId]/files
  /owners/[entityId]/settings            redirects to /settings/personal
  /owners/[entityId]/settings/personal
  /owners/[entityId]/settings/account
  /owners/[entityId]/settings/entity
  /owners/[entityId]/settings/notifications
  /owners/[entityId]/settings/payments
  /owners/[entityId]/settings/property-defaults
  /owners/[entityId]/settings/region
  /owners/[entityId]/settings/app
  /owners/[entityId]/settings/data
  /owners/[entityId]/settings/danger

/portal
  /account                               redirects to /account/personal
  /account/personal
  /account/security
  /account/entity
  /account/notifications
  /account/payments
  /account/property-defaults
  /account/region
  /account/app
  /account/data
  /account/danger
```

Owner side omits admin-only sub-sections from the nav if they have no content; the routes still exist to allow future additions without breaking links.

## Visual language summary

- **Typography**: Poppins (400/500/600/700). Tabular numerics for clocks, counters, percentages, monetary values.
- **Palette**:
  - Brand: `#02AAEB` / `#1B77BE` gradient
  - Admin chrome: deeper gradient `#0F3B6B → #1B77BE`, sidebar background `#0F1B2C`
  - Surfaces: white panels on `#F6F8FB` content background
  - Borders: `#E6ECF2` standard, `#D7DFE8` strong
  - Status: green `#12824A` / `#E7F7EE`, amber `#B45309` / `#FEF3E2`, red `#B3261E` / `#FDECEC`, AI purple `#6D28D9` / `#F3E8FF`
- **Radius**: 8px inputs, 10px buttons and chips, 12px cards, 14px hero cards, 16px shell
- **Shadows**: layered with color-tinted alphas, not flat `shadow-md`. Primary CTA shadow: `0 6px 16px -6px rgba(2,170,235,0.55)`.
- **Motion**: `transform` and `opacity` only. 100–120ms ease on hover, 200ms for modal entrance. Never `transition-all`.

## What ships in the implementation plan

The next step is an implementation plan (via `writing-plans`) that sequences this into landable PRs. Rough shape:

1. **Chrome foundation** — sidebar search + `+ New` pattern, top bar, modal scope pattern. Shared component for every admin page.
2. **Unified search** — scope-aware search with dropdown, per-page list filtering, context chip.
3. **Owners list page** — edge-to-edge list, columns popover, grouping by entity, per-cell copy buttons.
4. **Owner detail chrome** — route scaffold, identity band, tab strip, switcher dropdown.
5. **Overview tab (onboarding state)** — Launchpad rollup, Activity + Tasks grid, Properties compact list.
6. **Overview tab (operating state)** — Relationship health card, Alerts row with document-expiration source, collapsed Launchpad line.
7. **Settings tab — routes + IA** — ten routed sub-pages, left nav, shared form shell.
8. **Settings — Personal info section** — forms, avatar upload, validation, per-card save. Reference implementation for the other nine sections.
9. **Internal notes v1** — `owner_facts` table, admin-only card on Personal info, simple textarea → `source_type: manual` row.
10. **Activity visibility wiring** — `activity.visibility` enum, RLS enforcement, feed filtering on portal side.
11. **Invoicing scaffold** — Stripe customers/invoices/subscriptions tables, `+ New → Invoice` modal, webhook handlers. Financials tab shows the list (no deep UX yet).
12. **Owner portal account mirror** — `/portal/account/[section]` routes render the same sections with admin-only cards stripped and admin-only footers hidden.

Phases 13+ (Owner Intelligence v2, Hospitable channel sync, Financials polish, Files tab, Activity tab deep UX, Property defaults section) are future specs.

## Open items deliberately parked

- **Portal-side `+ Request`** dropdown variants (Report maintenance, Block dates, Ask a question) — parallel spec once admin ships.
- **Meeting capture pipeline** — build after admin core is stable, choose primary capture tool based on actual usage patterns (Granola is the default pick).
- **Channel health wiring** — needs Hospitable webhook configuration and a sync job; UI is designed, implementation is a separate spec.
- **Stripe Billing UX for owner portal** (paying the tech fee) — separate spec.
- **Command palette `⌘K`** as a dedicated interface — rolled into sidebar search; revisit only if search feels limited at scale.
