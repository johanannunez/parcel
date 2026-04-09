# Metrics & Financials Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Populate the payouts table from Hospitable booking data, enhance the dashboard with time period switching and per-property breakdown, and add an occupancy calendar to property detail pages.

**Architecture:** Server Components with parallel Supabase queries. Period selection via URL search params. Payout generation via admin-only API route using the service role client. All new components are server-rendered, no client-side data fetching.

**Tech Stack:** Next.js 16 App Router, Supabase (hosted), TypeScript, Tailwind v4 with CSS custom properties, Phosphor Icons

---

## File Map

### New files
- `apps/web/src/app/api/admin/generate-payouts/route.ts` — Admin endpoint that aggregates bookings into monthly payout records
- `apps/web/src/components/portal/PeriodSwitcher.tsx` — Pill-shaped tab links for time period selection
- `apps/web/src/components/portal/PropertyBreakdown.tsx` — Per-property metrics table
- `apps/web/src/components/portal/OccupancyCalendar.tsx` — Mini month-grid showing booked dates
- `apps/web/src/lib/periods.ts` — Period date range computation helper

### Modified files
- `apps/web/src/app/(portal)/portal/dashboard/page.tsx` — Period param handling, restructured metric cards, property breakdown
- `apps/web/src/app/(portal)/portal/properties/[id]/page.tsx` — Revenue summary row upgrade, occupancy calendar

### Unchanged (will light up automatically)
- `apps/web/src/app/(portal)/portal/payouts/page.tsx`
- `apps/web/src/app/api/payouts/export/route.ts`

---

## Task 1: SQL Migration — Unique Constraint on Payouts

**Files:**
- None (SQL run manually in Supabase SQL Editor)

This must be done by Johan in the Supabase SQL Editor before the payout generation endpoint can work.

- [ ] **Step 1: Run the migration**

Open the Supabase SQL Editor at https://supabase.com/dashboard/project/pwoxwpryummqeqsxdgyc/sql/new and run:

```sql
ALTER TABLE public.payouts
ADD CONSTRAINT payouts_property_period_unique
UNIQUE (property_id, period_start);
```

- [ ] **Step 2: Verify the constraint exists**

Run this in the same SQL editor:

```sql
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'payouts'
  AND constraint_type = 'UNIQUE';
```

Expected: One row with `payouts_property_period_unique`.

---

## Task 2: Period Date Range Helper

**Files:**
- Create: `apps/web/src/lib/periods.ts`

A pure utility with no dependencies. Extracts date range logic so the dashboard page stays clean.

- [ ] **Step 1: Create the periods helper**

```ts
// apps/web/src/lib/periods.ts

export type PeriodKey = "month" | "last" | "90d" | "ytd";

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  month: "This month",
  last: "Last month",
  "90d": "Last 90 days",
  ytd: "Year to date",
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/**
 * Returns the ISO date range [start, end] for the given period key
 * relative to the given "today" date.
 */
export function periodRange(
  key: PeriodKey,
  today: Date = new Date(),
): { start: string; end: string; label: string } {
  const y = today.getFullYear();
  const m = today.getMonth();

  switch (key) {
    case "month":
      return {
        start: isoDate(new Date(y, m, 1)),
        end: isoDate(today),
        label: today.toLocaleString("en-US", { month: "long", year: "numeric" }),
      };
    case "last": {
      const lastMonth = new Date(y, m - 1, 1);
      const lastDay = new Date(y, m, 0);
      return {
        start: isoDate(lastMonth),
        end: isoDate(lastDay),
        label: lastMonth.toLocaleString("en-US", {
          month: "long",
          year: "numeric",
        }),
      };
    }
    case "90d":
      return {
        start: isoDate(new Date(today.getTime() - 90 * 86400000)),
        end: isoDate(today),
        label: "Last 90 days",
      };
    case "ytd":
      return {
        start: `${y}-01-01`,
        end: isoDate(today),
        label: `${y} year to date`,
      };
  }
}

/** Validate and parse the period search param. Defaults to "month". */
export function parsePeriod(raw: string | undefined | null): PeriodKey {
  if (raw === "last" || raw === "90d" || raw === "ytd") return raw;
  return "month";
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd /Users/johanannunez/workspace/parcel && pnpm --filter web exec tsc --noEmit --pretty 2>&1 | head -20`

Expected: No errors mentioning `periods.ts`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/periods.ts
git commit -m "feat: add period date range helper for dashboard time switcher"
```

---

## Task 3: PeriodSwitcher Component

**Files:**
- Create: `apps/web/src/components/portal/PeriodSwitcher.tsx`

Server component. Renders pill-shaped `<Link>` elements that set the `?period=` search param.

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/components/portal/PeriodSwitcher.tsx

import Link from "next/link";
import { PERIOD_LABELS, type PeriodKey } from "@/lib/periods";

const KEYS: PeriodKey[] = ["month", "last", "90d", "ytd"];

export function PeriodSwitcher({
  active,
  basePath = "/portal/dashboard",
}: {
  active: PeriodKey;
  basePath?: string;
}) {
  return (
    <nav aria-label="Time period" className="flex flex-wrap gap-1.5">
      {KEYS.map((key) => {
        const isActive = key === active;
        return (
          <Link
            key={key}
            href={key === "month" ? basePath : `${basePath}?period=${key}`}
            className="rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors duration-200"
            style={{
              backgroundColor: isActive
                ? "var(--color-brand)"
                : "var(--color-warm-gray-100)",
              color: isActive ? "#ffffff" : "var(--color-text-secondary)",
            }}
            aria-current={isActive ? "true" : undefined}
          >
            {PERIOD_LABELS[key]}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd /Users/johanannunez/workspace/parcel && pnpm --filter web exec tsc --noEmit --pretty 2>&1 | head -20`

