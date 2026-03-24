"use client";

import AnimatedSection from "@/components/ui/AnimatedSection";
import Button from "@/components/ui/Button";
import { formatCurrency } from "@/lib/projection-calc";

interface ProjectionCTAProps {
  netAnnual: number;
  managementFeePercent: number;
}

export default function ProjectionCTA({
  netAnnual,
  managementFeePercent,
}: ProjectionCTAProps) {
  const keepPercent = Math.round((1 - managementFeePercent) * 100);

  return (
    <section className="py-20 px-[var(--section-pad-x)]">
      <div className="max-w-[var(--max-width-narrow)] mx-auto text-center">
        <AnimatedSection direction="up">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span
              className="block h-[2px] w-10 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, var(--brand-bright), var(--brand-deep))",
              }}
              aria-hidden="true"
            />
            <span className="font-[family-name:var(--font-nexa)] text-[11px] tracking-[0.25em] text-[var(--brand-bright)] uppercase">
              Get Started
            </span>
            <span
              className="block h-[2px] w-10 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, var(--brand-deep), var(--brand-bright))",
              }}
              aria-hidden="true"
            />
          </div>

          <h2 className="font-[family-name:var(--font-poppins)] text-3xl md:text-4xl font-bold text-[var(--text-primary)] leading-tight mb-4">
            Ready to earn{" "}
            <span className="text-[var(--accent-warm)]">
              {formatCurrency(netAnnual)}
            </span>
            /year?
          </h2>

          <p className="font-[family-name:var(--font-raleway)] text-base md:text-lg text-[var(--text-secondary)] leading-relaxed max-w-lg mx-auto mb-10">
            The Parcel Company handles everything from listing creation to guest
            checkout. You keep {keepPercent}% of rental revenue, and never lift
            a finger.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="primary" size="lg" href="/management">
              Learn About Management
            </Button>
            <Button variant="outline" size="lg" href="mailto:jo@johanannunez.com">
              Contact Us
            </Button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
