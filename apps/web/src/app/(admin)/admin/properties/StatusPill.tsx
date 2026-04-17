import { ArrowRight, CircleNotch, Moon } from "@phosphor-icons/react/dist/ssr";
import styles from "./StatusPill.module.css";
import type { OccupancyStatus } from "./homes-types";

type Variant = "row" | "card";

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysFromToday(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function StatusPill({
  status,
  variant = "card",
}: {
  status: OccupancyStatus;
  variant?: Variant;
}) {
  if (status.kind === "occupied") {
    const days = daysFromToday(status.checkOut);
    const suffix =
      days <= 0
        ? "Checking out today"
        : days === 1
          ? "Checks out tomorrow"
          : `Checks out ${formatShortDate(status.checkOut)}`;
    return (
      <span className={`${styles.pill} ${styles.occupied} ${styles[variant]}`}>
        <CircleNotch size={10} weight="fill" className={styles.dot} />
        <span className={styles.label}>Occupied</span>
        <span className={styles.separator} aria-hidden>
          ·
        </span>
        <span className={styles.meta}>{suffix}</span>
      </span>
    );
  }

  if (status.kind === "upcoming") {
    const days = daysFromToday(status.checkIn);
    const dateLabel =
      days === 0 ? "Today" : days === 1 ? "Tomorrow" : formatShortDate(status.checkIn);
    const nightsText = status.nights
      ? ` · ${status.nights} night${status.nights === 1 ? "" : "s"}`
      : "";
    return (
      <span className={`${styles.pill} ${styles.upcoming} ${styles[variant]}`}>
        <ArrowRight size={10} weight="bold" className={styles.arrow} />
        <span className={styles.label}>Vacant</span>
        <span className={styles.separator} aria-hidden>
          ·
        </span>
        <span className={styles.meta}>
          {dateLabel}
          {nightsText}
        </span>
      </span>
    );
  }

  return (
    <span className={`${styles.pill} ${styles.vacant} ${styles[variant]}`}>
      <Moon size={10} weight="fill" className={styles.dot} />
      <span className={styles.label}>Vacant</span>
      <span className={styles.separator} aria-hidden>
        ·
      </span>
      <span className={styles.meta}>No upcoming bookings</span>
    </span>
  );
}
