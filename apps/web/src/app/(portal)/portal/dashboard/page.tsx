import type { Metadata } from "next";
import {
  Buildings,
  CalendarCheck,
  ChartLineUp,
  CurrencyDollar,
  House,
  Wallet,
} from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { MetricCard } from "@/components/portal/MetricCard";
import {
  UpcomingBookings,
  type UpcomingBookingRow,
} from "@/components/portal/UpcomingBookings";

export const metadata: Metadata = {
  title: "Dashboard",
};

// Always render fresh on each request. The dashboard is a per-user
// authenticated view, so it must not be statically cached.
export const dynamic = "force-dynamic";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function greetingFor(date: Date) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const supabase = await createClient();

  // proxy.ts already gates this route, but we re-check so the rest of
  // the function can rely on a real user without `!`.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const today = new Date();
  const todayIso = isoDate(today);
  const monthStart = isoDate(new Date(today.getFullYear(), today.getMonth(), 1));
  const thirtyDaysAgo = isoDate(
    new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
  );
  const thirtyDaysAhead = isoDate(
    new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
  );

  // Fan out the data fetches in parallel. Each query is RLS-scoped to
  // the authenticated owner so we never have to filter by owner_id by
  // hand. Properties are pulled in full because we use the rows for
  // both the active count and the property name lookup in the table.
  const [
    profileResult,
    propertiesResult,
    upcomingBookingsResult,
    monthBookingsResult,
    occupancyBookingsResult,
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
      .select(
        "id, guest_name, check_in, check_out, source, status, property_id",
      )
      .gte("check_in", todayIso)
      .lte("check_in", thirtyDaysAhead)
      .neq("status", "cancelled")
      .order("check_in", { ascending: true })
      .limit(5),
    supabase
      .from("bookings")
      .select("total_amount")
      .gte("check_in", monthStart)
      .neq("status", "cancelled"),
    supabase
      .from("bookings")
      .select("check_in, check_out")
      .gte("check_out", thirtyDaysAgo)
      .lte("check_in", todayIso)
      .neq("status", "cancelled"),
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

  const monthlyRevenue = (monthBookingsResult.data ?? []).reduce(
    (sum, row) => sum + Number(row.total_amount ?? 0),
    0,
  );

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

  // Occupancy = booked nights in the trailing 30 days divided by
  // (active listings * 30). Falls back to null when there is nothing
  // to compute against, which the UI renders as a dash.
  const trailingNights = (occupancyBookingsResult.data ?? []).reduce(
    (sum, row) => {
      const start = new Date(
        row.check_in > thirtyDaysAgo ? row.check_in : thirtyDaysAgo,
      );
      const end = new Date(row.check_out > todayIso ? todayIso : row.check_out);
      const nights = Math.max(
        0,
        Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
      );
      return sum + nights;
    },
    0,
  );
  const occupancyDenom = activeListings * 30;
  const occupancyRate =
    occupancyDenom > 0
      ? Math.round((trailingNights / occupancyDenom) * 100)
      : null;

  const firstName =
    profileResult.data?.full_name?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "there";

  return (
    <div className="flex flex-col gap-10">
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

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Active listings"
          value={String(activeListings)}
          hint={`of ${totalProperties} total ${
            totalProperties === 1 ? "property" : "properties"
          }`}
          icon={<House size={20} weight="duotone" />}
          tone="brand"
        />
        <MetricCard
          label="Monthly revenue"
          value={currency.format(monthlyRevenue)}
          hint="Booked stays this month"
          icon={<CurrencyDollar size={20} weight="duotone" />}
          tone="success"
        />
        <MetricCard
          label="Occupancy rate"
          value={occupancyRate === null ? "—" : `${occupancyRate}%`}
          hint="Last 30 days"
          icon={<ChartLineUp size={20} weight="duotone" />}
          tone="brand"
        />
        <MetricCard
          label="Pending payouts"
          value={currency.format(pendingPayouts)}
          hint="Awaiting transfer"
          icon={<Wallet size={20} weight="duotone" />}
          tone="amber"
        />
        <MetricCard
          label="Properties"
          value={String(totalProperties)}
          hint="Across your portfolio"
          icon={<Buildings size={20} weight="duotone" />}
          tone="neutral"
        />
        <MetricCard
          label="Upcoming bookings"
          value={String(upcomingRows.length)}
          hint="Next 30 days"
          icon={<CalendarCheck size={20} weight="duotone" />}
          tone="success"
        />
      </section>

      <UpcomingBookings rows={upcomingRows} />
    </div>
  );
}
