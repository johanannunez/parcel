// apps/web/src/app/(admin)/admin/OwnerActivityWidget.tsx
import { WidgetShell } from './WidgetShell';
import type { OwnerActivityData, OwnerActivityRow } from '@/lib/admin/dashboard-v2';
import styles from './OwnerActivityWidget.module.css';

function timeAgo(iso: string | null): string {
  if (!iso) return 'never';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(diffMs / 3_600_000);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(diffMs / 86_400_000);
  return `${days}d ago`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function avatarColor(status: OwnerActivityRow['status']): string {
  if (status === 'active') return '#22c55e';
  if (status === 'invited') return '#3b82f6';
  return '#ef4444';
}

export function OwnerActivityWidget({ data }: { data: OwnerActivityData }) {
  return (
    <WidgetShell
      label="Owner Activity"
      href="/admin/workspaces?view=active-owners"
    >
      <div className={styles.stats}>
        <div className={styles.statChip}>
          <span className={`${styles.dot} ${styles.dotGreen}`} />
          <span className={styles.statValue}>{data.active}</span>
          <span className={styles.statLabel}>Active</span>
        </div>
        <div className={styles.statChip}>
          <span className={`${styles.dot} ${styles.dotBlue}`} />
          <span className={styles.statValue}>{data.invited}</span>
          <span className={styles.statLabel}>Invited</span>
        </div>
        <div className={styles.statChip}>
          <span className={`${styles.dot} ${data.dark > 0 ? styles.dotRed : styles.dotMuted}`} />
          <span className={styles.statValue}>{data.dark}</span>
          <span className={styles.statLabel}>Dark</span>
        </div>
      </div>

      <div className={styles.divider} />

      {data.recentlyActive.length === 0 ? (
        <div className={styles.empty}>No active owners yet</div>
      ) : (
        <div className={styles.list}>
          {data.recentlyActive.map((owner) => (
            <div key={owner.workspaceId} className={styles.row}>
              <div
                className={styles.avatar}
                style={{ color: avatarColor(owner.status) }}
              >
                {getInitials(owner.name)}
              </div>
              <div className={styles.info}>
                <span className={styles.ownerName}>{owner.name}</span>
                <span className={styles.propCount}>
                  {owner.propertyCount} propert{owner.propertyCount !== 1 ? 'ies' : 'y'}
                </span>
              </div>
              <span className={styles.timeAgo}>{timeAgo(owner.lastActivity)}</span>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}
