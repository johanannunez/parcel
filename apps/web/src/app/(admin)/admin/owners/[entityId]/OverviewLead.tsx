import type { OwnerDetailData } from "@/lib/admin/owner-detail-types";
import Link from "next/link";
import styles from "./OverviewLead.module.css";

/**
 * Lead state of the Overview tab. Renders when the linked contact's
 * lifecycle_stage is lead_new | qualified | in_discussion | contract_sent.
 *
 * Shows:
 *  - Opportunity tile (estimated MRR, property count)
 *  - Source tile
 *  - Stage age tile
 *  - Next action hint (links to Tasks tab once Plan B ships)
 *  - Potential properties
 */

export function OverviewLead({ data }: { data: OwnerDetailData }) {
  const { estimatedMrr, source, sourceDetail, stageChangedAt, propertyCount } = data;

  const stageDays = stageChangedAt
    ? Math.max(1, Math.floor((Date.now() - new Date(stageChangedAt).getTime()) / 86_400_000))
    : null;

  return (
    <div className={styles.page}>
      <div className={styles.heroGrid}>
        <section className={`${styles.tile} ${styles.opportunity}`}>
          <div className={styles.label}>Opportunity</div>
          <div className={styles.bigValue}>
            {estimatedMrr ? `$${estimatedMrr.toLocaleString()} /mo` : "Not sized"}
          </div>
          <div className={styles.sub}>
            {propertyCount > 0
              ? `Estimated across ${propertyCount} ${propertyCount === 1 ? "home" : "homes"}`
              : "No properties yet"}
          </div>
        </section>

        <section className={styles.tile}>
          <div className={styles.label}>Source</div>
          <div className={styles.midValue}>{source ?? "\u2014"}</div>
          {sourceDetail ? <div className={styles.sub}>{sourceDetail}</div> : null}
        </section>

        <section className={styles.tile}>
          <div className={styles.label}>Stage age</div>
          <div className={styles.midValue}>
            {stageDays ? `${stageDays} day${stageDays === 1 ? "" : "s"}` : "\u2014"}
          </div>
          <div className={styles.sub}>In current stage</div>
        </section>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionHead}>Next action</h2>
        <p className={styles.sectionBody}>
          The top open task for this contact will show here once the Tasks tab
          is wired in. Click into Tasks to see all open items.
        </p>
        <Link href="?tab=tasks" className={styles.cta}>
          Open tasks &rarr;
        </Link>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHead}>Potential properties</h2>
        {propertyCount === 0 ? (
          <p className={styles.sectionBody}>No properties linked yet.</p>
        ) : (
          <p className={styles.sectionBody}>
            {propertyCount} {propertyCount === 1 ? "property" : "properties"}{" "}
            linked. See the Properties tab for details.
          </p>
        )}
        <Link href="?tab=properties" className={styles.cta}>
          View properties &rarr;
        </Link>
      </section>
    </div>
  );
}
