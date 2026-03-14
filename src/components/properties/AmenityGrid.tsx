"use client";

import AmenityIcon from "@/components/properties/AmenityIcon";

interface AmenityGridProps {
  amenities: string[];
}

export default function AmenityGrid({ amenities }: AmenityGridProps) {
  return (
    <section>
      <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)] mb-5">
        Amenities
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
        {amenities.map((amenity) => (
          <AmenityIcon key={amenity} amenity={amenity} size={20} />
        ))}
      </div>
    </section>
  );
}
