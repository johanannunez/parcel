import { MapPin } from "@phosphor-icons/react";

interface LocationSectionProps {
  city: string;
  state: string;
  neighborhood: string;
}

export default function LocationSection({ city, state, neighborhood }: LocationSectionProps) {
  return (
    <section>
      <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)] mb-4">
        Location
      </h2>

      <div className="flex items-center gap-2 mb-3">
        <MapPin size={18} weight="fill" className="text-[var(--brand-bright)]" />
        <span className="text-sm font-semibold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
          {city}, {state}
        </span>
      </div>

      <p className="text-sm text-[var(--text-secondary)] font-[family-name:var(--font-body)] leading-relaxed">
        {neighborhood}
      </p>

      {/* Map placeholder for Phase 2 */}
      <div className="mt-6 rounded-[var(--radius-lg)] overflow-hidden bg-[var(--surface)] border border-[var(--border-subtle)] h-48 flex items-center justify-center">
        <span className="text-sm text-[var(--text-tertiary)] font-[family-name:var(--font-body)]">
          Interactive map coming in Phase 2
        </span>
      </div>
    </section>
  );
}
