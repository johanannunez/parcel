# Sidebar Toggle Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "Dark mode" button row and remove the "Help" row in the admin sidebar footer with two compact segmented pill controls side by side — one for theme (Light/Dark/System) and one for test data visibility (On/Off).

**Architecture:** Three files change: `AdminSidebarFooter.tsx` gets the new pill UI and `showTestData` prop; `AdminSidebar.tsx` gains the same prop and passes it through; `layout.tsx` passes `show_test_data` from the profile to `AdminSidebar`. `ThemeProvider` already supports all three theme modes via `setTheme()` — no changes needed there.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS 4, Phosphor Icons (`@phosphor-icons/react`), `useTheme()` hook from `ThemeProvider`, `toggleShowTestDataAction` server action from `src/lib/admin/test-data.ts`

---

## File Map

- **Modify:** `apps/web/src/components/admin/AdminSidebarFooter.tsx` — remove Help row, replace dark mode button row with two-up pill row, add `showTestData` prop
- **Modify:** `apps/web/src/components/admin/AdminSidebar.tsx` — add `showTestData` prop to `AdminSidebar`, pass it to `AdminSidebarFooter`
- **Modify:** `apps/web/src/app/(admin)/admin/layout.tsx` — pass `showTestData` to `AdminSidebar`

---

### Task 1: Wire `showTestData` through layout → AdminSidebar → AdminSidebarFooter

This task threads the `showTestData` boolean down the component tree so it's available where the UI needs it. No visual changes yet.

**Files:**
- Modify: `apps/web/src/components/admin/AdminSidebarFooter.tsx`
- Modify: `apps/web/src/components/admin/AdminSidebar.tsx`
- Modify: `apps/web/src/app/(admin)/admin/layout.tsx`

- [ ] **Step 1: Add `showTestData` prop to `AdminSidebarFooter`**

Open `apps/web/src/components/admin/AdminSidebarFooter.tsx`. Change the props type and destructuring:

```tsx
export function AdminSidebarFooter({
  userName,
  userEmail,
  initials,
  avatarUrl = null,
  signOutSlot,
  showTestData = false,
}: {
  userName: string;
  userEmail: string;
  initials: string;
  avatarUrl?: string | null;
  signOutSlot: ReactNode;
  showTestData?: boolean;
}) {
```

- [ ] **Step 2: Add `showTestData` prop to `AdminSidebar` and pass it through**

Open `apps/web/src/components/admin/AdminSidebar.tsx`.

Change the props type (lines 405–411):
```tsx
export function AdminSidebar({
  userName,
  userEmail,
  initials,
  avatarUrl = null,
  pendingBlockCount: _pendingBlockCount,
  signOutSlot,
  showTestData = false,
}: {
  userName: string;
  userEmail: string;
  initials: string;
  avatarUrl?: string | null;
  pendingBlockCount: number;
  signOutSlot: ReactNode;
  showTestData?: boolean;
}) {
```

Then update the `AdminSidebarFooter` call (around line 540):
```tsx
<AdminSidebarFooter
  userName={userName}
  userEmail={userEmail}
  initials={initials}
  avatarUrl={avatarUrl}
  signOutSlot={signOutSlot}
  showTestData={showTestData}
/>
```

- [ ] **Step 3: Pass `showTestData` from layout to `AdminSidebar`**

Open `apps/web/src/app/(admin)/admin/layout.tsx`. The `AdminSidebar` call is around line 65. Add the prop:

```tsx
<AdminSidebar
  userName={fullName}
  userEmail={user.email ?? ""}
  initials={initials}
  avatarUrl={profile?.avatar_url ?? null}
  pendingBlockCount={pendingBlockCount ?? 0}
  signOutSlot={<AdminSignOutButton />}
  showTestData={profile?.show_test_data ?? false}
/>
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
npx tsc --noEmit
```

Expected: no errors related to the changed files.

- [ ] **Step 5: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/components/admin/AdminSidebarFooter.tsx \
        apps/web/src/components/admin/AdminSidebar.tsx \
        apps/web/src/app/(admin)/admin/layout.tsx
git commit -m "feat: thread showTestData prop through sidebar component tree"
```

---

### Task 2: Replace the dark mode row and help row with the two-up pill controls

This task builds the full visual UI. It replaces the existing "Dark mode" button and "Help" link with a single row containing the theme pill and the test data pill.

**Files:**
- Modify: `apps/web/src/components/admin/AdminSidebarFooter.tsx`

- [ ] **Step 1: Update imports**

In `AdminSidebarFooter.tsx`, replace the existing import block with this (adds `Sun`, `Moon`, `Monitor`, `Flask` from Phosphor; adds `useTransition`; adds `toggleShowTestDataAction`):

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import {
  GearSix,
  UserSwitch,
  Sun,
  Moon,
  Monitor,
  Flask,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { toggleShowTestDataAction } from "@/lib/admin/test-data";
```

Note: `Question` is no longer needed (Help row removed). `SignOut` import may or may not already be in the file — check and add only if missing. Remove `Sun`, `Moon` from any existing imports and use the new consolidated import block above.

