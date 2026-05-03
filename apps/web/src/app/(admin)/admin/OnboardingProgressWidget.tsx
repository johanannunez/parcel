// apps/web/src/app/(admin)/admin/OnboardingProgressWidget.tsx
import Link from 'next/link';
import { WidgetShell } from './WidgetShell';
import type { OnboardingProgressData } from '@/lib/admin/dashboard-v2';
import styles from './OnboardingProgressWidget.module.css';

function barFillClass(pct: number): string {
  if (pct >= 100) return styles.barFillGreen;
  if (pct >= 60) return styles.barFillBlue;
  if (pct >= 30) return styles.barFillAmber;
  return styles.barFillRed;
}

function worstStatusBadge(
  status: string | null,
): { label: string; cls: string } | null {
  if (!status || status === 'completed' || status === 'not_started') return null;
  if (status === 'stuck') return { label: 'stuck', cls: styles.badgeStuck };
  if (status === 'pending_owner') return { label: 'owner pending', cls: styles.badgePending };
  if (status === 'in_progress') return { label: 'in progress', cls: styles.badgeProgress };
  return null;
}

export function OnboardingProgressWidget({ data }: { data: OnboardingProgressData }) {
  return (
    <WidgetShell
      label="Onboarding"
      count={data.total}
      href="/admin/people?view=onboarding"
    >
      {data.contacts.length === 0 ? (
        <div className={styles.empty}>No owners in onboarding</div>
      ) : (
        <div className={styles.list}>
          {data.contacts.map((contact, idx) => {
            const isWarning = contact.daysInStage > 14;
            return (
              <div key={contact.id}>
                {idx > 0 && <div className={styles.separator} />}
                <div className={styles.contactRow}>
                  <Link
                    href={`/admin/people/${contact.id}`}
                    className={styles.contactHeader}
                  >
                    <span className={styles.contactName}>{contact.name}</span>
                    <span
                      className={`${styles.daysInStage} ${isWarning ? styles.daysInStageWarning : ''}`}
                    >
                      {contact.daysInStage}d in stage
                    </span>
                  </Link>

                  {contact.properties.length > 0 && (
                    <div className={styles.properties}>
                      {contact.properties.map((prop) => {
                        const badge = worstStatusBadge(prop.worstStatus);
                        return (
                          <div key={prop.id} className={styles.propRow}>
                            <span className={styles.propAddress}>{prop.address}</span>
                            <div className={styles.barTrack}>
                              <div
                                className={`${styles.barFill} ${barFillClass(prop.checklistPct)}`}
                                style={{ width: `${prop.checklistPct}%` }}
                              />
                            </div>
                            <span className={styles.pct}>{prop.checklistPct}%</span>
                            {badge && (
                              <span className={`${styles.statusBadge} ${badge.cls}`}>
                                {badge.label}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </WidgetShell>
  );
}
