'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import Image from 'next/image';
import { format, parseISO, getHours, getMinutes } from 'date-fns';
import type { Task } from '@/lib/admin/task-types';
import { ParentPill } from './ParentPill';
import { completeTask, uncompleteTask, updateTask, deleteTask } from '@/lib/admin/task-actions';
import {
  CaretDown,
  CaretRight,
  PencilSimple,
  CalendarBlank,
  DotsThreeVertical,
} from '@phosphor-icons/react';
import styles from './TaskRow.module.css';

function dueDisplay(iso: string | null): { label: string; tone: string } {
  if (!iso) return { label: '—', tone: 'neutral' };
  const now = new Date();
  const due = new Date(iso);
  const diff = due.getTime() - now.getTime();
  const days = Math.floor(diff / 86400_000);
  if (diff < 0) {
    const ago = Math.max(1, Math.abs(days));
    return { label: `${ago}d late`, tone: 'overdue' };
  }
  if (days === 0) return { label: 'Today', tone: 'today' };
  if (days === 1) return { label: 'Tomorrow', tone: 'soon' };
  if (days < 7) return { label: due.toLocaleDateString(undefined, { weekday: 'short' }), tone: 'soon' };
  return { label: due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), tone: 'neutral' };
}

function quickDateISO(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

const QUICK_DATE_PRESETS = [
  { label: 'Today', getISO: () => quickDateISO(0), dayLabel: () => new Date().toLocaleDateString(undefined, { weekday: 'short' }) },
  { label: 'Tomorrow', getISO: () => quickDateISO(1), dayLabel: () => new Date(Date.now() + 86400000).toLocaleDateString(undefined, { weekday: 'short' }) },
  { label: 'Next week', getISO: () => quickDateISO(7), dayLabel: () => new Date(Date.now() + 7 * 86400000).toLocaleDateString(undefined, { weekday: 'short' }) },
  { label: 'No date', getISO: () => null, dayLabel: () => '' },
] as const;

// ─── MetaLine ────────────────────────────────────────────────────────────────

function MetaLine({
  task,
  due,
  onDateClick,
}: {
  task: Task;
  due: ReturnType<typeof dueDisplay> | null;
  onDateClick: (e: React.MouseEvent) => void;
}) {
  const hasContent =
    task.subtaskCount > 0 ||
    due !== null ||
    task.parent !== null ||
    task.tags.length > 0;
  if (!hasContent) return null;

  const hasTime = task.dueAt
    ? getHours(parseISO(task.dueAt)) !== 0 || getMinutes(parseISO(task.dueAt)) !== 0
    : false;

  return (
    <div className={styles.metaLine}>
      {task.subtaskCount > 0 && (
        <span className={styles.metaSubtasks}>
          {task.subtaskDoneCount}/{task.subtaskCount}
        </span>
      )}
      {due && task.dueAt && (
        <button
          type="button"
          className={`${styles.metaDue} ${styles[`dueTone_${due.tone}`]}`}
          onClick={onDateClick}
        >
          {hasTime
            ? `${due.label} ${format(parseISO(task.dueAt), 'h:mm a')}`
            : due.label}
        </button>
      )}
      {task.parent && (
        <span className={styles.metaParent}>
          <ParentPill parent={task.parent} compact />
        </span>
      )}
      {task.tags.map((tag) => (
        <span key={tag} className={styles.metaTag}>
          #{tag}
        </span>
      ))}
    </div>
  );
}

// ─── TaskRow ─────────────────────────────────────────────────────────────────

export function TaskRow({
  task,
  subtasks = [],
  onOpen,
  showNeedsOwner,
  currentUserId,
}: {
  task: Task;
  subtasks?: Task[];
  onOpen?: () => void;
  showNeedsOwner?: boolean;
  currentUserId?: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [assigned, setAssigned] = useState(false);
  const [optimisticDeleted, setOptimisticDeleted] = useState(false);
  const [showQuickDate, setShowQuickDate] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [localDueAt, setLocalDueAt] = useState(task.dueAt);

  const calendarBtnRef = useRef<HTMLButtonElement>(null);
  const quickDateRef = useRef<HTMLDivElement>(null);
  const dotsBtnRef = useRef<HTMLButtonElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Close quick-date on outside click
  useEffect(() => {
    if (!showQuickDate) return;
    function handleDown(e: MouseEvent) {
      if (
        quickDateRef.current && !quickDateRef.current.contains(e.target as Node) &&
        calendarBtnRef.current && !calendarBtnRef.current.contains(e.target as Node)
      ) {
        setShowQuickDate(false);
      }
    }
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, [showQuickDate]);

  // Close context menu on outside click
  useEffect(() => {
    if (!showContextMenu) return;
    function handleDown(e: MouseEvent) {
      if (
        contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node) &&
        dotsBtnRef.current && !dotsBtnRef.current.contains(e.target as Node)
      ) {
        setShowContextMenu(false);
      }
    }
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, [showContextMenu]);

  if (optimisticDeleted) return null;

  const due = localDueAt ? dueDisplay(localDueAt) : null;
  const hasSubtasks = task.subtaskCount > 0 || subtasks.length > 0;

  const priorityClass =
    task.priority === 1 ? styles.p1 :
    task.priority === 2 ? styles.p2 :
    task.priority === 3 ? styles.p3 : '';

  const toggleComplete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      if (task.status === 'done') await uncompleteTask(task.id);
      else await completeTask(task.id);
    });
  };

  const handleAssignToMe = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUserId) return;
    setAssigned(true);
    startTransition(async () => {
      await updateTask(task.id, { assigneeId: currentUserId });
    });
  };

  const handleQuickDate = (e: React.MouseEvent, getISO: () => string | null) => {
    e.stopPropagation();
    const iso = getISO();
    setLocalDueAt(iso);
    setShowQuickDate(false);
    startTransition(async () => { await updateTask(task.id, { dueAt: iso }); });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOptimisticDeleted(true);
    setShowContextMenu(false);
    startTransition(async () => { await deleteTask(task.id); });
  };

  const handleMarkComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowContextMenu(false);
    startTransition(async () => { await completeTask(task.id); });
  };

  const handleDateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowContextMenu(false);
    setShowQuickDate((v) => !v);
  };

  return (
    <>
      <div
        className={`${styles.row} ${task.status === 'done' ? styles.rowDone : ''} ${priorityClass}`}
        onClick={onOpen}
        style={{ cursor: onOpen ? 'pointer' : undefined }}
      >
        {/* Completion checkbox */}
        <button
          type="button"
          aria-label={task.status === 'done' ? 'Mark as todo' : 'Complete task'}
          className={`${styles.check} ${task.status === 'done' ? styles.checkDone : ''}`}
          onClick={(e) => { e.stopPropagation(); toggleComplete(e); }}
          disabled={isPending}
        />

        {/* Title block — two lines */}
        <div className={styles.titleBlock}>
          <div className={styles.titleLine}>
            <span className={`${styles.titleText} ${task.status === 'done' ? styles.titleDone : ''}`}>
              {task.title}
            </span>
            {hasSubtasks && (
              <button
                type="button"
                className={styles.expandBtn}
                aria-label={expanded ? 'Collapse subtasks' : 'Expand subtasks'}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setExpanded((v) => !v);
                }}
              >
                {expanded
                  ? <CaretDown size={12} weight="bold" />
                  : <CaretRight size={12} weight="bold" />}
              </button>
            )}
            {showNeedsOwner && !assigned && (
              <>
                <span className={styles.needsOwner}>Needs owner</span>
                {currentUserId && (
                  <button
                    type="button"
                    className={styles.assignMeBtn}
                    onClick={handleAssignToMe}
                  >
                    Assign to me
                  </button>
                )}
              </>
            )}
          </div>

          <MetaLine task={task} due={due} onDateClick={handleDateClick} />
        </div>

        {/* Right column: assignee + hover actions */}
        <div className={styles.rightCol}>
          <div className={styles.assigneeWrap}>
            {task.assigneeAvatarUrl ? (
              <Image
                src={task.assigneeAvatarUrl}
                alt={task.assigneeName ?? 'Assignee'}
                width={22}
                height={22}
                className={styles.av}
              />
            ) : task.assigneeName ? (
              <span className={styles.avFallback} aria-label={task.assigneeName}>
                {task.assigneeName.split(' ').map((p) => p[0]).slice(0, 2).join('')}
              </span>
            ) : (
              <span className={styles.avEmpty} aria-label="Unassigned" />
            )}
          </div>

          <div className={styles.hoverActions}>
            {/* Pencil — opens modal */}
            <button
              type="button"
              className={styles.actionBtn}
              aria-label="Edit task"
              onClick={(e) => { e.stopPropagation(); onOpen?.(); }}
            >
              <PencilSimple size={16} />
            </button>

            {/* Calendar — quick-date popover */}
            <div className={styles.actionWrap}>
              <button
                ref={calendarBtnRef}
                type="button"
                className={`${styles.actionBtn} ${showQuickDate ? styles.actionBtnActive : ''}`}
                aria-label="Set due date"
                onClick={(e) => { e.stopPropagation(); setShowContextMenu(false); setShowQuickDate((v) => !v); }}
              >
                <CalendarBlank size={16} />
              </button>
              {showQuickDate && (
                <div ref={quickDateRef} className={styles.quickDatePanel} onClick={(e) => e.stopPropagation()}>
                  {QUICK_DATE_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      className={styles.quickDateOption}
                      onClick={(e) => handleQuickDate(e, p.getISO)}
                    >
                      <span>{p.label}</span>
                      {p.dayLabel() && <span className={styles.quickDateDay}>{p.dayLabel()}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dots — context menu */}
            <div className={styles.actionWrap}>
              <button
                ref={dotsBtnRef}
                type="button"
                className={`${styles.actionBtn} ${showContextMenu ? styles.actionBtnActive : ''}`}
                aria-label="More options"
                onClick={(e) => { e.stopPropagation(); setShowQuickDate(false); setShowContextMenu((v) => !v); }}
              >
                <DotsThreeVertical size={16} />
              </button>
              {showContextMenu && (
                <div ref={contextMenuRef} className={styles.contextMenu} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={styles.contextOption}
                    onClick={(e) => { e.stopPropagation(); setShowContextMenu(false); onOpen?.(); }}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    className={styles.contextOption}
                    onClick={handleMarkComplete}
                  >
                    Mark complete
                  </button>
                  <div className={styles.contextDivider} />
                  <button
                    type="button"
                    className={`${styles.contextOption} ${styles.contextOptionDanger}`}
                    onClick={handleDelete}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {expanded && subtasks.length > 0 ? (
        <div className={styles.subWrap}>
          {subtasks.map((s) => (
            <div
              key={s.id}
              className={`${styles.subRow} ${s.status === 'done' ? styles.subDone : ''}`}
            >
              <span className={`${styles.checkSm} ${s.status === 'done' ? styles.checkDone : ''}`} />
              <span className={styles.subTitle}>{s.title}</span>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