Expected: No errors mentioning `PeriodSwitcher.tsx`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/portal/PeriodSwitcher.tsx
git commit -m "feat: add PeriodSwitcher pill tabs component"
```

---

## Task 4: PropertyBreakdown Component

**Files:**
- Create: `apps/web/src/components/portal/PropertyBreakdown.tsx`

Server component. Receives pre-computed per-property metrics and renders a table.

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/components/portal/PropertyBreakdown.tsx

import { currency0 } from "@/lib/format";

export type PropertyRow = {
  id: string;
  name: string;
  revenue: number;
  occupancyPct: number | null;
  nights: number;
  avgNightly: number | null;
};

export function PropertyBreakdown({
  rows,
  periodLabel,
}: {
  rows: PropertyRow[];
  periodLabel: string;
}) {
  return (
    <section
      className="overflow-hidden rounded-2xl border"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
    >
      <header
        className="flex items-center justify-between border-b px-6 py-4"
        style={{ borderColor: "var(--color-warm-gray-100)" }}
      >
        <h2
          className="text-[15px] font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          Property breakdown
        </h2>
        <span
          className="text-xs font-medium"
          style={{ color: "var(--color-brand)" }}
        >
          {periodLabel}
        </span>
      </header>

      {rows.length === 0 ? (
        <div
          className="px-6 py-10 text-center text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          No properties to show.
        </div>
      ) : (
        <>
          {/* Mobile: stacked cards */}
          <ul className="flex flex-col md:hidden">
            {rows.map((r, i) => (
              <li
                key={r.id}
                className="px-5 py-4"
                style={{
                  borderTop:
                    i === 0
                      ? undefined
                      : "1px solid var(--color-warm-gray-100)",
                }}
              >
                <div
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {r.name}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  <div>
                    <span style={{ color: "var(--color-text-tertiary)" }}>
                      Revenue
                    </span>
                    <div
                      className="font-semibold tabular-nums"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {currency0.format(r.revenue)}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-tertiary)" }}>
                      Occupancy
                    </span>
                    <div style={{ color: "var(--color-text-secondary)" }}>
                      {r.occupancyPct !== null ? `${r.occupancyPct}%` : "\u2014"}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-tertiary)" }}>
                      Nights
                    </span>
                    <div style={{ color: "var(--color-text-secondary)" }}>
                      {r.nights}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-tertiary)" }}>
                      Avg/night
                    </span>
                    <div style={{ color: "var(--color-text-secondary)" }}>
                      {r.avgNightly !== null
                        ? currency0.format(r.avgNightly)
                        : "\u2014"}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Tablet+: full table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-left text-[10px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  <th className="px-6 py-3 font-semibold">Property</th>
                  <th className="px-6 py-3 text-right font-semibold">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-right font-semibold">
                    Occupancy
                  </th>
                  <th className="px-6 py-3 text-right font-semibold">
                    Nights
                  </th>
                  <th className="px-6 py-3 text-right font-semibold">
                    Avg/night
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.id}
                    className="transition-colors hover:bg-[var(--color-warm-gray-50)]"
                    style={{
                      borderTop:
                        i === 0
                          ? undefined
                          : "1px solid var(--color-warm-gray-100)",
                    }}
                  >
                    <td
                      className="px-6 py-3.5 font-medium"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {r.name}
                    </td>
                    <td
                      className="px-6 py-3.5 text-right font-semibold tabular-nums"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {currency0.format(r.revenue)}
                    </td>
                    <td
                      className="px-6 py-3.5 text-right tabular-nums"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {r.occupancyPct !== null ? `${r.occupancyPct}%` : "\u2014"}
                    </td>
                    <td
                      className="px-6 py-3.5 text-right tabular-nums"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {r.nights}
                    </td>
                    <td
                      className="px-6 py-3.5 text-right tabular-nums"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {r.avgNightly !== null
                        ? currency0.format(r.avgNightly)
                        : "\u2014"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd /Users/johanannunez/workspace/parcel && pnpm --filter web exec tsc --noEmit --pretty 2>&1 | head -20`

Expected: No errors mentioning `PropertyBreakdown.tsx`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/portal/PropertyBreakdown.tsx
git commit -m "feat: add PropertyBreakdown table component"
```

---

## Task 5: OccupancyCalendar Component

**Files:**
- Create: `apps/web/src/components/portal/OccupancyCalendar.tsx`

Server component. Renders a mini month grid with booked dates highlighted.

- [ ] **Step 1: Create the component**

```tsx
// apps/web/src/components/portal/OccupancyCalendar.tsx

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Build a Set of ISO date strings (YYYY-MM-DD) that fall within
 * any of the given booking ranges.
 */
