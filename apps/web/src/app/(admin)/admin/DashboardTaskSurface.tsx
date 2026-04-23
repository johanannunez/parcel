// apps/web/src/app/(admin)/admin/DashboardTaskSurface.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import type { DashboardTask, DashboardTaskFilter } from '@/lib/admin/dashboard-tasks';
import { filterDashboardTasks } from '@/lib/admin/dashboard-tasks';
import styles from './DashboardTaskSurface.module.css';

const FILTERS: { key: DashboardTaskFilter; label: string }[] = [
  { key: 'all',         label: 'All'         },
  { key: 'overdue',     label: 'Overdue'     },
  { key: 'today',       label: 'Due Today'   },
  { key: 'payouts',     label: 'Payouts'     },
  { key: 'maintenance', label: 'Maintenance' },
];

function formatDue(iso: string | null): { label: string; cls: string } {
  if (!iso) return { label: '—', cls: '' };
  const now = new Date();
  const due = new Date(iso);
  const diff = due.getTime() - now.getTime();

  if (diff < 0) {
    const days = Math.ceil(Math.abs(diff) / 86_400_000);
    return { label: days === 1 ? '1d late' : `${days}d late`, cls: styles.dueOverdue };
  }

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  if (due <= endOfToday) {
    const timeStr = due.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return { label: `Today ${timeStr}`, cls: styles.dueToday };
  }

  const days = Math.floor(diff / 86_400_000);
  if (days < 7) {
    const weekday = due.toLocaleDateString(undefined, { weekday: 'short' });
    const timeStr = due.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return { label: `${weekday} ${timeStr}`, cls: '' };
  }
  return {
    label: due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    cls: '',
  };
}

function Assignee({ name, avatarUrl }: { name: string | null; avatarUrl: string | null }) {
  if (avatarUrl) {
    return (
      <span className={styles.avatar} title={name ?? 'Assignee'}>
        <Image src={avatarUrl} alt={name ?? 'Assignee'} width={24} height={24} className={styles.avatarImg} />
      </span>
    );
  }
  if (name) {
    const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
    return (
      <span className={styles.avatar} title={name}>
        {initials}
      </span>
    );
  }
  return <span className={styles.avatarEmpty}>—</span>;
}

export function DashboardTaskSurface({ tasks }: { tasks: DashboardTask[] }) {
  const [filter, setFilter] = useState<DashboardTaskFilter>('all');
  const visible = filterDashboardTasks(tasks, filter);

  return (
    <div className={styles.wrap}>
      <div className={styles.tabs}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`${styles.tab} ${filter === f.key ? styles.tabActive : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {visible.length === 0 ? (
          <div className={styles.empty}>No tasks in this category.</div>
        ) : (
          visible.map((task) => {
            const due = formatDue(task.dueAt);
            return (
              <Link key={task.id} href="/admin/tasks" className={styles.row}>
                <div className={styles.rowMain}>
                  <span className={styles.taskTitle}>{task.title}</span>
                  {task.propertyName ? (
                    <span className={styles.propName}>{task.propertyName}</span>
                  ) : null}
                </div>
                <span className={`${styles.due} ${due.cls}`}>{due.label}</span>
                <Assignee name={task.assigneeName} avatarUrl={task.assigneeAvatarUrl} />
              </Link>
            );
          })
        )}
      </div>

      <div className={styles.footer}>
        <Link href="/admin/tasks" className={styles.footerLink}>
          View all tasks →
        </Link>
      </div>
    </div>
  );
}
