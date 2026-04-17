import type { OwnerDetailData } from "@/lib/admin/owner-detail-types";
import styles from "./OverviewDormant.module.css";

/**
 * Dormant state of the Overview tab. Renders when the linked contact's
 * lifecycle_stage is paused | churned.
 *
 * Shows:
 *  - Relationship summary card (paused date, win-back hook)
 *  - Lifetime payouts tile
 *  - Properties over time tile
 */

export function OverviewDormant({ data }: { data: OwnerDetailData }) {
  const { pausedAt, lifetimePayouts, propertyCount } = data;

  const pausedLabel = pausedAt
    ? new Date(pausedAt).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
    : "recently";

  return (
    <div className={styles.page}>
      <section className={styles.heroCard}>
        <div className={styles.label}>Relationship</div>
        <div className={styles.title}>Paused {pausedLabel}</div>
        <p className={styles.body}>
          Consider a quarterly check-in. 41% of paused owners reactivate within
          6 months when they hear from their account manager first.
        </p>
      </section>

      <div className={styles.grid}>
        <section className={styles.tile}>
          <div className={styles.label}>Lifetime payouts</div>
          <div className={styles.big}>
            {lifetimePayouts != null
              ? `$${lifetimePayouts.toLocaleString()}`
              : "\u2014"}
          </div>
          <div className={styles.sub}>Net payout total</div>
        </section>

        <section className={styles.tile}>
          <div className={styles.label}>Properties over time</div>
          <div className={styles.big}>{propertyCount}</div>
          <div className={styles.sub}>
            {propertyCount === 1 ? "1 property" : `${propertyCount} properties`} linked
          </div>
        </section>
      </div>
    </div>
  );
}
