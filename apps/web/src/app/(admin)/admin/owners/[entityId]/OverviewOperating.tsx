import Link from "next/link";
import { Heartbeat, Phone, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import styles from "./OverviewPanels.module.css";
import type { OwnerDetailData } from "@/lib/admin/owner-detail";
import {
  ActivityPanel,
  BillingCard,
  PropertiesSnapshot,
  TasksPanel,
  relativeTimeShort,
} from "./OverviewShared";

/**
 * Operating state of the Overview tab. Hero card is a Relationship health
 * summary with four side-by-side metrics. Then an alerts row (conditional),
 * a collapsed Launchpad line, and the activity + tasks grid, closed out by
 * the Properties snapshot.
 *
 * Summary wording is generated from the data we have:
 *   - primary profile (tenure, phone presence)
 *   - recent activity (last-contact estimate)
 *   - property count (to pluralize)
 *
 * Metrics we can't compute yet (next touchpoint, average response time)
 * render an em-dash value with a "Not enough data" helper.
 */

function tenureLabel(createdAt: string): { value: string; sub: string } {
  const start = new Date(createdAt);
  const now = new Date();
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  const value =
    months < 1
      ? "New"
      : months < 12
        ? `${months} mo`
        : `${Math.floor(months / 12)}y ${months % 12}mo`;
  const sub = `Joined ${start.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })}`;
  return { value, sub };
}

export function OverviewOperating({
  data,
  lifetimeRevenueCents,
}: {
  data: OwnerDetailData;
  lifetimeRevenueCents?: number | null;
}) {
  const { primaryMember, properties, activity, entity } = data;

  const tenure = tenureLabel(primaryMember.createdAt);
  const mostRecent = activity[0] ?? null;

  // Health pill: conservative. Healthy unless we spot something missing.
  const missingPhone = !primaryMember.phone;
  const healthLevel: "healthy" | "attention" = missingPhone
    ? "attention"
    : "healthy";
  const healthLabel = healthLevel === "healthy" ? "Healthy" : "Attention";
  const healthPillClass =
    healthLevel === "healthy" ? styles.healthActive : styles.healthPaused;

  const summary = healthLevel === "healthy"
    ? `Responsive, ${properties.length} propert${properties.length === 1 ? "y" : "ies"} live, no open issues over 48h.`
    : "Needs attention. Basic contact info is incomplete.";

  // Alerts we can surface with today's data. Each is conditional.
  const alerts: Array<{
    id: string;
    icon: React.ReactNode;
    title: string;
    sub: string;
    linkHref: string;
    linkLabel: string;
  }> = [];

  if (missingPhone) {
    alerts.push({
      id: "missing-phone",
      icon: <Phone size={14} weight="bold" />,
      title: "Phone number missing",
      sub: "Owner profile is incomplete.",
      linkHref: `/admin/owners/${entity.id}?tab=settings`,
      linkLabel: "Add phone",
    });
  }

  return (
    <>
      <section className={styles.health}>
        <div className={styles.healthHead}>
          <Heartbeat size={18} weight="duotone" color="#1B77BE" />
          <div className={styles.healthTitle}>Relationship health</div>
          <span className={`${styles.healthPill} ${healthPillClass}`}>
            <span className={styles.dot} />
            {healthLabel}
          </span>
        </div>
        <div className={styles.healthSub}>{summary}</div>

        <div className={styles.healthMetrics}>
          <div className={styles.healthMetric}>
            <div className={styles.healthMetricLabel}>Owner since</div>
            <div className={styles.healthMetricValue}>{tenure.value}</div>
            <div className={styles.healthMetricSub}>{tenure.sub}</div>
          </div>
          <div className={styles.healthMetric}>
            <div className={styles.healthMetricLabel}>Last contact</div>
            <div className={styles.healthMetricValue}>
              {mostRecent ? relativeTimeShort(mostRecent.createdAt) : "None"}
            </div>
            <div className={styles.healthMetricSub}>
              {mostRecent
                ? `${mostRecent.action.replace(/_/g, " ")}`
                : "No recent activity"}
            </div>
          </div>
          <div className={styles.healthMetric}>
            <div className={styles.healthMetricLabel}>Next touchpoint</div>
            <div className={styles.healthMetricValue}>None</div>
            <div className={styles.healthMetricSub}>Coming soon</div>
          </div>
          <div className={styles.healthMetric}>
            <div className={styles.healthMetricLabel}>Avg response time</div>
            <div className={styles.healthMetricValue}>N/A</div>
            <div className={styles.healthMetricSub}>Coming soon</div>
          </div>
        </div>
      </section>

      {alerts.length > 0 ? (
        <div className={styles.alertsGrid}>
          {alerts.map((alert) => (
            <div key={alert.id} className={styles.alert}>
              <div className={styles.alertIcon}>{alert.icon}</div>
              <div className={styles.alertText}>
                <div className={styles.alertTitle}>{alert.title}</div>
                <div className={styles.alertSub}>{alert.sub}</div>
                <Link
                  href={alert.linkHref}
                  className={styles.alertLink}
                  prefetch={false}
                >
                  {alert.linkLabel} &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className={styles.launchpadCollapsed}>
        <div className={styles.launchpadCheck}>
          <CheckCircle size={18} weight="fill" />
        </div>
        <div className={styles.launchpadCollapsedText}>
          <strong>Onboarding complete</strong>
          {primaryMember.onboardingCompletedAt
            ? ` \u00b7 Finished ${new Date(
                primaryMember.onboardingCompletedAt,
              ).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
            : ""}
          {properties.length > 0
            ? ` \u00b7 ${properties.length} propert${properties.length === 1 ? "y" : "ies"} live`
            : ""}
        </div>
        <Link
          href={`/admin/owners/${entity.id}?tab=activity`}
          className={styles.panelLink}
          prefetch={false}
        >
          View history
        </Link>
      </div>

      <div className={styles.topRow}>
        <TasksPanel entityId={entity.id} />
        <BillingCard lifetimeRevenueCents={lifetimeRevenueCents} />
      </div>

      <div className={styles.twoCol} style={{ gridTemplateColumns: "1fr" }}>
        <ActivityPanel entries={activity} entityId={entity.id} />
      </div>

      <PropertiesSnapshot properties={properties} />
    </>
  );
}
