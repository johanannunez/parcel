"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { colorFor } from "./palette";
import { BookingBar } from "./BookingBar";
import { BlockBar, type BlockRequest } from "./BlockBar";
import type { Booking } from "./BookingDetailModal";

type Property = { id: string; name: string };

const WEEKDAY_ABBR = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const PROP_COL_WIDTH = 140;
const PROP_COL_MOBILE = 100;
const MIN_COL_WIDTH = 32;
const MAX_COL_WIDTH = 48;
const MIN_ROW_HEIGHT = 36;
const MAX_ROW_HEIGHT = 56;
const HEADER_HEIGHT = 44;

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function AvailabilityGrid({
  year,
  month,
  properties,
  bookings,
  blockRequests,
  onSelectBooking,
  onSelectBlock,
}: {
  year: number;
  month: number;
  properties: Property[];
  bookings: Booking[];
  blockRequests: BlockRequest[];
  onSelectBooking: (b: Booking) => void;
  onSelectBlock?: (r: BlockRequest) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [colWidth, setColWidth] = useState(MIN_COL_WIDTH);
  const [rowHeight, setRowHeight] = useState(MIN_ROW_HEIGHT);
  const [propColWidth, setPropColWidth] = useState(PROP_COL_WIDTH);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayIso = isoDate(new Date());
  const todayDay =
    new Date().getFullYear() === year && new Date().getMonth() === month
      ? new Date().getDate()
      : null;

  const days = useMemo(() => {
    const arr: { num: number; dow: number; iso: string }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      arr.push({
        num: d,
        dow: dt.getDay(),
        iso: isoDate(dt),
      });
    }
    return arr;
  }, [year, month, daysInMonth]);

  const propIndex = useMemo(() => {
    const m = new Map<string, number>();
    properties.forEach((p, i) => m.set(p.id, i));
    return m;
  }, [properties]);

  // Bookings grouped by property
  const bookingsByProp = useMemo(() => {
    const m = new Map<string, Booking[]>();
    for (const b of bookings) {
      const list = m.get(b.property_id) ?? [];
      list.push(b);
      m.set(b.property_id, list);
    }
    return m;
  }, [bookings]);

  // Block requests grouped by property
  const blocksByProp = useMemo(() => {
    const m = new Map<string, BlockRequest[]>();
    for (const r of blockRequests) {
      const list = m.get(r.property_id) ?? [];
      list.push(r);
      m.set(r.property_id, list);
    }
    return m;
  }, [blockRequests]);

  // Compute column/row sizing
  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const isMobile = rect.width < 640;
    const pCol = isMobile ? PROP_COL_MOBILE : PROP_COL_WIDTH;
    setPropColWidth(pCol);

    const gridWidth = rect.width - pCol;
    const cw = Math.max(
      MIN_COL_WIDTH,
      Math.min(MAX_COL_WIDTH, Math.floor(gridWidth / daysInMonth)),
    );
    setColWidth(cw);

    const availHeight = rect.height - HEADER_HEIGHT;
    const count = Math.max(1, properties.length);
    const rh = Math.max(
      MIN_ROW_HEIGHT,
      Math.min(MAX_ROW_HEIGHT, Math.floor(availHeight / count)),
    );
    setRowHeight(rh);
  }, [daysInMonth, properties.length]);

  useEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [measure]);

  // Auto-scroll to today
  useEffect(() => {
    if (todayDay === null || !scrollRef.current) return;
    const target = (todayDay - 1) * colWidth - scrollRef.current.clientWidth / 2 + colWidth / 2;
    scrollRef.current.scrollLeft = Math.max(0, target);
  }, [todayDay, colWidth]);

  const gridTotalWidth = daysInMonth * colWidth;

  // Convert a booking's check_in/check_out to day indices within this month
  const bookingDays = (b: Booking) => {
    const ci = new Date(`${b.check_in}T00:00:00`);
    const co = new Date(`${b.check_out}T00:00:00`);
    const monthStart = new Date(year, month, 1);
    const startDay = Math.round(
      (ci.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24),
    );
    const endDay = Math.round(
      (co.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24),
    );
    return { startDay, endDay };
  };

  const blockDays = (r: BlockRequest) => {
    const start = new Date(`${r.start_date}T00:00:00`);
    const end = new Date(`${r.end_date}T00:00:00`);
    const monthStart = new Date(year, month, 1);
    const startDay = Math.round(
      (start.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24),
    );
    // end_date is inclusive, so add 1
    const endDay =
      Math.round(
        (end.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;
    return { startDay, endDay };
  };

  return (
    <div
      ref={containerRef}
      className="flex h-full overflow-hidden rounded-2xl border"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
    >
      {/* Sticky property column */}
      <div
        className="z-10 shrink-0 border-r"
        style={{
          width: propColWidth,
          backgroundColor: "var(--color-white)",
          borderColor: "var(--color-warm-gray-100)",
        }}
      >
        {/* Corner cell aligned with day header */}
        <div
          className="flex items-end border-b px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
          style={{
            height: HEADER_HEIGHT,
            borderColor: "var(--color-warm-gray-100)",
            color: "var(--color-text-tertiary)",
          }}
        >
          Property
        </div>
        {/* Property rows */}
        {properties.map((p, i) => {
          const c = colorFor(i);
          return (
            <div
              key={p.id}
              className="flex items-center gap-2.5 border-b px-3"
              style={{
                height: rowHeight,
                borderColor: "var(--color-warm-gray-100)",
              }}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: c.solid }}
              />
              <span
                className="truncate text-xs font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                {p.name}
              </span>
            </div>
          );
        })}
        {properties.length === 0 ? (
          <div
            className="flex items-center justify-center px-3 text-xs"
            style={{
              height: rowHeight,
              color: "var(--color-text-tertiary)",
            }}
          >
            No properties
          </div>
        ) : null}
      </div>

      {/* Scrollable grid area */}
      <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-hidden">
        <div style={{ width: gridTotalWidth, minWidth: "100%" }}>
          {/* Day header row */}
          <div
            className="sticky top-0 z-10 flex border-b"
            style={{
              height: HEADER_HEIGHT,
              backgroundColor: "var(--color-white)",
              borderColor: "var(--color-warm-gray-100)",
            }}
          >
            {days.map((d) => {
              const isToday = d.num === todayDay;
              const isWeekend = d.dow === 0 || d.dow === 6;
              return (
                <div
                  key={d.num}
                  className="flex shrink-0 flex-col items-center justify-end pb-1.5"
                  style={{
                    width: colWidth,
                    backgroundColor: isToday
                      ? "rgba(2, 170, 235, 0.06)"
                      : "transparent",
                  }}
                >
                  <span
                    className="text-[9px] font-semibold uppercase"
                    style={{
                      color: isWeekend
                        ? "var(--color-text-tertiary)"
                        : "var(--color-text-tertiary)",
                      opacity: isWeekend ? 0.6 : 1,
                    }}
                  >
                    {WEEKDAY_ABBR[d.dow]}
                  </span>
                  <span
                    className="mt-0.5 text-[12px] font-semibold tabular-nums"
                    style={{
                      color: isToday
                        ? "var(--color-brand)"
                        : "var(--color-text-primary)",
                      fontWeight: isToday ? 700 : 600,
                    }}
                  >
                    {d.num}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Grid body */}
          {properties.map((p) => {
            const propBookings = bookingsByProp.get(p.id) ?? [];
            const propBlocks = blocksByProp.get(p.id) ?? [];
            const pIdx = propIndex.get(p.id) ?? 0;
            const c = colorFor(pIdx);

            return (
              <div
                key={p.id}
                className="relative border-b"
                style={{
                  height: rowHeight,
                  borderColor: "var(--color-warm-gray-100)",
                }}
              >
                {/* Day column lines + today highlight */}
                {days.map((d) => {
                  const isToday = d.num === todayDay;
                  const isWeekend = d.dow === 0 || d.dow === 6;
                  return (
                    <div
                      key={d.num}
                      className="absolute top-0 bottom-0 border-r"
                      style={{
                        left: (d.num - 1) * colWidth,
                        width: colWidth,
                        borderColor: "var(--color-warm-gray-100)",
                        backgroundColor: isToday
                          ? "rgba(2, 170, 235, 0.06)"
                          : isWeekend
                            ? "var(--color-warm-gray-50)"
                            : "transparent",
                      }}
                    />
                  );
                })}

                {/* Block bars (render behind bookings) */}
                {propBlocks.map((block) => {
                  const { startDay, endDay } = blockDays(block);
                  return (
                    <BlockBar
                      key={block.id}
                      block={block}
                      startDay={startDay}
                      endDay={endDay}
                      daysInMonth={daysInMonth}
                      colWidth={colWidth}
                      rowHeight={rowHeight}
                      onClick={() => onSelectBlock?.(block)}
                    />
                  );
                })}

                {/* Booking bars */}
                {propBookings.map((b) => {
                  const { startDay, endDay } = bookingDays(b);
                  return (
                    <BookingBar
                      key={b.id}
                      booking={b}
                      color={c}
                      startDay={startDay}
                      endDay={endDay}
                      daysInMonth={daysInMonth}
                      colWidth={colWidth}
                      rowHeight={rowHeight}
                      onClick={() => onSelectBooking(b)}
                    />
                  );
                })}
              </div>
            );
          })}

          {properties.length === 0 ? (
            <div
              className="flex items-center justify-center text-sm"
              style={{
                height: rowHeight,
                color: "var(--color-text-tertiary)",
              }}
            >
              Add a property to see your calendar
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
