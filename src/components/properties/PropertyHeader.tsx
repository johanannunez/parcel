import { MapPin, Users, Bed, Bathtub } from "@phosphor-icons/react";
import type { Property } from "@/types/property";

interface PropertyHeaderProps {
  property: Property;
}

export default function PropertyHeader({ property }: PropertyHeaderProps) {
  const { title, tagline, location, guests, bedrooms, bathrooms } = property;

  return (
    <header>
      {/* Location eyebrow */}
      <p className="text-sm text-[var(--text-tertiary)] font-[family-name:var(--font-raleway)] flex items-center gap-1.5 mb-4">
        <MapPin size={16} weight="fill" className="text-[var(--brand-bright)]" />
        {location.city}, {location.state}
      </p>

      <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)] font-[family-name:var(--font-poppins)]">
        {title}
      </h1>

      <p className="mt-2 text-base sm:text-lg text-[var(--text-secondary)] font-[family-name:var(--font-raleway)] leading-relaxed">
        {tagline}
      </p>

      {/* Key stats */}
      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
        <StatItem icon={<Users size={18} weight="duotone" />} label={`${guests} guests`} />
        <StatDivider />
        <StatItem icon={<Bed size={18} weight="duotone" />} label={`${bedrooms} bedroom${bedrooms !== 1 ? "s" : ""}`} />
        <StatDivider />
        <StatItem icon={<Bathtub size={18} weight="duotone" />} label={`${bathrooms} bath${bathrooms !== 1 ? "s" : ""}`} />
      </div>

      {/* Simple divider */}
      <div className="mt-8 border-b border-[var(--border)]" />
    </header>
  );
}

function StatItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] font-[family-name:var(--font-raleway)]">
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
