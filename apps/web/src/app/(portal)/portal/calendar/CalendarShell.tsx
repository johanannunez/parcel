"use client";

import { useCallback, useMemo, useState } from "react";
import { CalendarToolbar } from "./CalendarToolbar";
import { AvailabilityGrid } from "./AvailabilityGrid";
import { BookingDetailModal, type Booking } from "./BookingDetailModal";
import { CalendarSyncModal } from "./CalendarSyncModal";
import { BlockRequestModal } from "./BlockRequestModal";
import type { BlockRequest } from "./BlockBar";

type Property = { id: string; name: string };
type PastRequest = {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  status: "pending" | "approved" | "declined";
  note: string | null;
  created_at: string;
};

export function CalendarShell({
  year,
  month,
  properties,
  bookings,
  blockRequests,
  pastRequests,
  icalUrl,
}: {
  year: number;
  month: number;
  properties: Property[];
  bookings: Booking[];
  blockRequests: BlockRequest[];
  pastRequests: PastRequest[];
  icalUrl: string | null;
}) {
  const [hiddenProperties, setHiddenProperties] = useState<Set<string>>(
    new Set(),
  );
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);

  const onToggleProperty = useCallback((id: string) => {
    setHiddenProperties((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const visibleProperties = useMemo(
    () => properties.filter((p) => !hiddenProperties.has(p.id)),
    [properties, hiddenProperties],
  );

  const filteredBookings = useMemo(
    () => bookings.filter((b) => !hiddenProperties.has(b.property_id)),
    [bookings, hiddenProperties],
  );

  const filteredBlocks = useMemo(
    () => blockRequests.filter((r) => !hiddenProperties.has(r.property_id)),
    [blockRequests, hiddenProperties],
  );

  const propNameMap = useMemo(() => {
    const m = new Map<string, string>();
    properties.forEach((p) => m.set(p.id, p.name));
    return m;
  }, [properties]);

  return (
    <>
      {/* Height constraint: full viewport minus portal layout chrome */}
      <div className="flex h-[calc(100dvh-240px)] min-h-[340px] flex-col gap-4">
        <CalendarToolbar
          year={year}
          month={month}
          properties={properties}
          hiddenProperties={hiddenProperties}
          onToggleProperty={onToggleProperty}
          onOpenSync={() => setSyncModalOpen(true)}
          onOpenBlock={() => setBlockModalOpen(true)}
        />

        <div className="flex-1 min-h-0">
          <AvailabilityGrid
            year={year}
            month={month}
            properties={visibleProperties}
            bookings={filteredBookings}
            blockRequests={filteredBlocks}
            onSelectBooking={setSelectedBooking}
          />
        </div>
      </div>

      {selectedBooking ? (
        <BookingDetailModal
          booking={selectedBooking}
          propertyName={
            propNameMap.get(selectedBooking.property_id) ?? "Reservation"
          }
          onClose={() => setSelectedBooking(null)}
        />
      ) : null}

      {syncModalOpen ? (
        <CalendarSyncModal
          icalUrl={icalUrl}
          onClose={() => setSyncModalOpen(false)}
        />
      ) : null}

      {blockModalOpen ? (
        <BlockRequestModal
          properties={properties.map((p) => ({ id: p.id, name: p.name }))}
          pastRequests={pastRequests}
          onClose={() => setBlockModalOpen(false)}
        />
      ) : null}
    </>
  );
}
