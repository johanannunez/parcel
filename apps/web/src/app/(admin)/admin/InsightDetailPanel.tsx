// apps/web/src/app/(admin)/admin/InsightDetailPanel.tsx
'use client';

import { useTransition } from 'react';
import { X } from '@phosphor-icons/react';
import type { InsightPayload } from '@/lib/admin/insight-types';
import type { Insight } from '@/lib/admin/ai-insights';
import { dismissInsight, createTaskFromInsight } from '@/lib/admin/insight-actions';
import styles from './InsightDetailPanel.module.css';

type Props = {
  insight: Insight;
  payload: InsightPayload;
  propertyId: string;
  onClose: () => void;
};

function badgeCls(severity: Insight['severity'], isCritical: boolean): string {
  if (isCritical) return styles.badgeCritical;
  if (severity === 'warning') return styles.badgeWarning;
  if (severity === 'recommendation') return styles.badgeRecommendation;
  return styles.badgeInfo;
}

function badgeLabel(severity: Insight['severity'], isCritical: boolean): string {
  if (isCritical) return 'Critical';
  if (severity === 'warning') return 'Warning';
  if (severity === 'recommendation') return 'Recommendation';
  return 'Info';
}

export function InsightDetailPanel({ insight, payload, propertyId, onClose }: Props) {
  const [isPending, startTransition] = useTransition();
  const isCritical = Boolean(payload.isCritical);

  const handleDismiss = () => {
    startTransition(async () => {
      await dismissInsight(insight.id);
      onClose();
    });
  };

  const handleCreateTask = () => {
    startTransition(async () => {
      await createTaskFromInsight({
        insightId: insight.id,
        propertyId,
        title: insight.title,
        body: insight.body,
        suggestedFixes: payload.suggestedFixes,
      });
      onClose();
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.severityRow}>
              <span className={`${styles.badge} ${badgeCls(insight.severity, isCritical)}`}>
                {badgeLabel(insight.severity, isCritical)}
              </span>
              <span className={styles.sourceCount}>
                {payload.sourceCount} {payload.sourceCount === 1 ? 'mention' : 'mentions'}
              </span>
            </div>
            <h2 className={styles.panelTitle}>{insight.title}</h2>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className={styles.body}>
          <div>
            <div className={styles.sectionLabel}>The issue</div>
            <p className={styles.issueText}>{insight.body}</p>
          </div>

          <div>
            <div className={styles.sectionLabel}>Why this severity</div>
            <p className={styles.reasonText}>{payload.severityReason}</p>
          </div>

          {payload.sourceExcerpts.length > 0 && (
            <div>
              <div className={styles.sectionLabel}>Sources</div>
              <div className={styles.sourceList}>
                {payload.sourceExcerpts.map((src, i) => (
                  <div key={i} className={styles.sourceItem}>
                    <div className={styles.sourceMeta}>
                      <span className={styles.sourceTypeBadge}>{src.type}</span>
                      <span className={styles.sourceName}>{src.guestFirstName}</span>
                      <span className={styles.sourceDate}>{src.approximateDate}</span>
                    </div>
                    <p className={styles.sourceQuote}>"{src.quote}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {payload.suggestedFixes.length > 0 && (
            <div>
              <div className={styles.sectionLabel}>Suggested fixes</div>
              <div className={styles.fixList}>
                {payload.suggestedFixes.map((fix, i) => (
                  <div key={i} className={styles.fixItem}>
                    <span className={styles.fixNumber}>{i + 1}</span>
                    <span className={styles.fixText}>{fix}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleCreateTask}
            disabled={isPending}
          >
            {isPending ? 'Creating…' : payload.suggestedFixes.length > 1 ? 'Create task + subtasks' : 'Create task'}
          </button>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleDismiss}
            disabled={isPending}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
