"use client";

import { useState, useMemo } from "react";
import { getAllProperties } from "@/content/properties";
import PropertyCard from "@/components/properties/PropertyCard";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { MagnifyingGlass } from "@phosphor-icons/react";

const LOCATIONS = ["All", "Pasco", "Kennewick", "Spokane", "Richland", "Vancouver"] as const;
const GUEST_OPTIONS = ["Any", "1-2", "3-4", "5-6", "7+"] as const;
const BEDROOM_OPTIONS = ["Any", "1", "2", "3", "4+"] as const;

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

interface PillProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function Pill({ label, active, onClick }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        rounded-full h-10 px-5 text-sm font-medium cursor-pointer
        transition-[background,color,border-color,box-shadow] duration-200
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-bright)]
        ${
          active
            ? "bg-[var(--brand-bright)] text-white font-semibold border border-transparent shadow-[var(--shadow-brand)]"
            : "bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] hover:border-[var(--border)]"
        }
      `}
    >
      {label}
    </button>
  );
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

  function clearFilters() {
    setLocation("All");
    setGuests("Any");
    setBedrooms("Any");
  }

  return (
    <section className="bg-[var(--bg)] pt-[calc(var(--header-height)+48px)] pb-[var(--section-pad-y)] px-[var(--section-pad-x)]">
      <div className="max-w-[var(--max-width)] mx-auto">
        {/* Page header */}
        <AnimatedSection className="max-w-2xl mb-12 text-center md:text-left mx-auto md:mx-0">
          <p className="font-[family-name:var(--font-nexa)] text-[11px] tracking-[0.25em] text-[var(--brand-bright)] font-bold uppercase mb-4">
            Browse Properties
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-poppins)]">
            Our Properties
          </h1>
          <p className="mt-4 text-lg text-[var(--text-secondary)] leading-relaxed font-[family-name:var(--font-raleway)]">
            Every home is personally curated, professionally maintained, and
            ready for your arrival.
          </p>
        </AnimatedSection>

        {/* Sticky filter bar */}
        <AnimatedSection delay={0.1}>
          <div className="sticky top-[var(--header-height)] z-40 -mx-[var(--section-pad-x)] px-[var(--section-pad-x)] py-4 bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--border-subtle)] mb-8">
            <div className="max-w-[var(--max-width)] mx-auto space-y-4">
              {/* Location pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-[family-name:var(--font-nexa)] text-[10px] tracking-wider text-[var(--text-tertiary)] uppercase font-bold mr-1 shrink-0">
                  Location
                </span>
                {LOCATIONS.map((loc) => (
                  <Pill
                    key={loc}
                    label={loc}
                    active={location === loc}
                    onClick={() => setLocation(loc)}
                  />
                ))}
              </div>

              {/* Guests pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-[family-name:var(--font-nexa)] text-[10px] tracking-wider text-[var(--text-tertiary)] uppercase font-bold mr-1 shrink-0">
                  Guests
                </span>
                {GUEST_OPTIONS.map((opt) => (
                  <Pill
                    key={opt}
                    label={opt}
                    active={guests === opt}
                    onClick={() => setGuests(opt)}
                  />
                ))}
              </div>

              {/* Bedrooms pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-[family-name:var(--font-nexa)] text-[10px] tracking-wider text-[var(--text-tertiary)] uppercase font-bold mr-1 shrink-0">
                  Bedrooms
                </span>
                {BEDROOM_OPTIONS.map((opt) => (
                  <Pill
                    key={opt}
                    label={opt}
                    active={bedrooms === opt}
                    onClick={() => setBedrooms(opt)}
                  />
                ))}
              </div>

              {/* Result count + Clear */}
              <div className="flex items-center justify-between pt-1">
                <p className="text-sm text-[var(--text-tertiary)] font-[family-name:var(--font-raleway)]">
                  {filtered.length} {filtered.length === 1 ? "property" : "properties"} found
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm font-semibold text-[var(--brand-bright)] hover:text-[var(--brand-deep)] transition-colors duration-200 font-[family-name:var(--font-poppins)] cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Property grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filtered.map((property, i) => (
              <AnimatedSection key={property.slug} delay={0.06 * i}>
                <PropertyCard property={property} />
              </AnimatedSection>
            ))}
          </div>
        ) : (
          <AnimatedSection delay={0.15}>
            <div className="text-center py-24">
              <div className="mx-auto mb-5 flex items-center justify-center w-16 h-16 rounded-full bg-[var(--surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-sm)]">
                <MagnifyingGlass size={28} weight="duotone" className="text-[var(--brand-bright)]" />
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-poppins)] mb-2">
                No properties match
              </h2>
              <p className="text-sm text-[var(--text-tertiary)] font-[family-name:var(--font-raleway)] mb-5">
                Try adjusting your filters to see more results.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center rounded-full px-5 py-2 text-sm font-semibold text-white bg-[var(--brand-bright)] cursor-pointer transition-opacity duration-200 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-bright)]"
              >
                Clear all filters
              </button>
            </div>
          </AnimatedSection>
        )}
      </div>
    </section>
  );
}
