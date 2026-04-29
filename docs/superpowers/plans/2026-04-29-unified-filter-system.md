# Unified Filter System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a consistent filter button + popover + chip-strip pattern to all three admin list pages (Tasks, Clients, Properties), each with contextually relevant filter sections.

**Architecture:** Tasks already has the complete filter infrastructure and only needs a Parent Type section added. Clients and Properties each get a self-contained inline filter panel (local state, no new context), using the same visual pattern: `FunnelSimple` button opens a popover with pill-based sections, selected filters render as removable chips below the toolbar.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS Modules, Phosphor Icons (`FunnelSimple`, `X`, `Check`)

---

## File Map

| File | Change |
|---|---|
| `apps/web/src/app/(admin)/admin/tasks/TasksListView.tsx` | Add `parentTypes` to FilterState; add Parent section to FilterPanel and FilterChips; extend activeFilterGroups |
| `apps/web/src/app/(admin)/admin/contacts/ContactsListView.tsx` | Add local filter state, ContactsFilterPanel, ContactsFilterChips, filter button, extend filtered useMemo |
| `apps/web/src/app/(admin)/admin/contacts/ContactsListView.module.css` | Add filter panel, chip, and toolbar-btn CSS classes |
| `apps/web/src/app/(admin)/admin/properties/HomesView.tsx` | Add local filter state, PropertiesFilterPanel, PropertiesFilterChips, filter bar, extend filtered useMemo |
| `apps/web/src/app/(admin)/admin/properties/HomesView.module.css` | Add filter panel, chip, and toolbar-btn CSS classes |

---

### Task 1: Add Parent Type filter to Tasks page

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/tasks/TasksListView.tsx`

- [ ] **Step 1: Verify TypeScript baseline compiles clean**

```bash
cd /Users/johanannunez/workspace/parcel/.worktrees/taskos/apps/web && pnpm exec tsc --noEmit 2>&1 | head -30
```

Expected: zero errors (or only pre-existing errors unrelated to this task).

- [ ] **Step 2: Update FilterState, EMPTY_FILTERS, countActiveFilters, and add PARENT_TYPE_LABELS**

In `TasksListView.tsx`, change the import on line 4 to include `ParentType`:

```typescript
import type { Task, TasksSavedView, TasksFetchResult, TaskStatus, ParentType } from '@/lib/admin/task-types';
```

Replace the `FilterState` type (lines 23-28):

```typescript
type FilterState = {
  assignees: string[];
  priorities: (1 | 2 | 3 | 4)[];
  dueBucket: DueBucket | null;
  statuses: TaskStatus[];
  parentTypes: (ParentType | 'standalone')[];
};
```

Replace `EMPTY_FILTERS` (line 32):

```typescript
const EMPTY_FILTERS: FilterState = { assignees: [], priorities: [], dueBucket: null, statuses: [], parentTypes: [] };
```

Replace `countActiveFilters` (lines 55-57):

```typescript
function countActiveFilters(f: FilterState): number {
  return f.assignees.length + f.priorities.length + (f.dueBucket ? 1 : 0) + f.statuses.length + f.parentTypes.length;
}
```

Add `PARENT_TYPE_LABELS` after `STATUS_OPTIONS` (after line 47):

```typescript
const PARENT_TYPE_LABELS: Record<ParentType | 'standalone', string> = {
  contact: 'Contact',
  property: 'Property',
  project: 'Project',
  standalone: 'Standalone',
};
```

- [ ] **Step 3: Add Parent section to FilterPanel**

Inside `FilterPanel`, after the Status section (after the closing `</div>` of the Status section, before the final `</div>` that closes `filterPanel`):

```tsx
<div className={styles.filterSection}>
  <div className={styles.filterSectionLabel}>Parent</div>
  <div className={styles.filterPillRow}>
    {(['contact', 'property', 'project', 'standalone'] as const).map((pt) => {
      const active = filters.parentTypes.includes(pt);
      return (
        <button
          key={pt}
          type="button"
          className={`${styles.filterPill} ${active ? styles.filterPillActive : ''}`}
          onClick={() => onChange({ ...filters, parentTypes: toggle(filters.parentTypes, pt) })}
        >
          {PARENT_TYPE_LABELS[pt]}
        </button>
      );
    })}
  </div>
