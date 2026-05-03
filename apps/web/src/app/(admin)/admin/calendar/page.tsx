import type { Metadata } from "next";
import {
  CalendarCheck,
  Clock,
  HouseLine,
  Sparkle,
  Toolbox,
} from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Calendar",
};

export const dynamic = "force-dynamic";

type BookingRow = {
  id: string;
  guest_name: string | null;
  check_in: string;
  check_out: string;
  property_id: string | null;
  status: string | null;
  source: string | null;
};

type PropertyRow = {
  id: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
};

function propertyName(property: PropertyRow): string {
  return [
    property.address_line1,
    property.address_line2,
    property.city,
    property.state,
    property.postal_code,
  ]
    .filter((part): part is string => Boolean(part))
    .join(", ");
}

function shortDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function sourceLabel(source: string | null): string {
  return source ? source.replace(/_/g, " ") : "Direct";
}

export default async function AdminCalendarPage() {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();
  const monthEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).toISOString();

  const [bookingsThisMonth, upcomingCheckIns, pendingBlocks, totalBookings] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .gte("check_in", monthStart)
        .lte("check_in", monthEnd),
      supabase
        .from("bookings")
        .select(
          "id, guest_name, check_in, check_out, property_id, status, source",
        )
        .gte("check_in", now.toISOString())
        .order("check_in", { ascending: true })
        .limit(10)
        .returns<BookingRow[]>(),
      supabase
        .from("block_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase.from("bookings").select("*", { count: "exact", head: true }),
    ]);

  const propertyIds = [
    ...new Set(
      (upcomingCheckIns.data ?? [])
        .map((booking) => booking.property_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const { data: properties } = propertyIds.length
    ? await supabase
        .from("properties")
        .select("id, address_line1, address_line2, city, state, postal_code")
        .in("id", propertyIds)
        .returns<PropertyRow[]>()
    : { data: [] };

  const propertyMap = new Map(
    (properties ?? []).map((property) => [property.id, propertyName(property)]),
  );

  const monthName = now.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10 lg:py-14">
      <section
        className="overflow-hidden rounded-[18px] border p-6 shadow-[0_18px_48px_rgba(35,31,28,0.08)]"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(250,249,246,0.9))",
          borderColor: "var(--color-warm-gray-200)",
        }}
      >
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{
                borderColor: "var(--color-warm-gray-200)",
                color: "var(--color-text-tertiary)",
              }}
            >
              <CalendarCheck size={14} weight="duotone" />
              Operations calendar
            </div>
            <h1
              className="m-0 text-[34px] font-[760] leading-none lg:text-[48px]"
              style={{ color: "var(--color-text-primary)" }}
            >
              The schedule for every moving part.
            </h1>
            <p
              className="mt-4 text-sm leading-7"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Bookings, owner reservations, vendor work, and future Turno syncs
              belong here. Meetings now have their own relationship area.
            </p>
          </div>

          <div
            className="rounded-2xl border p-4"
            style={{
              backgroundColor: "var(--color-white)",
              borderColor: "var(--color-warm-gray-200)",
            }}
          >
            <div
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              <Sparkle size={14} weight="duotone" />
              Turno ready
            </div>
            <p
              className="mt-2 max-w-[280px] text-xs leading-6"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Vendor and maintenance work can land on this calendar without
              mixing into owner relationship meetings.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label={`Bookings in ${monthName.split(" ")[0]}`} value={String(bookingsThisMonth.count ?? 0)} />
        <StatCard label="Total bookings" value={String(totalBookings.count ?? 0)} />
        <StatCard label="Reservations to verify" value={String(pendingBlocks.count ?? 0)} />
        <StatCard label="Upcoming check ins" value={String(upcomingCheckIns.data?.length ?? 0)} />
      </section>

      <section
        className="mt-6 overflow-hidden rounded-2xl border"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: "var(--color-warm-gray-200)",
        }}
      >
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "var(--color-warm-gray-200)" }}
        >
          <h2
            className="m-0 flex items-center gap-2 text-sm font-[760]"
            style={{ color: "var(--color-text-primary)" }}
          >
            <Clock size={17} weight="duotone" />
            Next check ins
          </h2>
          <span
            className="text-xs font-semibold"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {upcomingCheckIns.data?.length ?? 0} scheduled
          </span>
        </div>

        {(upcomingCheckIns.data?.length ?? 0) > 0 ? (
          <div className="divide-y" style={{ borderColor: "var(--color-warm-gray-100)" }}>
            {upcomingCheckIns.data?.map((booking) => (
              <div
                key={booking.id}
                className="grid gap-4 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <div
                    className="text-sm font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {booking.guest_name || "Guest"}
                  </div>
                  <div
                    className="mt-1 flex flex-wrap items-center gap-3 text-xs"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <HouseLine size={13} weight="duotone" />
                      {booking.property_id
                        ? propertyMap.get(booking.property_id) ?? "Property"
                        : "Property"}
                    </span>
                    <span>
                      {shortDate(booking.check_in)} to {shortDate(booking.check_out)}
                    </span>
                  </div>
                </div>
                <span
                  className="w-fit rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em]"
                  style={{
                    backgroundColor: "var(--color-warm-gray-100)",
                    color: "var(--color-text-tertiary)",
                  }}
                >
                  {sourceLabel(booking.source)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid min-h-[220px] place-items-center px-6 py-10 text-center">
            <div>
              <span
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: "rgba(2, 170, 235, 0.08)",
                  color: "var(--color-brand)",
                }}
              >
                <Toolbox size={24} weight="duotone" />
              </span>
              <h3
                className="m-0 text-sm font-[760]"
                style={{ color: "var(--color-text-primary)" }}
              >
                No upcoming schedule items
              </h3>
              <p
                className="mx-auto mt-2 max-w-sm text-xs leading-6"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                Booking activity and vendor work will appear here as the
                operations calendar fills in.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-2xl border p-5 shadow-[0_12px_30px_rgba(35,31,28,0.05)]"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
    >
      <div
        className="text-[10px] font-bold uppercase tracking-[0.12em]"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {label}
      </div>
      <div
        className="mt-2 text-2xl font-[780]"
        style={{ color: "var(--color-text-primary)" }}
      >
        {value}
      </div>
    </div>
  );
}
