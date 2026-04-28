'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import type { Task } from '@/lib/admin/task-types';
import { ParentPill } from './ParentPill';
import { completeTask, uncompleteTask } from '@/lib/admin/task-actions';
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

export function TaskRow({ task, subtasks = [], onOpen }: { task: Task; subtasks?: Task[]; onOpen?: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
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
        <div className={styles.title}>
          {task.title}
          {hasSubtasks ? (
            <button
              type="button"
              className={styles.subBadge}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
            >
              {task.subtaskDoneCount} / {task.subtaskCount} subtasks
            </button>
          ) : null}
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
        <button type="button" className={styles.menuBtn} aria-label="Task menu">⋯</button>
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
