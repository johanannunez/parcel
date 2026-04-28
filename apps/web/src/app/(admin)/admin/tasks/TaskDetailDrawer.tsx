'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Task } from '@/lib/admin/task-types';
import { updateTask, completeTask, uncompleteTask } from '@/lib/admin/task-actions';
import styles from './TaskDetailDrawer.module.css';

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  done: 'Done',
};

const PRIORITY_OPTIONS = [
  { value: 1 as const, label: 'Urgent', color: '#ef4444' },
  { value: 2 as const, label: 'High',   color: '#f59e0b' },
  { value: 3 as const, label: 'Medium', color: '#60a5fa' },
  { value: 4 as const, label: 'None',   color: '' },
] as const;

function formatDueDate(iso: string | null): string {
  if (!iso) return 'No due date';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function dueDatePreset(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function TaskDetailDrawer({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  useEffect(() => {
    if (task) {
      setTitleDraft(task.title);
      setEditingTitle(false);
    }
  }, [task?.id]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  const saveTitle = useCallback(() => {
    if (!task || !titleDraft.trim() || titleDraft === task.title) {
      setEditingTitle(false);
      return;
    }
    startTransition(async () => {
      await updateTask(task.id, { title: titleDraft.trim() });
      setEditingTitle(false);
    });
  }, [task, titleDraft]);

  const toggleDone = useCallback(() => {
    if (!task) return;
    startTransition(async () => {
      if (task.status === 'done') await uncompleteTask(task.id);
      else await completeTask(task.id);
    });
  }, [task]);

  const setDue = useCallback((iso: string | null) => {
    if (!task) return;
    startTransition(() => { updateTask(task.id, { dueAt: iso }); });
  }, [task]);

  const setPriority = useCallback((value: 1 | 2 | 3 | 4) => {
    if (!task) return;
    startTransition(() => { updateTask(task.id, { priority: value }); });
  }, [task]);

  return (
    <AnimatePresence>
      {task && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className={styles.drawer}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            aria-label="Task details"
          >
            <div className={styles.header}>
              <button
                type="button"
                className={`${styles.completeBtn} ${task.status === 'done' ? styles.completeBtnDone : ''}`}
                onClick={toggleDone}
                disabled={isPending}
                aria-label={task.status === 'done' ? 'Mark incomplete' : 'Mark complete'}
              />
              {editingTitle ? (
                <input
                  className={styles.titleInput}
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveTitle();
                    if (e.key === 'Escape') { setTitleDraft(task.title); setEditingTitle(false); }
                  }}
                  autoFocus
                />
              ) : (
                <h2
                  className={`${styles.title} ${task.status === 'done' ? styles.titleDone : ''}`}
                  onClick={() => setEditingTitle(true)}
                  title="Click to edit"
                >
                  {task.title}
                </h2>
              )}
              <button
                type="button"
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className={styles.meta}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Status</span>
                <span className={`${styles.statusBadge} ${styles[`status_${task.status}`]}`}>
                  {STATUS_LABELS[task.status] ?? task.status}
                </span>
              </div>

              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Priority</span>
                <div className={styles.priorityPills}>
                  {PRIORITY_OPTIONS.map(({ value, label, color }) => (
                    <button
                      key={value}
                      type="button"
                      className={`${styles.priorityPill} ${task.priority === value ? styles.priorityPillActive : ''}`}
                      style={task.priority === value && color ? { borderColor: color, color } : undefined}
                      onClick={() => setPriority(value)}
                      disabled={isPending}
                      aria-pressed={task.priority === value}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Due</span>
                <div className={styles.dueSection}>
                  <span className={styles.dueDisplay}>{formatDueDate(task.dueAt)}</span>
                  <div className={styles.duePresets}>
                    <button type="button" className={styles.duePreset} onClick={() => setDue(dueDatePreset(0))} disabled={isPending}>Today</button>
                    <button type="button" className={styles.duePreset} onClick={() => setDue(dueDatePreset(1))} disabled={isPending}>Tomorrow</button>
                    <button type="button" className={styles.duePreset} onClick={() => setDue(dueDatePreset(7))} disabled={isPending}>Next week</button>
                    {task.dueAt && (
                      <button type="button" className={`${styles.duePreset} ${styles.duePresetClear}`} onClick={() => setDue(null)} disabled={isPending}>Clear</button>
                    )}
                  </div>
                </div>
              </div>

              {task.parent && (
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>Context</span>
                  <span className={styles.parentPill}>{task.parent.label}</span>
                </div>
              )}
            </div>

            <div className={styles.body}>
              <p className={styles.sectionLabel}>Description</p>
              {task.description ? (
                <TaskDescription html={task.description} />
              ) : (
                <p className={styles.emptyText}>No description.</p>
              )}

              {task.subtaskCount > 0 && (
                <>
                  <p className={styles.sectionLabel} style={{ marginTop: 20 }}>Subtasks</p>
                  <p className={styles.subtaskCount}>
                    {task.subtaskDoneCount} of {task.subtaskCount} done
                  </p>
                </>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// Description content is sanitized on write via sanitizeHtml in task-actions.ts.
// We render it as HTML to preserve any formatting the user entered.
function TaskDescription({ html }: { html: string }) {
  return (
    <div
      className={styles.description}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
