# Reserve Dashboard — Design Spec

**Date:** 2026-04-11
**Status:** Approved

---

## Summary

Add a landing page at `/portal/reserve` that gives owners a dashboard view of their reservation activity before they start a new one. The current reservation form moves to a sub-route at `/portal/reserve/new`. The dashboard is the default destination when an owner taps "Reserve" in the sidebar.

---

## Problem

Today `/portal/reserve` goes directly into the reservation form. Owners have no way to see past or pending reservations without scrolling through something else. There's no sense of status or momentum. The form feels like it came from nowhere.

---

## Design Direction

Four stacked sections, top to bottom:

### 1. CTA Banner

A bold blue gradient banner (matching the Parcel brand — `#1B77BE` → `#02AAEB` → `#38c8ff`) with a "+ New reservation" button on the right. The banner has decorative overlapping translucent circles for depth. Copy:

- Eyebrow: `Owner stays & holds`
- Heading: `Reserve time in your home`
- Sub: `Pick your dates and we'll check for conflicts.`

The button opens the reservation form at `/portal/reserve/new`.

### 2. Stat Modules (2-column grid)

Two stat cards side by side:

- **Under review** — count of pending block requests, emoji ⏳, amber background icon. Detail line: "Waiting for conflict check."
- **Completed stays** — count of past confirmed stays that have already ended, green checkmark icon. Detail line: "All time."

Both query the `block_requests` table filtered by `owner_id`.

### 3. Next Stay Card

A white card with a header row (eyebrow "Next Stay" + "Confirmed" pill) and a body row. Body:

- Left: property name (e.g. "524 Sycamore Avenue") with unit in brand blue (`Unit B`), city/state/ZIP below, then a row of three meta items (Check-in, Check-out, Guests).
- Right: a **countdown bubble** — a rounded box showing the number of days until check-in in large bold brand blue, with a "days away" label beneath. This is the "wow factor" — it makes the next stay feel tangible and real.

If there is no upcoming confirmed stay, this card is hidden.

### 4. Reservations List

A white card listing all reservations (all statuses) in reverse chronological order, with a "Most recent first" label. Each row:

- Left: property name + unit (in blue), dates + stay type below
- Right: status pill (Under review / Confirmed / Conflict)

Three rows shown by default, then a "View full history →" link to expand or link to a full list page.

---

## Routing

| Route | Content |
|---|---|
| `/portal/reserve` | New dashboard (this spec) |
| `/portal/reserve/new` | Existing `ReserveForm` — moved from `/portal/reserve` |

The sidebar link for "Reserve" points to `/portal/reserve`. The "+ New reservation" banner button links to `/portal/reserve/new`.

---

## Data

All data is server-fetched from Supabase using the existing `block_requests` table. No new schema changes needed.

**Queries (scoped to the logged-in owner's properties):**

- Pending count: `block_requests` where `status = 'pending'`
- Completed count: `block_requests` where `status = 'approved'` and `end_date < today`
- Next stay: `block_requests` where `status = 'approved'` and `start_date >= today`, ordered by `start_date ASC`, limit 1
- All reservations list: `block_requests` ordered by `created_at DESC`, limit 20 (expandable)

The existing `ReserveProperty` type and property query from `page.tsx` can be reused.

---

## Visual Tokens

- Banner gradient: `linear-gradient(130deg, #1B77BE 0%, #02AAEB 60%, #38c8ff 100%)`
- Unit blue: `var(--color-brand)` (`#02AAEB`)
- Countdown number: `#02AAEB`, 32px, weight 800
- Icon backgrounds: amber `rgba(251,191,36,0.12)`, green `rgba(34,197,94,0.10)`
- Status pills: pending = amber, confirmed = green, conflict/declined = red
- Card border: `1.5px solid #e8e5e0`, `border-radius: 14px`

---

## Component Structure

```
/portal/reserve/
  page.tsx                 ← New server component: ReserveDashboard
  new/
    page.tsx               ← Moved from /portal/reserve/page.tsx (existing form)
  components/
    ReserveDashboard.tsx   ← Client wrapper if needed for countdown
  types.ts                 ← Unchanged
  ReserveForm.tsx          ← Unchanged, just moved under new/
  ReserveSummary.tsx       ← Unchanged
```

The countdown (days-away number) is computed on the server from `start_date - today` in days. No client JS needed for the count itself.

---

## Out of Scope

- Canceling or editing a reservation from the dashboard (future)
- Filtering the reservations list by property or date (future)
- Pagination beyond the initial 20-row cap (future)
- Push notifications for status changes (separate feature)
