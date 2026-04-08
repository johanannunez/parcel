"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CaretLeft,
  CaretRight,
  X,
} from "@phosphor-icons/react";

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

// Deterministic color per property id
const PALETTE = [
  { bg: "rgba(2, 170, 235, 0.14)", fg: "#0c6fae" },
  { bg: "rgba(22, 163, 74, 0.14)", fg: "#15803d" },
  { bg: "rgba(245, 158, 11, 0.16)", fg: "#b45309" },
  { bg: "rgba(168, 85, 247, 0.14)", fg: "#6d28d9" },
  { bg: "rgba(244, 63, 94, 0.14)", fg: "#be123c" },
  { bg: "rgba(6, 182, 212, 0.14)", fg: "#0e7490" },
];

function colorFor(propertyId: string, index: number) {
  return PALETTE[index % PALETTE.length];
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

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
  const [filterId, setFilterId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Booking | null>(null);

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

  // Build the 6x7 grid starting on Sunday of the first week
  const first = new Date(year, month, 1);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - first.getDay());
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }

  const isoDay = (d: Date) => d.toISOString().slice(0, 10);

  const bookingsByDay = useMemo(() => {
    const m = new Map<string, Booking[]>();
    for (const b of filteredBookings) {
      const start = new Date(b.check_in);
      const end = new Date(b.check_out);
      for (
        let d = new Date(start);
        d < end;
        d.setDate(d.getDate() + 1)
      ) {
        const k = isoDay(d);
        if (!m.has(k)) m.set(k, []);
        m.get(k)!.push(b);
      }
    }
    return m;
  }, [filteredBookings]);

  const prevMonth = new URLSearchParams({
    month: String(month === 0 ? 11 : month - 1),
    year: String(month === 0 ? year - 1 : year),
  }).toString();
  const nextMonth = new URLSearchParams({
    month: String(month === 11 ? 0 : month + 1),
    year: String(month === 11 ? year + 1 : year),
  }).toString();
  const todayQs = new URLSearchParams({
    month: String(new Date().getMonth()),
    year: String(new Date().getFullYear()),
  }).toString();

  const today = isoDay(new Date());

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={`?${prevMonth}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors hover:bg-[var(--color-warm-gray-50)]"
            style={{
              backgroundColor: "var(--color-white)",
              borderColor: "var(--color-warm-gray-200)",
              color: "var(--color-text-primary)",
            }}
            aria-label="Previous month"
          >
            <CaretLeft size={14} weight="bold" />
          </Link>
          <Link
            href={`?${nextMonth}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors hover:bg-[var(--color-warm-gray-50)]"
            style={{
              backgroundColor: "var(--color-white)",
              borderColor: "var(--color-warm-gray-200)",
              color: "var(--color-text-primary)",
            }}
            aria-label="Next month"
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
            href={`?${todayQs}`}
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
              active={filterId === null}
              onClick={() => setFilterId(null)}
              label="All"
            />
            {properties.map((p, i) => {
              const c = colorFor(p.id, i);
              return (
                <FilterChip
                  key={p.id}
                  active={filterId === p.id}
                  onClick={() => setFilterId(p.id)}
                  label={p.name}
                  dotColor={c.fg}
                />
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Grid */}
      <div
        className="overflow-hidden rounded-2xl border"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: "var(--color-warm-gray-200)",
        }}
      >
        <div
          className="grid grid-cols-7 border-b text-[11px] font-semibold uppercase tracking-[0.12em]"
          style={{
            borderColor: "var(--color-warm-gray-100)",
            color: "var(--color-text-tertiary)",
          }}
        >
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
            <div key={d} className="px-3 py-3">
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

            return (
              <div
                key={i}
                className="relative min-h-[110px] border-b border-r p-2"
                style={{
                  borderColor: "var(--color-warm-gray-100)",
                  backgroundColor: inMonth
                    ? "var(--color-white)"
                    : "var(--color-warm-gray-50)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-[11px] font-semibold"
                    style={{
                      color: inMonth
                        ? "var(--color-text-primary)"
                        : "var(--color-text-tertiary)",
                    }}
                  >
                    {d.getDate()}
                  </span>
                  {isToday ? (
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider"
                      style={{
                        backgroundColor: "var(--color-brand)",
                        color: "var(--color-white)",
                      }}
                    >
                      Today
                    </span>
                  ) : null}
                </div>

                <div className="mt-1.5 flex flex-col gap-1">
                  {dayBookings.slice(0, 3).map((b) => {
                    const idx = propIndex.get(b.property_id) ?? 0;
                    const c = colorFor(b.property_id, idx);
                    return (
                      <button
                        key={`${b.id}-${key}`}
                        type="button"
                        onClick={() => setSelected(b)}
                        className="truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-semibold transition-opacity hover:opacity-80"
                        style={{ backgroundColor: c.bg, color: c.fg }}
                      >
                        {b.guest_name ?? "Guest"}
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

      {/* Booking detail modal */}
      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.36)" }}
          onClick={() => setSelected(null)}
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
                  Reservation
                </p>
                <h3
                  className="mt-1 text-xl font-semibold tracking-tight"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {selected.guest_name ?? "Guest"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-warm-gray-100)]"
                style={{ color: "var(--color-text-secondary)" }}
                aria-label="Close"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            <dl className="mt-6 flex flex-col gap-4">
              <ModalRow label="Property" value={propName.get(selected.property_id) ?? ""} />
              <ModalRow
                label="Check-in"
                value={new Date(selected.check_in).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              />
              <ModalRow
                label="Check-out"
                value={new Date(selected.check_out).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              />
              <ModalRow label="Source" value={selected.source} />
              <ModalRow label="Status" value={selected.status} />
              {selected.total_amount !== null ? (
                <ModalRow
                  label="Total"
                  value={currency.format(selected.total_amount)}
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
  onClick,
  dotColor,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  dotColor?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
      style={{
        backgroundColor: active ? "var(--color-warm-gray-100)" : "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
        color: "var(--color-text-primary)",
      }}
    >
      {dotColor ? (
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
      ) : null}
      <span className="max-w-[160px] truncate">{label}</span>
    </button>
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
        className="text-sm font-medium capitalize"
        style={{ color: "var(--color-text-primary)" }}
      >
        {value}
      </dd>
    </div>
  );
}
