'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type {
  Task,
  TasksSavedView,
  TasksFetchResult,
} from '@/lib/admin/task-types';
import { BUCKET_LABEL } from '@/lib/admin/due-buckets';
import { TaskRow } from './TaskRow';
import styles from './TasksListView.module.css';

type Props = TasksFetchResult & {
  subtasksByParent: Record<string, Task[]>;
};

function SavedViewTabs({ views }: { views: TasksSavedView[] }) {
  const sp = useSearchParams();
  const active = sp?.get('view') ?? 'my-tasks';
  return (
    <nav className={styles.views} aria-label="Saved views">
      {views.map((v) => {
        const isActive = v.key === active;
        const href = v.key === 'my-tasks' ? '/admin/tasks' : `/admin/tasks?view=${v.key}`;
        const warn = v.key === 'overdue' && v.count > 0;
        return (
          <Link
            key={v.key}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            onMouseDown={(e) => e.preventDefault()}
          >
            {v.name}
            <span className={`${styles.count} ${isActive ? styles.countActive : ''} ${warn ? styles.countWarn : ''}`}>
              {v.count}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function TasksListView({ groups, views, activeView, totalCount, subtasksByParent }: Props) {
  return (
    <div className={styles.page}>
      <SavedViewTabs views={views} />

      <div className={styles.toolbar}>
        <input type="text" placeholder="Search tasks" className={styles.search} />
        <div className={styles.meta}>{totalCount} tasks</div>
      </div>

      <div className={styles.list}>
        {groups.length === 0 ? (
          <div className={styles.empty}>Nothing here.</div>
        ) : null}
        {groups.map((g) => (
          <section key={g.bucket}>
            <header className={`${styles.groupHead} ${styles[g.bucket]}`}>
              <span>{BUCKET_LABEL[g.bucket].toUpperCase()}</span>
              <span className={styles.groupCount}>{g.tasks.length}</span>
            </header>
            {g.tasks.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                subtasks={subtasksByParent[t.id] ?? []}
              />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