function buildBookedSet(
  bookings: { check_in: string; check_out: string }[],
  year: number,
  month: number,
): Set<string> {
  const booked = new Set<string>();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0); // last day of month

  for (const b of bookings) {
    const ci = new Date(b.check_in);
    const co = new Date(b.check_out);
    // Walk each day of the booking that overlaps this month
    const start = ci < monthStart ? monthStart : ci;
    const end = co > monthEnd ? monthEnd : co;
    const cursor = new Date(start);
    while (cursor <= end) {
      const iso = cursor.toISOString().slice(0, 10);
      booked.add(iso);
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return booked;
}

export function OccupancyCalendar({
  bookings,
  year,
  month,
}: {
  bookings: { check_in: string; check_out: string }[];
  /** 4-digit year */
  year: number;
  /** 0-indexed month (0 = January) */
  month: number;
}) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = firstDay.getDay(); // 0=Sun
  const today = new Date().toISOString().slice(0, 10);

  const booked = buildBookedSet(bookings, year, month);

  const monthLabel = firstDay.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Build grid cells: leading blanks + day numbers
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <section
      className="rounded-2xl border p-5"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
    >
      <h3
        className="mb-4 text-[15px] font-semibold tracking-tight"
        style={{ color: "var(--color-text-primary)" }}
      >
        {monthLabel} occupancy
      </h3>

      {/* Day-of-week header */}
      <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-semibold uppercase tracking-[0.08em]"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {DAY_LABELS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Date grid */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`blank-${i}`} />;
          }
          const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isBooked = booked.has(iso);
          const isToday = iso === today;

          return (
            <div
              key={iso}
              className="flex h-9 items-center justify-center rounded-lg text-xs font-medium tabular-nums transition-colors duration-150"
              style={{
                backgroundColor: isBooked
                  ? "var(--color-brand)"
                  : "transparent",
                color: isBooked
                  ? "#ffffff"
                  : isToday
                    ? "var(--color-brand)"
                    : "var(--color-text-secondary)",
                fontWeight: isToday ? 700 : 500,
                outline: isToday && !isBooked
                  ? "2px solid var(--color-brand)"
                  : undefined,
                outlineOffset: isToday && !isBooked ? "-2px" : undefined,
              }}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        className="mt-4 flex items-center gap-4 text-[11px]"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded"
            style={{ backgroundColor: "var(--color-brand)" }}
          />
          Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded"
            style={{ backgroundColor: "var(--color-warm-gray-100)" }}
          />
          Available
        </span>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd /Users/johanannunez/workspace/parcel && pnpm --filter web exec tsc --noEmit --pretty 2>&1 | head -20`

Expected: No errors mentioning `OccupancyCalendar.tsx`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/portal/OccupancyCalendar.tsx
git commit -m "feat: add OccupancyCalendar mini month-grid component"
```

---

## Task 6: Payout Generation Endpoint

**Files:**
- Create: `apps/web/src/app/api/admin/generate-payouts/route.ts`

Admin-only POST endpoint. Uses the service role client to read all bookings and upsert monthly payout records.

- [ ] **Step 1: Create the route handler**

```ts
// apps/web/src/app/api/admin/generate-payouts/route.ts

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * POST /api/admin/generate-payouts
 *
 * Aggregates non-cancelled bookings into monthly payout records per
 * property, grouped by the calendar month of check_out. Idempotent:
 * uses ON CONFLICT to upsert existing rows.
 *
 * Admin-only. Checks the caller's profile role before proceeding.
 */
export async function POST() {
  // --- Auth check: must be admin ---
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // --- Fetch all non-cancelled bookings ---
  const service = createServiceClient();
  const { data: bookings, error: bookingsError } = await service
    .from("bookings")
    .select("property_id, check_out, total_amount")
    .neq("status", "cancelled");

  if (bookingsError) {
    return Response.json(
      { error: "Failed to fetch bookings", detail: bookingsError.message },
      { status: 500 },
    );
  }

  if (!bookings || bookings.length === 0) {
    return Response.json({ message: "No bookings found", upserted: 0 });
  }

  // --- Group by property_id + month of check_out ---
  const groups = new Map<
    string,
    { propertyId: string; periodStart: string; periodEnd: string; total: number }
  >();

  for (const b of bookings) {
    const co = new Date(b.check_out);
    const y = co.getFullYear();
    const m = co.getMonth();
    const periodStart = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const periodEnd = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    const key = `${b.property_id}::${periodStart}`;

    const existing = groups.get(key);
    if (existing) {
      existing.total += Number(b.total_amount ?? 0);
    } else {
      groups.set(key, {
        propertyId: b.property_id,
        periodStart,
        periodEnd,
        total: Number(b.total_amount ?? 0),
      });
    }
  }

  // --- Upsert into payouts ---
  const rows = Array.from(groups.values()).map((g) => ({
    property_id: g.propertyId,
    period_start: g.periodStart,
    period_end: g.periodEnd,
    gross_revenue: g.total,
    fees: 0,
    net_payout: g.total,
  }));

  const { error: upsertError } = await service
    .from("payouts")
    .upsert(rows, {
      onConflict: "property_id,period_start",
      ignoreDuplicates: false,
    });

  if (upsertError) {
    return Response.json(
      { error: "Upsert failed", detail: upsertError.message },
      { status: 500 },
    );
  }

  return Response.json({
    message: "Payouts generated successfully",
    upserted: rows.length,
  });
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd /Users/johanannunez/workspace/parcel && pnpm --filter web exec tsc --noEmit --pretty 2>&1 | head -20`

Expected: No errors mentioning `generate-payouts`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/api/admin/generate-payouts/route.ts
git commit -m "feat: add admin endpoint to generate monthly payouts from bookings"
```

---

## Task 7: Dashboard Page Rewrite

**Files:**
- Modify: `apps/web/src/app/(portal)/portal/dashboard/page.tsx` (full rewrite)

This is the largest task. The dashboard page gets period-aware queries, restructured metric cards (4 primary + 3 secondary), and the property breakdown table.

- [ ] **Step 1: Rewrite the dashboard page**

Replace the entire contents of `apps/web/src/app/(portal)/portal/dashboard/page.tsx` with:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarCheck,
  ChartLineUp,
  CurrencyDollar,
  House,
  Moon,
  Wallet,
  Buildings,
  Plus,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { MetricCard } from "@/components/portal/MetricCard";
import { PeriodSwitcher } from "@/components/portal/PeriodSwitcher";
import {
  PropertyBreakdown,
  type PropertyRow,
} from "@/components/portal/PropertyBreakdown";
import {
  UpcomingBookings,
  type UpcomingBookingRow,
} from "@/components/portal/UpcomingBookings";
import { currency0 } from "@/lib/format";
import { parsePeriod, periodRange, PERIOD_LABELS } from "@/lib/periods";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

function greetingFor(date: Date) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolved = await searchParams;
  const periodKey = parsePeriod(
    typeof resolved.period === "string" ? resolved.period : undefined,
  );
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date();
  const todayIso = isoDate(today);
  const { start: periodStart, end: periodEnd, label: periodLabel } = periodRange(periodKey, today);
  const thirtyDaysAhead = isoDate(
    new Date(today.getTime() + 30 * 86400000),
  );

  // ------ Parallel queries ------
  const [
    profileResult,
    propertiesResult,
    periodBookingsResult,
    upcomingBookingsResult,
    pendingPayoutsResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single(),
    supabase
      .from("properties")
      .select("id, name, address_line1, city, active"),
    supabase
      .from("bookings")
      .select("property_id, check_in, check_out, total_amount, nights")
      .gte("check_in", periodStart)
      .lte("check_in", periodEnd)
      .neq("status", "cancelled"),
    supabase
      .from("bookings")
      .select(
        "id, guest_name, check_in, check_out, source, status, property_id",
      )
      .gte("check_in", todayIso)
      .lte("check_in", thirtyDaysAhead)
      .neq("status", "cancelled")
      .order("check_in", { ascending: true })
      .limit(5),
    supabase
      .from("payouts")
      .select("net_payout")
      .is("paid_at", null),
  ]);

  const properties = propertiesResult.data ?? [];
  const propertyNameById = new Map(
    properties.map((p) => [
      p.id,
      p.name ?? p.address_line1 ?? `${p.city ?? "Property"}`,
    ]),
  );
  const totalProperties = properties.length;
  const activeListings = properties.filter((p) => p.active).length;

  const periodBookings = periodBookingsResult.data ?? [];

  // ------ Aggregate metrics ------
  let totalRevenue = 0;
  let totalNights = 0;

  // Per-property accumulators
  const propRevenue = new Map<string, number>();
  const propNights = new Map<string, number>();

  for (const b of periodBookings) {
    const amt = Number(b.total_amount ?? 0);
    totalRevenue += amt;

    // Compute nights from dates if the nights column is null
    let n = Number(b.nights ?? 0);
    if (n <= 0 && b.check_in && b.check_out) {
      n = Math.max(
        0,
        Math.round(
          (new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) /
            86400000,
        ),
      );
    }
    totalNights += n;

    propRevenue.set(
      b.property_id,
      (propRevenue.get(b.property_id) ?? 0) + amt,
    );
    propNights.set(
      b.property_id,
      (propNights.get(b.property_id) ?? 0) + n,
    );
  }

  const avgNightly =
    totalNights > 0 ? Math.round(totalRevenue / totalNights) : null;

  // Occupancy: booked nights / (active properties * days in period)
  const daysInPeriod = Math.max(
    1,
    Math.round(
      (new Date(periodEnd).getTime() - new Date(periodStart).getTime()) /
        86400000,
    ) + 1,
  );
  const occupancyDenom = activeListings * daysInPeriod;
  const occupancyRate =
    occupancyDenom > 0
      ? Math.round((totalNights / occupancyDenom) * 100)
      : null;

  // Pending payouts
  const pendingPayouts = (pendingPayoutsResult.data ?? []).reduce(
    (sum, row) => sum + Number(row.net_payout ?? 0),
    0,
  );

  // Upcoming bookings
  const upcomingRows: UpcomingBookingRow[] = (
    upcomingBookingsResult.data ?? []
  ).map((b) => ({
    id: b.id,
    guestName: b.guest_name,
    propertyName: propertyNameById.get(b.property_id) ?? "Property",
    checkIn: b.check_in,
    checkOut: b.check_out,
    source: b.source,
    status: b.status,
  }));

  // Property breakdown rows
  const propertyRows: PropertyRow[] = properties
    .map((p) => {
      const rev = propRevenue.get(p.id) ?? 0;
      const nts = propNights.get(p.id) ?? 0;
      const propOccDenom = p.active ? daysInPeriod : 0;
      return {
        id: p.id,
        name: p.name ?? p.address_line1 ?? p.city ?? "Property",
        revenue: rev,
        occupancyPct:
          propOccDenom > 0 ? Math.round((nts / propOccDenom) * 100) : null,
        nights: nts,
        avgNightly: nts > 0 ? Math.round(rev / nts) : null,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const firstName =
    profileResult.data?.full_name?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "there";

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <header>
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Owner dashboard
        </p>
        <h1
          className="mt-2 text-[34px] font-semibold leading-tight tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          {greetingFor(today)}, {firstName}.
        </h1>
        <p
          className="mt-2 max-w-2xl text-base"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Here is how your portfolio is performing right now. Bookings,
          revenue, and payouts update the moment a reservation hits Parcel.
        </p>
      </header>

      {/* Empty state for zero properties */}
      {totalProperties === 0 ? (
        <section
          className="flex flex-col gap-5 rounded-2xl border p-8 lg:flex-row lg:items-center lg:justify-between"
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-warm-gray-200)",
          }}
        >
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              First step
            </p>
            <h2
              className="mt-1 text-xl font-semibold tracking-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              Add your first property
            </h2>
            <p
              className="mt-1.5 max-w-md text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Five quick questions and your portfolio lights up. Bookings,
              payouts, and connections all flow from here.
            </p>
          </div>
          <Link
            href="/portal/setup/basics"
            className="inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--color-brand)" }}
          >
            <Plus size={16} weight="bold" />
            Add a property
            <ArrowRight size={14} weight="bold" />
          </Link>
        </section>
      ) : null}

      {/* Period switcher */}
      <PeriodSwitcher active={periodKey} />

      {/* Primary metric cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total revenue"
          value={currency0.format(totalRevenue)}
          hint={periodLabel}
          icon={<CurrencyDollar size={20} weight="duotone" />}
          tone="success"
        />
        <MetricCard
          label="Occupancy rate"
          value={occupancyRate === null ? "\u2014" : `${occupancyRate}%`}
          hint={`Across ${activeListings} ${activeListings === 1 ? "property" : "properties"}`}
          icon={<ChartLineUp size={20} weight="duotone" />}
          tone="brand"
        />
        <MetricCard
          label="Upcoming bookings"
          value={String(upcomingRows.length)}
          hint="Next 30 days"
          icon={<CalendarCheck size={20} weight="duotone" />}
          tone="success"
        />
        <MetricCard
          label="Avg nightly rate"
          value={avgNightly !== null ? currency0.format(avgNightly) : "\u2014"}
          hint="Per booked night"
          icon={<Moon size={20} weight="duotone" />}
          tone="brand"
        />
      </section>

      {/* Secondary stat cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CompactStat
          icon={<House size={16} weight="duotone" />}
          label="Active listings"
          value={String(activeListings)}
          hint={`of ${totalProperties}`}
          tone="neutral"
        />
        <CompactStat
          icon={<Wallet size={16} weight="duotone" />}
          label="Pending payouts"
          value={currency0.format(pendingPayouts)}
          tone="amber"
        />
        <CompactStat
          icon={<Buildings size={16} weight="duotone" />}
          label="Total properties"
          value={String(totalProperties)}
          tone="neutral"
        />
      </section>

      {/* Property breakdown */}
      <PropertyBreakdown
        rows={propertyRows}
        periodLabel={PERIOD_LABELS[periodKey]}
      />

      {/* Upcoming bookings */}
      <UpcomingBookings rows={upcomingRows} />
    </div>
  );
}

// ---- Compact stat card (secondary row) ----

function CompactStat({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone: "neutral" | "amber";
}) {
  const toneMap = {
    neutral: { bg: "rgba(118, 113, 112, 0.10)", fg: "#4b4948" },
    amber: { bg: "rgba(245, 158, 11, 0.12)", fg: "#b45309" },
  };
  const t = toneMap[tone];
  return (
    <div
      className="flex items-center gap-3.5 rounded-2xl border px-5 py-4"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
    >
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ backgroundColor: t.bg, color: t.fg }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div
          className="text-[10px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          {label}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-lg font-semibold tabular-nums"
            style={{ color: "var(--color-text-primary)" }}
          >
            {value}
          </span>
          {hint ? (
            <span
              className="text-xs"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {hint}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the build passes**

Run: `cd /Users/johanannunez/workspace/parcel && pnpm --filter web build 2>&1 | tail -30`

Expected: Build succeeds with no errors. The dashboard route should appear in the output.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/\(portal\)/portal/dashboard/page.tsx
git commit -m "feat: dashboard with time period switcher, property breakdown, and restructured metrics"
```

---

## Task 8: Property Detail Page Updates

**Files:**
- Modify: `apps/web/src/app/(portal)/portal/properties/[id]/page.tsx`

Two changes: (1) replace single "Revenue this year" InfoCard with 3-card revenue row, (2) add OccupancyCalendar between revenue row and bookings/payouts panels.

- [ ] **Step 1: Add the OccupancyCalendar import and occupancy query**

At the top of the file, add the import alongside the existing ones:

```tsx
import { OccupancyCalendar } from "@/components/portal/OccupancyCalendar";
```

In the `Promise.all` array inside the component, add a new query after `payouts`. This fetches bookings that overlap the current month for the occupancy calendar:

```ts
    supabase
      .from("bookings")
      .select("check_in, check_out")
      .eq("property_id", id)
      .gte("check_out", `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`)
      .lte("check_in", `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()).padStart(2, "0")}`)
      .neq("status", "cancelled"),
```

