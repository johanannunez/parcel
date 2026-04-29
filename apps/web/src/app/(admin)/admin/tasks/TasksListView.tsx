'use client';

import { useState, useCallback, useTransition, useMemo, useRef, useEffect } from 'react';
import type {
  Task,
  TasksSavedView,
  TasksFetchResult,
} from '@/lib/admin/task-types';
import { BUCKET_LABEL } from '@/lib/admin/due-buckets';
import { CaretDown, Check, Plus } from '@phosphor-icons/react';
import { TaskRow } from './TaskRow';
import { TasksUpcomingView } from './TasksUpcomingView';
import { TaskDetailModal } from './TaskDetailModal';
import { createTask } from '@/lib/admin/task-actions';
import styles from './TasksListView.module.css';

type ApiResponse = TasksFetchResult & {
  subtasksByParent: Record<string, Task[]>;
  upcomingTasks: Task[];
};

type Props = ApiResponse & {
  currentUserId?: string | null;
};

function SavedViewTabs({
  views,
  activeKey,
  onSelect,
  isPending,
}: {
  views: TasksSavedView[];
  activeKey: string;
  onSelect: (key: string) => void;
  isPending: boolean;
}) {
  return (
    <nav className={styles.views} aria-label="Saved views">
      {views.map((v) => {
        const isActive = v.key === activeKey;
        const warn = v.key === 'overdue' && v.count > 0;
        return (
          <button
            key={v.key}
            type="button"
            aria-current={isActive ? 'page' : undefined}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            onClick={() => onSelect(v.key)}
          >
            {v.name}
            <span className={`${styles.count} ${isActive ? styles.countActive : ''} ${warn ? styles.countWarn : ''}`}>
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

function TaskListHeader() {
  return (
    <div className={styles.columnHeader}>
      <div />
      <div className={styles.columnHeaderCell}>Task</div>
      <div className={styles.columnHeaderCell}>Project</div>
      <div className={`${styles.columnHeaderCell} ${styles.columnHeaderCellRight}`}>Due</div>
      <div className={`${styles.columnHeaderCell} ${styles.columnHeaderCellCenter}`}>Assignee</div>
      <div />
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

export function TasksListView(props: Props) {
  const [data, setData] = useState<ApiResponse>(props);
  const [activeKey, setActiveKey] = useState(props.activeView.key);
  const [drawerTask, setDrawerTask] = useState<Task | null>(null);
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();
  const [sortBy, setSortBy] = useState<'priority' | 'date_added' | 'due_date'>('priority');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Close sort menu on outside click
  useEffect(() => {
    if (!showSortMenu) return;
    function handleMouseDown(e: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [showSortMenu]);

  const switchView = useCallback((key: string) => {
    setActiveKey(key);
    startTransition(async () => {
      const params = new URLSearchParams({ view: key });
      const res = await fetch(`/api/tasks?${params}`);
      if (res.ok) {
        const json: ApiResponse = await res.json();
        setData(json);
      }
    });
  }, []);

  // Search is now purely client-side — just update state
  const handleSearch = useCallback((q: string) => {
    setSearch(q);
  }, []);

  // Filtered + sorted groups derived from server data
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
        if (sortBy === 'date_added')
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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

  const activeView = data.views.find((v) => v.key === activeKey) ?? data.views[0];
  const totalFiltered = filteredGroups.flatMap((g) => g.tasks).length;

  return (
    <div className={styles.page}>
      <SavedViewTabs
        views={data.views}
        activeKey={activeKey}
        onSelect={switchView}
        isPending={isPending}
      />

      <div className={styles.toolbar}>
        <input
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

        <div className={styles.meta}>
          {search.trim()
            ? `${totalFiltered} results`
            : `${data.totalCount} tasks`}
        </div>
      </div>

      {isPending ? (
        <ListSkeleton />
      ) : activeView?.key === 'upcoming' ? (
        <TasksUpcomingView tasks={data.upcomingTasks} onOpenTask={setDrawerTask} />
      ) : (
        <div className={styles.list}>
          {filteredGroups.length > 0 && <TaskListHeader />}
          {filteredGroups.length === 0 ? (
            <div className={styles.empty}>Nothing here.</div>
          ) : null}
          {filteredGroups.map((g) => (
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
                  onOpen={() => setDrawerTask(t)}
                  showNeedsOwner={activeKey === 'unassigned'}
                  currentUserId={activeKey === 'unassigned' ? (props.currentUserId ?? null) : null}
                />
              ))}
            </section>
          ))}
          <AddTaskRow onCreated={() => switchView(activeKey)} />
        </div>
      )}

      <TaskDetailModal task={drawerTask} onClose={() => setDrawerTask(null)} />
    </div>
  );
}
