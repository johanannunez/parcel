"use client";

import { useState, useRef } from "react";

type DataPoint = {
  date: string;
  balance: number;
};

type TimeRange = "1m" | "3m" | "6m" | "ytd" | "1y" | "all";

const TIME_RANGE_LABELS: { value: TimeRange; label: string }[] = [
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "ytd", label: "YTD" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "All" },
];

function filterByRange(data: DataPoint[], range: TimeRange): DataPoint[] {
  if (data.length === 0) return data;
  const now = new Date();
  let cutoff: Date;

  switch (range) {
    case "1m":
      cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
    case "3m":
      cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      break;
    case "6m":
      cutoff = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      break;
    case "ytd":
      cutoff = new Date(now.getFullYear(), 0, 1);
      break;
    case "1y":
      cutoff = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    case "all":
    default:
      return data;
  }

  const cutoffStr = cutoff.toISOString().split("T")[0];
  return data.filter((d) => d.date >= cutoffStr);
}

/** Downsample to ~maxPoints using LTTB-like approach (keep first, last, peaks) */
function downsample(data: DataPoint[], maxPoints: number): DataPoint[] {
  if (data.length <= maxPoints) return data;

  const result: DataPoint[] = [data[0]];
  const bucketSize = (data.length - 2) / (maxPoints - 2);

  for (let i = 1; i < maxPoints - 1; i++) {
    const start = Math.floor((i - 1) * bucketSize) + 1;
    const end = Math.min(Math.floor(i * bucketSize) + 1, data.length - 1);

    // Pick the point with the largest deviation from the line between prev selected and next bucket avg
    let bestIdx = start;
    let bestVal = -Infinity;
    for (let j = start; j < end; j++) {
      const deviation = Math.abs(data[j].balance - data[bestIdx].balance);
      if (deviation > bestVal || j === start) {
        bestVal = deviation;
        bestIdx = j;
      }
    }
    result.push(data[bestIdx]);
  }

  result.push(data[data.length - 1]);
  return result;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Compute clean, round Y-axis ticks */
function niceYTicks(min: number, max: number, count: number): number[] {
  const range = max - min || 1;
  const rawStep = range / (count - 1);

  // Round step to a "nice" number
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  let niceStep: number;
  if (residual <= 1.5) niceStep = magnitude;
  else if (residual <= 3) niceStep = 2 * magnitude;
  else if (residual <= 7) niceStep = 5 * magnitude;
  else niceStep = 10 * magnitude;

  const niceMin = Math.floor(min / niceStep) * niceStep;
  const niceMax = Math.ceil(max / niceStep) * niceStep;

  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax; v += niceStep) {
    ticks.push(v);
  }
  return ticks;
}

function formatYLabel(val: number): string {
  if (Math.abs(val) >= 1000) {
    const k = val / 1000;
    return `$${Number.isInteger(k) ? k : k.toFixed(1)}K`;
  }
  return `$${Math.round(val)}`;
}

