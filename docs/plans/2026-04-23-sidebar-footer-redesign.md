# Sidebar Footer Redesign

**Date:** 2026-04-23
**File:** `apps/web/src/components/admin/AdminSidebarFooter.tsx`

## Problem

The sidebar footer has two redundant account entry points: a full identity row (avatar + name + email) that already links to `/admin/account`, and a separate "Account" card button directly below it. This creates visual noise and wastes vertical space.

## Solution

Remove the Account card button. Add a `GearSix` icon to the trailing edge of the identity row as a visual affordance — clicking anywhere on the row (avatar, name, email, or gear icon) navigates to `/admin/account`. The Portal button expands to full width in the slot freed by removing Account.

## Before

```
[ Avatar | Name / Email                ]  ← Link to /admin/account
[ Account button  ] [ Portal button    ]  ← two cards
[ Sun | Moon | Monitor ] [ Sign out    ]  ← theme + sign out
```

## After

```
[ Avatar | Name / Email        | Gear  ]  ← Link to /admin/account, gear is visual cue
[ Portal button (full width)           ]  ← one card, full width
[ Sun | Moon | Monitor ] [ Sign out    ]  ← unchanged
```

## Implementation

**File:** `AdminSidebarFooter.tsx`

1. Add `GearSix` icon import (already imported, no change needed).
2. In the identity row `<Link>`, add `<GearSix size={15} weight="regular" />` as a trailing flex child with `color: "rgba(255,255,255,0.35)"` and `flexShrink: 0`.
3. Remove the entire Account `<Link>` card from the two-column row.
4. Remove the `flex gap-1.5` wrapper div since only Portal remains; replace with a single full-width `<Link>` for Portal (drop `flex-1`, remove width constraints).

## Out of Scope

- Mobile bottom nav (`AdminBottomNav.tsx`) — already has the gear icon in the sheet header, no change needed.
- Theme selector and sign out row — unchanged.
- Portal button visual style — same gradient, same height, just full width.
