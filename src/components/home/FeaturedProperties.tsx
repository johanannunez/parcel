import { getFeaturedProperties } from "@/content/properties";
import AnimatedSection from "@/components/ui/AnimatedSection";
import Button from "@/components/ui/Button";
import PropertyCard from "@/components/properties/PropertyCard";

export default function FeaturedProperties() {
  const properties = getFeaturedProperties();

  return (
    <section
      id="featured"
      className="py-[var(--section-pad-y)] px-[var(--section-pad-x)]"
    >
      <div className="max-w-[var(--max-width)] mx-auto">
        {/* Section header */}
        <AnimatedSection className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-[var(--brand-bright)] mb-3 font-[family-name:var(--font-heading)]">
            FEATURED STAYS
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
            Handpicked homes for your next trip
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed font-[family-name:var(--font-body)]">
            Every property is personally curated and maintained to our exacting
            standards.
          </p>
        </AnimatedSection>

        {/* Property grid */}
        <AnimatedSection delay={0.15}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {properties.map((property) => (
              <PropertyCard key={property.slug} property={property} />
            ))}
          </div>
        </AnimatedSection>

        {/* View all CTA */}
        <AnimatedSection delay={0.3} className="mt-12 text-center">
          <Button variant="secondary" size="lg" href="/properties">
            View All Properties
          </Button>
        </AnimatedSection>
      </div>
    </section>
  );
}