Update the destructured result to include this sixth query:

```ts
  const [
    { data: property },
    { data: recentBookings },
    { data: nextStay },
    { data: ytdBookings },
    { data: payouts },
    { data: calendarBookings },
  ] = await Promise.all([
```

- [ ] **Step 2: Add month bookings query and revenue row**

After the `ytdRevenue` computation, add this month's revenue and booking count:

```ts
  const monthStart = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;
  const thisMonthRevenue = (ytdBookings ?? [])
    .filter((b) => (b as { check_in?: string }).check_in !== undefined)
    .reduce((s, b) => s + Number(b.total_amount ?? 0), 0);
```

Actually, we need a cleaner approach. We should add a separate query for this month's bookings. Let me revise.

Add another query to the Promise.all for this month specifically:

```ts
    supabase
      .from("bookings")
      .select("total_amount")
      .eq("property_id", id)
      .gte("check_in", `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`)
      .lte("check_in", todayIso)
      .neq("status", "cancelled"),
```

And update destructuring to 7 results:

```ts
  const [
    { data: property },
    { data: recentBookings },
    { data: nextStay },
    { data: ytdBookings },
    { data: payouts },
    { data: calendarBookings },
    { data: monthBookings },
  ] = await Promise.all([
```

Compute the new values after `ytdRevenue`:

