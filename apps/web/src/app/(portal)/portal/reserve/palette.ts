export type PaletteEntry = {
  bg: string;
  fg: string;
  solid: string;
};

// ---------------------------------------------------------------------------
// Platform brand colors (used for booking bars)
// ---------------------------------------------------------------------------

export const PLATFORM_COLORS: Record<string, PaletteEntry> = {
  airbnb: {
    bg: "rgba(255, 90, 95, 0.12)",
    fg: "#c4254b",
    solid: "#FF5A5F",
  },
  vrbo: {
    bg: "rgba(36, 116, 222, 0.12)",
    fg: "#1a5bb5",
    solid: "#2474DE",
  },
  booking_com: {
    bg: "rgba(0, 59, 149, 0.12)",
    fg: "#003B95",
    solid: "#003B95",
  },
  hospitable: {
    bg: "rgba(215, 90, 123, 0.12)",
    fg: "#b0405e",
    solid: "#D75A7B",
  },
  furnished_finder: {
    bg: "rgba(0, 180, 162, 0.12)",
    fg: "#008f7e",
    solid: "#00B4A2",
  },
  direct: {
    bg: "rgba(2, 170, 235, 0.12)",
    fg: "#0c6fae",
    solid: "#02AAEB",
  },
  other: {
    bg: "rgba(118, 113, 112, 0.10)",
    fg: "#4b4948",
    solid: "#767170",
  },
};

export function platformColor(source: string | null | undefined): PaletteEntry {
  if (!source) return PLATFORM_COLORS.other;
  return PLATFORM_COLORS[source] ?? PLATFORM_COLORS.other;
}

// ---------------------------------------------------------------------------
// Platform SVG logo paths (14x14 viewBox)
// Each returns a minimal inline SVG string for the booking bar icon.
// ---------------------------------------------------------------------------

export const PLATFORM_LABELS: Record<string, string> = {
  airbnb: "Airbnb",
  vrbo: "VRBO",
  booking_com: "Booking.com",
  hospitable: "Hospitable",
  furnished_finder: "Furnished Finder",
  direct: "Direct",
  other: "Other",
};

// ---------------------------------------------------------------------------
// Legacy property-index palette (kept for block requests which are
// not platform-associated)
// ---------------------------------------------------------------------------

export const PALETTE: PaletteEntry[] = [
  { bg: "rgba(2, 170, 235, 0.14)", fg: "#0c6fae", solid: "#02aaeb" },
  { bg: "rgba(22, 163, 74, 0.14)", fg: "#15803d", solid: "#16a34a" },
  { bg: "rgba(245, 158, 11, 0.16)", fg: "#b45309", solid: "#f59e0b" },
  { bg: "rgba(168, 85, 247, 0.14)", fg: "#6d28d9", solid: "#a855f7" },
  { bg: "rgba(244, 63, 94, 0.14)", fg: "#be123c", solid: "#f43f5e" },
  { bg: "rgba(6, 182, 212, 0.14)", fg: "#0e7490", solid: "#06b6d4" },
];

export function colorFor(index: number): PaletteEntry {
  return PALETTE[index % PALETTE.length];
}
