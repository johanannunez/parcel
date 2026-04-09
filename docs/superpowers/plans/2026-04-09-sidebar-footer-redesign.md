# Sidebar Footer Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the boxed user card and scattered Account/Help nav items with a compact flat footer in the portal sidebar.

**Architecture:** Extract the bottom section of `PortalSidebar` into a new `SidebarFooter` client component. The footer contains an identity row (avatar + name + email) and five action rows (theme toggle, Help, Account, Switch to Admin, Sign out). The sign out action stays server-side via the existing `signOut` action passed as a `ReactNode` slot.

**Tech Stack:** React 19, Next.js 16 App Router, Phosphor Icons, Tailwind v4 + inline CSS vars

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `apps/web/src/components/portal/SidebarFooter.tsx` | New client component: identity row + action rows |
| Modify | `apps/web/src/components/portal/PortalSidebar.tsx` | Remove Account section, Help link, Switch to Admin block, user card. Import and render `SidebarFooter`. Remove `timezone` prop. |
| Modify | `apps/web/src/app/(portal)/portal/layout.tsx` | Stop passing `timezone` to `PortalSidebar` |
| Modify | `apps/web/src/app/(portal)/portal/SignOutButton.tsx` | Restyle as a compact footer row (icon + text) instead of a bordered button |

---

### Task 1: Create `SidebarFooter` component

**Files:**
- Create: `apps/web/src/components/portal/SidebarFooter.tsx`

- [ ] **Step 1: Create the SidebarFooter component**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sun,
  Moon,
  Question,
  GearSix,
  ShieldCheck,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";

