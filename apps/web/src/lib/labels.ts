/**
 * Shared display labels for enum-style fields. Keeping these in one
 * place means every page renders the same human-friendly text and
 * adding a new value (e.g. a new booking source) is a one-line edit.
 */

export const propertyTypeLabels: Record<string, string> = {
  str: "Short term",
  ltr: "Long term",
  arbitrage: "Arbitrage",
  mtr: "Mid term",
  "co-hosting": "Co-hosting",
};

export const propertyTypeLongLabels: Record<string, string> = {
  str: "Short term rental",
  ltr: "Long term rental",
  arbitrage: "Arbitrage",
  mtr: "Mid term rental",
  "co-hosting": "Co-hosting",
};

/**
 * Physical building type. Distinct from propertyType (which is the rental
 * business model). Ordered by expected frequency in the portfolio so the
 * dropdown feels natural: most common types at the top.
 */
export const homeTypeLabels: Record<string, string> = {
  single_family: "Single-family home",
  apartment: "Apartment",
  condo: "Condominium",
  townhouse: "Townhouse",
  duplex: "Duplex",
  multi_family: "Multi-family home",
  adu: "ADU",
  studio: "Studio",
  loft: "Loft",
  cabin: "Cabin",
  tiny_home: "Tiny home",
  mobile_home: "Mobile home",
  other: "Other",
};

/** Ordered list of home_type slugs for building form dropdowns. */
export const homeTypeOptions: Array<{ value: string; label: string }> =
  Object.entries(homeTypeLabels).map(([value, label]) => ({ value, label }));

/**
 * Maps Hospitable's `property_type` enum (which mirrors Airbnb's taxonomy)
 * onto Parcel's `home_type` enum. Used by the reconciliation layer to
 * detect when a Parcel row and a Hospitable listing describe the same
 * building with different labels.
 *
 * Hospitable / Airbnb do NOT have concepts for duplex, multi-family, or
 * ADU, so those Parcel types have no inbound match. In the reconciler a
 * missing mapping is treated as "semantically different taxonomies" and
 * surfaced as a warning rather than a hard mismatch.
 */
export const HOSPITABLE_TYPE_TO_HOME_TYPE: Record<string, string> = {
  house: "single_family",
  apartment: "apartment",
  condominium: "condo",
  condo: "condo",
  townhouse: "townhouse",
  townhome: "townhouse",
  cabin: "cabin",
  loft: "loft",
  studio: "studio",
  tiny_home: "tiny_home",
  tiny_house: "tiny_home",
  mobile_home: "mobile_home",
  bungalow: "single_family",
  cottage: "single_family",
  villa: "single_family",
  other: "other",
};

export const bookingSourceLabels: Record<string, string> = {
  direct: "Direct",
  airbnb: "Airbnb",
  vrbo: "Vrbo",
  booking_com: "Booking.com",
  furnished_finder: "Furnished Finder",
  hospitable: "Hospitable",
  other: "Other",
};

export const bookingStatusLabels: Record<string, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  cancelled: "Cancelled",
};
