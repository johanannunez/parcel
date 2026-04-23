// apps/web/src/app/(admin)/admin/AttentionQueue.tsx
import Link from 'next/link';
import type { AttentionItem } from '@/lib/admin/dashboard-data';
import styles from './AttentionQueue.module.css';

type Bucket = { status: AttentionItem['status']; label: string; dotCls: string };

const BUCKETS: Bucket[] = [
  { status: 'stuck',         label: 'Stuck',               dotCls: styles.dotRed   },
  { status: 'pending_owner', label: 'Owner needs to act',  dotCls: styles.dotAmber },
  { status: 'in_progress',   label: 'In progress',         dotCls: styles.dotBlue  },
];

function formatDays(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return '1 day';
  return `${days}d`;
}

export function AttentionQueue({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.headerLabel}>Attention Queue</span>
        </div>
        <div className={styles.allClear}>
          <span>✓</span>
          <span>All checklist items are clear.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.headerLabel}>Attention Queue</span>
      </div>
      <div className={styles.wrap}>
        {BUCKETS.map((bucket) => {
          const bucketItems = items.filter((i) => i.status === bucket.status);
          if (bucketItems.length === 0) return null;
          return (
            <div key={bucket.status} className={styles.bucket}>
              <div className={styles.bucketHeader}>
                <span className={`${styles.dot} ${bucket.dotCls}`} />
                <span className={styles.bucketLabel}>{bucket.label}</span>
                <span className={styles.bucketCount}>({bucketItems.length})</span>
              </div>
              <div className={styles.list}>
                {bucketItems.map((item, i) => (
                  <Link
                    key={`${item.propertyId}-${item.itemLabel}-${i}`}
                    href={item.propertyHref}
                    className={styles.row}
                  >
                    <div className={styles.rowMain}>
                      <span className={styles.itemLabel}>{item.itemLabel}</span>
                      <span className={styles.propName}>{item.propertyName}</span>
                    </div>
                    <span className={styles.catBadge}>{item.category}</span>
                    <span className={styles.days}>{formatDays(item.daysInStatus)}</span>
                    <span className={styles.arrow}>›</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
