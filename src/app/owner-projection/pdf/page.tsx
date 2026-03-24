import type { Metadata } from "next";
import { spokane8thAve } from "@/content/projections/spokane-8th-ave";
import {
  calculateAllMonths,
  calculateAnnualSummary,
  formatCurrency,
} from "@/lib/projection-calc";

export const metadata: Metadata = {
  title: "Revenue Projection — The Parcel Company",
  robots: "noindex, nofollow",
};

/* ─────────────────────────────────────────────
   Inline tokens (no CSS vars for PDF reliability)
   ───────────────────────────────────────────── */
const C = {
  brandBright: "#02AAEB",
  brandDeep: "#1B77BE",
  accentWarm: "#C4956A",
  accentWarmLight: "#E8D5C0",
  bg: "#FAF8F5",
  surface: "#FFFFFF",
  textPrimary: "#1A1A1A",
  textSecondary: "#6B6B6B",
  textTertiary: "#9A9A9A",
  border: "#EBEBEB",
  borderSubtle: "#F2F0ED",
  emerald: "#059669",
  rose: "#F43F5E",
};

const FONT = {
  heading: "'Poppins', system-ui, sans-serif",
  body: "'Raleway', system-ui, sans-serif",
  accent: "'Nexa Bold', 'Poppins', system-ui, sans-serif",
};

