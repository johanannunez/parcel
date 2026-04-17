export type OwnerSummary = {
  id: string;
  name: string | null;
  shortName: string | null;
  email: string | null;
};

export type BookingSummary = {
  id: string;
  checkIn: string;
  checkOut: string;
  guestName: string | null;
  nights: number | null;
  status: string | null;
};

export type HomesProperty = {
  id: string;
  nickname: string | null;
  street: string;
  unit: string | null;
  city: string;
  state: string;
  postalCode: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  halfBathrooms: number | null;
  guestCapacity: number | null;
  homeType: string | null;
  parkingSpaces: number | null;
  squareFeet: number | null;
  coverPhotoUrl: string | null;
  owners: OwnerSummary[];
  bookings: BookingSummary[];
};

export type HomesMode = "gallery" | "table";

export type OccupancyStatus =
  | { kind: "occupied"; checkOut: string; guestName: string | null }
  | { kind: "upcoming"; checkIn: string; nights: number | null; guestName: string | null }
  | { kind: "vacant" };

export function resolveOccupancy(bookings: BookingSummary[]): OccupancyStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  for (const b of bookings) {
    const inMs = new Date(b.checkIn).getTime();
    const outMs = new Date(b.checkOut).getTime();
    if (inMs <= todayMs && outMs > todayMs) {
      return { kind: "occupied", checkOut: b.checkOut, guestName: b.guestName };
    }
  }
  const next = bookings.find((b) => new Date(b.checkIn).getTime() > todayMs);
  if (next) {
    return {
      kind: "upcoming",
      checkIn: next.checkIn,
      nights: next.nights,
      guestName: next.guestName,
    };
  }
  return { kind: "vacant" };
}
