import type { Metadata } from "next";
import { Receipt, ChartLineUp, ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = { title: "Financials" };
export const dynamic = "force-dynamic";

export default function FinancialsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div
        className="rounded-2xl border p-6"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: "var(--color-warm-gray-200)",
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: "rgba(2, 170, 235, 0.10)",
              color: "var(--color-brand)",
            }}
          >
            <Receipt size={18} weight="duotone" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2
                className="text-base font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Invoices
              </h2>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.14)",
                  color: "#b45309",
                }}
              >
                Coming soon
              </span>
            </div>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Your monthly management fee, onboarding fee, and any reimbursements will appear here
              once billing is connected.
            </p>
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl border p-6"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: "var(--color-warm-gray-200)",
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: "rgba(22, 163, 74, 0.10)",
              color: "#15803d",
            }}
          >
            <ChartLineUp size={18} weight="duotone" />
          </div>
          <div className="flex-1">
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              Booking Revenue
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Track your booking performance, occupancy, and revenue directly in Hospitable, where
              all booking data lives.
            </p>
            <a
              href="https://app.hospitable.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
              style={{
                backgroundColor: "rgba(22, 163, 74, 0.10)",
                color: "#15803d",
                border: "1px solid rgba(22, 163, 74, 0.20)",
              }}
            >
              View in Hospitable <ArrowSquareOut size={14} weight="bold" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
