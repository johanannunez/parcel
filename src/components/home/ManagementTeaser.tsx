"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useInView } from "motion/react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import Button from "@/components/ui/Button";

/* ── Stat definitions ── */

interface StatDef {
  target: number;
  decimals: number;
  suffix: string;
  label: string;
}

const STATS: StatDef[] = [
  { target: 80, decimals: 0, suffix: "%", label: "Owner Revenue" },
  { target: 9, decimals: 0, suffix: "+", label: "Properties Managed" },
  { target: 4.9, decimals: 1, suffix: "", label: "Guest Rating" },
];

const COUNTER_DURATION_MS = 1500;

/* ── Animated counter hook ── */

function useAnimatedCounter(
  target: number,
  decimals: number,
  active: boolean
): string {
  const [value, setValue] = useState(0);

  const animate = useCallback(() => {
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / COUNTER_DURATION_MS, 1);
      // Ease-out: 1 - (1 - t)^3
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
    if (active) {
      animate();
    }
  }, [active, animate]);

  return value.toFixed(decimals);
}

/* ── Single stat block ── */

function StatBlock({
  stat,
  active,
  delay,
}: {
  stat: StatDef;
  active: boolean;
  delay: number;
}) {
  const displayValue = useAnimatedCounter(stat.target, stat.decimals, active);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [active, delay]);

  return (
    <div
      className="flex flex-col items-center text-center"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.85)",
        transition: "opacity 0.5s ease-out, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <span className="font-[family-name:var(--font-nexa)] text-4xl md:text-5xl font-bold text-[var(--accent-warm)] leading-none">
        {displayValue}
        {stat.suffix}
      </span>
      <span className="font-[family-name:var(--font-raleway)] text-sm text-[var(--text-tertiary)] mt-2">
        {stat.label}
      </span>
    </div>
  );
}

/* ── Main component ── */

export default function ManagementTeaser() {
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-80px" });

  return (
    <section className="py-[var(--section-pad-y)] px-[var(--section-pad-x)] bg-[var(--bg)] border-t border-[var(--border)]">
      <div className="max-w-[var(--max-width)] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* ── Left side: Stats ── */}
          <AnimatedSection
            direction="up"
            className="order-2 lg:order-1"
          >
            <div ref={statsRef} className="flex justify-center gap-10 md:gap-14">
              {STATS.map((stat, i) => (
                <StatBlock
                  key={stat.label}
                  stat={stat}
                  active={statsInView}
                  delay={i * 150}
                />
              ))}
            </div>
          </AnimatedSection>

          {/* ── Right side: Text content ── */}
          <AnimatedSection
            direction="right"
            delay={0.15}
            className="order-1 lg:order-2"
          >
            {/* Eyebrow with decorative line */}
            <div className="flex items-center gap-3 mb-4">
              <span
                className="block h-[2px] w-10 rounded-full"
                style={{
                  background: "linear-gradient(90deg, var(--brand-bright), var(--brand-deep))",
                }}
                aria-hidden="true"
              />
              <span className="font-[family-name:var(--font-nexa)] text-[11px] tracking-[0.25em] text-[var(--brand-bright)] uppercase">
                For Property Owners
              </span>
            </div>

            {/* Heading */}
            <h2 className="font-[family-name:var(--font-poppins)] text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] leading-tight">
              Let us manage your investment
            </h2>

            {/* Body copy */}
            <p className="font-[family-name:var(--font-raleway)] text-base md:text-lg text-[var(--text-secondary)] leading-relaxed max-w-lg mt-5">
              The Parcel Company handles everything from listing creation to
              guest checkout. You keep 80% of revenue, and never lift a finger.
            </p>

            {/* CTA */}
            <div className="mt-8">
              <Button variant="primary" size="lg" href="/management">
                Learn About Management
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
