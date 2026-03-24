"use client";

import Image from "next/image";
import { Star, MapPin, Users, WifiHigh, Heart } from "@phosphor-icons/react";
import { motion } from "motion/react";

export interface Property {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: number;
  reviewCount: number;
  maxGuests: number;
  bedrooms: number;
  image: string;
  type: "vacation" | "corporate";
  featured?: boolean;
}

interface PropertyCardProps {
  property: Property;
  index?: number;
}

export default function PropertyCard({ property, index = 0 }: PropertyCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.5,
        delay: index * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group cursor-pointer"
    >
      {/* Image Container */}
      <div className="relative aspect-[3/2] overflow-hidden rounded-[var(--radius-md)]">
        <Image
          src={property.image}
          alt={property.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
        />

        {/* Favorite Button */}
        <button
          className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-transform duration-300 hover:scale-110"
          aria-label="Save to favorites"
        >
          <Heart size={18} weight="bold" className="text-text-primary" />
        </button>

        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <span className="text-label rounded-full bg-white/90 px-3 py-1.5 text-[10px] backdrop-blur-sm">
            {property.type === "vacation" ? "Vacation" : "Corporate"}
          </span>
        </div>

        {/* Price Tag */}
        <div className="absolute bottom-3 left-3">
          <span className="rounded-[var(--radius-sm)] bg-white/90 px-3 py-1.5 text-sm font-bold text-text-primary backdrop-blur-sm">
            ${property.price}{" "}
            <span className="text-xs font-normal text-text-secondary">
              /night
            </span>
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-text-primary leading-snug group-hover:text-brand transition-colors duration-300">
            {property.name}
          </h3>
          <div className="flex shrink-0 items-center gap-1">
            <Star size={14} weight="fill" className="text-star" />
            <span className="text-sm font-medium text-text-primary">
              {property.rating}
            </span>
            <span className="text-xs text-text-tertiary">
              ({property.reviewCount})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-text-secondary">
          <MapPin size={14} weight="bold" className="shrink-0 text-text-tertiary" />
          <span>{property.location}</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-text-tertiary">
          <span className="flex items-center gap-1">
            <Users size={13} weight="bold" />
            {property.maxGuests} guests
          </span>
          <span>{property.bedrooms} {property.bedrooms === 1 ? "bedroom" : "bedrooms"}</span>
          <span className="flex items-center gap-1">
            <WifiHigh size={13} weight="bold" />
            Wi-Fi
          </span>
        </div>
      </div>
    </motion.article>
  );
}
