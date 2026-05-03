// apps/web/src/app/(admin)/admin/PipelinePulse.tsx
import { WidgetShell } from './WidgetShell';
import type { PipelinePulseData } from '@/lib/admin/dashboard-v2';
import styles from './PipelinePulse.module.css';

const STAGE_COLORS: Record<string, string> = {
  lead_new:      '#f5a623',
  qualified:     '#f59e0b',
  in_discussion: '#d97706',
  contract_sent: '#b45309',
};

function formatMrr(cents: number): string {
  if (cents === 0) return '$0/mo';
  const dollars = Math.round(cents);
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(1)}k/mo`;
  return `$${dollars}/mo`;
}

function formatTotal(cents: number): string {
  const dollars = Math.round(cents);
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(1)}k`;
  return `$${dollars}`;
}

export function PipelinePulse({ data }: { data: PipelinePulseData }) {
  const maxCount = Math.max(...data.stages.map((s) => s.count), 1);
  const isEmpty = data.totalLeads === 0;

  return (
    <WidgetShell
      label="Pipeline"
      href="/admin/people?view=lead-pipeline"
    >
      <div className={styles.card}>
        <div className={styles.totalMrr}>
          {formatTotal(data.totalPipelineValue)}<span className={styles.totalMo}> /mo</span>
        </div>
        <div className={styles.totalLabel}>
          in pipeline across {data.totalLeads} lead{data.totalLeads !== 1 ? 's' : ''}
        </div>

        {isEmpty ? (
          <div className={styles.empty}>No active pipeline</div>
        ) : (
          <div className={styles.stages}>
            {data.stages.map((row) => {
              const fillPct = row.count > 0
                ? Math.max((row.count / maxCount) * 100, 4)
                : 0;
              const color = STAGE_COLORS[row.stage] ?? '#f5a623';

              return (
                <div key={row.stage} className={styles.stageRow}>
                  <span className={styles.stageLabel}>{row.label}</span>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{ width: `${fillPct}%`, background: color }}
                    />
                  </div>
                  <span className={styles.stageCount}>{row.count}</span>
                  <span className={styles.stageMrr}>{formatMrr(row.totalMrr)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </WidgetShell>
  );
}
