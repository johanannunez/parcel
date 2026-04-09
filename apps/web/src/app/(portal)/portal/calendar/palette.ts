export type PaletteEntry = {
  bg: string;
  fg: string;
  solid: string;
};

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
