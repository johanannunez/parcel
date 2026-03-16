"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { MapPin } from "@phosphor-icons/react";
import { getFeaturedProperties } from "@/content/properties";
import AnimatedSection from "@/components/ui/AnimatedSection";
import Button from "@/components/ui/Button";

export default function FeaturedProperties() {
  const properties = getFeaturedProperties().slice(0, 3);
  const gridRef = useRef<HTMLDivElement>(null);
  const gridInView = useInView(gridRef, { once: true, margin: "0px 0px -40px 0px" });

  return (
    <section
      id="featured"
      className="py-[var(--section-pad-y)] px-[var(--section-pad-x)]"
    >
      <div className="max-w-[var(--max-width)] mx-auto">
        {/* Section header */}
        <AnimatedSection className="text-center mb-14">
          <h2 className="font-[family-name:var(--font-poppins)] text-4xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tight">
            Featured Stays
          </h2>
        </AnimatedSection>

        {/* Property grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {properties.map((property, i) => (
            <motion.div
              key={property.slug}
              initial={{ opacity: 0, y: 24 }}
              animate={
                gridInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }
              }
              transition={{
                duration: 0.6,
                type: "spring",
                stiffness: 100,
                damping: 20,
                delay: 0.1 * i,
              }}
            >
              <Link
                href={`/properties/${property.slug}`}
                className="group block h-full"
              >
                <motion.article
                  className="h-full bg-[var(--surface)] border border-[var(--border-subtle)] rounded-[20px] overflow-hidden shadow-[var(--shadow-card)] transition-shadow duration-300"
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  style={{ willChange: "transform" }}
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={property.photos[0]}
                      alt={property.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                      priority={i < 3}
                    />
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Location */}
                    <div className="flex items-center gap-1.5 text-[var(--text-tertiary)] text-xs font-[family-name:var(--font-raleway)] mb-1.5">
                      <MapPin size={14} weight="fill" />
                      {property.location.city}, {property.location.state}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-[var(--text-primary)] font-[family-name:var(--font-poppins)] leading-snug mb-2">
                      {property.title}
                    </h3>

                    {/* Amenities row */}
                    <p className="text-xs text-[var(--text-tertiary)] font-[family-name:var(--font-raleway)] mb-3">
                      {property.guests} guests &middot; {property.bedrooms} bed{property.bedrooms !== 1 ? "s" : ""} &middot; {property.bathrooms} bath{property.bathrooms !== 1 ? "s" : ""}
                    </p>

                    {/* Price */}
                    <div className="flex items-baseline gap-1">
                      <span className="text-[var(--accent-warm)] font-[family-name:var(--font-nexa)] text-xl font-bold">
                        ${property.pricePerNight}
                      </span>
                      <span className="text-[var(--text-tertiary)] text-sm font-[family-name:var(--font-raleway)]">
                        /night
                      </span>
                    </div>
                  </div>
                </motion.article>
              </Link>
            </motion.div>
          ))}
        </div>

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
