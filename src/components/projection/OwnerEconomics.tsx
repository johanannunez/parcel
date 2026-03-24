"use client";

import { useRef, useState, useEffect } from "react";
import { useInView } from "motion/react";
import { ArrowDown, Info } from "@phosphor-icons/react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { formatCurrency } from "@/lib/projection-calc";
import type { AnnualSummary } from "@/lib/projection-calc";

interface OwnerEconomicsProps {
  annual: AnnualSummary;
  managementFeePercent: number;
  cleaningFeePerTurnover: number;
  avgStayNights: number;
  occupancyRate: number;
}

interface FlowRowProps {
  label: string;
  monthly: number;
  annual: number;
  type: "revenue" | "add" | "subtotal" | "deduction" | "net";
  delay: number;
  visible: boolean;
  note?: string;
}

function FlowRow({ label, monthly, annual, type, delay, visible, note }: FlowRowProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [visible, delay]);

  const isNet = type === "net";
  const isDeduction = type === "deduction";
  const isAdd = type === "add";
  const isSubtotal = type === "subtotal";

  return (
    <div
      className={`flex items-center justify-between py-4 px-5 md:px-7 transition-all duration-500 ${
        isNet
          ? "bg-[var(--accent-warm)]/10 border-2 border-[var(--accent-warm)]/40 rounded-[var(--radius-lg)] shadow-[0_0_24px_rgba(196,149,106,0.15)]"
          : isSubtotal
            ? "border-t-2 border-[var(--border)] border-dashed"
            : "border-b border-[var(--border-subtle)]"
      }`}
      style={{
        opacity: show ? 1 : 0,
        transform: show ? "translateX(0)" : "translateX(-16px)",
        transition:
          "opacity 0.4s ease-out, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {/* Label */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {(isDeduction || isAdd) && (
          <span
            className={`text-xs font-bold font-[family-name:var(--font-nexa)] ${
              isDeduction ? "text-rose-500" : "text-emerald-600"
            }`}
          >
            {isDeduction ? "−" : "+"}
          </span>
        )}
        <span
          className={`font-[family-name:var(--font-raleway)] text-sm md:text-base ${
            isNet
              ? "font-bold text-[var(--text-primary)]"
              : isSubtotal
                ? "font-semibold text-[var(--text-primary)]"
                : "text-[var(--text-secondary)]"
          }`}
        >
          {label}
        </span>
        {note && (
          <span className="hidden md:inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)] font-[family-name:var(--font-raleway)]">
            <Info size={12} />
            {note}
          </span>
        )}
      </div>

      {/* Monthly */}
      <div className="text-right w-28 md:w-36">
        <span
          className={`font-[family-name:var(--font-nexa)] text-base md:text-lg font-bold ${
            isNet
              ? "text-[var(--accent-warm)]"
              : isDeduction
                ? "text-rose-500 dark:text-rose-400"
                : isAdd
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-[var(--text-primary)]"
          }`}
        >
          {isDeduction ? "−" : isAdd ? "+" : ""}
          {formatCurrency(Math.abs(monthly))}
        </span>
        <span className="text-xs text-[var(--text-tertiary)] font-[family-name:var(--font-raleway)] ml-0.5">
          /mo
        </span>
      </div>

      {/* Annual */}
      <div className="text-right w-28 md:w-40 hidden sm:block">
        <span
          className={`font-[family-name:var(--font-nexa)] text-base md:text-lg font-bold ${
            isNet
              ? "text-[var(--accent-warm)]"
              : isDeduction
                ? "text-rose-500 dark:text-rose-400"
                : isAdd
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-[var(--text-primary)]"
          }`}
        >
          {isDeduction ? "−" : isAdd ? "+" : ""}
          {formatCurrency(Math.abs(annual))}
        </span>
        <span className="text-xs text-[var(--text-tertiary)] font-[family-name:var(--font-raleway)] ml-0.5">
          /yr
        </span>
      </div>
    </div>
  );
}

