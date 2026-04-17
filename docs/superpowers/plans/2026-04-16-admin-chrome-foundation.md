# Admin Chrome Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the shared admin chrome (sidebar search + `+ New`, deeper-blue top bar with utility cluster, creation modal with scope chip) as a reusable foundation for every subsequent admin page. Includes a working Task creation end-to-end as proof the modal + scope pattern is production-ready.

**Architecture:** Client components for chrome pieces (sidebar search, create menu, modal, scope picker) wired into the existing `apps/web/src/app/(admin)/admin/layout.tsx`. A shared `CreateScopeContext` lets any admin page declare "this page is about owner X / property Y" so the creation modal can pre-fill a scope chip. Real DB writes for Task; all other item types render a "Coming in the next plan" placeholder so the chrome ships visible and testable without bloating Plan 1.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4 + CSS modules, motion (framer-motion), @phosphor-icons/react, Supabase (client + server helpers already present), Playwright for visual verification (screenshot.mjs already set up).

**Verification style:** Parcel has no unit test harness today. We verify each UI task with `screenshot.mjs` diffs against baselines, per workspace CLAUDE.md. Logic-only modules (`buildCreateContext`, scope picker filter, etc.) get Playwright-driven behavioral tests using the existing `@playwright/test` dependency.

---

## File plan (create / modify)

**New files:**

- `apps/web/src/components/admin/chrome/AdminTopBar.tsx` — desktop top bar (title, subtitle, utility cluster, live clock)
- `apps/web/src/components/admin/chrome/AdminTopBar.module.css`
- `apps/web/src/components/admin/chrome/SidebarSearch.tsx` — search input + dropdown shell
- `apps/web/src/components/admin/chrome/SidebarSearch.module.css`
- `apps/web/src/components/admin/chrome/CreateMenu.tsx` — `+` button + slim dropdown
- `apps/web/src/components/admin/chrome/CreateMenu.module.css`
- `apps/web/src/components/admin/chrome/CreateModal.tsx` — modal shell, keyboard shortcuts, scope chip
- `apps/web/src/components/admin/chrome/CreateModal.module.css`
- `apps/web/src/components/admin/chrome/ScopePicker.tsx` — picker popover with profile/property search
- `apps/web/src/components/admin/chrome/ScopePicker.module.css`
- `apps/web/src/components/admin/chrome/TaskCreationForm.tsx` — first working creation form
- `apps/web/src/components/admin/chrome/CreateScopeContext.tsx` — React context + provider + `useCreateScope()` hook
- `apps/web/src/components/admin/chrome/PageTitle.tsx` — thin client helper pages use to set the top-bar title/subtitle
- `apps/web/src/lib/admin/derive-page-title.ts` — route-based fallback title inference
- `apps/web/src/lib/admin/task-actions.ts` — server actions for creating tasks
- `apps/web/src/lib/admin/scope-search.ts` — server function returning profiles + properties matching a query (used by ScopePicker)
- `apps/web/e2e/admin-chrome.spec.ts` — Playwright spec covering open menu → create task → verify row
- `apps/web/e2e/scope-picker.spec.ts` — Playwright spec covering the scope picker search + selection
- `apps/web/playwright.config.ts` — minimal Playwright config targeting localhost:4000 (if not already present)
- `apps/web/supabase/migrations/<timestamp>_activity_visibility.sql` — activity visibility enum migration

**Modified files:**

- `apps/web/src/app/(admin)/admin/layout.tsx` — mount `AdminTopBar` on desktop, wrap content in `<CreateScopeProvider>`, add `SidebarSearch` + `CreateMenu` to the sidebar region
- `apps/web/src/components/admin/AdminSidebar.tsx` — extend to render the search + `+` row above the nav list

---

## Sequence rationale

1. Migration first (no blocking on UI).
2. Pure-logic helpers and a context provider before UI that consumes them.
3. Layout primitives (top bar, sidebar search shell) before interactive layers (menu, modal).
4. Real creation form last, once the shell exists.
5. Visual verification last, comparing against the approved mockup.

Every task ends with a commit. Commits are small and revertible.

---

## Task 1: Add `activity.visibility` enum migration

**Files:**
- Create: `apps/web/supabase/migrations/<timestamp>_activity_visibility.sql`

The activity table (or whatever the timeline/events table is called in Parcel — likely `activity` or `timeline_events`; confirm by running the inspect step below) needs a `visibility` enum column so the activity feed can filter admin-only events from owner-side queries.

- [ ] **Step 1: Inspect current activity/timeline table schema**

Run:
```bash
cd /Users/johanannunez/workspace/parcel/apps/web
supabase db inspect --linked 2>/dev/null || pnpm supabase:inspect 2>/dev/null || echo "Fallback to SQL query"
```

If those fail, connect via the Supabase SQL editor and run:
```sql
select column_name, data_type
from information_schema.columns
where table_name in ('activity','timeline_events','events','activity_logs')
  and table_schema = 'public';
```

Record the exact table name to use in the migration below. Assume `activity` for the scaffolded migration; replace if needed.

- [ ] **Step 2: Write the migration SQL**

```sql
-- apps/web/supabase/migrations/20260416_activity_visibility.sql
-- Adds visibility enum so owner-side queries can filter admin-only events.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'activity_visibility') then
    create type activity_visibility as enum ('admin_only', 'both');
  end if;
end $$;

alter table activity
  add column if not exists visibility activity_visibility not null default 'both';

create index if not exists activity_owner_visibility_idx
  on activity (owner_id, visibility, created_at desc);

-- RLS policy: owners only see 'both' rows scoped to themselves.
drop policy if exists activity_owner_read on activity;
create policy activity_owner_read on activity
  for select
  using (
    auth.uid() = owner_id
    and visibility = 'both'
  );

-- Admins see everything (existing admin policy is assumed; if not present, add it here).
drop policy if exists activity_admin_read on activity;
create policy activity_admin_read on activity
  for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
```

- [ ] **Step 3: Apply the migration to the linked project**

Run:
```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm supabase db push --linked
```

Expected: "Applied migration 20260416_activity_visibility.sql" or similar success output.

- [ ] **Step 4: Verify column exists**

Run:
```bash
pnpm supabase db diff --linked --schema public 2>&1 | head -20
```

Expected: no pending diffs (migration already applied cleanly).

- [ ] **Step 5: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/supabase/migrations/20260416_activity_visibility.sql
git commit -m "feat(activity): add visibility enum for admin-only event filtering"
```

---

## Task 2: CreateScopeContext provider and hook

**Files:**
- Create: `apps/web/src/components/admin/chrome/CreateScopeContext.tsx`

Pages declare their context ("this is owner X") via a hook; the creation modal reads it to pre-fill the scope chip.

- [ ] **Step 1: Write the context provider**

```tsx
// apps/web/src/components/admin/chrome/CreateScopeContext.tsx
"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type CreateScopeTarget =
  | { kind: "owner"; id: string; displayName: string; initials: string }
  | { kind: "property"; id: string; displayName: string; initials: string }
  | null;

