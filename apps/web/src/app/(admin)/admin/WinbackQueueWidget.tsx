// apps/web/src/app/(admin)/admin/WinbackQueueWidget.tsx
import Link from 'next/link';
import { WidgetShell } from './WidgetShell';
import type { WinbackQueueData, WinbackContact } from '@/lib/admin/dashboard-v2';
import styles from './WinbackQueueWidget.module.css';

function formatMrr(mrr: number): string {
  if (mrr >= 1000) return `$${(mrr / 1000).toFixed(1)}k/mo`;
  return `$${mrr}/mo`;
}

function ContactRow({ contact }: { contact: WinbackContact }) {
  const isChurned = contact.stage === 'churned';

  return (
    <Link href={`/admin/contacts/${contact.id}`} className={styles.contactRow}>
      <div className={styles.rowTop}>
        <span
          className={`${styles.stageBadge} ${isChurned ? styles.badgeChurned : styles.badgePaused}`}
        >
          {isChurned ? 'Churned' : 'Paused'}
        </span>
        <span className={styles.name}>{contact.name}</span>
        <span className={styles.dormant}>{contact.daysDormant}d dormant</span>
        {contact.estimatedMrr > 0 && (
          <span className={styles.mrr}>{formatMrr(contact.estimatedMrr)}</span>
        )}
      </div>
      {contact.insightTitle && (
        <div className={styles.insightSnippet}>
          <span className={styles.sparkIcon}>★</span>
          {contact.insightTitle}
        </div>
      )}
    </Link>
  );
}

export function WinbackQueueWidget({ data }: { data: WinbackQueueData }) {
  const isEmpty = data.contacts.length === 0;
  const totalPotentialMrr = data.contacts.reduce((sum, c) => sum + c.estimatedMrr, 0);

  return (
    <WidgetShell
      label="Winback"
      count={data.total > 0 ? data.total : undefined}
      href="/admin/contacts?view=archived"
      hrefLabel="View all"
    >
      {!isEmpty && totalPotentialMrr > 0 && (
        <div className={styles.potentialMrr}>
          {formatMrr(totalPotentialMrr)}
          <span className={styles.potentialLabel}> potential</span>
        </div>
      )}

      {isEmpty ? (
        <div className={styles.empty}>No winback opportunities.</div>
      ) : (
        <div className={styles.list}>
          {data.contacts.slice(0, 4).map((contact) => (
            <ContactRow key={contact.id} contact={contact} />
          ))}
        </div>
      )}
    </WidgetShell>
  );
}
