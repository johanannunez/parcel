'use client';

import { useState, useCallback, useTransition, useMemo, useRef, useEffect, Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AnimatePresence } from 'motion/react';

class ModalErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[ModalErrorBoundary]', error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: 24, maxWidth: 480, fontFamily: 'monospace', fontSize: 13 }}>
            <strong style={{ color: '#ef4444' }}>Modal crashed:</strong>
            <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{this.state.error.message}{'\n'}{this.state.error.stack}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
import type { Task, TaskLabel, TasksSavedView, TasksFetchResult, TaskStatus, ParentType } from '@/lib/admin/task-types';
import type { DueBucket } from '@/lib/admin/due-buckets';
import { BUCKET_LABEL } from '@/lib/admin/due-buckets';
import { CaretDown, Check, Plus, FunnelSimple, SquaresFour, X, Rows, Columns, CalendarBlank, Clock } from '@phosphor-icons/react';
import { TaskRow } from './TaskRow';
import { TasksUpcomingView } from './TasksUpcomingView';
import { TasksBoardView } from './TasksBoardView';
import { TasksCalendarView } from './TasksCalendarView';
import { TaskDetailModal } from './TaskDetailModal';
import { TasksBulkBar } from './TasksBulkBar';
import { createTask, updateTask, bulkUpdateTasks, deleteTask } from '@/lib/admin/task-actions';
import styles from './TasksListView.module.css';

type ApiResponse = TasksFetchResult & {
  subtasksByParent: Record<string, Task[]>;
  upcomingTasks: Task[];
  labels: TaskLabel[];
};

type Props = ApiResponse & {
  currentUserId?: string | null;
  currentUserName?: string | null;
  currentUserAvatarUrl?: string | null;
};

type FilterState = {
  assignees: string[];
  priorities: (1 | 2 | 3 | 4)[];
  dueBucket: DueBucket | null;
  statuses: TaskStatus[];
  parentTypes: (ParentType | 'standalone')[];
};

type GroupBy = 'none' | 'property' | 'assignee';

const EMPTY_FILTERS: FilterState = { assignees: [], priorities: [], dueBucket: null, statuses: [], parentTypes: [] };
const PRIMARY_TABS = ['inbox', 'today', 'upcoming', 'my-tasks'];

const PRIORITY_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: 'P1', color: '#ef4444' },
  2: { label: 'P2', color: '#f59e0b' },
  3: { label: 'P3', color: '#60a5fa' },
  4: { label: 'P4', color: '#9ca3af' },
};

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' },
];

const PARENT_TYPE_LABELS: Record<ParentType | 'standalone', string> = {
  contact: 'Contact',
  property: 'Property',
  project: 'Project',
  standalone: 'Standalone',
};

const GROUP_BY_LABELS: Record<GroupBy, string> = {
  none: 'Group by',
  property: 'By Property',
  assignee: 'By Assignee',
};

function countActiveFilters(f: FilterState): number {
  return f.assignees.length + f.priorities.length + (f.dueBucket ? 1 : 0) + f.statuses.length + f.parentTypes.length;
}

// ─── FilterPanel ───────────────────────────────────────────────────────────

