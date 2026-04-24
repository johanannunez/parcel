// apps/web/src/app/(admin)/admin/ColdLeadsWidget.tsx
import Link from 'next/link';
import { WidgetShell } from './WidgetShell';
import type { ColdLeadsData } from '@/lib/admin/dashboard-v2';
import styles from './ColdLeadsWidget.module.css';

function dormantBadgeClass(days: number): string {
  if (days > 60) return styles.badgeRed;
  if (days >= 30) return styles.badgeAmber;
  return styles.badgeBlue;
}

function formatMrr(value: number): string {
  if (value === 0) return '';
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k/mo`;
  return `$${value}/mo`;
}

export function ColdLeadsWidget({ data }: { data: ColdLeadsData }) {
  return (
    <WidgetShell
      label="Cold Leads"
      count={data.total}
      href="/admin/contacts?view=cold"
    >
      {data.topLeads.length === 0 ? (
        <div className={styles.emptyGood}>
          <span className={styles.checkmark}>✓</span>
          No cold leads. Pipeline is warm.
        </div>
      ) : (
        <div className={styles.list}>
          {data.topLeads.map((lead) => (
            <Link
              key={lead.id}
              href={`/admin/contacts/${lead.id}`}
              className={styles.row}
            >
              <span className={styles.name}>{lead.name}</span>
              <div className={styles.meta}>
                <span className={`${styles.dormantBadge} ${dormantBadgeClass(lead.daysDormant)}`}>
                  {lead.daysDormant}d dormant
                </span>
                {lead.estimatedMrr > 0 && (
                  <span className={styles.mrr}>{formatMrr(lead.estimatedMrr)}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}
