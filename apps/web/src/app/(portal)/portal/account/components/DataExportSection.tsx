"use client";

import { useState, useTransition } from "react";
import {
  DownloadSimple,
  Buildings,
  CalendarCheck,
  CurrencyDollar,
  CalendarX,
  CheckCircle,
  Info,
} from "@phosphor-icons/react";
import { exportUserData } from "../actions";

const INCLUDED_DATA = [
  { label: "Properties", icon: Buildings },
  { label: "Bookings", icon: CalendarCheck },
  { label: "Payouts", icon: CurrencyDollar },
  { label: "Calendar blocks", icon: CalendarX },
] as const;

export function DataExportSection() {
  const [pending, startTransition] = useTransition();
  const [downloaded, setDownloaded] = useState(false);

  function handleExport() {
    setDownloaded(false);
    startTransition(async () => {
      const result = await exportUserData();

      if (result.ok && result.data) {
        const blob = new Blob([result.data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const date = new Date().toISOString().split("T")[0];
        const a = document.createElement("a");
        a.href = url;
        a.download = `parcel-export-${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setDownloaded(true);
      }
    });
  }

  return (
    <section id="data-export">
      <h2
        className="text-xl font-semibold tracking-tight"
        style={{ color: "var(--color-text-primary)" }}
      >
        Data Export
      </h2>
      <p
        className="mb-6 text-sm"
        style={{ color: "var(--color-text-secondary)" }}
      >
        Download a copy of all your data.
      </p>

      <div
        className="rounded-2xl border p-7"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: "var(--color-warm-gray-200)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* What's included */}
        <p
          className="mb-4 text-sm font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Included in your export
        </p>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {INCLUDED_DATA.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5"
                style={{ backgroundColor: "var(--color-warm-gray-50)" }}
              >
                <Icon
                  size={16}
                  weight="duotone"
                  style={{ color: "var(--color-brand)" }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Export button */}
        <button
          type="button"
          disabled={pending}
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: "var(--color-brand)" }}
        >
          <DownloadSimple size={16} weight="bold" />
          {pending ? "Exporting..." : "Export my data"}
        </button>

        {/* Success message */}
        {downloaded && (
          <div
            className="mt-4 flex items-center gap-2.5 rounded-lg border px-4 py-3"
            style={{
              backgroundColor: "rgba(22, 163, 74, 0.08)",
              borderColor: "rgba(22, 163, 74, 0.25)",
            }}
          >
            <CheckCircle
              size={18}
              weight="duotone"
              style={{ color: "var(--color-success)" }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: "var(--color-success)" }}
            >
              Your data has been downloaded.
            </span>
          </div>
        )}

        {/* Info note */}
        <div
          className="mt-5 flex items-start gap-2.5 rounded-lg px-4 py-3"
          style={{ backgroundColor: "var(--color-warm-gray-50)" }}
        >
          <Info
            size={16}
            weight="duotone"
            className="mt-0.5 shrink-0"
            style={{ color: "var(--color-text-tertiary)" }}
          />
          <span
            className="text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Your data will be downloaded as a JSON file. No data is sent to
            external servers.
          </span>
        </div>
      </div>
    </section>
  );
}
