"use client";

import { useState, useTransition } from "react";
import { ArrowsClockwise, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { triggerSync } from "./sync-action";
import type { SyncResult } from "@/lib/hospitable-sync";

export function SyncButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SyncResult | null>(null);

  const onSync = () => {
    setResult(null);
    startTransition(async () => {
      const r = await triggerSync();
      setResult(r);
    });
  };

  const hasErrors = (result?.errors.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={onSync}
        className="inline-flex items-center gap-2 self-start rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: "#f59e0b", color: "#1a1a1a" }}
      >
        <ArrowsClockwise
          size={16}
          weight="bold"
          className={pending ? "animate-spin" : ""}
        />
        {pending ? "Syncing from Hospitable..." : "Sync now"}
      </button>

      {result ? (
        <div
          className="rounded-xl border p-4 text-sm"
          style={{
            backgroundColor: hasErrors
              ? "rgba(248, 113, 113, 0.06)"
              : "rgba(22, 163, 74, 0.06)",
            borderColor: hasErrors
              ? "rgba(248, 113, 113, 0.2)"
              : "rgba(22, 163, 74, 0.2)",
          }}
        >
          <div className="flex items-center gap-2">
            {hasErrors ? (
              <WarningCircle
                size={16}
                weight="fill"
                style={{ color: "#f87171" }}
              />
            ) : (
              <CheckCircle
                size={16}
                weight="fill"
                style={{ color: "#4ade80" }}
              />
            )}
            <span className="font-semibold text-white">
              Sync {hasErrors ? "completed with issues" : "complete"}
            </span>
          </div>
          <ul
            className="mt-2 flex flex-col gap-1 text-xs"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            <li>
              Properties matched: {result.propertiesMatched}
              {result.propertiesCreated > 0
                ? `, created: ${result.propertiesCreated}`
                : ""}
              {result.propertiesUnmatched.length > 0
                ? ` (${result.propertiesUnmatched.length} failed: ${result.propertiesUnmatched.join(", ")})`
                : ""}
            </li>
            <li>Reservations synced: {result.reservationsUpserted}</li>
            {result.errors.map((e, i) => (
              <li key={i} style={{ color: "#fca5a5" }}>
                {e}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