// Catmull-Rom spline
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  if (points.length === 2) {
    return `M${points[0].x},${points[0].y}L${points[1].x},${points[1].y}`;
  }

  let path = `M${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const tension = 0.25;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    path += `C${cp1x},${cp1y},${cp2x},${cp2y},${p2.x},${p2.y}`;
  }

  return path;
}

export default function BalanceChart({ data }: { data: DataPoint[] }) {
  const [range, setRange] = useState<TimeRange>("all");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const filtered = filterByRange(data, range);
  // Downsample for smoother appearance on long ranges
  const maxPts = range === "1m" ? 60 : range === "3m" ? 50 : 45;
  const chartData = downsample(filtered, maxPts);
  const hasData = chartData.length >= 2;

  // Chart dimensions
  const width = 800;
  const height = 200;
  const padLeft = 52;
  const padRight = 12;
  const padTop = 12;
  const padBottom = 24;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Compute scale with nice ticks
  const balances = chartData.map((d) => d.balance);
  const rawMin = hasData ? Math.min(...balances) : 0;
  const rawMax = hasData ? Math.max(...balances) : 10000;

  const yTicks = hasData ? niceYTicks(rawMin, rawMax, 5) : [];
  const yMin = yTicks.length > 0 ? yTicks[0] : rawMin;
  const yMax = yTicks.length > 0 ? yTicks[yTicks.length - 1] : rawMax;
  const yRange = yMax - yMin || 1;

  const toX = (i: number) => padLeft + (i / Math.max(1, chartData.length - 1)) * chartW;
  const toY = (val: number) => padTop + (1 - (val - yMin) / yRange) * chartH;

  const points = chartData.map((d, i) => ({ x: toX(i), y: toY(d.balance) }));
  const linePath = smoothPath(points);

  // Area path
  const areaPath = hasData
    ? `${linePath}L${points[points.length - 1].x},${padTop + chartH}L${points[0].x},${padTop + chartH}Z`
    : "";

  // X-axis labels
  const xLabels: { x: number; label: string }[] = [];
  if (hasData && chartData.length > 1) {
    const labelCount = Math.min(6, chartData.length);
    for (let i = 0; i < labelCount; i++) {
      const idx = Math.round((i / (labelCount - 1)) * (chartData.length - 1));
      xLabels.push({ x: toX(idx), label: formatDate(chartData[idx].date) });
    }
  }

  // Hover
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!hasData || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const relX = mouseX - padLeft;

    if (relX < 0 || relX > chartW) {
      setHoverIndex(null);
      return;
    }

    const idx = Math.round((relX / chartW) * (chartData.length - 1));
    setHoverIndex(Math.max(0, Math.min(chartData.length - 1, idx)));
  };

  // Change calculations
  const firstBalance = chartData.length > 0 ? chartData[0].balance : 0;
  const lastBalance = chartData.length > 0 ? chartData[chartData.length - 1].balance : 0;
  const displayBalance = hoverIndex !== null ? chartData[hoverIndex].balance : lastBalance;
  const displayChange = hoverIndex !== null
    ? chartData[hoverIndex].balance - firstBalance
    : lastBalance - firstBalance;
  const displayPct = firstBalance !== 0 ? (displayChange / firstBalance) * 100 : 0;
  const isPositive = displayChange >= 0;

  const hoverPoint = hoverIndex !== null ? points[hoverIndex] : null;
  const hoverData = hoverIndex !== null ? chartData[hoverIndex] : null;

  // Line color based on performance
  const lineColor = isPositive ? "#16a34a" : "#dc2626";
  const gradId = "balGrad";

  return (
    <div
      style={{
        backgroundColor: "var(--color-white)",
        border: "1px solid var(--color-warm-gray-200)",
        borderRadius: "10px",
        padding: "16px 20px 14px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-text-tertiary)",
              marginBottom: "6px",
            }}
          >
            Company Holdings
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "24px",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "var(--color-text-primary)",
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
              }}
            >
              {formatCurrency(displayBalance)}
            </span>
            {hasData && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: lineColor,
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" style={{ transform: isPositive ? "none" : "rotate(180deg)" }}>
                  <path d="M5 1L9 6H1L5 1Z" fill="currentColor" />
                </svg>
                {formatCurrency(Math.abs(displayChange))}
                {" "}
                <span style={{ fontWeight: 500, opacity: 0.8 }}>
                  ({Math.abs(displayPct).toFixed(1)}%)
                </span>
              </span>
            )}
          </div>
          {hoverData ? (
            <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "3px" }}>
              {formatDateFull(hoverData.date)}
            </div>
          ) : hasData ? (
            <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "3px" }}>
              {formatDateFull(chartData[0].date)} to {formatDateFull(chartData[chartData.length - 1].date)}
            </div>
          ) : null}
        </div>

        {/* Time range pills */}
        <div
          style={{
            display: "flex",
            gap: "2px",
            padding: "3px",
            borderRadius: "9px",
            backgroundColor: "var(--color-warm-gray-50)",
            border: "1px solid var(--color-warm-gray-200)",
            flexShrink: 0,
          }}
        >
          {TIME_RANGE_LABELS.map((r) => (
            <button
              key={r.value}
              onClick={() => { setRange(r.value); setHoverIndex(null); }}
              style={{
                padding: "5px 10px",
                borderRadius: "7px",
                border: "none",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                backgroundColor: range === r.value ? "var(--color-white)" : "transparent",
                color: range === r.value ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                boxShadow: range === r.value ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "background-color 0.12s ease, color 0.12s ease, box-shadow 0.12s ease",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {hasData ? (
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: "100%", height: "auto", cursor: "crosshair", userSelect: "none" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.08" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padLeft}
                x2={width - padRight}
                y1={toY(tick)}
                y2={toY(tick)}
                stroke="var(--color-warm-gray-100)"
                strokeWidth="0.75"
              />
              <text
                x={padLeft - 8}
                y={toY(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                fill="var(--color-text-tertiary)"
                fontSize="10"
                fontWeight="500"
                fontFamily="system-ui, sans-serif"
              >
                {formatYLabel(tick)}
              </text>
            </g>
          ))}

          {/* X-axis labels */}
          {xLabels.map((label, i) => (
            <text
              key={i}
              x={label.x}
              y={height - 4}
              textAnchor="middle"
              fill="var(--color-text-tertiary)"
              fontSize="10"
              fontWeight="500"
              fontFamily="system-ui, sans-serif"
            >
              {label.label}
            </text>
          ))}

          {/* Area fill */}
          <path d={areaPath} fill={`url(#${gradId})`} />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover crosshair + dot */}
          {hoverPoint && (
            <>
              <line
                x1={hoverPoint.x}
                x2={hoverPoint.x}
                y1={padTop}
                y2={padTop + chartH}
                stroke="var(--color-warm-gray-300)"
                strokeWidth="0.75"
                strokeDasharray="3 2"
              />
              <circle
                cx={hoverPoint.x}
                cy={hoverPoint.y}
                r="4.5"
                fill="var(--color-white)"
                stroke={lineColor}
                strokeWidth="2"
              />
            </>
          )}
        </svg>
      ) : (
        <div
          style={{
            height: "180px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "12px",
            backgroundColor: "var(--color-warm-gray-50)",
            border: "1px dashed var(--color-warm-gray-200)",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: "var(--color-text-tertiary)",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            Balance tracking started. Chart fills in as daily syncs accumulate data.
          </p>
        </div>
      )}
    </div>
  );
}