export default function OwnerEconomics({
  annual,
  managementFeePercent,
  cleaningFeePerTurnover,
  avgStayNights,
  occupancyRate,
}: OwnerEconomicsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const avgMonthlyRental = Math.round(annual.totalRentalRevenue / 12);
  const avgMonthlyCleaning = Math.round(annual.totalCleaningRevenue / 12);
  const avgMonthlyGross = Math.round(annual.totalGross / 12);
  const avgMonthlyFee = Math.round(annual.totalManagementFee / 12);
  const avgMonthlyCleaningCost = Math.round(annual.totalCleaningCost / 12);

  return (
    <section className="py-12 px-[var(--section-pad-x)]">
      <div className="max-w-[var(--max-width-narrow)] mx-auto">
        <AnimatedSection direction="up">
          {/* Section heading */}
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
              Your Projected Income
            </span>
          </div>
          <h2 className="font-[family-name:var(--font-poppins)] text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-8">
            What you take home
          </h2>
        </AnimatedSection>

        {/* Flow card */}
        <div
          ref={ref}
          className="rounded-[var(--radius-xl)] bg-[var(--surface)] border border-[var(--border)] overflow-hidden"
          style={{ boxShadow: "var(--shadow-lg)" }}
        >
          {/* Column headers */}
          <div className="flex items-center justify-between px-5 md:px-7 py-3 bg-[var(--bg)] border-b border-[var(--border)]">
            <span className="flex-1 text-xs font-medium font-[family-name:var(--font-raleway)] text-[var(--text-tertiary)] uppercase tracking-wider">
              Revenue & Costs
            </span>
            <span className="text-right w-28 md:w-36 text-xs font-medium font-[family-name:var(--font-raleway)] text-[var(--text-tertiary)] uppercase tracking-wider">
              Monthly
            </span>
            <span className="text-right w-28 md:w-40 hidden sm:block text-xs font-medium font-[family-name:var(--font-raleway)] text-[var(--text-tertiary)] uppercase tracking-wider">
              Annual
            </span>
          </div>

          {/* Rows */}
          <div className="py-2">
            <FlowRow
              label="Rental Revenue"
              monthly={avgMonthlyRental}
              annual={annual.totalRentalRevenue}
              type="revenue"
              delay={0}
              visible={inView}
              note="Nightly rates"
            />
            <FlowRow
              label="Cleaning Fees"
              monthly={avgMonthlyCleaning}
              annual={annual.totalCleaningRevenue}
              type="add"
              delay={100}
              visible={inView}
              note="Guest-paid"
            />

            {/* Arrow divider */}
            <div className="flex justify-center py-2">
              <ArrowDown
                size={18}
                weight="bold"
                className="text-[var(--text-tertiary)]"
                style={{
                  opacity: inView ? 1 : 0,
                  transition: "opacity 0.4s ease-out 0.2s",
                }}
              />
            </div>

            <FlowRow
              label="Total Gross Revenue"
              monthly={avgMonthlyGross}
              annual={annual.totalGross}
              type="subtotal"
              delay={250}
              visible={inView}
            />
            <FlowRow
              label={`Management Fee (${Math.round(managementFeePercent * 100)}%)`}
              monthly={avgMonthlyFee}
              annual={annual.totalManagementFee}
              type="deduction"
              delay={350}
              visible={inView}
              note="Of gross revenue"
            />
            <FlowRow
              label="Cleaning Costs"
              monthly={avgMonthlyCleaningCost}
              annual={annual.totalCleaningCost}
              type="deduction"
              delay={450}
              visible={inView}
              note="Paid to cleaner"
            />

            {/* Arrow divider */}
            <div className="flex justify-center py-2">
              <ArrowDown
                size={18}
                weight="bold"
                className="text-[var(--accent-warm)]"
                style={{
                  opacity: inView ? 1 : 0,
                  transition: "opacity 0.4s ease-out 0.5s",
                }}
              />
            </div>

            <div className="px-3 pb-3">
              <FlowRow
                label="Net Owner Income"
                monthly={annual.avgMonthlyNet}
                annual={annual.totalNetOwnerIncome}
                type="net"
                delay={600}
                visible={inView}
              />
            </div>
          </div>
        </div>

        {/* Footnote */}
        <p className="mt-4 text-xs font-[family-name:var(--font-raleway)] text-[var(--text-tertiary)] leading-relaxed">
          Based on {Math.round(occupancyRate * 100)}% occupancy, ~{avgStayNights}-night
          average stay (~{annual.totalTurnovers} turnovers/year), and{" "}
          {formatCurrency(cleaningFeePerTurnover)}/turnover cleaning fee.
          Management fee applies to nightly rental revenue only. Cleaning fees
          are collected from guests and paid to the cleaning service.
        </p>
      </div>
    </section>
  );
}
