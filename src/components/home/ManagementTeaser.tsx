import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import AnimatedSection from "@/components/ui/AnimatedSection";
import Button from "@/components/ui/Button";

export default function ManagementTeaser() {
  return (
    <section className="relative py-[var(--section-pad-y)] px-[var(--section-pad-x)] bg-[var(--bg-elevated)] overflow-hidden grain">
      <div className="relative z-10 max-w-[var(--max-width)] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text side */}
          <AnimatedSection direction="left">
            <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-[var(--brand-bright)] mb-3 font-[family-name:var(--font-heading)]">
              FOR PROPERTY OWNERS
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)] leading-tight">
              Let us manage your investment
            </h2>
            <p className="mt-5 text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-lg font-[family-name:var(--font-body)]">
              The Parcel Company handles everything from listing creation to
              guest checkout. You keep 80% of revenue, and never lift a finger.
            </p>
            <div className="mt-8">
              <Button variant="primary" size="lg" href="/management">
                Learn About Management
                <ArrowRight size={18} weight="bold" />
              </Button>
            </div>
          </AnimatedSection>

          {/* Decorative visual */}
          <AnimatedSection direction="right" delay={0.2}>
            <div className="relative">
              {/* Gradient card stack decoration */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
                {/* Background gradient orbs */}
                <div className="absolute inset-0 bg-[var(--surface)]" />
                <div className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full bg-[var(--brand-bright)] opacity-10 blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-56 h-56 rounded-full bg-[var(--brand-deep)] opacity-10 blur-3xl" />

                {/* Stat cards */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
                  <StatCard label="Average Owner Revenue" value="80%" />
                  <StatCard label="Properties Under Management" value="9+" />
                  <StatCard label="Guest Satisfaction Rate" value="4.9/5" />
                </div>
              </div>

              {/* Accent border */}
              <div className="absolute -inset-px rounded-2xl border border-[var(--border)] pointer-events-none" />
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="w-full max-w-xs bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-6 py-4 shadow-[var(--shadow-sm)] flex items-center justify-between gap-4">
      <span className="text-sm text-[var(--text-secondary)] font-[family-name:var(--font-body)]">
        {label}
      </span>
      <span className="text-2xl font-bold text-[var(--brand-bright)] font-[family-name:var(--font-heading)]">
        {value}
      </span>
    </div>
  );
}
