"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  CaretLeft,
  CaretRight,
  CheckCircle,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { submitBlockRequest } from "./actions";

type Property = { id: string; name: string };

type PastRequest = {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  status: "pending" | "approved" | "declined";
  note: string | null;
  created_at: string;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_STYLES: Record<
  PastRequest["status"],
  { bg: string; fg: string; label: string }
> = {
  pending: { bg: "rgba(245, 158, 11, 0.14)", fg: "#b45309", label: "Pending" },
  approved: { bg: "rgba(22, 163, 74, 0.14)", fg: "#15803d", label: "Approved" },
  declined: { bg: "rgba(220, 38, 38, 0.14)", fg: "#b91c1c", label: "Declined" },
};

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtRange(start: string, end: string) {
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  if (start === end) return s.toLocaleDateString(undefined, opts);
  return `${s.toLocaleDateString(undefined, opts)} to ${e.toLocaleDateString(undefined, opts)}`;
}

export function BlockRequestModal({
  properties,
  pastRequests,
  onClose,
}: {
  properties: Property[];
  pastRequests: PastRequest[];
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    msg: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  const today = useMemo(() => isoDate(new Date()), []);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const propertyMap = useMemo(
    () => new Map(properties.map((p) => [p.id, p.name])),
    [properties],
  );

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const firstDay = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDow = firstDay.getDay();

  const calDays: (string | null)[] = [];
  for (let i = 0; i < startDow; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    calDays.push(isoDate(new Date(viewYear, viewMonth, d)));
  }

  const onDayClick = useCallback(
    (iso: string) => {
      if (iso < today) return;
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(iso);
        setRangeEnd(null);
        setHovered(null);
      } else {
        if (iso < rangeStart) {
          setRangeEnd(rangeStart);
          setRangeStart(iso);
        } else {
          setRangeEnd(iso);
        }
      }
    },
    [rangeStart, rangeEnd, today],
  );

  const effectiveEnd = rangeEnd ?? hovered;
  const selStart = rangeStart && effectiveEnd && effectiveEnd < rangeStart ? effectiveEnd : rangeStart;
  const selEnd = rangeStart && effectiveEnd && effectiveEnd < rangeStart ? rangeStart : effectiveEnd;

  const isInRange = (iso: string) => {
    if (!selStart) return false;
    if (!selEnd) return iso === selStart;
    return iso >= selStart && iso <= selEnd;
  };

  const isStart = (iso: string) => iso === selStart;
  const isEnd = (iso: string) => iso === (selEnd ?? selStart);

  const onSubmit = () => {
    if (!rangeStart || !propertyId) return;
    const finalEnd = rangeEnd ?? rangeStart;
    setFeedback(null);
    startTransition(async () => {
      const result = await submitBlockRequest({
        propertyId,
        startDate: rangeStart,
        endDate: finalEnd,
        note: note.trim() || undefined,
      });
      if (result.ok) {
        setFeedback({
          kind: "success",
          msg: "Request submitted. We will review it and confirm by email.",
        });
        setNote("");
        setRangeStart(null);
        setRangeEnd(null);
      } else {
        setFeedback({ kind: "error", msg: result.error });
      }
    });
  };

  const rangeLabel =
    rangeStart && (rangeEnd ?? rangeStart)
      ? fmtRange(rangeStart, rangeEnd ?? rangeStart)
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.36)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="block-modal-title"
    >
      <div
        className="w-full max-w-md overflow-y-auto rounded-2xl border p-6 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.35)]"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: "var(--color-warm-gray-200)",
          maxHeight: "calc(100dvh - 64px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Reserve dates
            </p>
            <h2
              id="block-modal-title"
              className="mt-1 text-xl font-semibold tracking-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              Request a block
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-warm-gray-100)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: "var(--color-text-secondary)" }}
            aria-label="Close"
          >
            <X size={14} weight="bold" />
          </button>
        </div>

        <p
          className="mt-2 text-sm leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Pick a property, tap the start and end dates below, and we will block
          the range across every channel.
        </p>

        {/* Property selector */}
        <div className="mt-5 flex flex-col gap-1.5">
          <label
            className="text-[11px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Property
          </label>
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="h-10 w-full rounded-lg border px-3 text-sm outline-none transition-colors focus:ring-2"
            style={{
              backgroundColor: "var(--color-white)",
              borderColor: "var(--color-warm-gray-200)",
              color: "var(--color-text-primary)",
            }}
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Range calendar */}
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-warm-gray-50)]"
              style={{ color: "var(--color-text-secondary)" }}
              aria-label="Previous month"
            >
              <CaretLeft size={14} weight="bold" />
            </button>
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-warm-gray-50)]"
              style={{ color: "var(--color-text-secondary)" }}
              aria-label="Next month"
            >
              <CaretRight size={14} weight="bold" />
            </button>
          </div>

          <div
            className="mt-3 grid grid-cols-7 text-center text-[10px] font-semibold uppercase tracking-[0.06em]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="py-1.5">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calDays.map((iso, i) => {
              if (!iso) {
                return <div key={`empty-${i}`} className="h-9" />;
              }

              const isPast = iso < today;
              const inRange = isInRange(iso);
              const start = isStart(iso);
              const end = isEnd(iso);
              const isToday = iso === today;

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={isPast}
                  onClick={() => onDayClick(iso)}
                  onMouseEnter={() => {
                    if (rangeStart && !rangeEnd) setHovered(iso);
                  }}
                  onMouseLeave={() => setHovered(null)}
                  className="relative flex h-9 items-center justify-center text-[13px] font-medium tabular-nums transition-colors"
                  style={{
                    color: isPast
                      ? "var(--color-text-tertiary)"
                      : inRange
                        ? "var(--color-white)"
                        : "var(--color-text-primary)",
                    backgroundColor: start || end
                      ? "var(--color-brand)"
                      : inRange
                        ? "rgba(2, 170, 235, 0.18)"
                        : "transparent",
                    borderRadius: start && end
                      ? "8px"
                      : start
                        ? "8px 0 0 8px"
                        : end
                          ? "0 8px 8px 0"
                          : "0",
                    cursor: isPast ? "default" : "pointer",
                    opacity: isPast ? 0.4 : 1,
                  }}
                >
                  <span
                    style={{
                      color:
                        start || end
                          ? "var(--color-white)"
                          : inRange
                            ? "var(--color-brand)"
                            : isToday
                              ? "var(--color-brand)"
                              : "inherit",
                      fontWeight: isToday || start || end ? 700 : 500,
                    }}
                  >
                    {new Date(`${iso}T00:00:00`).getDate()}
                  </span>
                </button>
              );
            })}
          </div>

          {rangeLabel ? (
            <div
              className="mt-3 rounded-lg border px-3 py-2 text-center text-sm font-medium"
              style={{
                backgroundColor: "rgba(2, 170, 235, 0.06)",
                borderColor: "rgba(2, 170, 235, 0.2)",
                color: "var(--color-brand)",
              }}
            >
              {rangeLabel}
            </div>
          ) : (
            <div
              className="mt-3 rounded-lg border border-dashed px-3 py-2 text-center text-sm"
              style={{
                borderColor: "var(--color-warm-gray-200)",
                color: "var(--color-text-tertiary)",
              }}
            >
              Tap a start date, then an end date
            </div>
          )}
        </div>

        {/* Note */}
        <div className="mt-4 flex flex-col gap-1.5">
          <label
            className="text-[11px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Reason (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Family visiting, renovation, personal stay..."
            className="w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2"
            style={{
              backgroundColor: "var(--color-white)",
              borderColor: "var(--color-warm-gray-200)",
              color: "var(--color-text-primary)",
            }}
          />
        </div>

        {feedback ? (
          <div
            className="mt-3 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm"
            style={{
              backgroundColor:
                feedback.kind === "success"
                  ? "rgba(22, 163, 74, 0.08)"
                  : "rgba(220, 38, 38, 0.08)",
              borderColor:
                feedback.kind === "success"
                  ? "rgba(22, 163, 74, 0.3)"
                  : "rgba(220, 38, 38, 0.3)",
              color:
                feedback.kind === "success" ? "#15803d" : "#b91c1c",
            }}
          >
            {feedback.kind === "success" ? (
              <CheckCircle size={16} weight="fill" className="mt-0.5 shrink-0" />
            ) : (
              <WarningCircle size={16} weight="fill" className="mt-0.5 shrink-0" />
            )}
            <span>{feedback.msg}</span>
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={pending || !rangeStart || !propertyId}
            onClick={onSubmit}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor: "var(--color-brand)",
              color: "var(--color-white)",
            }}
          >
            {pending ? "Submitting..." : "Submit request"}
          </button>
        </div>

        {pastRequests.length > 0 ? (
          <div
            className="mt-6 border-t pt-5"
            style={{ borderColor: "var(--color-warm-gray-200)" }}
          >
            <h3
              className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Recent requests
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              {pastRequests.map((r) => {
                const style = STATUS_STYLES[r.status];
                return (
                  <li
                    key={r.id}
                    className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5"
                    style={{
                      borderColor: "var(--color-warm-gray-200)",
                      backgroundColor: "var(--color-warm-gray-50)",
                    }}
                  >
                    <div className="min-w-0">
                      <div
                        className="text-sm font-semibold"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {fmtRange(r.start_date, r.end_date)}
                      </div>
                      <div
                        className="mt-0.5 truncate text-xs"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {propertyMap.get(r.property_id) ?? "Property"}
                        {r.note ? ` · ${r.note}` : ""}
                      </div>
                    </div>
                    <span
                      className="flex-none rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                      style={{
                        backgroundColor: style.bg,
                        color: style.fg,
                      }}
                    >
                      {style.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
