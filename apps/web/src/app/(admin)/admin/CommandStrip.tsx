// apps/web/src/app/(admin)/admin/CommandStrip.tsx
import type { CommandStripData } from '@/lib/admin/dashboard-v2';
import styles from './CommandStrip.module.css';

type Props = {
  data: CommandStripData;
};

function formatDollarsPerMonth(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents) + '/mo';
}

function formatDollars(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function CommandStrip({ data }: Props) {
  const {
    overdueTasks,
    pipelineValue,
    coldLeads,
    stuckItems,
    openInvoices,
    activeWarnings,
    pendingInvitations,
  } = data;

  return (
    <div className={styles.strip}>
      <div className={styles.chip}>
        <span className={`${styles.chipDot} ${overdueTasks > 0 ? styles.dotRed : styles.dotMuted}`} />
        <span className={`${styles.chipValue}${overdueTasks > 0 ? ` ${styles.red}` : ''}`}>
          {overdueTasks}
        </span>
        <span className={styles.chipLabel}>tasks overdue</span>
      </div>

      <div className={styles.chip}>
        <span className={`${styles.chipDot} ${stuckItems > 0 ? styles.dotRed : styles.dotMuted}`} />
        <span className={`${styles.chipValue}${stuckItems > 0 ? ` ${styles.red}` : ''}`}>
          {stuckItems}
        </span>
        <span className={styles.chipLabel}>stuck</span>
      </div>

      <div className={styles.divider} />

      <div className={styles.chip}>
        <span className={`${styles.chipDot} ${pipelineValue > 0 ? styles.dotGreen : styles.dotAmber}`} />
        <span className={`${styles.chipValue}${pipelineValue === 0 ? ` ${styles.amber}` : ''}`}>
          {formatDollarsPerMonth(pipelineValue)}
        </span>
        <span className={styles.chipLabel}>pipeline</span>
      </div>

      <div className={styles.chip}>
        <span className={`${styles.chipDot} ${coldLeads > 0 ? styles.dotAmber : styles.dotMuted}`} />
        <span className={styles.chipValue}>{coldLeads}</span>
        <span className={styles.chipLabel}>cold leads</span>
      </div>

      <div className={styles.divider} />

      <div className={styles.chip}>
        <span className={`${styles.chipDot} ${openInvoices.count > 0 ? styles.dotAmber : styles.dotMuted}`} />
        <span className={`${styles.chipValue}${openInvoices.count > 0 ? ` ${styles.amber}` : ''}`}>
          {formatDollars(openInvoices.totalCents)}
        </span>
        <span className={styles.chipLabel}>open invoices</span>
      </div>

      <div className={styles.divider} />

      <div className={styles.chip}>
        <span className={`${styles.chipDot} ${activeWarnings > 0 ? styles.dotAmber : styles.dotMuted}`} />
        <span className={styles.chipValue}>{activeWarnings}</span>
        <span className={styles.chipLabel}>AI warnings</span>
      </div>

      <div className={styles.chip}>
        <span className={`${styles.chipDot} ${pendingInvitations > 0 ? styles.dotBlue : styles.dotMuted}`} />
        <span className={styles.chipValue}>{pendingInvitations}</span>
        <span className={styles.chipLabel}>pending invites</span>
      </div>
    </div>
  );
}
