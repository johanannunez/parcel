# Owners List Page — Implementation Plan (Plan 2)

**Goal:** Replace the current master-detail `/admin/owners` with a full-width, edge-to-edge list page. Entity grouping, per-cell copy on hover, columns popover, sort pills, no pagination. Click a row → goes to the existing `/admin/owners/[entityId]` detail (rebuilt in Plan 3).

**Architecture:** Server component fetches per-owner rows; client component renders the table with interactive sort/filter/columns. The existing `OwnerListPanel` master list stays but moves from the parent `/admin/owners/layout.tsx` into `[entityId]/layout.tsx`, so detail pages retain their navigation until Plan 3 lands.

## Files

**Modify:**
- `apps/web/src/app/(admin)/admin/owners/layout.tsx` — simplify to pass-through
- `apps/web/src/app/(admin)/admin/owners/page.tsx` — replace placeholder with server component that fetches owners and renders `<OwnersListView />`
- `apps/web/src/app/(admin)/admin/owners/[entityId]/layout.tsx` — move `OwnerListPanel` wrapping here so existing detail pages keep their sidebar

**Create:**
- `apps/web/src/lib/admin/owners-list.ts` — `fetchAdminOwnersList()` returns rows with id, name, email, phone, entity, property count, status
- `apps/web/src/app/(admin)/admin/owners/OwnersListView.tsx` — the full client component (table, sort, filter, columns popover, per-cell copy, group-by-entity mode, alphabetical section headers)
- `apps/web/src/app/(admin)/admin/owners/ColumnsPopover.tsx` — toggleable columns
- `apps/web/src/app/(admin)/admin/owners/OwnersListView.module.css` — table styles

## Data shape

```ts
type OwnerRow = {
  id: string;                    // profiles.id
  fullName: string;              // "Alex Hirtle" or email fallback
  email: string;
  phone: string | null;
  entityId: string | null;
  entityName: string | null;     // "Hirtle Holdings LLC"
  propertyCount: number;         // across direct + co-owned
  status: "active" | "invited" | "not_invited" | "setting_up";
  addedAt: string;               // ISO
  // Optional fields (populated when a column is toggled on):
  onboardingPct?: number;
  lastActivityAt?: string | null;
  coOwnerCount?: number;
};
```

Status derivation:
- `active` = `onboarding_completed_at` set AND at least one active property
- `setting_up` = at least one property in onboarding (launchpad < 95%)
- `invited` = no properties yet, has signed up (has `last_sign_in_at`)
- `not_invited` = email ends with `@pending.theparcelco.com` OR no signup yet

## Columns

Default on: Owner (avatar + name + "Added [month]"), Email (copy-on-cell-hover), Phone (copy-on-cell-hover), Entity (copy-on-cell-hover), Properties (count), Status.

Toggleable optional: Onboarding progress, Last activity, Co-owners, Added date.

## Sort pills

- `A → Z` (default): flat alphabetical list with section headers (A, C, D, L, ...)
- `Group by entity`: collapsible entity headers; owners beneath their entity; "No entity" group at bottom for solo owners

## Status filter chip

Single-select: All / Active / Invited / Not invited / Setting up. Filter chip in the toolbar.

## Integration with unified search

The existing `SidebarSearch` already dispatches `window.event("admin:search-query", { q })` when typing... actually it doesn't yet. Defer filtering via the sidebar search to Plan 3 integration; for now, add a small in-page search input at the top of the list as a bridge. The full integration of sidebar search into list filtering is Plan 3.

## Commit cadence

One subagent, one pass, 4-6 commits grouped by file:
1. Layout shuffle (parent layout → pass-through, detail layout → wraps OwnerListPanel)
2. Data fetcher
3. OwnersListView + module.css
4. ColumnsPopover
5. Page wiring
6. Verify (typecheck + build + screenshot)
