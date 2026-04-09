export type PeriodKey = "month" | "last" | "90d" | "ytd";

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  month: "This month",
  last: "Last month",
  "90d": "Last 90 days",
  ytd: "Year to date",
};

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
  }
}

/** Validate and parse the period search param. Defaults to "month". */
export function parsePeriod(raw: string | undefined | null): PeriodKey {
  if (raw === "last" || raw === "90d" || raw === "ytd") return raw;
  return "month";
}
