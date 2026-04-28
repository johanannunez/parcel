'use client';

import { useState, useCallback, useTransition } from 'react';
import type {
  Task,
  TasksSavedView,
  TasksFetchResult,
} from '@/lib/admin/task-types';
import { BUCKET_LABEL } from '@/lib/admin/due-buckets';
import { TaskRow } from './TaskRow';
import { TasksUpcomingView } from './TasksUpcomingView';
import { TaskDetailModal } from './TaskDetailModal';
import styles from './TasksListView.module.css';

type ApiResponse = TasksFetchResult & {
  subtasksByParent: Record<string, Task[]>;
  upcomingTasks: Task[];
};

type Props = ApiResponse;

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

export function TasksListView(props: Props) {
  const [data, setData] = useState<ApiResponse>(props);
  const [activeKey, setActiveKey] = useState(props.activeView.key);
  const [drawerTask, setDrawerTask] = useState<Task | null>(null);
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();

  const switchView = useCallback((key: string) => {
    setActiveKey(key); // instant tab switch
    startTransition(async () => {
      const params = new URLSearchParams({ view: key });
      if (search) params.set('q', search);
      const res = await fetch(`/api/tasks?${params}`);
      if (res.ok) {
        const json: ApiResponse = await res.json();
        setData(json);
      }
    });
  }, [search]);

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    startTransition(async () => {
      const params = new URLSearchParams({ view: activeKey });
      if (q) params.set('q', q);
      const res = await fetch(`/api/tasks?${params}`);
      if (res.ok) {
        const json: ApiResponse = await res.json();
        setData(json);
      }
    });
  }, [activeKey]);

  const activeView = data.views.find((v) => v.key === activeKey) ?? data.views[0];

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
        <div className={styles.meta}>{data.totalCount} tasks</div>
      </div>

      {isPending ? (
        <ListSkeleton />
      ) : activeView?.key === 'upcoming' ? (
        <TasksUpcomingView tasks={data.upcomingTasks} onOpenTask={setDrawerTask} />
      ) : (
        <div className={styles.list}>
          {data.groups.length === 0 ? (
            <div className={styles.empty}>Nothing here.</div>
          ) : null}
          {data.groups.map((g) => (
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
                />
              ))}
            </section>
          ))}
        </div>
      )}

      <TaskDetailModal task={drawerTask} onClose={() => setDrawerTask(null)} />
    </div>
  );
}
