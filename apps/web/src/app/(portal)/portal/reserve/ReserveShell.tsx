"use client";

import { useActionState, useEffect, useRef } from "react";
import { CalendarCheck } from "@phosphor-icons/react";
import { EmptyState } from "@/components/portal/EmptyState";
import { formatMedium } from "@/lib/format";
import { submitBlockRequest } from "./actions";

type Property = { id: string; label: string };

type BlockRequest = {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  status: string;
  note: string | null;
  created_at: string;
};

type State = { ok: boolean; message?: string } | null;

const initialState: State = null;

function formatDateRange(start: string, end: string) {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const yearOpts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  const sameYear = s.getFullYear() === e.getFullYear();
  if (sameYear) {
    return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", yearOpts)}`;
  }
  return `${s.toLocaleDateString("en-US", yearOpts)} – ${e.toLocaleDateString("en-US", yearOpts)}`;
}

const statusConfig = {
  pending: { bg: "rgba(245, 158, 11, 0.14)", fg: "#b45309", label: "Pending" },
  approved: { bg: "rgba(22, 163, 74, 0.12)", fg: "#15803d", label: "Approved" },
  declined: { bg: "rgba(220, 38, 38, 0.10)", fg: "#b91c1c", label: "Declined" },
} as const;

function getStatusConfig(status: string) {
  return statusConfig[status as keyof typeof statusConfig] ?? statusConfig.pending;
}

export function ReserveShell({
  properties,
  requests,
}: {
  properties: Property[];
  requests: BlockRequest[];
}) {
  const [state, formAction, isPending] = useActionState(
    submitBlockRequest,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
    }
  }, [state]);

  const inputClass =
    "w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-offset-0";
  const inputStyle = {
    backgroundColor: "var(--color-white)",
    borderColor: "var(--color-warm-gray-200)",
    color: "var(--color-text-primary)",
  };
  const labelClass = "block text-xs font-semibold mb-1.5";
  const labelStyle = { color: "var(--color-text-secondary)" };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          Reserve
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Request time off for your home or review past requests.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left: Request form */}
        <div className="lg:col-span-2">
          <div
            className="rounded-2xl border p-5"
            style={{
              backgroundColor: "var(--color-white)",
              borderColor: "var(--color-warm-gray-200)",
            }}
          >
            <h2
              className="mb-4 text-sm font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              Request a block
            </h2>

            {state?.ok && (
              <div
                className="mb-4 rounded-xl px-4 py-3 text-sm font-medium"
                style={{
                  backgroundColor: "rgba(22, 163, 74, 0.10)",
                  color: "#15803d",
                  border: "1px solid rgba(22, 163, 74, 0.20)",
                }}
              >
                Request submitted. We will review it and get back to you shortly.
              </div>
            )}

            {state && !state.ok && state.message && (
              <div
                className="mb-4 rounded-xl px-4 py-3 text-sm font-medium"
                style={{
                  backgroundColor: "rgba(220, 38, 38, 0.08)",
                  color: "#b91c1c",
                  border: "1px solid rgba(220, 38, 38, 0.18)",
                }}
              >
                {state.message}
              </div>
            )}

            <form ref={formRef} action={formAction} className="flex flex-col gap-4">
              <div>
                <label htmlFor="property_id" className={labelClass} style={labelStyle}>
                  Property
                </label>
                <select
                  id="property_id"
                  name="property_id"
                  required
                  className={inputClass}
                  style={inputStyle}
                >
                  <option value="">Select a property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="start_date" className={labelClass} style={labelStyle}>
                  Check-in date
                </label>
                <input
                  id="start_date"
                  name="start_date"
                  type="date"
                  required
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="end_date" className={labelClass} style={labelStyle}>
                  Check-out date
                </label>
                <input
                  id="end_date"
                  name="end_date"
                  type="date"
                  required
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="note" className={labelClass} style={labelStyle}>
                  Notes (optional)
                </label>
                <textarea
                  id="note"
                  name="note"
                  rows={3}
                  className={inputClass}
                  style={{ ...inputStyle, resize: "vertical" }}
                  placeholder="Any context for this request..."
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="mt-1 w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                style={{ backgroundColor: "var(--color-brand)" }}
              >
                {isPending ? "Submitting..." : "Submit request"}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Past requests */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          <h2
            className="text-sm font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Past requests
          </h2>

          {requests.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck size={26} weight="duotone" />}
              title="No requests yet"
              body="Your submitted block requests will appear here."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {requests.map((req) => {
                const propertyLabel =
                  properties.find((p) => p.id === req.property_id)?.label ?? "Property";
                const ss = getStatusConfig(req.status);
                return (
                  <div
                    key={req.id}
                    className="rounded-2xl border p-4"
                    style={{
                      backgroundColor: "var(--color-white)",
                      borderColor: "var(--color-warm-gray-200)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="text-sm font-semibold"
                            style={{ color: "var(--color-text-primary)" }}
                          >
                            {formatDateRange(req.start_date, req.end_date)}
                          </span>
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-semibold"
                            style={{ backgroundColor: ss.bg, color: ss.fg }}
                          >
                            {ss.label}
                          </span>
                        </div>
                        <div
                          className="mt-0.5 text-xs"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {propertyLabel}
                        </div>
                        {req.note && (
                          <div
                            className="mt-1.5 text-xs italic"
                            style={{ color: "var(--color-text-secondary)" }}
                          >
                            {req.note}
                          </div>
                        )}
                      </div>
                      <div
                        className="shrink-0 text-xs"
                        style={{ color: "var(--color-text-tertiary)" }}
                      >
                        {formatMedium(req.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Hospitable CTA */}
      <div
        className="rounded-2xl border p-6"
        style={{
          backgroundColor: "rgba(2, 170, 235, 0.04)",
          borderColor: "rgba(2, 170, 235, 0.18)",
        }}
      >
        <h3
          className="text-sm font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Prefer to book directly in Hospitable?
        </h3>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Hospitable lets you create owner stays from your calendar with options for cleaning, smart
          lock codes, and checkout timing.
        </p>
        <ol className="mt-4 flex flex-col gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          <li className="flex items-start gap-2">
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
              style={{ backgroundColor: "rgba(2, 170, 235, 0.12)", color: "var(--color-brand)" }}
            >
              1
            </span>
            Sign in to Hospitable at app.hospitable.com
          </li>
          <li className="flex items-start gap-2">
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
              style={{ backgroundColor: "rgba(2, 170, 235, 0.12)", color: "var(--color-brand)" }}
            >
              2
            </span>
            Open the Calendar view for your property
          </li>
          <li className="flex items-start gap-2">
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
              style={{ backgroundColor: "rgba(2, 170, 235, 0.12)", color: "var(--color-brand)" }}
            >
              3
            </span>
            Click any available date range and choose &quot;Owner Stay&quot;
          </li>
          <li className="flex items-start gap-2">
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
              style={{ backgroundColor: "rgba(2, 170, 235, 0.12)", color: "var(--color-brand)" }}
            >
              4
            </span>
            Configure cleaning, lock codes, and checkout, then confirm
          </li>
        </ol>
        <a
          href="https://app.hospitable.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80"
          style={{
            backgroundColor: "var(--color-brand)",
            color: "#fff",
          }}
        >
          Open Hospitable
        </a>
      </div>
    </div>
  );
}
