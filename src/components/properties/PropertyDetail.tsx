"use client";

import type { Property } from "@/types/property";
import PhotoGallery from "@/components/properties/PhotoGallery";
import PropertyHeader from "@/components/properties/PropertyHeader";
import PropertyDescription from "@/components/properties/PropertyDescription";
import SleepingArrangements from "@/components/properties/SleepingArrangements";
import AmenityGrid from "@/components/properties/AmenityGrid";
import HouseRules from "@/components/properties/HouseRules";
import LocationSection from "@/components/properties/LocationSection";
import BookingCard from "@/components/properties/BookingCard";
import ReviewsPlaceholder from "@/components/properties/ReviewsPlaceholder";
import AnimatedSection from "@/components/ui/AnimatedSection";

interface PropertyDetailProps {
  property: Property;
}

export default function PropertyDetail({ property }: PropertyDetailProps) {
  return (
    <article className="pt-[var(--header-height)] pb-[var(--section-pad-y)]">
      {/* Photo gallery */}
      <PhotoGallery photos={property.photos} title={property.title} />

      <div className="px-[var(--section-pad-x)]">
        <div className="max-w-[var(--max-width)] mx-auto mt-8 lg:mt-10">
          {/* Property header */}
          <AnimatedSection>
            <PropertyHeader property={property} />
          </AnimatedSection>

          {/* Two-column layout */}
          <div className="mt-10 flex flex-col lg:flex-row gap-10 lg:gap-14">
            {/* Left column */}
            <div className="flex-1 min-w-0 space-y-12">
              <AnimatedSection delay={0.1}>
                <PropertyDescription description={property.description} />
              </AnimatedSection>

              <AnimatedSection delay={0.15}>
                <SleepingArrangements arrangements={property.sleepingArrangements} />
              </AnimatedSection>

              <AnimatedSection delay={0.2}>
                <AmenityGrid amenities={property.amenities} />
              </AnimatedSection>

              <AnimatedSection delay={0.25}>
                <HouseRules rules={property.houseRules} />
              </AnimatedSection>

              <AnimatedSection delay={0.3}>
                <LocationSection
                  city={property.location.city}
                  state={property.location.state}
                  neighborhood={property.neighborhood}
                />
              </AnimatedSection>
            </div>

            {/* Right column (booking sidebar) */}
            <div className="w-full lg:w-[380px] shrink-0">
              <AnimatedSection delay={0.15} direction="right">
                <BookingCard property={property} />
              </AnimatedSection>
            </div>
          </div>

          {/* Reviews */}
          <AnimatedSection delay={0.35} className="mt-16">
            <ReviewsPlaceholder />
          </AnimatedSection>
        </div>
      </div>
    </article>
  );
}
