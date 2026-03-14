import {
  WifiHigh,
  CookingPot,
  WashingMachine,
  Wind,
  Car,
  Fire,
  Television,
  Coffee,
  Flower,
  Laptop,
  Mountains,
  Anchor,
  Boat,
  Door,
  Plant,
  Buildings,
  Fan,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

interface AmenityIconProps {
  amenity: string;
  size?: number;
}

const iconMap: Record<string, Icon> = {
  wifi: WifiHigh,
  kitchen: CookingPot,
  washer: WashingMachine,
  dryer: Wind,
  parking: Car,
  "air-conditioning": Fan,
  heating: Fire,
  tv: Television,
  "coffee-maker": Coffee,
  patio: Flower,
  workspace: Laptop,
  "river-view": Mountains,
  "dock-access": Anchor,
  kayaks: Boat,
  fireplace: Fire,
  porch: Door,
  garden: Plant,
  "rooftop-terrace": Buildings,
};

function formatLabel(amenity: string): string {
  return amenity
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function AmenityIcon({ amenity, size = 22 }: AmenityIconProps) {
  const IconComponent = iconMap[amenity];
  const label = formatLabel(amenity);

  if (!IconComponent) {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
        {label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] font-[family-name:var(--font-body)]">
      <IconComponent
        size={size}
        weight="duotone"
        className="text-[var(--brand-bright)] shrink-0"
      />
      {label}
    </span>
  );
}
