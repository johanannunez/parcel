"use client";

import AmenityIcon from "@/components/properties/AmenityIcon";

interface AmenityGridProps {
  amenities: string[];
}

interface Category {
  label: string;
  members: string[];
}

const CATEGORIES: Category[] = [
  {
    label: "Essentials",
    members: ["wifi", "heating", "air-conditioning", "washer", "dryer"],
  },
  {
    label: "Kitchen & Dining",
    members: ["kitchen", "coffee-maker"],
  },
  {
    label: "Outdoors",
    members: [
      "patio",
      "porch",
      "garden",
      "dock-access",
      "kayaks",
      "rooftop-terrace",
    ],
  },
  {
    label: "Living",
    members: ["tv", "fireplace", "workspace"],
  },
  {
    label: "Views & Features",
    members: ["river-view"],
  },
  {
    label: "Parking",
    members: ["parking"],
  },
];

/** All amenities explicitly assigned to a named category. */
const ASSIGNED_AMENITIES = new Set(
  CATEGORIES.flatMap((cat) => cat.members)
);

function categorizeAmenities(
  amenities: string[]
): { label: string; items: string[] }[] {
  const result: { label: string; items: string[] }[] = [];

  for (const category of CATEGORIES) {
    const matched = category.members.filter((m) => amenities.includes(m));
    if (matched.length > 0) {
      result.push({ label: category.label, items: matched });
    }
  }

  // Amenities not in any named category fall into "Views & Features"
  const uncategorized = amenities.filter((a) => !ASSIGNED_AMENITIES.has(a));
  if (uncategorized.length > 0) {
    const viewsGroup = result.find((g) => g.label === "Views & Features");
    if (viewsGroup) {
      viewsGroup.items.push(...uncategorized);
    } else {
      result.push({ label: "Views & Features", items: uncategorized });
    }
  }

  return result;
}

export default function AmenityGrid({ amenities }: AmenityGridProps) {
  const groups = categorizeAmenities(amenities);

  if (groups.length === 0) return null;

  return (
    <section>
      <h2 className="font-[family-name:var(--font-poppins)] text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-6">
        Amenities
      </h2>

      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            <h3 className="font-[family-name:var(--font-poppins)] text-xs font-semibold tracking-wider uppercase text-[var(--text-tertiary)] mb-2">
              {group.label}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {group.items.map((amenity) => (
                <div
                  key={amenity}
                  className="bg-[var(--surface-hover)] rounded-xl p-3 flex items-center gap-3 hover:shadow-[var(--shadow-sm)] hover:-translate-y-0.5 transition-[box-shadow,transform] duration-200"
                >
                  <AmenityIcon amenity={amenity} size={20} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
