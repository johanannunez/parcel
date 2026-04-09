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
            {propertyTypeLongLabels[property.property_type] ??
              property.property_type}
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
            {property.address_line2
              ? `, ${property.address_line2}`
              : ""},{" "}
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
                      {formatMedium(b.check_in)} to{" "}
                      {formatMedium(b.check_out)}
                    </div>
                  </div>
                  <div
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {b.total_amount
                      ? currency0.format(Number(b.total_amount))
                      : "\u2014"}
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
                      {formatMedium(p.period_start)} to{" "}
                      {formatMedium(p.period_end)}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {p.paid_at
                        ? `Paid ${formatMedium(p.paid_at)}`
                        : "Awaiting transfer"}
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