function FilterPanel({
  filters,
  onChange,
  onClear,
  assigneeOptions,
  views,
}: {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  onClear: () => void;
  assigneeOptions: { name: string; avatarUrl: string | null | undefined; count: number }[];
  views: TasksSavedView[];
}) {
  const toggle = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const overdueCount = views.find((v) => v.key === 'overdue')?.count ?? 0;
  const todayCount = views.find((v) => v.key === 'today')?.count ?? 0;
  const weekCount = views.find((v) => v.key === 'this-week')?.count ?? 0;

  return (
    <div className={styles.filterPanel} onClick={(e) => e.stopPropagation()}>
      <div className={styles.filterPanelHeader}>
        <span className={styles.filterPanelTitle}>Filters</span>
        {countActiveFilters(filters) > 0 && (
          <button type="button" className={styles.filterClearBtn} onClick={onClear}>
            Clear all
          </button>
        )}
      </div>

      {assigneeOptions.length > 0 && (
        <div className={styles.filterSection}>
          <div className={styles.filterSectionLabel}>Assignee</div>
          <div className={styles.filterAssigneeList}>
            {assigneeOptions.map((a) => {
              const active = filters.assignees.includes(a.name);
              return (
                <button
                  key={a.name}
                  type="button"
                  className={`${styles.filterAssigneeItem} ${active ? styles.filterAssigneeItemActive : ''}`}
                  onClick={() => onChange({ ...filters, assignees: toggle(filters.assignees, a.name) })}
                >
                  {a.avatarUrl ? (
                    <img src={a.avatarUrl} alt={a.name} className={styles.filterAvatar} />
                  ) : (
                    <span className={styles.filterAvatarFallback}>
                      {a.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                    </span>
                  )}
                  <span className={styles.filterAssigneeName}>{a.name}</span>
                  <span className={styles.filterAssigneeCount}>{a.count}</span>
                  {active && <Check size={12} className={styles.filterCheck} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className={styles.filterSection}>
        <div className={styles.filterSectionLabel}>Priority</div>
        <div className={styles.filterPillRow}>
          {([1, 2, 3, 4] as const).map((p) => {
            const { label, color } = PRIORITY_CONFIG[p];
            const active = filters.priorities.includes(p);
            return (
              <button
                key={p}
                type="button"
                className={`${styles.filterPill} ${active ? styles.filterPillActive : ''}`}
                style={active ? { borderColor: color, color, background: `${color}18` } : undefined}
                onClick={() => onChange({ ...filters, priorities: toggle(filters.priorities, p) })}
              >
                <span className={styles.filterPriorityDot} style={{ background: color }} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterSectionLabel}>Due Date</div>
        <div className={styles.filterPillRow}>
          {([
            { key: 'overdue' as DueBucket, label: 'Overdue', count: overdueCount },
            { key: 'today' as DueBucket, label: 'Today', count: todayCount },
            { key: 'this_week' as DueBucket, label: 'This Week', count: weekCount },
          ]).map(({ key, label, count }) => {
            const active = filters.dueBucket === key;
            return (
              <button
                key={key}
                type="button"
                className={`${styles.filterPill} ${active ? styles.filterPillActive : ''}`}
                onClick={() => onChange({ ...filters, dueBucket: active ? null : key })}
              >
                {label}
                {count > 0 && <span className={styles.filterPillCount}>{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterSectionLabel}>Status</div>
        <div className={styles.filterPillRow}>
          {STATUS_OPTIONS.map(({ value, label }) => {
            const active = filters.statuses.includes(value);
            return (
              <button
                key={value}
                type="button"
                className={`${styles.filterPill} ${active ? styles.filterPillActive : ''}`}
                onClick={() => onChange({ ...filters, statuses: toggle(filters.statuses, value) })}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterSectionLabel}>Parent</div>
        <div className={styles.filterPillRow}>
          {(Object.keys(PARENT_TYPE_LABELS) as (ParentType | 'standalone')[]).map((pt) => {
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
    </div>
  );
}

// ─── FilterChips ───────────────────────────────────────────────────────────

function FilterChips({
  filters,
  groupBy,
  onChange,
  onClear,
  onGroupByChange,
}: {
  filters: FilterState;
  groupBy: GroupBy;
  onChange: (f: FilterState) => void;
  onClear: () => void;
  onGroupByChange: (g: GroupBy) => void;
}) {
  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  for (const a of filters.assignees) {
    chips.push({ key: `a:${a}`, label: a, onRemove: () => onChange({ ...filters, assignees: filters.assignees.filter((x) => x !== a) }) });
  }
  for (const p of filters.priorities) {
    chips.push({ key: `p:${p}`, label: PRIORITY_CONFIG[p].label, onRemove: () => onChange({ ...filters, priorities: filters.priorities.filter((x) => x !== p) }) });
  }
  if (filters.dueBucket) {
    const db = filters.dueBucket;
    chips.push({ key: `d:${db}`, label: BUCKET_LABEL[db], onRemove: () => onChange({ ...filters, dueBucket: null }) });
  }
  for (const s of filters.statuses) {
    const lbl = STATUS_OPTIONS.find((x) => x.value === s)?.label ?? s;
    chips.push({ key: `s:${s}`, label: lbl, onRemove: () => onChange({ ...filters, statuses: filters.statuses.filter((x) => x !== s) }) });
  }
  for (const pt of filters.parentTypes) {
    chips.push({
      key: `pt:${pt}`,
      label: PARENT_TYPE_LABELS[pt],
      onRemove: () => onChange({ ...filters, parentTypes: filters.parentTypes.filter((x) => x !== pt) }),
    });
  }
  if (groupBy !== 'none') {
    chips.push({ key: `g:${groupBy}`, label: GROUP_BY_LABELS[groupBy], onRemove: () => onGroupByChange('none') });
  }

  if (chips.length === 0) return null;

  return (
    <div className={styles.chips}>
      {chips.map((c) => (
        <span key={c.key} className={styles.chip}>
          <span className={styles.chipLabel}>{c.label}</span>
          <button type="button" className={styles.chipRemove} onClick={c.onRemove} aria-label={`Remove ${c.label} filter`}>
            <X size={10} />
          </button>
        </span>
      ))}
      <button type="button" className={styles.chipClearAll} onClick={() => { onClear(); onGroupByChange('none'); }}>
        Clear all
      </button>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SavedViewTabs({
  views, activeKey, onSelect,
}: {
  views: TasksSavedView[];
  activeKey: string;
  onSelect: (key: string) => void;
}) {
  const primary = views.filter((v) => PRIMARY_TABS.includes(v.key));
  return (
    <nav className={styles.views} aria-label="Saved views">
      {primary.map((v) => {
        const isActive = v.key === activeKey;
        return (
          <button
            key={v.key}
            type="button"
            aria-current={isActive ? 'page' : undefined}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            onClick={() => onSelect(v.key)}
          >
            {v.name}
            <span className={`${styles.count} ${isActive ? styles.countActive : ''}`}>
              {v.count}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function ListSkeleton() {
  return (
    <div className={styles.skeleton}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={styles.skeletonRow} />
      ))}
    </div>
  );
}

function AddTaskRow({ onCreated }: { onCreated: () => void }) {
  const [active, setActive] = useState(false);
  const [title, setTitle] = useState('');
  const [isSubmitting, startSubmit] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const open = () => { setActive(true); setTimeout(() => inputRef.current?.focus(), 0); };
  const cancel = () => { setActive(false); setTitle(''); };

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    startSubmit(async () => {
      await createTask({ title: trimmed, priority: 4 });
      setTitle('');
      setActive(false);
      onCreated();
    });
  };

  if (active) {
    return (
      <div className={styles.addTaskForm}>
        <input
          ref={inputRef}
          type="text"
          className={styles.addTaskInput}
          placeholder="Task name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') cancel();
          }}
        />
        <div className={styles.addTaskActions}>
          <button type="button" className={styles.addTaskCancelBtn} onClick={cancel}>Cancel</button>
          <button
            type="button"
            className={styles.addTaskSubmitBtn}
            onClick={submit}
            disabled={!title.trim() || isSubmitting}
          >
            Add task
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.addTaskRow} onClick={open} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') open(); }}>
      <Plus size={14} className={styles.addTaskIcon} />
      <span className={styles.addTaskBtn}>Add task</span>
    </div>
  );
}

const SORT_LABELS: Record<string, string> = {
  priority: 'Priority',
  date_added: 'Date Added',
  due_date: 'Due Date',
};

// ─── Main component ──────────────────────────────────────────────────────────

export function TasksListView(props: Props) {
  const [data, setData] = useState<ApiResponse>(props);
  const [activeKey, setActiveKey] = useState(props.activeView.key);
  const [drawerTask, setDrawerTask] = useState<Task | null>(null);
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();
  const [sortBy, setSortBy] = useState<'priority' | 'date_added' | 'due_date'>('priority');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);

  // View type toggle: list | board | calendar | upcoming
  const [viewType, setViewType] = useState<'list' | 'board' | 'calendar' | 'upcoming'>('list');

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Keyboard focus state (j/k navigation)
  const [focusedTaskIndex, setFocusedTaskIndex] = useState<number | null>(null);

  const sortMenuRef = useRef<HTMLDivElement>(null);
  const filterBtnRef = useRef<HTMLButtonElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const groupBtnRef = useRef<HTMLButtonElement>(null);
  const groupMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // View data cache: key -> ApiResponse so tab switching is instant on second visit
  const viewCacheRef = useRef<Map<string, ApiResponse>>(new Map());

  // Close sort menu on outside click
  useEffect(() => {
    if (!showSortMenu) return;
    function handleMouseDown(e: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) setShowSortMenu(false);
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [showSortMenu]);

  // Close filter panel on outside click
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

  // Close group menu on outside click
  useEffect(() => {
    if (!showGroupMenu) return;
    function handleMouseDown(e: MouseEvent) {
      if (
        groupMenuRef.current && !groupMenuRef.current.contains(e.target as Node) &&
        groupBtnRef.current && !groupBtnRef.current.contains(e.target as Node)
      ) setShowGroupMenu(false);
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [showGroupMenu]);

  const switchView = useCallback((key: string) => {
    setActiveKey(key);
    setSelectedIds(new Set());
    setFocusedTaskIndex(null);
    // Show cached data immediately if available, then refresh in background
    const cached = viewCacheRef.current.get(key);
    if (cached) setData(cached);
    startTransition(async () => {
      const res = await fetch(`/api/tasks?view=${key}`);
      if (res.ok) {
        const fresh: ApiResponse = await res.json();
        viewCacheRef.current.set(key, fresh);
        setData(fresh);
      }
    });
  }, []);

  const refreshCurrentView = useCallback(async (openTaskId?: string) => {
    const res = await fetch(`/api/tasks?view=${activeKey}`);
    if (!res.ok) return;
    const fresh: ApiResponse = await res.json();
    setData(fresh);
    if (openTaskId) {
      const allTasks = fresh.groups.flatMap((g) => g.tasks);
      const updated = allTasks.find((t) => t.id === openTaskId);
      if (updated) setDrawerTask(updated);
    }
  }, [activeKey]);

  const handleSearch = useCallback((q: string) => setSearch(q), []);

  // Bulk selection handlers
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }, []);

  const handleBulkUpdate = useCallback(
    (ids: string[], patch: Partial<{ status: TaskStatus; priority: 1 | 2 | 3 | 4; labelIds: string[] }>) => {
      // Optimistic update
      setData((prev) => ({
        ...prev,
        groups: prev.groups.map((g) => ({
          ...g,
          tasks: g.tasks.map((t) => (ids.includes(t.id) ? { ...t, ...patch } : t)),
        })),
      }));
      startTransition(async () => {
        await bulkUpdateTasks(ids, patch);
      });
    },
    [],
  );

  const handleBulkDelete = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    // Optimistic removal
    setData((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => ({
        ...g,
        tasks: g.tasks.filter((t) => !idSet.has(t.id)),
      })),
    }));
    setSelectedIds(new Set());
    startTransition(async () => {
      await Promise.all(ids.map((id) => deleteTask(id)));
    });
  }, []);

  // Optimistically update a single task (top-level or subtask) + persist to server
  const handleTaskUpdate = useCallback((id: string, patch: Partial<Task>) => {
    setData((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => ({
        ...g,
        tasks: g.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      })),
    }));
    startTransition(async () => {
      await updateTask(id, patch);
    });
  }, []);

  // Keyboard shortcuts: j/k to navigate tasks, Enter to open, Cmd+Shift+F for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (drawerTask) return;
      const target = document.activeElement as HTMLElement | null;
      const inText =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        (target?.isContentEditable ?? false);
      if (inText) return;

      const topLevelTasks = data.groups.flatMap((g) => g.tasks).filter((t) => !t.parentTaskId);

      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        setFocusedTaskIndex((i) => Math.min((i ?? -1) + 1, topLevelTasks.length - 1));
      }
      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        setFocusedTaskIndex((i) => Math.max((i ?? topLevelTasks.length) - 1, 0));
      }
      if (e.key === 'Enter') {
        setFocusedTaskIndex((i) => {
          if (i !== null) {
            const task = topLevelTasks[i];
            if (task) {
              e.preventDefault();
              setDrawerTask(task);
            }
          }
          return i;
        });
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [drawerTask, data.groups]);

  // Unique assignees for the filter panel
  const assigneeOptions = useMemo(() => {
    const map = new Map<string, { name: string; avatarUrl: string | null | undefined; count: number }>();
    for (const g of data.groups) {
      for (const t of g.tasks) {
        if (!t.assigneeName) continue;
        const entry = map.get(t.assigneeName);
        if (entry) { entry.count++; } else { map.set(t.assigneeName, { name: t.assigneeName, avatarUrl: t.assigneeAvatarUrl, count: 1 }); }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [data.groups]);

  // Search + sort
  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const groups = q
      ? data.groups.map((g) => ({
          ...g,
          tasks: g.tasks.filter(
            (t) =>
              t.title.toLowerCase().includes(q) ||
              (t.description?.toLowerCase().includes(q) ?? false) ||
              (t.assigneeName?.toLowerCase().includes(q) ?? false) ||
              (t.parent?.label.toLowerCase().includes(q) ?? false),
          ),
        })).filter((g) => g.tasks.length > 0)
      : data.groups;

    return groups.map((g) => ({
      ...g,
      tasks: [...g.tasks].sort((a, b) => {
        if (sortBy === 'priority') return a.priority - b.priority;
        if (sortBy === 'date_added') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'due_date') {
          if (!a.dueAt && !b.dueAt) return 0;
          if (!a.dueAt) return 1;
          if (!b.dueAt) return -1;
          return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
        }
        return 0;
      }),
    }));
  }, [data.groups, search, sortBy]);

  // Apply active filters on top
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

  // Entity grouping (controlled by groupBy, not activeKey)
  const entityGroups = useMemo(() => {
    if (groupBy === 'none') return null;
    const allTasks = activeFilterGroups.flatMap((g) => g.tasks);
    const map = new Map<string, { tasks: Task[]; avatarUrl?: string | null; initials?: string }>();
    for (const t of allTasks) {
      const key = groupBy === 'property' ? (t.parent?.label ?? 'No Project') : (t.assigneeName ?? 'Unassigned');
      if (!map.has(key)) {
        map.set(key, {
          tasks: [],
          avatarUrl: groupBy === 'assignee' ? t.assigneeAvatarUrl : undefined,
          initials: groupBy === 'assignee' && t.assigneeName
            ? t.assigneeName.split(' ').map((p) => p[0]).slice(0, 2).join('')
            : undefined,
        });
      }
      map.get(key)!.tasks.push(t);
    }
    return Array.from(map.entries()).map(([name, info]) => ({ name, ...info }));
  }, [activeFilterGroups, groupBy]);

  // All tasks flat (includes subtasks from upcomingTasks + groups) for modal navigation and views
  const allTasks = useMemo(
    () => [...data.groups.flatMap((g) => g.tasks), ...data.upcomingTasks],
    [data.groups, data.upcomingTasks],
  );

  const activeView = data.views.find((v) => v.key === activeKey) ?? data.views[0];
  const totalFiltered = activeFilterGroups.flatMap((g) => g.tasks).length;
  const activeFilterCount = countActiveFilters(filters);
  // isListView: true when viewType is 'list' (the saved-view tab list layout)
  const isListView = viewType === 'list';

  // Flat list of top-level tasks for keyboard focus tracking
  const topLevelTasksFlat = useMemo(
    () => data.groups.flatMap((g) => g.tasks).filter((t) => !t.parentTaskId),
    [data.groups],
  );
  const focusedTaskId =
    focusedTaskIndex !== null ? (topLevelTasksFlat[focusedTaskIndex]?.id ?? null) : null;

  return (
    <div className={styles.page}>
      <SavedViewTabs views={data.views} activeKey={activeKey} onSelect={switchView} />

      <div className={styles.toolbar}>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search tasks"
          className={styles.search}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />

        {activeKey === 'inbox' && (
          <div className={styles.sortControl} style={{ position: 'relative' }} ref={sortMenuRef}>
            <button
              type="button"
              className={styles.sortBtn}
              onClick={() => setShowSortMenu((v) => !v)}
            >
              Sort: {SORT_LABELS[sortBy]}
              <CaretDown size={12} />
            </button>
            {showSortMenu && (
              <div className={styles.sortMenu}>
                {(['priority', 'date_added', 'due_date'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`${styles.sortOption} ${sortBy === opt ? styles.sortOptionActive : ''}`}
                    onClick={() => { setSortBy(opt); setShowSortMenu(false); }}
                  >
                    {SORT_LABELS[opt]}
                    {sortBy === opt && <Check size={13} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {isListView && (
          <>
            {/* Filter button */}
            <div style={{ position: 'relative' }}>
              <button
                ref={filterBtnRef}
                type="button"
                className={`${styles.toolbarBtn} ${showFilterPanel || activeFilterCount > 0 ? styles.toolbarBtnActive : ''}`}
                onClick={() => { setShowGroupMenu(false); setShowFilterPanel((v) => !v); }}
                aria-label="Filter tasks"
              >
                <FunnelSimple size={14} />
                Filter
                {activeFilterCount > 0 && (
                  <span className={styles.toolbarBtnBadge}>{activeFilterCount}</span>
                )}
              </button>
              {showFilterPanel && (
                <div ref={filterPanelRef} className={styles.filterPanelWrap}>
                  <FilterPanel
                    filters={filters}
                    onChange={setFilters}
                    onClear={() => setFilters(EMPTY_FILTERS)}
                    assigneeOptions={assigneeOptions}
                    views={data.views}
                  />
                </div>
              )}
            </div>

            {/* Group by button */}
            <div style={{ position: 'relative' }} ref={groupMenuRef}>
              <button
                ref={groupBtnRef}
                type="button"
                className={`${styles.toolbarBtn} ${showGroupMenu || groupBy !== 'none' ? styles.toolbarBtnActive : ''}`}
                onClick={() => { setShowFilterPanel(false); setShowGroupMenu((v) => !v); }}
                aria-label="Group by"
              >
                <SquaresFour size={14} />
                {groupBy === 'none' ? 'Group by' : GROUP_BY_LABELS[groupBy]}
                <CaretDown size={11} />
              </button>
              {showGroupMenu && (
                <div className={styles.groupMenu}>
                  {(['none', 'property', 'assignee'] as GroupBy[]).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`${styles.groupOption} ${groupBy === opt ? styles.groupOptionActive : ''}`}
                      onClick={() => { setGroupBy(opt); setShowGroupMenu(false); }}
                    >
                      {GROUP_BY_LABELS[opt]}
                      {groupBy === opt && <Check size={13} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className={styles.meta}>
          {search.trim() ? `${totalFiltered} results` : `${data.totalCount} tasks`}
        </div>

        {/* View type toggle */}
        <div className={styles.viewToggle}>
          <button
            type="button"
            aria-label="List view"
            className={`${styles.viewToggleBtn} ${viewType === 'list' ? styles.viewToggleBtnActive : ''}`}
            onClick={() => setViewType('list')}
          >
            <Rows size={15} weight={viewType === 'list' ? 'bold' : 'regular'} />
          </button>
          <button
            type="button"
            aria-label="Board view"
            className={`${styles.viewToggleBtn} ${viewType === 'board' ? styles.viewToggleBtnActive : ''}`}
            onClick={() => setViewType('board')}
          >
            <Columns size={15} weight={viewType === 'board' ? 'bold' : 'regular'} />
          </button>
          <button
            type="button"
            aria-label="Calendar view"
            className={`${styles.viewToggleBtn} ${viewType === 'calendar' ? styles.viewToggleBtnActive : ''}`}
            onClick={() => setViewType('calendar')}
          >
            <CalendarBlank size={15} weight={viewType === 'calendar' ? 'bold' : 'regular'} />
          </button>
          <button
            type="button"
            aria-label="Upcoming view"
            className={`${styles.viewToggleBtn} ${viewType === 'upcoming' ? styles.viewToggleBtnActive : ''}`}
            onClick={() => setViewType('upcoming')}
          >
            <Clock size={15} weight={viewType === 'upcoming' ? 'bold' : 'regular'} />
          </button>
        </div>
      </div>

      <FilterChips
        filters={filters}
        groupBy={groupBy}
        onChange={setFilters}
        onClear={() => setFilters(EMPTY_FILTERS)}
        onGroupByChange={setGroupBy}
      />

      {isPending ? (
        <ListSkeleton />
      ) : viewType === 'board' ? (
        <TasksBoardView
          tasks={allTasks.filter((t) => t.parentTaskId === null)}
          labels={data.labels ?? []}
          onOpenTask={setDrawerTask}
          onTaskUpdate={handleTaskUpdate}
        />
      ) : viewType === 'calendar' ? (
        <TasksCalendarView
          tasks={allTasks}
          labels={data.labels ?? []}
          onOpenTask={setDrawerTask}
          onTaskUpdate={handleTaskUpdate}
        />
      ) : viewType === 'upcoming' ? (
        <TasksUpcomingView
          tasks={allTasks}
          labels={data.labels ?? []}
          onOpenTask={setDrawerTask}
          onTaskUpdate={handleTaskUpdate}
          onCreateTask={() => {
            // No-op placeholder: user can open a task after creation to fill details
          }}
        />
      ) : entityGroups ? (
        <div className={styles.list}>
          {entityGroups.length === 0 ? (
            <div className={styles.empty}>Nothing here.</div>
          ) : entityGroups.map((g) => (
            <section key={g.name}>
              <header className={styles.entityHead}>
                {g.avatarUrl ? (
                  <img src={g.avatarUrl} alt={g.name} className={styles.entityAvatar} />
                ) : g.initials ? (
                  <span className={styles.entityAvatarFallback}>{g.initials}</span>
                ) : null}
                <span className={styles.entityHeadName}>{g.name}</span>
                <span className={styles.groupCount}>{g.tasks.length}</span>
              </header>
              {g.tasks.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  subtasks={data.subtasksByParent[t.id] ?? []}
                  labels={data.labels ?? []}
                  onOpen={() => setDrawerTask(t)}
                  isSelected={selectedIds.has(t.id)}
                  onToggleSelect={handleToggleSelect}
                  isFocused={focusedTaskId === t.id}
                />
              ))}
            </section>
          ))}
          <AddTaskRow onCreated={() => switchView(activeKey)} />
        </div>
      ) : (
        <div className={styles.list}>
          {activeFilterGroups.length === 0 ? (
            <div className={styles.empty}>
              {activeFilterCount > 0 ? 'No tasks match the active filters.' : 'Nothing here.'}
            </div>
          ) : null}
          {activeFilterGroups.map((g) => (
            <section key={g.bucket}>
              <header className={`${styles.groupHead} ${styles[g.bucket]}`}>
                <span>{BUCKET_LABEL[g.bucket].toUpperCase()}</span>
                <span className={styles.groupCount}>{g.tasks.length}</span>
              </header>
              {g.tasks.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  subtasks={data.subtasksByParent[t.id] ?? []}
                  labels={data.labels ?? []}
                  onOpen={() => setDrawerTask(t)}
                  showNeedsOwner={activeKey === 'unassigned'}
                  currentUserId={activeKey === 'unassigned' ? (props.currentUserId ?? null) : null}
                  isSelected={selectedIds.has(t.id)}
                  onToggleSelect={handleToggleSelect}
                  isFocused={focusedTaskId === t.id}
                />
              ))}
            </section>
          ))}
          <AddTaskRow onCreated={() => switchView(activeKey)} />
        </div>
      )}

      <ModalErrorBoundary>
        <AnimatePresence>
          {drawerTask && (
            <TaskDetailModal
              key={drawerTask.id}
              task={drawerTask}
              tasks={allTasks}
              subtasks={data.subtasksByParent[drawerTask.id] ?? []}
              labels={data.labels ?? []}
              currentUserId={props.currentUserId ?? null}
              currentUserName={props.currentUserName ?? null}
              currentUserAvatarUrl={props.currentUserAvatarUrl ?? null}
              onClose={() => setDrawerTask(null)}
              onSaved={(taskId) => refreshCurrentView(taskId)}
              onNavigate={(t) => setDrawerTask(t)}
              onUpdate={handleTaskUpdate}
            />
          )}
        </AnimatePresence>
      </ModalErrorBoundary>

      <AnimatePresence>
        {selectedIds.size > 0 && (
          <TasksBulkBar
            selectedIds={selectedIds}
            tasks={allTasks}
            labels={data.labels ?? []}
            onClear={() => setSelectedIds(new Set())}
            onBulkUpdate={handleBulkUpdate}
            onBulkDelete={handleBulkDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
