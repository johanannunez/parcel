# Sidebar Footer Redesign

**Date:** 2026-04-09
**Status:** Approved
**Scope:** Portal sidebar bottom section only

## Summary

Replace the current boxed user card + scattered "Account" section in the portal sidebar with a compact, flat footer inspired by FurnishPro's `SidebarFooter` pattern. Adapted for Parcel's warm palette and brand.

## What Changes

### Removed
- The "Account" section header from the main nav area
- The "Help center" nav link from the main nav area
- The boxed user card (rounded border, background, sign out button inside card)
- The `OwnerLocalTime` component from the footer (low value, adds clutter)

### Added: Flat Footer
A new footer section at the bottom of the sidebar, separated from the nav by a thin `warm-gray-200` border. Contains:

1. **Identity row** — avatar initials circle (34px, `warm-gray-100` background) + user name (13.5px, semibold) + email (11.5px, `text-tertiary`). No card, no border, just flush with the action rows.

2. **Action rows** — five compact rows sharing identical styling (icon 15px + label 13px, `text-tertiary` color, 8px border-radius, subtle hover background):
   - **Light/Dark mode toggle** — Sun icon + "Light mode" (or Moon + "Dark mode" when dark theme is active). Clicking shows a "Coming soon" toast. Actual dark mode is a separate future project.
   - **Help** — links to `/help` (same destination as current "Help center")
   - **Account** — links to `/portal/account` (page to be built in a future project)
   - **Switch to Admin** — conditional, only shown when `isAdmin` is true. Links to `/admin`.
   - **Sign out** — triggers sign out action. On hover, shifts to a subtle red tint (`rgba(230,100,80,0.10)` background, `#F0836E` text), matching FurnishPro's pattern.

### Row Styling
All action rows share:
- `display: flex; align-items: center; gap: 10px`
- `padding: 7px 12px 7px 17px` (left indent aligns icons with the identity avatar's center)
- `border-radius: 8px`
- `font-size: 13px; font-weight: 500`
- `color: var(--color-text-tertiary)`
- Hover: `background: var(--color-warm-gray-50); color: var(--color-text-secondary)` (except sign out which gets the red treatment)
- `transition: background 0.12s, color 0.12s`

## Icons
All from `@phosphor-icons/react`, weight `regular`, size 15:
- Toggle: `Sun` / `Moon`
- Help: `Question`
- Account: `GearSix`
- Switch to Admin: `ShieldCheck` (reuse existing)
- Sign out: `Power`

## Component Changes

### `PortalSidebar.tsx`
- Remove the "Account" section header + "Help center" `<ul>` from the `<nav>` area (lines 168-191)
- Remove the "Switch to Admin" block (lines 193-209)
- Remove the boxed user card (lines 211-246)
- Add a new `<SidebarFooter>` component in their place

### New: `SidebarFooter.tsx` (client component)
Located at `src/components/portal/SidebarFooter.tsx`. Receives props:
- `userName: string`
- `userEmail: string`
- `initials: string`
- `isAdmin: boolean`
- `signOutSlot: ReactNode`

The dark mode toggle uses local state for now (no theme provider). Clicking it shows a toast via a simple state-based notification. The `signOutSlot` prop keeps the existing server action pattern for sign out.

### Removed from props
- `timezone` prop removed from `PortalSidebar` (no longer rendering `OwnerLocalTime`)

### Files to check for `OwnerLocalTime` / `timezone` cleanup
- `PortalSidebar.tsx` — remove `timezone` prop and import
- `portal/layout.tsx` — stop passing `timezone` to the sidebar
- `OwnerLocalTime.tsx` — can be deleted if no other consumers exist

## Out of Scope
- Dark mode implementation (separate project: define dark palette tokens, theme provider, persist preference, test all pages)
- `/portal/account` page (separate project)
- Mobile sidebar / `PortalTopBar` changes (not affected by this redesign)

## Toast for "Coming Soon"
Simple inline approach: a small floating message that appears for 2 seconds near the toggle row. No external toast library needed. Use a `useState` + `setTimeout` pattern within `SidebarFooter`.
