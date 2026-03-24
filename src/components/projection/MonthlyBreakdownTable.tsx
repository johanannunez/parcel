"use client";

import AnimatedSection from "@/components/ui/AnimatedSection";
import { formatCurrency } from "@/lib/projection-calc";
import type { MonthlyBreakdown, AnnualSummary } from "@/lib/projection-calc";

interface MonthlyBreakdownTableProps {
  months: MonthlyBreakdown[];
  annual: AnnualSummary;
  managementFeePercent: number;
}

export default function MonthlyBreakdownTable({
  months,
  annual,
  managementFeePercent,
}: MonthlyBreakdownTableProps) {
  const feeLabel = `Mgmt Fee (${Math.round(managementFeePercent * 100)}%)`;

  return (
    <section className="py-12 px-[var(--section-pad-x)]">
      <div className="max-w-[var(--max-width)] mx-auto">
        <AnimatedSection direction="up">
          <div className="flex items-center gap-3 mb-3">
            <span
              className="block h-[2px] w-10 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, var(--brand-bright), var(--brand-deep))",
              }}
              aria-hidden="true"
            />
            <span className="font-[family-name:var(--font-nexa)] text-[11px] tracking-[0.25em] text-[var(--brand-bright)] uppercase">
              Detailed Breakdown
            </span>
          </div>
          <h2 className="font-[family-name:var(--font-poppins)] text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-8">
            Month by Month
          </h2>
        </AnimatedSection>

        <AnimatedSection direction="up" delay={0.1}>
          <div
            className="rounded-[var(--radius-xl)] bg-[var(--surface)] border border-[var(--border)] overflow-hidden"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="bg-[var(--bg)] border-b border-[var(--border)]">
                    <th className="text-left px-5 py-3.5 text-xs font-medium font-[family-name:var(--font-raleway)] text-[var(--text-tertiary)] uppercase tracking-wider sticky left-0 bg-[var(--bg)] z-10">
                      Month
                    </th>
                    <th className="text-right px-4 py-3.5 text-xs font-medium font-[family-name:var(--font-raleway)] text-[var(--text-tertiary)] uppercase tracking-wider">
                      Rental Revenue
                    </th>
                    <th className="text-right px-4 py-3.5 text-xs font-medium font-[family-name:var(--font-raleway)] text-[var(--text-tertiary)] uppercase tracking-wider">
                      Cleaning Fees
                    </th>
                    <th className="text-right px-4 py-3.5 text-xs font-medium font-[family-name:var(--font-raleway)] text-[var(--text-tertiary)] uppercase tracking-wider">
                      {feeLabel}
                    </th>
                    <th className="text-right px-4 py-3.5 text-xs font-medium font-[family-name:var(--font-raleway)] text-[var(--text-tertiary)] uppercase tracking-wider">
                      Cleaning Costs
                    </th>
                    <th className="text-right px-5 py-3.5 text-xs font-medium font-[family-name:var(--font-raleway)] text-[var(--text-tertiary)] uppercase tracking-wider">
                      Net to Owner
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {months.map((m, i) => (
                    <tr
                      key={m.month}
                      className={`border-b border-[var(--border-subtle)] transition-colors duration-150 hover:bg-[var(--surface-hover)] ${
                        i % 2 === 1 ? "bg-[var(--bg)]/50" : ""
                      }`}
                    >
                      <td className="px-5 py-3.5 font-[family-name:var(--font-poppins)] text-sm font-semibold text-[var(--text-primary)] sticky left-0 bg-inherit z-10">
                        {m.month}
                      </td>
                      <td className="text-right px-4 py-3.5 font-[family-name:var(--font-nexa)] text-sm font-bold text-[var(--text-primary)]">
                        {formatCurrency(m.rentalRevenue)}
                      </td>
                      <td className="text-right px-4 py-3.5 font-[family-name:var(--font-raleway)] text-sm text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(m.cleaningRevenue)}
                      </td>
                      <td className="text-right px-4 py-3.5 font-[family-name:var(--font-raleway)] text-sm text-rose-500 dark:text-rose-400">
                        −{formatCurrency(m.managementFee)}
                      </td>
                      <td className="text-right px-4 py-3.5 font-[family-name:var(--font-raleway)] text-sm text-rose-500 dark:text-rose-400">
                        −{formatCurrency(m.cleaningCost)}
                      </td>
                      <td className="text-right px-5 py-3.5 font-[family-name:var(--font-nexa)] text-sm font-bold text-[var(--accent-warm)]">
                        {formatCurrency(m.netOwnerIncome)}
                      </td>
                    </tr>
                  ))}

                  {/* Totals row */}
                  <tr className="bg-[var(--bg)] border-t-2 border-[var(--border)]">
                    <td className="px-5 py-4 font-[family-name:var(--font-poppins)] text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider sticky left-0 bg-[var(--bg)] z-10">
                      Annual
                    </td>
                    <td className="text-right px-4 py-4 font-[family-name:var(--font-nexa)] text-sm font-bold text-[var(--text-primary)]">
                      {formatCurrency(annual.totalRentalRevenue)}
                    </td>
                    <td className="text-right px-4 py-4 font-[family-name:var(--font-nexa)] text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(annual.totalCleaningRevenue)}
                    </td>
                    <td className="text-right px-4 py-4 font-[family-name:var(--font-nexa)] text-sm font-bold text-rose-500 dark:text-rose-400">
                      −{formatCurrency(annual.totalManagementFee)}
                    </td>
                    <td className="text-right px-4 py-4 font-[family-name:var(--font-nexa)] text-sm font-bold text-rose-500 dark:text-rose-400">
                      −{formatCurrency(annual.totalCleaningCost)}
                    </td>
                    <td className="text-right px-5 py-4 font-[family-name:var(--font-nexa)] text-base font-bold text-[var(--accent-warm)]">
                      {formatCurrency(annual.totalNetOwnerIncome)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table footnote */}
          <p className="mt-3 text-xs font-[family-name:var(--font-raleway)] text-[var(--text-tertiary)]">
            Cleaning fees are collected from guests and paid to the cleaning
            service (net zero to owner). Management fee is calculated on rental
            revenue only.
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}
