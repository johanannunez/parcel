# Sidebar Footer v2 Design

**Date:** 2026-04-24
**File:** `apps/web/src/components/admin/AdminSidebarFooter.tsx`

## Problem

The current footer stacks too many card-style buttons (Portal, Help & Support) beneath the identity row, creating visual weight and clutter. The theme dropdown and sign out button sit in a separate row with different treatment. The result feels inconsistent and heavy.

## Solution

Replace everything below the identity row with a flat, left-aligned list of rows — the same pattern used by Notion, Linear, and Slack. Each item is icon + label, full-width, with a subtle hover highlight. No card borders, no background fills on the items themselves.

## Layout (After)

```
[ Avatar | Name / Email          | Gear ]  ← Link to /admin/account (unchanged)
─────────────────────────────────────────  ← border-t separator (unchanged)
  WORKSPACE                                ← tiny muted caps section label
  ↗ Switch to Portal                       ← blue text, UserSwitch duotone icon
─────────────────────────────────────────  ← micro divider
  ? Help & Support                         ← muted, dispatches admin:help-support
  ☀ Light mode              ›             ← shows active theme, caret opens submenu
  ⏻ Sign out                              ← red text, Power icon
```

## Item Behaviors

**Switch to Portal:** Link to `portalHref` (same smart-routing logic as before). Blue color (`rgba(96,185,235,0.9)`), UserSwitch duotone icon.

**Help & Support:** Button that dispatches `window.dispatchEvent(new CustomEvent("admin:help-support"))`. Muted color, Question icon.

**Theme row:** Label reflects active theme ("Light mode" / "Dark mode" / "System"). Clicking opens a small popover positioned above-right with Light/Dark/System options and a checkmark on the active one (same ThemeDropdown logic, restyled trigger). Caret-right icon on the trailing edge.

**Sign out:** Red text (`rgba(239,68,68,0.75)`), Power icon. Calls `signOut()` via `useTransition`. Shows "Signing out…" while pending.

## Section Label

`WORKSPACE` in 9.5px uppercase, `rgba(255,255,255,0.22)`, `letter-spacing: 0.07em`. Sits above the Portal row. No label needed above Help/Theme/Sign out — the divider provides enough grouping.

## Hover States

Each row: `background: rgba(255,255,255,0.04)`, `color` brightens slightly. Sign out row hover: `color: rgba(239,68,68,0.9)`.

## Out of Scope

- Mobile bottom nav (`AdminBottomNav.tsx`) — unchanged.
- Identity row — unchanged.
- Portal smart-routing logic — unchanged.
- `admin:help-support` event dispatch — unchanged.
