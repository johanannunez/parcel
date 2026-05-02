'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import Image from 'next/image';
import type { Task, TaskLabel } from '@/lib/admin/task-types';
import { completeTask, uncompleteTask, updateTask, deleteTask } from '@/lib/admin/task-actions';
import {
  CalendarBlank,
  CaretRight,
  DotsThreeVertical,
  ArrowSquareOut,
  DotsSixVertical,
  GitBranch,
  Check,
} from '@phosphor-icons/react';
import { DatePickerDropdown } from './DatePickerDropdown';
import styles from './TaskRow.module.css';

// ─── Date helpers ─────────────────────────────────────────────────────────────

function humanDueLabel(iso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(iso: string, status: string): boolean {
  if (status === 'done') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  task: Task;
  subtasks?: Task[];
  labels: TaskLabel[];
  onOpen: () => void;
  showNeedsOwner?: boolean;
  currentUserId?: string | null;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  isFocused?: boolean;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function TaskRow({
  task,
  subtasks = [],
  labels,
  onOpen,
  showNeedsOwner,
  currentUserId,
  isSelected = false,
  onToggleSelect,
  isFocused = false,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [optimisticDone, setOptimisticDone] = useState(task.status === 'done');
  const [optimisticDeleted, setOptimisticDeleted] = useState(false);
  const [localDueAt, setLocalDueAt] = useState(task.dueAt);
  const [assigned, setAssigned] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [subtasksExpanded, setSubtasksExpanded] = useState(false);

  const calendarBtnRef = useRef<HTMLButtonElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const dotsBtnRef = useRef<HTMLButtonElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Sync optimisticDone when task.status changes from outside
  useEffect(() => {
    setOptimisticDone(task.status === 'done');
  }, [task.status]);

  // Close date picker on outside click
  useEffect(() => {
    if (!showDatePicker) return;
    function handleDown(e: MouseEvent) {
      if (
        datePickerRef.current && !datePickerRef.current.contains(e.target as Node) &&
        calendarBtnRef.current && !calendarBtnRef.current.contains(e.target as Node)
      ) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, [showDatePicker]);

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

  // ─── Computed values ──────────────────────────────────────────────────────

  const isDone = optimisticDone;
  const subtaskCount = task.subtaskCount || subtasks.length;
  const subtaskDoneCount = task.subtaskDoneCount || subtasks.filter((s) => s.status === 'done').length;
  const hasSubtasks = subtaskCount > 0;

  const dueOverdue = localDueAt ? isOverdue(localDueAt, isDone ? 'done' : 'todo') : false;

  // Resolve up to 2 label objects from task.labelIds
  const taskLabels: TaskLabel[] = [];
  for (const lid of task.labelIds ?? []) {
    const found = labels.find((l) => l.id === lid);
    if (found) taskLabels.push(found);
    if (taskLabels.length >= 2) break;
  }
  const extraLabels = Math.max(0, (task.labelIds?.length ?? 0) - 2);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const toggleComplete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nowDone = !isDone;
    setOptimisticDone(nowDone);
    startTransition(async () => {
      if (nowDone) await completeTask(task.id);
      else await uncompleteTask(task.id);
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

  const handleDueDateChange = (iso: string | null) => {
    setLocalDueAt(iso);
    setShowDatePicker(false);
    startTransition(async () => {
      await updateTask(task.id, { dueAt: iso });
    });
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
    setOptimisticDone(true);
    startTransition(async () => { await completeTask(task.id); });
  };

  // Priority left-border class
  const priorityClass =
    task.priority === 1 ? styles.p1 :
    task.priority === 2 ? styles.p2 :
    task.priority === 3 ? styles.p3 : '';

  return (
    <>
    <div
      className={`${styles.row} ${isDone ? styles.rowDone : ''} ${priorityClass} ${isSelected ? styles.rowSelected : ''} ${isFocused ? styles.rowFocused : ''}`}
      data-keyboard-focused={isFocused || undefined}
    >
      {/* ── Bulk select checkbox ─────────────────────────────────────────────── */}
      <div className={`${styles.selectWrap} ${isSelected ? styles.selectWrapVisible : ''}`}>
        <button
          type="button"
          className={`${styles.selectBox} ${isSelected ? styles.selectBoxChecked : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleSelect?.(task.id); }}
          aria-label={isSelected ? 'Deselect task' : 'Select task'}
        >
          {isSelected && <Check size={10} weight="bold" color="#fff" />}
        </button>
      </div>

      {/* ── Drag handle ─────────────────────────────────────────────────────── */}
      <div className={styles.dragHandle}>
        <DotsSixVertical size={14} color="var(--text-tertiary)" />
      </div>

      {/* ── Main body ────────────────────────────────────────────────────────── */}
      <div className={styles.body}>
        {/* Line 1: completion + title + hover actions */}
        <div className={styles.line1}>
          {/* Completion circle */}
          <button
            type="button"
            className={`${styles.completeCircle} ${isDone ? styles.completeCircleDone : ''}`}
            onClick={toggleComplete}
            disabled={isPending}
            aria-label={isDone ? 'Mark as to-do' : 'Complete task'}
          >
            {isDone && <Check size={9} weight="bold" color="#fff" />}
          </button>

          {/* Title */}
          <span
            className={`${styles.title} ${isDone ? styles.titleDone : ''}`}
            onClick={onOpen}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}
          >
            {task.title}
          </span>

          {/* Hover actions */}
          <div className={styles.hoverActions}>
            {/* Calendar / due date picker */}
            <div className={styles.actionWrap}>
              <button
                ref={calendarBtnRef}
                type="button"
                className={`${styles.actionBtn} ${showDatePicker ? styles.actionBtnActive : ''}`}
                onClick={(e) => { e.stopPropagation(); setShowContextMenu(false); setShowDatePicker((v) => !v); }}
                aria-label="Set due date"
              >
                <CalendarBlank size={15} />
              </button>
              {showDatePicker && (
                <div ref={datePickerRef} className={styles.datePickerWrap} onClick={(e) => e.stopPropagation()}>
                  <DatePickerDropdown
                    value={localDueAt}
                    onChange={handleDueDateChange}
                    onClose={() => setShowDatePicker(false)}
                  />
                </div>
              )}
            </div>

            {/* Open modal */}
            <button
              type="button"
              className={styles.actionBtn}
              onClick={(e) => { e.stopPropagation(); onOpen(); }}
              aria-label="Open task"
            >
              <ArrowSquareOut size={15} />
            </button>

            {/* Dots overflow */}
            <div className={styles.actionWrap}>
              <button
                ref={dotsBtnRef}
                type="button"
                className={`${styles.actionBtn} ${showContextMenu ? styles.actionBtnActive : ''}`}
                onClick={(e) => { e.stopPropagation(); setShowDatePicker(false); setShowContextMenu((v) => !v); }}
                aria-label="More options"
              >
                <DotsThreeVertical size={15} />
              </button>
              {showContextMenu && (
                <div ref={contextMenuRef} className={styles.contextMenu} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={styles.contextOption}
                    onClick={(e) => { e.stopPropagation(); setShowContextMenu(false); onOpen(); }}
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

        {/* Line 2: metadata */}
        {(hasSubtasks || localDueAt || taskLabels.length > 0 || task.parent || task.assigneeName || task.assigneeAvatarUrl || (showNeedsOwner && !assigned)) && (
          <div className={styles.line2}>
            {/* Subtask count */}
            {hasSubtasks && (
              <button
                type="button"
                className={`${styles.metaChip} ${styles.subtaskChip} ${styles.subtaskChipBtn}`}
                onClick={(e) => { e.stopPropagation(); setSubtasksExpanded((v) => !v); }}
                aria-expanded={subtasksExpanded}
              >
                <CaretRight size={10} weight="bold" className={subtasksExpanded ? styles.subtaskChevronOpen : styles.subtaskChevron} />
                <GitBranch size={11} />
                {subtaskDoneCount}/{subtaskCount}
              </button>
            )}

            {/* Due date */}
            {localDueAt && (
              <span className={`${styles.metaChip} ${dueOverdue ? styles.metaChipOverdue : ''}`}>
                <CalendarBlank size={11} />
                {humanDueLabel(localDueAt)}
              </span>
            )}

            {/* Label chips */}
            {taskLabels.map((label) => (
              <span key={label.id} className={styles.labelChip}>
                <span className={styles.labelDot} style={{ background: label.color }} />
                {label.name}
              </span>
            ))}
            {extraLabels > 0 && (
              <span className={styles.labelChipMore}>+{extraLabels} more</span>
            )}

            {/* Needs owner badge */}
            {showNeedsOwner && !assigned && !task.assigneeName && !task.assigneeAvatarUrl && (
              <>
                <span className={styles.needsOwnerBadge}>
                  <span className={styles.needsOwnerDot} />
                  Needs owner
                </span>
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

            {/* Parent chip — pushed to right */}
            {task.parent && (
              <span className={styles.parentChip}>
                {task.parent.label}
              </span>
            )}

            {/* Assignee avatar */}
            {task.assigneeAvatarUrl ? (
              <Image
                src={task.assigneeAvatarUrl}
                alt={task.assigneeName ?? 'Assignee'}
                width={16}
                height={16}
                className={styles.avatar}
              />
            ) : task.assigneeName ? (
              <span className={styles.avatarFallback} aria-label={task.assigneeName}>
                {task.assigneeName.split(' ').map((p) => p[0]).slice(0, 2).join('')}
              </span>
            ) : null}
          </div>
        )}
      </div>
    </div>

    {subtasksExpanded && subtasks.length > 0 && (
      <div className={styles.subtaskDrawer}>
        {subtasks.map((sub) => (
          <div key={sub.id} className={styles.subtaskDrawerRow}>
            <button
              type="button"
              className={`${styles.completeCircle} ${sub.status === 'done' ? styles.completeCircleDone : ''}`}
              onClick={(e) => { e.stopPropagation(); startTransition(async () => { await completeTask(sub.id); }); }}
              aria-label={sub.status === 'done' ? 'Mark as to-do' : 'Complete subtask'}
            >
              {sub.status === 'done' && <Check size={9} weight="bold" color="#fff" />}
            </button>
            <span
              className={`${styles.subtaskTitle} ${sub.status === 'done' ? styles.titleDone : ''}`}
              onClick={onOpen}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}
            >
              {sub.title}
            </span>
            {sub.dueAt && (
              <span className={`${styles.metaChip} ${isOverdue(sub.dueAt, sub.status) ? styles.metaChipOverdue : ''}`}>
                <CalendarBlank size={10} />
                {humanDueLabel(sub.dueAt)}
              </span>
            )}
          </div>
        ))}
      </div>
    )}
    </>
  );
}
