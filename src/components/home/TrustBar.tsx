import AnimatedSection from "@/components/ui/AnimatedSection";

const TRUST_ITEMS = [
  "9 Curated Homes",
  "5 Washington Cities",
  "Direct Booking Saves 10%",
  "24/7 Support",
];

export default function TrustBar() {
  return (
    <AnimatedSection direction="up" delay={0.1}>
      <div className="border-t border-b border-[var(--border)] py-5">
        <div className="max-w-[var(--max-width)] mx-auto px-[var(--section-pad-x)]">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2">
            {TRUST_ITEMS.map((item, i) => (
              <span key={item} className="flex items-center gap-2">
                <span className="text-sm text-[var(--text-secondary)] whitespace-nowrap font-[family-name:var(--font-raleway)]">
                  {item}
                </span>
                {i < TRUST_ITEMS.length - 1 && (
                  <span
                    className="text-[var(--text-tertiary)] text-sm select-none"
                    aria-hidden="true"
                  >
                    &middot;
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
