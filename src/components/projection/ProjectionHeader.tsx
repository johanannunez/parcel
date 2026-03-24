"use client";

import { MapPin, CalendarBlank, Buildings } from "@phosphor-icons/react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import type { PropertyInfo, CompSetInfo } from "@/types/projection";

interface ProjectionHeaderProps {
  property: PropertyInfo;
  compSet: CompSetInfo;
  generatedDate: string;
}

export default function ProjectionHeader({
  property,
  compSet,
  generatedDate,
}: ProjectionHeaderProps) {
  const date = new Date(generatedDate);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <section className="pt-36 md:pt-40 pb-12 px-[var(--section-pad-x)]">
      <div className="max-w-[var(--max-width-narrow)] mx-auto">
        <AnimatedSection direction="up">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-6">
            <span
              className="block h-[2px] w-10 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, var(--brand-bright), var(--brand-deep))",
              }}
              aria-hidden="true"
            />
            <span className="font-[family-name:var(--font-nexa)] text-[11px] tracking-[0.25em] text-[var(--brand-bright)] uppercase">
              Market Analysis
            </span>
          </div>

          {/* Property address */}
          <h1 className="font-[family-name:var(--font-poppins)] text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] leading-tight mb-4">
            {property.address}
          </h1>

          {/* Meta pills */}
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-sm font-[family-name:var(--font-raleway)] text-[var(--text-secondary)]">
              <MapPin size={15} weight="fill" className="text-[var(--brand-bright)]" />
              {property.city}, {property.state} {property.zip}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-sm font-[family-name:var(--font-raleway)] text-[var(--text-secondary)]">
              <Buildings size={15} weight="fill" className="text-[var(--brand-bright)]" />
              {property.bedrooms} Bedroom · {property.label}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-sm font-[family-name:var(--font-raleway)] text-[var(--text-secondary)]">
              <CalendarBlank size={15} weight="fill" className="text-[var(--brand-bright)]" />
              {formattedDate}
            </span>
          </div>

          {/* Comp set context */}
          <p className="mt-4 text-sm font-[family-name:var(--font-raleway)] text-[var(--text-tertiary)]">
            Based on {compSet.matchedListings} of {compSet.totalListings}{" "}
            {compSet.platform} listings in {compSet.market}
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}
