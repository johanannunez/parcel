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
import { blockStatusVisual, labelForBlockStatus } from "@/lib/labels";
import type { BlockRequestStatus } from "@/lib/labels";

export const metadata: Metadata = { title: "Reserve" };
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DATE_OPTS: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
const DATE_YEAR_OPTS: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };

const _dateFmt = new Intl.DateTimeFormat("en-US", DATE_OPTS);
const _dateYearFmt = new Intl.DateTimeFormat("en-US", DATE_YEAR_OPTS);

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");

  const sParts = _dateFmt.formatToParts(s);
  const eParts = _dateFmt.formatToParts(e);
  const sYearParts = _dateYearFmt.formatToParts(s);
  const eYearParts = _dateYearFmt.formatToParts(e);

  const get = (parts: Intl.DateTimeFormatPart[], type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const sMonth = get(sParts, "month");
  const sDay = get(sParts, "day");
  const sYear = get(sYearParts, "year");
  const eMonth = get(eParts, "month");
  const eDay = get(eParts, "day");
  const eYear = get(eYearParts, "year");

  if (sYear !== eYear) {
    return `${sMonth} ${sDay}, ${sYear} – ${eMonth} ${eDay}, ${eYear}`;
  }
  if (sMonth === eMonth) {
    return `${sMonth} ${sDay} – ${eDay}, ${eYear}`;
  }
  return `${sMonth} ${sDay} – ${eMonth} ${eDay}, ${eYear}`;
}

