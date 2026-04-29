# Unified Filter System Design

**Date:** 2026-04-29
**Status:** Approved
**Scope:** Tasks, Clients, Properties admin pages

---

## Problem

Each admin page has a different filtering approach today:

- **Tasks:** FilterPanel popover + FilterChips already built (Assignee, Priority, Due Date, Status). Missing Parent filter. Works well.
- **Clients:** Full-screen modal with 4 tabs. Hides all filter state. Requires 2+ clicks to change anything. Not consistent with Tasks.
- **Properties:** Owner/property popover (worktree). No occupancy, type, bedroom, or city filters.

Result: three different UI patterns, inconsistent UX, missing filter options on every page.

---

## Design Decision

**One pattern across all pages:** filter button anchored popover + inline chip strip.

- Filter button sits inline with the search bar. Inactive: plain outline. Active: brand-blue tint + count badge.
- Clicking opens a compact popover anchored below the button. No scroll. All sections visible at once.
- Each selected option immediately becomes a removable chip below the search bar.
- Chips show "Label: Value" format. Each has an X. "Clear all" appears when any filter is active.
- Popover closes on outside click.

This is the pattern already implemented on Tasks. Clients and Properties adopt it.

---

## Per-Page Filter Sections

### Tasks (extend existing)

Current `FilterState`: `assignees`, `priorities`, `dueBucket`, `statuses`

Add: `parentTypes: ('contact' | 'property' | 'project' | 'standalone')[]`

Filter sections in popover:
1. **Assignee** — current: avatar list with counts. Keep as-is.
2. **Priority** — P1 Urgent, P2 High, P3 Normal, P4 Low with colored dots. Keep as-is.
3. **Due Date** — Overdue, Today, This Week with live counts. Keep as-is.
4. **Status** — To Do, In Progress, Blocked, Done. Keep as-is.
5. **Parent** *(new)* — Contact, Property, Project, Standalone. Pills, multi-select.

Chip label format: `Assignee: Sarah K.`, `Priority: P1`, `Due: Overdue`, `Status: Blocked`, `Parent: Property`

---

### Clients (replace modal with popover)

Remove: `ContactsFilterModal` (4-tab dialog)
Replace with: inline `FilterPanel` + `FilterChips` matching Tasks pattern

Filter sections in popover:
1. **Lifecycle Stage** — Lead, Qualified, Onboarding, Active Owner. Pills, multi-select.
2. **Source** — dynamic list from `contact_sources` table. Pills, multi-select.
3. **Assignee** — Me, Unassigned, then team members. Pills, multi-select.
4. **Last Activity** — Any time, Last 7 days, Last 30 days, 60+ days ago. Pills, single-select (radio).
5. **Property Count** — Any, 0, 1, 2+. Pills, single-select (radio).

The existing "Filters" button in Clients toolbar wires to the new panel.
The existing source/assignee URL params and server-side filtering logic stays. Only the UI changes.
Saved views (tabs) are unaffected — they are separate from the filter popover.

---

### Properties (build new)

Filter sections in popover:
1. **Owner** — all owner names from current dataset. Pills, multi-select.
2. **Occupancy** — Vacant, Occupied, Checking Out, Checking In. Pills with colored dots, multi-select.
3. **Property Type** — Single Family, Apartment, ADU, Condo. Pills, multi-select.
4. **Bedrooms** — 1, 2, 3, 4+. Pills, multi-select.
5. **City** — derived from property dataset. Pills, multi-select.

Filtering is client-side against the already-loaded `HomesProperty[]` data.

---

## Shared Component Pattern

All three pages follow the same structure:

```
<div style={{ position: 'relative' }}>
  <button ref={filterBtnRef} className={active ? styles.toolbarBtnActive : styles.toolbarBtn}>
    <FunnelSimple size={14} />
    Filter
    {count > 0 && <span className={styles.toolbarBtnBadge}>{count}</span>}
  </button>
  {showPanel && (
    <div ref={panelRef} className={styles.filterPanelWrap}>
      <FilterPanel ... />
    </div>
  )}
</div>
```

FilterChips renders below the search row when any filter is active.

---

## What Does NOT Change

- Saved view tabs on Tasks (Inbox, Today, Upcoming, My Tasks)
- Saved view tabs on Clients (Lead Pipeline, Onboarding, Active Owners, etc.)
- "Group by" button on Tasks
- "Sort" button on Tasks
- Server-side data fetching logic
- ContactsFilterModal source/view management tabs (Sources CRUD, Views config) — these move to a separate settings surface or stay accessible via a gear icon
