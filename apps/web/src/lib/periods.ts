export type PeriodKey = "month" | "last" | "90d" | "ytd" | "year" | "compare";

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  month: "This month",
  last: "Last month",
  "90d": "Last 90 days",
  ytd: "Year to date",
  year: "Full year",
  compare: "Compare",
};

/** The 4 "quick" period keys shown as the main pill row. */
export const QUICK_KEYS: PeriodKey[] = ["month", "last", "90d", "ytd"];

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

export const MONTH_LABELS = MONTH_NAMES;

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/**
 * Returns the ISO date range [start, end] for the given period key
 * relative to the given "today" date.
 */
export function periodRange(
  key: PeriodKey,
  today: Date = new Date(),
  opts?: { year?: number },
): { start: string; end: string; label: string } {
  const y = today.getFullYear();
  const m = today.getMonth();

  switch (key) {
    case "month":
      return {
        start: isoDate(new Date(y, m, 1)),
        end: isoDate(today),
        label: today.toLocaleString("en-US", { month: "long", year: "numeric" }),
      };
    case "last": {
      const lastMonth = new Date(y, m - 1, 1);
      const lastDay = new Date(y, m, 0);
      return {
        start: isoDate(lastMonth),
        end: isoDate(lastDay),
        label: lastMonth.toLocaleString("en-US", {
          month: "long",
          year: "numeric",
        }),
      };
    }
    case "90d":
      return {
        start: isoDate(new Date(today.getTime() - 90 * 86400000)),
        end: isoDate(today),
        label: "Last 90 days",
      };
    case "ytd":
      return {
        start: `${y}-01-01`,
        end: isoDate(today),
        label: `${y} year to date`,
      };
    case "year": {
      const selectedYear = opts?.year ?? y;
      return {
        start: `${selectedYear}-01-01`,
        end: `${selectedYear}-12-31`,
        label: String(selectedYear),
      };
    }
    case "compare":
      // Compare mode does not use a single range; each year is queried
      // individually. Return a placeholder so callers that need a range
      // can fall back safely.
      return { start: "", end: "", label: "Compare" };
  }
}

// ---------------------------------------------------------------------------
// Dashboard params — discriminated union for all period modes
// ---------------------------------------------------------------------------

export type DashboardParams =
  | { mode: "standard"; period: "month" | "last" | "90d" | "ytd" }
  | { mode: "year"; year: number; month: number | null }
  | { mode: "compare"; month: number; years: number[] };

/**
 * Parse the full set of dashboard search params into a typed
 * discriminated union. Falls back to standard "month" on any
 * invalid input.
 */
export function parseDashboardParams(
  raw: Record<string, string | string[] | undefined>,
): DashboardParams {
  const period = typeof raw.period === "string" ? raw.period : "";

  if (period === "year") {
    const y = Number(typeof raw.y === "string" ? raw.y : "");
    if (y >= 2020 && y <= 2099) {
      const monthRaw = typeof raw.month === "string" ? Number(raw.month) : NaN;
      const month = monthRaw >= 1 && monthRaw <= 12 ? monthRaw : null;
      return { mode: "year", year: y, month };
    }
    return { mode: "standard", period: "ytd" };
  }

  if (period === "compare") {
    const monthRaw = typeof raw.month === "string" ? Number(raw.month) : NaN;
    const month = monthRaw >= 1 && monthRaw <= 12
      ? monthRaw
      : new Date().getMonth() + 1;

    const yearsRaw = typeof raw.years === "string" ? raw.years : "";
    const years = yearsRaw
      .split(",")
      .map(Number)
      .filter((n) => n >= 2020 && n <= 2099)
      .slice(0, 3);

    if (years.length < 2) {
      // Not enough years to compare; fall back to current month
      return { mode: "standard", period: "month" };
    }

    return { mode: "compare", month, years: years.sort((a, b) => a - b) };
  }

  if (period === "last" || period === "90d" || period === "ytd") {
    return { mode: "standard", period };
  }

  return { mode: "standard", period: "month" };
}