- [ ] **Step 2: Replace the action rows block**

Find the `{/* Action rows */}` div (currently contains Account, Portal, Help, dark mode button, and signOutSlot). Replace the entire contents of that div with the following. The identity row (avatar/name link) above it does not change.

```tsx
{/* Action rows */}
<div className="pt-1 pb-1">
  <Link href="/admin/account" className="admin-footer-row">
    <GearSix size={15} weight="regular" className="shrink-0" />
    Account
  </Link>

  <Link
    href={portalHref}
    className="my-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold"
    style={{
      background: "linear-gradient(135deg, #02AAEB 0%, #1B77BE 100%)",
      color: "#fff",
      boxShadow: "0 2px 8px rgba(2, 170, 235, 0.25)",
      textDecoration: "none",
    }}
  >
    <UserSwitch size={15} weight="duotone" className="shrink-0" style={{ color: "#fff" }} />
    Portal
  </Link>

  {/* Theme + Test data controls */}
  <div className="flex gap-1.5 px-1 pt-1 pb-0.5">
    <ThemePill />
    <TestDataPill showTestData={showTestData} />
  </div>

  {signOutSlot}
</div>
```

- [ ] **Step 3: Add the `ThemePill` component**

Add this as a module-level function in `AdminSidebarFooter.tsx`, below the `getPortalUrl` function and before `AdminSidebarFooter`:

```tsx
function ThemePill() {
  const { theme, setTheme } = useTheme();

  const segs = [
    { value: "light" as const, icon: <Sun size={15} weight="regular" />, activeStyle: { background: "rgba(251,191,36,0.18)", color: "#fbbf24" } },
    { value: "dark"  as const, icon: <Moon size={15} weight="regular" />, activeStyle: { background: "rgba(96,165,250,0.18)", color: "#60a5fa" } },
    { value: "system" as const, icon: <Monitor size={15} weight="regular" />, activeStyle: { background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,1)" } },
  ] as const;

  return (
    <div
      className="flex flex-1 items-center gap-0.5 rounded-full p-0.5"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
    >
      {segs.map((seg) => {
        const isActive = theme === seg.value;
        return (
          <button
            key={seg.value}
            type="button"
            onClick={() => setTheme(seg.value)}
            className="flex flex-1 items-center justify-center rounded-full px-2.5 py-1.5 transition-colors"
            style={isActive ? seg.activeStyle : { color: "rgba(255,255,255,0.38)" }}
            aria-label={seg.value}
          >
            {seg.icon}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Add the `TestDataPill` component**

Add this directly below `ThemePill` in the same file:

```tsx
function TestDataPill({ showTestData }: { showTestData: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <div
      className="flex items-center gap-0.5 rounded-full p-0.5"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
    >
      {/* On segment — Flask, green when active */}
      <button
        type="button"
        disabled={pending}
        onClick={() => { if (!showTestData) startTransition(() => toggleShowTestDataAction()); }}
        className="flex items-center justify-center rounded-full px-2.5 py-1.5 transition-colors"
        style={showTestData
          ? { background: "rgba(52,211,153,0.18)", color: "#34d399" }
          : { color: "rgba(255,255,255,0.38)" }
        }
        aria-label="Show test data"
        aria-pressed={showTestData}
      >
        <Flask size={15} weight="regular" />
      </button>

      {/* Off segment — Flask with backslash overlay, red when active */}
      <button
        type="button"
        disabled={pending}
        onClick={() => { if (showTestData) startTransition(() => toggleShowTestDataAction()); }}
        className="flex items-center justify-center rounded-full px-2.5 py-1.5 transition-colors"
        style={!showTestData
          ? { background: "rgba(248,113,113,0.18)", color: "#f87171" }
          : { color: "rgba(255,255,255,0.38)" }
        }
        aria-label="Hide test data"
        aria-pressed={!showTestData}
      >
        <span className="relative inline-flex items-center justify-center">
          <Flask size={15} weight="regular" />
          <span
            className="pointer-events-none absolute rounded-sm"
            style={{
              top: "50%",
              left: "50%",
              width: "140%",
              height: "1px",
              background: "currentColor",
              transform: "translate(-50%, -50%) rotate(45deg)",
            }}
          />
        </span>
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Verify the file compiles**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Check in the browser**

The dev server is already on port 4000. Open `http://localhost:4000/admin`. Verify:

1. The "Help" row is gone from the sidebar footer.
2. The "Dark mode" row is replaced by a row with two pills side by side.
3. Clicking Sun turns it yellow. Clicking Moon turns it blue. Clicking Monitor turns it white and follows the OS preference.
4. The Flask "on" segment is green when `showTestData` is true; the Flask-slash "off" segment is red when `showTestData` is false.
5. Clicking either test data segment toggles the state and the page reloads (server action fires).

- [ ] **Step 7: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/components/admin/AdminSidebarFooter.tsx
git commit -m "feat: replace dark mode row with theme + test data segmented pill controls"
```
