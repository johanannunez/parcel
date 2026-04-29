'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState, useRef, useEffect } from 'react';
import type { ContactRow, ContactSavedView, StageGroup } from '@/lib/admin/contact-types';
import { stageLabel, stageGroup } from '@/lib/admin/lifecycle-stage';
import { useContactsFilters, matchesAssigneeFilter } from './ContactsFiltersProvider';
import { FunnelSimple, X, Check } from '@phosphor-icons/react';
import styles from './ContactsListView.module.css';

type Props = {
  rows: ContactRow[];
  activeView: ContactSavedView;
  basePath?: string;
  useEntityId?: boolean;
};

type LocalFilters = {
  stageGroups: StageGroup[];
  activityWindow: '1d' | '7d' | '30d' | '90d' | null;
  propCountMin: 0 | 1 | 2 | null;
};

const EMPTY_LOCAL: LocalFilters = { stageGroups: [], activityWindow: null, propCountMin: null };

const STAGE_GROUP_LABELS: Record<StageGroup, string> = {
  lead: 'Lead',
  onboarding: 'Onboarding',
  active: 'Active',
  cold: 'Cold',
  dormant: 'Dormant',
};

const ACTIVITY_OPTIONS: { value: '1d' | '7d' | '30d' | '90d'; label: string }[] = [
  { value: '1d', label: 'Today' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
];

const PROP_COUNT_OPTIONS: { value: 0 | 1 | 2; label: string }[] = [
  { value: 0, label: 'None' },
  { value: 1, label: '1+' },
  { value: 2, label: '2+' },
];

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

function ContactsFilterPanel({
  local,
  sources,
  assignees,
  availableSources,
  availableAssignees,
  onChangeLocal,
  onChangeSources,
  onChangeAssignees,
  onClear,
}: {
  local: LocalFilters;
  sources: string[];
  assignees: string[];
  availableSources: string[];
  availableAssignees: { name: string; displayName: string; count: number }[];
  onChangeLocal: (f: LocalFilters) => void;
  onChangeSources: (v: string[]) => void;
  onChangeAssignees: (v: string[]) => void;
  onClear: () => void;
}) {
  const toggle = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const hasActive =
    local.stageGroups.length > 0 ||
    local.activityWindow !== null ||
    local.propCountMin !== null ||
    sources.length > 0 ||
    assignees.length > 0;

  return (
    <div className={styles.filterPanel} onClick={(e) => e.stopPropagation()}>
      <div className={styles.filterPanelHeader}>
        <span className={styles.filterPanelTitle}>Filters</span>
        {hasActive && (
          <button type="button" className={styles.filterClearBtn} onClick={onClear}>
            Clear all
          </button>
        )}
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterSectionLabel}>Stage</div>
        <div className={styles.filterPillRow}>
          {(Object.keys(STAGE_GROUP_LABELS) as StageGroup[]).map((sg) => {
            const active = local.stageGroups.includes(sg);
            return (
              <button
                key={sg}
                type="button"
                className={`${styles.filterPill} ${active ? styles.filterPillActive : ''}`}
                onClick={() => onChangeLocal({ ...local, stageGroups: toggle(local.stageGroups, sg) })}
              >
                {STAGE_GROUP_LABELS[sg]}
              </button>
            );
          })}
        </div>
      </div>

      {availableSources.length > 0 && (
        <div className={styles.filterSection}>
          <div className={styles.filterSectionLabel}>Source</div>
          <div className={styles.filterPillRow}>
            {availableSources.map((src) => {
              const active = sources.includes(src);
              return (
                <button
                  key={src}
                  type="button"
                  className={`${styles.filterPill} ${active ? styles.filterPillActive : ''}`}
                  onClick={() => onChangeSources(toggle(sources, src))}
                >
                  {src}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {availableAssignees.length > 0 && (
        <div className={styles.filterSection}>
          <div className={styles.filterSectionLabel}>Assignee</div>
          <div className={styles.filterAssigneeList}>
            {availableAssignees.map((a) => {
              const active = assignees.includes(a.name);
              return (
                <button
                  key={a.name}
                  type="button"
                  className={`${styles.filterAssigneeItem} ${active ? styles.filterAssigneeItemActive : ''}`}
                  onClick={() => onChangeAssignees(toggle(assignees, a.name))}
                >
                  <span className={styles.filterAvatarFallback}>
                    {a.displayName.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                  </span>
                  <span className={styles.filterAssigneeName}>{a.displayName}</span>
                  <span className={styles.filterAssigneeCount}>{a.count}</span>
                  {active && <Check size={12} className={styles.filterCheck} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className={styles.filterSection}>
        <div className={styles.filterSectionLabel}>Last Activity</div>
        <div className={styles.filterPillRow}>
          {ACTIVITY_OPTIONS.map(({ value, label }) => {
            const active = local.activityWindow === value;
            return (
              <button
                key={value}
                type="button"
                className={`${styles.filterPill} ${active ? styles.filterPillActive : ''}`}
                onClick={() => onChangeLocal({ ...local, activityWindow: active ? null : value })}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterSectionLabel}>Properties</div>
        <div className={styles.filterPillRow}>
          {PROP_COUNT_OPTIONS.map(({ value, label }) => {
            const active = local.propCountMin === value;
            return (
              <button
                key={value}
                type="button"
                className={`${styles.filterPill} ${active ? styles.filterPillActive : ''}`}
                onClick={() => onChangeLocal({ ...local, propCountMin: active ? null : value })}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ContactsFilterChips({
  local,
  sources,
  assignees,
  onChangeLocal,
  onChangeSources,
  onChangeAssignees,
  onClear,
}: {
  local: LocalFilters;
  sources: string[];
  assignees: string[];
  onChangeLocal: (f: LocalFilters) => void;
  onChangeSources: (v: string[]) => void;
  onChangeAssignees: (v: string[]) => void;
  onClear: () => void;
}) {
  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  for (const sg of local.stageGroups) {
    chips.push({
      key: `sg:${sg}`,
      label: STAGE_GROUP_LABELS[sg],
      onRemove: () => onChangeLocal({ ...local, stageGroups: local.stageGroups.filter((x) => x !== sg) }),
    });
  }
  for (const src of sources) {
    chips.push({
      key: `src:${src}`,
      label: src,
      onRemove: () => onChangeSources(sources.filter((x) => x !== src)),
    });
  }
  for (const asg of assignees) {
    chips.push({
      key: `asg:${asg}`,
      label: asg,
      onRemove: () => onChangeAssignees(assignees.filter((x) => x !== asg)),
    });
  }
  if (local.activityWindow) {
    const aw = local.activityWindow;
    const label = ACTIVITY_OPTIONS.find((o) => o.value === aw)?.label ?? aw;
    chips.push({
      key: `aw:${aw}`,
      label,
      onRemove: () => onChangeLocal({ ...local, activityWindow: null }),
    });
  }
  if (local.propCountMin !== null) {
    const pm = local.propCountMin;
    const label = PROP_COUNT_OPTIONS.find((o) => o.value === pm)?.label ?? String(pm);
    chips.push({
      key: `pm:${pm}`,
      label: `Props: ${label}`,
      onRemove: () => onChangeLocal({ ...local, propCountMin: null }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className={styles.chips}>
      {chips.map((c) => (
        <span key={c.key} className={styles.chip}>
          <span className={styles.chipLabel}>{c.label}</span>
          <button
            type="button"
            className={styles.chipRemove}
            onClick={c.onRemove}
            aria-label={`Remove ${c.label} filter`}
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <button type="button" className={styles.chipClearAll} onClick={onClear}>
        Clear all
      </button>
    </div>
  );
}

export function ContactsListView({ rows, activeView, basePath = '/admin/contacts', useEntityId = false }: Props) {
  const [search, setSearch] = useState('');
  const [localFilters, setLocalFilters] = useState<LocalFilters>(EMPTY_LOCAL);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const filterBtnRef = useRef<HTMLButtonElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  const { sources, assignees, setSources, setAssignees, clear: clearContext } = useContactsFilters();

  useEffect(() => {
    if (!showFilterPanel) return;
    function handleMouseDown(e: MouseEvent) {
      if (
        filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node) &&
        filterBtnRef.current && !filterBtnRef.current.contains(e.target as Node)
      ) setShowFilterPanel(false);
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [showFilterPanel]);

  function clearAll() {
    clearContext();
    setLocalFilters(EMPTY_LOCAL);
  }

  const availableSources = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) { if (r.source) set.add(r.source); }
    return Array.from(set).sort();
  }, [rows]);

  const availableAssignees = useMemo(() => {
    const map = new Map<string, { name: string; displayName: string; count: number }>();
    for (const r of rows) {
      if (!r.assignedTo) continue;
      const entry = map.get(r.assignedTo);
      if (entry) { entry.count++; }
      else { map.set(r.assignedTo, { name: r.assignedTo, displayName: r.assignedToName ?? r.assignedTo, count: 1 }); }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [rows]);

  const activeFilterCount =
    localFilters.stageGroups.length +
    (localFilters.activityWindow ? 1 : 0) +
    (localFilters.propCountMin !== null ? 1 : 0) +
    sources.length +
    assignees.length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (sources.length > 0 && (!r.source || !sources.includes(r.source))) return false;
      if (!matchesAssigneeFilter(assignees, r.assignedTo)) return false;
      if (localFilters.stageGroups.length > 0 && !localFilters.stageGroups.includes(stageGroup(r.lifecycleStage))) return false;
      if (localFilters.activityWindow) {
        const windowMs = { '1d': 86400_000, '7d': 7 * 86400_000, '30d': 30 * 86400_000, '90d': 90 * 86400_000 }[localFilters.activityWindow];
        const lastMs = r.lastActivityAt ? Date.now() - new Date(r.lastActivityAt).getTime() : Infinity;
        if (lastMs > windowMs) return false;
      }
      if (localFilters.propCountMin !== null) {
        if (localFilters.propCountMin === 0 && r.propertyCount !== 0) return false;
        if (localFilters.propCountMin === 1 && r.propertyCount < 1) return false;
        if (localFilters.propCountMin === 2 && r.propertyCount < 2) return false;
      }
      if (!q) return true;
      return (r.fullName + ' ' + (r.companyName ?? '') + ' ' + (r.email ?? '')).toLowerCase().includes(q);
    });
  }, [rows, search, sources, assignees, localFilters]);

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

        <div style={{ position: 'relative' }}>
          <button
            ref={filterBtnRef}
            type="button"
            className={`${styles.toolbarBtn} ${showFilterPanel || activeFilterCount > 0 ? styles.toolbarBtnActive : ''}`}
            onClick={() => setShowFilterPanel((v) => !v)}
            aria-label="Filter contacts"
          >
            <FunnelSimple size={14} />
            Filter
            {activeFilterCount > 0 && (
              <span className={styles.toolbarBtnBadge}>{activeFilterCount}</span>
            )}
          </button>
          {showFilterPanel && (
            <div ref={filterPanelRef} className={styles.filterPanelWrap}>
              <ContactsFilterPanel
                local={localFilters}
                sources={sources}
                assignees={assignees}
                availableSources={availableSources}
                availableAssignees={availableAssignees}
                onChangeLocal={setLocalFilters}
                onChangeSources={setSources}
                onChangeAssignees={setAssignees}
                onClear={clearAll}
              />
            </div>
          )}
        </div>

        <div className={styles.toolbarMeta}>
          {filtered.length} of {rows.length}
        </div>
      </div>

      <ContactsFilterChips
        local={localFilters}
        sources={sources}
        assignees={assignees}
        onChangeLocal={setLocalFilters}
        onChangeSources={setSources}
        onChangeAssignees={setAssignees}
        onClear={clearAll}
      />

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
            : `${basePath}/${useEntityId ? (r.entityId ?? r.id) : r.id}`;
          const pillClass = STAGE_PILL_CLASS[stageGroup(r.lifecycleStage)];
          return (
            <Link key={r.id} href={href} className={styles.row}>
              <div className={styles.cellContact}>
                {r.avatarUrl ? (
                  <Image src={r.avatarUrl} alt="" width={36} height={36} className={styles.avatar} />
                ) : (
                  <div className={styles.avatarFallback} aria-hidden>
                    {initials(r.fullName)}
                  </div>
                )}
                <div className={styles.name}>
                  <div className={styles.nameText}>{r.fullName}</div>
                  {r.companyName ? <div className={styles.company}>{r.companyName}</div> : null}
                </div>
              </div>
              <div className={styles.cellMono}>{r.email ?? '-'}</div>
              <div className={styles.cellMono}>{r.phone ?? '-'}</div>
              <div>
                <span className={`${styles.pill} ${pillClass}`}>{stageLabel(r.lifecycleStage)}</span>
              </div>
              <div className={styles.numCol}>{r.propertyCount}</div>
              <div className={styles.numCol}>{relativeTime(r.lastActivityAt)}</div>
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
