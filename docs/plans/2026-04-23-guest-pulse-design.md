# Guest Pulse — Design Document
_Approved 2026-04-23_

## Overview

Rename "Guest Intelligence" to "Guest Pulse" and overhaul the feature across three surfaces: the admin dashboard, a new dedicated page, and the property detail page. Adds a richer card design, a three-column insight model, two distinct resolution actions (complete vs dismiss), and confirmation gates for destructive dismissals.

---

## Naming

"Guest Intelligence" → **"Guest Pulse"** everywhere user-facing. Internal identifiers (`agent_key` prefix `guest_intelligence:`, cron path `/api/cron/guest-intelligence`) stay unchanged to avoid data migration.

---

## Three Surfaces

### 1. Dashboard (`/admin`)

Compact but rich widget. Renamed "Guest Pulse." Shows top insights across all properties. Three columns side by side. Each column shows a maximum of 4 cards before a "View all" overflow link. Refresh button stays.

### 2. Dedicated Page (`/admin/guest-pulse`)

Full board, all properties. Server-rendered (`force-dynamic`). Sidebar nav item added as "Pulse." Three scrollable columns. Filter bar at top.

**Filters:**
- Property dropdown (single select, "All properties" default)
- Owner dropdown (single select, "All owners" default — filters by all properties belonging to that owner via `property_owners` join)
- Severity filter (All / Critical / Warning / Recommendation / Info)

### 3. Property Detail (`/admin/properties/[id]`)

New "Pulse" tab inside the property detail shell. Same three-column layout, pre-filtered to that property. Server-fetched alongside existing tabs.

---

## Three-Column Model

No changes to the AI prompt or DB bucket values. The three-column split is a display-only decision based on existing data:

| Column | Label | Source |
|---|---|---|
| 1 | **Emergencies** | `bucket = 'house_action'` AND `isCritical = true` |
| 2 | **House Fixes** | `bucket = 'house_action'` AND `isCritical = false` |
| 3 | **Owner Updates** | `bucket = 'owner_update'` |

**Column definitions:**
- **Emergencies** — Safety issues, broken essential appliances, security concerns. Needs immediate action.
- **House Fixes** — Non-urgent physical or operational issues. Guest friction points, maintenance items, recurring requests.
- **Owner Updates** — Patterns, praise, and revenue opportunities worth discussing with the property owner. Pre-digested report material for owner calls.

---

## Data Model Change

One migration:

```sql
ALTER TABLE ai_insights ADD COLUMN completed_at timestamptz;
```

**Active feed filter:** `WHERE dismissed_at IS NULL AND completed_at IS NULL`

### Two resolution actions

**Mark complete** — Sets `completed_at`. Means "we fixed this." Positive action, no confirmation needed. Tracked for future history view.

**Dismiss** — Sets `dismissed_at`. Means "not applicable / ignoring." Requires confirmation (`ConfirmModal variant="danger"`) when severity is `warning` or `isCritical = true`.

---

## Card Design

### Current (insufficient)
Severity badge, source count, title, property name.

### New (rich + compact)
1. Row 1: severity badge + category chip ("Emergency" / "House Fix" / "Owner Update") + source count
2. Title (bold, max 80 chars)
3. Body excerpt — first 110 characters of body text, truncated with ellipsis
4. Property address (e.g., "524 Sycamore Ave, Unit A") — never the Hospitable public name
5. Dismiss X top-right (confirmation gated for warning/critical)

### Property display fix
`fetchGuestIntelligenceInsights` currently receives `{ id, name }` from `propertyCards`. Change to pass `{ id, name: address ?? name }` using `address_line1` from `PropertyHealthCard`. Unit info appended if available.

---

## Detail Panel Changes

Existing side drawer stays. Additions:

- Property address shown in panel header (below title)
- **"Mark complete"** becomes the primary button
- **"Create task"** becomes secondary
- **"Dismiss"** becomes tertiary, with confirmation modal for warning/critical severity

---

## Insight Actions

New server action in `insight-actions.ts`:

```ts
export async function completeInsight(insightId: string): Promise<void>
```

Sets `completed_at = now()` and calls `revalidatePath('/admin')` and `revalidatePath('/admin/guest-pulse')`.

---

## Sidebar Navigation

Add "Pulse" nav item to `AdminSidebar.tsx`. Positioned after "Dashboard," before "Tasks." Icon: `Pulse` from Phosphor Icons (or `Heartbeat` — whichever reads clearest at 16px).

---

## Files to Create

- `apps/web/src/app/(admin)/admin/guest-pulse/page.tsx` — dedicated page
- `apps/web/src/app/(admin)/admin/guest-pulse/GuestPulseBoard.tsx` — three-column board client component
- `apps/web/supabase/migrations/20260423_ai_insights_completed_at.sql` — DB migration

## Files to Modify

- `apps/web/src/app/(admin)/admin/GuestIntelligence.tsx` → `GuestPulse.tsx` (rename + three-column split)
- `apps/web/src/app/(admin)/admin/GuestIntelligence.module.css` → `GuestPulse.module.css`
- `apps/web/src/app/(admin)/admin/InsightDetailPanel.tsx` — mark complete button, address display
- `apps/web/src/app/(admin)/admin/page.tsx` — import rename, pass address
- `apps/web/src/lib/admin/dashboard-data.ts` — pass address in propertyRefs, filter completed
- `apps/web/src/lib/admin/ai-insights.ts` — add completed_at to active filter
- `apps/web/src/lib/admin/insight-actions.ts` — add `completeInsight` action
- `apps/web/src/components/admin/AdminSidebar.tsx` — add Pulse nav item
- `apps/web/src/app/(admin)/admin/properties/[id]/PropertyDetailShell.tsx` — add Pulse tab
- New Pulse tab page inside property detail route
