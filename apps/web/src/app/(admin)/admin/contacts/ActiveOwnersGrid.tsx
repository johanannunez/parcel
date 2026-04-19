'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { ContactRow } from '@/lib/admin/contact-types';
import { useContactsFilters, matchesAssigneeFilter } from './ContactsFiltersProvider';
import styles from './ActiveOwnersGrid.module.css';

type Props = {
  rows: ContactRow[];
};

type HealthTone = 'healthy' | 'attention' | 'risk';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400_000));
}

function relativeTime(days: number | null): string {
  if (days === null) return '—';
  if (days < 1) return 'today';
  if (days === 1) return '1d';
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(months / 12)}y`;
}

function healthFor(days: number | null): HealthTone {
  if (days === null || days > 30) return 'risk';
  if (days > 7) return 'attention';
  return 'healthy';
}

const HEALTH_COPY: Record<HealthTone, string> = {
  healthy: 'Healthy',
  attention: 'Needs attention',
  risk: 'At risk',
};

export function ActiveOwnersGrid({ rows }: Props) {
  const { sources, assignees } = useContactsFilters();

  const filteredRows = useMemo(() => {
    if (sources.length === 0 && assignees.length === 0) return rows;
    return rows.filter((r) => {
      if (sources.length > 0 && (!r.source || !sources.includes(r.source))) {
        return false;
      }
      if (!matchesAssigneeFilter(assignees, r.assignedTo)) return false;
      return true;
    });
  }, [rows, sources, assignees]);

  if (filteredRows.length === 0) {
    return <div className={styles.empty}>No active owners match the current filters.</div>;
  }

  // Bucket for summary + optional sub-tabs later.
  const buckets: Record<HealthTone, number> = { healthy: 0, attention: 0, risk: 0 };
  for (const r of filteredRows) {
    buckets[healthFor(daysSince(r.lastActivityAt))]++;
  }
  const totalProperties = filteredRows.reduce((sum, r) => sum + r.propertyCount, 0);

  return (
    <div className={styles.wrap}>
      <div className={styles.summary}>
        <span className={styles.summaryItem}>
          <span className={styles.dotHealthy} aria-hidden />
          <strong>{buckets.healthy}</strong> healthy
        </span>
        <span className={styles.summaryItem}>
          <span className={styles.dotAttention} aria-hidden />
          <strong>{buckets.attention}</strong> need attention
        </span>
        <span className={styles.summaryItem}>
          <span className={styles.dotRisk} aria-hidden />
          <strong>{buckets.risk}</strong> at risk
        </span>
        <span className={styles.summarySep} aria-hidden />
        <span className={styles.summaryItem}>
          <strong>{totalProperties}</strong> <span className={styles.muted}>properties under management</span>
        </span>
      </div>

      <div className={styles.grid}>
        {filteredRows.map((r) => {
          const days = daysSince(r.lastActivityAt);
          const health = healthFor(days);
          const href = r.profileId
            ? `/admin/owners/${r.profileId}`
            : `/admin/contacts/${r.id}`;
          return (
            <Link key={r.id} href={href} className={styles.card}>
              <header className={styles.head}>
                <span className={styles.avatar} aria-hidden>
                  {initials(r.fullName)}
                </span>
                <div className={styles.identity}>
                  <div className={styles.name}>{r.fullName}</div>
                  {r.companyName ? (
                    <div className={styles.company}>{r.companyName}</div>
                  ) : null}
                </div>
                <span
                  className={styles.health}
                  data-tone={health}
                  title={HEALTH_COPY[health]}
                  aria-label={HEALTH_COPY[health]}
                />
              </header>

              <div className={styles.stats}>
                <Stat label="Props" value={String(r.propertyCount)} />
                <Stat
                  label="Owner since"
                  value={relativeTime(daysSince(r.stageChangedAt))}
                />
                <Stat label="Last" value={relativeTime(days)} />
              </div>

              <footer className={styles.foot}>
                <span className={styles.owner}>
                  {r.assignedToName ? (
                    <>
                      <span className={styles.ownerDot} aria-hidden />
                      {r.assignedToName}
                    </>
                  ) : (
                    <span className={styles.muted}>Unassigned</span>
                  )}
                </span>
                {r.email ? <span className={styles.email}>{r.email}</span> : null}
              </footer>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
    </div>
  );
}