</div>
```

- [ ] **Step 4: Add parent chips to FilterChips**

Inside `FilterChips`, after the `for (const s of filters.statuses)` loop and before `if (groupBy !== 'none')`:

```typescript
for (const pt of filters.parentTypes) {
  chips.push({
    key: `pt:${pt}`,
    label: PARENT_TYPE_LABELS[pt],
    onRemove: () => onChange({ ...filters, parentTypes: filters.parentTypes.filter((x) => x !== pt) }),
  });
}
```

- [ ] **Step 5: Update activeFilterGroups to filter by parentTypes**

Replace the `activeFilterGroups` useMemo (lines 477-494):

```typescript
const activeFilterGroups = useMemo(() => {
  const { assignees, priorities, dueBucket, statuses, parentTypes } = filters;
  const hasFilter =
    assignees.length > 0 || priorities.length > 0 || dueBucket || statuses.length > 0 || parentTypes.length > 0;
  if (!hasFilter) return filteredGroups;

  return filteredGroups
    .filter((g) => !dueBucket || g.bucket === dueBucket)
    .map((g) => ({
      ...g,
      tasks: g.tasks.filter((t) => {
        if (assignees.length > 0 && !assignees.includes(t.assigneeName ?? '')) return false;
        if (priorities.length > 0 && !priorities.includes(t.priority)) return false;
        if (statuses.length > 0 && !statuses.includes(t.status)) return false;
        if (parentTypes.length > 0) {
          const taskParentType: ParentType | 'standalone' = t.parent ? t.parent.type : 'standalone';
          if (!parentTypes.includes(taskParentType)) return false;
        }
        return true;
      }),
    }))
    .filter((g) => g.tasks.length > 0);
}, [filteredGroups, filters]);
```

- [ ] **Step 6: Verify TypeScript passes**

```bash
cd /Users/johanannunez/workspace/parcel/.worktrees/taskos/apps/web && pnpm exec tsc --noEmit 2>&1 | head -30
```

Expected: zero errors.

- [ ] **Step 7: Commit**

```bash
cd /Users/johanannunez/workspace/parcel/.worktrees/taskos && git add apps/web/src/app/\(admin\)/admin/tasks/TasksListView.tsx && git commit -m "feat(tasks): add Parent Type filter section to filter panel"
```

---

### Task 2: Build Clients filter panel

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/contacts/ContactsListView.tsx`
- Modify: `apps/web/src/app/(admin)/admin/contacts/ContactsListView.module.css`

- [ ] **Step 1: Add imports and local filter state types to ContactsListView.tsx**

Replace the existing import block at the top of `ContactsListView.tsx`. Change:

```typescript
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import type { ContactRow, ContactSavedView } from '@/lib/admin/contact-types';
import { stageLabel, stageGroup } from '@/lib/admin/lifecycle-stage';
import { useContactsFilters, matchesAssigneeFilter } from './ContactsFiltersProvider';
import styles from './ContactsListView.module.css';
```

To:

```typescript
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState, useRef, useEffect } from 'react';
import type { ContactRow, ContactSavedView, StageGroup } from '@/lib/admin/contact-types';
import { stageLabel, stageGroup } from '@/lib/admin/lifecycle-stage';
import { useContactsFilters, matchesAssigneeFilter } from './ContactsFiltersProvider';
import { FunnelSimple, X, Check } from '@phosphor-icons/react';
import styles from './ContactsListView.module.css';

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
```

- [ ] **Step 2: Add ContactsFilterPanel component**

Insert this function before `ContactsListView` (after the `PROP_COUNT_OPTIONS` constant):

```typescript
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
          {(['lead', 'onboarding', 'active', 'cold', 'dormant'] as StageGroup[]).map((sg) => {
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
```

