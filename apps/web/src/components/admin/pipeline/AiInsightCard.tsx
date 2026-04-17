import type { Insight } from '@/lib/admin/ai-insights';
import styles from './AiInsightCard.module.css';

const SEVERITY_CLASS: Record<string, string> = {
  info: styles.info,
  recommendation: styles.recommendation,
  warning: styles.warning,
  success: styles.success,
};

function agentInitials(key: string): string {
  return key
    .split('_')
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);
}

export function AiInsightCard({ insight }: { insight: Insight }) {
  return (
    <aside className={`${styles.tile} ${SEVERITY_CLASS[insight.severity] ?? styles.info}`}>
      <span className={styles.agent} aria-hidden>{agentInitials(insight.agentKey)}</span>
      <div className={styles.text}>
        <strong className={styles.agentName}>{insight.title}:</strong>{' '}
        {insight.body}
      </div>
    </aside>
  );
}
