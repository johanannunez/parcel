"use client";

import { useState, useTransition } from "react";
import {
  DownloadSimple,
  Buildings,
  CalendarX,
  CheckCircle,
  FileText,
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

type PreviewTab = "properties" | "blocks";

export function DataExportSection() {
  const [pending, startTransition] = useTransition();
  const [downloaded, setDownloaded] = useState(false);
  const [previewTab, setPreviewTab] = useState<PreviewTab>("properties");

  function handleExport() {
    setDownloaded(false);
    startTransition(async () => {
      const result = await exportUserData();

      if (result.ok && result.data) {
        const parsed = JSON.parse(result.data);
        const date = new Date().toISOString().split("T")[0];

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

        const blocks = parsed.calendar_blocks?.entries ?? [];
        const blocksCsv = jsonToCsv(
          blocks.map((b: Record<string, unknown>) => ({
            "Start Date": b.start_date ?? "",
            "End Date": b.end_date ?? "",
            Status: b.status ?? "",
            "Requested On": b.created_at ?? "",
          })),
        );

        const summary = [
          `Parcel Data Export`,
          `Exported: ${date}`,
          `Owner: ${parsed.profile?.full_name ?? ""}`,
          `Email: ${parsed.profile?.email ?? ""}`,
          ``,
          `Properties: ${(parsed.properties ?? []).length}`,
          `Calendar Blocks: ${parsed.calendar_blocks?.total_count ?? 0} total (${parsed.calendar_blocks?.approved ?? 0} approved, ${parsed.calendar_blocks?.pending ?? 0} pending, ${parsed.calendar_blocks?.denied ?? 0} denied)`,
        ].join("\n");

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
        {/* Clickable data cards */}
        <p
          className="mb-3 text-sm font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Click to preview what's included
        </p>

        <div className="mb-5 flex gap-3">
          <button
            type="button"
            onClick={() => setPreviewTab("properties")}
            className="flex flex-1 items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all"
            style={{
              borderColor: previewTab === "properties" ? "var(--color-brand)" : "var(--color-warm-gray-200)",
              backgroundColor: previewTab === "properties" ? "rgba(2, 170, 235, 0.04)" : "var(--color-warm-gray-50)",
              boxShadow: previewTab === "properties" ? "0 0 0 1px var(--color-brand)" : "none",
            }}
          >
            <Buildings
              size={20}
              weight="duotone"
              style={{ color: previewTab === "properties" ? "var(--color-brand)" : "var(--color-text-tertiary)" }}
            />
            <div>
              <span
                className="text-sm font-semibold"
                style={{ color: previewTab === "properties" ? "var(--color-brand)" : "var(--color-text-primary)" }}
              >
                Properties
              </span>
              <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                Addresses, type, bedrooms, capacity, status
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPreviewTab("blocks")}
            className="flex flex-1 items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all"
            style={{
              borderColor: previewTab === "blocks" ? "var(--color-brand)" : "var(--color-warm-gray-200)",
              backgroundColor: previewTab === "blocks" ? "rgba(2, 170, 235, 0.04)" : "var(--color-warm-gray-50)",
              boxShadow: previewTab === "blocks" ? "0 0 0 1px var(--color-brand)" : "none",
            }}
          >
            <CalendarX
              size={20}
              weight="duotone"
              style={{ color: previewTab === "blocks" ? "var(--color-brand)" : "var(--color-text-tertiary)" }}
            />
            <div>
              <span
                className="text-sm font-semibold"
                style={{ color: previewTab === "blocks" ? "var(--color-brand)" : "var(--color-text-primary)" }}
              >
                Calendar Blocks
              </span>
              <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                Date ranges, status, approval counts
              </p>
            </div>
          </button>
        </div>

        {/* Preview Table */}
        <div
          className="mb-6 overflow-hidden rounded-lg border"
          style={{ borderColor: "var(--color-warm-gray-200)" }}
        >
          {previewTab === "properties" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr style={{ backgroundColor: "var(--color-warm-gray-50)" }}>
                    <Th>Name</Th>
                    <Th>Type</Th>
                    <Th>Address</Th>
                    <Th>City</Th>
                    <Th>State</Th>
                    <Th>Beds</Th>
                    <Th>Baths</Th>
                    <Th>Guests</Th>
                    <Th>Active</Th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t" style={{ borderColor: "var(--color-warm-gray-100)" }}>
                    <Td bold>The White House</Td>
                    <Td>STR</Td>
                    <Td>1600 Pennsylvania Ave NW</Td>
                    <Td>Washington</Td>
                    <Td>DC</Td>
                    <Td>16</Td>
                    <Td>35</Td>
                    <Td>50</Td>
                    <Td><ActiveBadge active /></Td>
                  </tr>
                  <tr className="border-t" style={{ borderColor: "var(--color-warm-gray-100)" }}>
                    <Td bold>Camp David</Td>
                    <Td>MTR</Td>
                    <Td>14222 Camp David Rd</Td>
                    <Td>Thurmont</Td>
                    <Td>MD</Td>
                    <Td>6</Td>
                    <Td>8</Td>
                    <Td>20</Td>
                    <Td><ActiveBadge active /></Td>
                  </tr>
                  <tr className="border-t" style={{ borderColor: "var(--color-warm-gray-100)" }}>
                    <Td bold>Blair House</Td>
                    <Td>Co-hosting</Td>
                    <Td>1651 Pennsylvania Ave NW</Td>
                    <Td>Washington</Td>
                    <Td>DC</Td>
                    <Td>14</Td>
                    <Td>18</Td>
                    <Td>30</Td>
                    <Td><ActiveBadge active={false} /></Td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr style={{ backgroundColor: "var(--color-warm-gray-50)" }}>
                    <Th>Start Date</Th>
                    <Th>End Date</Th>
                    <Th>Duration</Th>
                    <Th>Status</Th>
                    <Th>Requested On</Th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t" style={{ borderColor: "var(--color-warm-gray-100)" }}>
                    <Td>Apr 15, 2026</Td>
                    <Td>Apr 20, 2026</Td>
                    <Td>5 nights</Td>
                    <Td><StatusBadge status="approved" /></Td>
                    <Td>Apr 2, 2026</Td>
                  </tr>
                  <tr className="border-t" style={{ borderColor: "var(--color-warm-gray-100)" }}>
                    <Td>May 1, 2026</Td>
                    <Td>May 3, 2026</Td>
                    <Td>2 nights</Td>
                    <Td><StatusBadge status="pending" /></Td>
                    <Td>Apr 8, 2026</Td>
                  </tr>
                  <tr className="border-t" style={{ borderColor: "var(--color-warm-gray-100)" }}>
                    <Td>Jun 10, 2026</Td>
                    <Td>Jun 14, 2026</Td>
                    <Td>4 nights</Td>
                    <Td><StatusBadge status="denied" /></Td>
                    <Td>Mar 28, 2026</Td>
                  </tr>
                </tbody>
              </table>
              {/* Block summary */}
              <div
                className="flex items-center gap-4 border-t px-3 py-2.5"
                style={{ borderColor: "var(--color-warm-gray-100)", backgroundColor: "var(--color-warm-gray-50)" }}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-tertiary)" }}>
                  Summary
                </span>
                <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  3 total &middot; 1 approved &middot; 1 pending &middot; 1 denied
                </span>
              </div>
            </div>
          )}
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

/* ─── Table Helpers ─── */

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-tertiary)" }}>
      {children}
    </th>
  );
}

function Td({ children, bold = false }: { children: React.ReactNode; bold?: boolean }) {
  return (
    <td
      className={`px-3 py-2.5 text-xs ${bold ? "font-medium" : ""}`}
      style={{ color: bold ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}
    >
      {children}
    </td>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{
        backgroundColor: active ? "rgba(22, 163, 74, 0.08)" : "var(--color-warm-gray-100)",
        color: active ? "var(--color-success)" : "var(--color-text-tertiary)",
      }}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    approved: { bg: "rgba(22, 163, 74, 0.08)", text: "var(--color-success)" },
    pending: { bg: "rgba(245, 158, 11, 0.08)", text: "#d97706" },
    denied: { bg: "rgba(220, 38, 38, 0.08)", text: "var(--color-error)" },
  };
  const c = colors[status] ?? { bg: "var(--color-warm-gray-100)", text: "var(--color-text-tertiary)" };
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {status}
    </span>
  );
}
