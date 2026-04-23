// apps/web/src/app/(admin)/admin/GuestIntelligence.tsx
'use client';

import { useState, useTransition } from 'react';
import { ArrowsClockwise, X } from '@phosphor-icons/react';
import type { Insight } from '@/lib/admin/ai-insights';
import type { InsightPayload } from '@/lib/admin/insight-types';
import { dismissInsight, triggerGuestIntelligenceSync } from '@/lib/admin/insight-actions';
import { InsightDetailPanel } from './InsightDetailPanel';
import styles from './GuestIntelligence.module.css';

type EnrichedInsight = Insight & {
  payload: InsightPayload;
  propertyId: string;
  propertyName: string;
};

type Props = {
  ownerUpdates: EnrichedInsight[];
  houseActions: EnrichedInsight[];
};

function severityBadgeCls(severity: Insight['severity'], isCritical: boolean): string {
  if (isCritical) return styles.badgeCritical;
  if (severity === 'warning') return styles.badgeWarning;
  if (severity === 'recommendation') return styles.badgeRecommendation;
  return styles.badgeInfo;
}

function severityLabel(severity: Insight['severity'], isCritical: boolean): string {
  if (isCritical) return 'Critical';
  if (severity === 'warning') return 'Warning';
  if (severity === 'recommendation') return 'Recommendation';
  return 'Info';
}

function InsightCard({
  insight,
  onOpen,
  onDismiss,
}: {
  insight: EnrichedInsight;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const isCritical = Boolean(insight.payload.isCritical);
  return (
    <div
      className={styles.card}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
    >
      <div className={styles.cardTop}>
        <div className={styles.badgeRow}>
          <span className={`${styles.badge} ${severityBadgeCls(insight.severity, isCritical)}`}>
            {severityLabel(insight.severity, isCritical)}
          </span>
          <span className={styles.sourceCount}>
            {insight.payload.sourceCount} {insight.payload.sourceCount === 1 ? 'mention' : 'mentions'}
          </span>
        </div>
        <button
          type="button"
          className={styles.dismissBtn}
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
      <div className={styles.cardTitle}>{insight.title}</div>
      <div className={styles.propName}>{insight.propertyName}</div>
    </div>
  );
}

export function GuestIntelligence({ ownerUpdates, houseActions }: Props) {
  const [activeInsight, setActiveInsight] = useState<EnrichedInsight | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [isRefreshing, startRefresh] = useTransition();

  const handleDismiss = (insightId: string) => {
    setDismissed((prev) => new Set([...prev, insightId]));
    dismissInsight(insightId).catch(console.error);
  };

  const handleRefresh = () => {
    startRefresh(async () => {
      await triggerGuestIntelligenceSync();
      window.location.reload();
    });
  };

  const visibleOwner = ownerUpdates.filter((i) => !dismissed.has(i.id));
  const visibleHouse = houseActions.filter((i) => !dismissed.has(i.id));

  return (
    <>
      <div className={styles.header}>
        <span />
        <button
          type="button"
          className={styles.refreshBtn}
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <ArrowsClockwise size={13} weight={isRefreshing ? 'bold' : 'regular'} />
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className={styles.cols}>
        <div className={styles.col}>
          <div className={styles.colLabel}>Owner Updates</div>
          <div className={styles.cardList}>
            {visibleOwner.length === 0 ? (
              <div className={styles.empty}>No owner updates right now.</div>
            ) : (
              visibleOwner.map((ins) => (
                <InsightCard
                  key={ins.id}
                  insight={ins}
                  onOpen={() => setActiveInsight(ins)}
                  onDismiss={() => handleDismiss(ins.id)}
                />
              ))
            )}
          </div>
        </div>

        <div className={styles.col}>
          <div className={styles.colLabel}>House Action Items</div>
          <div className={styles.cardList}>
            {visibleHouse.length === 0 ? (
              <div className={styles.empty}>No house action items right now.</div>
            ) : (
              visibleHouse.map((ins) => (
                <InsightCard
                  key={ins.id}
                  insight={ins}
                  onOpen={() => setActiveInsight(ins)}
                  onDismiss={() => handleDismiss(ins.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {activeInsight ? (
        <InsightDetailPanel
          insight={activeInsight}
          payload={activeInsight.payload}
          propertyId={activeInsight.propertyId}
          onClose={() => setActiveInsight(null)}
        />
      ) : null}
    </>
  );
}
