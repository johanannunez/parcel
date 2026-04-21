# Test Data Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-admin-account boolean preference that hides seed/test records (UUID prefix `0000%`) across contacts, tasks, properties, projects, dashboard counts, owners list, and map pins, with a top bar amber pill indicator when test data is visible.

**Architecture:** A `show_test_data` boolean on the `profiles` table is read by a server helper `getShowTestData()`. Each of the 7 admin query call sites calls the helper and conditionally appends `.not('id', 'like', '0000%')`. The admin layout passes the flag to `AdminTopBar` as a prop for the pill. A Developer section on the Account settings page and the top bar pill each call `toggleShowTestDataAction()`.

**Tech Stack:** Next.js 16 App Router, Supabase (server client + service client), TypeScript, Tailwind CSS 4, Phosphor Icons, `revalidatePath`

---

## File Map

| Action | Path |
|---|---|
| Create | `src/lib/admin/test-data.ts` |
| Modify | `src/app/(admin)/admin/layout.tsx` |
| Modify | `src/components/admin/chrome/AdminTopBar.tsx` |
| Create | `src/app/(admin)/admin/account/DeveloperSection.tsx` |
| Modify | `src/app/(admin)/admin/account/page.tsx` |
| Modify | `src/lib/admin/contacts-list.ts` |
| Modify | `src/lib/admin/tasks-list.ts` |
| Modify | `src/lib/admin/projects-list.ts` |
| Modify | `src/lib/admin/owners-list.ts` |
| Modify | `src/app/(admin)/admin/page.tsx` |
| Modify | `src/app/(admin)/admin/properties/page.tsx` |
| Modify | `src/app/(admin)/admin/map/page.tsx` |

---

## Task 1: Supabase migration — add `show_test_data` column

**Files:**
- No file to create — apply via Supabase MCP `apply_migration` tool

- [ ] **Step 1: Apply migration via Supabase MCP**

Use the `mcp__claude_ai_Supabase__apply_migration` tool with project ref `pwoxwpryummqeqsxdgyc`:

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS show_test_data boolean NOT NULL DEFAULT false;
```

Name: `20260421_profiles_show_test_data`

- [ ] **Step 2: Update generated types in `src/types/supabase.ts`**

Find the `profiles` Row type (search for `onboarding_completed_at`) and add the new field:

```ts
show_test_data: boolean
```

Add it to the `Insert` and `Update` types for `profiles` as well:

```ts
// Insert
show_test_data?: boolean | null

// Update  
show_test_data?: boolean | null
```

- [ ] **Step 3: Verify TypeScript still passes**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/types/supabase.ts
git commit -m "feat(db): add show_test_data preference to profiles"
```

---

## Task 2: Server helper and toggle action

**Files:**
- Create: `src/lib/admin/test-data.ts`

- [ ] **Step 1: Create `src/lib/admin/test-data.ts`**

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function getShowTestData(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('profiles')
    .select('show_test_data')
    .eq('id', user.id)
    .single();

  return data?.show_test_data ?? false;
}

export async function toggleShowTestDataAction(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data } = await supabase
    .from('profiles')
    .select('show_test_data')
    .eq('id', user.id)
    .single();

  const next = !(data?.show_test_data ?? false);

  await supabase
    .from('profiles')
    .update({ show_test_data: next })
    .eq('id', user.id);

  revalidatePath('/admin', 'layout');
}
```

- [ ] **Step 2: Verify TypeScript passes**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/admin/test-data.ts
git commit -m "feat(admin): getShowTestData helper and toggleShowTestDataAction"
```

---

## Task 3: Wire `show_test_data` through admin layout to AdminTopBar

**Files:**
- Modify: `src/app/(admin)/admin/layout.tsx`
- Modify: `src/components/admin/chrome/AdminTopBar.tsx`

- [ ] **Step 1: Fetch `show_test_data` in admin layout**

In `src/app/(admin)/admin/layout.tsx`, the layout currently selects:
```ts
.select("role, full_name, avatar_url")
```

Change to:
```ts
.select("role, full_name, avatar_url, show_test_data")
```

Then pass the value to `AdminTopBarNew`:
```tsx
<AdminTopBarNew
  notificationCount={pendingBlockCount ?? 0}
  showTestData={profile?.show_test_data ?? false}
/>
```

