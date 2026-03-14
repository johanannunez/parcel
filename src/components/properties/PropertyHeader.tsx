import { MapPin, Users, Bed, Bathtub } from "@phosphor-icons/react";
import type { Property } from "@/types/property";

interface PropertyHeaderProps {
  property: Property;
}

export default function PropertyHeader({ property }: PropertyHeaderProps) {
  const { title, tagline, location, guests, bedrooms, bathrooms } = property;

  return (
    <header>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
        {title}
      </h1>

      <p className="mt-2 text-base sm:text-lg text-[var(--text-secondary)] font-[family-name:var(--font-body)] leading-relaxed">
        {tagline}
      </p>

      {/* Location */}
      <div className="mt-3 flex items-center gap-1.5 text-sm text-[var(--text-tertiary)] font-[family-name:var(--font-body)]">
        <MapPin size={16} weight="fill" className="text-[var(--brand-bright)]" />
        {location.city}, {location.state}
      </div>

      {/* Key stats */}
      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
        <StatItem icon={<Users size={18} weight="duotone" />} label={`${guests} guests`} />
        <StatDivider />
        <StatItem icon={<Bed size={18} weight="duotone" />} label={`${bedrooms} bedroom${bedrooms !== 1 ? "s" : ""}`} />
        <StatDivider />
        <StatItem icon={<Bathtub size={18} weight="duotone" />} label={`${bathrooms} bath${bathrooms !== 1 ? "s" : ""}`} />
      </div>

      {/* Separator */}
      <div className="mt-8 border-b border-[var(--border-subtle)]" />
    </header>
  );
}

function StatItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] font-[family-name:var(--font-body)]">
      <span className="text-[var(--brand-bright)]">{icon}</span>
      {label}
    </span>
  );
}

function StatDivider() {
  return (
    <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-[var(--text-tertiary)]" />
  );
}
