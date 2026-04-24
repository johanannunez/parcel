// apps/web/src/app/(admin)/admin/AllocationHealthWidget.tsx
import Link from 'next/link';
import { WidgetShell } from './WidgetShell';
import type { AllocationHealthData, AllocationBucket } from '@/lib/admin/dashboard-v2';
import styles from './AllocationHealthWidget.module.css';

const BUCKET_LABELS: Record<string, string> = {
  owners_comp: 'OWNERS',
  tax: 'TAX',
  emergency: 'EMERG.',
  opex: 'OPEX',
  profit: 'PROFIT',
  generosity: 'GENEROS.',
};

function formatBalance(cents: number): string {
  const dollars = Math.round(cents);
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(1)}k`;
  return `$${dollars}`;
}

function StatusBadge({ status }: { status: AllocationHealthData['overallStatus'] }) {
  if (status === 'healthy') {
    return <span className={`${styles.statusBadge} ${styles.badgeHealthy}`}>Healthy</span>;
  }
  if (status === 'warning') {
    return <span className={`${styles.statusBadge} ${styles.badgeWarning}`}>Drifting</span>;
  }
  return <span className={`${styles.statusBadge} ${styles.badgeCritical}`}>Off Track</span>;
}

function BucketRow({ bucket }: { bucket: AllocationBucket }) {
  const fillPct = Math.min(Math.max(bucket.actualPct, 0), 100);
  const targetPct = Math.min(Math.max(bucket.targetPct, 0), 100);

  const fillClass =
    bucket.status === 'on_track'
      ? styles.fillGreen
      : bucket.status === 'drifting'
        ? styles.fillAmber
        : styles.fillRed;

  const dotClass =
    bucket.status === 'on_track'
      ? styles.dotGreen
      : bucket.status === 'drifting'
        ? styles.dotAmber
        : styles.dotRed;

  return (
    <div className={styles.bucket}>
      <span className={styles.bucketName}>
        {BUCKET_LABELS[bucket.category] ?? bucket.category.toUpperCase()}
      </span>
      <div className={styles.barTrack}>
        <div
          className={`${styles.barFill} ${fillClass}`}
          style={{ width: `${fillPct}%` }}
        />
        <div
          className={styles.targetMarker}
          style={{ left: `${targetPct}%` }}
        />
      </div>
      <span className={styles.balance}>{formatBalance(bucket.balance)}</span>
      <span className={`${styles.statusDot} ${dotClass}`} />
    </div>
  );
}

export function AllocationHealthWidget({ data }: { data: AllocationHealthData }) {
  const statusBadge = <StatusBadge status={data.overallStatus} />;

  return (
    <WidgetShell
      label="Allocation"
      href="/admin/treasury"
      hrefLabel="View treasury"
    >
      <div className={styles.headerExtra}>{statusBadge}</div>

      {!data.hasConnection ? (
        <div className={styles.noConnection}>
          <span className={styles.noConnectionText}>
            Connect treasury account to see allocation health.
          </span>
          <Link href="/admin/treasury" className={styles.connectLink}>
            Connect now →
          </Link>
        </div>
      ) : data.buckets.length === 0 ? (
        <div className={styles.empty}>No treasury data available.</div>
      ) : (
        <div className={styles.buckets}>
          {data.buckets.map((bucket) => (
            <BucketRow key={bucket.category} bucket={bucket} />
          ))}
        </div>
      )}
    </WidgetShell>
  );
}
