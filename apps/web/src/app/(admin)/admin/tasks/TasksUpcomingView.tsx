'use client';

import { useMemo } from 'react';
import { format, addDays, startOfDay, isToday, isTomorrow } from 'date-fns';
import type { Task } from '@/lib/admin/task-types';
import styles from './TasksUpcomingView.module.css';

const PRIORITY_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#f59e0b',
  3: '#60a5fa',
};

function dayLabel(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEE MMM d');
}

export function TasksUpcomingView({
  tasks,
  onOpenTask,
}: {
  tasks: Task[];
  onOpenTask?: (task: Task) => void;
}) {
  const todayMs = startOfDay(new Date()).getTime();
  const days = useMemo(
    () => {
      const tomorrow = new Date(todayMs);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return Array.from({ length: 14 }, (_, i) => addDays(tomorrow, i));
    },
    [todayMs],
  );

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.dueAt) continue;
      const key = format(startOfDay(new Date(t.dueAt)), 'yyyy-MM-dd');
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return map;
  }, [tasks]);

  return (
    <div className={styles.grid}>
      {days.map((day) => {
        const key = format(day, 'yyyy-MM-dd');
        const dayTasks = tasksByDay.get(key) ?? [];
        return (
          <div
            key={key}
            className={`${styles.row} ${isToday(day) ? styles.rowToday : ''}`}
          >
            <div className={styles.dayLabel}>
              <span className={styles.dayName}>{dayLabel(day)}</span>
            </div>
            <div className={styles.chips}>
              {dayTasks.length === 0 && (
                <span className={styles.empty}>-</span>
              )}
              {dayTasks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={styles.chip}
                  style={
                    t.priority < 4
                      ? {
                          borderLeftColor: PRIORITY_COLORS[t.priority],
                          borderLeftWidth: '3px',
                          borderLeftStyle: 'solid',
                        }
                      : undefined
                  }
                  onClick={() => onOpenTask?.(t)}
                  title={t.title}
                >
                  {t.priority < 4 && (
                    <span
                      className={styles.dot}
                      style={{ background: PRIORITY_COLORS[t.priority] }}
                    />
                  )}
                  <span className={styles.chipTitle}>
                    {t.title.length > 28 ? t.title.slice(0, 28) + '…' : t.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