export function SidebarFooter({
  userName,
  userEmail,
  initials,
  isAdmin = false,
  signOutSlot,
}: {
  userName: string;
  userEmail: string;
  initials: string;
  isAdmin?: boolean;
  signOutSlot: ReactNode;
}) {
  const [toastVisible, setToastVisible] = useState(false);

  function handleThemeToggle() {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  }

  return (
    <div
      className="mx-3 mb-3 mt-auto border-t pt-2"
      style={{ borderColor: "var(--color-warm-gray-200)" }}
    >
      {/* Identity row */}
      <div className="flex items-center gap-2.5 px-3 pb-1.5 pt-2.5">
        <span
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-xs font-semibold tracking-wide"
          style={{
            backgroundColor: "var(--color-warm-gray-100)",
            color: "var(--color-text-primary)",
          }}
        >
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="truncate text-[13.5px] font-semibold leading-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            {userName}
          </div>
          <div
            className="mt-px truncate text-[11.5px] leading-tight"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {userEmail}
          </div>
        </div>
      </div>

      {/* Action rows */}
      <div className="pt-1 pb-1">
        {/* Theme toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={handleThemeToggle}
            className="sidebar-footer-row"
          >
            <Sun size={15} weight="regular" className="shrink-0" />
            Light mode
          </button>
          {toastVisible ? (
            <span
              className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium"
              style={{
                backgroundColor: "var(--color-text-primary)",
                color: "var(--color-white)",
              }}
            >
              Coming soon
            </span>
          ) : null}
        </div>

        <Link href="/help" className="sidebar-footer-row">
          <Question size={15} weight="regular" className="shrink-0" />
          Help
        </Link>

        <Link href="/portal/account" className="sidebar-footer-row">
          <GearSix size={15} weight="regular" className="shrink-0" />
          Account
        </Link>

        {isAdmin ? (
          <Link href="/admin" className="sidebar-footer-row">
            <ShieldCheck size={15} weight="regular" className="shrink-0" />
            Switch to Admin
          </Link>
        ) : null}

        {signOutSlot}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/portal/SidebarFooter.tsx
git commit -m "feat(portal): add SidebarFooter component"
```

---

### Task 2: Restyle `SignOutButton` as a footer row

**Files:**
- Modify: `apps/web/src/app/(portal)/portal/SignOutButton.tsx`

The current sign out button is a bordered pill button. It needs to match the footer row style: icon + text, full width, subtle red hover.

- [ ] **Step 1: Update SignOutButton to footer row style**

Replace the entire content of `SignOutButton.tsx` with:

```tsx
"use client";

import { useTransition } from "react";
import { Power } from "@phosphor-icons/react";
import { signOut } from "./actions";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => signOut())}
      className="sidebar-footer-row sidebar-footer-signout"
    >
      <Power size={15} weight="regular" className="shrink-0" />
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/(portal)/portal/SignOutButton.tsx
git commit -m "refactor(portal): restyle SignOutButton as footer row"
```

---

### Task 3: Add footer row CSS classes

**Files:**
- Modify: `apps/web/src/app/globals.css`

Both `SidebarFooter` and `SignOutButton` reference `.sidebar-footer-row` and `.sidebar-footer-signout`. Add these utility classes to the global stylesheet.

- [ ] **Step 1: Find the end of the existing CSS in globals.css and add the footer row styles**

Append the following block at the end of `globals.css`:

```css
/* ------------------------------------------------
   Portal sidebar footer rows
   ------------------------------------------------ */
.sidebar-footer-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 12px 7px 17px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  text-decoration: none;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}
.sidebar-footer-row:hover {
  background: var(--color-warm-gray-50);
  color: var(--color-text-secondary);
}
.sidebar-footer-signout:hover {
  background: rgba(230, 100, 80, 0.10);
  color: #F0836E;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/globals.css
git commit -m "style(portal): add sidebar footer row classes"
```

---

### Task 4: Update `PortalSidebar` to use `SidebarFooter`

**Files:**
- Modify: `apps/web/src/components/portal/PortalSidebar.tsx`

Remove the "Account" section header + Help link (lines 168-191), the Switch to Admin block (lines 193-209), and the boxed user card (lines 211-246). Replace with `SidebarFooter`. Remove `timezone` from props and the `OwnerLocalTime` import.

- [ ] **Step 1: Update imports**

Replace the import block at the top of the file. Remove `LifebuoyIcon as Lifebuoy`, `ShieldCheck`, and `ChatCircle` (if unused elsewhere in the file). Remove the `OwnerLocalTime` import. Add `SidebarFooter` import.

Old imports:

```tsx
import {
  House,
  Buildings,
  CalendarBlank,
  ClipboardText,
  Wallet,
  LifebuoyIcon as Lifebuoy,
  ShieldCheck,
  ChatCircle,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import {
  CommandPalette,
  CommandPaletteTrigger,
} from "@/components/portal/CommandPalette";
import { OwnerLocalTime } from "@/components/portal/OwnerLocalTime";
```

New imports:

```tsx
import {
  House,
  Buildings,
  CalendarBlank,
  ClipboardText,
  Wallet,
  ChatCircle,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import {
  CommandPalette,
  CommandPaletteTrigger,
} from "@/components/portal/CommandPalette";
import { SidebarFooter } from "@/components/portal/SidebarFooter";
```

- [ ] **Step 2: Update the component props**

Remove `timezone` from the props type and destructured params.

Old:

```tsx
export function PortalSidebar({
  userName,
  userEmail,
  initials,
  timezone,
  isAdmin = false,
  signOutSlot,
}: {
  userName: string;
  userEmail: string;
  initials: string;
  timezone: string | null;
  isAdmin?: boolean;
  signOutSlot: ReactNode;
}) {
```

New:

```tsx
export function PortalSidebar({
  userName,
  userEmail,
  initials,
  isAdmin = false,
  signOutSlot,
}: {
  userName: string;
  userEmail: string;
  initials: string;
  isAdmin?: boolean;
  signOutSlot: ReactNode;
}) {
```

- [ ] **Step 3: Remove the Account section, Help link, Switch to Admin block, and user card**

Remove everything after the closing `</ul>` of the primary nav (after `{primaryNav.map(...)}`), up through the closing `</div>` of the user card. This is the entire block from the "Account" header through the end of the boxed user card.

Replace it with:

```tsx
      </nav>

      <SidebarFooter
        userName={userName}
        userEmail={userEmail}
        initials={initials}
        isAdmin={isAdmin}
        signOutSlot={signOutSlot}
      />
    </aside>
```

The `</nav>` closes the existing nav element. The `SidebarFooter` sits between `</nav>` and `</aside>`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/portal/PortalSidebar.tsx
git commit -m "refactor(portal): replace sidebar bottom section with SidebarFooter"
```

---

### Task 5: Update portal layout to stop passing `timezone`

**Files:**
- Modify: `apps/web/src/app/(portal)/portal/layout.tsx`

- [ ] **Step 1: Remove timezone from the Supabase query select**

Old:

```tsx
    .select("full_name, timezone, role")
```

New:

```tsx
    .select("full_name, role")
```

- [ ] **Step 2: Remove `timezone` prop from `PortalSidebar`**

Old:

```tsx
      <PortalSidebar
        userName={fullName}
        userEmail={user.email ?? ""}
        initials={initials}
        timezone={profile?.timezone ?? null}
        isAdmin={profile?.role === "admin"}
        signOutSlot={<SignOutButton />}
      />
```

New:

```tsx
      <PortalSidebar
        userName={fullName}
        userEmail={user.email ?? ""}
        initials={initials}
        isAdmin={profile?.role === "admin"}
        signOutSlot={<SignOutButton />}
      />
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/(portal)/portal/layout.tsx
git commit -m "refactor(portal): remove timezone from sidebar props"
```

---

### Task 6: Build and verify

- [ ] **Step 1: Run the build**

```bash
cd /Users/johanannunez/workspace/parcel && pnpm --filter web build
```

Expected: clean build, no TypeScript errors, no unused import warnings.

- [ ] **Step 2: Start dev server and visually verify**

```bash
cd /Users/johanannunez/workspace/parcel && pnpm --filter web dev
```

Open `http://localhost:3001/portal/dashboard` in browser. Verify:
- The bottom of the sidebar shows: identity row (avatar + name + email), then action rows (Light mode, Help, Account, Switch to Admin, Sign out)
- No boxed card visible
- No "Account" section header in the main nav
- No "Help center" link in the main nav
- Hover states work: warm gray on most rows, red tint on Sign out
- Clicking "Light mode" shows "Coming soon" toast that disappears after 2 seconds
- "Switch to Admin" only appears for admin users
- Sign out works correctly

- [ ] **Step 3: Screenshot the result**

```bash
cd /Users/johanannunez/workspace/parcel && node apps/web/screenshot.mjs http://localhost:3001/portal/dashboard sidebar-footer
```

Compare against the approved mockup. Fix any spacing, color, or alignment issues.

- [ ] **Step 4: Final commit if any fixes were needed, then push**

```bash
cd /Users/johanannunez/workspace/parcel && git push origin main
```
