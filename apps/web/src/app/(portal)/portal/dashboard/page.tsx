import type { Metadata } from "next";
import Link from "next/link";
import {
  Buildings,
  CalendarCheck,
  FileText,
  ChatCircle,
  ClipboardText,
  ArrowRight,
  Plus,
  ArrowSquareOut,
} from "@phosphor-icons/react/dist/ssr";
import { getPortalContext } from "@/lib/portal-context";
import {
  UpcomingBookings,
  type UpcomingBookingRow,
} from "@/components/portal/UpcomingBookings";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const { userId, client } = await getPortalContext();

  const today = new Date();
  const todayIso = isoDate(today);
  const thirtyDaysAhead = isoDate(new Date(today.getTime() + 30 * 86400000));

  const { data: propertiesData } = await client
    .from("properties")
    .select("id, name, address_line1, city, active, property_type, bedrooms, bathrooms, guest_capacity")
    .eq("owner_id", userId);

  const properties = propertiesData ?? [];
  const propertyIds = properties.map((p) => p.id);

  // Bookings are linked to properties; scope via property IDs.
  const upcomingBookingsResult = propertyIds.length > 0
    ? await client
        .from("bookings")
        .select("id, guest_name, check_in, check_out, source, status, property_id")
        .in("property_id", propertyIds)
        .gte("check_in", todayIso)
        .lte("check_in", thirtyDaysAhead)
        .neq("status", "cancelled")
        .order("check_in", { ascending: true })
        .limit(5)
    : { data: [] };

  // Documents table may not exist yet (pending migration)
  let pendingDocs = 0;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (client as any)
      .from("documents")
      .select("id")
      .eq("owner_id", userId)
      .eq("status", "pending");
    pendingDocs = data?.length ?? 0;
  } catch {
    // table doesn't exist yet
  }

  const propertyNameById = new Map(
    properties.map((p) => [
      p.id,
      p.name ?? p.address_line1 ?? `${p.city ?? "Property"}`,
    ]),
  );
  const totalProperties = properties.length;
  const activeListings = properties.filter((p) => p.active).length;

  // Setup completion check
  const setupIncomplete =
    totalProperties === 0 ||
    properties.some(
      (p) =>
        !p.property_type ||
        !p.address_line1 ||
        !p.city ||
        p.bedrooms === null ||
        p.bathrooms === null ||
        p.guest_capacity === null,
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

  return (
    <div className="flex flex-col gap-10">
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
              Five quick questions and your portfolio lights up. Bookings and
              documents all flow from here.
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

      {/* Summary cards */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <SummaryCard
          icon={<Buildings size={18} weight="duotone" />}
          label="Properties"
          value={String(totalProperties)}
          hint={`${activeListings} active`}
          href="/portal/properties"
          tone="brand"
        />
        <SummaryCard
          icon={<CalendarCheck size={18} weight="duotone" />}
          label="Upcoming bookings"
          value={String(upcomingRows.length)}
          hint="Next 30 days"
          tone="success"
        />
        <SummaryCard
          icon={<FileText size={18} weight="duotone" />}
          label="Pending documents"
          value={String(pendingDocs)}
          hint={pendingDocs === 0 ? "All caught up" : "Action needed"}
          href="/portal/documents"
          tone={pendingDocs > 0 ? "amber" : "success"}
        />
        <SummaryCard
          icon={<ChatCircle size={18} weight="duotone" />}
          label="Messages"
          hint="Send us a message any time"
          href="/portal/messages"
          tone="neutral"
        />
      </section>

      {/* Setup progress banner */}
      {setupIncomplete && totalProperties > 0 ? (
        <Link
          href="/portal/setup"
          className="flex items-center justify-between gap-4 rounded-2xl border p-6 transition-colors hover:opacity-95"
          style={{
            backgroundColor: "rgba(2, 170, 235, 0.04)",
            borderColor: "rgba(2, 170, 235, 0.2)",
          }}
        >
          <div className="flex items-center gap-4">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: "linear-gradient(135deg, #02aaeb, #1b77be)",
              }}
            >
              <ClipboardText size={18} weight="fill" className="text-white" />
            </span>
            <div>
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Continue setting up your property
              </h3>
              <p
                className="mt-0.5 text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Pick up where you left off. Your progress is saved automatically.
              </p>
            </div>
          </div>
          <ArrowRight
            size={16}
            weight="bold"
            style={{ color: "var(--color-brand)" }}
          />
        </Link>
      ) : null}

      {/* Hospitable card */}
      <section
        className="flex flex-col gap-5 rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: "var(--color-warm-gray-200)",
        }}
      >
        <div className="flex items-center gap-4">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: "rgba(2, 170, 235, 0.10)",
              color: "#0c6fae",
            }}
          >
            <ArrowSquareOut size={20} weight="duotone" />
          </span>
          <div>
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              View your calendar, revenue, and guest messages
            </h3>
            <p
              className="mt-0.5 text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Your bookings and financials are managed through Hospitable, our
              channel management partner.
            </p>
          </div>
        </div>
        <Link
          href="/portal/hospitable"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{
            borderColor: "var(--color-warm-gray-200)",
            color: "var(--color-text-primary)",
            backgroundColor: "var(--color-white)",
          }}
        >
          Learn more
          <ArrowRight size={14} weight="bold" />
        </Link>
      </section>

      {/* Upcoming bookings */}
      <UpcomingBookings rows={upcomingRows} />
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  hint,
  href,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  hint: string;
  href?: string;
  tone: "brand" | "success" | "amber" | "neutral";
}) {
  const toneMap = {
    brand: { bg: "rgba(2, 170, 235, 0.10)", fg: "#0c6fae" },
    success: { bg: "rgba(22, 163, 74, 0.10)", fg: "#15803d" },
    amber: { bg: "rgba(245, 158, 11, 0.12)", fg: "#b45309" },
    neutral: { bg: "rgba(118, 113, 112, 0.10)", fg: "#4b4948" },
  };
  const t = toneMap[tone];

  const content = (
    <div
      className="flex flex-col gap-3 rounded-2xl border p-4 transition-colors sm:gap-4 sm:p-6"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: t.bg, color: t.fg }}
          aria-hidden="true"
        >
          {icon}
        </span>
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          {label}
        </span>
      </div>
      <div>
        {value !== undefined ? (
          <div
            className="text-xl font-semibold leading-none tracking-tight tabular-nums sm:text-[28px]"
            style={{ color: "var(--color-text-primary)" }}
          >
            {value}
          </div>
        ) : null}
        <div
          className={`text-sm ${value !== undefined ? "mt-1.5" : ""}`}
          style={{ color: "var(--color-text-secondary)" }}
        >
          {hint}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group hover:opacity-95">
        {content}
      </Link>
    );
  }

  return content;
}
