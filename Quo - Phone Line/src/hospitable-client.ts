import "dotenv/config";
import type {
  HospitablePaginatedResponse,
  HospitableProperty,
  HospitableSingleResponse,
  Reservation,
} from "./hospitable-types.js";

const BASE_URL = "https://public.api.hospitable.com/v2";

// ─── Core fetch wrapper ──────────────────────────────────────────────────────────

async function hospFetch<T>(path: string, params?: URLSearchParams): Promise<T> {
  const token = process.env["HOSPITABLE_API_KEY"];
  if (!token) throw new Error("HOSPITABLE_API_KEY is not set in environment variables.");

  const url = params ? `${BASE_URL}${path}?${params.toString()}` : `${BASE_URL}${path}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Hospitable API error ${response.status} on ${path}: ${body}`);
  }

  return response.json() as Promise<T>;
}

// ─── Properties ──────────────────────────────────────────────────────────────────

export async function listProperties(): Promise<HospitableProperty[]> {
  const all: HospitableProperty[] = [];
  let page = 1;

  while (true) {
    const params = new URLSearchParams({ per_page: "50", page: String(page) });
    const res = await hospFetch<HospitablePaginatedResponse<HospitableProperty>>("/properties", params);
    all.push(...res.data);
    if (res.meta.current_page >= res.meta.last_page) break;
    page++;
  }

  return all;
}

// ─── Reservations ────────────────────────────────────────────────────────────────

export async function listActiveReservations(): Promise<Reservation[]> {
  const properties = await listProperties();
  const today = new Date();
  // Look back 90 days to catch long-stay guests (mid-stay won't appear in narrow windows),
  // and forward 2 days to catch arriving guests.
  const startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!;
  const endDate = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!;

  // Query each property individually so we can tag each reservation with its propertyId.
  // The API does not return propertyId in reservation objects when querying multiple properties.
  const results = await Promise.allSettled(
    properties.map(async (property): Promise<Reservation[]> => {
      const params = new URLSearchParams();
      params.append("properties[]", property.id);
      params.set("start_date", startDate);
      params.set("end_date", endDate);
      params.append("include[]", "guest");
      params.set("per_page", "50");

      const res = await hospFetch<HospitablePaginatedResponse<Reservation>>("/reservations", params);

      return res.data
        .filter((r) => r.status === "accepted" && new Date(r.departure_date) >= today)
        .map((r) => ({ ...r, propertyId: property.id }));
    })
  );

  const allReservations: Reservation[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allReservations.push(...result.value);
    } else {
      console.error("[hospitable] Failed to fetch reservations for a property:", result.reason);
    }
  }

  return allReservations;
}

// ─── Phone number matching ────────────────────────────────────────────────────────

/**
 * Normalize a phone number to its last 10 digits for comparison.
 * Handles formats: "+12188219987", "12188219987", "2188219987", "+1 218-821-9987", etc.
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // Take last 10 digits (strips country code)
  return digits.slice(-10);
}

/**
 * Find the active reservation for an inbound caller/texter.
 * Returns null if no matching active reservation is found.
 */
export async function findReservationByPhone(inboundPhone: string): Promise<Reservation | null> {
  const normalized = normalizePhone(inboundPhone);
  const reservations = await listActiveReservations();

  for (const reservation of reservations) {
    const guestPhones = reservation.guest?.phone_numbers ?? [];
    for (const guestPhone of guestPhones) {
      if (normalizePhone(guestPhone) === normalized) {
        return reservation;
      }
    }
  }

  return null;
}

// ─── Property lookup ──────────────────────────────────────────────────────────────

export async function getPropertyById(propertyId: string): Promise<HospitableProperty | null> {
  try {
    const res = await hospFetch<HospitableSingleResponse<HospitableProperty>>(`/properties/${propertyId}`);
    return res.data;
  } catch {
    return null;
  }
}
