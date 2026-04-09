"use client";

import { useState, useTransition } from "react";
import { CheckCircle, WarningCircle } from "@phosphor-icons/react";
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

function fmtRange(start: string, end: string) {
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  if (start === end) return s.toLocaleDateString(undefined, opts);
  return `${s.toLocaleDateString(undefined, opts)} → ${e.toLocaleDateString(undefined, opts)}`;
}

const STATUS_STYLES: Record<
  PastRequest["status"],
  { bg: string; fg: string; label: string }
> = {
  pending: { bg: "rgba(245, 158, 11, 0.14)", fg: "#b45309", label: "Pending" },
  approved: { bg: "rgba(22, 163, 74, 0.14)", fg: "#15803d", label: "Approved" },
  declined: { bg: "rgba(220, 38, 38, 0.14)", fg: "#b91c1c", label: "Declined" },
};

export function BlockRequestForm({
  properties,
  pastRequests,
}: {
  properties: Property[];
  pastRequests: PastRequest[];
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    msg: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  const propertyMap = new Map(properties.map((p) => [p.id, p.name]));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const result = await submitBlockRequest({
        propertyId,
        startDate,
        endDate,
        note: note.trim() || undefined,
      });
      if (result.ok) {
        setFeedback({
          kind: "success",
          msg: "Request submitted. We will review it and confirm by email.",
        });
        setNote("");
      } else {
        setFeedback({ kind: "error", msg: result.error });
      }
    });
  };

  return (
    <section
      className="rounded-2xl border p-6"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
      aria-labelledby="block-request-heading"
    >
      <div className="flex flex-col gap-1">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Reserve dates for your own use
        </p>
        <h2
          id="block-request-heading"
          className="text-xl font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          Request a block
        </h2>
        <p
          className="mt-2 max-w-2xl text-sm leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Need the home for a personal stay, renovations, or a family visit?
          Tell us the dates and a short note. We will confirm by email and
          block the dates across every booking channel for you.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Property">
            <select
              required
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="h-11 w-full rounded-lg border px-3 text-sm outline-none transition-colors focus:border-[var(--color-brand)]"
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
          </Field>
          <Field label="Start date">
            <input
              type="date"
              required
              min={today}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (e.target.value > endDate) setEndDate(e.target.value);
              }}
              className="h-11 w-full rounded-lg border px-3 text-sm outline-none transition-colors focus:border-[var(--color-brand)]"
              style={{
                backgroundColor: "var(--color-white)",
                borderColor: "var(--color-warm-gray-200)",
                color: "var(--color-text-primary)",
              }}
            />
          </Field>
          <Field label="End date">
            <input
              type="date"
              required
              min={startDate}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-11 w-full rounded-lg border px-3 text-sm outline-none transition-colors focus:border-[var(--color-brand)]"
              style={{
                backgroundColor: "var(--color-white)",
                borderColor: "var(--color-warm-gray-200)",
                color: "var(--color-text-primary)",
              }}
            />
          </Field>
        </div>

        <Field label="Reason (optional)">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Family visiting, renovation, personal stay..."
            className="w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--color-brand)]"
            style={{
              backgroundColor: "var(--color-white)",
              borderColor: "var(--color-warm-gray-200)",
              color: "var(--color-text-primary)",
            }}
          />
        </Field>

        {feedback ? (
          <div
            className="flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm"
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
              <CheckCircle size={16} weight="fill" className="mt-0.5" />
            ) : (
              <WarningCircle size={16} weight="fill" className="mt-0.5" />
            )}
            <span>{feedback.msg}</span>
          </div>
        ) : null}

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={pending || !propertyId}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{
              backgroundColor: "var(--color-brand)",
              color: "var(--color-white)",
            }}
          >
            {pending ? "Submitting..." : "Submit request"}
          </button>
        </div>
      </form>

      {pastRequests.length > 0 ? (
        <div className="mt-8">
          <h3
            className="text-xs font-semibold uppercase tracking-[0.1em]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Recent requests
          </h3>
          <ul
            className="mt-3 divide-y rounded-xl border"
            style={{
              borderColor: "var(--color-warm-gray-200)",
              backgroundColor: "var(--color-warm-gray-50, #FAF8F5)",
            }}
          >
            {pastRequests.map((r) => {
              const style = STATUS_STYLES[r.status];
              return (
                <li
                  key={r.id}
                  className="flex items-start justify-between gap-4 px-4 py-3"
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
                      {r.note ? ` • ${r.note}` : ""}
                    </div>
                  </div>
                  <span
                    className="flex-none rounded-full px-2.5 py-1 text-[11px] font-semibold"
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
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span
        className="text-[11px] font-semibold uppercase tracking-[0.08em]"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
