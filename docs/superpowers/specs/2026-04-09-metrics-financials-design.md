# Metrics & Financials: Owner Portal

**Date:** 2026-04-09
**Status:** Draft
**Scope:** Dashboard enhancements, payout generation, property detail financials

## Context

The Hospitable API sync is live. 13 properties connected, 145 reservations synced into the `bookings` table with `total_amount` storing the host payout amount (net revenue after platform fees). The `payouts` table exists but is empty. The dashboard, payouts page, and property detail page all have working UI shells but show incomplete or zero financial data.

## Decisions

- **Architecture:** Server Components with parallel Supabase queries. Period selection via URL search params (`?period=month|last|90d|ytd`). No client-side data fetching.
- **Payout grouping:** Monthly per property. One row in `payouts` per property per calendar month.
- **Revenue recognition:** By `check_out` month. A booking checking out April 2 counts toward April, not March.
- **`total_amount` semantics:** Treated as host payout (net revenue). This is the number shown to owners everywhere.
- **Fees column:** Set to 0 for now. The schema supports fees for future use (e.g., Parcel management fee deductions).

## 1. Schema Change

Add a unique constraint to support idempotent upserts:

```sql
ALTER TABLE public.payouts
ADD CONSTRAINT payouts_property_period_unique
UNIQUE (property_id, period_start);
```

Single statement, no new columns needed.

## 2. Payout Generation

**Endpoint:** `POST /api/admin/generate-payouts`
**Auth:** Admin only (check `is_admin()` or profile role).

**Logic:**
1. Query all non-cancelled bookings from the `bookings` table.
2. Group by `property_id` + calendar month of `check_out`.
3. For each group, compute:
   - `gross_revenue` = sum of `total_amount`
   - `fees` = 0
   - `net_payout` = `gross_revenue - fees`
   - `period_start` = first day of the month
   - `period_end` = last day of the month
4. Upsert into `payouts` using the `(property_id, period_start)` unique constraint.
5. `paid_at` remains null (pending status).

**Idempotency:** Running the endpoint multiple times produces the same result. Existing rows are updated, not duplicated.

**When to run:** Manually by admin after each Hospitable sync, or on a schedule later. Not triggered automatically by the sync for now.

## 3. Dashboard Enhancements

**Route:** `/portal/dashboard` (existing)
**Search param:** `?period=month|last|90d|ytd` (default: `month`)

### Period Switcher

A row of pill-shaped link tabs above the metric cards. Each is a Next.js `<Link>` that sets the `period` search param. Active pill gets brand blue fill (`--color-brand`) with white text. Inactive pills get warm-gray-100 background.

Period date ranges (computed server-side from current date):
- **This month:** first of current month to today
- **Last month:** first to last of previous month
- **Last 90 days:** 90 days ago to today
- **YTD:** January 1 of current year to today

### Primary Metric Cards (4, in a row)

All scoped to the selected period:

1. **Total revenue:** Sum of `total_amount` from non-cancelled bookings in the period. Hint shows the period label (e.g., "April 2026").
2. **Occupancy rate:** Booked nights / (active properties * days in period) * 100. Booking windows are clamped to the period boundaries. Hint: "Across N properties".
3. **Upcoming bookings:** Count of future non-cancelled bookings. Always forward-looking, does not change with period selection. Hint: "Next 30 days".
4. **Average nightly rate:** Total revenue / total booked nights in the period. Falls back to a dash when there are zero nights. Hint: "Per booked night".

### Secondary Stat Cards (3, smaller, compact row)

Not affected by period selection:

1. **Active listings:** Count of active properties, with "of N total" hint.
2. **Pending payouts:** Sum of `net_payout` from payouts where `paid_at` is null.
3. **Total properties:** Count of all properties.

### Property Breakdown Table

Below the metric cards. A bordered table (matching existing portal table patterns) with:
- **Header row:** Property, Revenue, Occupancy %, Nights, Avg/night
- **One row per property** with data scoped to the selected period
- Sorted by revenue descending
- Properties with zero bookings in the period show dashes
- Respects the period pill label in the table header

### Upcoming Bookings Table

No changes. Stays at the bottom as-is.

## 4. Payouts Page

**Route:** `/portal/payouts` (existing)

**No UI changes.** The page already has:
- Summary cards (YTD earnings, pending, last payout)
- Responsive table/card layout with period, property, gross, fees, net, status
- CSV export at `/api/payouts/export`

All of this reads from the `payouts` table. Once payout generation populates that table, the page lights up with real data.

## 5. Property Detail Financials

**Route:** `/portal/properties/[id]` (existing)

### Revenue Summary Upgrade

Replace the single "Revenue this year" `InfoCard` with a row of three compact info cards:
1. **YTD revenue:** Sum of `total_amount` for this property, year to date
2. **This month:** Sum of `total_amount` for this property, current month
3. **Total bookings:** Count of all non-cancelled bookings for this property

Uses the existing `InfoCard` component pattern.

### Occupancy Calendar

A small month-grid showing the current month for this property. Each day cell is either:
- **Empty/available:** Default background
- **Booked:** Brand blue background with white text

Data source: Query bookings for this property where `check_in` or `check_out` falls within the current month. Mark each day in the booking range as booked.

Placement: Between the revenue summary row and the recent bookings/payouts panels.

No month navigation. This is a snapshot view. The full calendar experience is at `/portal/calendar`.

### Recent Payouts Panel

No changes. Already reads from the `payouts` table and will show data once populated.

## File Changes Summary

### New files
- `apps/web/src/app/api/admin/generate-payouts/route.ts` (payout generation endpoint)
- `apps/web/src/components/portal/PeriodSwitcher.tsx` (pill tabs component)
- `apps/web/src/components/portal/PropertyBreakdown.tsx` (per-property table)
- `apps/web/src/components/portal/OccupancyCalendar.tsx` (mini month grid)

### Modified files
- `apps/web/src/app/(portal)/portal/dashboard/page.tsx` (period param, new layout, new queries)
- `apps/web/src/app/(portal)/portal/properties/[id]/page.tsx` (revenue row upgrade, occupancy calendar)

### No changes needed
- `apps/web/src/app/(portal)/portal/payouts/page.tsx` (works as-is)
- `apps/web/src/app/api/payouts/export/route.ts` (works as-is)
- `apps/web/src/components/portal/MetricCard.tsx` (reused as-is)
- `apps/web/src/lib/format.ts` (reused as-is)

### SQL (run once via Supabase SQL Editor)
```sql
ALTER TABLE public.payouts
ADD CONSTRAINT payouts_property_period_unique
UNIQUE (property_id, period_start);
```

## Out of Scope

- Automated payout generation triggered by Hospitable sync
- Fee percentage configuration
- Marking payouts as paid (manual DB update for now)
- Month navigation on the property detail occupancy calendar
- Charts or graphs (tables and numbers first, visualization later)
- Dark mode testing (tokens exist, will inherit correctly)
