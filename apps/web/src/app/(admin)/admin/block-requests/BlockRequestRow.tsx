"use client";

import { useState, useTransition } from "react";
import { Check, X, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { decideBlockRequest } from "@/app/(portal)/portal/calendar/actions";

type Row = {
  id: string;
  status: "pending" | "approved" | "declined";
  startDate: string;
  endDate: string;
  note: string | null;
  createdAt: string;
  ownerName: string | null;
  ownerEmail: string;
  propertyLabel: string;
};

function fmtDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtRange(start: string, end: string) {
  if (start === end) return fmtDate(start);
  return `${fmtDate(start)} → ${fmtDate(end)}`;
}

function fmtCreated(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const STATUS_STYLES: Record<
  Row["status"],
  { bg: string; fg: string; label: string }
> = {
  pending: {
    bg: "rgba(245, 158, 11, 0.16)",
    fg: "#fbbf24",
    label: "Pending",
  },
  approved: {
    bg: "rgba(22, 163, 74, 0.16)",
    fg: "#4ade80",
    label: "Approved",
  },
  declined: {
    bg: "rgba(220, 38, 38, 0.16)",
    fg: "#f87171",
    label: "Declined",
  },
};

export function BlockRequestRow({ row }: { row: Row }) {
  const [status, setStatus] = useState(row.status);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const decide = (decision: "approved" | "declined") => {
    setError(null);
    startTransition(async () => {
      const result = await decideBlockRequest({ id: row.id, decision });
      if (result.ok) {
        setStatus(decision);
      } else {
        setError(result.error);
      }
    });
  };

  const style = STATUS_STYLES[status];

  return (
    <div
      className="rounded-xl border p-5"
      style={{
        backgroundColor: "var(--color-charcoal)",
        borderColor: "rgba(255,255,255,0.1)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-white">
              {fmtRange(row.startDate, row.endDate)}
            </h3>
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{ backgroundColor: style.bg, color: style.fg }}
            >
              {style.label}
            </span>
          </div>
          <div
            className="mt-1 text-sm"
            style={{ color: "rgba(255,255,255,0.75)" }}
          >
            {row.propertyLabel}
          </div>
          <div
            className="mt-0.5 text-xs"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            {row.ownerName ?? row.ownerEmail}
            {row.ownerName ? ` • ${row.ownerEmail}` : null} • submitted{" "}
            {fmtCreated(row.createdAt)}
          </div>
          {row.note ? (
            <p
              className="mt-3 rounded-lg border px-3 py-2 text-sm"
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                borderColor: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              {row.note}
            </p>
          ) : null}
        </div>

        {status === "pending" ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => decide("declined")}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{
                borderColor: "rgba(248, 113, 113, 0.4)",
                color: "#f87171",
                backgroundColor: "transparent",
              }}
            >
              <X size={14} weight="bold" /> Decline
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => decide("approved")}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: "#16a34a",
                color: "#ffffff",
              }}
            >
              <Check size={14} weight="bold" /> Approve
            </button>
          </div>
        ) : null}
      </div>

      {error ? (
        <div
          className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
          style={{
            backgroundColor: "rgba(248, 113, 113, 0.08)",
            color: "#fecaca",
          }}
        >
          <WarningCircle size={14} weight="fill" /> {error}
        </div>
      ) : null}

      {status !== "pending" && status !== row.status ? (
        <div
          className="mt-3 flex items-center gap-2 text-xs"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          <CheckCircle size={12} weight="fill" /> Updated. Remember to{" "}
          {status === "approved" ? "block these dates" : "let the owner know"}{" "}
          in Hospitable.
        </div>
      ) : null}
    </div>
  );
}
