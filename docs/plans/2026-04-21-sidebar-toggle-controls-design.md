# Sidebar Toggle Controls — Design

**Date:** 2026-04-21
**Status:** Approved

## Problem

The admin sidebar footer has a full-width "Dark mode" button row that only cycles between light and dark, ignoring the existing "system" option in `ThemeProvider`. The test data toggle only lives on `/admin/account` and in the top bar amber pill — there is no quick-access control in the sidebar.

## Solution

Replace the "Dark mode" row and remove the "Help" row. Add a single row containing two compact segmented pill controls side by side: one for theme (3 segments) and one for test data visibility (2 segments).

## Controls

### Theme pill — 3 segments, icon-only

| Segment | Icon | Active color |
|---|---|---|
| Light | `Sun` | Yellow — `#fbbf24` bg `rgba(251,191,36,0.18)` |
| Dark | `Moon` | Blue — `#60a5fa` bg `rgba(96,165,250,0.18)` |
| System | `Monitor` | White — `rgba(255,255,255,1)` bg `rgba(255,255,255,0.15)` |

Active segment is determined by `theme` (not `resolvedTheme`) from `useTheme()`. Clicking a segment calls `setTheme("light" | "dark" | "system")`. `ThemeProvider` already supports all three modes — no changes needed there.

### Test data pill — 2 segments, icon-only

| Segment | Icon | Active color |
|---|---|---|
| On | `Flask` | Green — `#34d399` bg `rgba(52,211,153,0.18)` |
| Off | `Flask` + CSS backslash overlay | Red — `#f87171` bg `rgba(248,113,113,0.18)` |

The "off" segment uses the same `Flask` icon with a `position:absolute` diagonal line overlaid at `rotate(45deg)`, `width:140%`, `height:1px`, `border-radius:1px` to simulate a backslash through the icon.

Active segment is determined by `showTestData` prop. Clicking calls `toggleShowTestDataAction()` via `useTransition`.

## Pill container style (both controls)

```
background: rgba(255,255,255,0.06)
border: 1px solid rgba(255,255,255,0.10)
padding: 3px
border-radius: 999px
```

Segment buttons: `padding: 6px 10px`, `border-radius: 999px`, icon size 15px, inactive color `rgba(255,255,255,0.38)`.

## Data flow

`show_test_data` is already fetched in `layout.tsx` and passed to `AdminTopBarNew`. It is not currently passed to `AdminSidebar`. This change threads it down:

`layout.tsx` → `AdminSidebar` (new prop) → `AdminSidebarFooter` (new prop)

## Files changed

| File | Change |
|---|---|
| `src/components/admin/AdminSidebarFooter.tsx` | Add `showTestData: boolean` prop; remove dark mode row and help row; add two-up pill row; import `toggleShowTestDataAction` |
| `src/components/admin/AdminSidebar.tsx` | Add `showTestData: boolean` prop; pass to `AdminSidebarFooter` |
| `src/app/(admin)/admin/layout.tsx` | Pass `showTestData={profile?.show_test_data ?? false}` to `AdminSidebar` |

## What is not in scope

- `ThemeProvider` — no changes needed
- The amber pill in `AdminTopBar` — stays as-is
- `DeveloperSection` on the account page — stays as-is
- `AdminBottomNav` — not touched
