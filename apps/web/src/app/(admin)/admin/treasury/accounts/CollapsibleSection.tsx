"use client";

import { useState } from "react";
import { CaretRight } from "@phosphor-icons/react";

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(n));
}

export default function CollapsibleSection({
  label,
  total,
  isLiability,
  changeAmt,
  changePct,
  periodLabel = "1 month change",
  children,
  defaultOpen = false,
}: {
  label: string;
  total: string;
  isLiability: boolean;
  changeAmt?: number;
  changePct?: number;
  periodLabel?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const hasChange = changeAmt !== undefined && changeAmt !== 0;
  const isUp = (changeAmt ?? 0) >= 0;
  const changeColor = isUp ? "#16a34a" : "#dc2626";

  return (
    <section>
      {/* Category header */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          background: "none",
          border: "1px solid var(--color-warm-gray-200)",
          borderRadius: open ? "8px 8px 0 0" : "8px",
          cursor: "pointer",
          width: "100%",
          backgroundColor: "var(--color-white)",
          transition: "border-radius 0.15s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          <CaretRight
            size={11}
            weight="bold"
            color="var(--color-text-tertiary)"
            style={{
              transform: open ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.15s ease",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            {label}
          </span>

          {/* Trend info */}
          {hasChange && (
            <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
              <svg width="8" height="8" viewBox="0 0 8 8" style={{ transform: isUp ? "none" : "rotate(180deg)" }}>
                <path d="M4 1L7 5H1L4 1Z" fill={changeColor} />
              </svg>
              <span style={{ fontSize: "12px", fontWeight: 600, color: changeColor }}>
                {formatCurrency(changeAmt!)}
                {changePct !== undefined && (
                  <> ({Math.abs(changePct).toFixed(1)}%)</>
                )}
              </span>
              <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginLeft: "2px" }}>
                {periodLabel}
              </span>
            </div>
          )}
        </div>

        <span
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: isLiability ? "#dc2626" : "var(--color-text-primary)",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.01em",
            flexShrink: 0,
          }}
        >
          {isLiability ? "-" : ""}{total}
        </span>
      </button>

      {/* Collapsible content */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows 0.2s ease",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          {children}
        </div>
      </div>
    </section>
  );
}