```ts
  const thisMonthRevenue = (monthBookings ?? []).reduce(
    (s, b) => s + Number(b.total_amount ?? 0),
    0,
  );
  const totalBookingsCount = (recentBookings ?? []).length;
```

Wait, `recentBookings` is limited to 10. We need total count. Let me add a count query instead. Actually, let's keep it simple: use the existing `ytdBookings` for the count since it's scoped to this year and has no limit. For an all-time count we'd need another query. YTD bookings count is good enough and meaningful.

```ts
  const ytdBookingsCount = (ytdBookings ?? []).length;
```

- [ ] **Step 3: Replace the InfoCard row and add calendar**

This is the actual edit. Replace the three-column `InfoCard` section (lines 169-189 in the current file) with:

Replace:
```tsx
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <InfoCard
          icon={<House size={18} weight="duotone" />}
          label="Next stay"
          value={
            nextStay
              ? `${nextStay.guest_name ?? "Guest"} on ${formatMedium(nextStay.check_in)}`
              : "Nothing booked"
          }
        />
        <InfoCard
          icon={<Wallet size={18} weight="duotone" />}
          label="Revenue this year"
          value={currency0.format(ytdRevenue)}
        />
        <InfoCard
          icon={<CalendarBlank size={18} weight="duotone" />}
          label="Listed"
          value={formatRelative(property.created_at)}
        />
      </section>
```

