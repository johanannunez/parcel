# Test Data Toggle — Design

**Date:** 2026-04-21
**Status:** Approved

## Problem

The dev seed script creates test records tagged with UUID prefixes (`0000a000-` contacts, `0000b000-` properties, `0000c000-` projects, `0000d000-` tasks) and `"TEST · "` name prefixes. These records appear throughout the admin alongside real data. There is no way to hide them without deleting them.

## Solution

A per-account boolean preference (`show_test_data`) stored on the admin user's profile row. When off, all admin queries exclude records whose `id` starts with `0000`. When on, a visible amber pill in the top bar signals that test data is active. The toggle lives in Account settings and the top bar pill also acts as a one-click off switch.

## Data Layer

### Migration

```sql
ALTER TABLE profiles
  ADD COLUMN show_test_data boolean NOT NULL DEFAULT false;
```

### Server helper — `src/lib/admin/test-data.ts`

`getShowTestData(): Promise<boolean>` — reads `show_test_data` from the current session user's profile row. Returns `false` if no session.

`toggleShowTestDataAction()` — server action. Flips the boolean for the current user, then calls `revalidatePath('/admin', 'layout')` so every admin page re-fetches.

## Query Filtering

Each call site calls `getShowTestData()` once at the top of the server component or data-fetch function, then passes the boolean to the query. No filter is embedded inside shared helpers — keeps them pure.

Filter applied when `show_test_data = false`:

| Surface | File | Table filtered | Column |
|---|---|---|---|
| Contacts list | `src/lib/admin/contacts-list.ts` | `contacts` | `id` |
| Tasks list | `src/lib/admin/tasks-list.ts` | `tasks` | `id` |
| Properties list | `src/app/(admin)/admin/properties/page.tsx` | `properties` | `id` |
| Projects list | `src/lib/admin/projects-list.ts` | `projects` | `id` |
| Dashboard counts | `src/app/(admin)/admin/page.tsx` | `properties`, `profiles` | `id` |
| Owners list | `src/lib/admin/owners-list.ts` | `profiles` | `id` |
| Map pins | `src/app/(admin)/admin/map/page.tsx` | `contacts`, `properties` | `id` |

Filter syntax: `.not('id', 'like', '0000%')`

## UI

### Account settings — Developer section

A new "Developer" section at the bottom of the admin Account settings page. Contains a single labeled toggle:

- **Label:** Show test data in admin
- **Subtitle:** When on, records created by the dev seed script appear across contacts, tasks, properties, and projects.

Toggling calls `toggleShowTestDataAction()`.

### AdminTopBar indicator

When `show_test_data = true`, an amber pill renders on the right side of the top bar, left of the bell icon:

- **Label:** Test data on
- **Style:** Amber background, small, rounded pill with an X icon
- Clicking it calls `toggleShowTestDataAction()` and turns off immediately
- When `show_test_data = false`, nothing renders — no placeholder, no empty space

## What Is Not In Scope

- Filtering test data from the portal (owners never see seed data)
- Filtering inbox/messages (test owners have no real conversations)
- A "test data" indicator on individual records
- Any changes to how seed data is created
