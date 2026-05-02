'use client';

import { useRef, useMemo } from 'react';
import type { Task, TaskLabel } from '@/lib/admin/task-types';
import { TaskRow } from './TaskRow';
import { Plus } from '@phosphor-icons/react';
import styles from './TasksUpcomingView.module.css';

const DAYS_SHOWN = 14;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLocalDateStr(isoStr: string | null): string | null {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayLabel(date: Date, index: number): string {
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  if (index === 0) return `${dateStr} · Today · ${weekday}`;
  if (index === 1) return `${dateStr} · Tomorrow · ${weekday}`;
  return `${dateStr} · ${weekday}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  tasks: Task[];
  labels: TaskLabel[];
  onOpenTask: (task: Task) => void;
  onTaskUpdate?: (id: string, patch: Partial<Task>) => void;
  onCreateTask?: (dueAt: string) => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function TasksUpcomingView({ tasks, labels, onOpenTask, onCreateTask }: Props) {
  const dayRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Build the 14-day window starting from today
  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: DAYS_SHOWN }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  }, []);

  // Week strip: first 7 days only
  const weekDays = days.slice(0, 7);

  // Group top-level non-done tasks by local date
  const topLevelTasks = useMemo(
    () => tasks.filter((t) => t.parentTaskId === null && t.status !== 'done'),
    [tasks],
  );

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of topLevelTasks) {
      const key = getLocalDateStr(t.dueAt);
      if (!key) continue;
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return map;
  }, [topLevelTasks]);

  // Subtask lookup for TaskRow
  const subtasksByParent = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.parentTaskId) continue;
      const arr = map.get(t.parentTaskId) ?? [];
      arr.push(t);
      map.set(t.parentTaskId, arr);
    }
    return map;
  }, [tasks]);

  function scrollToDay(dateStr: string) {
    const el = dayRefs.current.get(dateStr);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className={styles.container}>
      {/* Week strip */}
      <div className={styles.weekStrip}>
        {weekDays.map((day, i) => {
          const dateStr = toDateStr(day);
          const isToday = i === 0;
          return (
            <button
              key={dateStr}
              type="button"
              className={styles.weekDay}
              onClick={() => scrollToDay(dateStr)}
              aria-label={dayLabel(day, i)}
            >
              <span className={styles.weekDayLabel}>
                {day.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
              </span>
              <span className={`${styles.weekDayNumber} ${isToday ? styles.weekDayNumberToday : ''}`}>
                {day.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Body: 14 day sections */}
      <div className={styles.body}>
        {days.map((day, i) => {
          const dateStr = toDateStr(day);
          const dayTasks = tasksByDay.get(dateStr) ?? [];

          return (
            <div
              key={dateStr}
              className={styles.daySection}
              ref={(el) => {
                if (el) dayRefs.current.set(dateStr, el);
              }}
            >
              <div className={styles.dayHeader}>{dayLabel(day, i)}</div>

              {dayTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  subtasks={subtasksByParent.get(task.id) ?? []}
                  labels={labels}
                  onOpen={() => onOpenTask(task)}
                />
              ))}

              <button
                type="button"
                className={styles.addTaskRow}
                onClick={() => {
                  const iso = day.toISOString();
                  onCreateTask?.(iso);
                }}
              >
                <Plus size={13} className={styles.addIcon} />
                <span>Add task</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
