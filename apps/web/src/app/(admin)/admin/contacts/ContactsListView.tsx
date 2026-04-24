'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import type { ContactRow, ContactSavedView } from '@/lib/admin/contact-types';
import { stageLabel, stageGroup } from '@/lib/admin/lifecycle-stage';
import { useContactsFilters, matchesAssigneeFilter } from './ContactsFiltersProvider';
import styles from './ContactsListView.module.css';

type Props = {
  rows: ContactRow[];
  activeView: ContactSavedView;
  basePath?: string;
};

const STAGE_PILL_CLASS: Record<ReturnType<typeof stageGroup>, string> = {
  lead: styles.pillLead,
  onboarding: styles.pillOnboarding,
  active: styles.pillActive,
  cold: styles.pillCold,
  dormant: styles.pillDormant,
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function relativeTime(iso: string | null): string {
  if (!iso) return '-';
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86400_000);
  if (days < 1) return 'today';
  if (days === 1) return '1d';
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(months / 12)}y`;
}

export function ContactsListView({ rows, activeView, basePath = '/admin/contacts' }: Props) {
  const [search, setSearch] = useState('');
  const { sources, assignees } = useContactsFilters();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (sources.length > 0 && (!r.source || !sources.includes(r.source))) {
        return false;
      }
      if (!matchesAssigneeFilter(assignees, r.assignedTo)) return false;
      if (!q) return true;
      return (r.fullName + ' ' + (r.companyName ?? '') + ' ' + (r.email ?? ''))
        .toLowerCase()
        .includes(q);
    });
  }, [rows, search, sources, assignees]);

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <input
          type="text"
          className={styles.search}
          placeholder={`Search ${activeView.name.toLowerCase()}`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className={styles.toolbarMeta}>
          {filtered.length} of {rows.length}
        </div>
      </div>

      <div className={styles.tableWrap}>
        <div className={styles.rowHead}>
          <div>Contact</div>
          <div>Email</div>
          <div>Phone</div>
          <div>Stage</div>
          <div className={styles.numCol}>Properties</div>
          <div className={styles.numCol}>Last activity</div>
          <div />
        </div>

        {filtered.map((r) => {
          const href = r.profileId
            ? `/admin/owners/${r.profileId}`
            : `${basePath}/${r.id}`;
          const pillClass = STAGE_PILL_CLASS[stageGroup(r.lifecycleStage)];
          return (
            <Link key={r.id} href={href} className={styles.row}>
              <div className={styles.cellContact}>
                {r.avatarUrl ? (
                  <Image
                    src={r.avatarUrl}
                    alt=""
                    width={36}
                    height={36}
                    className={styles.avatar}
                  />
                ) : (
                  <div className={styles.avatarFallback} aria-hidden>
                    {initials(r.fullName)}
                  </div>
                )}
                <div className={styles.name}>
                  <div className={styles.nameText}>{r.fullName}</div>
                  {r.companyName ? (
                    <div className={styles.company}>{r.companyName}</div>
                  ) : null}
                </div>
              </div>
              <div className={styles.cellMono}>{r.email ?? '-'}</div>
              <div className={styles.cellMono}>{r.phone ?? '-'}</div>
              <div>
                <span className={`${styles.pill} ${pillClass}`}>
                  {stageLabel(r.lifecycleStage)}
                </span>
              </div>
              <div className={styles.numCol}>{r.propertyCount}</div>
              <div className={styles.numCol}>
                {relativeTime(r.lastActivityAt)}
              </div>
              <div className={styles.chevron}>›</div>
            </Link>
          );
        })}

        {filtered.length === 0 ? (
          <div className={styles.empty}>
            No contacts match this view{search ? ` with "${search}"` : ''}.
          </div>
        ) : null}
      </div>
    </div>
  );
}