type CreateScopeValue = {
  target: CreateScopeTarget;
  setTarget: (t: CreateScopeTarget) => void;
};

const CreateScopeContext = createContext<CreateScopeValue | null>(null);

export function CreateScopeProvider({
  initialTarget = null,
  children,
}: {
  initialTarget?: CreateScopeTarget;
  children: ReactNode;
}) {
  const [target, setTarget] = useState<CreateScopeTarget>(initialTarget);
  const value = useMemo(() => ({ target, setTarget }), [target]);
  return (
    <CreateScopeContext.Provider value={value}>
      {children}
    </CreateScopeContext.Provider>
  );
}

export function useCreateScope() {
  const ctx = useContext(CreateScopeContext);
  if (!ctx) {
    throw new Error(
      "useCreateScope must be used inside <CreateScopeProvider>. " +
        "Admin layout mounts one at the root.",
    );
  }
  return ctx;
}
```

- [ ] **Step 2: Write a tiny hook-only smoke test**

```tsx
// apps/web/src/components/admin/chrome/CreateScopeContext.test.tsx
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { CreateScopeProvider, useCreateScope } from "./CreateScopeContext";

describe("CreateScopeContext", () => {
  it("throws when used outside provider", () => {
    expect(() => renderHook(() => useCreateScope())).toThrow(
      /CreateScopeProvider/,
    );
  });

  it("sets and returns an owner target", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CreateScopeProvider>{children}</CreateScopeProvider>
    );
    const { result } = renderHook(() => useCreateScope(), { wrapper });
    expect(result.current.target).toBeNull();
    act(() =>
      result.current.setTarget({
        kind: "owner",
        id: "abc",
        displayName: "Alex Hirtle",
        initials: "AH",
      }),
    );
    expect(result.current.target).toEqual({
      kind: "owner",
      id: "abc",
      displayName: "Alex Hirtle",
      initials: "AH",
    });
  });
});
```

Parcel does not currently have Vitest configured. If running the test requires setup, the agent should prefer **skipping unit tests for this plan** and instead rely on Playwright behavioral tests from Task 11 that exercise the real component tree. Commit the logic; annotate `.test.tsx` as `// TODO: enable when vitest is configured`, or delete and re-verify via Playwright in Task 11.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/admin/chrome/CreateScopeContext.tsx
git commit -m "feat(admin/chrome): add CreateScopeContext for contextual creation"
```

---

## Task 3: Route-based page title helper

**Files:**
- Create: `apps/web/src/lib/admin/derive-page-title.ts`
- Create: `apps/web/src/components/admin/chrome/PageTitle.tsx`

The top bar needs to show "Owners", "Properties", or a dynamic owner name. Most pages can let the route decide; detail pages override via `<PageTitle>`.

- [ ] **Step 1: Write the route-based title helper**

```ts
// apps/web/src/lib/admin/derive-page-title.ts

export type PageTitleInfo = {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
};

const STATIC_ROUTES: Array<{ prefix: string; title: string; subtitle?: string }> = [
  { prefix: "/admin/owners", title: "Owners", subtitle: "Search, invite, and manage your property owners." },
  { prefix: "/admin/properties", title: "Properties", subtitle: "Every home under Parcel management." },
  { prefix: "/admin/inbox", title: "Inbox", subtitle: "All owner and guest conversations." },
  { prefix: "/admin/tasks", title: "Tasks", subtitle: "What you owe, what owners owe you." },
  { prefix: "/admin/leads", title: "Leads", subtitle: "Prospective owners and inquiries." },
  { prefix: "/admin/help", title: "Help Center", subtitle: "Articles and onboarding content." },
  { prefix: "/admin/treasury", title: "Treasury", subtitle: "Cash, accounts, and financial health." },
  { prefix: "/admin/calendar", title: "Calendar", subtitle: "Bookings, blocks, and scheduling." },
  { prefix: "/admin/timeline", title: "Timeline", subtitle: "Activity across every owner and property." },
];

export function derivePageTitle(pathname: string): PageTitleInfo {
  if (pathname === "/admin" || pathname === "/admin/") {
    return { title: "Dashboard", subtitle: "Your command center." };
  }
  for (const r of STATIC_ROUTES) {
    if (pathname.startsWith(r.prefix)) {
      return { title: r.title, subtitle: r.subtitle };
    }
  }
  return { title: "" };
}
```

- [ ] **Step 2: Write the PageTitle override component**

```tsx
// apps/web/src/components/admin/chrome/PageTitle.tsx
"use client";

import { useEffect } from "react";
import type { PageTitleInfo } from "@/lib/admin/derive-page-title";

/**
 * Mount this from any admin page to override the top bar's title/subtitle.
 * Uses a simple CustomEvent bridge so the top bar can listen without prop drilling.
 */
