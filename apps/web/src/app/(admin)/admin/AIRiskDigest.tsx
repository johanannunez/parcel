// apps/web/src/app/(admin)/admin/AIRiskDigest.tsx
import Link from 'next/link';
import { WidgetShell } from './WidgetShell';
import type { AIRiskDigestData, RiskInsight } from '@/lib/admin/dashboard-v2';
import styles from './AIRiskDigest.module.css';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function SeverityPill({ insight }: { insight: RiskInsight }) {
  if (insight.isCritical) {
    return <span className={`${styles.severityPill} ${styles.pillCritical}`}>CRITICAL</span>;
  }
  if (insight.severity === 'warning') {
    return <span className={`${styles.severityPill} ${styles.pillWarning}`}>WARNING</span>;
  }
  return <span className={`${styles.severityPill} ${styles.pillRec}`}>REC.</span>;
}

export function AIRiskDigest({ data }: { data: AIRiskDigestData }) {
  const isEmpty = data.insights.length === 0;

  return (
    <WidgetShell
      label="AI Risk Digest"
      count={data.totalUnresolved > 0 ? data.totalUnresolved : undefined}
      href="/admin/properties"
      hrefLabel="View properties"
    >
      {!isEmpty && (
        <div className={styles.summary}>
          {data.criticalCount > 0 && (
            <span className={`${styles.summaryBadge} ${styles.badgeCritical}`}>
              <span className={styles.pulse} />
              {data.criticalCount} critical
            </span>
          )}
          {data.warningCount > 0 && (
            <span className={`${styles.summaryBadge} ${styles.badgeWarning}`}>
              {data.warningCount} warning{data.warningCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {isEmpty ? (
        <div className={styles.empty}>
          <span className={styles.emptyCheck}>✓</span>
          No active alerts. All properties looking healthy.
        </div>
      ) : (
        <div className={styles.list}>
          {data.insights.slice(0, 6).map((insight) => (
            <Link
              key={insight.id}
              href={`/admin/properties/${insight.propertyId}`}
              className={`${styles.insightRow} ${insight.isCritical ? styles.rowCritical : insight.severity === 'warning' ? styles.rowWarning : ''}`}
            >
              <div className={styles.rowTop}>
                <SeverityPill insight={insight} />
                <span className={styles.propName}>{insight.propertyName}</span>
                <span className={styles.timeAgo}>{timeAgo(insight.createdAt)}</span>
              </div>
              <div className={styles.insightTitle}>{insight.title}</div>
              <div className={styles.insightBody}>{insight.body}</div>
            </Link>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}
