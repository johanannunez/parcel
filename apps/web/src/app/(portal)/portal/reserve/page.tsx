import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarBlank,
  CalendarCheck,
  CheckCircle,
  Clock,
} from "@phosphor-icons/react/dist/ssr";
import { getPortalContext } from "@/lib/portal-context";
import { normalizeUnit } from "@/lib/address";
import { EmptyState } from "@/components/portal/EmptyState";
import { ReservationsTable } from "./ReservationsTable";
import type { ReservationRow } from "./ReservationsTable";

export const metadata: Metadata = { title: "Reserve" };
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DATE_OPTS: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
const DATE_YEAR_OPTS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};

const _dateFmt     = new Intl.DateTimeFormat("en-US", DATE_OPTS);
const _dateYearFmt = new Intl.DateTimeFormat("en-US", DATE_YEAR_OPTS);

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end   + "T00:00:00");

  const sParts     = _dateFmt.formatToParts(s);
  const eParts     = _dateFmt.formatToParts(e);
  const sYearParts = _dateYearFmt.formatToParts(s);
  const eYearParts = _dateYearFmt.formatToParts(e);

  const get = (parts: Intl.DateTimeFormatPart[], type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const sMonth = get(sParts,     "month");
  const sDay   = get(sParts,     "day");
  const sYear  = get(sYearParts, "year");
  const eMonth = get(eParts,     "month");
  const eDay   = get(eParts,     "day");
  const eYear  = get(eYearParts, "year");

  if (sYear !== eYear)  return `${sMonth} ${sDay}, ${sYear} – ${eMonth} ${eDay}, ${eYear}`;
  if (sMonth === eMonth) return `${sMonth} ${sDay} – ${eDay}, ${eYear}`;
  return `${sMonth} ${sDay} – ${eMonth} ${eDay}, ${eYear}`;
}

function formatSingleDate(dateStr: string): string {
  return _dateFmt.format(new Date(dateStr + "T00:00:00"));
}