export function PageTitle(info: PageTitleInfo) {
  useEffect(() => {
    const detail = info;
    window.dispatchEvent(new CustomEvent("admin:page-title", { detail }));
    return () => {
      window.dispatchEvent(
        new CustomEvent("admin:page-title", { detail: null }),
      );
    };
  }, [info.title, info.subtitle, info.backHref, info.backLabel]);
  return null;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/admin/derive-page-title.ts apps/web/src/components/admin/chrome/PageTitle.tsx
git commit -m "feat(admin/chrome): derive and override page titles from routes"
```

---

## Task 4: AdminTopBar component

**Files:**
- Create: `apps/web/src/components/admin/chrome/AdminTopBar.tsx`
- Create: `apps/web/src/components/admin/chrome/AdminTopBar.module.css`

- [ ] **Step 1: Write the CSS module**

```css
/* apps/web/src/components/admin/chrome/AdminTopBar.module.css */

.root {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 22px 28px;
  display: flex;
  align-items: center;
  gap: 20px;
  color: #fff;
  background:
    radial-gradient(1200px 200px at 0% 0%, rgba(2,170,235,0.25), transparent 60%),
    linear-gradient(135deg, #0F3B6B, #1B77BE);
  border-bottom: 1px solid rgba(0,0,0,0.08);
  overflow: hidden;
}

.root::after {
  content: "";
  position: absolute; inset: 0;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(255,255,255,0.06), transparent 40%),
    radial-gradient(circle at 80% 70%, rgba(255,255,255,0.04), transparent 50%);
  pointer-events: none;
}

.titleWrap { display: flex; flex-direction: column; gap: 2px; z-index: 1; min-width: 0; }
.crumb { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; color: rgba(255,255,255,0.68); margin-bottom: 4px; cursor: pointer; }
.crumb:hover { color: #fff; }
.title { font-size: 22px; font-weight: 600; letter-spacing: -0.01em; color: #fff; }
.sub { font-size: 13px; color: rgba(255,255,255,0.72); }

.right { margin-left: auto; display: flex; align-items: center; gap: 10px; z-index: 1; }

.iconBtn {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.1);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px;
  position: relative;
  cursor: pointer;
}
.iconBtn:hover { background: rgba(255,255,255,0.16); }
.badge {
  position: absolute;
  top: 5px; right: 5px;
  min-width: 14px; height: 14px;
  background: #F97316;
  border-radius: 7px;
  border: 2px solid #1B77BE;
  color: #fff;
  font-size: 9px;
  font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px;
}

.clock {
  display: flex; flex-direction: column; align-items: flex-end;
  line-height: 1.2;
  padding: 0 4px 0 8px;
  border-left: 1px solid rgba(255,255,255,0.12);
  margin-left: 4px;
}
.clockDate { font-size: 12px; color: rgba(255,255,255,0.72); font-weight: 500; }
.clockTime {
  font-size: 13px; color: #fff; font-weight: 600;
  font-variant-numeric: tabular-nums;
  font-family: "JetBrains Mono", ui-monospace, monospace;
  display: flex; align-items: center; gap: 6px;
}
.live {
  width: 7px; height: 7px; border-radius: 50%;
  background: #4ADE80;
  box-shadow: 0 0 0 3px rgba(74,222,128,0.22);
}

@media (max-width: 768px) {
  .root { padding: 14px 16px; }
  .right { gap: 6px; }
  .clock { display: none; }
}
```

- [ ] **Step 2: Write the component**

```tsx
// apps/web/src/components/admin/chrome/AdminTopBar.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Question, Bell } from "@phosphor-icons/react";
import { derivePageTitle, type PageTitleInfo } from "@/lib/admin/derive-page-title";
import styles from "./AdminTopBar.module.css";

type Props = {
  notificationCount?: number;
};

export function AdminTopBar({ notificationCount = 0 }: Props) {
  const pathname = usePathname() ?? "";
  const router = useRouter();

  const fallback = useMemo(() => derivePageTitle(pathname), [pathname]);
  const [override, setOverride] = useState<PageTitleInfo | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<PageTitleInfo | null>).detail ?? null;
      setOverride(detail);
    };
    window.addEventListener("admin:page-title", handler);
    return () => window.removeEventListener("admin:page-title", handler);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const info = override ?? fallback;

  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeLabel = now.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <header className={styles.root}>
      <div className={styles.titleWrap}>
        {info.backHref ? (
          <button
            type="button"
            className={styles.crumb}
            onClick={() => router.push(info.backHref!)}
          >
            ← {info.backLabel ?? "Back"}
          </button>
        ) : null}
        {info.title ? <div className={styles.title}>{info.title}</div> : null}
        {info.subtitle ? <div className={styles.sub}>{info.subtitle}</div> : null}
      </div>

      <div className={styles.right}>
        <button
          type="button"
          className={styles.iconBtn}
          aria-label="Help Center"
          onClick={() => router.push("/admin/help")}
        >
          <Question size={16} weight="duotone" />
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Notifications">
          <Bell size={16} weight="duotone" />
          {notificationCount > 0 ? (
            <span className={styles.badge}>{notificationCount > 9 ? "9+" : notificationCount}</span>
          ) : null}
        </button>
        <div className={styles.clock} aria-live="off">
          <div className={styles.clockDate}>{dateLabel}</div>
          <div className={styles.clockTime}>
            <span className={styles.live} />
            {timeLabel}
          </div>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Start the dev server and visually verify**

Run:
```bash
cd /Users/johanannunez/workspace/parcel
pnpm --filter web dev
```

In another terminal, once the server is running on `http://localhost:4000`:
```bash
node screenshot.mjs http://localhost:4000/admin admin-topbar-unmounted --threshold 0.05
```

Expected: the screenshot succeeds but the top bar is not yet visible (we haven't wired it into the layout yet). The component compiles cleanly. If TypeScript or JSX errors appear in the dev console, fix them before proceeding.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/admin/chrome/AdminTopBar.{tsx,module.css}
git commit -m "feat(admin/chrome): add AdminTopBar with live clock and utility cluster"
```

---

## Task 5: SidebarSearch component (input + empty dropdown shell)

**Files:**
- Create: `apps/web/src/components/admin/chrome/SidebarSearch.tsx`
- Create: `apps/web/src/components/admin/chrome/SidebarSearch.module.css`

This ships the **input and dropdown shell** with an empty-state message. Full filtering of the current list and cross-page Jump-to results come in Plan 2 (Owners list).

- [ ] **Step 1: Write the CSS module**

```css
/* apps/web/src/components/admin/chrome/SidebarSearch.module.css */

.wrap { position: relative; display: flex; gap: 6px; padding: 0 4px 10px; }

.input {
  flex: 1;
  padding: 9px 14px 9px 34px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.1);
  background-color: rgba(255,255,255,0.06);
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='white' stroke-opacity='0.6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='11' cy='11' r='7'/><path d='m21 21-4.3-4.3'/></svg>");
  background-repeat: no-repeat;
  background-position: 12px 50%;
  color: #fff;
  font-size: 12.5px;
  font-family: inherit;
  outline: none;
}
.input::placeholder { color: rgba(255,255,255,0.5); }
.input:focus { border-color: rgba(2,170,235,0.5); background-color: rgba(255,255,255,0.08); }

.dropdown {
  position: absolute;
  top: calc(100% - 2px);
  left: 14px;
  right: 14px;
  min-width: 320px;
  background: #fff;
  border: 1px solid #E6ECF2;
  border-radius: 12px;
  box-shadow: 0 20px 50px -10px rgba(11,27,43,0.28);
  padding: 8px;
  color: #0B1B2B;
  z-index: 40;
  max-height: 420px;
  overflow-y: auto;
}

.empty {
  padding: 20px 14px;
  text-align: center;
  color: #8A9AAB;
  font-size: 12.5px;
}

.sectionHead {
  padding: 6px 10px 4px;
  font-size: 10px;
  color: #8A9AAB;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.footer {
  display: flex;
  justify-content: space-between;
  padding: 10px 10px 4px;
  border-top: 1px solid #E6ECF2;
  margin-top: 4px;
  font-size: 10px;
  color: #8A9AAB;
}
.footer kbd {
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  color: #647689;
  padding: 1px 5px;
  border: 1px solid #E6ECF2;
  border-radius: 3px;
  background: #F6F8FB;
  margin-right: 4px;
}
```

- [ ] **Step 2: Write the component**

```tsx
// apps/web/src/components/admin/chrome/SidebarSearch.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./SidebarSearch.module.css";

export function SidebarSearch() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    if (open) window.addEventListener("mousedown", click);
    return () => window.removeEventListener("mousedown", click);
  }, [open]);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <input
        ref={inputRef}
        className={styles.input}
        placeholder="Search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        aria-label="Search"
      />

      {open ? (
        <div className={styles.dropdown} role="listbox">
          <div className={styles.sectionHead}>Actions</div>
          <div className={styles.empty}>
            {query
              ? `No results yet for "${query}". Filtering ships in the next phase.`
              : "Type to search owners, properties, tasks, files."}
          </div>
          <div className={styles.footer}>
            <span>
              <kbd>↑↓</kbd>Navigate <kbd>↵</kbd>Open
            </span>
            <span>
              <kbd>Esc</kbd>Close
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/admin/chrome/SidebarSearch.{tsx,module.css}
git commit -m "feat(admin/chrome): add SidebarSearch input and dropdown shell"
```

---

## Task 6: CreateMenu component

**Files:**
- Create: `apps/web/src/components/admin/chrome/CreateMenu.tsx`
- Create: `apps/web/src/components/admin/chrome/CreateMenu.module.css`

`+` button next to search with the slim dropdown. Clicking an item dispatches a CustomEvent `admin:create-open` that the (not-yet-built) CreateModal listens for.

- [ ] **Step 1: Write the CSS module**

```css
/* apps/web/src/components/admin/chrome/CreateMenu.module.css */

.wrap { position: relative; flex-shrink: 0; }

.btn {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #02AAEB, #1B77BE);
  color: #fff;
  font-size: 18px;
  font-weight: 500;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  border: 0;
  box-shadow: 0 6px 14px -6px rgba(2,170,235,0.55);
}
.btn:hover { filter: brightness(1.08); }
.btn:focus-visible {
  outline: 2px solid rgba(255,255,255,0.5);
  outline-offset: 2px;
}

.menu {
  position: absolute;
  left: calc(100% + 8px);
  top: 0;
  width: 210px;
  background: #fff;
  border: 1px solid #E6ECF2;
  border-radius: 12px;
  box-shadow: 0 20px 50px -10px rgba(11,27,43,0.28);
  padding: 6px;
  color: #0B1B2B;
  z-index: 40;
}

.item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 13px;
  color: #3C5266;
  cursor: pointer;
  width: 100%;
  background: none;
  border: 0;
  text-align: left;
  font-family: inherit;
}
.item:hover, .item.highlight { background: #F6F8FB; }

.icon {
  width: 22px; height: 22px; border-radius: 6px;
  background: #F6F8FB; color: #647689;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px;
  flex-shrink: 0;
}

.kbd {
  margin-left: auto;
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  color: #8A9AAB;
  padding: 1px 5px;
  border: 1px solid #E6ECF2;
  border-radius: 3px;
}

.divider { height: 1px; background: #E6ECF2; margin: 6px 4px; }
```

- [ ] **Step 2: Write the component**

```tsx
// apps/web/src/components/admin/chrome/CreateMenu.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./CreateMenu.module.css";

export type CreateKind =
  | "task"
  | "email"
  | "meeting"
  | "note"
  | "property"
  | "invoice"
  | "owner"
  | "lead";

const ITEMS: Array<{ kind: CreateKind; label: string; icon: string; kbd: string; contextual: boolean }> = [
  { kind: "task",     label: "Task",     icon: "✓",  kbd: "T", contextual: true  },
  { kind: "email",    label: "Email",    icon: "✉",  kbd: "E", contextual: true  },
  { kind: "meeting",  label: "Meeting",  icon: "🗓",  kbd: "M", contextual: true  },
  { kind: "note",     label: "Note",     icon: "✎",  kbd: "N", contextual: true  },
  { kind: "property", label: "Property", icon: "⌂",  kbd: "P", contextual: true  },
  { kind: "invoice",  label: "Invoice",  icon: "$",  kbd: "I", contextual: true  },
];

const GLOBAL_ITEMS: Array<{ kind: CreateKind; label: string; icon: string; kbd: string }> = [
  { kind: "owner", label: "Owner", icon: "👤", kbd: "O" },
  { kind: "lead",  label: "Lead",  icon: "🔍", kbd: "L" },
];

export function CreateMenu() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    if (open) window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const keyMap: Record<string, CreateKind> = {
      t: "task", e: "email", m: "meeting", n: "note",
      p: "property", i: "invoice", o: "owner", l: "lead",
    };
    const handler = (e: KeyboardEvent) => {
      const k = keyMap[e.key.toLowerCase()];
      if (k) {
        e.preventDefault();
        dispatch(k);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  function dispatch(kind: CreateKind) {
    window.dispatchEvent(new CustomEvent("admin:create-open", { detail: { kind } }));
    setOpen(false);
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.btn}
        aria-label="Create new"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        +
      </button>
      {open ? (
        <div className={styles.menu} role="menu">
          {ITEMS.map((it) => (
            <button
              key={it.kind}
              type="button"
              className={styles.item}
              onClick={() => dispatch(it.kind)}
            >
              <span className={styles.icon}>{it.icon}</span>
              <span>{it.label}</span>
              <span className={styles.kbd}>{it.kbd}</span>
            </button>
          ))}
          <div className={styles.divider} />
          {GLOBAL_ITEMS.map((it) => (
            <button
              key={it.kind}
              type="button"
              className={styles.item}
              onClick={() => dispatch(it.kind)}
            >
              <span className={styles.icon}>{it.icon}</span>
              <span>{it.label}</span>
              <span className={styles.kbd}>{it.kbd}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/admin/chrome/CreateMenu.{tsx,module.css}
git commit -m "feat(admin/chrome): add CreateMenu with keyboard shortcuts"
```

---

## Task 7: Scope search server function

**Files:**
- Create: `apps/web/src/lib/admin/scope-search.ts`

The picker needs to search profiles and properties by query. Server-only function; the picker calls it via a route handler or server action. We use a route handler for simplicity.

- [ ] **Step 1: Write the scope search function**

```ts
// apps/web/src/lib/admin/scope-search.ts
import { createClient } from "@/lib/supabase/server";

export type ScopeResult =
  | { kind: "owner"; id: string; displayName: string; initials: string; sub?: string }
  | { kind: "property"; id: string; displayName: string; initials: string; sub?: string };

/**
 * Returns up to `limit` matches across profiles (role='owner') and properties
 * for use in the CreateModal ScopePicker. Admin-only (RLS + layout guard).
 */
export async function searchScopeTargets(query: string, limit = 10): Promise<ScopeResult[]> {
  const supabase = await createClient();
  const q = query.trim();
  if (!q) return [];

  const [owners, properties] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .eq("role", "owner")
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(limit),
    supabase
      .from("properties")
      .select("id, street, city, state")
      .or(`street.ilike.%${q}%,city.ilike.%${q}%`)
      .limit(limit),
  ]);

  const results: ScopeResult[] = [];

  for (const row of owners.data ?? []) {
    const name = (row.full_name?.trim() || row.email || "Owner") as string;
    results.push({
      kind: "owner",
      id: row.id,
      displayName: name,
      initials: toInitials(name),
      sub: row.email ?? undefined,
    });
  }
  for (const row of properties.data ?? []) {
    const street = row.street ?? "(no street)";
    const city = row.city ?? "";
    const state = row.state ?? "";
    const sub = [city, state].filter(Boolean).join(", ") || undefined;
    results.push({
      kind: "property",
      id: row.id,
      displayName: street,
      initials: toInitials(street),
      sub,
    });
  }
  return results;
}

function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
```

- [ ] **Step 2: Expose via a route handler**

```ts
// apps/web/src/app/api/admin/scope-search/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchScopeTargets } from "@/lib/admin/scope-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const results = await searchScopeTargets(q, 10);
  return NextResponse.json({ results });
}
```

- [ ] **Step 3: Smoke test**

```bash
curl -s "http://localhost:4000/api/admin/scope-search?q=a" -b "<copy admin auth cookie from the browser>"
```

Expected: JSON `{"results":[{"kind":"owner",...}, ...]}`. If you don't want to fuss with cookies, defer this smoke test to Task 11 where Playwright will exercise it end-to-end.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/admin/scope-search.ts apps/web/src/app/api/admin/scope-search/route.ts
git commit -m "feat(admin/chrome): scope search across owners and properties"
```

---

## Task 8: ScopePicker component

**Files:**
- Create: `apps/web/src/components/admin/chrome/ScopePicker.tsx`
- Create: `apps/web/src/components/admin/chrome/ScopePicker.module.css`

- [ ] **Step 1: CSS module**

```css
/* apps/web/src/components/admin/chrome/ScopePicker.module.css */

.popover {
  position: absolute;
  width: 300px;
  background: #fff;
  border: 1px solid #E6ECF2;
  border-radius: 12px;
  box-shadow: 0 20px 50px -10px rgba(11,27,43,0.28);
  padding: 6px;
  z-index: 60;
}
.input {
  width: 100%;
  padding: 7px 10px;
  border: 1px solid #E6ECF2;
  border-radius: 7px;
  font-size: 12.5px;
  color: #3C5266;
  font-family: inherit;
  margin-bottom: 4px;
}
.sectionHead {
  font-size: 9px; letter-spacing: 0.8px;
  color: #8A9AAB;
  padding: 6px 10px 2px;
  text-transform: uppercase; font-weight: 600;
}
.item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12.5px;
  color: #3C5266;
  cursor: pointer;
  border: 0;
  background: none;
  width: 100%;
  text-align: left;
  font-family: inherit;
}
.item:hover { background: #F6F8FB; }
.dot {
  width: 18px; height: 18px;
  border-radius: 50%;
  color: #fff;
  font-size: 9px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #02AAEB, #1B77BE);
  flex-shrink: 0;
}
.sub { margin-left: auto; font-size: 10px; color: #8A9AAB; }
.global { color: #647689; }
.global .dot { background: #F6F8FB; color: #8A9AAB; }
```

- [ ] **Step 2: Component**

```tsx
// apps/web/src/components/admin/chrome/ScopePicker.tsx
"use client";

import { useEffect, useState } from "react";
import type { CreateScopeTarget } from "./CreateScopeContext";
import type { ScopeResult } from "@/lib/admin/scope-search";
import styles from "./ScopePicker.module.css";

type Props = {
  anchorStyle?: React.CSSProperties;
  onPick: (target: CreateScopeTarget) => void;
};

export function ScopePicker({ anchorStyle, onPick }: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ScopeResult[]>([]);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const id = setTimeout(async () => {
      const res = await fetch(
        `/api/admin/scope-search?q=${encodeURIComponent(q)}`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const json = (await res.json()) as { results: ScopeResult[] };
        setResults(json.results);
      }
    }, 120);
    return () => clearTimeout(id);
  }, [q]);

  const owners = results.filter((r) => r.kind === "owner");
  const properties = results.filter((r) => r.kind === "property");

  return (
    <div className={styles.popover} style={anchorStyle} role="dialog" aria-label="Pick scope">
      <input
        autoFocus
        className={styles.input}
        placeholder="Search owners or properties..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {owners.length > 0 ? (
        <>
          <div className={styles.sectionHead}>Owners</div>
          {owners.map((r) => (
            <button
              key={`o-${r.id}`}
              type="button"
              className={styles.item}
              onClick={() => onPick({ kind: "owner", id: r.id, displayName: r.displayName, initials: r.initials })}
            >
              <span className={styles.dot}>{r.initials}</span>
              <span>{r.displayName}</span>
              {r.sub ? <span className={styles.sub}>{r.sub}</span> : null}
            </button>
          ))}
        </>
      ) : null}

      {properties.length > 0 ? (
        <>
          <div className={styles.sectionHead}>Properties</div>
          {properties.map((r) => (
            <button
              key={`p-${r.id}`}
              type="button"
              className={styles.item}
              onClick={() => onPick({ kind: "property", id: r.id, displayName: r.displayName, initials: r.initials })}
            >
              <span className={styles.dot}>{r.initials}</span>
              <span>{r.displayName}</span>
              {r.sub ? <span className={styles.sub}>{r.sub}</span> : null}
            </button>
          ))}
        </>
      ) : null}

      <div className={styles.sectionHead}>Or</div>
      <button
        type="button"
        className={`${styles.item} ${styles.global}`}
        onClick={() => onPick(null)}
      >
        <span className={styles.dot}>∞</span>
        <span>Keep global (no target)</span>
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/admin/chrome/ScopePicker.{tsx,module.css}
git commit -m "feat(admin/chrome): add ScopePicker for contextual target selection"
```

---

## Task 9: Task creation server action + form

**Files:**
- Create: `apps/web/src/lib/admin/task-actions.ts`
- Create: `apps/web/src/components/admin/chrome/TaskCreationForm.tsx`

- [ ] **Step 1: Write the server action**

```ts
// apps/web/src/lib/admin/task-actions.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const CreateTaskInput = z.object({
  title: z.string().trim().min(1).max(280),
  dueAt: z.string().nullish(),
  priority: z.enum(["low", "med", "high"]).default("med"),
  description: z.string().trim().max(4000).nullish(),
  scope: z
    .object({
      kind: z.enum(["owner", "property"]),
      id: z.string().uuid(),
    })
    .nullable(),
});

export type CreateTaskResult = { ok: true; id: string } | { ok: false; error: string };

export async function createAdminTask(raw: unknown): Promise<CreateTaskResult> {
  const parsed = CreateTaskInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const input = parsed.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return { ok: false, error: "Admins only" };

  const ownerId = input.scope?.kind === "owner" ? input.scope.id : null;
  const propertyId = input.scope?.kind === "property" ? input.scope.id : null;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: input.title,
      due_at: input.dueAt ?? null,
      priority: input.priority,
      description: input.description ?? null,
      owner_id: ownerId,
      property_id: propertyId,
      created_by: user.id,
      status: "open",
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/tasks");
  if (ownerId) revalidatePath(`/admin/owners/${ownerId}`);
  return { ok: true, id: data.id };
}
```

**Note on `tasks` schema:** if the existing schema uses different column names (e.g., `assignee_id` instead of `owner_id`), the agent should run this query first to confirm:

```sql
select column_name from information_schema.columns
where table_name = 'tasks' and table_schema = 'public' order by ordinal_position;
```

Adjust the `.insert(...)` object to match real column names before shipping. If the table doesn't exist yet, it's out of scope for this plan — park the Task form as a stub and mark it complete; the Settings/Activity plan will create the tasks table. Document the decision in the commit message.

- [ ] **Step 2: Write the task form**

```tsx
// apps/web/src/components/admin/chrome/TaskCreationForm.tsx
"use client";

import { useState, useTransition } from "react";
import { createAdminTask } from "@/lib/admin/task-actions";
import type { CreateScopeTarget } from "./CreateScopeContext";

type Props = {
  scope: CreateScopeTarget;
  onClose: () => void;
  onCreated: (id: string) => void;
};

export function TaskCreationForm({ scope, onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState<"low" | "med" | "high">("med");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const disabled = title.trim().length === 0 || pending;

  function submit() {
    setError(null);
    start(async () => {
      const res = await createAdminTask({
        title,
        dueAt: dueAt || null,
        priority,
        description: description || null,
        scope: scope ? { kind: scope.kind, id: scope.id } : null,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onCreated(res.id);
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled) submit();
      }}
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      <label style={labelStyle}>
        <span style={labelTextStyle}>Title</span>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
          placeholder="What needs doing?"
          required
        />
      </label>

      <div style={{ display: "flex", gap: 10 }}>
        <label style={{ ...labelStyle, flex: 1 }}>
          <span style={labelTextStyle}>Due</span>
          <input
            type="date"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={{ ...labelStyle, width: 160 }}>
          <span style={labelTextStyle}>Priority</span>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as "low" | "med" | "high")}
            style={inputStyle}
          >
            <option value="low">Low</option>
            <option value="med">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
      </div>

      <label style={labelStyle}>
        <span style={labelTextStyle}>Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional details..."
          style={{ ...inputStyle, minHeight: 72, resize: "vertical" }}
        />
      </label>

      {error ? (
        <div style={{ color: "#B3261E", fontSize: 12 }}>{error}</div>
      ) : null}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" onClick={onClose} style={btnGhost}>Cancel</button>
        <button type="submit" disabled={disabled} style={btnPrimary}>
          {pending ? "Creating..." : "Create task"}
        </button>
      </div>
    </form>
  );
}

const labelStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };
const labelTextStyle: React.CSSProperties = { fontSize: 11, color: "#8A9AAB", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.6 };
const inputStyle: React.CSSProperties = { padding: "9px 12px", border: "1px solid #E6ECF2", borderRadius: 8, fontSize: 13, fontFamily: "inherit", color: "#0B1B2B" };
const btnGhost: React.CSSProperties = { padding: "8px 14px", border: "1px solid #D7DFE8", borderRadius: 8, background: "#fff", color: "#3C5266", fontWeight: 500, fontSize: 13, cursor: "pointer" };
const btnPrimary: React.CSSProperties = { padding: "8px 14px", border: 0, borderRadius: 8, background: "linear-gradient(135deg,#02AAEB,#1B77BE)", color: "#fff", fontWeight: 500, fontSize: 13, cursor: "pointer", opacity: 1, boxShadow: "0 6px 16px -6px rgba(2,170,235,0.55)" };
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/admin/task-actions.ts apps/web/src/components/admin/chrome/TaskCreationForm.tsx
git commit -m "feat(admin/chrome): create tasks via server action with scope linkage"
```

---

## Task 10: CreateModal shell

**Files:**
- Create: `apps/web/src/components/admin/chrome/CreateModal.tsx`
- Create: `apps/web/src/components/admin/chrome/CreateModal.module.css`

- [ ] **Step 1: CSS module**

```css
/* apps/web/src/components/admin/chrome/CreateModal.module.css */

.scrim {
  position: fixed; inset: 0;
  background: rgba(11,27,43,0.34);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 80px;
  z-index: 80;
}
.modal {
  width: 440px;
  max-width: calc(100vw - 32px);
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 30px 80px -20px rgba(11,27,43,0.4);
  overflow: visible;
}
.head {
  padding: 14px 18px;
  border-bottom: 1px solid #E6ECF2;
  display: flex; align-items: center;
}
.title { font-size: 14px; font-weight: 600; color: #0B1B2B; margin: 0; }
.close {
  margin-left: auto;
  width: 26px; height: 26px; border-radius: 7px;
  border: 1px solid #E6ECF2;
  color: #647689;
  background: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px;
  cursor: pointer;
}
.body { padding: 16px 18px; display: flex; flex-direction: column; gap: 14px; position: relative; }

.scopeRow { display: flex; align-items: center; gap: 10px; }
.scopeLabel {
  width: 56px;
  font-size: 11px; color: #8A9AAB; font-weight: 500;
  text-transform: uppercase; letter-spacing: 0.6px;
}
.chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 8px 4px 4px;
  background: rgba(2,170,235,0.08);
  border: 1px solid rgba(2,170,235,0.2);
  border-radius: 999px;
  font-size: 12px;
  color: #1B77BE;
  font-weight: 500;
  cursor: pointer;
  border-style: solid;
  font-family: inherit;
}
.chipAvatar {
  width: 18px; height: 18px; border-radius: 50%;
  background: linear-gradient(135deg,#F59E0B,#B45309);
  color: #fff;
  font-size: 9px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
}
.chipX { opacity: 0.6; font-size: 11px; margin-left: 2px; }
.hint { font-size: 11px; color: #8A9AAB; margin-left: auto; }

.footer {
  padding: 12px 18px;
  border-top: 1px solid #E6ECF2;
  display: flex; align-items: center; gap: 8px;
  background: #FAFCFE;
  font-size: 11px;
  color: #8A9AAB;
}
.footer kbd {
  font-family: "JetBrains Mono", monospace;
  font-size: 10px; color: #647689;
  padding: 1px 5px; border: 1px solid #E6ECF2; border-radius: 3px;
  background: #fff;
  margin-right: 4px;
}

.placeholder {
  padding: 40px 20px;
  text-align: center;
  color: #8A9AAB;
  font-size: 13px;
  line-height: 1.6;
}
```

- [ ] **Step 2: Component**

```tsx
// apps/web/src/components/admin/chrome/CreateModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useCreateScope } from "./CreateScopeContext";
import { ScopePicker } from "./ScopePicker";
import { TaskCreationForm } from "./TaskCreationForm";
import type { CreateKind } from "./CreateMenu";
import styles from "./CreateModal.module.css";

const KIND_TITLES: Record<CreateKind, string> = {
  task: "New task",
  email: "New email",
  meeting: "New meeting",
  note: "New note",
  property: "New property",
  invoice: "New invoice",
  owner: "New owner",
  lead: "New lead",
};

export function CreateModal() {
  const { target, setTarget } = useCreateScope();
  const [kind, setKind] = useState<CreateKind | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const open = (e: Event) => {
      const detail = (e as CustomEvent<{ kind: CreateKind }>).detail;
      setKind(detail?.kind ?? null);
    };
    window.addEventListener("admin:create-open", open);
    return () => window.removeEventListener("admin:create-open", open);
  }, []);

  useEffect(() => {
    if (!kind) return;
    const keys = (e: KeyboardEvent) => {
      if (e.key === "Escape") setKind(null);
    };
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  }, [kind]);

  if (!kind) return null;

  // `owner` and `lead` are globals in the menu — never pre-scoped.
  const effectiveScope = kind === "owner" || kind === "lead" ? null : target;

  return (
    <div
      className={styles.scrim}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) setKind(null);
      }}
    >
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={KIND_TITLES[kind]}>
        <div className={styles.head}>
          <h3 className={styles.title}>{KIND_TITLES[kind]}</h3>
          <button
            type="button"
            className={styles.close}
            aria-label="Close"
            onClick={() => setKind(null)}
          >
            ×
          </button>
        </div>

        <div className={styles.body}>
          {/* Scope chip (hidden for global kinds) */}
          {kind !== "owner" && kind !== "lead" ? (
            <div className={styles.scopeRow}>
              <div className={styles.scopeLabel}>For</div>
              {effectiveScope ? (
                <button
                  type="button"
                  className={styles.chip}
                  onClick={() => setShowPicker(true)}
                >
                  <span className={styles.chipAvatar}>{effectiveScope.initials}</span>
                  <span>{effectiveScope.displayName}</span>
                  <span
                    className={styles.chipX}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTarget(null);
                    }}
                  >
                    ×
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.chip}
                  onClick={() => setShowPicker(true)}
                >
                  <span>+ Add target (optional)</span>
                </button>
              )}
              <span className={styles.hint}>Click chip to change</span>
            </div>
          ) : null}

          {showPicker ? (
            <ScopePicker
              anchorStyle={{ top: 48, left: 74 }}
              onPick={(t) => {
                setTarget(t);
                setShowPicker(false);
              }}
            />
          ) : null}

          {kind === "task" ? (
            <TaskCreationForm
              scope={effectiveScope}
              onClose={() => setKind(null)}
              onCreated={() => setKind(null)}
            />
          ) : (
            <div className={styles.placeholder}>
              <strong style={{ color: "#0B1B2B", display: "block", marginBottom: 6 }}>
                {KIND_TITLES[kind]}
              </strong>
              Coming in the next plan — this chrome is ready; the form for "{kind}" will land with its owning feature.
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <span>
            <kbd>↵</kbd>to save
            <kbd style={{ marginLeft: 6 }}>Esc</kbd>to cancel
          </span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/admin/chrome/CreateModal.{tsx,module.css}
git commit -m "feat(admin/chrome): CreateModal with scope chip + picker + task form"
```

---

## Task 11: Mount chrome in AdminLayout + AdminSidebar

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/layout.tsx`
- Modify: `apps/web/src/components/admin/AdminSidebar.tsx`

- [ ] **Step 1: Extend AdminSidebar to render Search + Create**

Add the following inside `AdminSidebar.tsx`, right after the logo block (line ~147) and before the nav `<nav>` element. Import the new chrome components at the top of the file.

At the imports section, add:

```tsx
import { SidebarSearch } from "@/components/admin/chrome/SidebarSearch";
import { CreateMenu } from "@/components/admin/chrome/CreateMenu";
```

Replace the current "Nav" section opener (around line 149, `/* Nav */`) by inserting a search + create row before the `<nav>` element:

```tsx
{/* Search + Create (global utilities) */}
<div style={{ display: "flex", gap: 6, padding: "0 14px 12px", alignItems: "center" }}>
  <div style={{ flex: 1 }}>
    <SidebarSearch />
  </div>
  <CreateMenu />
</div>

{/* Nav */}
<nav
  style={{
    flex: 1,
    overflowY: "auto",
    padding: "4px 10px 0",
    scrollbarWidth: "none",
  }}
>
```

Note: `SidebarSearch` includes its own padding wrapper. If it double-pads, either remove the outer `padding: "0 14px 12px"` or flatten the inner wrap. Adjust to whichever looks right in the screenshot at Task 12.

- [ ] **Step 2: Update AdminLayout to wire AdminTopBar and CreateScopeProvider**

Replace the current layout body with the new structure. Specifically, modify `apps/web/src/app/(admin)/admin/layout.tsx`:

Add imports:
```tsx
import { AdminTopBar } from "@/components/admin/chrome/AdminTopBar";
import { CreateScopeProvider } from "@/components/admin/chrome/CreateScopeContext";
import { CreateModal } from "@/components/admin/chrome/CreateModal";
```

Replace the current return JSX body with:

```tsx
return (
  <CreateScopeProvider>
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: "var(--color-navy)" }}
    >
      <AdminIconRail pendingBlockCount={pendingBlockCount ?? 0} />
      <AdminSidebar
        userName={fullName}
        userEmail={user.email ?? ""}
        initials={initials}
        avatarUrl={profile?.avatar_url ?? null}
        pendingBlockCount={pendingBlockCount ?? 0}
        signOutSlot={<AdminSignOutButton />}
      />

      <div
        className="flex min-w-0 flex-1 flex-col overflow-hidden"
        style={{ backgroundColor: "var(--color-off-white)", color: "var(--color-text-primary)" }}
      >
        {/* Desktop: full top bar. Mobile: existing compact header remains via AdminTopBar (mobile) below. */}
        <div className="hidden md:block">
          <AdminTopBar notificationCount={pendingBlockCount ?? 0} />
        </div>
        <div className="md:hidden">
          <AdminTopBar notificationCount={pendingBlockCount ?? 0} />
        </div>

        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0">
          <PullToRefresh>{children}</PullToRefresh>
        </main>
      </div>

      <AdminBottomNav
        pendingBlockCount={pendingBlockCount ?? 0}
        signOutSlot={<AdminSignOutButton />}
        userName={fullName}
        userEmail={user.email ?? ""}
        initials={initials}
        avatarUrl={profile?.avatar_url ?? null}
      />

      <CreateModal />
    </div>
  </CreateScopeProvider>
);
```

Remove the now-redundant old `<AdminTopBar />` import and usage from `@/components/admin/AdminSidebar` — the old one was only used for mobile. The new `AdminTopBar` component handles both via its CSS media query (padding shrinks, clock hides).

Note on imports: the OLD `AdminTopBar` is exported from `AdminSidebar.tsx`. Now that we have a new one, **keep the old one for now** (rename import to `AdminMobileTopBar` in the layout if both ship simultaneously) OR remove the old usage entirely. Cleanest: remove the old mobile `AdminTopBar` import from the layout and let the new one handle all viewports. Delete the old export from `AdminSidebar.tsx` only after visual verification passes in Task 12 to avoid breaking anything.

- [ ] **Step 3: Compile-check**

Run:
```bash
cd /Users/johanannunez/workspace/parcel
pnpm --filter web typecheck 2>&1 | tail -20
```

Expected: "no errors" or only pre-existing unrelated errors. Fix any new errors this plan introduced (likely around the missing `AdminTopBar` rename). Do not proceed to Step 4 until clean.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\(admin\)/admin/layout.tsx apps/web/src/components/admin/AdminSidebar.tsx
git commit -m "feat(admin/chrome): mount SidebarSearch, CreateMenu, AdminTopBar, CreateModal"
```

---

## Task 12: Visual verification pass

**Files:**
- Create (or confirm): `apps/web/playwright.config.ts`
- Create: `apps/web/e2e/admin-chrome.spec.ts`

- [ ] **Step 1: Ensure Playwright config exists**

Check if `apps/web/playwright.config.ts` exists. If not, create:

```ts
// apps/web/playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  use: {
    baseURL: "http://localhost:4000",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
});
```

- [ ] **Step 2: Write the behavioral test**

```ts
// apps/web/e2e/admin-chrome.spec.ts
import { test, expect } from "@playwright/test";

// This test assumes the dev server is running at localhost:4000 and an admin
// session cookie is present. The agent should sign in manually once before
// running this, or add a fixture if Supabase test credentials exist.

test.describe("Admin chrome", () => {
  test("sidebar search opens dropdown on focus", async ({ page }) => {
    await page.goto("/admin/owners");
    const search = page.getByPlaceholder("Search");
    await expect(search).toBeVisible();
    await search.focus();
    await expect(page.getByText(/Type to search/i)).toBeVisible();
  });

  test("create menu opens and lists all kinds", async ({ page }) => {
    await page.goto("/admin/owners");
    await page.getByRole("button", { name: "Create new" }).click();
    await expect(page.getByRole("menu")).toBeVisible();
    for (const label of ["Task", "Email", "Meeting", "Note", "Property", "Invoice", "Owner", "Lead"]) {
      await expect(page.getByRole("button", { name: label, exact: true })).toBeVisible();
    }
  });

  test("task modal opens with scope chip and coming-soon placeholders", async ({ page }) => {
    await page.goto("/admin/owners");
    await page.getByRole("button", { name: "Create new" }).click();
    await page.getByRole("button", { name: "Task", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "New task" })).toBeVisible();
    await expect(page.getByPlaceholder("What needs doing?")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "New task" })).not.toBeVisible();
  });

  test("email shows placeholder, not form", async ({ page }) => {
    await page.goto("/admin/owners");
    await page.getByRole("button", { name: "Create new" }).click();
    await page.getByRole("button", { name: "Email", exact: true }).click();
    await expect(page.getByText(/Coming in the next plan/i)).toBeVisible();
  });
});
```

- [ ] **Step 3: Run the e2e tests**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec playwright test e2e/admin-chrome.spec.ts --reporter=list
```

Expected: all four tests pass. If sign-in is required, sign in manually in Chrome first, extract the Supabase auth cookie, and add it to `page.context().addCookies(...)` in a `beforeEach`.

- [ ] **Step 4: Screenshot diff against approved mockup**

Run:
```bash
cd /Users/johanannunez/workspace/parcel
node screenshot.mjs http://localhost:4000/admin/owners admin-owners-chrome --threshold 0.05 --side-by-side
```

Open `./temporary screenshots/snap-*-admin-owners-chrome.png` with the Read tool and compare against `.superpowers/brainstorm/28824-1776378940/content/slim-menu-and-modal.html` (the approved chrome mockup). Key checks:

- Sidebar search with "Search" placeholder, magnifying glass icon on the left
- `+` button immediately to the right of the search, gradient blue, right-aligned in that row
- Top bar has a deeper blue gradient with page title "Owners" and subtitle
- Right of the top bar: `?` Help icon, `🔔` Notifications icon, clock with date + live time
- No duplicate search in the top bar

If anything's off by more than a few pixels, adjust CSS inline and re-screenshot. Don't ship with visible regressions.

- [ ] **Step 5: Commit test + config**

```bash
git add apps/web/e2e/admin-chrome.spec.ts apps/web/playwright.config.ts
git commit -m "test(admin/chrome): playwright coverage for sidebar search, menu, modal"
```

- [ ] **Step 6: Push**

Only push after confirming the screenshots match the approved mockup and Playwright passes clean.

```bash
git push origin main
```

This triggers the Vercel production deploy of the new chrome. Monitor at vercel.com/johanannunez/parcel/deployments for build success.

---

## Self-review checklist

Run through these before marking the plan complete:

- [ ] **Spec coverage** — every Chrome section requirement from the spec is implemented: sidebar search (Task 5), `+ New` slim menu (Task 6), creation modal with scope chip (Task 10), ScopePicker (Task 8), admin deeper-blue top bar with utility cluster (Task 4), live clock (Task 4), activity visibility enum (Task 1). Task creation end-to-end confirms the pattern works (Tasks 7–10).
- [ ] **No placeholders** — every step shows complete code; no "implement later" or "handle edge cases". The only deliberate placeholder is the modal content for non-Task kinds, which is honest scope-deferral and explicit in the UI copy.
- [ ] **Type consistency** — `CreateScopeTarget` shape is defined in Task 2, consumed with same shape in Tasks 8, 9, 10. `CreateKind` defined in Task 6, used in Task 10. `ScopeResult` defined in Task 7, consumed in Task 8.
- [ ] **Out of scope handled gracefully** — Owner Intelligence, Financials deep UI, Settings tab content, owner portal mirror, invoicing, Hospitable, and the full unified-search dropdown content are all explicitly parked for later plans. They are referenced where relevant so future plans can slot in without refactoring this foundation.

---

## Next plans after this ships

Once Plan 1 lands and the chrome is visually verified:

- **Plan 2: Owners list page** — edge-to-edge list, grouping by entity, per-cell copy, columns popover. Wires the real unified-search dropdown (On this page / Jump to / Actions).
- **Plan 3: Owner detail scaffold + Overview tab** — `/admin/owners/[entityId]` route family, identity band, tabs, Overview with both onboarding and operating states.
- **Plan 4: Settings tab + Internal notes + owner portal mirror** — 10-section left nav, Personal info as reference impl, `owner_facts` table + v1 textarea, `/portal/account/[section]` mirror.
- **Plan 5: Stripe invoicing scaffold** — `stripe_customers`, `invoices`, `invoice_items`, `subscriptions`, webhook handlers, `+ New → Invoice` form wiring, Financials tab stub.

Each gets its own plan written via this same skill when you're ready.
