import Link from "next/link";
import { ClockCounterClockwise, Checks, CurrencyDollar } from "@phosphor-icons/react/dist/ssr";
import styles from "./OverviewPanels.module.css";
import type {
  OwnerDetailActivityEntry,
  OwnerDetailProperty,
} from "@/lib/admin/owner-detail";

const GRADIENTS = [
  "linear-gradient(135deg, #02AAEB, #1B77BE)",
  "linear-gradient(135deg, #8A9AAB, #3C5266)",
  "linear-gradient(135deg, #F59E0B, #B45309)",
  "linear-gradient(135deg, #10B981, #047857)",
  "linear-gradient(135deg, #8B5CF6, #6D28D9)",
  "linear-gradient(135deg, #EF4444, #B91C1C)",
];

export function gradientFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return GRADIENTS[h % GRADIENTS.length];
}

export function relativeTimeShort(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(months / 12)}y`;
}

function formatActionText(entry: OwnerDetailActivityEntry): string {
  const actor = entry.actorName ?? "Someone";
  const verb = entry.action.replace(/_/g, " ");
  return `${actor} ${verb}`;
}

export function ActivityPanel({
  entries,
  entityId,
}: {
  entries: OwnerDetailActivityEntry[];
  entityId: string;
}) {
  const recent = entries.slice(0, 4);
  return (
    <section className={styles.panel}>
      <header className={styles.panelHead}>
        <div className={styles.panelTitle}>
          <ClockCounterClockwise size={16} weight="duotone" />
          Recent activity
        </div>
        <Link
          href={`/admin/owners/${entityId}?tab=activity`}
          className={styles.panelLink}
          prefetch={false}
        >
          View all &rarr;
        </Link>
      </header>
      {recent.length === 0 ? (
        <div className={styles.emptyBlock}>
          No activity yet.
          <br />
          Events will show up here as soon as something changes.
        </div>
      ) : (
        <div className={styles.activityList}>
          {recent.map((entry) => (
            <div key={entry.id} className={styles.activityItem}>
              <div
                className={styles.activityDot}
                style={{
                  background: gradientFor(entry.actorName ?? entry.id),
                }}
              >
                {(entry.actorName ?? "S").slice(0, 1).toUpperCase()}
              </div>
              <div className={styles.activityMain}>
                <div className={styles.activityText}>
                  {formatActionText(entry)}
                </div>
                <div className={styles.activityMeta}>
                  {entry.entityType === "property" ? "On a property" : null}
                </div>
              </div>
              <div className={styles.activityTime}>
                {relativeTimeShort(entry.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function TasksPanel({ entityId }: { entityId: string }) {
  return (
    <section className={styles.panel}>
      <header className={styles.panelHead}>
        <div className={styles.panelTitle}>
          <Checks size={16} weight="duotone" />
          Open tasks
        </div>
        <Link
          href={`/admin/tasks?owner=${entityId}`}
          className={styles.panelLink}
          prefetch={false}
        >
          View all &rarr;
        </Link>
      </header>
      <div className={styles.emptyBlock}>
        No open tasks yet.
        <br />
        Tasks will appear here when they&rsquo;re created.
      </div>
    </section>
  );
}

export function BillingCard({
  lifetimeRevenueCents,
}: {
  lifetimeRevenueCents: number | null | undefined;
}) {
  const formatted = (() => {
    const c = lifetimeRevenueCents;
    if (!c) return "$0";
    const k = c / 100;
    if (k >= 1000) return `$${(k / 1000).toFixed(1)}k`;
    return `$${k.toFixed(0)}`;
  })();

  return (
    <section className={styles.panel}>
      <header className={styles.panelHead}>
        <div className={styles.panelTitle}>
          <CurrencyDollar size={16} weight="duotone" />
          Billing
        </div>
        <Link href="?tab=billing" className={styles.panelLink} prefetch={false}>
          View all &rarr;
        </Link>
      </header>
      <div className={styles.billingBody}>
        <div className={styles.billingAmount}>{formatted}</div>
        <div className={styles.billingAmountLabel}>lifetime revenue</div>
      </div>
    </section>
  );
}

export function PropertiesSnapshot({
  properties,
}: {
  properties: OwnerDetailProperty[];
}) {
  if (properties.length === 0) return null;
  return (
    <section className={`${styles.panel} ${styles.propSnapshot}`}>
      <header className={styles.panelHead}>
        <div className={styles.panelTitle}>Properties</div>
      </header>
      <div className={styles.propSnapshotList}>
        {properties.map((p) => {
          const isLive = p.active && p.setupStatus === "published";
          const isDraft = p.setupStatus !== "published";
          const pillClass = isDraft
            ? styles.healthDraft
            : isLive
              ? styles.healthActive
              : styles.healthPaused;
          const pillLabel = isDraft
            ? "Draft"
            : isLive
              ? "Live"
              : "Paused";
          const listedLabel =
            p.setupStatus === "published"
              ? `Listed ${new Date(p.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}`
              : "Not yet listed";
          return (
            <div key={p.id} className={styles.propSnapshotRow}>
              <div
                className={styles.propSnapshotThumb}
                style={{ background: gradientFor(p.id) }}
              />
              <div className={styles.propSnapshotText}>
                <div className={styles.propSnapshotName}>{p.label}</div>
                <div className={styles.propSnapshotMeta}>
                  {listedLabel}
                  {p.city ? ` \u00b7 ${p.city}${p.state ? `, ${p.state}` : ""}` : ""}
                </div>
              </div>
              <span className={`${styles.healthPill} ${pillClass}`}>
                <span className={styles.dot} />
                {pillLabel}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