- [ ] **Step 2: Add `showTestData` prop and amber pill to `AdminTopBar`**

In `src/components/admin/chrome/AdminTopBar.tsx`:

Change the Props type:
```ts
type Props = {
  notificationCount?: number;
  showTestData?: boolean;
};
```

Update the function signature:
```ts
export function AdminTopBar({ notificationCount = 0, showTestData = false }: Props) {
```

Import `toggleShowTestDataAction` and `useTransition` at the top:
```ts
import { useTransition } from "react";
import { toggleShowTestDataAction } from "@/lib/admin/test-data";
import { X } from "@phosphor-icons/react";
```

Add `useTransition` inside the component body:
```ts
const [pending, startTransition] = useTransition();
```

In the JSX, render the pill inside `<div className={styles.right}>` immediately before the bell button:
```tsx
{showTestData ? (
  <button
    type="button"
    disabled={pending}
    onClick={() => startTransition(() => toggleShowTestDataAction())}
    className={styles.testPill}
    aria-label="Test data is visible — click to hide"
  >
    Test data on
    <X size={11} weight="bold" />
  </button>
) : null}
```

- [ ] **Step 3: Add `testPill` style to `AdminTopBar.module.css`**

Append to `src/components/admin/chrome/AdminTopBar.module.css`:

```css
.testPill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px 3px 10px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.18);
  color: #f59e0b;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.01em;
  border: 1px solid rgba(245, 158, 11, 0.3);
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.testPill:hover {
  background: rgba(245, 158, 11, 0.26);
}

.testPill:disabled {
  opacity: 0.5;
  cursor: default;
}
```

- [ ] **Step 4: Verify TypeScript passes**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/\(admin\)/admin/layout.tsx \
        apps/web/src/components/admin/chrome/AdminTopBar.tsx \
        apps/web/src/components/admin/chrome/AdminTopBar.module.css
git commit -m "feat(admin/topbar): amber test data pill wired to show_test_data preference"
```

---

## Task 4: Developer section on Account settings page

**Files:**
- Create: `src/app/(admin)/admin/account/DeveloperSection.tsx`
- Modify: `src/app/(admin)/admin/account/page.tsx`

- [ ] **Step 1: Create `DeveloperSection.tsx`**

```tsx
'use client';

import { useTransition } from 'react';
import { toggleShowTestDataAction } from '@/lib/admin/test-data';

type Props = { showTestData: boolean };

