"use client";

import { useEffect, useRef } from "react";
import { X } from "@phosphor-icons/react";
import { bookingSourceLabels, bookingStatusLabels } from "@/lib/labels";
import { currency0, formatWeekday } from "@/lib/format";

export type Booking = {
  id: string;
  property_id: string;
  guest_name: string | null;
  check_in: string;
  check_out: string;
  source: string;
  status: string;
  total_amount: number | null;
};

export function BookingDetailModal({
  booking,
  propertyName,
  onClose,
}: {
  booking: Booking;
  propertyName: string;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.36)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div
        className="w-full max-w-md rounded-t-2xl border p-5 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.35)] sm:rounded-2xl sm:p-6"
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
              {propertyName}
            </p>
            <h3
              id="booking-modal-title"
              className="mt-1 text-xl font-semibold tracking-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              {booking.guest_name ?? "Booked"}
            </h3>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-warm-gray-100)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: "var(--color-text-secondary)" }}
            aria-label="Close"
          >
            <X size={14} weight="bold" />
          </button>
        </div>

        <dl className="mt-6 flex flex-col gap-4">
          <Row label="Check-in" value={formatWeekday(booking.check_in)} />
          <Row label="Check-out" value={formatWeekday(booking.check_out)} />
          <Row
            label="Source"
            value={bookingSourceLabels[booking.source] ?? booking.source}
          />
          <Row
            label="Status"
            value={bookingStatusLabels[booking.status] ?? booking.status}
          />
          {booking.total_amount !== null ? (
            <Row label="Total" value={currency0.format(booking.total_amount)} />
          ) : null}
        </dl>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
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
