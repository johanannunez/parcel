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
