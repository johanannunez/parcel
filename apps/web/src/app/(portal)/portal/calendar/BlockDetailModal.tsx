"use client";

import { useEffect, useRef, useTransition } from "react";
import {
  Broom,
  CalendarBlank,
  House,
  Lock,
  MapPin,
  Moon,
  PencilSimple,
  Trash,
  User,
  X,
} from "@phosphor-icons/react";
import type { BlockRequest } from "./BlockBar";
import { cancelBlockRequest } from "./actions";

function fmtDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function nightCount(start: string, end: string): number {
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  return Math.max(0, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
}

const STATUS_STYLES: Record<string, { bg: string; fg: string; label: string }> = {
  pending: { bg: "rgba(245, 158, 11, 0.14)", fg: "#b45309", label: "Pending review" },
  approved: { bg: "rgba(22, 163, 74, 0.14)", fg: "#15803d", label: "Approved" },
  declined: { bg: "rgba(220, 38, 38, 0.14)", fg: "#b91c1c", label: "Declined" },
};

export function BlockDetailModal({
  block,
  propertyName,
  onClose,
  onEdit,
}: {
  block: BlockRequest;
  propertyName: string;
  onClose: () => void;
  onEdit: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const nights = nightCount(block.start_date, block.end_date);
  const status = STATUS_STYLES[block.status] ?? STATUS_STYLES.pending;
  const isPending = block.status === "pending";
  const stayingLabel = block.is_owner_staying
    ? "Owner staying"
    : block.guest_name || "Guest";

  const onCancel = () => {
    if (!confirm("Cancel this block request? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await cancelBlockRequest({ id: block.id });
      if (result.ok) onClose();
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.36)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-2xl border p-6 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.35)]"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: "var(--color-warm-gray-200)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                Block request
              </p>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ backgroundColor: status.bg, color: status.fg }}
              >
                {status.label}
              </span>
            </div>
            <h3
              className="mt-1.5 text-xl font-semibold tracking-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              {propertyName}
            </h3>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-warm-gray-100)]"
            style={{ color: "var(--color-text-secondary)" }}
            aria-label="Close"
          >
            <X size={14} weight="bold" />
          </button>
        </div>

        {/* Details */}
        <dl className="mt-5 flex flex-col gap-3">
          <DetailRow
            icon={<CalendarBlank size={14} weight="duotone" />}
            label="Dates"
            value={`${fmtDate(block.start_date)} to ${fmtDate(block.end_date)}`}
          />
          <DetailRow
            icon={<Moon size={14} weight="duotone" />}
            label="Duration"
            value={`${nights} ${nights === 1 ? "night" : "nights"}`}
          />
          {(block.check_in_time || block.check_out_time) && (
            <DetailRow
              icon={<MapPin size={14} weight="duotone" />}
              label="Times"
              value={`Check-in ${block.check_in_time ?? "N/A"}, Check-out ${block.check_out_time ?? "N/A"}`}
            />
          )}
          {block.reason && (
            <DetailRow
              icon={<House size={14} weight="duotone" />}
              label="Reason"
              value={block.reason}
            />
          )}
          <DetailRow
            icon={<User size={14} weight="duotone" />}
            label="Staying"
            value={
              block.is_owner_staying
                ? "Owner"
                : `${block.guest_name ?? "Guest"}${block.guest_email ? ` (${block.guest_email})` : ""}`
            }
          />
          {(block.adults > 0 || block.children > 0 || block.pets > 0) && (
            <DetailRow
              icon={<User size={14} weight="duotone" />}
              label="Guests"
              value={[
                block.adults > 0 ? `${block.adults} adult${block.adults !== 1 ? "s" : ""}` : null,
                block.children > 0 ? `${block.children} child${block.children !== 1 ? "ren" : ""}` : null,
                block.pets > 0 ? `${block.pets} pet${block.pets !== 1 ? "s" : ""}` : null,
              ].filter(Boolean).join(", ")}
            />
          )}
          {block.needs_lock_code && (
            <DetailRow
              icon={<Lock size={14} weight="duotone" />}
              label="Lock code"
              value={block.requested_lock_code || "Requested (no preference)"}
            />
          )}
          {block.wants_cleaning && (
            <DetailRow
              icon={<Broom size={14} weight="duotone" />}
              label="Cleaning"
              value={`Scheduled${block.cleaning_fee ? ` · $${block.cleaning_fee}` : ""}`}
            />
          )}
          {block.note && (
            <DetailRow
              icon={<House size={14} weight="duotone" />}
              label="Notes"
              value={block.note}
            />
          )}
        </dl>

        {/* Cost */}
        <div
          className="mt-4 flex items-center justify-between rounded-lg border px-4 py-3"
          style={{ borderColor: "var(--color-warm-gray-200)", backgroundColor: "var(--color-warm-gray-50)" }}
        >
          <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Total</span>
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            ${block.wants_cleaning && block.cleaning_fee ? block.cleaning_fee : 0}
          </span>
        </div>

        {/* Actions */}
        {isPending && (
          <div className="mt-5 flex items-center gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-[var(--color-warm-gray-50)]"
              style={{
                borderColor: "var(--color-warm-gray-200)",
                color: "var(--color-text-primary)",
              }}
            >
              <PencilSimple size={14} weight="bold" />
              Edit request
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-red-50"
              style={{
                borderColor: "rgba(220, 38, 38, 0.3)",
                color: "#b91c1c",
              }}
            >
              <Trash size={14} weight="bold" />
              {pending ? "Cancelling..." : "Cancel"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <dt
          className="text-[10px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          {label}
        </dt>
        <dd
          className="mt-0.5 text-sm"
          style={{ color: "var(--color-text-primary)" }}
        >
          {value}
        </dd>
      </div>
    </div>
  );
}