export default function PdfPage() {
  const data = spokane8thAve;
  const months = calculateAllMonths(data.monthlyData, data.economics);
  const annual = calculateAnnualSummary(months);

  const date = new Date(data.generatedDate);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const feeLabel = `${Math.round(data.economics.managementFeePercent * 100)}%`;

  /* Chart dimensions (compact) */
  const chartW = 680;
  const chartH = 155;
  const chartPadL = 56;
  const chartPadR = 16;
  const chartPadT = 20;
  const chartPadB = 32;
  const plotW = chartW - chartPadL - chartPadR;
  const plotH = chartH - chartPadT - chartPadB;

  const maxRevenue = Math.max(...data.monthlyData.map((m) => m.rangeHigh));
  const yMax = Math.ceil(maxRevenue / 500) * 500;
  const barGroupWidth = plotW / 12;
  const barWidth = barGroupWidth * 0.52;
  const rangeWidth = barGroupWidth * 0.32;
  const avgMonthly = Math.round(annual.totalRentalRevenue / 12);

  /* Hide site Header/Footer: uses only hardcoded color constants, no user input */
  const hideChrome = `
    header, footer, nav { display: none !important; }
    body { background: ${C.bg} !important; margin: 0 !important; padding: 0 !important; }
    @page { size: letter; margin: 0; }
    @media print {
      header, footer, nav { display: none !important; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: hideChrome }} />

      <div
        style={{
          width: "8.5in",
          margin: "0 auto",
          background: C.bg,
          color: C.textPrimary,
          fontFamily: FONT.body,
          fontSize: "13px",
          lineHeight: 1.5,
          WebkitPrintColorAdjust: "exact",
        }}
      >
        {/* ═══════════════════════════════════════════
            PAGE 1: Property Summary + Owner Economics
            ═══════════════════════════════════════════ */}
        <div
          style={{
            height: "11in",
            padding: "0.5in 0.75in",
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
          }}
        >
          {/* Header row: eyebrow left + per-unit badge right */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            {/* Eyebrow */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span
                style={{
                  display: "block",
                  height: "2px",
                  width: "32px",
                  background: `linear-gradient(90deg, ${C.brandBright}, ${C.brandDeep})`,
                  borderRadius: "1px",
                }}
              />
              <span
                style={{
                  fontFamily: FONT.accent,
                  fontSize: "10px",
                  letterSpacing: "0.25em",
                  color: C.brandBright,
                  textTransform: "uppercase" as const,
                }}
              >
                Revenue Projection
              </span>
            </div>

            {/* Per-unit badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "6px 16px",
                borderRadius: "20px",
                border: `2px solid ${C.accentWarm}`,
                background: "rgba(196, 149, 106, 0.06)",
              }}
            >
              <span
                style={{
                  fontFamily: FONT.accent,
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  color: C.accentWarm,
                  textTransform: "uppercase" as const,
                }}
              >
                Per Unit Projection
              </span>
            </div>
          </div>

          {/* Property Address */}
          <h1
            style={{
              fontFamily: FONT.heading,
              fontSize: "32px",
              fontWeight: 700,
              color: C.textPrimary,
              lineHeight: 1.15,
              margin: "0 0 12px 0",
            }}
          >
            {data.property.address}
          </h1>

          {/* Meta pills */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap" as const,
              marginBottom: "10px",
            }}
          >
            {[
              `${data.property.city}, ${data.property.state} ${data.property.zip}`,
              `${data.property.bedrooms} Bedroom`,
              formattedDate,
            ].map((text) => (
              <span
                key={text}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "5px 12px",
                  borderRadius: "20px",
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  fontSize: "11px",
                  fontFamily: FONT.body,
                  color: C.textSecondary,
                }}
              >
                {text}
              </span>
            ))}
          </div>

          {/* Comp set line */}
          <p
            style={{
              fontSize: "11px",
              color: C.textTertiary,
              fontFamily: FONT.body,
              margin: "0 0 20px 0",
            }}
          >
            Based on {data.compSet.matchedListings} of{" "}
            {data.compSet.totalListings} {data.compSet.platform} listings in{" "}
            {data.compSet.market}
          </p>

          {/* ── Single Summary Card ── */}
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: "14px",
              padding: "16px 20px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                fontFamily: FONT.accent,
                fontSize: "28px",
                fontWeight: 700,
                color: C.accentWarm,
                lineHeight: 1.1,
                marginBottom: "4px",
              }}
            >
              ${data.summary[0].value.toLocaleString()}/yr
            </div>
            <div
              style={{
                fontFamily: FONT.body,
                fontSize: "12px",
                fontWeight: 600,
                color: C.textPrimary,
                marginBottom: "2px",
              }}
            >
              {data.summary[0].label}
            </div>
            {data.summary[0].sublabel && (
              <div
                style={{
                  fontSize: "10px",
                  color: C.textTertiary,
                  fontFamily: FONT.body,
                }}
              >
                {data.summary[0].sublabel} · Projected with professional management
              </div>
            )}
          </div>

          {/* ── Owner Economics Waterfall ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "6px",
            }}
          >
            <span
              style={{
                display: "block",
                height: "2px",
                width: "32px",
                background: `linear-gradient(90deg, ${C.brandBright}, ${C.brandDeep})`,
                borderRadius: "1px",
              }}
            />
            <span
              style={{
                fontFamily: FONT.accent,
                fontSize: "10px",
                letterSpacing: "0.25em",
                color: C.brandBright,
                textTransform: "uppercase" as const,
              }}
            >
              Your Projected Income
            </span>
          </div>
          <h2
            style={{
              fontFamily: FONT.heading,
              fontSize: "22px",
              fontWeight: 700,
              color: C.textPrimary,
              margin: "0 0 10px 0",
            }}
          >
            What You Take Home
          </h2>

          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: "16px",
            }}
          >
            {/* Column headers */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "7px 16px",
                background: C.bg,
                borderBottom: `1px solid ${C.border}`,
                borderRadius: "16px 16px 0 0",
              }}
            >
              <span style={{ flex: 1, fontSize: "9px", fontWeight: 600, letterSpacing: "0.15em", color: C.textTertiary, textTransform: "uppercase" as const, fontFamily: FONT.body }}>
                Revenue &amp; Costs
              </span>
              <span style={{ width: "110px", textAlign: "right" as const, fontSize: "9px", fontWeight: 600, letterSpacing: "0.15em", color: C.textTertiary, textTransform: "uppercase" as const, fontFamily: FONT.body }}>
                Monthly
              </span>
              <span style={{ width: "110px", textAlign: "right" as const, fontSize: "9px", fontWeight: 600, letterSpacing: "0.15em", color: C.textTertiary, textTransform: "uppercase" as const, fontFamily: FONT.body }}>
                Annual
              </span>
            </div>

            {/* Flow rows */}
            <div style={{ padding: "2px 0" }}>
              <WaterfallRow
                label="Gross Revenue"
                note="Rental + cleaning fees"
                monthly={Math.round(annual.totalGross / 12)}
                yearly={annual.totalGross}
                type="revenue"
              />
              <WaterfallRow
                label="Cleaning Costs"
                note="Paid to cleaner by guest"
                monthly={Math.round(annual.totalCleaningCost / 12)}
                yearly={annual.totalCleaningCost}
                type="deduction"
              />
              <WaterfallRow
                label={`Management Fee (${feeLabel})`}
                note="Of gross revenue"
                monthly={Math.round(annual.totalManagementFee / 12)}
                yearly={annual.totalManagementFee}
                type="deduction"
              />

              <div style={{ textAlign: "center" as const, padding: "2px 0", color: C.accentWarm, fontSize: "11px" }}>
                ↓
              </div>

              <div style={{ padding: "0 10px 4px" }}>
                <WaterfallRow
                  label="Net Owner Income"
                  monthly={annual.avgMonthlyNet}
                  yearly={annual.totalNetOwnerIncome}
                  type="net"
                />
              </div>
            </div>
          </div>

          {/* Footnote */}
          <p
            style={{
              marginTop: "6px",
              fontSize: "9px",
              color: C.textTertiary,
              fontFamily: FONT.body,
              lineHeight: 1.5,
            }}
          >
            Based on {Math.round(data.economics.occupancyRate * 100)}% occupancy,
            ~{data.economics.avgStayNights}-night average stay (~
            {annual.totalTurnovers} turnovers/year), and{" "}
            {formatCurrency(data.economics.cleaningFeePerTurnover)}/turnover
            cleaning fee. Management fee ({feeLabel}) applies to
            total gross revenue.
          </p>

          {/* Cleaning economics explainer */}
          <div
            style={{
              marginTop: "8px",
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: "14px",
              padding: "10px 20px",
            }}
          >
            <div
              style={{
                fontFamily: FONT.heading,
                fontSize: "13px",
                fontWeight: 600,
                color: C.textPrimary,
                marginBottom: "6px",
              }}
            >
              Cleaning Fee Breakdown
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "16px",
              }}
            >
              <div style={{ textAlign: "center" as const }}>
                <div style={{ fontSize: "10px", color: C.textTertiary, fontFamily: FONT.body, marginBottom: "3px" }}>
                  Guest pays per stay
                </div>
                <div style={{ fontFamily: FONT.accent, fontSize: "18px", fontWeight: 700, color: C.emerald }}>
                  +{formatCurrency(data.economics.cleaningFeePerTurnover)}
                </div>
              </div>
              <div style={{ textAlign: "center" as const }}>
                <div style={{ fontSize: "10px", color: C.textTertiary, fontFamily: FONT.body, marginBottom: "3px" }}>
                  Cleaner receives
                </div>
                <div style={{ fontFamily: FONT.accent, fontSize: "18px", fontWeight: 700, color: C.rose }}>
                  −{formatCurrency(data.economics.cleaningCostPerTurnover)}
                </div>
              </div>
              <div style={{ textAlign: "center" as const }}>
                <div style={{ fontSize: "10px", color: C.textTertiary, fontFamily: FONT.body, marginBottom: "3px" }}>
                  Owner income per stay
                </div>
                <div style={{ fontFamily: FONT.accent, fontSize: "18px", fontWeight: 700, color: C.accentWarm }}>
                  +{formatCurrency(data.economics.cleaningFeePerTurnover - data.economics.cleaningCostPerTurnover)}
                </div>
                <div style={{ fontSize: "9px", color: C.accentWarm, fontFamily: FONT.accent, fontWeight: 600, marginTop: "2px" }}>
                  {formatCurrency((data.economics.cleaningFeePerTurnover - data.economics.cleaningCostPerTurnover) * annual.totalTurnovers)}/yr
                </div>
              </div>
            </div>
            <p style={{ fontSize: "10px", color: C.textTertiary, fontFamily: FONT.body, marginTop: "6px", lineHeight: 1.4, marginBottom: 0 }}>
              Each guest is charged {formatCurrency(data.economics.cleaningFeePerTurnover)} for cleaning. Approximately{" "}
              {formatCurrency(data.economics.cleaningCostPerTurnover)} goes to the cleaning service on average. The remaining{" "}
              {formatCurrency(data.economics.cleaningFeePerTurnover - data.economics.cleaningCostPerTurnover)} per
              stay ({formatCurrency((data.economics.cleaningFeePerTurnover - data.economics.cleaningCostPerTurnover) * annual.totalTurnovers)}/yr)
              is additional owner income, available for maintenance, upkeep, or as direct earnings.
            </p>
          </div>

          {/* ── Scenario Tiers ── */}
          <div
            style={{
              marginTop: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "6px",
              }}
            >
              <span
                style={{
                  display: "block",
                  height: "2px",
                  width: "32px",
                  background: `linear-gradient(90deg, ${C.brandBright}, ${C.brandDeep})`,
                  borderRadius: "1px",
                }}
              />
              <span
                style={{
                  fontFamily: FONT.accent,
                  fontSize: "10px",
                  letterSpacing: "0.25em",
                  color: C.brandBright,
                  textTransform: "uppercase" as const,
                }}
              >
                Earning Potential
              </span>
            </div>
            <h2
              style={{
                fontFamily: FONT.heading,
                fontSize: "16px",
                fontWeight: 700,
                color: C.textPrimary,
                margin: "0 0 8px 0",
              }}
            >
              Projected Scenarios
            </h2>

            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: "14px",
                padding: "10px 20px 10px",
              }}
            >
              {/* Three scenario rows */}
              {([
                {
                  name: "Top Performer",
                  desc: "Optimized · 70% occ",
                  net: 32280,
                  barColor: C.accentWarm,
                  barWidth: "82%",
                  barHeight: 8,
                  emphasized: false,
                },
                {
                  name: "Moderate",
                  desc: "Established · 60% occ",
                  net: 29480,
                  barColor: `linear-gradient(90deg, ${C.brandBright}, ${C.brandDeep})`,
                  barWidth: "70%",
                  barHeight: 8,
                  emphasized: false,
                },
                {
                  name: "Conservative",
                  desc: "Year 1 · 50% occ",
                  net: 24260,
                  barColor: C.textTertiary,
                  barWidth: "53%",
                  barHeight: 8,
                  emphasized: false,
                },
              ] as const).map((scenario, idx) => (
                <div key={scenario.name}>
                  {/* Label row: name + desc + badge + value */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      padding: `${idx === 0 ? 0 : 6}px 0 3px`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                      <span
                        style={{
                          fontFamily: FONT.accent,
                          fontSize: "10px",
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          color: scenario.emphasized ? C.brandDeep : C.textSecondary,
                          textTransform: "uppercase" as const,
                        }}
                      >
                        {scenario.name}
                      </span>
                      <span
                        style={{
                          fontSize: "9px",
                          color: C.textTertiary,
                          fontFamily: FONT.body,
                        }}
                      >
                        {scenario.desc}
                      </span>
                    </div>
                    <div>
                      <span
                        style={{
                          fontFamily: FONT.accent,
                          fontSize: scenario.emphasized ? "14px" : "12px",
                          fontWeight: 700,
                          color: scenario.emphasized ? C.brandDeep : C.textSecondary,
                        }}
                      >
                        {formatCurrency(scenario.net)}
                      </span>
                      <span style={{ fontSize: "8px", color: C.textTertiary, marginLeft: "2px" }}>/yr</span>
                    </div>
                  </div>
                  {/* Bar */}
                  <div
                    style={{
                      width: scenario.barWidth,
                      height: `${scenario.barHeight}px`,
                      borderRadius: "4px",
                      background: scenario.barColor,
                      marginBottom: idx < 2 ? "0" : "0",
                      ...(scenario.emphasized
                        ? { boxShadow: "0 1px 4px rgba(2, 170, 235, 0.25)" }
                        : {}),
                    }}
                  />
                  {idx < 2 && (
                    <div style={{ borderBottom: `1px solid ${C.borderSubtle}`, marginTop: "5px" }} />
                  )}
                </div>
              ))}

              {/* Combined range + footnote */}
              <div
                style={{
                  marginTop: "8px",
                  paddingTop: "8px",
                  borderTop: `1px solid ${C.borderSubtle}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    color: C.textTertiary,
                    fontFamily: FONT.body,
                  }}
                >
                  Combined (both units): <strong style={{ color: C.textSecondary }}>{formatCurrency(48520)} – {formatCurrency(64560)}/yr</strong>
                </span>
                <span
                  style={{
                    fontSize: "9px",
                    color: C.textTertiary,
                    fontFamily: FONT.body,
                  }}
                >
                  Occupancy is the key swing factor. ADR ($145) is constant across all scenarios.
                </span>
              </div>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* Page footer */}
          <div
            style={{
              borderTop: `1px solid ${C.borderSubtle}`,
              paddingTop: "10px",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "10px",
              color: C.textTertiary,
              fontFamily: FONT.body,
            }}
          >
            <span>The Parcel Company · Revenue Projection</span>
            <span>Page 1 of 2</span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            PAGE 2: Chart + Monthly Table + Unit Totals
            ═══════════════════════════════════════════ */}
        <div
          style={{
            height: "11in",
            padding: "0.45in 0.75in",
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
            breakBefore: "page" as const,
          }}
        >
          {/* ── Compact Revenue Chart ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "6px",
            }}
          >
            <span
              style={{
                display: "block",
                height: "2px",
                width: "32px",
                background: `linear-gradient(90deg, ${C.brandBright}, ${C.brandDeep})`,
                borderRadius: "1px",
              }}
            />
            <span
              style={{
                fontFamily: FONT.accent,
                fontSize: "10px",
                letterSpacing: "0.25em",
                color: C.brandBright,
                textTransform: "uppercase" as const,
              }}
            >
              Monthly Trends
            </span>
          </div>
          <h2
            style={{
              fontFamily: FONT.heading,
              fontSize: "20px",
              fontWeight: 700,
              color: C.textPrimary,
              margin: "0 0 8px 0",
            }}
          >
            Revenue by Month
          </h2>

          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: "14px",
              padding: "12px 18px",
              marginBottom: "10px",
            }}
          >
            {/* Legend */}
            <div
              style={{
                display: "flex",
                gap: "18px",
                marginBottom: "10px",
                fontSize: "9px",
                fontFamily: FONT.body,
                color: C.textSecondary,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ width: "12px", height: "8px", borderRadius: "2px", background: `linear-gradient(180deg, ${C.brandBright}, ${C.brandDeep})` }} />
                Projected Revenue
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ width: "12px", height: "8px", borderRadius: "2px", background: C.accentWarmLight }} />
                25th–75th Range
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ width: "12px", height: "2px", borderTop: `2px dashed ${C.accentWarm}` }} />
                Avg ({formatCurrency(avgMonthly)}/mo)
              </span>
            </div>

            {/* Static SVG chart */}
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              width="100%"
              style={{ display: "block" }}
            >
              <defs>
                <linearGradient id="pdfBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.brandBright} />
                  <stop offset="100%" stopColor={C.brandDeep} />
                </linearGradient>
              </defs>

              {/* Y-axis grid lines and labels */}
              {[0, 1000, 2000, 3000, 4000].filter(v => v <= yMax).map((v) => {
                const y = chartPadT + plotH - (v / yMax) * plotH;
                return (
                  <g key={v}>
                    <line
                      x1={chartPadL}
                      y1={y}
                      x2={chartW - chartPadR}
                      y2={y}
                      stroke={C.borderSubtle}
                      strokeWidth={1}
                    />
                    <text
                      x={chartPadL - 8}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="9"
                      fill={C.textTertiary}
                      fontFamily={FONT.body}
                    >
                      ${(v / 1000).toFixed(0)}k
                    </text>
                  </g>
                );
              })}

              {/* Average dashed line */}
              <line
                x1={chartPadL}
                y1={chartPadT + plotH - (avgMonthly / yMax) * plotH}
                x2={chartW - chartPadR}
                y2={chartPadT + plotH - (avgMonthly / yMax) * plotH}
                stroke={C.accentWarm}
                strokeWidth={1.5}
                strokeDasharray="6 4"
              />

              {/* Bars */}
              {data.monthlyData.map((m, i) => {
                const gx = chartPadL + i * barGroupWidth;
                const barCenter = gx + barGroupWidth / 2;

                const barH = (m.revenue / yMax) * plotH;
                const barY = chartPadT + plotH - barH;

                const rangeTop = chartPadT + plotH - (m.rangeHigh / yMax) * plotH;
                const rangeBot = chartPadT + plotH - (m.rangeLow / yMax) * plotH;
                const rangeH = rangeBot - rangeTop;

                return (
                  <g key={m.month}>
                    <rect
                      x={barCenter - rangeWidth / 2}
                      y={rangeTop}
                      width={rangeWidth}
                      height={rangeH}
                      rx={3}
                      fill={C.accentWarmLight}
                      opacity={0.5}
                    />
                    <rect
                      x={barCenter - barWidth / 2}
                      y={barY}
                      width={barWidth}
                      height={barH}
                      rx={4}
                      fill="url(#pdfBarGrad)"
                    />
                    <text
                      x={barCenter}
                      y={barY - 4}
                      textAnchor="middle"
                      fontSize="8"
                      fontWeight="700"
                      fill={C.textSecondary}
                      fontFamily={FONT.accent}
                    >
                      ${(m.revenue / 1000).toFixed(1)}k
                    </text>
                    <text
                      x={barCenter}
                      y={chartH - 6}
                      textAnchor="middle"
                      fontSize="9"
                      fill={C.textSecondary}
                      fontFamily={FONT.body}
                      fontWeight="600"
                    >
                      {m.month}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* ── Monthly Breakdown Table ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "6px",
            }}
          >
            <span
              style={{
                display: "block",
                height: "2px",
                width: "32px",
                background: `linear-gradient(90deg, ${C.brandBright}, ${C.brandDeep})`,
                borderRadius: "1px",
              }}
            />
            <span
              style={{
                fontFamily: FONT.accent,
                fontSize: "10px",
                letterSpacing: "0.25em",
                color: C.brandBright,
                textTransform: "uppercase" as const,
              }}
            >
              Detailed Breakdown
            </span>
          </div>
          <h2
            style={{
              fontFamily: FONT.heading,
              fontSize: "20px",
              fontWeight: 700,
              color: C.textPrimary,
              margin: "0 0 6px 0",
            }}
          >
            Month by Month
          </h2>

          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: "14px",
              overflow: "hidden",
              marginBottom: "10px",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontFamily: FONT.body,
                fontSize: "10px",
              }}
            >
              <thead>
                <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ textAlign: "left" as const, padding: "6px 12px", fontSize: "8px", fontWeight: 600, letterSpacing: "0.15em", color: C.textTertiary, textTransform: "uppercase" as const }}>
                    Month
                  </th>
                  <th style={{ textAlign: "right" as const, padding: "6px 10px", fontSize: "8px", fontWeight: 700, letterSpacing: "0.1em", color: C.emerald, textTransform: "uppercase" as const }}>
                    Gross Revenue
                  </th>
                  <th style={{ textAlign: "right" as const, padding: "6px 10px", fontSize: "8px", fontWeight: 600, letterSpacing: "0.1em", color: C.rose, textTransform: "uppercase" as const }}>
                    Cleaning Costs
                  </th>
                  <th style={{ textAlign: "right" as const, padding: "6px 10px", fontSize: "8px", fontWeight: 600, letterSpacing: "0.1em", color: C.rose, textTransform: "uppercase" as const }}>
                    Mgmt Fee ({feeLabel})
                  </th>
                  <th style={{ textAlign: "right" as const, padding: "6px 12px", fontSize: "8px", fontWeight: 700, letterSpacing: "0.1em", color: C.accentWarm, textTransform: "uppercase" as const }}>
                    Net to Owner
                  </th>
                </tr>
              </thead>
              <tbody>
                {months.map((m, i) => (
                  <tr
                    key={m.month}
                    style={{
                      borderBottom: `1px solid ${C.borderSubtle}`,
                      background: i % 2 === 1 ? `${C.bg}80` : "transparent",
                    }}
                  >
                    <td style={{ padding: "5px 12px", fontFamily: FONT.heading, fontWeight: 600, fontSize: "10px", color: C.textPrimary }}>
                      {m.month}
                    </td>
                    <td style={{ textAlign: "right" as const, padding: "5px 10px", fontWeight: 700, color: C.emerald, fontSize: "11px" }}>
                      {formatCurrency(m.totalGross)}
                    </td>
                    <td style={{ textAlign: "right" as const, padding: "5px 10px", color: C.rose }}>
                      −{formatCurrency(m.cleaningCost)}
                    </td>
                    <td style={{ textAlign: "right" as const, padding: "5px 10px", color: C.rose }}>
                      −{formatCurrency(m.managementFee)}
                    </td>
                    <td style={{ textAlign: "right" as const, padding: "5px 12px", fontFamily: FONT.accent, fontWeight: 700, color: C.accentWarm, fontSize: "11px" }}>
                      {formatCurrency(m.netOwnerIncome)}
                    </td>
                  </tr>
                ))}

                {/* Annual totals */}
                <tr style={{ background: C.bg, borderTop: `2px solid ${C.border}` }}>
                  <td style={{ padding: "7px 12px", fontFamily: FONT.heading, fontWeight: 700, fontSize: "10px", color: C.textPrimary, textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>
                    Annual
                  </td>
                  <td style={{ textAlign: "right" as const, padding: "7px 10px", fontFamily: FONT.accent, fontWeight: 700, fontSize: "12px", color: C.emerald }}>
                    {formatCurrency(annual.totalGross)}
                  </td>
                  <td style={{ textAlign: "right" as const, padding: "7px 10px", fontFamily: FONT.accent, fontWeight: 700, color: C.rose }}>
                    −{formatCurrency(annual.totalCleaningCost)}
                  </td>
                  <td style={{ textAlign: "right" as const, padding: "7px 10px", fontFamily: FONT.accent, fontWeight: 700, color: C.rose }}>
                    −{formatCurrency(annual.totalManagementFee)}
                  </td>
                  <td style={{ textAlign: "right" as const, padding: "7px 12px", fontFamily: FONT.accent, fontWeight: 700, fontSize: "12px", color: C.accentWarm }}>
                    {formatCurrency(annual.totalNetOwnerIncome)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── Unit Summary Section ── */}
          <div
            style={{
              background: C.surface,
              border: `2px solid ${C.accentWarmLight}`,
              borderRadius: "14px",
              padding: "14px 20px 10px",
            }}
          >
            <div
              style={{
                fontFamily: FONT.heading,
                fontSize: "13px",
                fontWeight: 600,
                color: C.textPrimary,
                marginBottom: "12px",
              }}
            >
              Projected Annual Income
            </div>

            {/* Summary table: 4 columns (label, Unit A, Unit B, Combined) × 3 rows */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontFamily: FONT.body,
                fontSize: "11px",
              }}
            >
              {/* Column headers */}
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "0 0 8px", fontFamily: FONT.accent, fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase" as const, color: C.textTertiary, fontWeight: 600, width: "34%" }}> </th>
                  <th style={{ textAlign: "right", padding: "0 12px 8px", fontFamily: FONT.accent, fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase" as const, color: C.textTertiary, fontWeight: 600, width: "22%" }}>Unit A</th>
                  <th style={{ textAlign: "right", padding: "0 12px 8px", fontFamily: FONT.accent, fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase" as const, color: C.textTertiary, fontWeight: 600, width: "22%" }}>Unit B</th>
                  <th style={{ textAlign: "right", padding: "0 0 8px", fontFamily: FONT.accent, fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase" as const, color: C.brandDeep, fontWeight: 700, width: "22%" }}>Combined</th>
                </tr>
              </thead>
              <tbody>
                {/* Gross Revenue row */}
                <tr>
                  <td style={{ padding: "7px 0", fontSize: "11px", color: C.textSecondary, borderTop: `1px solid ${C.borderSubtle}` }}>Gross Revenue</td>
                  <td style={{ padding: "7px 12px", textAlign: "right", fontFamily: FONT.accent, fontSize: "12px", fontWeight: 700, color: C.emerald, borderTop: `1px solid ${C.borderSubtle}` }}>{formatCurrency(annual.totalGross)}</td>
                  <td style={{ padding: "7px 12px", textAlign: "right", fontFamily: FONT.accent, fontSize: "12px", fontWeight: 700, color: C.emerald, borderTop: `1px solid ${C.borderSubtle}` }}>{formatCurrency(annual.totalGross)}</td>
                  <td style={{ padding: "7px 0", textAlign: "right", fontFamily: FONT.accent, fontSize: "13px", fontWeight: 700, color: C.emerald, borderTop: `1px solid ${C.borderSubtle}` }}>{formatCurrency(annual.totalGross * 2)}</td>
                </tr>
                {/* Expenses row */}
                <tr>
                  <td style={{ padding: "7px 0", fontSize: "11px", color: C.textSecondary, borderTop: `1px solid ${C.borderSubtle}` }}>Mgmt Fee + Cleaning</td>
                  <td style={{ padding: "7px 12px", textAlign: "right", fontFamily: FONT.accent, fontSize: "12px", fontWeight: 600, color: C.rose, borderTop: `1px solid ${C.borderSubtle}` }}>({formatCurrency(annual.totalManagementFee + annual.totalCleaningCost)})</td>
                  <td style={{ padding: "7px 12px", textAlign: "right", fontFamily: FONT.accent, fontSize: "12px", fontWeight: 600, color: C.rose, borderTop: `1px solid ${C.borderSubtle}` }}>({formatCurrency(annual.totalManagementFee + annual.totalCleaningCost)})</td>
                  <td style={{ padding: "7px 0", textAlign: "right", fontFamily: FONT.accent, fontSize: "13px", fontWeight: 600, color: C.rose, borderTop: `1px solid ${C.borderSubtle}` }}>({formatCurrency((annual.totalManagementFee + annual.totalCleaningCost) * 2)})</td>
                </tr>
                {/* Net to Owner row */}
                <tr>
                  <td style={{ padding: "9px 0 0", fontSize: "12px", fontFamily: FONT.heading, fontWeight: 700, color: C.textPrimary, borderTop: `2px solid ${C.accentWarm}` }}>Net to Owner</td>
                  <td style={{ padding: "9px 12px 0", textAlign: "right", fontFamily: FONT.accent, fontSize: "13px", fontWeight: 700, color: C.accentWarm, borderTop: `2px solid ${C.accentWarm}` }}>{formatCurrency(annual.totalNetOwnerIncome)}<span style={{ fontSize: "9px", fontWeight: 400, color: C.textTertiary }}>/yr</span></td>
                  <td style={{ padding: "9px 12px 0", textAlign: "right", fontFamily: FONT.accent, fontSize: "13px", fontWeight: 700, color: C.accentWarm, borderTop: `2px solid ${C.accentWarm}` }}>{formatCurrency(annual.totalNetOwnerIncome)}<span style={{ fontSize: "9px", fontWeight: 400, color: C.textTertiary }}>/yr</span></td>
                  <td style={{ padding: "9px 0 0", textAlign: "right", fontFamily: FONT.accent, fontSize: "18px", fontWeight: 700, color: C.accentWarm, borderTop: `2px solid ${C.accentWarm}` }}>{formatCurrency(annual.totalNetOwnerIncome * 2)}<span style={{ fontSize: "10px", fontWeight: 400, color: C.textTertiary }}>/yr</span></td>
                </tr>
              </tbody>
            </table>

            <p style={{ fontSize: "9px", color: C.textTertiary, fontFamily: FONT.body, marginTop: "10px", marginBottom: 0, lineHeight: 1.5 }}>
              Both units at 403 E 8th Ave perform identically. Figures above reflect net owner income after {feeLabel} management fee and cleaning costs. This projection does not include owner-borne costs such as utilities, insurance, maintenance, and property taxes.
            </p>
          </div>

          <div style={{ flex: 1 }} />

          {/* Page footer */}
          <div
            style={{
              borderTop: `1px solid ${C.borderSubtle}`,
              paddingTop: "10px",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "10px",
              color: C.textTertiary,
              fontFamily: FONT.body,
            }}
          >
            <span>The Parcel Company · Revenue Projection</span>
            <span>Page 2 of 2</span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   Waterfall Row (server component, no client JS)
   ───────────────────────────────────────────── */
interface WaterfallRowProps {
  label: string;
  monthly: number;
  yearly: number;
  type: "revenue" | "add" | "subtotal" | "deduction" | "net";
  note?: string;
}

function WaterfallRow({ label, monthly, yearly, type, note }: WaterfallRowProps) {
  const isNet = type === "net";
  const isDeduction = type === "deduction";
  const isAdd = type === "add";
  const isSubtotal = type === "subtotal";

  const valueColor = isNet
    ? C.accentWarm
    : isDeduction
      ? C.rose
      : isAdd
        ? C.emerald
        : C.textPrimary;

  const prefix = isDeduction ? "−" : isAdd ? "+" : "";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "7px 16px",
        ...(isNet
          ? {
              background: "rgba(196, 149, 106, 0.08)",
              border: "2px solid rgba(196, 149, 106, 0.3)",
              borderRadius: "10px",
            }
          : isSubtotal
            ? { borderTop: `2px dashed ${C.border}` }
            : { borderBottom: `1px solid ${C.borderSubtle}` }),
      }}
    >
      {/* Label */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
        {(isDeduction || isAdd) && (
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              fontFamily: FONT.accent,
              color: isDeduction ? C.rose : C.emerald,
            }}
          >
            {isDeduction ? "−" : "+"}
          </span>
        )}
        <span
          style={{
            fontFamily: FONT.body,
            fontSize: "12px",
            ...(isNet
              ? { fontWeight: 700, color: C.textPrimary }
              : isSubtotal
                ? { fontWeight: 600, color: C.textPrimary }
                : { color: C.textSecondary }),
          }}
        >
          {label}
        </span>
        {note && (
          <span
            style={{
              fontSize: "9px",
              color: C.textTertiary,
              fontFamily: FONT.body,
            }}
          >
            {note}
          </span>
        )}
      </div>

      {/* Monthly */}
      <div style={{ width: "110px", textAlign: "right" as const }}>
        <span
          style={{
            fontFamily: FONT.accent,
            fontSize: "14px",
            fontWeight: 700,
            color: valueColor,
          }}
        >
          {prefix}
          {formatCurrency(Math.abs(monthly))}
        </span>
        <span style={{ fontSize: "9px", color: C.textTertiary, marginLeft: "2px" }}>
          /mo
        </span>
      </div>

      {/* Annual */}
      <div style={{ width: "110px", textAlign: "right" as const }}>
        <span
          style={{
            fontFamily: FONT.accent,
            fontSize: "14px",
            fontWeight: 700,
            color: valueColor,
          }}
        >
          {prefix}
          {formatCurrency(Math.abs(yearly))}
        </span>
        <span style={{ fontSize: "9px", color: C.textTertiary, marginLeft: "2px" }}>
          /yr
        </span>
      </div>
    </div>
  );
}
