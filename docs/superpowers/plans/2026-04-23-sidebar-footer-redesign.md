# Sidebar Footer Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the redundant Account card button from the sidebar footer, add a gear icon to the identity row, and expand Portal to full width.

**Architecture:** Single file edit to `AdminSidebarFooter.tsx`. Identity row already links to `/admin/account` — add `GearSix` as a trailing visual cue. Remove the Account `<Link>` card. Portal `<Link>` becomes full-width by removing the flex wrapper and `flex-1` constraint.

**Tech Stack:** React, Next.js App Router, Phosphor Icons (`@phosphor-icons/react`), Tailwind v4

---

### Task 1: Update AdminSidebarFooter

**Files:**
- Modify: `apps/web/src/components/admin/AdminSidebarFooter.tsx`

- [ ] **Step 1: Add GearSix icon to the identity row**

In the identity `<Link>` (currently ends after the `<div className="min-w-0 flex-1">` block), add a gear icon as the last child before the closing `</Link>`:

```tsx
<Link
  href="/admin/account"
  className="flex items-center gap-2.5 rounded-lg px-3 pb-1.5 pt-2.5 transition-colors hover:bg-[rgba(255,255,255,0.04)]"
>
  {avatarUrl ? (
    <img
      src={avatarUrl}
      alt={userName}
      className="h-[34px] w-[34px] shrink-0 rounded-full object-cover"
    />
  ) : (
    <span
      className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-xs font-semibold tracking-wide"
      style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      {initials}
    </span>
  )}
  <div className="min-w-0 flex-1">
    <div className="truncate text-[13.5px] font-semibold leading-tight" style={{ color: "#E0EDF8" }}>
      {userName}
    </div>
    <div className="mt-px truncate text-[11.5px] leading-tight" style={{ color: "rgba(255,255,255,0.40)" }}>
      {userEmail}
    </div>
  </div>
  <GearSix size={15} weight="regular" style={{ color: "rgba(255,255,255,0.35)", flexShrink: 0 }} />
</Link>
```

- [ ] **Step 2: Replace the two-column card row with a full-width Portal button**

Find this block (lines ~83-115):

```tsx
{/* Account + Portal two-column cards */}
<div className="flex gap-1.5 px-0.5 pb-1 pt-0.5">
  <Link
    href="/admin/account"
    className="flex flex-1 items-center justify-center gap-[7px] rounded-[10px] py-2 px-1.5 text-[12.5px] font-medium focus-visible:ring-2 focus-visible:ring-white/40"
    style={{
      color: "rgba(255,255,255,0.50)",
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.08)",
      transition: "background-color 150ms ease, color 150ms ease",
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.50)"; }}
  >
    <GearSix size={15} weight="regular" className="shrink-0" />
    Account
  </Link>
  <Link
    href={portalHref}
    className="flex flex-1 items-center justify-center gap-[7px] rounded-[10px] py-2 px-1.5 text-[12.5px] font-medium focus-visible:ring-2 focus-visible:ring-white/40"
    style={{
      color: "rgba(96,185,235,0.85)",
      background: "linear-gradient(135deg, rgba(2,170,235,0.15) 0%, rgba(27,119,190,0.15) 100%)",
      border: "1px solid rgba(2,170,235,0.22)",
      transition: "background-color 150ms ease, color 150ms ease",
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(2,170,235,0.22) 0%, rgba(27,119,190,0.22) 100%)"; e.currentTarget.style.color = "#7dd3fc"; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(2,170,235,0.15) 0%, rgba(27,119,190,0.15) 100%)"; e.currentTarget.style.color = "rgba(96,185,235,0.85)"; }}
  >
    <UserSwitch size={15} weight="duotone" className="shrink-0" />
    Portal
  </Link>
</div>
```

Replace the entire block with:

```tsx
{/* Portal */}
<div className="px-0.5 pb-1 pt-0.5">
  <Link
    href={portalHref}
    className="flex w-full items-center justify-center gap-[7px] rounded-[10px] py-2 px-1.5 text-[12.5px] font-medium focus-visible:ring-2 focus-visible:ring-white/40"
    style={{
      color: "rgba(96,185,235,0.85)",
      background: "linear-gradient(135deg, rgba(2,170,235,0.15) 0%, rgba(27,119,190,0.15) 100%)",
      border: "1px solid rgba(2,170,235,0.22)",
      transition: "background-color 150ms ease, color 150ms ease",
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(2,170,235,0.22) 0%, rgba(27,119,190,0.22) 100%)"; e.currentTarget.style.color = "#7dd3fc"; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(2,170,235,0.15) 0%, rgba(27,119,190,0.15) 100%)"; e.currentTarget.style.color = "rgba(96,185,235,0.85)"; }}
  >
    <UserSwitch size={15} weight="duotone" className="shrink-0" />
    Portal
  </Link>
</div>
```

- [ ] **Step 3: Verify build**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Screenshot and verify**

```bash
node /Users/johanannunez/workspace/parcel/apps/web/admin-topbar-verify.mjs
```

Confirm sidebar footer shows: identity row with gear icon, full-width Portal button, theme + sign out unchanged.

- [ ] **Step 5: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/components/admin/AdminSidebarFooter.tsx
git commit -m "refactor(sidebar): remove Account card button, add gear icon to identity row, expand Portal to full width"
```