export function DeveloperSection({ showTestData }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <section>
      <h2
        className="text-base font-semibold"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Developer
      </h2>
      <p
        className="mt-1 text-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Settings for development and testing.
      </p>

      <div
        className="mt-5 flex items-start justify-between gap-4 rounded-xl border p-5"
        style={{ backgroundColor: 'var(--color-white)' }}
      >
        <div className="flex flex-col gap-1">
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Show test data in admin
          </span>
          <span
            className="text-xs"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            When on, records created by the dev seed script appear across
            contacts, tasks, properties, and projects.
          </span>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={showTestData}
          disabled={pending}
          onClick={() => startTransition(() => toggleShowTestDataAction())}
          className="relative mt-0.5 h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50"
          style={{
            backgroundColor: showTestData
              ? '#f59e0b'
              : 'var(--color-warm-gray-200)',
          }}
        >
          <span
            className="pointer-events-none block h-4 w-4 rounded-full shadow-sm transition-transform"
            style={{
              backgroundColor: 'var(--color-white)',
              transform: showTestData ? 'translateX(16px)' : 'translateX(0)',
            }}
          />
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add `DeveloperSection` to account page**

In `src/app/(admin)/admin/account/page.tsx`:

Add import at the top:
```ts
import { DeveloperSection } from './DeveloperSection';
```

The page already fetches `profile` with `.select("*")` so `show_test_data` is available. Add the section after `<RegionSection>` inside the sections column:

```tsx
<DeveloperSection showTestData={profile?.show_test_data ?? false} />
```

- [ ] **Step 3: Verify TypeScript passes**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\(admin\)/admin/account/DeveloperSection.tsx \
        apps/web/src/app/\(admin\)/admin/account/page.tsx
git commit -m "feat(admin/account): Developer section with show test data toggle"
```

---

## Task 5: Filter named query helpers — contacts, tasks, projects, owners

**Files:**
- Modify: `src/lib/admin/contacts-list.ts`
- Modify: `src/lib/admin/tasks-list.ts`
- Modify: `src/lib/admin/projects-list.ts`
- Modify: `src/lib/admin/owners-list.ts`

- [ ] **Step 1: Filter contacts**

In `src/lib/admin/contacts-list.ts`, add import at the top:
```ts
import { getShowTestData } from './test-data';
```

Inside `fetchAdminContactsList`, right after `const supabase = await createClient();`, add:
```ts
const showTestData = await getShowTestData();
```

After `let query = supabase.from('contacts').select(...)`, add:
```ts
if (!showTestData) {
  query = query.not('id', 'like', '0000%');
}
```

- [ ] **Step 2: Filter tasks**

In `src/lib/admin/tasks-list.ts`, add import:
```ts
import { getShowTestData } from './test-data';
```

Inside `fetchAdminTasksList`, right after `const supabase = await createClient();`, add:
```ts
const showTestData = await getShowTestData();
```

Find the main tasks query (`.from('tasks').select(...)`) and after it is built but before it is awaited, add:
```ts
if (!showTestData) {
  tasksQuery = tasksQuery.not('id', 'like', '0000%');
}
```

Check the variable name for the tasks query in the file — find the line that does `const { data: tasksRaw }` or similar and ensure the filter is applied to the same query builder variable before it's awaited.

- [ ] **Step 3: Filter projects**

In `src/lib/admin/projects-list.ts`, add import:
```ts
import { getShowTestData } from './test-data';
```

Inside `fetchAdminProjectsList`, right after `const supabase = await createClient();`, add:
```ts
const showTestData = await getShowTestData();
```

Find the projects query (`.from('projects').select(...)`) and add:
```ts
if (!showTestData) {
  projectsQuery = projectsQuery.not('id', 'like', '0000%');
}
```

- [ ] **Step 4: Filter owners list**

In `src/lib/admin/owners-list.ts`, add import:
```ts
import { getShowTestData } from './test-data';
```

Inside `fetchAdminOwnersList`, right after `const supabase = await createClient();`, add:
```ts
const showTestData = await getShowTestData();
```

The profiles query uses `Promise.all`. Chain the filter on the profiles query:
```ts
supabase
  .from("profiles")
  .select("id, full_name, email, phone, avatar_url, created_at, onboarding_completed_at, entity_id")
  .eq("role", "owner")
  .order("created_at", { ascending: true })
  // add this:
  ...(showTestData ? [] : []),  // placeholder — use conditional below
```

Actually for `Promise.all` you can't chain after the fact. Instead, build the query conditionally before the `Promise.all`:

```ts
const showTestData = await getShowTestData();

const profilesQuery = supabase
  .from("profiles")
  .select("id, full_name, email, phone, avatar_url, created_at, onboarding_completed_at, entity_id")
  .eq("role", "owner")
  .order("created_at", { ascending: true });

const filteredProfilesQuery = showTestData
  ? profilesQuery
  : profilesQuery.not('id', 'like', '0000%');

const [{ data: profiles }, ...] = await Promise.all([
  filteredProfilesQuery,
  // rest unchanged
]);
```

- [ ] **Step 5: Verify TypeScript passes**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/admin/contacts-list.ts \
        apps/web/src/lib/admin/tasks-list.ts \
        apps/web/src/lib/admin/projects-list.ts \
        apps/web/src/lib/admin/owners-list.ts
git commit -m "feat(admin/queries): exclude test data (0000% UUIDs) from contacts, tasks, projects, owners"
```

---

## Task 6: Filter inline page fetches — dashboard, properties, map

**Files:**
- Modify: `src/app/(admin)/admin/page.tsx`
- Modify: `src/app/(admin)/admin/properties/page.tsx`
- Modify: `src/app/(admin)/admin/map/page.tsx`

- [ ] **Step 1: Filter dashboard counts**

In `src/app/(admin)/admin/page.tsx`, add import:
```ts
import { getShowTestData } from '@/lib/admin/test-data';
```

Inside `AdminOverviewPage`, before the `Promise.all`, add:
```ts
const showTestData = await getShowTestData();
```

Apply the filter to the `profiles` (owners count) and `properties` count queries:
```ts
// owners count
const ownersQ = supabase
  .from("profiles")
  .select("*", { count: "exact", head: true })
  .eq("role", "owner");

// properties count
const propsQ = supabase
  .from("properties")
  .select("*", { count: "exact", head: true });

const filteredOwnersQ = showTestData ? ownersQ : ownersQ.not('id', 'like', '0000%');
const filteredPropsQ = showTestData ? propsQ : propsQ.not('id', 'like', '0000%');
```

Replace the existing `supabase.from("profiles")...` and `supabase.from("properties")...` entries in the `Promise.all` with `filteredOwnersQ` and `filteredPropsQ`.

- [ ] **Step 2: Filter properties page**

In `src/app/(admin)/admin/properties/page.tsx`, add import:
```ts
import { getShowTestData } from '@/lib/admin/test-data';
```

Inside the page function, before the properties query, add:
```ts
const showTestData = await getShowTestData();
```

Find the `.from('properties').select(...)` query builder. After it is constructed, conditionally append:
```ts
let propertiesQuery = supabase
  .from('properties')
  .select(/* existing select string */);

if (!showTestData) {
  propertiesQuery = propertiesQuery.not('id', 'like', '0000%');
}

const { data: properties } = await propertiesQuery;
```

- [ ] **Step 3: Filter map page**

In `src/app/(admin)/admin/map/page.tsx`:

The map page uses `createServiceClient()` (bypasses RLS). Import the regular client for the preference check:
```ts
import { createClient } from '@/lib/supabase/server';
import { getShowTestData } from '@/lib/admin/test-data';
```

Inside `AdminMapPage`, before the `Promise.all`, add:
```ts
const showTestData = await getShowTestData();
```

Apply to all three queries. Build them as variables first:
```ts
const mappedContactsQ = supabase
  .from('contacts')
  .select('id, full_name, company_name, avatar_url, lifecycle_stage, home_lat, home_lng')
  .not('home_lat', 'is', null)
  .not('home_lng', 'is', null);

const unmappedContactsQ = supabase
  .from('contacts')
  .select('id, full_name, company_name, avatar_url, lifecycle_stage')
  .is('home_lat', null);

const propertiesQ = supabase
  .from('properties')
  .select(`id, address_line1, city, state, latitude, longitude, contact_id,
           owner_contact:contacts!properties_contact_id_fkey(id, full_name, lifecycle_stage)`)
  .not('latitude', 'is', null)
  .not('longitude', 'is', null)
  .not('contact_id', 'is', null);

const [mappedOwnersResult, unmappedOwnersResult, propertiesResult] = await Promise.all([
  showTestData ? mappedContactsQ : mappedContactsQ.not('id', 'like', '0000%'),
  showTestData ? unmappedContactsQ : unmappedContactsQ.not('id', 'like', '0000%'),
  showTestData ? propertiesQ : propertiesQ.not('id', 'like', '0000%'),
]);
```

- [ ] **Step 4: Verify TypeScript passes**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/\(admin\)/admin/page.tsx \
        apps/web/src/app/\(admin\)/admin/properties/page.tsx \
        apps/web/src/app/\(admin\)/admin/map/page.tsx
git commit -m "feat(admin/pages): exclude test data from dashboard, properties, and map queries"
```

---

## Task 7: End-to-end smoke test

- [ ] **Step 1: Start dev server and navigate to admin account**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web && doppler run -- npx next dev -p 4000
```

Open http://localhost:4000/admin/account and scroll to the Developer section. Confirm the toggle renders.

- [ ] **Step 2: Enable test data and verify pill appears**

Toggle "Show test data in admin" to ON. Confirm:
- Page reloads
- Amber "Test data on" pill appears in the top bar
- Contacts, tasks, and properties pages now show records with "TEST · " names

- [ ] **Step 3: Disable via top bar pill**

Click the amber pill. Confirm:
- Pill disappears
- Test records are gone from contacts, tasks, properties lists

- [ ] **Step 4: Verify dashboard counts change**

With test data OFF, note the Owners and Properties counts on the dashboard. Enable test data and confirm the counts increase.

- [ ] **Step 5: Final commit if any fixups were needed**

```bash
git add -A
git commit -m "fix(admin/test-data): smoke test fixups"
```

Then push:
```bash
git push origin main
```
