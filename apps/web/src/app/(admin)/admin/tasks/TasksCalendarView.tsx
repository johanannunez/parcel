'use client';

import { useState, useRef, useEffect, useCallback, useTransition } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import type { Task, TaskLabel } from '@/lib/admin/task-types';
import { createTask } from '@/lib/admin/task-actions';
import styles from './TasksCalendarView.module.css';

type Props = {
  tasks: Task[];
  labels: TaskLabel[];
  onOpenTask: (task: Task) => void;
  onTaskUpdate: (id: string, patch: Partial<Task>) => void;
};

const PRIORITY_COLORS: Record<1 | 2 | 3 | 4, string> = {
  1: '#ef4444',
  2: '#f59e0b',
  3: '#3b82f6',
  4: '#9ca3af',
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_VISIBLE_CHIPS = 3;

function getLocalDateStr(isoStr: string | null): string | null {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function buildTaskMap(tasks: Task[], month: Date): Map<string, Task[]> {
  const map = new Map<string, Task[]>();
  const year = month.getFullYear();
  const mo = month.getMonth();

  for (const task of tasks) {
    if (task.parentTaskId !== null) continue;
    const dateStr = getLocalDateStr(task.dueAt);
    if (!dateStr) continue;
    const d = new Date(task.dueAt as string);
    if (d.getFullYear() !== year || d.getMonth() !== mo) continue;
    const existing = map.get(dateStr);
    if (existing) {
      existing.push(task);
    } else {
      map.set(dateStr, [task]);
    }
  }
  return map;
}

function buildCellDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ─── Popover ────────────────────────────────────────────────────────────────

function DayPopover({
  tasks,
  anchorRef,
  onClose,
  onOpenTask,
}: {
  tasks: Task[];
  anchorRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onOpenTask: (task: Task) => void;
}) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, anchorRef]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div ref={popoverRef} className={styles.popover}>
      {tasks.map((task) => (
        <div
          key={task.id}
          className={styles.popoverItem}
          onClick={(e) => {
            e.stopPropagation();
            onOpenTask(task);
            onClose();
          }}
        >
          <span
            className={styles.priorityDot}
            style={{ background: PRIORITY_COLORS[task.priority] }}
          />
          <span>{task.title}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Inline create form ──────────────────────────────────────────────────────

function InlineCreateForm({
  dateStr,
  onCreated,
  onCancel,
}: {
  dateStr: string;
  onCreated: (task: Task) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [isSubmitting, startSubmit] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = useCallback(() => {
    const trimmed = title.trim();
    if (!trimmed) return;
    startSubmit(async () => {
      const { id } = await createTask({
        title: trimmed,
        dueAt: `${dateStr}T12:00:00`,
        priority: 4,
      });
      const newTask: Task = {
        id,
        parentTaskId: null,
        title: trimmed,
        description: null,
        status: 'todo',
        priority: 4,
        assigneeId: null,
        assigneeName: null,
        assigneeAvatarUrl: null,
        createdById: null,
        createdByName: null,
        dueAt: `${dateStr}T12:00:00`,
        completedAt: null,
        createdAt: new Date().toISOString(),
        parent: null,
        subtaskCount: 0,
        subtaskDoneCount: 0,
        tags: [],
        labelIds: [],
        linkedPropertyId: null,
        linkedContactId: null,
        linkedProjectId: null,
      };
      onCreated(newTask);
    });
  }, [title, dateStr, onCreated]);

  return (
    <div className={styles.createForm} onClick={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        type="text"
        className={styles.createInput}
        placeholder="Task name"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') onCancel();
        }}
      />
      <div className={styles.createActions}>
        <button
          type="button"
          className={styles.createBtn}
          onClick={submit}
          disabled={!title.trim() || isSubmitting}
        >
          Create
        </button>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Day cell ────────────────────────────────────────────────────────────────

function DayCell({
  day,
  dateStr,
  isToday,
  isCurrentMonth,
  tasks,
  popoverDay,
  createDay,
  onOpenTask,
  onMoreClick,
  onCellClick,
  onCreateDone,
  onCreateCancel,
}: {
  day: number;
  dateStr: string;
  isToday: boolean;
  isCurrentMonth: boolean;
  tasks: Task[];
  popoverDay: string | null;
  createDay: string | null;
  onOpenTask: (task: Task) => void;
  onMoreClick: (dateStr: string) => void;
  onCellClick: (dateStr: string) => void;
  onCreateDone: (task: Task) => void;
  onCreateCancel: () => void;
}) {
  const cellRef = useRef<HTMLDivElement>(null);
  const visibleTasks = tasks.slice(0, MAX_VISIBLE_CHIPS);
  const extraCount = tasks.length - MAX_VISIBLE_CHIPS;
  const isPopoverOpen = popoverDay === dateStr;
  const isCreating = createDay === dateStr;

  const cellClasses = [
    styles.dayCell,
    isToday ? styles.dayCellToday : '',
    !isCurrentMonth ? styles.dayCellEmpty : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={cellRef}
      className={cellClasses}
      onClick={() => {
        if (!isCurrentMonth) return;
        onCellClick(dateStr);
      }}
    >
      <span
        className={`${styles.dateNumber} ${isToday ? styles.dateNumberToday : ''}`}
      >
        {day}
      </span>

      {visibleTasks.map((task) => (
        <div
          key={task.id}
          className={styles.taskChip}
          onClick={(e) => {
            e.stopPropagation();
            onOpenTask(task);
          }}
        >
          <span
            className={styles.priorityDot}
            style={{ background: PRIORITY_COLORS[task.priority] }}
          />
          <span className={styles.chipTitle}>{task.title}</span>
        </div>
      ))}

      {extraCount > 0 && !isCreating && (
        <span
          className={styles.moreLink}
          onClick={(e) => {
            e.stopPropagation();
            onMoreClick(dateStr);
          }}
        >
          +{extraCount} more
        </span>
      )}

      {isPopoverOpen && (
        <DayPopover
          tasks={tasks}
          anchorRef={cellRef}
          onClose={() => onMoreClick('')}
          onOpenTask={onOpenTask}
        />
      )}

      {isCreating && (
        <InlineCreateForm
          dateStr={dateStr}
          onCreated={onCreateDone}
          onCancel={onCreateCancel}
        />
      )}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function TasksCalendarView({ tasks, onOpenTask }: Props) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState<Date>(() => startOfMonth(today));
  const [popoverDay, setPopoverDay] = useState<string | null>(null);
  const [createDay, setCreateDay] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);

  // Keep localTasks in sync when parent tasks prop changes
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const taskMap = buildTaskMap(localTasks, currentMonth);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Build cells: leading empty + month days + trailing empty
  type Cell = { type: 'empty'; key: string } | { type: 'day'; day: number; dateStr: string };
  const cells: Cell[] = [];

  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push({ type: 'empty', key: `pre-${i}` });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ type: 'day', day: d, dateStr: buildCellDateStr(year, month, d) });
  }
  const remainder = cells.length % 7;
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      cells.push({ type: 'empty', key: `post-${i}` });
    }
  }

  const goToPrevMonth = () => {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
    setPopoverDay(null);
    setCreateDay(null);
  };

  const goToNextMonth = () => {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
    setPopoverDay(null);
    setCreateDay(null);
  };

  const goToToday = () => {
    setCurrentMonth(startOfMonth(today));
    setPopoverDay(null);
    setCreateDay(null);
  };

  const handleMoreClick = (dateStr: string) => {
    setPopoverDay((prev) => (prev === dateStr || dateStr === '' ? null : dateStr));
    setCreateDay(null);
  };

  const handleCellClick = (dateStr: string) => {
    if (popoverDay) {
      setPopoverDay(null);
      return;
    }
    setCreateDay((prev) => (prev === dateStr ? null : dateStr));
  };

  const handleCreateDone = (task: Task) => {
    setLocalTasks((prev) => [...prev, task]);
    setCreateDay(null);
  };

  const handleCreateCancel = () => setCreateDay(null);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={goToPrevMonth}
          aria-label="Previous month"
        >
          <CaretLeft size={14} />
        </button>

        <span className={styles.monthLabel}>{formatMonthYear(currentMonth)}</span>

        <button
          type="button"
          className={styles.navBtn}
          onClick={goToNextMonth}
          aria-label="Next month"
        >
          <CaretRight size={14} />
        </button>

        <button type="button" className={styles.todayBtn} onClick={goToToday}>
          Today
        </button>
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {/* Day-of-week headers */}
        {DAY_LABELS.map((label) => (
          <div key={label} className={styles.dayHeader}>
            {label}
          </div>
        ))}

        {/* Cells */}
        {cells.map((cell) => {
          if (cell.type === 'empty') {
            return <div key={cell.key} className={`${styles.dayCell} ${styles.dayCellEmpty}`} />;
          }
          const cellTasks = taskMap.get(cell.dateStr) ?? [];
          return (
            <DayCell
              key={cell.dateStr}
              day={cell.day}
              dateStr={cell.dateStr}
              isToday={cell.dateStr === todayStr}
              isCurrentMonth
              tasks={cellTasks}
              popoverDay={popoverDay}
              createDay={createDay}
              onOpenTask={onOpenTask}
              onMoreClick={handleMoreClick}
              onCellClick={handleCellClick}
              onCreateDone={handleCreateDone}
              onCreateCancel={handleCreateCancel}
            />
          );
        })}
      </div>
    </div>
  );
}
