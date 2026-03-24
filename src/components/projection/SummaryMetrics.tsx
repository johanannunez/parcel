"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useInView } from "motion/react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import type { ComparisonStat } from "@/types/projection";

const COUNTER_DURATION_MS = 1800;

function useAnimatedCounter(
  target: number,
  active: boolean,
): number {
  const [value, setValue] = useState(0);

  const animate = useCallback(() => {
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / COUNTER_DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * target);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    }

    requestAnimationFrame(tick);
  }, [target]);

  useEffect(() => {
    if (active) animate();
  }, [active, animate]);

  return value;
}

function MetricCard({
  stat,
  active,
  delay,
}: {
  stat: ComparisonStat;
  active: boolean;
  delay: number;
}) {
  const animatedValue = useAnimatedCounter(stat.value, active);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [active, delay]);

  const isPositive = stat.vsCompSet !== undefined && stat.vsCompSet > 0;
  const isNegative = stat.vsCompSet !== undefined && stat.vsCompSet < 0;

  const displayValue = Number.isInteger(stat.value)
    ? Math.round(animatedValue).toLocaleString("en-US")
    : animatedValue.toFixed(1);

  return (
    <div
      className="relative rounded-[var(--radius-lg)] bg-[var(--surface)] border border-[var(--border)] p-6 md:p-7"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition:
          "opacity 0.5s ease-out, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Value */}
      <div className="flex items-baseline gap-0.5">
        {stat.prefix && (
          <span className="font-[family-name:var(--font-nexa)] text-2xl md:text-3xl font-bold text-[var(--accent-warm)]">
            {stat.prefix}
          </span>
        )}
        <span className="font-[family-name:var(--font-nexa)] text-3xl md:text-4xl font-bold text-[var(--accent-warm)]">
          {displayValue}
        </span>
        {stat.suffix && (
          <span className="font-[family-name:var(--font-raleway)] text-sm md:text-base text-[var(--text-tertiary)] ml-0.5">
            {stat.suffix}
          </span>
        )}
      </div>

      {/* Label */}
      <p className="font-[family-name:var(--font-raleway)] text-sm text-[var(--text-secondary)] mt-2">
        {stat.label}
      </p>

      {/* Sublabel or CompSet comparison */}
      {stat.sublabel && (
        <p className="font-[family-name:var(--font-raleway)] text-xs text-[var(--text-tertiary)] mt-1.5">
          {stat.sublabel}
        </p>
      )}

      {stat.vsCompSet !== undefined && (
        <div className="mt-3">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium font-[family-name:var(--font-raleway)] ${
              isPositive
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : isNegative
                  ? "bg-rose-500/10 text-rose-500 dark:text-rose-400"
                  : "bg-[var(--surface-hover)] text-[var(--text-tertiary)]"
            }`}
          >
            {isPositive ? "↑" : isNegative ? "↓" : ""}
            {Math.abs(stat.vsCompSet).toFixed(2)}% vs. CompSet
          </span>
        </div>
      )}
    </div>
  );
}

interface SummaryMetricsProps {
  stats: ComparisonStat[];
}

export default function SummaryMetrics({ stats }: SummaryMetricsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="pb-12 px-[var(--section-pad-x)]">
      <div className="max-w-[var(--max-width)] mx-auto">
        <AnimatedSection direction="up" delay={0.1}>
          <div
            ref={ref}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {stats.map((stat, i) => (
              <MetricCard
                key={stat.label}
                stat={stat}
                active={inView}
                delay={i * 120}
              />
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
