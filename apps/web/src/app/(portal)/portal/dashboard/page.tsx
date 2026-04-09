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
import { RevenueChart } from "@/components/portal/RevenueChart";
import {
  PropertyBreakdown,
  type PropertyRow,
} from "@/components/portal/PropertyBreakdown";
import {
  UpcomingBookings,
  type UpcomingBookingRow,
} from "@/components/portal/UpcomingBookings";
import { currency0 } from "@/lib/format";
import {
  parseDashboardParams,
  periodRange,
  PERIOD_LABELS,
  MONTH_LABELS,
  type DashboardParams,
} from "@/lib/periods";
import {
  groupByMonth,
  buildComparisonData,
  type MonthlyRevenue,
  type ComparisonRevenue,
} from "@/lib/chart-utils";

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
  const params = parseDashboardParams(resolved);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date();
  const todayIso = isoDate(today);
  const thirtyDaysAhead = isoDate(new Date(today.getTime() + 30 * 86400000));

  // ------ Compute period range for standard/year modes ------
  let periodStart = "";
  let periodEnd = "";
  let periodLabel = "";

  if (params.mode === "standard") {
    const range = periodRange(params.period, today);
    periodStart = range.start;
    periodEnd = range.end;
    periodLabel = range.label;
  } else if (params.mode === "year") {
    const range = periodRange("year", today, { year: params.year });
    periodStart = range.start;
    periodEnd = range.end;
    periodLabel = range.label;
  }
  // compare mode builds per-year queries below

  // ------ Parallel queries (shared across all modes) ------
  const [
    profileResult,
    propertiesResult,
    upcomingBookingsResult,
    pendingPayoutsResult,
    yearsResult,
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
      .select(
        "id, guest_name, check_in, check_out, source, status, property_id",
      )
      .gte("check_in", todayIso)
      .lte("check_in", thirtyDaysAhead)
      .neq("status", "cancelled")
      .order("check_in", { ascending: true })
      .limit(5),
    supabase.from("payouts").select("net_payout").is("paid_at", null),
    // Get distinct years from bookings for the year pills
    supabase
      .from("bookings")
      .select("check_in")
      .neq("status", "cancelled"),
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

  // Derive available years from bookings
  const allBookingYears = new Set<number>();
  for (const b of yearsResult.data ?? []) {
    allBookingYears.add(new Date(b.check_in).getFullYear());
  }
  const availableYears = Array.from(allBookingYears).sort((a, b) => a - b);

  // ------ Mode-specific data fetching ------
  type BookingRow = {
    property_id: string;
    check_in: string;
    check_out: string;
    total_amount: number | null;
    nights: number | null;
  };

  let periodBookings: BookingRow[] = [];
  let chartData: { mode: "single"; data: MonthlyRevenue[] } | { mode: "compare"; data: ComparisonRevenue; years: number[] } | null = null;
  let compareDelta: { pct: number; label: string } | null = null;

  if (params.mode === "standard" || params.mode === "year") {
    // Single period query
    const { data } = await supabase
      .from("bookings")
      .select("property_id, check_in, check_out, total_amount, nights")
      .gte("check_in", periodStart)
      .lte("check_in", periodEnd)
      .neq("status", "cancelled");
    periodBookings = data ?? [];

    // For year mode, build monthly chart data
    if (params.mode === "year") {
      const monthly = groupByMonth(periodBookings);
      chartData = { mode: "single", data: monthly };
    }
  } else if (params.mode === "compare") {
    // Query each year's bookings for the target month
    const m = params.month;
    const bookingsByYear: Record<number, BookingRow[]> = {};

    const yearQueries = params.years.map(async (y) => {
      const mStart = `${y}-${String(m).padStart(2, "0")}-01`;
      const mEnd =
        m === 12
          ? `${y}-12-31`
          : `${y}-${String(m + 1).padStart(2, "0")}-01`;
      const { data } = await supabase
        .from("bookings")
        .select("property_id, check_in, check_out, total_amount, nights")
        .gte("check_in", mStart)
        .lt("check_in", mEnd)
        .neq("status", "cancelled");
      bookingsByYear[y] = data ?? [];
    });
    await Promise.all(yearQueries);

    // Use the most recent year as the "primary" for metric cards
    const newestYear = params.years[params.years.length - 1];
    periodBookings = bookingsByYear[newestYear] ?? [];
    periodLabel = `${MONTH_LABELS[m - 1]} ${newestYear}`;

    // Build comparison chart data
    const comparison = buildComparisonData(
      Object.fromEntries(
        Object.entries(bookingsByYear).map(([y, bs]) => [
          y,
          bs.map((b) => ({
            check_in: b.check_in,
            total_amount: b.total_amount,
          })),
        ]),
      ),
      m,
    );
    chartData = { mode: "compare", data: comparison, years: params.years };

    // Compute delta between newest and second-newest year
    if (params.years.length >= 2) {
      const prevYear = params.years[params.years.length - 2];
      const newestRev = comparison.byYear[newestYear] ?? 0;
      const prevRev = comparison.byYear[prevYear] ?? 0;
      if (prevRev > 0) {
        const pct = Math.round(((newestRev - prevRev) / prevRev) * 100);
        compareDelta = { pct, label: `vs ${prevYear}` };
      }
    }
  }

  // ------ Aggregate metrics from periodBookings ------
  let totalRevenue = 0;
  let totalNights = 0;
  const propRevenue = new Map<string, number>();
  const propNights = new Map<string, number>();

  for (const b of periodBookings) {
    const amt = Number(b.total_amount ?? 0);
    totalRevenue += amt;

    let n = Number(b.nights ?? 0);
    if (n <= 0 && b.check_in && b.check_out) {
      n = Math.max(
        0,
        Math.round(
          (new Date(b.check_out).getTime() -
            new Date(b.check_in).getTime()) /
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

  const daysInPeriod =
    periodStart && periodEnd
      ? Math.max(
          1,
          Math.round(
            (new Date(periodEnd).getTime() -
              new Date(periodStart).getTime()) /
              86400000,
          ) + 1,
        )
      : params.mode === "compare"
        ? new Date(
            params.years[params.years.length - 1],
            params.month,
            0,
          ).getDate()
        : 30;

  const occupancyDenom = activeListings * daysInPeriod;
  const occupancyRate =
    occupancyDenom > 0
      ? Math.round((totalNights / occupancyDenom) * 100)
      : null;

  const pendingPayouts = (pendingPayoutsResult.data ?? []).reduce(
    (sum, row) => sum + Number(row.net_payout ?? 0),
    0,
  );

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
          propOccDenom > 0
            ? Math.round((nts / propOccDenom) * 100)
            : null,
        nights: nts,
        avgNightly: nts > 0 ? Math.round(rev / nts) : null,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const firstName =
    profileResult.data?.full_name?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "there";

  // Build the period label for display
  const displayLabel =
    params.mode === "standard"
      ? periodLabel
      : params.mode === "year"
        ? String(params.year)
        : periodLabel;

  const breakdownLabel =
    params.mode === "standard"
      ? PERIOD_LABELS[params.period]
      : params.mode === "year"
        ? String(params.year)
        : `${MONTH_LABELS[params.month - 1]} ${params.years[params.years.length - 1]}`;

  // Chart title
  const chartTitle =
    chartData?.mode === "compare"
      ? `${MONTH_LABELS[params.mode === "compare" ? params.month - 1 : 0]} revenue by year`
      : params.mode === "year"
        ? `${params.year} monthly revenue`
        : "";

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
      <PeriodSwitcher params={params} availableYears={availableYears} />

      {/* Primary metric cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total revenue"
          value={currency0.format(totalRevenue)}
          hint={displayLabel}
          icon={<CurrencyDollar size={20} weight="duotone" />}
          tone="success"
          delta={compareDelta}
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
          value={
            avgNightly !== null ? currency0.format(avgNightly) : "\u2014"
          }
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

      {/* Revenue chart (year and compare modes) */}
      {chartData?.mode === "single" && (
        <RevenueChart
          mode="single"
          data={chartData.data}
          title={chartTitle}
        />
      )}
      {chartData?.mode === "compare" && (
        <RevenueChart
          mode="compare"
          data={chartData.data}
          years={chartData.years}
          title={chartTitle}
        />
      )}

      {/* Property breakdown */}
      <PropertyBreakdown rows={propertyRows} periodLabel={breakdownLabel} />

      {/* Upcoming bookings */}
      <UpcomingBookings rows={upcomingRows} />
    </div>
  );
}

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