With:
```tsx
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          icon={<House size={18} weight="duotone" />}
          label="Next stay"
          value={
            nextStay
              ? `${nextStay.guest_name ?? "Guest"} on ${formatMedium(nextStay.check_in)}`
              : "Nothing booked"
          }
        />
        <InfoCard
          icon={<Wallet size={18} weight="duotone" />}
          label="Revenue YTD"
          value={currency0.format(ytdRevenue)}
        />
        <InfoCard
          icon={<CurrencyDollar size={18} weight="duotone" />}
          label="This month"
          value={currency0.format(thisMonthRevenue)}
        />
        <InfoCard
          icon={<CalendarBlank size={18} weight="duotone" />}
          label="Bookings YTD"
          value={String(ytdBookingsCount)}
        />
      </section>

      <OccupancyCalendar
        bookings={calendarBookings ?? []}
        year={new Date().getFullYear()}
        month={new Date().getMonth()}
      />
```

Add `CurrencyDollar` to the Phosphor imports at the top of the file (it's not currently imported there).

- [ ] **Step 4: Full file edit**

To avoid ambiguity, here is the complete rewrite of the property detail page. Replace the entire file:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bed,
  Bathtub,
  Users as UsersIcon,
  Ruler,
  MapPin,
  CalendarBlank,
  CurrencyDollar,
  Wallet,
  FileText,
  House,
} from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { OccupancyCalendar } from "@/components/portal/OccupancyCalendar";
import { propertyTypeLongLabels } from "@/lib/labels";
import { currency0, formatMedium, formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Property" };
export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function PropertyDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const yearStart = `${now.getFullYear()}-01-01`;
  const calMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const calMonthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, "0")}`;

  const [
    { data: property },
    { data: recentBookings },
    { data: nextStay },
    { data: ytdBookings },
    { data: payouts },
    { data: calendarBookings },
    { data: monthBookings },
  ] = await Promise.all([
    supabase.from("properties").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("bookings")
      .select(
        "id, guest_name, check_in, check_out, source, status, total_amount",
      )
      .eq("property_id", id)
      .order("check_in", { ascending: false })
      .limit(10),
    supabase
      .from("bookings")
      .select("id, guest_name, check_in")
      .eq("property_id", id)
      .gte("check_in", todayIso)
      .neq("status", "cancelled")
      .order("check_in", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("bookings")
      .select("total_amount")
      .eq("property_id", id)
      .gte("check_in", yearStart)
      .neq("status", "cancelled"),
    supabase
      .from("payouts")
      .select("id, period_start, period_end, net_payout, paid_at")
      .eq("property_id", id)
      .order("period_start", { ascending: false })
      .limit(6),
    supabase
      .from("bookings")
      .select("check_in, check_out")
      .eq("property_id", id)
      .gte("check_out", calMonthStart)
      .lte("check_in", calMonthEnd)
      .neq("status", "cancelled"),
    supabase
      .from("bookings")
      .select("total_amount")
      .eq("property_id", id)
      .gte("check_in", calMonthStart)
      .lte("check_in", calMonthEnd)
      .neq("status", "cancelled"),
  ]);

  if (!property) notFound();

  const title = property.name?.trim() || property.address_line1;
  const ytdRevenue = (ytdBookings ?? []).reduce(
    (s, b) => s + Number(b.total_amount ?? 0),
    0,
  );
  const thisMonthRevenue = (monthBookings ?? []).reduce(
    (s, b) => s + Number(b.total_amount ?? 0),
    0,
  );
  const ytdBookingsCount = (ytdBookings ?? []).length;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <Link
          href="/portal/properties"
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <ArrowLeft size={14} weight="bold" />
          Back to properties
        </Link>
      </div>

      <header className="flex flex-col-reverse gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span
            className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{
              backgroundColor: "var(--color-warm-gray-100)",
              color: "var(--color-text-secondary)",
            }}
          >
            {propertyTypeLongLabels[property.property_type] ?? property.property_type}
          </span>
          <h1
            className="mt-3 text-[34px] font-semibold leading-tight tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            {title}
          </h1>
          <div
            className="mt-2 flex items-center gap-1.5 text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <MapPin size={14} weight="duotone" />
            {property.address_line1}
            {property.address_line2 ? `, ${property.address_line2}` : ""},{" "}
            {property.city}, {property.state} {property.postal_code}
          </div>
        </div>
        <span
          className="inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            backgroundColor: property.active
              ? "rgba(22, 163, 74, 0.12)"
              : "rgba(118, 113, 112, 0.12)",
            color: property.active ? "#15803d" : "#4b4948",
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: property.active ? "#16a34a" : "#767170",
            }}
          />
          {property.active ? "Active" : "Paused"}
        </span>
      </header>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile
          icon={<Bed size={18} weight="duotone" />}
          label="Bedrooms"
          value={property.bedrooms?.toString() ?? "\u2014"}
        />
        <StatTile
          icon={<Bathtub size={18} weight="duotone" />}
          label="Bathrooms"
          value={property.bathrooms?.toString() ?? "\u2014"}
        />
        <StatTile
          icon={<UsersIcon size={18} weight="duotone" />}
          label="Guests"
          value={property.guest_capacity?.toString() ?? "\u2014"}
        />
        <StatTile
          icon={<Ruler size={18} weight="duotone" />}
          label="Square feet"
          value={property.square_feet?.toLocaleString() ?? "\u2014"}
        />
      </section>

      {/* Revenue summary row */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          icon={<House size={18} weight="duotone" />}
          label="Next stay"
          value={
            nextStay
              ? `${nextStay.guest_name ?? "Guest"} on ${formatMedium(nextStay.check_in)}`
              : "Nothing booked"
          }
        />
        <InfoCard
          icon={<Wallet size={18} weight="duotone" />}
          label="Revenue YTD"
          value={currency0.format(ytdRevenue)}
        />
        <InfoCard
          icon={<CurrencyDollar size={18} weight="duotone" />}
          label="This month"
          value={currency0.format(thisMonthRevenue)}
        />
        <InfoCard
          icon={<CalendarBlank size={18} weight="duotone" />}
          label="Bookings YTD"
          value={String(ytdBookingsCount)}
        />
      </section>

      {/* Occupancy calendar */}
      <OccupancyCalendar
        bookings={calendarBookings ?? []}
        year={now.getFullYear()}
        month={now.getMonth()}
      />

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          title="Recent bookings"
          href="/portal/calendar"
          linkLabel="Open calendar"
        >
          {(recentBookings ?? []).length === 0 ? (
            <PanelEmpty
              icon={<CalendarBlank size={22} weight="duotone" />}
              text="No bookings yet for this property."
            />
          ) : (
            <ul className="flex flex-col">
              {(recentBookings ?? []).slice(0, 5).map((b, i) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between py-3"
                  style={{
                    borderTop:
                      i === 0
                        ? undefined
                        : "1px solid var(--color-warm-gray-100)",
                  }}
                >
                  <div className="min-w-0">
                    <div
                      className="truncate text-sm font-semibold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {b.guest_name ?? "Guest"}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {formatMedium(b.check_in)} to {formatMedium(b.check_out)}
                    </div>
                  </div>
                  <div
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {b.total_amount ? currency0.format(Number(b.total_amount)) : "\u2014"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Recent payouts"
          href="/portal/payouts"
          linkLabel="Open payouts"
        >
          {(payouts ?? []).length === 0 ? (
            <PanelEmpty
              icon={<Wallet size={22} weight="duotone" />}
              text="No payouts recorded for this property yet."
            />
          ) : (
            <ul className="flex flex-col">
              {(payouts ?? []).map((p, i) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between py-3"
                  style={{
                    borderTop:
                      i === 0
                        ? undefined
                        : "1px solid var(--color-warm-gray-100)",
                  }}
                >
                  <div className="min-w-0">
                    <div
                      className="text-sm font-semibold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {formatMedium(p.period_start)} to {formatMedium(p.period_end)}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {p.paid_at ? `Paid ${formatMedium(p.paid_at)}` : "Awaiting transfer"}
                    </div>
                  </div>
                  <div
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {currency0.format(Number(p.net_payout))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>

      <Panel title="Documents" linkLabel="" href="">
        <PanelEmpty
          icon={<FileText size={22} weight="duotone" />}
          text="Document storage arrives with the onboarding flow. Your leases, insurance, and tax forms will live here."
        />
      </Panel>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
    >
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
        style={{
          backgroundColor: "var(--color-warm-gray-100)",
          color: "var(--color-text-primary)",
        }}
      >
        {icon}
      </span>
      <div
        className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {label}
      </div>
      <div
        className="mt-1 text-2xl font-semibold tabular-nums"
        style={{ color: "var(--color-text-primary)" }}
      >
        {value}
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex items-center gap-4 rounded-2xl border p-5"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
    >
      <span
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
        style={{
          backgroundColor: "rgba(2, 170, 235, 0.10)",
          color: "#0c6fae",
        }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div
          className="text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          {label}
        </div>
        <div
          className="truncate text-sm font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl border p-6"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
    >
      <header className="mb-2 flex items-center justify-between">
        <h2
          className="text-base font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          {title}
        </h2>
        {href && linkLabel ? (
          <Link
            href={href}
            className="text-xs font-medium transition-opacity hover:opacity-80"
            style={{ color: "var(--color-brand)" }}
          >
            {linkLabel}
          </Link>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function PanelEmpty({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div
      className="flex flex-col items-center gap-3 py-8 text-center text-sm"
      style={{ color: "var(--color-text-secondary)" }}
    >
      <span
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{
          backgroundColor: "var(--color-warm-gray-100)",
          color: "var(--color-text-primary)",
        }}
      >
        {icon}
      </span>
      <p className="max-w-sm">{text}</p>
    </div>
  );
}
```

