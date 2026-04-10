"use client";

import { useState, useTransition } from "react";
import {
  DownloadSimple,
  Buildings,
  CalendarX,
  CheckCircle,
  FileText,
  Table,
} from "@phosphor-icons/react";
import { exportUserData } from "../actions";

function jsonToCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return "";
          const str = String(val);
          // Escape commas and quotes
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(","),
    ),
  ];
  return lines.join("\n");
}

export function DataExportSection() {
  const [pending, startTransition] = useTransition();
  const [downloaded, setDownloaded] = useState(false);

  function handleExport() {
    setDownloaded(false);
    startTransition(async () => {
      const result = await exportUserData();

      if (result.ok && result.data) {
        const parsed = JSON.parse(result.data);
        const date = new Date().toISOString().split("T")[0];

        // Build CSV content for properties
        const propertiesCsv = jsonToCsv(
          (parsed.properties ?? []).map((p: Record<string, unknown>) => ({
            Name: p.name ?? "",
            Type: p.property_type ?? "",
            Address: p.address_line1 ?? "",
            "Address 2": p.address_line2 ?? "",
            City: p.city ?? "",
            State: p.state ?? "",
            "Postal Code": p.postal_code ?? "",
            Bedrooms: p.bedrooms ?? "",
            Bathrooms: p.bathrooms ?? "",
            "Guest Capacity": p.guest_capacity ?? "",
            Active: p.active ? "Yes" : "No",
            "Added On": p.created_at ?? "",
          })),
        );

        // Build CSV for calendar blocks
        const blocks = parsed.calendar_blocks?.entries ?? [];
        const blocksCsv = jsonToCsv(
          blocks.map((b: Record<string, unknown>) => ({
            "Start Date": b.start_date ?? "",
            "End Date": b.end_date ?? "",
            Status: b.status ?? "",
            "Requested On": b.created_at ?? "",
          })),
        );

        // Build summary section
        const summary = [
          `Parcel Data Export`,
          `Exported: ${date}`,
          `Owner: ${parsed.profile?.full_name ?? ""}`,
          `Email: ${parsed.profile?.email ?? ""}`,
          ``,
          `Properties: ${(parsed.properties ?? []).length}`,
          `Calendar Blocks: ${parsed.calendar_blocks?.total_count ?? 0} total (${parsed.calendar_blocks?.approved ?? 0} approved, ${parsed.calendar_blocks?.pending ?? 0} pending, ${parsed.calendar_blocks?.denied ?? 0} denied)`,
        ].join("\n");

        // Combine into one CSV file with sections
        const fullCsv = [
          "SUMMARY",
          summary,
          "",
          "",
          "PROPERTIES",
          propertiesCsv || "No properties found",
          "",
          "",
          "CALENDAR BLOCKS",
          blocksCsv || "No calendar blocks found",
        ].join("\n");

        const blob = new Blob([fullCsv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `parcel-export-${date}.csv`;
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
        Download a copy of your property data as a spreadsheet.
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

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <div
            className="flex items-center gap-3 rounded-lg px-4 py-3"
            style={{ backgroundColor: "var(--color-warm-gray-50)" }}
          >
            <Buildings size={18} weight="duotone" style={{ color: "var(--color-brand)" }} />
            <div>
              <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                Properties
              </span>
              <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                Addresses, type, bedrooms, capacity, status
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-3 rounded-lg px-4 py-3"
            style={{ backgroundColor: "var(--color-warm-gray-50)" }}
          >
            <CalendarX size={18} weight="duotone" style={{ color: "var(--color-brand)" }} />
            <div>
              <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                Calendar blocks
              </span>
              <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                Date ranges, status, total/approved/pending counts
              </p>
            </div>
          </div>
        </div>

        {/* Preview mock */}
        <div className="mb-6">
          <p
            className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            <Table size={12} weight="bold" />
            Preview
          </p>
          <div
            className="overflow-hidden rounded-lg border"
            style={{ borderColor: "var(--color-warm-gray-200)" }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr style={{ backgroundColor: "var(--color-warm-gray-50)" }}>
                    <th className="px-3 py-2 font-semibold" style={{ color: "var(--color-text-tertiary)" }}>Name</th>
                    <th className="px-3 py-2 font-semibold" style={{ color: "var(--color-text-tertiary)" }}>Address</th>
                    <th className="px-3 py-2 font-semibold" style={{ color: "var(--color-text-tertiary)" }}>City</th>
                    <th className="px-3 py-2 font-semibold" style={{ color: "var(--color-text-tertiary)" }}>State</th>
                    <th className="px-3 py-2 font-semibold" style={{ color: "var(--color-text-tertiary)" }}>Beds</th>
                    <th className="px-3 py-2 font-semibold" style={{ color: "var(--color-text-tertiary)" }}>Active</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t" style={{ borderColor: "var(--color-warm-gray-100)" }}>
                    <td className="px-3 py-2" style={{ color: "var(--color-text-secondary)" }}>34 Downing</td>
                    <td className="px-3 py-2" style={{ color: "var(--color-text-secondary)" }}>34 Downing Dr</td>
                    <td className="px-3 py-2" style={{ color: "var(--color-text-secondary)" }}>Dallas</td>
                    <td className="px-3 py-2" style={{ color: "var(--color-text-secondary)" }}>TX</td>
                    <td className="px-3 py-2" style={{ color: "var(--color-text-secondary)" }}>3</td>
                    <td className="px-3 py-2" style={{ color: "var(--color-text-secondary)" }}>Yes</td>
                  </tr>
                  <tr className="border-t" style={{ borderColor: "var(--color-warm-gray-100)" }}>
                    <td className="px-3 py-2" style={{ color: "var(--color-text-tertiary)" }} colSpan={6}>
                      ... your properties will appear here
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Export button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: "var(--color-brand)" }}
          >
            <DownloadSimple size={16} weight="bold" />
            {pending ? "Exporting..." : "Download CSV"}
          </button>
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
            <FileText size={12} />
            Opens in Excel, Google Sheets, or any spreadsheet app
          </span>
        </div>

        {/* Success message */}
        {downloaded && (
          <div
            className="mt-4 flex items-center gap-2.5 rounded-lg border px-4 py-3"
            style={{
              backgroundColor: "rgba(22, 163, 74, 0.08)",
              borderColor: "rgba(22, 163, 74, 0.25)",
            }}
          >
            <CheckCircle size={18} weight="duotone" style={{ color: "var(--color-success)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--color-success)" }}>
              Your data has been downloaded as a CSV file.
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
