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
