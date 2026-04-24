# Help & Support Modal — Design Doc

**Date:** 2026-04-23
**Status:** Approved

---

## Overview

A "Help & Support" entry point in the admin sidebar footer that opens a frosted-glass overlay modal with six functional options. Built first on the admin side; portal side follows later with the same infrastructure.

---

## Trigger Button

**Location:** `AdminSidebarFooter.tsx`, new full-width row between the Portal link and the Theme/Sign Out row.

**Appearance:** Matches the Portal button's glass treatment but uses neutral white tint instead of brand blue. `Question` icon (Phosphor) on the left, "Help & Support" label. Brightens on hover.

**Event:** Dispatches `window.dispatchEvent(new CustomEvent("admin:help-support"))` so the modal can mount anywhere in the tree without prop drilling. `AIChatWidget` follows the same pattern via `admin:ai-chat`.

---

## Modal Shell

**Component:** `src/components/admin/HelpSupportModal.tsx`

**State machine:** `idle | open | detail:whats-new | detail:shortcuts | detail:support | detail:feedback`

**Backdrop:** `position: fixed, inset: 0, background: rgba(0,0,0,0.55), backdrop-filter: blur(6px), z-index: 200`

**Panel:**
- `position: fixed, top: 50%, left: 50%, transform: translate(-50%, -50%)`
- Width: `420px`, max-height: `80vh`, overflow hidden
- Background: `rgba(14,26,45,0.82)` (dark navy glass)
- `backdrop-filter: blur(28px) saturate(180%)`
- `border: 1px solid rgba(255,255,255,0.10)`
- `border-radius: 20px`
- Box shadow: `0 0 0 1px rgba(255,255,255,0.04), 0 24px 64px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4)`

**Entry animation:** `motion/react` (`AnimatePresence` + `motion.div`). Starts at `scale(0.93), opacity(0), translateY(-10px)`, springs to rest. Feels like the panel materializes out of the sidebar wall.

**Panel transition (root to detail):** Panel A slides left (`translateX(-100%)`), Panel B slides in from right (`translateX(0)`). Spring physics, ~280ms. Back button reverses.

**Keyboard:** `?` opens, `Escape` closes or navigates back, arrow keys cycle rows, `Enter` selects.

---

## Option Rows

Each row: 64px tall, `padding: 0 16px`, flex row. Left: 32x32 colored icon block (10px radius, Phosphor duotone icon). Center: title (13.5px semibold, `#E0EDF8`) + description (11.5px, `rgba(255,255,255,0.45)`). Right: `CaretRight` (14px, 35% opacity). Hover: `rgba(255,255,255,0.05)` background, 12px radius, 120ms transition. Thin separator `rgba(255,255,255,0.07)` between rows.

| # | Label | Icon | Icon bg | Behavior |
|---|---|---|---|---|
| 1 | Help Center | `BookOpenText` duotone | `rgba(2,170,235,0.18)` | `router.push("/admin/help")`, close modal |
| 2 | Ask AI | `Robot` duotone | `rgba(139,92,246,0.18)` | Close modal, dispatch `admin:ai-chat` to open `AIChatWidget` |
| 3 | What's New | `Sparkle` duotone | `rgba(16,185,129,0.18)` | Slide to `detail:whats-new` panel |
| 4 | Contact Support | `ChatCircleDots` duotone | `rgba(245,158,11,0.18)` | Slide to `detail:support` panel |
| 5 | Send Feedback | `PaperPlaneTilt` duotone | `rgba(239,68,68,0.18)` | Slide to `detail:feedback` panel |
| 6 | Keyboard Shortcuts | `Command` duotone | `rgba(255,255,255,0.10)` | Slide to `detail:shortcuts` panel |

---

## Detail Panels

### What's New
- Scrollable list of `changelogs` table entries: version badge (brand blue pill), title, date, one-line body.
- Empty state: "No updates yet."
- Admin creates entries via new "Changelog" tab at `/admin/help`.
- **Built by Sub-agent 1.**

### Contact Support
- Form: subject (text input), priority (Low / Normal / Urgent select), message (textarea).
- Server action inserts into `support_tickets` table and emails `jo@johanannunez.com`.
- Success shows confirmation state inside the panel.
- **Built by Sub-agent 2.**

### Send Feedback
- Form: type (Bug / Idea / Compliment / Other select), message (textarea).
- Server action inserts into `feedback_submissions` table. No email.
- Success shows thank-you state inside the panel.
- **Built by Sub-agent 2.**

### Keyboard Shortcuts
- Static two-column grid. Categories: Navigation, Actions, Search, System.
- Each row: shortcut key(s) in a `kbd` chip (`rgba(255,255,255,0.08)` bg, monospace, 11px) + label.
- No backend. Built inline with the modal shell.
- **Built by main thread.**

---

## Database Schema

### `changelogs` (Sub-agent 1)
```sql
create table changelogs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  version text,
  tag text,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table changelogs enable row level security;
create policy "Service role full access" on changelogs using (true) with check (true);
```

### `support_tickets` (Sub-agent 2)
```sql
create table support_tickets (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  message text not null,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'urgent')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  created_at timestamptz not null default now()
);
alter table support_tickets enable row level security;
create policy "Service role full access" on support_tickets using (true) with check (true);
```

### `feedback_submissions` (Sub-agent 2)
```sql
create table feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('bug', 'idea', 'compliment', 'other')),
  message text not null,
  created_at timestamptz not null default now()
);
alter table feedback_submissions enable row level security;
create policy "Service role full access" on feedback_submissions using (true) with check (true);
```

---

## Build Sequence

**Main thread:** `HelpSupportModal.tsx` shell + all 6 option rows + Keyboard Shortcuts detail panel + sidebar trigger button + `AIChatWidget` event wire-up. This is built first and establishes the component API that sub-agents wire into.

**Sub-agent 1 (parallel):** `changelogs` migration, changelog admin tab at `/admin/help`, What's New detail panel data layer.

**Sub-agent 2 (parallel):** `support_tickets` + `feedback_submissions` migrations, server actions, email on ticket submit, Contact Support and Send Feedback form detail panels.

---

## File Map

### Main thread
- `src/components/admin/HelpSupportModal.tsx` — new
- `src/components/admin/AdminSidebarFooter.tsx` — add trigger button

### Sub-agent 1
- `supabase/migrations/YYYYMMDD_changelogs.sql` — new
- `src/app/(admin)/admin/help/page.tsx` — add Changelog tab
- `src/app/(admin)/admin/help/ChangelogTab.tsx` — new
- `src/lib/admin/changelogs.ts` — new (fetch + create actions)

### Sub-agent 2
- `supabase/migrations/YYYYMMDD_support_tickets.sql` — new
- `supabase/migrations/YYYYMMDD_feedback_submissions.sql` — new
- `src/lib/admin/support.ts` — new (server actions)
- `src/app/api/support/ticket/route.ts` — new (email trigger)
