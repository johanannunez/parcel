/**
 * Pure utility functions for the dashboard revenue chart.
 * Keeps chart math testable and the component focused on rendering.
 */

export type MonthlyRevenue = {
  /** 0-indexed month (0 = January) */
  month: number;
  /** Short label: "Jan", "Feb", etc. */
  label: string;
  /** Revenue in dollars */
  revenue: number;
};

export type ComparisonRevenue = {
  /** 1-indexed month being compared */
  month: number;
  /** Short label for the month */
  label: string;
  /** Revenue per year: { 2025: 1200, 2026: 1800 } */
  byYear: Record<number, number>;
};

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Group bookings into monthly revenue totals.
 * Expects bookings with check_in (ISO string) and total_amount.
 */
export function groupByMonth(
  bookings: { check_in: string; total_amount: number | null }[],
): MonthlyRevenue[] {
  const buckets = new Array(12).fill(0) as number[];

  for (const b of bookings) {
    const m = new Date(b.check_in).getMonth();
    buckets[m] += Number(b.total_amount ?? 0);
  }

  return buckets.map((revenue, i) => ({
    month: i,
    label: SHORT_MONTHS[i],
    revenue: Math.round(revenue * 100) / 100,
  }));
}

/**
 * Build comparison data for a single month across multiple years.
 * Each entry in the map is year -> array of bookings for that year+month.
 */
export function buildComparisonData(
  bookingsByYear: Record<number, { check_in: string; total_amount: number | null }[]>,
  month: number,
): ComparisonRevenue {
  const byYear: Record<number, number> = {};

  for (const [year, bookings] of Object.entries(bookingsByYear)) {
    const total = bookings.reduce(
      (sum, b) => sum + Number(b.total_amount ?? 0),
      0,
    );
    byYear[Number(year)] = Math.round(total * 100) / 100;
  }

  return {
    month,
    label: SHORT_MONTHS[month - 1],
    byYear,
  };
}

/**
 * Compute Y-axis tick values for the chart.
 * Returns 4-5 evenly spaced round numbers from 0 to a nice ceiling.
 */
export function computeYTicks(maxValue: number): number[] {
  if (maxValue <= 0) return [0];

  // Find a nice round step
  const rawStep = maxValue / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;

  let step: number;
  if (normalized <= 1) step = magnitude;
  else if (normalized <= 2) step = 2 * magnitude;
  else if (normalized <= 5) step = 5 * magnitude;
  else step = 10 * magnitude;

  const ticks: number[] = [];
  for (let v = 0; v <= maxValue + step * 0.1; v += step) {
    ticks.push(Math.round(v));
  }
  return ticks;
}

/**
 * Format a dollar amount for chart axis labels.
 * Abbreviates: $1,200 -> "$1.2K", $15,000 -> "$15K", $120,000 -> "$120K"
 */
export function formatChartCurrency(value: number): string {
  if (value === 0) return "$0";
  if (value >= 1000) {
    const k = value / 1000;
    return k % 1 === 0 ? `$${k}K` : `$${k.toFixed(1)}K`;
  }
  return `$${Math.round(value)}`;
}

/** Colors for comparison years (oldest to newest). */
export const YEAR_COLORS = [
  "var(--color-warm-gray-400)", // oldest year: muted
  "var(--color-brand)",         // middle/primary: brand blue
  "var(--color-brand-light)",   // newest year: bright blue
] as const;
