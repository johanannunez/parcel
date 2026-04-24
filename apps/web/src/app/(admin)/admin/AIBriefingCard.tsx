// apps/web/src/app/(admin)/admin/AIBriefingCard.tsx
import type { DailyBriefing, BriefingItem } from '@/lib/admin/dashboard-briefing';
import styles from './AIBriefingCard.module.css';

type Props = {
  briefing: DailyBriefing | null;
};

const RANK_CLASS: Record<BriefingItem['urgency'], string> = {
  critical: styles.rankCritical,
  high: styles.rankHigh,
  medium: styles.rankMedium,
  low: styles.rankLow,
};

const DOMAIN_CLASS: Record<BriefingItem['domain'], string> = {
  operations: styles.domainOperations,
  pipeline: styles.domainPipeline,
  financial: styles.domainFinancial,
  intelligence: styles.domainIntelligence,
  portfolio: styles.domainPortfolio,
};

export function AIBriefingCard({ briefing }: Props) {
  const hasItems = briefing !== null && briefing.items.length > 0;

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.topRow}>
          <span className={styles.aiLabel}>AI Briefing</span>
          {briefing && (
            <span className={styles.date}>{briefing.date}</span>
          )}
          <span className={styles.refreshBtn} aria-hidden="true">
            ↻
          </span>
        </div>

        {hasItems ? (
          <div className={styles.items}>
            {briefing!.items.map((item) => (
              <div key={item.rank} className={styles.item}>
                <div className={`${styles.rank} ${RANK_CLASS[item.urgency]}`}>
                  {item.rank}
                </div>
                <span className={`${styles.domainDot} ${DOMAIN_CLASS[item.domain]}`} />
                <div className={styles.content}>
                  <div className={styles.headline}>{item.headline}</div>
                  <div className={styles.detail}>{item.detail}</div>
                  {item.action && (
                    <div className={styles.action}>{item.action}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            No briefing available — check API key
          </div>
        )}
      </div>
    </div>
  );
}
