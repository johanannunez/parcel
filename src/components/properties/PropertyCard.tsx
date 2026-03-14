"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Users, Bed, Bathtub } from "@phosphor-icons/react";
import { motion } from "motion/react";
import type { Property } from "@/types/property";

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const { slug, title, tagline, location, photos, guests, bedrooms, bathrooms, pricePerNight } =
    property;

  return (
    <Link href={`/properties/${slug}`} className="group block">
      <motion.article
        className="rounded-xl overflow-hidden bg-[var(--surface)] shadow-[var(--shadow-sm)] transition-shadow duration-300 hover:shadow-[var(--shadow-lg)]"
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Image container */}
        <div className="relative aspect-[3/2] overflow-hidden">
          <Image
            src={photos[0]}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
          />

          {/* Subtle bottom gradient for badge readability */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Location badge */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1.5 rounded-full text-xs font-semibold font-[family-name:var(--font-heading)]">
            <MapPin size={14} weight="fill" className="text-[var(--brand-bright)]" />
            {location.city}, {location.state}
          </div>
        </div>

        {/* Card body */}
        <div className="p-5">
          {/* Title */}
          <h3 className="text-lg font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)] leading-snug group-hover:text-[var(--brand-bright)] transition-colors duration-200">
            {title}
          </h3>

          {/* Tagline */}
          <p className="mt-1 text-sm text-[var(--text-secondary)] font-[family-name:var(--font-body)] truncate">
            {tagline}
          </p>

          {/* Amenity summary */}
          <div className="mt-3 flex items-center gap-4 text-xs text-[var(--text-tertiary)] font-[family-name:var(--font-body)]">
            <span className="inline-flex items-center gap-1">
              <Users size={14} weight="duotone" />
              {guests} guests
            </span>
            <span className="inline-flex items-center gap-1">
              <Bed size={14} weight="duotone" />
              {bedrooms} bed{bedrooms !== 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-1">
              <Bathtub size={14} weight="duotone" />
              {bathrooms} bath{bathrooms !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Price */}
          <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
            <span className="text-lg font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
              ${pricePerNight}
            </span>
            <span className="text-sm text-[var(--text-tertiary)] ml-1">/night</span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