function formatTime(raw: string | null): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (/[AP]M/i.test(trimmed)) {
    return trimmed.replace(/\s*(AM|PM)\s*/i, (_, p: string) => ` ${p.toUpperCase()}`).trim();
  }
  const [hStr, mStr] = trimmed.split(":");
  const h      = parseInt(hStr ?? "0", 10);
  const m      = (mStr ?? "00").slice(0, 2);
  const period = h >= 12 ? "PM" : "AM";
  const h12    = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${period}`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ReservePage() {
  const { userId, client } = await getPortalContext();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0]!;

  const [{ data: rawProperties }, { data: rawRequests }] = await Promise.all([
    client
      .from("properties")
      .select("id, address_line1, address_line2, city, state, postal_code")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true }),
    client
      .from("block_requests")
      .select(
        "id, property_id, start_date, end_date, status, created_at, check_in_time, check_out_time, is_owner_staying, adults, children, pets, wants_cleaning",
      )
      .eq("owner_id", userId)
      .order("start_date", { ascending: true })
      .limit(50),
  ]);

  // Property map
  type PropertyRow = {
    id: string;
    name: string;
    unit: string | null;
    cityLine: string;
  };

  const propertyMap = new Map<string, PropertyRow>();
  (rawProperties ?? []).forEach((p) => {
    const rawUnit  = p.address_line2 as string | null | undefined;
    const cityLine = [p.city, p.state, p.postal_code].filter(Boolean).join(", ");
    propertyMap.set(p.id, {
      id:       p.id,
      name:     p.address_line1?.trim() || "Property",
      unit:     rawUnit ? normalizeUnit(rawUnit) : null,
      cityLine,
    });
  });

  if (propertyMap.size === 0) {
    return (
      <div className="flex flex-col gap-4">
        <EmptyState
          icon={<CalendarBlank size={26} weight="duotone" />}
          title="Reserve unlocks with your first property"
          body="Add a home and you'll be able to reserve time in it right here."
        />
      </div>
    );
  }

  const requests = rawRequests ?? [];

  // ---------------------------------------------------------------------------
  // Derived stats
  // ---------------------------------------------------------------------------

  const underReviewCount = requests.filter((r) => r.status === "pending").length;

  const completedCount = requests.filter(
    (r) =>
      r.status === "approved" &&
      typeof r.end_date === "string" &&
      r.end_date < todayStr,
  ).length;

  // Next confirmed upcoming stay
  const nextStayRaw =
    requests.find(
      (r) =>
        r.status === "approved" &&
        typeof r.start_date === "string" &&
        r.start_date >= todayStr,
    ) ?? null;

  const nextStayDaysAway =
    nextStayRaw?.start_date
      ? Math.max(
          0,
          Math.round(
            (new Date(nextStayRaw.start_date + "T00:00:00").getTime() -
              today.getTime()) /
              86_400_000,
          ),
        )
      : null;

  // Stat-card sub-details
  const nextPendingItem =
    requests.find((r) => r.status === "pending") ?? null;

  const nextPendingLine = nextPendingItem
    ? formatDateRange(nextPendingItem.start_date, nextPendingItem.end_date)
    : "None pending";

  const lastCompletedItem =
    [...requests]
      .filter(
        (r) =>
          r.status === "approved" &&
          typeof r.end_date === "string" &&
          r.end_date < todayStr,
      )
      .sort((a, b) =>
        (a.end_date as string) > (b.end_date as string) ? -1 : 1,
      )[0] ?? null;

  const lastCompletedLine = lastCompletedItem
    ? `Last: ${formatSingleDate(lastCompletedItem.end_date)}`
    : "None yet";

  // ---------------------------------------------------------------------------
  // Row serialisation
  // ---------------------------------------------------------------------------

  function toRow(
    r: (typeof requests)[number],
    isPast: boolean,
  ): ReservationRow {
    const prop     = propertyMap.get(r.property_id);
    const adults   = (r.adults   as number | null) ?? 0;
    const children = (r.children as number | null) ?? 0;
    const pets     = (r as { pets?: number | null }).pets ?? 0;

    const parts: string[] = [];
    if (adults   > 0) parts.push(`${adults}   ${adults   === 1 ? "adult"    : "adults"}`);
    if (children > 0) parts.push(`${children} ${children === 1 ? "child"    : "children"}`);
    if (pets     > 0) parts.push(`${pets}     ${pets     === 1 ? "pet"      : "pets"}`);

    const daysAway = isPast
      ? null
      : Math.max(
          0,
          Math.round(
            (new Date(r.start_date + "T00:00:00").getTime() - today.getTime()) /
              86_400_000,
          ),
        );

    return {
      id:             r.id,
      status:         r.status,
      propertyName:   prop?.name ?? "Property",
      propertyUnit:   prop?.unit ?? null,
      cityLine:       prop?.cityLine ?? "",
      checkInDate:    formatSingleDate(r.start_date),
      checkInTime:    r.check_in_time  ? formatTime(r.check_in_time)  : null,
      checkOutDate:   formatSingleDate(r.end_date),
      checkOutTime:   r.check_out_time ? formatTime(r.check_out_time) : null,
      guestLine:      parts.join(" · "),
      cleaning:       (r as { wants_cleaning?: boolean | null }).wants_cleaning ?? false,
      isOwnerStaying: (r.is_owner_staying as boolean | null) ?? true,
      daysAway,
    };
  }

  const upcomingRows: ReservationRow[] = requests
    .filter(
      (r) =>
        r.status === "pending" ||
        (r.status === "approved" &&
          typeof r.end_date === "string" &&
          r.end_date >= todayStr),
    )
    .slice(0, 20)
    .map((r) => toRow(r, false));

  const pastRows: ReservationRow[] = requests
    .filter(
      (r) =>
        r.status === "declined" ||
        r.status === "cancelled" ||
        (r.status === "approved" &&
          typeof r.end_date === "string" &&
          r.end_date < todayStr),
    )
    .slice(0, 50)
    .map((r) => toRow(r, true));

  // ---------------------------------------------------------------------------
  // Next stay panel data (used inside banner)
  // ---------------------------------------------------------------------------

  const nextStayProp = nextStayRaw ? propertyMap.get(nextStayRaw.property_id) : null;
  const nextStayDateRange =
    nextStayRaw
      ? formatDateRange(nextStayRaw.start_date, nextStayRaw.end_date)
      : null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* ------------------------------------------------------------------ */}
      {/* 1. Banner — CTA left, next-stay panel right (when confirmed stay)    */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          background:
            "linear-gradient(130deg, #1B77BE 0%, #02AAEB 60%, #38c8ff 100%)",
        }}
      >
        {/* Decorative circles */}
        <span
          className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full"
          style={{ background: "rgba(255,255,255,0.08)" }}
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute -bottom-14 right-24 h-40 w-40 rounded-full"
          style={{ background: "rgba(255,255,255,0.06)" }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-stretch">
          {/* CTA */}
          <div className="flex-1 px-7 py-6">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.15em]"
              style={{ color: "rgba(255,255,255,0.70)" }}
            >
              Owner stays &amp; holds
            </p>
            <h1
              className="mt-1 text-xl font-bold tracking-tight"
              style={{ color: "#fff" }}
            >
              Reserve time in your home
            </h1>
            <p
              className="mt-1 text-[13px]"
              style={{ color: "rgba(255,255,255,0.78)" }}
            >
              Pick your dates and we&apos;ll check for conflicts.
            </p>
            <Link
              href="/portal/reserve/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#fff", color: "#1B77BE" }}
            >
              + New reservation
            </Link>
          </div>

          {/* Next stay panel — only rendered when a confirmed upcoming stay exists */}
          {nextStayRaw && nextStayDaysAway !== null && (
            <>
              {/* Divider */}
              <span
                className="my-5 w-px self-stretch"
                style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
                aria-hidden="true"
              />
              <div className="flex w-[200px] shrink-0 flex-col justify-center px-6 py-6">
                <div className="flex items-center gap-1.5">
                  <CalendarCheck
                    size={12}
                    weight="duotone"
                    style={{ color: "rgba(255,255,255,0.65)" }}
                  />
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.13em]"
                    style={{ color: "rgba(255,255,255,0.65)" }}
                  >
                    Next stay
                  </p>
                </div>
                <p
                  className="mt-1.5 text-[13px] font-semibold leading-snug"
                  style={{ color: "#fff" }}
                >
                  {nextStayProp?.name ?? "Property"}
                  {nextStayProp?.unit ? (
                    <span style={{ opacity: 0.8 }}> {nextStayProp.unit}</span>
                  ) : null}
                </p>
                <p
                  className="mt-0.5 text-[12px]"
                  style={{ color: "rgba(255,255,255,0.72)" }}
                >
                  {nextStayDateRange}
                </p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span
                    className="text-2xl font-bold leading-none"
                    style={{ color: "#fff" }}
                  >
                    {nextStayDaysAway}
                  </span>
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: "rgba(255,255,255,0.65)" }}
                  >
                    {nextStayDaysAway === 1 ? "day away" : "days away"}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Stat cards — 2-col, with sub-detail to fill dead space            */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 gap-4">
        {/* Under review */}
        <div
          className="rounded-2xl border px-5 py-4"
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-warm-gray-200)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ background: "rgba(245,158,11,0.12)" }}
            >
              <Clock size={15} weight="duotone" style={{ color: "#b45309" }} />
            </span>
            <p
              className="text-[12px] font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Under review
            </p>
          </div>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p
              className="text-3xl font-bold tracking-tight leading-none"
              style={{ color: "var(--color-text-primary)" }}
            >
              {underReviewCount}
            </p>
            <p
              className="mb-0.5 text-[11px] text-right leading-snug"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {nextPendingLine}
            </p>
          </div>
        </div>

        {/* Completed stays */}
        <div
          className="rounded-2xl border px-5 py-4"
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-warm-gray-200)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ background: "rgba(22,163,74,0.10)" }}
            >
              <CheckCircle size={15} weight="duotone" style={{ color: "#15803d" }} />
            </span>
            <p
              className="text-[12px] font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Completed stays
            </p>
          </div>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p
              className="text-3xl font-bold tracking-tight leading-none"
              style={{ color: "var(--color-text-primary)" }}
            >
              {completedCount}
            </p>
            <p
              className="mb-0.5 text-[11px] text-right leading-snug"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {lastCompletedLine}
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Reservations table                                               */}
      {/* ------------------------------------------------------------------ */}
      {upcomingRows.length > 0 || pastRows.length > 0 ? (
        <ReservationsTable upcoming={upcomingRows} past={pastRows} />
      ) : (
        <div
          className="rounded-2xl border px-8 py-10 text-center"
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-warm-gray-200)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            No reservations yet.{" "}
            <Link
              href="/portal/reserve/new"
              className="font-semibold transition-opacity hover:opacity-70"
              style={{ color: "var(--color-brand)" }}
            >
              + New reservation
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
