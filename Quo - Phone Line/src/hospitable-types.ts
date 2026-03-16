// ─── Guest ───────────────────────────────────────────────────────────────────────

export interface HospitableGuest {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone_numbers: string[]; // may lack leading "+", e.g. "12188219987" or "+12244562401"
  location: string | null;
  profile_picture: string | null;
  language: string | null;
}

// ─── Reservation ─────────────────────────────────────────────────────────────────

export type ReservationStatus = "accepted" | "declined" | "cancelled" | "pending" | "denied";

export interface ReservationStatusEntry {
  category: string;
  status: string;
  changed_at: string;
}

export interface Reservation {
  id: string;
  propertyId?: string; // injected by our client during fetch — not returned by the API
  code: string;
  platform: string;
  platform_id: string;
  booking_date: string;
  arrival_date: string; // ISO with tz offset
  departure_date: string;
  check_in: string;
  check_out: string;
  nights: number;
  stay_type: "guest_stay" | "owner_stay" | "blocked";
  status: ReservationStatus;
  conversation_id: string;
  notes: string | null;
  guests: {
    total: number;
    adult_count: number;
    child_count: number;
    infant_count: number;
    pet_count: number;
  };
  guest: HospitableGuest;
  status_history: ReservationStatusEntry[];
}

// ─── Property ────────────────────────────────────────────────────────────────────

export interface PropertyAddress {
  number?: string;
  street: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  display: string;
  coordinates?: { latitude: string; longitude: string };
}

export interface HospitableProperty {
  id: string;
  name: string;
  public_name: string;
  address: PropertyAddress;
  timezone: string;
  currency: string;
  listed: boolean;
}

// ─── API Responses ────────────────────────────────────────────────────────────────

export interface HospitablePaginatedResponse<T> {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface HospitableSingleResponse<T> {
  data: T;
}
