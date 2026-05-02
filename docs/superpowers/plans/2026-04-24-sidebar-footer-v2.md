# Sidebar Footer v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current sidebar footer's card-button layout with a flat left-aligned list (section label, Portal row, divider, Help row, Theme row, Sign out row).

**Architecture:** Single file edit to `apps/web/src/components/admin/AdminSidebarFooter.tsx`. The `ThemeDropdown` component is replaced by `ThemeRow` — a full-width list row that shows the active theme name, a caret-right icon, and opens an upward-positioned popover when clicked. The identity row is untouched.

**Tech Stack:** React, Next.js App Router (`"use client"`), Phosphor Icons (`@phosphor-icons/react`), Tailwind v4, inline styles for dynamic color values.

---

### Task 1: Rewrite AdminSidebarFooter.tsx

**Files:**
- Modify: `apps/web/src/components/admin/AdminSidebarFooter.tsx`

- [ ] **Step 1: Replace the entire file with the new implementation**

Write this exact content to `apps/web/src/components/admin/AdminSidebarFooter.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition, useState, useRef, useEffect } from "react";
import { GearSix, UserSwitch, Power, Sun, Moon, Monitor, CaretRight, Check, Question } from "@phosphor-icons/react";
import { useTheme } from "@/components/ThemeProvider";
import { signOut } from "@/app/(portal)/portal/actions";

function getPortalUrl(pathname: string): string {
  const map: Array<[string, string]> = [
    ["/admin/properties", "/portal/properties"],
    ["/admin/calendar", "/portal/calendar"],
    ["/admin/inbox", "/portal/messages"],
    ["/admin/tasks", "/portal/tasks"],
    ["/admin/timeline", "/portal/timeline"],
    ["/admin/account", "/portal/account"],
    ["/admin/help", "/portal/help"],
  ];
  for (const [prefix, dest] of map) {
    if (pathname.startsWith(prefix)) return dest;
  }
  return "/portal/dashboard";
}

const THEME_OPTIONS = [
  { value: "light" as const, icon: <Sun size={14} weight="regular" />, label: "Light mode" },
  { value: "dark" as const, icon: <Moon size={14} weight="regular" />, label: "Dark mode" },
  { value: "system" as const, icon: <Monitor size={14} weight="regular" />, label: "System" },
] as const;

function ThemeRow() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const current = THEME_OPTIONS.find((o) => o.value === theme) ?? THEME_OPTIONS[2];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          width: "100%",
          padding: "8px 14px",
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.55)",
          fontSize: "13px",
          fontWeight: 500,
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "left",
          transition: "background 120ms ease, color 120ms ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
          e.currentTarget.style.color = "rgba(255,255,255,0.8)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "none";
          e.currentTarget.style.color = "rgba(255,255,255,0.55)";
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", color: "rgba(255,255,255,0.35)", flexShrink: 0 }}>
          {current.icon}
        </span>
        <span style={{ flex: 1 }}>{current.label}</span>
        <CaretRight size={11} weight="bold" style={{ opacity: 0.25, flexShrink: 0 }} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 4px)",
            left: "12px",
            right: "12px",
            background: "var(--color-navy)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "10px",
            padding: "4px",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)",
            zIndex: 50,
          }}
        >
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setTheme(opt.value); setOpen(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                padding: "7px 9px",
                borderRadius: "6px",
                background: theme === opt.value ? "rgba(255,255,255,0.08)" : "transparent",
                border: "none",
                color: theme === opt.value ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.55)",
                fontSize: "12.5px",
                fontWeight: theme === opt.value ? 600 : 400,
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                transition: "background 120ms ease, color 120ms ease",
              }}
              onMouseEnter={(e) => {
                if (theme !== opt.value) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                if (theme !== opt.value) e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center" }}>{opt.icon}</span>
              <span style={{ flex: 1 }}>{opt.label}</span>
              {theme === opt.value && (
                <Check size={11} weight="bold" style={{ color: "var(--color-brand-light)" }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminSidebarFooter({
  userName,
  userEmail,
  initials,
  avatarUrl = null,
}: {
  userName: string;
  userEmail: string;
  initials: string;
  avatarUrl?: string | null;
}) {
  const pathname = usePathname();
  const portalHref = getPortalUrl(pathname ?? "");
  const [signOutPending, startSignOut] = useTransition();

  return (
    <div
      className="mx-3 mb-6 mt-auto border-t pt-2"
      style={{ borderColor: "rgba(255,255,255,0.08)" }}
    >
      {/* Identity row — entire row links to account, gear icon as visual cue */}
      <Link
        href="/admin/account"
        className="flex items-center gap-2.5 rounded-lg px-3 pb-1.5 pt-2.5 transition-colors hover:bg-[rgba(255,255,255,0.04)]"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
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

      {/* Flat action list */}
      <div className="pb-1 pt-1">
        {/* Section label */}
        <div
          style={{
            fontSize: "9.5px",
            fontWeight: 600,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.22)",
            padding: "4px 14px 6px",
          }}
        >
          Workspace
        </div>

        {/* Portal */}
        <Link
          href={portalHref}
          className="flex w-full items-center gap-2.5 px-[14px] py-2 text-[13px] font-medium transition-colors hover:bg-[rgba(255,255,255,0.04)]"
          style={{ color: "rgba(96,185,235,0.9)", textDecoration: "none" }}
        >
          <UserSwitch size={15} weight="duotone" style={{ color: "rgba(96,185,235,0.7)", flexShrink: 0 }} />
          Switch to Portal
        </Link>

        {/* Micro divider */}
        <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "4px 12px" }} />

        {/* Help & Support */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("admin:help-support"))}
          className="flex w-full items-center gap-2.5 px-[14px] py-2 text-[13px] font-medium transition-colors hover:bg-[rgba(255,255,255,0.04)]"
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.55)",
            cursor: "pointer",
            fontFamily: "inherit",
            textAlign: "left",
          }}
        >
          <Question size={15} weight="regular" style={{ color: "rgba(255,255,255,0.35)", flexShrink: 0 }} />
          Help & Support
        </button>

        {/* Theme row */}
        <ThemeRow />

        {/* Sign out */}
        <button
          type="button"
          disabled={signOutPending}
          onClick={() => startSignOut(() => signOut())}
          className="flex w-full items-center gap-2.5 px-[14px] py-2 text-[13px] font-medium"
          style={{
            background: "none",
            border: "none",
            color: signOutPending ? "rgba(239,68,68,0.4)" : "rgba(239,68,68,0.75)",
            cursor: signOutPending ? "wait" : "pointer",
            fontFamily: "inherit",
            textAlign: "left",
            transition: "color 150ms ease",
          }}
          onMouseEnter={(e) => { if (!signOutPending) e.currentTarget.style.color = "rgba(239,68,68,1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = signOutPending ? "rgba(239,68,68,0.4)" : "rgba(239,68,68,0.75)"; }}
        >
          <Power size={15} weight="regular" style={{ flexShrink: 0 }} />
          {signOutPending ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit
```

Expected: no errors. If you see `Module '"@phosphor-icons/react"' has no exported member 'CaretRight'`, change the import to `CaretRight` — it is available in `@phosphor-icons/react` v2. If the error persists, replace `CaretRight` with `ArrowRight` (same package, always available) and adjust the size to `10`.

- [ ] **Step 3: Screenshot and verify**

```bash
node /Users/johanannunez/workspace/parcel/apps/web/admin-topbar-verify.mjs
```

Confirm the footer shows: identity row with gear icon, "WORKSPACE" label, "Switch to Portal" in blue, divider, "Help & Support", theme row, "Sign out" in red.

- [ ] **Step 4: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/components/admin/AdminSidebarFooter.tsx
git commit -m "refactor(sidebar): footer v2 — flat list layout with section label, Portal row, Help row, theme row, red sign out"
```
