'use client';

import { useMemo } from 'react';
import { format, addDays, startOfDay, isToday, isTomorrow } from 'date-fns';
import type { Task } from '@/lib/admin/task-types';
import { ParentPill } from './ParentPill';
import styles from './TasksUpcomingView.module.css';

const PRIORITY_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#f59e0b',
  3: '#60a5fa',
};

const DAYS_SHOWN = 14;

function relativeLabel(date: Date): string | null {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return null;
}

function hasTimeComponent(dueAt: string): boolean {
  const d = new Date(dueAt);
  return d.getHours() !== 0 || d.getMinutes() !== 0 || d.getSeconds() !== 0;
}

export function TasksUpcomingView({
  tasks,
  onOpenTask,
}: {
  tasks: Task[];
  onOpenTask?: (task: Task) => void;
}) {
  const todayStart = startOfDay(new Date());

  const days = useMemo(
    () => Array.from({ length: DAYS_SHOWN }, (_, i) => addDays(todayStart, i)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [todayStart.getTime()],
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

  function scrollToDay(key: string) {
    document.getElementById(key)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className={styles.root}>
      {/* Week strip */}
      <div className={styles.weekStrip}>
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const today = isToday(day);
          return (
            <button
              key={key}
              type="button"
              className={`${styles.dayButton} ${today ? styles.dayButtonToday : ''}`}
              onClick={() => scrollToDay(key)}
            >
              <span className={styles.dayButtonName}>{format(day, 'EEE')}</span>
              <span className={`${styles.dayButtonNum} ${today ? styles.dayButtonNumToday : ''}`}>
                {format(day, 'd')}
              </span>
            </button>
          );
        })}
      </div>

      {/* Date-grouped list */}
      <div className={styles.list}>
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDay.get(key) ?? [];
          const rel = relativeLabel(day);

          return (
            <div key={key} id={key} className={styles.section}>
              {/* Section header */}
              <div className={styles.sectionHeader}>
                <span className={styles.headerDate}>{format(day, 'MMM d')}</span>
                {rel && (
                  <>
                    <span className={styles.headerSep}>·</span>
                    <span className={styles.headerRel}>{rel}</span>
                  </>
                )}
                <span className={styles.headerSep}>·</span>
                <span className={styles.headerDay}>{format(day, 'EEEE')}</span>
              </div>

              {/* Task rows */}
              {dayTasks.map((task) => {
                const priorityColor =
                  task.priority < 4 ? PRIORITY_COLORS[task.priority] : undefined;
                const showTime = task.dueAt != null && hasTimeComponent(task.dueAt);

                return (
                  <div
                    key={task.id}
                    className={styles.taskRow}
                    style={
                      priorityColor
                        ? { borderLeft: `3px solid ${priorityColor}`, paddingLeft: '10px' }
                        : { paddingLeft: '13px' }
                    }
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenTask?.(task)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onOpenTask?.(task);
                      }
                    }}
                  >
                    <span className={styles.taskCheckbox} aria-hidden />
                    <div className={styles.taskMain}>
                      <span className={styles.taskTitle}>{task.title}</span>
                      {(showTime || task.parent) && (
                        <div className={styles.taskMeta}>
                          {showTime && task.dueAt && (
                            <span className={styles.taskTime}>
                              {format(new Date(task.dueAt), 'h:mm a')}
                            </span>
                          )}
                          {task.parent && <ParentPill parent={task.parent} />}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Empty placeholder */}
              {dayTasks.length === 0 && (
                <div className={styles.addTaskPlaceholder}>+ Add task</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
