import { HOSPITABLE_SITE_ID, getWidgetId } from "@/data/hospitable-widget-ids";

interface Props {
  propertyId: string;
}

export default function HospitableBookingWidget({ propertyId }: Props) {
  const numericId = getWidgetId(propertyId);

  if (!numericId) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-warm-gray-200 bg-warm-gray-50 text-center">
        <div>
          <p className="text-sm font-medium text-text-secondary">Booking calendar coming soon</p>
          <p className="mt-1 text-xs text-text-tertiary">
            Contact us to check availability and book directly.
          </p>
        </div>
      </div>
    );
  }

  const src = `https://booking.hospitable.com/widget/${HOSPITABLE_SITE_ID}/${numericId}`;

  return (
    <iframe
      id="booking-iframe"
      sandbox="allow-top-navigation allow-scripts allow-same-origin"
      style={{ width: "100%", height: "900px", border: "none" }}
      src={src}
      title="Book this property"
    />
  );
}
