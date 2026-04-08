/**
 * Shared formatters used across the portal. Extracting these prevents
 * the same Intl objects from being constructed dozens of times per
 * render and gives every page consistent number, currency, and date
 * formatting out of the box.
 */

export const currency0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const currency2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const longDate = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const mediumDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const weekdayShortDate = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatLong(d: string | Date) {
  return longDate.format(typeof d === "string" ? new Date(d) : d);
}

export function formatMedium(d: string | Date) {
  return mediumDate.format(typeof d === "string" ? new Date(d) : d);
}

export function formatShort(d: string | Date) {
  return shortDate.format(typeof d === "string" ? new Date(d) : d);
}

export function formatWeekday(d: string | Date) {
  return weekdayShortDate.format(typeof d === "string" ? new Date(d) : d);
}

export function formatRelative(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  const diffMs = date.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const abs = Math.abs(diffSec);

  const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
  if (abs < 60) return rtf.format(diffSec, "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 604800) return rtf.format(Math.round(diffSec / 86400), "day");
  if (abs < 2629800) return rtf.format(Math.round(diffSec / 604800), "week");
  if (abs < 31557600) return rtf.format(Math.round(diffSec / 2629800), "month");
  return rtf.format(Math.round(diffSec / 31557600), "year");
}
