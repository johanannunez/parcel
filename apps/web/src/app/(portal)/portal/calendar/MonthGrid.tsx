"use client";

import { useMemo } from "react";
import { colorFor, platformColor, type PaletteEntry } from "./palette";
import { PlatformIcon } from "./PlatformIcon";
import type { Booking } from "./BookingDetailModal";
import type { BlockRequest } from "./BlockBar";

type Property = { id: string; name: string };

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type DayCell = {
  date: number | null;
  iso: string;
  isToday: boolean;
  isWeekend: boolean;
};

type BarSegment = {
  id: string;
  type: "booking" | "block";
  label: string;
  color: PaletteEntry;
  source?: string;
  status?: string;
  startCol: number;
  span: number;
  continues: boolean;
  continued: boolean;
  booking?: Booking;
};

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function MonthGrid({
  year,
  month,
  properties,
  bookings,
  blockRequests,
  activePropertyId,
  onSelectBooking,
}: {
  year: number;
  month: number;
  properties: Property[];
  bookings: Booking[];
  blockRequests: BlockRequest[];
  activePropertyId: string | null;
  onSelectBooking: (b: Booking) => void;
}) {
  const todayIso = isoDate(new Date());
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();

  // Build property index for colors
  const propIndex = useMemo(() => {
    const m = new Map<string, number>();
    properties.forEach((p, i) => m.set(p.id, i));
    return m;
  }, [properties]);

  // Filter to active property if set
  const filteredBookings = useMemo(() => {
    if (!activePropertyId) return bookings;
    return bookings.filter((b) => b.property_id === activePropertyId);
  }, [bookings, activePropertyId]);

  const filteredBlocks = useMemo(() => {
    if (!activePropertyId) return blockRequests;
    return blockRequests.filter((r) => r.property_id === activePropertyId);
  }, [blockRequests, activePropertyId]);

  // Build week rows
  const weeks = useMemo(() => {
    const rows: DayCell[][] = [];
    let row: DayCell[] = [];

    // Pad first week
    for (let i = 0; i < firstDow; i++) {
      row.push({ date: null, iso: "", isToday: false, isWeekend: i === 0 || i === 6 });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      const dow = dt.getDay();
      const iso = isoDate(dt);
      row.push({
        date: d,
        iso,
        isToday: iso === todayIso,
        isWeekend: dow === 0 || dow === 6,
      });
      if (row.length === 7) {
        rows.push(row);
        row = [];
      }
    }

    // Pad last week
    if (row.length > 0) {
      while (row.length < 7) {
        row.push({ date: null, iso: "", isToday: false, isWeekend: row.length === 0 || row.length === 6 });
      }
      rows.push(row);
    }

    return rows;
  }, [year, month, daysInMonth, firstDow, todayIso]);

  // Compute bar segments for each week row
  const weekBars = useMemo(() => {
    const monthStart = new Date(year, month, 1);

    function dayIndex(isoStr: string) {
      const d = new Date(`${isoStr}T00:00:00`);
      return Math.round((d.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
    }

    return weeks.map((weekRow, weekIdx) => {
      const weekStartDay = weekIdx * 7 - firstDow;
      const weekEndDay = weekStartDay + 7;

      const bars: BarSegment[] = [];

      // Bookings
      for (const b of filteredBookings) {
        const bStart = dayIndex(b.check_in);
        const bEnd = dayIndex(b.check_out);
        if (bEnd <= weekStartDay || bStart >= weekEndDay) continue;

        const clampedStart = Math.max(bStart, weekStartDay);
        const clampedEnd = Math.min(bEnd, weekEndDay);
        const startCol = clampedStart - weekStartDay;
        const span = clampedEnd - clampedStart;

        bars.push({
          id: `booking-${b.id}-w${weekIdx}`,
          type: "booking",
          label: b.guest_name ?? "Booked",
          color: platformColor(b.source),
          source: b.source,
          startCol,
          span,
          continues: bEnd > weekEndDay,
          continued: bStart < weekStartDay,
          booking: b,
        });
      }

      // Block requests
      for (const r of filteredBlocks) {
        const rStart = dayIndex(r.start_date);
        const rEnd = dayIndex(r.end_date) + 1; // inclusive
        if (rEnd <= weekStartDay || rStart >= weekEndDay) continue;

        const clampedStart = Math.max(rStart, weekStartDay);
        const clampedEnd = Math.min(rEnd, weekEndDay);
        const startCol = clampedStart - weekStartDay;
        const span = clampedEnd - clampedStart;

        const pIdx = propIndex.get(r.property_id) ?? 0;
        bars.push({
          id: `block-${r.id}-w${weekIdx}`,
          type: "block",
          label: r.status === "approved" ? "Blocked" : "Pending",
          color: colorFor(pIdx),
          status: r.status,
          startCol,
          span,
          continues: rEnd > weekEndDay,
          continued: rStart < weekStartDay,
        });
      }

      return bars;
    });
  }, [weeks, filteredBookings, filteredBlocks, propIndex, firstDow, year, month]);

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-2xl border"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
    >
      {/* Weekday header */}
      <div
        className="grid shrink-0 grid-cols-7 border-b"
        style={{ borderColor: "var(--color-warm-gray-100)" }}
      >
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className="py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{
              color: "var(--color-text-tertiary)",
              opacity: i === 0 || i === 6 ? 0.6 : 1,
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Week rows */}
      <div className="flex flex-1 flex-col">
        {weeks.map((weekRow, weekIdx) => (
          <div
            key={weekIdx}
            className="relative flex flex-1 border-b last:border-b-0"
            style={{ borderColor: "var(--color-warm-gray-100)", minHeight: 80 }}
          >
            {/* Day cells */}
            <div className="grid flex-1 grid-cols-7">
              {weekRow.map((cell, colIdx) => (
                <div
                  key={colIdx}
                  className="border-r p-1.5 last:border-r-0"
                  style={{
                    borderColor: "var(--color-warm-gray-100)",
                    backgroundColor: cell.isToday
                      ? "rgba(2, 170, 235, 0.04)"
                      : cell.isWeekend && cell.date !== null
                        ? "var(--color-warm-gray-50)"
                        : "transparent",
                    opacity: cell.date === null ? 0.3 : 1,
                  }}
                >
                  {cell.date !== null && (
                    <span
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums"
                      style={{
                        color: cell.isToday
                          ? "var(--color-white)"
                          : "var(--color-text-primary)",
                        backgroundColor: cell.isToday
                          ? "var(--color-brand)"
                          : "transparent",
                      }}
                    >
                      {cell.date}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Booking/block bars overlaid */}
            <div className="pointer-events-none absolute inset-0 grid grid-cols-7">
              {weekBars[weekIdx].map((bar) => (
                <div
                  key={bar.id}
                  className="pointer-events-auto col-span-1"
                  style={{
                    gridColumn: `${bar.startCol + 1} / span ${bar.span}`,
                    marginTop: 28,
                    paddingLeft: 2,
                    paddingRight: 2,
                  }}
                >
                  {bar.type === "booking" ? (
                    <button
                      type="button"
                      onClick={() => bar.booking && onSelectBooking(bar.booking)}
                      className="flex w-full items-center gap-1 truncate transition-opacity hover:opacity-80"
                      style={{
                        height: 22,
                        backgroundColor: bar.color.bg,
                        color: bar.color.fg,
                        borderRadius: bar.continued
                          ? bar.continues
                            ? "0"
                            : "0 4px 4px 0"
                          : bar.continues
                            ? "4px 0 0 4px"
                            : "4px",
                        borderLeft: bar.continued
                          ? "none"
                          : `2px solid ${bar.color.solid}`,
                        paddingLeft: 4,
                        paddingRight: 4,
                        fontSize: 10,
                        fontWeight: 600,
                        lineHeight: 1,
                        overflow: "hidden",
                        cursor: "pointer",
                      }}
                    >
                      {!bar.continued && bar.source && (
                        <span style={{ flexShrink: 0, display: "flex" }}>
                          <PlatformIcon source={bar.source} size={10} color={bar.color.solid} />
                        </span>
                      )}
                      {bar.span >= 2 ? bar.label : ""}
                    </button>
                  ) : (
                    <div
                      className="flex w-full items-center truncate"
                      style={{
                        height: 22,
                        backgroundImage: bar.status === "approved"
                          ? `repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)`
                          : `repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(180,83,9,0.1) 3px, rgba(180,83,9,0.1) 4px)`,
                        backgroundColor: bar.status === "approved"
                          ? "rgba(107, 114, 128, 0.08)"
                          : "rgba(245, 158, 11, 0.08)",
                        border: `1px dashed ${bar.status === "approved" ? "var(--color-warm-gray-200)" : "rgba(245, 158, 11, 0.45)"}`,
                        borderRadius: bar.continued
                          ? bar.continues
                            ? "0"
                            : "0 4px 4px 0"
                          : bar.continues
                            ? "4px 0 0 4px"
                            : "4px",
                        paddingLeft: 6,
                        fontSize: 9,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: bar.status === "approved"
                          ? "var(--color-text-tertiary)"
                          : "#b45309",
                        overflow: "hidden",
                      }}
                    >
                      {bar.span >= 2 ? bar.label : ""}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
