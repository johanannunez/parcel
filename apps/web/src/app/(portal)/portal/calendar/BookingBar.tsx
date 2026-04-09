"use client";

import type { PaletteEntry } from "./palette";
import type { Booking } from "./BookingDetailModal";

export function BookingBar({
  booking,
  color,
  startDay,
  endDay,
  daysInMonth,
  colWidth,
  rowHeight,
  onClick,
}: {
  booking: Booking;
  color: PaletteEntry;
  startDay: number;
  endDay: number;
  daysInMonth: number;
  colWidth: number;
  rowHeight: number;
  onClick: () => void;
}) {
  const clampedStart = Math.max(0, startDay);
  const clampedEnd = Math.min(daysInMonth, endDay);
  if (clampedStart >= clampedEnd) return null;

  const span = clampedEnd - clampedStart;
  const left = clampedStart * colWidth + 1;
  const width = span * colWidth - 2;
  const inset = 4;
  const barHeight = rowHeight - inset * 2;

  const startsBeforeMonth = startDay < 0;
  const endsAfterMonth = endDay > daysInMonth;
  const showLabel = span >= 2 && width > 50;

  return (
    <button
      type="button"
      onClick={onClick}
      title={`${booking.guest_name ?? "Booked"}: ${booking.check_in} to ${booking.check_out}`}
      className="absolute truncate text-left transition-opacity hover:opacity-80"
      style={{
        left,
        width,
        top: inset,
        height: barHeight,
        backgroundColor: color.bg,
        color: color.fg,
        borderRadius: startsBeforeMonth
          ? "0 5px 5px 0"
          : endsAfterMonth
            ? "5px 0 0 5px"
            : "5px",
        borderLeft: startsBeforeMonth
          ? "none"
          : `2px solid ${color.solid}`,
        display: "flex",
        alignItems: "center",
        paddingLeft: showLabel ? 8 : 0,
        paddingRight: showLabel ? 4 : 0,
        cursor: "pointer",
        fontSize: 10,
        fontWeight: 600,
        lineHeight: 1,
        overflow: "hidden",
      }}
    >
      {showLabel ? (booking.guest_name ?? "Booked") : null}
    </button>
  );
}
