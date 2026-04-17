import Link from "next/link";
import styles from "./OverviewPanels.module.css";
import type { OwnerDetailData } from "@/lib/admin/owner-detail";
import {
  ActivityPanel,
  PropertiesSnapshot,
  TasksPanel,
  gradientFor,
} from "./OverviewShared";

/**
 * Onboarding state of the Overview tab. Launchpad hero panel at the top,
 * followed by the two-column activity + tasks grid and the properties
 * snapshot.
 *
 * We don't have real per-property Launchpad data yet (the tasks aren't
 * modelled in a single table), so per-property stats show placeholder
 * "0/X" counts and "Not started" status. The hero rollup numbers are
 * computed from the placeholder per-property data so the math lines up.
 */

// Placeholder phase totals until the Launchpad tasks land.
const PHASE_TOTALS = {
  Documents: 8,
  Finances: 10,
  Listings: 14,
};

export function OverviewOnboarding({ data }: { data: OwnerDetailData }) {
  const { properties, entity } = data;

  // Placeholder: 0 complete per property. The layout handles non-zero
  // gracefully so this just starts showing real progress once we wire
  // Launchpad data in.
  const propertiesWithProgress = properties.map((p) => ({
    property: p,
    phases: {
      Documents: { completed: 0, total: PHASE_TOTALS.Documents, status: "Not started" as const },
      Finances: { completed: 0, total: PHASE_TOTALS.Finances, status: "Not started" as const },
      Listings: { completed: 0, total: PHASE_TOTALS.Listings, status: "Not started" as const },
    },
    completed: 0,
    total:
      PHASE_TOTALS.Documents + PHASE_TOTALS.Finances + PHASE_TOTALS.Listings,
  }));

  const aggregateTotal = propertiesWithProgress.reduce(
    (sum, x) => sum + x.total,
    0,
  );
  const aggregateDone = propertiesWithProgress.reduce(
    (sum, x) => sum + x.completed,
    0,
  );
  const pct =
    aggregateTotal === 0
      ? 0
      : Math.round((aggregateDone / aggregateTotal) * 100);

  return (
    <>
      <section className={styles.launchpad}>
        <header className={styles.launchpadHead}>
          <div className={styles.launchpadHeadLeft}>
            <div className={styles.launchpadHeadTitle}>Onboarding progress</div>
            <span className={`${styles.healthPill} ${styles.healthDraft}`}>
              <span className={styles.dot} />
              On track
            </span>
          </div>
          <Link
            href="/admin/properties?view=launchpad"
            className={styles.panelLink}
            prefetch={false}
          >
            Open full launchpad &rarr;
          </Link>
        </header>

        <div className={styles.launchpadBody}>
          <div className={styles.headline}>
            <div className={styles.headlinePct}>{pct}%</div>
            <div className={styles.headlineText}>
              {aggregateDone} of {aggregateTotal} tasks complete across{" "}
              {properties.length} propert
              {properties.length === 1 ? "y" : "ies"}
            </div>
          </div>

          <div className={styles.segBar} aria-hidden>
            <span className={styles.segDone} style={{ flex: aggregateDone }} />
            <span
              className={styles.segIdle}
              style={{ flex: Math.max(1, aggregateTotal - aggregateDone) }}
            />
          </div>

          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span
                className={styles.legendDot}
                style={{ background: "#12824A" }}
              />
              {aggregateDone} completed
            </span>
            <span className={styles.legendItem}>
              <span
                className={styles.legendDot}
                style={{ background: "#B45309" }}
              />
              0 in progress
            </span>
            <span className={styles.legendItem}>
              <span
                className={styles.legendDot}
                style={{ background: "#B3261E" }}
              />
              0 stuck
            </span>
            <span className={styles.legendItem}>
              <span
                className={styles.legendDot}
                style={{ background: "#8A9AAB" }}
              />
              {aggregateTotal - aggregateDone} not started
            </span>
          </div>

          {properties.length === 0 ? (
            <div
              className={styles.emptyBlock}
              style={{ marginTop: 16, padding: "20px 16px" }}
            >
              No properties yet. Once this owner adds their first property,
              their launchpad will show up here.
            </div>
          ) : (
            <div className={styles.launchpadList}>
              {propertiesWithProgress.map(
                ({ property: p, phases, completed, total }) => {
                  const propPct = total === 0 ? 0 : Math.round((completed / total) * 100);
                  const subParts: string[] = [];
                  if (p.city)
                    subParts.push(`${p.city}${p.state ? `, ${p.state}` : ""}`);
                  if (p.bedrooms)
                    subParts.push(
                      `${p.bedrooms} bed${p.bedrooms === 1 ? "" : ""}`,
                    );
                  if (p.bathrooms)
                    subParts.push(
                      `${p.bathrooms} bath${p.bathrooms === 1 ? "" : ""}`,
                    );
                  return (
                    <div key={p.id} className={styles.propRow}>
                      <div className={styles.propRowHead}>
                        <div
                          className={styles.propThumb}
                          style={{ background: gradientFor(p.id) }}
                        />
                        <div className={styles.propText}>
                          <div className={styles.propAddr}>{p.label}</div>
                          {subParts.length > 0 ? (
                            <div className={styles.propSub}>
                              {subParts.join(" \u00b7 ")}
                            </div>
                          ) : null}
                        </div>
                        <div className={styles.propFrac}>
                          {propPct}% &middot; {completed}/{total}
                        </div>
                        <Link
                          href={`/admin/properties/${p.id}`}
                          className={styles.propLink}
                          prefetch={false}
                        >
                          View &rarr;
                        </Link>
                      </div>
                      <div className={styles.phaseGrid}>
                        {(["Documents", "Finances", "Listings"] as const).map(
                          (phaseName) => {
                            const phase = phases[phaseName];
                            const phasePct =
                              phase.total === 0
                                ? 0
                                : Math.round(
                                    (phase.completed / phase.total) * 100,
                                  );
                            return (
                              <div
                                key={phaseName}
                                className={styles.phaseCard}
                              >
                                <div className={styles.phaseHead}>
                                  <div className={styles.phaseName}>
                                    {phaseName}
                                  </div>
                                  <div className={styles.phaseFrac}>
                                    {phase.completed}/{phase.total}
                                  </div>
                                </div>
                                <div className={styles.phaseBar}>
                                  <div
                                    className={styles.phaseFill}
                                    style={{ width: `${phasePct}%` }}
                                  />
                                </div>
                                <div className={styles.phaseStatus}>
                                  {phase.status}
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </div>
      </section>

      <div className={styles.twoCol}>
        <ActivityPanel entries={data.activity} entityId={entity.id} />
        <TasksPanel entityId={entity.id} />
      </div>

      <PropertiesSnapshot properties={properties} />
    </>
  );
}
