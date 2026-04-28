'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import type { Task } from '@/lib/admin/task-types';
import { ParentPill } from './ParentPill';
import { completeTask, uncompleteTask, updateTask } from '@/lib/admin/task-actions';
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
  const due = dueDisplay(task.dueAt);
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

  return (
    <>
      <div
        className={`${styles.row} ${task.status === 'done' ? styles.rowDone : ''} ${priorityClass}`}
        onClick={onOpen}
        style={{ cursor: onOpen ? 'pointer' : undefined }}
      >
        <button
          type="button"
          aria-label={task.status === 'done' ? 'Mark as todo' : 'Complete task'}
          className={`${styles.check} ${task.status === 'done' ? styles.checkDone : ''}`}
          onClick={(e) => { e.stopPropagation(); toggleComplete(e); }}
          disabled={isPending}
        />

        {/* Title cell */}
        <div className={styles.titleCell}>
          <div className={styles.titleText}>
            <span className={styles.titleTextInner}>{task.title}</span>
            {hasSubtasks ? (
              <span
                className={styles.chevron}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setExpanded((v) => !v);
                }}
                role="button"
                aria-label={expanded ? 'Collapse subtasks' : 'Expand subtasks'}
              >
                {expanded
                  ? <CaretDown size={12} weight="bold" />
                  : <CaretRight size={12} weight="bold" />}
              </span>
            ) : null}
          </div>
          {/* Metadata sub-line */}
          {(hasSubtasks || (showNeedsOwner && !assigned)) && (
            <div className={styles.titleMeta}>
              {hasSubtasks && (
                <span className={styles.subtaskBadge}>
                  {task.subtaskDoneCount}/{task.subtaskCount} subtasks
                </span>
              )}
              {showNeedsOwner && !assigned && (
                <>
                  <span className={styles.needsOwnerBadge}>Needs owner</span>
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
          )}
        </div>

        <div className={styles.parent}>
          <ParentPill parent={task.parent} />
        </div>
        <div
          className={`${styles.due} ${
            due.tone === 'overdue' ? styles.overdue :
            due.tone === 'today' ? styles.today :
            due.tone === 'soon' ? styles.soon : ''
          }`}
        >
          {due.label}
        </div>
        <div className={styles.assignee}>
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
            <span className={styles.avEmpty} aria-label="Unassigned">—</span>
          )}
        </div>

        {/* Hover actions */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.actionBtn}
            aria-label="Edit task"
            onClick={(e) => { e.stopPropagation(); onOpen?.(); }}
          >
            <PencilSimple size={16} />
          </button>
          <button
            type="button"
            className={styles.actionBtn}
            aria-label="Set due date"
          >
            <CalendarBlank size={16} />
          </button>
          <button
            type="button"
            className={styles.actionBtn}
            aria-label="More options"
          >
            <DotsThreeVertical size={16} />
          </button>
        </div>
      </div>

      {expanded && subtasks.length > 0 ? (
        <div className={styles.subWrap}>
          {subtasks.map((s) => (
            <div
              key={s.id}
              className={`${styles.subRow} ${s.status === 'done' ? styles.subDone : ''}`}
            >
              <span className={`${styles.check} ${styles.checkSm} ${s.status === 'done' ? styles.checkDone : ''}`} />
              <span className={styles.subTitle}>{s.title}</span>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
