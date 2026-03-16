import {
  Clock,
  CalendarCheck,
  ShieldCheck,
  PawPrint,
  Tag,
} from "@phosphor-icons/react";
import Button from "@/components/ui/Button";
import type { Property } from "@/types/property";

interface BookingCardProps {
  property: Property;
}

export default function BookingCard({ property }: BookingCardProps) {
  const { pricePerNight, checkIn, checkOut, cancellationPolicy, petPolicy } = property;

  return (
    <div className="lg:sticky lg:top-[calc(var(--header-height)+24px)]">
      <div
        className="
          p-6 rounded-[20px] bg-[var(--surface)] border border-[var(--border-subtle)]
          shadow-[var(--shadow-card)]
          hover:shadow-[var(--shadow-glow-brand)]
          transition-[box-shadow] duration-300 ease-out
        "
      >
        {/* Price */}
        <div className="flex items-baseline gap-1.5 mb-2">
          <span className="text-4xl font-bold text-[var(--accent-warm)] font-[family-name:var(--font-nexa)]">
            ${pricePerNight}
          </span>
          <span className="text-sm text-[var(--text-tertiary)] font-[family-name:var(--font-raleway)]">
            / night
          </span>
        </div>

        {/* Book Direct badge */}
        <div className="mb-6">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-[var(--accent-warm-muted)] text-[var(--accent-warm-dark)] font-[family-name:var(--font-nexa)]">
            <Tag size={12} weight="bold" />
            Book Direct, Save 10%
          </span>
        </div>

        {/* Details */}
        <div className="space-y-4 mb-6">
          <DetailRow
            icon={<Clock size={18} weight="duotone" />}
            label="Check in"
            value={checkIn}
          />
          <DetailRow
            icon={<CalendarCheck size={18} weight="duotone" />}
            label="Check out"
            value={checkOut}
          />
          <DetailRow
            icon={<ShieldCheck size={18} weight="duotone" />}
            label="Cancellation"
            value={cancellationPolicy}
          />
          <DetailRow
            icon={<PawPrint size={18} weight="duotone" />}
            label="Pets"
            value={petPolicy}
          />
        </div>

        {/* Separator */}
        <div className="border-t border-[var(--border-subtle)] mb-6" />

        {/* Book button */}
        <Button variant="primary" size="lg" className="w-full">
          Book This Property
        </Button>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[var(--brand-bright)] mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-[var(--text-tertiary)] font-[family-name:var(--font-poppins)] uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm text-[var(--text-secondary)] font-[family-name:var(--font-raleway)] leading-snug mt-0.5">
          {value}
        </p>
      </div>
    </div>
  );
}
