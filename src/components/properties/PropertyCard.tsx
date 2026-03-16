"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Users, Bed, Bathtub } from "@phosphor-icons/react";
import { motion, useMotionValue, useSpring } from "motion/react";
import type { Property } from "@/types/property";

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const {
    slug,
    title,
    tagline,
    location,
    photos,
    guests,
    bedrooms,
    bathrooms,
    pricePerNight,
    featured,
  } = property;

  const rotateX = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);
    rotateX.set(-y * 2);
    rotateY.set(x * 2);
  }

  function handleMouseLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <Link href={`/properties/${slug}`} className="group block">
      <motion.article
        className="rounded-[20px] overflow-hidden bg-[var(--surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)] transition-shadow duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-[var(--shadow-card-hover)]"
        style={{ rotateX, rotateY, transformPerspective: 800 }}
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Image container */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={photos[0]}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
          />
        </div>

        {/* Card body */}
        <div className="p-5">
          {/* Location */}
          <div className="flex items-center gap-1.5">
            {featured && (
              <span className="w-2 h-2 rounded-full bg-[var(--accent-warm)] shrink-0" />
            )}
            <MapPin size={13} weight="fill" className="text-[var(--text-tertiary)] shrink-0" />
            <span className="text-xs text-[var(--text-tertiary)] font-[family-name:var(--font-raleway)]">
              {location.city}, {location.state}
            </span>
          </div>

          {/* Title */}
          <h3 className="mt-2 text-lg font-bold text-[var(--text-primary)] font-[family-name:var(--font-poppins)] leading-snug tracking-tight group-hover:text-[var(--accent-warm)] transition-colors duration-200">
            {title}
          </h3>

          {/* Tagline */}
          <p className="mt-1.5 text-sm text-[var(--text-secondary)] font-[family-name:var(--font-raleway)] truncate">
            {tagline}
          </p>

          {/* Amenity summary */}
          <div className="mt-3 flex items-center gap-4 text-xs text-[var(--text-tertiary)] font-[family-name:var(--font-raleway)]">
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
          <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-baseline gap-1">
            <span className="font-[family-name:var(--font-nexa)] text-2xl font-bold text-[var(--accent-warm)]">
              ${pricePerNight}
            </span>
            <span className="text-sm text-[var(--text-tertiary)] font-[family-name:var(--font-raleway)]">
              /night
            </span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