- [ ] **Step 3: Add ContactsFilterChips component**

Insert this function immediately after `ContactsFilterPanel`:

```typescript
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
```

- [ ] **Step 4: Update ContactsListView with filter state, popover, and filter button**

Replace the `ContactsListView` function entirely with this version:

```typescript
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
```

- [ ] **Step 5: Add filter CSS classes to ContactsListView.module.css**

Append these classes to the end of `apps/web/src/app/(admin)/admin/contacts/ContactsListView.module.css`:

```css
/* Filter button */
.toolbarBtn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}
.toolbarBtn:hover {
  border-color: var(--color-brand);
  color: var(--color-brand);
}
.toolbarBtnActive {
  border-color: var(--color-brand);
  background: color-mix(in srgb, var(--color-brand) 8%, transparent);
  color: var(--color-brand);
}
.toolbarBtnBadge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 99px;
  background: var(--color-brand);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
}

/* Filter popover wrapper */
.filterPanelWrap {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 50;
}

/* Filter panel */
.filterPanel {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  min-width: 260px;
  max-width: 320px;
}
.filterPanelHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.filterPanelTitle {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.filterClearBtn {
  font-size: 12px;
  color: var(--color-brand);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.filterClearBtn:hover { text-decoration: underline; }

/* Filter sections */
.filterSection {
  margin-bottom: 10px;
}
.filterSection:last-child { margin-bottom: 0; }
.filterSectionLabel {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 5px;
}

/* Pills */
.filterPillRow {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.filterPill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 9px;
  border: 1px solid var(--color-border);
  border-radius: 99px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: border-color 0.12s, background 0.12s, color 0.12s;
}
.filterPill:hover {
  border-color: var(--color-brand);
  color: var(--color-brand);
}
.filterPillActive {
  border-color: var(--color-brand);
  background: color-mix(in srgb, var(--color-brand) 10%, transparent);
  color: var(--color-brand);
}

/* Assignee list */
.filterAssigneeList {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.filterAssigneeItem {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 4px 6px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background 0.1s;
}
.filterAssigneeItem:hover { background: var(--color-surface-hover); }
.filterAssigneeItemActive { background: color-mix(in srgb, var(--color-brand) 8%, transparent); }
.filterAvatarFallback {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-brand);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.filterAssigneeName {
  flex: 1;
  font-size: 13px;
  color: var(--color-text-primary);
}
.filterAssigneeCount {
  font-size: 11px;
  color: var(--color-text-secondary);
}
.filterCheck { color: var(--color-brand); margin-left: auto; }

/* Chips */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 0 0 8px;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 8px 0 10px;
  border-radius: 99px;
  background: color-mix(in srgb, var(--color-brand) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-brand) 30%, transparent);
  font-size: 12px;
  color: var(--color-brand);
}
.chipLabel { line-height: 1; }
.chipRemove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--color-brand);
  cursor: pointer;
  padding: 0;
  opacity: 0.7;
}
.chipRemove:hover { opacity: 1; background: color-mix(in srgb, var(--color-brand) 20%, transparent); }
.chipClearAll {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border: 1px solid var(--color-border);
  border-radius: 99px;
  background: transparent;
  font-size: 12px;
  color: var(--color-text-secondary);
  cursor: pointer;
}
.chipClearAll:hover { border-color: var(--color-brand); color: var(--color-brand); }
```

- [ ] **Step 6: Verify TypeScript passes**

```bash
cd /Users/johanannunez/workspace/parcel/.worktrees/taskos/apps/web && pnpm exec tsc --noEmit 2>&1 | head -30
```

Expected: zero errors.

- [ ] **Step 7: Commit**

```bash
cd /Users/johanannunez/workspace/parcel/.worktrees/taskos && git add apps/web/src/app/\(admin\)/admin/contacts/ && git commit -m "feat(contacts): add inline filter panel with stage, source, assignee, activity, and property count filters"
```

---

