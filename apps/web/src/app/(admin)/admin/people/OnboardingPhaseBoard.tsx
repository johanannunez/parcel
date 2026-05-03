import Link from 'next/link';
import type { ContactRow } from '@/lib/admin/contact-types';
import { fetchOnboardingPhaseCounts, type PhaseCounts } from '@/lib/admin/onboarding-phase-counts';
import styles from './OnboardingPhaseBoard.module.css';

type Props = {
  rows: ContactRow[];
  basePath?: string;
  useEntityId?: boolean;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarGradient(id: string): string {
  const hue = parseInt(id.replace(/-/g, '').slice(0, 6), 16) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

function currentPhase(counts: PhaseCounts): 'documents' | 'finances' | 'listings' {
  if (counts.documents.done < counts.documents.total) return 'documents';
  if (counts.finances.done < counts.finances.total) return 'finances';
  return 'listings';
}

function daysSinceStage(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400_000);
  if (days < 1) return 'today';
  if (days === 1) return '1d';
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

const PHASES = [
  {
    key: 'documents' as const,
    label: 'Documents',
    sub: 'Owner provides',
    headStyle: 'linear-gradient(135deg, #F59E0B, #B45309)',
    colBg: 'rgba(245,158,11,0.05)',
    colBorder: 'rgba(245,158,11,0.22)',
    activeColor: '#B45309',
    trackBg: '#fef3c7',
    fillColor: '#F59E0B',
  },
  {
    key: 'finances' as const,
    label: 'Finances',
    sub: 'Admin sets up',
    headStyle: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
    colBg: 'rgba(139,92,246,0.05)',
    colBorder: 'rgba(139,92,246,0.22)',
    activeColor: '#6D28D9',
    trackBg: '#ede9fe',
    fillColor: '#8B5CF6',
  },
  {
    key: 'listings' as const,
    label: 'Listings',
    sub: 'Admin + owner both see',
    headStyle: 'linear-gradient(135deg, #02AAEB, #1B77BE)',
    colBg: 'rgba(2,170,235,0.05)',
    colBorder: 'rgba(2,170,235,0.22)',
    activeColor: '#1B77BE',
    trackBg: '#e0f2fe',
    fillColor: '#02AAEB',
  },
] as const;

type PhaseKey = 'documents' | 'finances' | 'listings';

export async function OnboardingPhaseBoard({ rows, basePath = '/admin/people', useEntityId = false }: Props) {
  const onboardingRows = rows.filter((r) => r.lifecycleStage === 'onboarding');
  const phaseCounts = await fetchOnboardingPhaseCounts(onboardingRows);

  const byPhase: Record<PhaseKey, ContactRow[]> = {
    documents: [],
    finances:  [],
    listings:  [],
  };

  for (const row of onboardingRows) {
    const counts = phaseCounts[row.id];
    if (!counts) {
      byPhase.documents.push(row);
      continue;
    }
    byPhase[currentPhase(counts)].push(row);
  }

  return (
    <div className={styles.board}>
      {PHASES.map((phase) => {
        const contactsInPhase = byPhase[phase.key];
        return (
          <div
            key={phase.key}
            className={styles.col}
            style={{ background: phase.colBg, border: `1px solid ${phase.colBorder}` }}
          >
            <header
              className={styles.colHead}
              style={{ background: phase.headStyle }}
            >
              <div className={styles.colTitle}>{phase.label}</div>
              <div className={styles.colSub}>{phase.sub}</div>
              <div className={styles.colCount}>{contactsInPhase.length} owner{contactsInPhase.length !== 1 ? 's' : ''}</div>
            </header>

            <div className={styles.colBody}>
              {contactsInPhase.length === 0 ? (
                <div className={styles.emptyCol}>No owners in this phase</div>
              ) : (
                contactsInPhase.map((row) => {
                  const counts = phaseCounts[row.id];
                  const href = `${basePath}/${useEntityId ? (row.entityId ?? row.id) : row.id}`;

                  return (
                    <Link key={row.id} href={href} className={styles.card}>
                      <div className={styles.cardTop}>
                        <div
                          className={styles.avatar}
                          style={{ background: avatarGradient(row.id) }}
                        >
                          {initials(row.fullName)}
                        </div>
                        <div>
                          <div className={styles.cardName}>{row.fullName}</div>
                          <div className={styles.cardMeta}>
                            {row.propertyCount} prop{row.propertyCount !== 1 ? 's' : ''} · {daysSinceStage(row.stageChangedAt)}
                          </div>
                        </div>
                      </div>

                      {counts && (
                        <div className={styles.phases}>
                          {PHASES.map((p) => {
                            const pc = counts[p.key];
                            const isActive = p.key === phase.key;
                            const isDone = pc.done >= pc.total;
                            const pct = pc.total === 0 ? 0 : Math.round((pc.done / pc.total) * 100);

                            let rowClass = styles.phaseRow;
                            if (!isActive && isDone) rowClass += ` ${styles.done}`;
                            if (!isActive && !isDone) rowClass += ` ${styles.dim}`;

                            const nameColor = isDone ? '#10B981' : isActive ? p.activeColor : '#94a3b8';
                            const fillColor = isDone ? '#10B981' : p.fillColor;
                            const trackBg   = isDone ? '#dcfce7'  : p.trackBg;

                            return (
                              <div key={p.key} className={rowClass}>
                                <div className={styles.phaseLabel}>
                                  <span className={styles.phaseName} style={{ color: nameColor }}>
                                    {p.label}{isDone ? ' ✓' : ''}
                                  </span>
                                  <span className={styles.phaseFrac} style={{ color: nameColor }}>
                                    {pc.done}/{pc.total}
                                  </span>
                                </div>
                                <div className={styles.phaseTrack} style={{ background: trackBg }}>
                                  <div
                                    className={styles.phaseFill}
                                    style={{ width: `${pct}%`, background: fillColor }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
