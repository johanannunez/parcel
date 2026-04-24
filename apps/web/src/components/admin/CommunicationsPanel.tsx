// apps/web/src/components/admin/CommunicationsPanel.tsx
import { Lightning, PhoneSlash, UserPlus } from '@phosphor-icons/react/dist/ssr';
import type { CommunicationsDashboardData } from '@/lib/admin/fetch-communications';
import styles from './CommunicationsPanel.module.css';

type Props = {
  data: CommunicationsDashboardData;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export function CommunicationsPanel({ data }: Props) {
  const hasContent =
    data.recentActionItems.length > 0 || data.unresolvedCallers.length > 0;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <Lightning size={16} weight="fill" className={styles.headerIcon} />
        <span className={styles.headerTitle}>Communications</span>
        {data.unresolvedCallers.length > 0 && (
          <span className={styles.badge}>{data.unresolvedCallers.length} unresolved</span>
        )}
      </div>

      {!hasContent && (
        <div className={styles.empty}>No recent communications.</div>
      )}

      {data.unresolvedCallers.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Unresolved callers</div>
          {data.unresolvedCallers.map((caller) => (
            <div key={caller.phone} className={styles.unresolvedRow}>
              <PhoneSlash size={14} weight="duotone" className={styles.unknownIcon} />
              <div className={styles.unresolvedContent}>
                <span className={styles.phone}>{caller.phone}</span>
                {caller.claudeSummary && (
                  <p className={styles.summary}>{caller.claudeSummary}</p>
                )}
                <span className={styles.date}>{formatDate(caller.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {data.recentActionItems.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Action required</div>
          {data.recentActionItems.map((item) => (
            <div key={item.id} className={styles.actionRow}>
              <UserPlus size={14} weight="duotone" className={styles.actionIcon} />
              <div className={styles.actionContent}>
                <span className={styles.actionTitle}>{item.title}</span>
                <p className={styles.actionBody}>{item.body}</p>
                <span className={styles.date}>{formatDate(item.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