### Task 3: Build Properties filter panel

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/properties/HomesView.tsx`
- Modify: `apps/web/src/app/(admin)/admin/properties/HomesView.module.css`

- [ ] **Step 1: Add imports and local filter types to HomesView.tsx**

Replace the import block at the top of `HomesView.tsx`. Change:

```typescript
"use client";

import { useMemo, useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import styles from "./HomesView.module.css";
import type { HomesProperty } from "./homes-types";
import { GalleryCard } from "./GalleryCard";
import { HomesTable } from "./HomesTable";
import { PropertyDrawer } from "./PropertyDrawer";
import { usePropertiesFilter } from "./PropertiesFilterContext";
import { usePropertiesMode } from "./PropertiesModeContext";
```

To:

```typescript
"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { CaretDown, FunnelSimple, X, Check } from "@phosphor-icons/react";
import styles from "./HomesView.module.css";
import type { HomesProperty } from "./homes-types";
import { resolveOccupancy } from "./homes-types";
import { GalleryCard } from "./GalleryCard";
import { HomesTable } from "./HomesTable";
import { PropertyDrawer } from "./PropertyDrawer";
import { usePropertiesFilter } from "./PropertiesFilterContext";
import { usePropertiesMode } from "./PropertiesModeContext";

type PropFilters = {
  occupancies: ("occupied" | "upcoming" | "vacant")[];
  homeTypes: string[];
  bedrooms: (1 | 2 | 3 | 4 | 5)[];
  cities: string[];
};

const EMPTY_PROP_FILTERS: PropFilters = {
  occupancies: [],
  homeTypes: [],
  bedrooms: [],
  cities: [],
};

const OCCUPANCY_OPTIONS: { value: "occupied" | "upcoming" | "vacant"; label: string; color: string }[] = [
  { value: "occupied", label: "Occupied", color: "#f59e0b" },
  { value: "upcoming", label: "Upcoming", color: "#60a5fa" },
  { value: "vacant", label: "Vacant", color: "#22c55e" },
];

const BEDROOM_OPTIONS: { value: 1 | 2 | 3 | 4 | 5; label: string }[] = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5+" },
];
```

- [ ] **Step 2: Add PropertiesFilterPanel component**

Insert this function before the `HomesView` function export:

```typescript
function PropertiesFilterPanel({
  filters,
  onChange,
  onClear,
  availableTypes,
  availableCities,
}: {
  filters: PropFilters;
  onChange: (f: PropFilters) => void;
  onClear: () => void;
  availableTypes: string[];
  availableCities: string[];
}) {
  const toggle = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const hasActive =
    filters.occupancies.length > 0 ||
    filters.homeTypes.length > 0 ||
    filters.bedrooms.length > 0 ||
    filters.cities.length > 0;

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
        <div className={styles.filterSectionLabel}>Occupancy</div>
        <div className={styles.filterPillRow}>
          {OCCUPANCY_OPTIONS.map(({ value, label, color }) => {
            const active = filters.occupancies.includes(value);
            return (
              <button
                key={value}
                type="button"
                className={`${styles.filterPill} ${active ? styles.filterPillActive : ""}`}
                style={active ? { borderColor: color, color, background: `${color}18` } : undefined}
                onClick={() => onChange({ ...filters, occupancies: toggle(filters.occupancies, value) })}
              >
                <span className={styles.filterOccupancyDot} style={{ background: color }} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {availableTypes.length > 0 && (
        <div className={styles.filterSection}>
          <div className={styles.filterSectionLabel}>Property Type</div>
          <div className={styles.filterPillRow}>
            {availableTypes.map((ht) => {
              const active = filters.homeTypes.includes(ht);
              return (
                <button
                  key={ht}
                  type="button"
                  className={`${styles.filterPill} ${active ? styles.filterPillActive : ""}`}
                  onClick={() => onChange({ ...filters, homeTypes: toggle(filters.homeTypes, ht) })}
                >
                  {ht}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className={styles.filterSection}>
        <div className={styles.filterSectionLabel}>Bedrooms</div>
        <div className={styles.filterPillRow}>
          {BEDROOM_OPTIONS.map(({ value, label }) => {
            const active = filters.bedrooms.includes(value);
            return (
              <button
                key={value}
                type="button"
                className={`${styles.filterPill} ${active ? styles.filterPillActive : ""}`}
                onClick={() => onChange({ ...filters, bedrooms: toggle(filters.bedrooms, value) })}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {availableCities.length > 1 && (
        <div className={styles.filterSection}>
          <div className={styles.filterSectionLabel}>City</div>
          <div className={styles.filterPillRow}>
            {availableCities.map((city) => {
              const active = filters.cities.includes(city);
              return (
                <button
                  key={city}
                  type="button"
                  className={`${styles.filterPill} ${active ? styles.filterPillActive : ""}`}
                  onClick={() => onChange({ ...filters, cities: toggle(filters.cities, city) })}
                >
                  {city}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add PropertiesFilterChips component**

Insert immediately after `PropertiesFilterPanel`:

```typescript
function PropertiesFilterChips({
  filters,
  onChange,
  onClear,
}: {
  filters: PropFilters;
  onChange: (f: PropFilters) => void;
  onClear: () => void;
}) {
  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  for (const occ of filters.occupancies) {
    const label = OCCUPANCY_OPTIONS.find((o) => o.value === occ)?.label ?? occ;
    chips.push({
      key: `occ:${occ}`,
      label,
      onRemove: () => onChange({ ...filters, occupancies: filters.occupancies.filter((x) => x !== occ) }),
    });
  }
  for (const ht of filters.homeTypes) {
    chips.push({
      key: `ht:${ht}`,
      label: ht,
      onRemove: () => onChange({ ...filters, homeTypes: filters.homeTypes.filter((x) => x !== ht) }),
    });
  }
  for (const bed of filters.bedrooms) {
    const label = BEDROOM_OPTIONS.find((o) => o.value === bed)?.label ?? String(bed);
    chips.push({
      key: `bed:${bed}`,
      label: `${label} bd`,
      onRemove: () => onChange({ ...filters, bedrooms: filters.bedrooms.filter((x) => x !== bed) }),
    });
  }
  for (const city of filters.cities) {
    chips.push({
      key: `city:${city}`,
      label: city,
      onRemove: () => onChange({ ...filters, cities: filters.cities.filter((x) => x !== city) }),
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
```

- [ ] **Step 4: Update HomesView to add filter state, popover, and extended filtering**

Replace the `HomesView` function entirely:

```typescript
export function HomesView({
  properties,
}: {
  properties: HomesProperty[];
}) {
  const { mode } = usePropertiesMode();
  const { selection } = usePropertiesFilter();
  const [drawerPropertyId, setDrawerPropertyId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("address");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [propFilters, setPropFilters] = useState<PropFilters>(EMPTY_PROP_FILTERS);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const filterBtnRef = useRef<HTMLButtonElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showFilterPanel) return;
    function handleMouseDown(e: MouseEvent) {
      if (
        filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node) &&
        filterBtnRef.current && !filterBtnRef.current.contains(e.target as Node)
      ) setShowFilterPanel(false);
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [showFilterPanel]);

  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    for (const p of properties) { if (p.homeType) set.add(p.homeType); }
    return Array.from(set).sort();
  }, [properties]);

  const availableCities = useMemo(() => {
    const set = new Set<string>();
    for (const p of properties) { if (p.city) set.add(p.city); }
    return Array.from(set).sort();
  }, [properties]);

  const activeFilterCount =
    propFilters.occupancies.length +
    propFilters.homeTypes.length +
    propFilters.bedrooms.length +
    propFilters.cities.length;

  const filtered = useMemo(() => {
    const noSelection = selection.ownerIds.size === 0 && selection.propertyIds.size === 0;
    let list = noSelection
      ? properties
      : properties.filter((p) => {
          if (selection.propertyIds.has(p.id)) return true;
          return p.owners.some((o) => selection.ownerIds.has(o.id));
        });

    if (propFilters.occupancies.length > 0) {
      list = list.filter((p) => {
        const occ = resolveOccupancy(p.bookings);
        return propFilters.occupancies.includes(occ.kind);
      });
    }
    if (propFilters.homeTypes.length > 0) {
      list = list.filter((p) => p.homeType && propFilters.homeTypes.includes(p.homeType));
    }
    if (propFilters.bedrooms.length > 0) {
      list = list.filter((p) => {
        if (p.bedrooms === null) return false;
        return propFilters.bedrooms.some((b) => b === 5 ? p.bedrooms! >= 5 : p.bedrooms === b);
      });
    }
    if (propFilters.cities.length > 0) {
      list = list.filter((p) => propFilters.cities.includes(p.city));
    }
    return list;
  }, [properties, selection, propFilters]);

  const sorted = useMemo(() => {
    if (mode !== "table") return filtered;
    const list = [...filtered];
    list.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "beds": return ((a.bedrooms ?? -1) - (b.bedrooms ?? -1)) * dir;
        case "baths": return ((a.bathrooms ?? -1) - (b.bathrooms ?? -1)) * dir;
        case "sqft": return ((a.squareFeet ?? -1) - (b.squareFeet ?? -1)) * dir;
        case "sleeps": return ((a.guestCapacity ?? -1) - (b.guestCapacity ?? -1)) * dir;
        case "status": return (statusRank(a) - statusRank(b)) * dir;
        case "address":
        default: return a.street.localeCompare(b.street) * dir;
      }
    });
    return list;
  }, [filtered, mode, sortKey, sortDir]);

  const active = properties.find((p) => p.id === drawerPropertyId) ?? null;

  return (
    <div className={styles.page}>
      <div className={styles.filterBar}>
        <div style={{ position: "relative" }}>
          <button
            ref={filterBtnRef}
            type="button"
            className={`${styles.toolbarBtn} ${showFilterPanel || activeFilterCount > 0 ? styles.toolbarBtnActive : ""}`}
            onClick={() => setShowFilterPanel((v) => !v)}
            aria-label="Filter properties"
          >
            <FunnelSimple size={14} />
            Filter
            {activeFilterCount > 0 && (
              <span className={styles.toolbarBtnBadge}>{activeFilterCount}</span>
            )}
          </button>
          {showFilterPanel && (
            <div ref={filterPanelRef} className={styles.filterPanelWrap}>
              <PropertiesFilterPanel
                filters={propFilters}
                onChange={setPropFilters}
                onClear={() => setPropFilters(EMPTY_PROP_FILTERS)}
                availableTypes={availableTypes}
                availableCities={availableCities}
              />
            </div>
          )}
        </div>
        <div className={styles.filterBarCount}>
          {filtered.length} of {properties.length} properties
        </div>
      </div>

      <PropertiesFilterChips
        filters={propFilters}
        onChange={setPropFilters}
        onClear={() => setPropFilters(EMPTY_PROP_FILTERS)}
      />

      {mode === "table" && (
        <div className={styles.sortBar}>
          <div className={styles.sortControl}>
            <label htmlFor="sort-key" className={styles.sortLabel}>
              Sort
            </label>
            <div className={styles.sortSelect}>
              <select
                id="sort-key"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
              >
                <option value="address">Address</option>
                <option value="beds">Beds</option>
                <option value="baths">Baths</option>
                <option value="sqft">Sqft</option>
                <option value="sleeps">Sleeps</option>
                <option value="status">Status</option>
              </select>
              <CaretDown size={10} weight="bold" />
            </div>
            <button
              type="button"
              className={styles.sortDir}
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              aria-label={`Sort ${sortDir === "asc" ? "descending" : "ascending"}`}
            >
              {sortDir === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>
      )}

      <div className={styles.content}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <p>No properties match your filters.</p>
          </div>
        ) : (
          <>
            <div
              className={styles.modePane}
              style={{ display: mode === "gallery" ? "block" : "none" }}
              aria-hidden={mode !== "gallery"}
            >
              <div className={styles.galleryList}>
                {filtered.map((p) => (
                  <GalleryCard
                    key={p.id}
                    property={p}
                    onOpen={() => setDrawerPropertyId(p.id)}
                  />
                ))}
              </div>
            </div>
            <div
              className={styles.modePane}
              style={{ display: mode === "table" ? "block" : "none" }}
              aria-hidden={mode !== "table"}
            >
              <HomesTable
                properties={sorted}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={(k) => {
                  if (k === sortKey) {
                    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                  } else {
                    setSortKey(k);
                    setSortDir("asc");
                  }
                }}
                onOpen={(id) => setDrawerPropertyId(id)}
              />
            </div>
          </>
        )}
      </div>

      <PropertyDrawer
        property={active}
        onClose={() => setDrawerPropertyId(null)}
      />
    </div>
  );
}
```

- [ ] **Step 5: Add filter CSS classes to HomesView.module.css**

Append these classes to the end of `apps/web/src/app/(admin)/admin/properties/HomesView.module.css`:

```css
/* Filter bar */
.filterBar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
}
.filterBarCount {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-left: auto;
}

/* Filter button */
.toolbarBtn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}
.toolbarBtn:hover {
  border-color: var(--color-brand);
  color: var(--color-brand);
}
.toolbarBtnActive {
  border-color: var(--color-brand);
  background: color-mix(in srgb, var(--color-brand) 8%, transparent);
  color: var(--color-brand);
}
.toolbarBtnBadge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 99px;
  background: var(--color-brand);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
}

/* Filter popover wrapper */
.filterPanelWrap {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 50;
}

/* Filter panel */
.filterPanel {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  min-width: 260px;
  max-width: 320px;
}
.filterPanelHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.filterPanelTitle {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.filterClearBtn {
  font-size: 12px;
  color: var(--color-brand);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.filterClearBtn:hover { text-decoration: underline; }

/* Filter sections */
.filterSection {
  margin-bottom: 10px;
}
.filterSection:last-child { margin-bottom: 0; }
.filterSectionLabel {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 5px;
}

/* Pills */
.filterPillRow {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.filterPill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 9px;
  border: 1px solid var(--color-border);
  border-radius: 99px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: border-color 0.12s, background 0.12s, color 0.12s;
}
.filterPill:hover {
  border-color: var(--color-brand);
  color: var(--color-brand);
}
.filterPillActive {
  border-color: var(--color-brand);
  background: color-mix(in srgb, var(--color-brand) 10%, transparent);
  color: var(--color-brand);
}
.filterOccupancyDot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Chips */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 0 16px 8px;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 8px 0 10px;
  border-radius: 99px;
  background: color-mix(in srgb, var(--color-brand) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-brand) 30%, transparent);
  font-size: 12px;
  color: var(--color-brand);
}
.chipLabel { line-height: 1; }
.chipRemove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--color-brand);
  cursor: pointer;
  padding: 0;
  opacity: 0.7;
}
.chipRemove:hover { opacity: 1; background: color-mix(in srgb, var(--color-brand) 20%, transparent); }
.chipClearAll {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border: 1px solid var(--color-border);
  border-radius: 99px;
  background: transparent;
  font-size: 12px;
  color: var(--color-text-secondary);
  cursor: pointer;
}
.chipClearAll:hover { border-color: var(--color-brand); color: var(--color-brand); }
```

- [ ] **Step 6: Verify TypeScript passes**

```bash
cd /Users/johanannunez/workspace/parcel/.worktrees/taskos/apps/web && pnpm exec tsc --noEmit 2>&1 | head -30
```

Expected: zero errors.

- [ ] **Step 7: Commit**

```bash
cd /Users/johanannunez/workspace/parcel/.worktrees/taskos && git add apps/web/src/app/\(admin\)/admin/properties/ && git commit -m "feat(properties): add filter panel with occupancy, type, bedrooms, and city filters"
```
