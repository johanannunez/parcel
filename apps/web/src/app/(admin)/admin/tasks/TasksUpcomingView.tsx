'use client';

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useTransition,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  format,
  addDays,
  startOfDay,
  isToday,
  isTomorrow,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { CaretLeft, CaretRight, CaretDown, Plus } from '@phosphor-icons/react';
import type { Task, TaskGroup } from '@/lib/admin/task-types';
import { updateTask, createTask } from '@/lib/admin/task-actions';
import { ParentPill } from './ParentPill';
import styles from './TasksUpcomingView.module.css';

const PRIORITY_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#f59e0b',
  3: '#60a5fa',
};

function relativeLabel(date: Date): string | null {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return null;
}

function hasTimeComponent(dueAt: string): boolean {
  const d = new Date(dueAt);
  return d.getHours() !== 0 || d.getMinutes() !== 0 || d.getSeconds() !== 0;
}

// ─── Month Calendar popover ─────────────────────────────────────────────────

function MonthCalendar({
  month,
  onMonthChange,
  onSelectDate,
}: {
  month: Date;
  onMonthChange: (d: Date) => void;
  onSelectDate: (d: Date) => void;
}) {
  const firstDay = startOfMonth(month);
  const lastDay = endOfMonth(month);
  const days = eachDayOfInterval({ start: firstDay, end: lastDay });
  const startPad = getDay(firstDay); // 0=Sunday
  const blanks = Array.from({ length: startPad });

  return (
    <div className={styles.monthCal}>
      <div className={styles.monthCalNav}>
        <button
          type="button"
          onClick={() => onMonthChange(subMonths(month, 1))}
        >
          <CaretLeft size={12} />
        </button>
        <span className={styles.monthCalTitle}>{format(month, 'MMMM yyyy')}</span>
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, 1))}
        >
          <CaretRight size={12} />
        </button>
      </div>
      <div className={styles.monthCalGrid}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i} className={styles.monthCalDow}>
            {d}
          </span>
        ))}
        {blanks.map((_, i) => (
          <span key={`b${i}`} />
        ))}
        {days.map((d) => (
          <button
            key={d.toISOString()}
            type="button"
            className={`${styles.monthCalDay} ${isToday(d) ? styles.monthCalToday : ''}`}
            onClick={() => onSelectDate(d)}
          >
            {format(d, 'd')}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function TasksUpcomingView({
  tasks,
  groups,
  onOpenTask,
}: {
  tasks: Task[];
  groups?: TaskGroup[];
  onOpenTask?: (task: Task) => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Week navigation
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  // Month calendar popover
  const [showMonthCal, setShowMonthCal] = useState(false);
  const [calMonth, setCalMonth] = useState(() => new Date());
  const monthBtnRef = useRef<HTMLButtonElement>(null);
  const monthCalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMonthCal) return;
    function handleMouseDown(e: MouseEvent) {
      if (
        monthBtnRef.current?.contains(e.target as Node) ||
        monthCalRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setShowMonthCal(false);
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [showMonthCal]);

  // Overdue reschedule state
  const [confirmReschedule, setConfirmReschedule] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  const overdueTasks = groups?.find((g) => g.bucket === 'overdue')?.tasks ?? [];

  async function handleRescheduleAll() {
    setRescheduling(true);
    const todayIso = format(new Date(), "yyyy-MM-dd'T'00:00:00");
    await Promise.all(overdueTasks.map((t) => updateTask(t.id, { dueAt: todayIso })));
    setRescheduling(false);
    setConfirmReschedule(false);
    router.refresh();
  }

  // Per-date add task
  const [addingForDate, setAddingForDate] = useState<string | null>(null);
  const [addTitle, setAddTitle] = useState('');
  const [adding, setAdding] = useState(false);

  async function handleAddTask(dateKey: string) {
    const trimmed = addTitle.trim();
    if (!trimmed) return;
    setAdding(true);
    try {
      await createTask({ title: trimmed, dueAt: `${dateKey}T00:00:00` });
      setAddingForDate(null);
      setAddTitle('');
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setAdding(false);
    }
  }

  // Tasks keyed by date for the week view
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

  function scrollToDate(key: string) {
    document.getElementById(key)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className={styles.root}>
      {/* Overdue section */}
      {overdueTasks.length > 0 && (
        <div className={styles.overdueSection}>
          <div className={styles.overdueHeader}>
            <span className={styles.overdueLabel}>OVERDUE</span>
            <span className={styles.overdueBadge}>{overdueTasks.length}</span>
            {!confirmReschedule ? (
              <button
                type="button"
                className={styles.rescheduleBtn}
                onClick={() => setConfirmReschedule(true)}
              >
                Reschedule all
              </button>
            ) : (
              <div className={styles.rescheduleConfirm}>
                <span>Move {overdueTasks.length} task{overdueTasks.length !== 1 ? 's' : ''} to today?</span>
                <button
                  type="button"
                  className={styles.rescheduleCancelBtn}
                  onClick={() => setConfirmReschedule(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.rescheduleConfirmBtn}
                  disabled={rescheduling}
                  onClick={handleRescheduleAll}
                >
                  Move
                </button>
              </div>
            )}
          </div>
          {overdueTasks.map((task) => (
            <div
              key={task.id}
              className={styles.overdueRow}
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
              <span className={styles.overdueCircle} aria-hidden />
              <span className={styles.overdueTitle}>{task.title}</span>
              {task.dueAt && (
                <span className={styles.overdueDate}>
                  {format(new Date(task.dueAt), 'MMM d')}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Nav header: month button + week navigation arrows */}
      <div className={styles.navHeader}>
        <div className={styles.monthBtnWrap}>
          <button
            ref={monthBtnRef}
            type="button"
            className={styles.monthBtn}
            onClick={() => {
              setCalMonth(weekStart);
              setShowMonthCal((v) => !v);
            }}
          >
            {format(weekStart, 'MMMM yyyy')}
            <CaretDown size={12} />
          </button>
          {showMonthCal && (
            <div ref={monthCalRef} className={styles.monthCalPopover}>
              <MonthCalendar
                month={calMonth}
                onMonthChange={setCalMonth}
                onSelectDate={(d) => {
                  setWeekStart(startOfWeek(d, { weekStartsOn: 1 }));
                  setShowMonthCal(false);
                  setTimeout(() => scrollToDate(format(d, 'yyyy-MM-dd')), 50);
                }}
              />
            </div>
          )}
        </div>

        <div className={styles.weekNav}>
          <button
            type="button"
            className={styles.weekNavBtn}
            onClick={() => setWeekStart(addDays(weekStart, -7))}
          >
            ‹ Prev
          </button>
          <button
            type="button"
            className={styles.weekNavBtn}
            onClick={() => {
              const today = startOfWeek(new Date(), { weekStartsOn: 1 });
              setWeekStart(today);
              setTimeout(() => scrollToDate(format(new Date(), 'yyyy-MM-dd')), 50);
            }}
          >
            Today
          </button>
          <button
            type="button"
            className={styles.weekNavBtn}
            onClick={() => setWeekStart(addDays(weekStart, 7))}
          >
            Next ›
          </button>
        </div>
      </div>

      {/* 7-day strip */}
      <div className={styles.weekStrip}>
        {weekDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const today = isToday(day);
          return (
            <button
              key={key}
              type="button"
              className={`${styles.dayBtn} ${today ? styles.dayBtnToday : ''}`}
              onClick={() => scrollToDate(key)}
            >
              <span className={styles.dayName}>{format(day, 'EEE').toUpperCase()}</span>
              <span className={today ? styles.dayNumToday : styles.dayNum}>
                {format(day, 'd')}
              </span>
            </button>
          );
        })}
      </div>

      {/* Date-grouped list */}
      <div className={styles.list}>
        {weekDays.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDay.get(key) ?? [];
          const rel = relativeLabel(day);
          const isAddingHere = addingForDate === key;

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

              {/* Add task inline form or button */}
              {isAddingHere ? (
                <div className={styles.addTaskForm}>
                  <input
                    autoFocus
                    type="text"
                    className={styles.addTaskInput}
                    placeholder="Task name"
                    value={addTitle}
                    onChange={(e) => setAddTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTask(key);
                      if (e.key === 'Escape') {
                        setAddingForDate(null);
                        setAddTitle('');
                      }
                    }}
                  />
                  <div className={styles.addTaskActions}>
                    <button
                      type="button"
                      className={styles.addTaskCancel}
                      onClick={() => {
                        setAddingForDate(null);
                        setAddTitle('');
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={styles.addTaskSubmit}
                      disabled={adding || !addTitle.trim()}
                      onClick={() => handleAddTask(key)}
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.addTask}
                  onClick={() => {
                    setAddingForDate(key);
                    setAddTitle('');
                  }}
                >
                  <Plus size={12} weight="bold" />
                  Add task
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
