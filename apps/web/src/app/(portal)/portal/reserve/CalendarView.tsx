"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CaretLeft,
  CaretRight,
  X,
  Check,
} from "@phosphor-icons/react";
import { bookingSourceLabels, bookingStatusLabels } from "@/lib/labels";
import { currency0, formatWeekday } from "@/lib/format";

type Property = { id: string; name: string };
type Booking = {
  id: string;
  property_id: string;
  guest_name: string | null;
  check_in: string;
  check_out: string;
  source: string;
  status: string;
  total_amount: number | null;
};

const PALETTE = [
  { bg: "rgba(2, 170, 235, 0.14)", fg: "#0c6fae", solid: "#02aaeb" },
  { bg: "rgba(22, 163, 74, 0.14)", fg: "#15803d", solid: "#16a34a" },
  { bg: "rgba(245, 158, 11, 0.16)", fg: "#b45309", solid: "#f59e0b" },
  { bg: "rgba(168, 85, 247, 0.14)", fg: "#6d28d9", solid: "#a855f7" },
  { bg: "rgba(244, 63, 94, 0.14)", fg: "#be123c", solid: "#f43f5e" },
  { bg: "rgba(6, 182, 212, 0.14)", fg: "#0e7490", solid: "#06b6d4" },
];

function colorFor(index: number) {
  return PALETTE[index % PALETTE.length];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function CalendarView({
  year,
  month,
  properties,
  bookings,
}: {
  year: number;
  month: number;
  properties: Property[];
  bookings: Booking[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterFromUrl = searchParams.get("filter");
  const filterId = filterFromUrl;
  const [selected, setSelected] = useState<Booking | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  // Close on Escape, focus the close button on open.
  useEffect(() => {
    if (!selected) return;
    cancelBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const propIndex = useMemo(() => {
    const m = new Map<string, number>();
    properties.forEach((p, i) => m.set(p.id, i));
    return m;
  }, [properties]);

  const propName = useMemo(() => {
    const m = new Map<string, string>();
    properties.forEach((p) => m.set(p.id, p.name));
    return m;
  }, [properties]);

  const filteredBookings = filterId
    ? bookings.filter((b) => b.property_id === filterId)
    : bookings;

  const first = new Date(year, month, 1);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }

  const isoDay = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const bookingsByDay = useMemo(() => {
    const m = new Map<string, Booking[]>();
    for (const b of filteredBookings) {
      const start = new Date(b.check_in + "T00:00:00");
      const end = new Date(b.check_out + "T00:00:00");
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        const k = isoDay(d);
        if (!m.has(k)) m.set(k, []);
        m.get(k)!.push(b);
      }
    }
    return m;
  }, [filteredBookings]);

  const navHref = (newMonth: number, newYear: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", String(newMonth));
    params.set("year", String(newYear));
    return `?${params.toString()}`;
  };

  const filterHref = (id: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("filter", id);
    else params.delete("filter");
    return `?${params.toString()}`;
  };

  const prevHref = navHref(month === 0 ? 11 : month - 1, month === 0 ? year - 1 : year);
  const nextHref = navHref(month === 11 ? 0 : month + 1, month === 11 ? year + 1 : year);
  const todayHref = navHref(new Date().getMonth(), new Date().getFullYear());

  const today = isoDay(new Date());
  const todayWeekStart = (() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return isoDay(d);
  })();
  const todayWeekEnd = (() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 6);
    return isoDay(d);
  })();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={prevHref}
            className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors hover:bg-[var(--color-warm-gray-50)]"
            style={{
              backgroundColor: "var(--color-white)",
              borderColor: "var(--color-warm-gray-200)",
              color: "var(--color-text-primary)",
            }}
            aria-label="Previous month"
            rel="prev"
          >
            <CaretLeft size={14} weight="bold" />
          </Link>
          <Link
            href={nextHref}
            className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors hover:bg-[var(--color-warm-gray-50)]"
            style={{
              backgroundColor: "var(--color-white)",
              borderColor: "var(--color-warm-gray-200)",
              color: "var(--color-text-primary)",
            }}
            aria-label="Next month"
            rel="next"
          >
            <CaretRight size={14} weight="bold" />
          </Link>
          <h2
            className="ml-2 text-xl font-semibold tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            {MONTH_NAMES[month]} {year}
          </h2>
          <Link
            href={todayHref}
            className="ml-3 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-[var(--color-warm-gray-50)]"
            style={{
              backgroundColor: "var(--color-white)",
              borderColor: "var(--color-warm-gray-200)",
              color: "var(--color-text-secondary)",
            }}
          >
            Today
          </Link>
        </div>

        {properties.length > 1 ? (
          <div className="flex flex-wrap items-center gap-2">
            <FilterChip
              active={!filterId}
              href={filterHref(null)}
              label="All"
            />
            {properties.map((p, i) => {
              const c = colorFor(i);
              return (
                <FilterChip
                  key={p.id}
                  active={filterId === p.id}
                  href={filterHref(p.id)}
                  label={p.name}
                  dotColor={c.solid}
                />
              );
            })}
          </div>
        ) : null}
      </div>

      <div
        className="overflow-hidden rounded-2xl border"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: "var(--color-warm-gray-200)",
        }}
      >
        <div
          className="grid grid-cols-7 border-b text-[10px] font-semibold uppercase tracking-[0.12em] sm:text-[11px]"
          style={{
            borderColor: "var(--color-warm-gray-100)",
            color: "var(--color-text-tertiary)",
          }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="px-2 py-3 sm:px-3">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const inMonth = d.getMonth() === month;
            const key = isoDay(d);
            const dayBookings = bookingsByDay.get(key) ?? [];
            const isToday = key === today;
            const inTodayWeek = key >= todayWeekStart && key <= todayWeekEnd;

            return (
              <div
                key={i}
                className="relative min-h-[80px] border-b border-r p-1.5 sm:min-h-[110px] sm:p-2"
                style={{
                  borderColor: "var(--color-warm-gray-100)",
                  backgroundColor: !inMonth
                    ? "var(--color-warm-gray-50)"
                    : inTodayWeek
                      ? "rgba(2, 170, 235, 0.03)"
                      : "var(--color-white)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-[11px] font-semibold tabular-nums"
                    style={{
                      color: isToday
                        ? "var(--color-brand)"
                        : inMonth
                          ? "var(--color-text-primary)"
                          : "var(--color-text-tertiary)",
                    }}
                  >
                    {d.getDate()}
                  </span>
                  {isToday ? (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: "var(--color-brand)" }}
                      aria-label="Today"
                    />
                  ) : null}
                </div>

                <div className="mt-1.5 flex flex-col gap-1">
                  {dayBookings.slice(0, 3).map((b) => {
                    const idx = propIndex.get(b.property_id) ?? 0;
                    const c = colorFor(idx);
                    const guestLabel = b.guest_name ?? "Booked";
                    return (
                      <button
                        key={`${b.id}-${key}`}
                        type="button"
                        onClick={() => setSelected(b)}
                        aria-label={`Reservation: ${guestLabel}, ${formatWeekday(b.check_in)} to ${formatWeekday(b.check_out)}`}
                        className="truncate rounded-md px-1.5 py-0.5 text-left text-[10px] font-semibold transition-opacity hover:opacity-80 sm:text-[11px]"
                        style={{ backgroundColor: c.bg, color: c.fg }}
                      >
                        {guestLabel}
                      </button>
                    );
                  })}
                  {dayBookings.length > 3 ? (
                    <span
                      className="text-[10px]"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      +{dayBookings.length - 3} more
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.36)" }}
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-modal-title"
        >
          <div
            className="w-full max-w-md rounded-2xl border p-6 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.35)]"
            style={{
              backgroundColor: "var(--color-white)",
              borderColor: "var(--color-warm-gray-200)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  {propName.get(selected.property_id) ?? "Reservation"}
                </p>
                <h3
                  id="booking-modal-title"
                  className="mt-1 text-xl font-semibold tracking-tight"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {selected.guest_name ?? "Booked"}
                </h3>
              </div>
              <button
                ref={cancelBtnRef}
                type="button"
                onClick={() => setSelected(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-warm-gray-100)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ color: "var(--color-text-secondary)" }}
                aria-label="Close"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            <dl className="mt-6 flex flex-col gap-4">
              <ModalRow
                label="Check-in"
                value={formatWeekday(selected.check_in)}
              />
              <ModalRow
                label="Check-out"
                value={formatWeekday(selected.check_out)}
              />
              <ModalRow
                label="Source"
                value={bookingSourceLabels[selected.source] ?? selected.source}
              />
              <ModalRow
                label="Status"
                value={
                  bookingStatusLabels[selected.status] ?? selected.status
                }
              />
              {selected.total_amount !== null ? (
                <ModalRow
                  label="Total"
                  value={currency0.format(selected.total_amount)}
                />
              ) : null}
            </dl>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterChip({
  label,
  active,
  href,
  dotColor,
}: {
  label: string;
  active: boolean;
  href: string;
  dotColor?: string;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
      style={{
        backgroundColor: active
          ? "var(--color-warm-gray-100)"
          : "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
        color: "var(--color-text-primary)",
      }}
    >
      {active ? (
        <Check size={12} weight="bold" aria-hidden="true" />
      ) : dotColor ? (
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: dotColor }}
          aria-hidden="true"
        />
      ) : null}
      <span className="max-w-[160px] truncate">{label}</span>
    </Link>
  );
}

function ModalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt
        className="text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {label}
      </dt>
      <dd
        className="text-sm font-medium"
        style={{ color: "var(--color-text-primary)" }}
      >
        {value}
      </dd>
    </div>
  );
}