function formatTime(raw: string | null): string {
  if (!raw) return "";
  const [hStr, mStr] = raw.split(":");
  const h = parseInt(hStr ?? "0", 10);
  const m = mStr ?? "00";
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
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
        "id, property_id, start_date, end_date, status, created_at, check_in_time, check_out_time, is_owner_staying, adults, children",
      )
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  // Build a property map for quick lookups.
  type PropertyRow = {
    id: string;
    name: string;
    unit: string | null;
  };

  const propertyMap = new Map<string, PropertyRow>();
  (rawProperties ?? []).forEach((p) => {
    const rawUnit = p.address_line2 as string | null | undefined;
    propertyMap.set(p.id, {
      id: p.id,
      name: p.address_line1?.trim() || "Property",
      unit: rawUnit ? normalizeUnit(rawUnit) : null,
    });
  });

  const hasProperties = propertyMap.size > 0;

  if (!hasProperties) {
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

  // Derive stats and next stay from the fetched requests.
  const requests = rawRequests ?? [];

  const underReviewCount = requests.filter((r) => r.status === "pending").length;

  const completedCount = requests.filter(
    (r) =>
      r.status === "approved" &&
      typeof r.end_date === "string" &&
      r.end_date < todayStr,
  ).length;

  const nextStayRaw = requests
    .filter(
      (r) =>
        r.status === "approved" &&
        typeof r.start_date === "string" &&
        r.start_date >= todayStr,
    )
    .sort((a, b) =>
      (a.start_date as string) < (b.start_date as string) ? -1 : 1,
    )[0] ?? null;

  // Compute days away (server-side, no client state needed).
  let daysAway: number | null = null;
  if (nextStayRaw?.start_date) {
    const startMs = new Date(nextStayRaw.start_date + "T00:00:00").getTime();
    daysAway = Math.max(0, Math.round((startMs - today.getTime()) / 86_400_000));
  }

  // Cap the displayed list at 20 rows.
  const listRows = requests.slice(0, 20);

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* ------------------------------------------------------------------ */}
      {/* 1. CTA Banner                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="relative overflow-hidden rounded-2xl px-8 py-9"
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

        <p
          className="text-[11px] font-semibold uppercase tracking-[0.15em]"
          style={{ color: "rgba(255,255,255,0.75)" }}
        >
          Owner stays &amp; holds
        </p>
        <h1
          className="mt-1 text-2xl font-bold tracking-tight"
          style={{ color: "#fff" }}
        >
          Reserve time in your home
        </h1>
        <p
          className="mt-1 text-sm"
          style={{ color: "rgba(255,255,255,0.8)" }}
        >
          Pick your dates and we&apos;ll check for conflicts.
        </p>
        <Link
          href="/portal/reserve/new"
          className="mt-5 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#fff", color: "#1B77BE" }}
        >
          + New reservation
        </Link>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Stat cards                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-2 gap-4">
        {/* Under review */}
        <div
          className="rounded-2xl border overflow-hidden px-6 py-5"
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-warm-gray-200)",
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ background: "rgba(245,158,11,0.12)" }}
            >
              <Clock size={18} weight="duotone" style={{ color: "#b45309" }} />
            </span>
            <p
              className="text-[13px] font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Under review
            </p>
          </div>
          <p
            className="mt-3 text-3xl font-bold tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            {underReviewCount}
          </p>
        </div>

        {/* Completed stays */}
        <div
          className="rounded-2xl border overflow-hidden px-6 py-5"
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-warm-gray-200)",
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ background: "rgba(22,163,74,0.10)" }}
            >
              <CheckCircle
                size={18}
                weight="duotone"
                style={{ color: "#15803d" }}
              />
            </span>
            <p
              className="text-[13px] font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Completed stays
            </p>
          </div>
          <p
            className="mt-3 text-3xl font-bold tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            {completedCount}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Next stay card (conditional)                                      */}
      {/* ------------------------------------------------------------------ */}
      {nextStayRaw !== null && daysAway !== null && (() => {
        const prop = propertyMap.get(nextStayRaw.property_id);
        const guestCount =
          (nextStayRaw.adults ?? 1) + (nextStayRaw.children ?? 0);
        return (
          <div
            className="rounded-2xl border overflow-hidden px-6 py-5"
            style={{
              backgroundColor: "var(--color-white)",
              borderColor: "var(--color-warm-gray-200)",
            }}
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <CalendarCheck
                    size={15}
                    weight="duotone"
                    style={{ color: "var(--color-brand)" }}
                  />
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.13em]"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    Next stay
                  </p>
                </div>
                <p
                  className="mt-1 text-base font-semibold tracking-tight"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {prop?.name ?? "Property"}
                  {prop?.unit ? (
                    <span style={{ color: "var(--color-brand)" }}>
                      {" "}
                      {prop.unit}
                    </span>
                  ) : null}
                </p>
              </div>

              {/* Days-away countdown bubble */}
              <div className="flex flex-col items-center rounded-2xl border px-5 py-3 text-center flex-shrink-0"
                style={{ borderColor: "var(--color-warm-gray-200)" }}
              >
                <span
                  className="text-3xl font-bold leading-none"
                  style={{ color: "var(--color-brand)" }}
                >
                  {daysAway}
                </span>
                <span
                  className="mt-0.5 text-[11px] font-medium"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  days away
                </span>
              </div>
            </div>

            {/* Detail rows */}
            <div
              className="mt-4 grid grid-cols-1 gap-1.5 border-t pt-4 sm:grid-cols-3"
              style={{ borderColor: "var(--color-warm-gray-100)" }}
            >
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  Check-in
                </p>
                <p
                  className="mt-0.5 text-sm font-medium"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {formatDateRange(nextStayRaw.start_date, nextStayRaw.start_date).replace(/ –.*/, "")}
                  {nextStayRaw.check_in_time
                    ? `, ${formatTime(nextStayRaw.check_in_time)}`
                    : ""}
                </p>
              </div>
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  Check-out
                </p>
                <p
                  className="mt-0.5 text-sm font-medium"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {formatDateRange(nextStayRaw.end_date, nextStayRaw.end_date).replace(/ –.*/, "")}
                  {nextStayRaw.check_out_time
                    ? `, ${formatTime(nextStayRaw.check_out_time)}`
                    : ""}
                </p>
              </div>
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  Guests
                </p>
                <p
                  className="mt-0.5 text-sm font-medium"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {guestCount} {guestCount === 1 ? "guest" : "guests"}
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* No upcoming stay hint */}
      {!nextStayRaw && listRows.length > 0 ? (
        <div
          className="flex items-center gap-3 rounded-2xl border px-5 py-4"
          style={{
            backgroundColor: "rgba(2,170,235,0.04)",
            borderColor: "rgba(2,170,235,0.15)",
          }}
        >
          <CalendarCheck
            size={18}
            weight="duotone"
            className="shrink-0"
            style={{ color: "var(--color-brand)" }}
          />
          <p className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
            No upcoming stays.{" "}
            <Link
              href="/portal/reserve/new"
              className="font-semibold"
              style={{ color: "var(--color-brand)" }}
            >
              Reserve your next visit.
            </Link>
          </p>
        </div>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* 4. Flat reservations list                                            */}
      {/* ------------------------------------------------------------------ */}
      {listRows.length > 0 && (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-warm-gray-200)",
          }}
        >
          {/* Table header */}
          <div
            className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b px-5 py-3"
            style={{ borderColor: "var(--color-warm-gray-100)" }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.13em]"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Property
            </p>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.13em]"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Dates
            </p>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.13em]"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Type
            </p>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.13em]"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Status
            </p>
          </div>

          {/* Rows */}
          {listRows.map((r, idx) => {
            const prop = propertyMap.get(r.property_id);
            const visual =
              blockStatusVisual[r.status as BlockRequestStatus] ??
              blockStatusVisual["pending"];
            const label = labelForBlockStatus(r.status);
            const isLast = idx === listRows.length - 1;

            return (
              <div
                key={r.id}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--color-warm-gray-50)]"
                style={
                  isLast
                    ? {}
                    : { borderBottom: "1px solid var(--color-warm-gray-100)" }
                }
              >
                {/* Property name + unit */}
                <div className="min-w-0">
                  <p
                    className="truncate text-sm font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {prop?.name ?? "Property"}
                    {prop?.unit ? (
                      <span
                        className="ml-1"
                        style={{ color: "var(--color-brand)" }}
                      >
                        {prop.unit}
                      </span>
                    ) : null}
                  </p>
                </div>

                {/* Date range */}
                <p
                  className="whitespace-nowrap text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {formatDateRange(r.start_date, r.end_date)}
                </p>

                {/* Stay type */}
                <p
                  className="whitespace-nowrap text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {r.is_owner_staying ? "Owner staying" : "Guest staying"}
                </p>

                {/* Status pill */}
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  style={{
                    backgroundColor: visual.bg,
                    color: visual.fg,
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: visual.dot }}
                  />
                  {label}
                </span>
              </div>
            );
          })}

          {/* Footer CTA */}
          <div
            className="border-t px-5 py-3.5"
            style={{ borderColor: "var(--color-warm-gray-100)" }}
          >
            <Link
              href="/portal/reserve/new"
              className="text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ color: "var(--color-brand)" }}
            >
              + New reservation
            </Link>
          </div>
        </div>
      )}

      {/* Empty list state */}
      {listRows.length === 0 && (
        <div
          className="rounded-2xl border overflow-hidden px-8 py-10 text-center"
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-warm-gray-200)",
          }}
        >
          <p
            className="text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
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
