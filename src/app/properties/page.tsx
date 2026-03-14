"use client";

import { useState, useMemo } from "react";
import { getAllProperties } from "@/content/properties";
import PropertyCard from "@/components/properties/PropertyCard";
import FilterSelect from "@/components/properties/FilterSelect";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { FunnelSimple } from "@phosphor-icons/react";

const LOCATIONS = ["All", "Pasco", "Kennewick", "Spokane", "Richland", "Vancouver"];
const GUEST_OPTIONS = ["Any", "1-2", "3-4", "5-6", "7+"];
const BEDROOM_OPTIONS = ["Any", "1", "2", "3", "4+"];

function matchesGuests(guests: number, filter: string): boolean {
  if (filter === "Any") return true;
  if (filter === "1-2") return guests >= 1 && guests <= 2;
  if (filter === "3-4") return guests >= 3 && guests <= 4;
  if (filter === "5-6") return guests >= 5 && guests <= 6;
  if (filter === "7+") return guests >= 7;
  return true;
}

function matchesBedrooms(bedrooms: number, filter: string): boolean {
  if (filter === "Any") return true;
  if (filter === "4+") return bedrooms >= 4;
  return bedrooms === parseInt(filter, 10);
}

export default function PropertiesPage() {
  const allProperties = getAllProperties();
  const [location, setLocation] = useState("All");
  const [guests, setGuests] = useState("Any");
  const [bedrooms, setBedrooms] = useState("Any");

  const filtered = useMemo(() => {
    return allProperties.filter((p) => {
      if (location !== "All" && p.location.city !== location) return false;
      if (!matchesGuests(p.guests, guests)) return false;
      if (!matchesBedrooms(p.bedrooms, bedrooms)) return false;
      return true;
    });
  }, [allProperties, location, guests, bedrooms]);

  const hasActiveFilters = location !== "All" || guests !== "Any" || bedrooms !== "Any";

  return (
    <section className="pt-[calc(var(--header-height)+48px)] pb-[var(--section-pad-y)] px-[var(--section-pad-x)]">
      <div className="max-w-[var(--max-width)] mx-auto">
        {/* Page header */}
        <AnimatedSection className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-[var(--brand-bright)] mb-3 font-[family-name:var(--font-heading)]">
            BROWSE PROPERTIES
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
            Our Properties
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed font-[family-name:var(--font-body)]">
            Every home is personally curated, professionally maintained, and
            ready for your arrival.
          </p>
        </AnimatedSection>

        {/* Filter bar */}
        <AnimatedSection delay={0.1} className="mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-[var(--radius-lg)] bg-[var(--surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)] shrink-0">
              <FunnelSimple size={18} weight="bold" className="text-[var(--brand-bright)]" />
              Filters
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:flex-1">
              <FilterSelect label="Location" value={location} options={LOCATIONS} onChange={setLocation} />
              <FilterSelect label="Guests" value={guests} options={GUEST_OPTIONS} onChange={setGuests} />
              <FilterSelect label="Bedrooms" value={bedrooms} options={BEDROOM_OPTIONS} onChange={setBedrooms} />
            </div>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setLocation("All");
                  setGuests("Any");
                  setBedrooms("Any");
                }}
                className="text-xs font-semibold text-[var(--brand-bright)] hover:text-[var(--brand-deep)] transition-colors duration-200 font-[family-name:var(--font-heading)] cursor-pointer shrink-0"
              >
                Clear all
              </button>
            )}
          </div>
        </AnimatedSection>

        {/* Results count */}
        <AnimatedSection delay={0.15} className="mb-6">
          <p className="text-sm text-[var(--text-tertiary)] font-[family-name:var(--font-body)]">
            {filtered.length} {filtered.length === 1 ? "property" : "properties"} found
          </p>
        </AnimatedSection>

        {/* Property grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filtered.map((property, i) => (
              <AnimatedSection key={property.slug} delay={0.05 * i}>
                <PropertyCard property={property} />
              </AnimatedSection>
            ))}
          </div>
        ) : (
          <AnimatedSection delay={0.15}>
            <div className="text-center py-20">
              <p className="text-lg text-[var(--text-secondary)] font-[family-name:var(--font-heading)] mb-2">
                No properties match your filters
              </p>
              <p className="text-sm text-[var(--text-tertiary)] font-[family-name:var(--font-body)]">
                Try adjusting your search criteria to see more results.
              </p>
            </div>
          </AnimatedSection>
        )}
      </div>
    </section>
  );
}
