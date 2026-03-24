"use client";

import { useRef, useState, useCallback } from "react";
import { motion, useInView } from "motion/react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { formatCurrency } from "@/lib/projection-calc";
import type { MonthlyData } from "@/types/projection";

interface RevenueChartProps {
  monthlyData: MonthlyData[];
  averageMonthly: number;
}

const CHART_WIDTH = 800;
const CHART_HEIGHT = 360;
const PADDING = { top: 30, right: 20, bottom: 50, left: 60 };
const INNER_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const INNER_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;

export default function RevenueChart({
  monthlyData,
  averageMonthly,
}: RevenueChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const maxValue = Math.max(...monthlyData.map((d) => d.rangeHigh));
  const yMax = Math.ceil(maxValue / 500) * 500;
  const yTicks = Array.from({ length: Math.floor(yMax / 500) + 1 }, (_, i) => i * 500);

  const barGroupWidth = INNER_WIDTH / 12;
  const barWidth = barGroupWidth * 0.5;
  const rangeWidth = barGroupWidth * 0.7;

  function yScale(value: number): number {
    return INNER_HEIGHT - (value / yMax) * INNER_HEIGHT;
  }

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const scaleX = CHART_WIDTH / rect.width;
      const x = (e.clientX - rect.left) * scaleX - PADDING.left;
      const index = Math.floor(x / barGroupWidth);
      if (index >= 0 && index < 12) {
        setHoveredIndex(index);
        setTooltipPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      } else {
        setHoveredIndex(null);
      }
    },
    [barGroupWidth],
  );

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
              Monthly Trends
            </span>
          </div>
          <h2 className="font-[family-name:var(--font-poppins)] text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-2">
            Rental Revenue by Month
          </h2>
          <p className="font-[family-name:var(--font-raleway)] text-sm text-[var(--text-tertiary)] mb-8">
            50th percentile revenue with 25th to 75th percentile range
          </p>
        </AnimatedSection>

        <div
          ref={ref}
          className="relative rounded-[var(--radius-xl)] bg-[var(--surface)] border border-[var(--border)] p-4 md:p-6"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="w-full h-auto"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brand-bright)" />
                <stop offset="100%" stopColor="var(--brand-deep)" />
              </linearGradient>
              <linearGradient id="rangeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brand-bright)" stopOpacity="0.12" />
                <stop offset="100%" stopColor="var(--brand-deep)" stopOpacity="0.06" />
              </linearGradient>
            </defs>

            <g transform={`translate(${PADDING.left}, ${PADDING.top})`}>
              {/* Y-axis grid lines */}
              {yTicks.map((tick) => (
                <g key={tick}>
                  <line
                    x1={0}
                    x2={INNER_WIDTH}
                    y1={yScale(tick)}
                    y2={yScale(tick)}
                    stroke="var(--border-subtle)"
                    strokeWidth={1}
                    strokeDasharray={tick === 0 ? "0" : "4 4"}
                  />
                  <foreignObject
                    x={-PADDING.left}
                    y={yScale(tick) - 10}
                    width={PADDING.left - 8}
                    height={20}
                  >
                    <div
                      className="text-right text-[11px] font-[family-name:var(--font-raleway)] leading-[20px]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      ${(tick / 1000).toFixed(tick >= 1000 ? 1 : 0)}
                      {tick >= 1000 ? "K" : ""}
                    </div>
                  </foreignObject>
                </g>
              ))}

              {/* Average line */}
              <line
                x1={0}
                x2={INNER_WIDTH}
                y1={yScale(averageMonthly)}
                y2={yScale(averageMonthly)}
                stroke="var(--accent-warm)"
                strokeWidth={1.5}
                strokeDasharray="6 4"
                opacity={0.6}
              />
              <foreignObject
                x={INNER_WIDTH - 120}
                y={yScale(averageMonthly) - 22}
                width={120}
                height={18}
              >
                <div
                  className="text-right text-[10px] font-medium font-[family-name:var(--font-raleway)]"
                  style={{ color: "var(--accent-warm)" }}
                >
                  Avg {formatCurrency(averageMonthly)}/mo
                </div>
              </foreignObject>

              {/* Bars */}
              {monthlyData.map((data, i) => {
                const cx = i * barGroupWidth + barGroupWidth / 2;
                const rangeY = yScale(data.rangeHigh);
                const rangeHeight = yScale(data.rangeLow) - rangeY;
                const barY = yScale(data.revenue);
                const barHeight = INNER_HEIGHT - barY;
                const isHovered = hoveredIndex === i;

                return (
                  <g key={data.month}>
                    {/* Range band */}
                    <motion.rect
                      x={cx - rangeWidth / 2}
                      width={rangeWidth}
                      rx={4}
                      fill="url(#rangeGradient)"
                      initial={{ y: INNER_HEIGHT, height: 0 }}
                      animate={
                        inView
                          ? { y: rangeY, height: rangeHeight }
                          : { y: INNER_HEIGHT, height: 0 }
                      }
                      transition={{
                        duration: 0.8,
                        delay: i * 0.05 + 0.1,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />

                    {/* Revenue bar */}
                    <motion.rect
                      x={cx - barWidth / 2}
                      width={barWidth}
                      rx={3}
                      fill="url(#barGradient)"
                      opacity={isHovered ? 1 : 0.85}
                      initial={{ y: INNER_HEIGHT, height: 0 }}
                      animate={
                        inView
                          ? { y: barY, height: barHeight }
                          : { y: INNER_HEIGHT, height: 0 }
                      }
                      transition={{
                        duration: 0.8,
                        delay: i * 0.05 + 0.2,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      style={{
                        filter: isHovered
                          ? "drop-shadow(0 2px 8px rgba(2, 170, 235, 0.3))"
                          : "none",
                        transition: "filter 0.2s, opacity 0.2s",
                      }}
                    />

                    {/* Value label on bar */}
                    {inView && (
                      <foreignObject
                        x={cx - 30}
                        y={barY - 22}
                        width={60}
                        height={20}
                      >
                        <motion.div
                          className="text-center text-[10px] font-bold font-[family-name:var(--font-nexa)]"
                          style={{ color: "var(--text-primary)" }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.05 + 0.6 }}
                        >
                          {(data.revenue / 1000).toFixed(1)}K
                        </motion.div>
                      </foreignObject>
                    )}

                    {/* X-axis label */}
                    <foreignObject
                      x={cx - 20}
                      y={INNER_HEIGHT + 8}
                      width={40}
                      height={24}
                    >
                      <div
                        className={`text-center text-[12px] font-[family-name:var(--font-raleway)] ${
                          isHovered ? "font-bold" : "font-medium"
                        }`}
                        style={{
                          color: isHovered
                            ? "var(--text-primary)"
                            : "var(--text-tertiary)",
                          transition: "color 0.2s",
                        }}
                      >
                        {data.month}
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Tooltip */}
          {hoveredIndex !== null && (
            <div
              className="absolute z-10 pointer-events-none rounded-[var(--radius-md)] bg-[var(--surface)] border border-[var(--border)] px-4 py-3"
              style={{
                left: tooltipPos.x,
                top: tooltipPos.y - 90,
                transform: "translateX(-50%)",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              <p className="font-[family-name:var(--font-poppins)] text-sm font-bold text-[var(--text-primary)]">
                {monthlyData[hoveredIndex].month}
              </p>
              <p className="font-[family-name:var(--font-nexa)] text-base font-bold text-[var(--accent-warm)] mt-1">
                {formatCurrency(monthlyData[hoveredIndex].revenue)}
              </p>
              <p className="font-[family-name:var(--font-raleway)] text-xs text-[var(--text-tertiary)] mt-0.5">
                Range: {formatCurrency(monthlyData[hoveredIndex].rangeLow)} to{" "}
                {formatCurrency(monthlyData[hoveredIndex].rangeHigh)}
              </p>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-gradient-to-b from-[var(--brand-bright)] to-[var(--brand-deep)]" />
              <span className="text-xs font-[family-name:var(--font-raleway)] text-[var(--text-tertiary)]">
                50th Percentile Revenue
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-[var(--brand-bright)]/15" />
              <span className="text-xs font-[family-name:var(--font-raleway)] text-[var(--text-tertiary)]">
                25th to 75th Percentile
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-[2px] border-t-2 border-dashed border-[var(--accent-warm)]" />
              <span className="text-xs font-[family-name:var(--font-raleway)] text-[var(--text-tertiary)]">
                Monthly Average
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
