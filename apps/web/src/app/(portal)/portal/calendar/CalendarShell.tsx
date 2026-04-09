"use client";

import { useCallback, useMemo, useState } from "react";
import { CalendarToolbar, type CalendarView } from "./CalendarToolbar";
import { AvailabilityGrid } from "./AvailabilityGrid";
import { MonthGrid } from "./MonthGrid";
import { BookingDetailModal, type Booking } from "./BookingDetailModal";
import { CalendarSyncModal } from "./CalendarSyncModal";
import { BlockRequestWizard } from "./BlockRequestWizard";
import type { BlockRequest } from "./BlockBar";

type Property = {
  id: string;
  name: string;
  address: string;
  bedrooms: number | null;
};
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
  ownerName,
  ownerEmail,
}: {
  year: number;
  month: number;
  properties: Property[];
  bookings: Booking[];
  blockRequests: BlockRequest[];
  pastRequests: PastRequest[];
  icalUrl: string | null;
  ownerName: string;
  ownerEmail: string;
}) {
  const [view, setView] = useState<CalendarView>("timeline");
  const [hiddenProperties, setHiddenProperties] = useState<Set<string>>(
    new Set(),
  );
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
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

  // Toolbar needs {id, name} shape
  const toolbarProperties = useMemo(
    () => properties.map((p) => ({ id: p.id, name: p.name })),
    [properties],
  );

  return (
    <>
      <div className="flex h-[calc(100dvh-240px)] min-h-[340px] flex-col gap-4">
        <CalendarToolbar
          year={year}
          month={month}
          properties={toolbarProperties}
          hiddenProperties={hiddenProperties}
          onToggleProperty={onToggleProperty}
          onOpenSync={() => setSyncModalOpen(true)}
          onOpenBlock={() => setBlockModalOpen(true)}
          view={view}
          onChangeView={setView}
          activePropertyId={activePropertyId}
          onChangeActiveProperty={setActivePropertyId}
        />

        <div className="flex-1 min-h-0">
          {view === "timeline" ? (
            <AvailabilityGrid
              year={year}
              month={month}
              properties={visibleProperties}
              bookings={filteredBookings}
              blockRequests={filteredBlocks}
              onSelectBooking={setSelectedBooking}
            />
          ) : (
            <MonthGrid
              year={year}
              month={month}
              properties={toolbarProperties}
              bookings={filteredBookings}
              blockRequests={filteredBlocks}
              activePropertyId={
                properties.length > 1
                  ? activePropertyId ?? properties[0]?.id ?? null
                  : null
              }
              onSelectBooking={setSelectedBooking}
            />
          )}
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
        <BlockRequestWizard
          properties={properties}
          ownerName={ownerName}
          ownerEmail={ownerEmail}
          onClose={() => setBlockModalOpen(false)}
        />
      ) : null}
    </>
  );
}