- [ ] **Step 5: Verify the build passes**

Run: `cd /Users/johanannunez/workspace/parcel && pnpm --filter web build 2>&1 | tail -30`

Expected: Build succeeds. Both `/portal/dashboard` and `/portal/properties/[id]` routes should appear.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/\(portal\)/portal/properties/\[id\]/page.tsx
git commit -m "feat: property detail with revenue summary row and occupancy calendar"
```

---

## Task 9: Generate Payouts and Verify

This is the manual verification step after all code is deployed.

- [ ] **Step 1: Run the SQL migration (Task 1) if not already done**

- [ ] **Step 2: Start the dev server**

Run: `cd /Users/johanannunez/workspace/parcel && pnpm --filter web dev`

- [ ] **Step 3: Trigger payout generation**

Open a new terminal and run:

```bash
curl -X POST http://localhost:3001/api/admin/generate-payouts \
  -H "Cookie: $(cat apps/web/.env.local | grep -v '#' | xargs)" \
  2>&1
```

Or easier: visit the endpoint from the browser while logged in as admin. Navigate to any portal page first to establish the session cookie, then open the browser console and run:

```js
fetch('/api/admin/generate-payouts', { method: 'POST' }).then(r => r.json()).then(console.log)
```

Expected: `{ "message": "Payouts generated successfully", "upserted": N }` where N is the number of property-month combinations.

- [ ] **Step 4: Verify dashboard**

Navigate to `http://localhost:3001/portal/dashboard`. Confirm:
- Period pills appear (This month, Last month, Last 90 days, Year to date)
- Clicking each pill changes the metrics
- Property breakdown table shows per-property revenue
- Pending payouts card shows a non-zero amount

- [ ] **Step 5: Verify payouts page**

Navigate to `http://localhost:3001/portal/payouts`. Confirm:
- Summary cards show YTD earnings, pending amount, last payout
- Table shows monthly payout rows with property names, amounts, "Pending" status

- [ ] **Step 6: Verify property detail**

Navigate to `http://localhost:3001/portal/properties/{any-property-id}`. Confirm:
- Revenue row shows 4 cards: Next stay, Revenue YTD, This month, Bookings YTD
- Occupancy calendar shows current month with booked dates highlighted in blue
- Recent payouts panel shows payout rows

- [ ] **Step 7: Final commit**

If any fixes were needed, commit them:

```bash
git add -A
git commit -m "fix: post-verification adjustments for metrics and financials"
```
