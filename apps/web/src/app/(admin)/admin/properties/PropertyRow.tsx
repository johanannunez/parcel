"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle,
  WarningCircle,
  CaretDown,
  CaretUp,
  LinkSimple,
  LinkBreak,
} from "@phosphor-icons/react";
import { saveHospitableConnection } from "./actions";

type Row = {
  id: string;
  name: string | null;
  address: string;
  location: string;
  ownerName: string | null;
  ownerEmail: string;
  hospitableId: string | null;
  icalUrl: string | null;
  active: boolean;
  bookingCount: number;
};

export function PropertyRow({ row }: { row: Row }) {
  const [open, setOpen] = useState(false);
  const [hospId, setHospId] = useState(row.hospitableId ?? "");
  const [icalUrl, setIcalUrl] = useState(row.icalUrl ?? "");
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    msg: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  const isConnected = !!row.hospitableId;

  const onSave = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await saveHospitableConnection({
        propertyId: row.id,
        hospitableId: hospId.trim() || null,
        icalUrl: icalUrl.trim() || null,
      });
      if (result.ok) {
        setFeedback({ kind: "success", msg: "Saved." });
      } else {
        setFeedback({ kind: "error", msg: result.error });
      }
    });
  };

  const onDisconnect = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await saveHospitableConnection({
        propertyId: row.id,
        hospitableId: null,
        icalUrl: null,
      });
      if (result.ok) {
        setHospId("");
        setIcalUrl("");
        setFeedback({ kind: "success", msg: "Disconnected." });
      } else {
        setFeedback({ kind: "error", msg: result.error });
      }
    });
  };

  return (
    <div
      className="rounded-xl border"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-8 w-8 flex-none items-center justify-center rounded-lg"
            style={{
              backgroundColor: isConnected
                ? "rgba(22, 163, 74, 0.16)"
                : "rgba(245, 158, 11, 0.16)",
            }}
          >
            {isConnected ? (
              <LinkSimple size={14} weight="bold" style={{ color: "#4ade80" }} />
            ) : (
              <LinkBreak size={14} weight="bold" style={{ color: "#fbbf24" }} />
            )}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                {row.address}
              </span>
              {!row.active ? (
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                  style={{
                    backgroundColor: "var(--color-warm-gray-100)",
                    color: "var(--color-text-tertiary)",
                  }}
                >
                  Inactive
                </span>
              ) : null}
              {row.bookingCount > 0 ? (
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                  style={{
                    backgroundColor: "rgba(22, 163, 74, 0.16)",
                    color: "#4ade80",
                  }}
                >
                  {row.bookingCount} booking{row.bookingCount !== 1 ? "s" : ""}
                </span>
              ) : null}
            </div>
            <div
              className="truncate text-xs"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {row.location}
              {row.name ? ` · ${row.name}` : ""}
              {" · "}
              {row.ownerName ?? row.ownerEmail}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <span
              className="hidden text-xs sm:block"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Connected
            </span>
          ) : (
            <span
              className="hidden text-xs font-semibold sm:block"
              style={{ color: "#fbbf24" }}
            >
              Not connected
            </span>
          )}
          {open ? (
            <CaretUp
              size={14}
              weight="bold"
              style={{ color: "var(--color-text-tertiary)" }}
            />
          ) : (
            <CaretDown
              size={14}
              weight="bold"
              style={{ color: "var(--color-text-tertiary)" }}
            />
          )}
        </div>
      </button>

      {open ? (
        <div
          className="border-t px-5 pb-5 pt-4"
          style={{ borderColor: "var(--color-warm-gray-100)" }}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Hospitable property ID">
              <input
                type="text"
                value={hospId}
                onChange={(e) => setHospId(e.target.value)}
                placeholder="e.g. prop_abc123"
                className="h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none transition-colors focus:border-[#f59e0b]"
                style={{ borderColor: "var(--color-warm-gray-200)", color: "var(--color-text-primary)" }}
              />
            </Field>
            <Field label="iCal feed URL">
              <input
                type="url"
                value={icalUrl}
                onChange={(e) => setIcalUrl(e.target.value)}
                placeholder="https://ical.hospitable.com/..."
                className="h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none transition-colors focus:border-[#f59e0b]"
                style={{ borderColor: "var(--color-warm-gray-200)", color: "var(--color-text-primary)" }}
              />
            </Field>
          </div>

          <p
            className="mt-3 text-xs leading-relaxed"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Find these in Hospitable under the property settings. The iCal URL
            is what owners see in the calendar sync section of their portal.
          </p>

          {feedback ? (
            <div
              className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
              style={{
                backgroundColor:
                  feedback.kind === "success"
                    ? "rgba(22, 163, 74, 0.1)"
                    : "rgba(248, 113, 113, 0.1)",
                color:
                  feedback.kind === "success" ? "#4ade80" : "#fecaca",
              }}
            >
              {feedback.kind === "success" ? (
                <CheckCircle size={14} weight="fill" />
              ) : (
                <WarningCircle size={14} weight="fill" />
              )}
              {feedback.msg}
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-between">
            {isConnected ? (
              <button
                type="button"
                disabled={pending}
                onClick={onDisconnect}
                className="text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ color: "#f87171" }}
              >
                Disconnect
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              disabled={pending || (!hospId.trim() && !icalUrl.trim())}
              onClick={onSave}
              className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: "#f59e0b",
                color: "#1a1a1a",
              }}
            >
              {pending ? "Saving..." : "Save connection"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
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
