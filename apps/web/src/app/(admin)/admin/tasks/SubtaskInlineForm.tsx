'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import type { Task, TaskLabel } from '@/lib/admin/task-types';
import { createTask, completeTask, uncompleteTask } from '@/lib/admin/task-actions';
import {
  CalendarBlank,
  Flag,
  Tag,
  CaretDown,
  CaretUp,
  Check,
} from '@phosphor-icons/react';
import styles from './SubtaskInlineForm.module.css';

// ─── Props ────────────────────────────────────────────────────────────────────

export type SubtaskInlineFormProps = {
  parentTaskId: string;
  subtasks: Task[];
  labels: TaskLabel[];
  onCreated?: () => void;
  onOpenSubtask?: (task: Task) => void;
};

// ─── Priority dot color ───────────────────────────────────────────────────────

function priorityColor(priority: 1 | 2 | 3 | 4): string {
  if (priority === 1) return '#ef4444';
  if (priority === 2) return '#f59e0b';
  if (priority === 3) return '#60a5fa';
  return '#d1d5db';
}

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

// ─── SubtaskRow ───────────────────────────────────────────────────────────────

function SubtaskRowItem({
  subtask,
  onOpenSubtask,
}: {
  subtask: Task;
  onOpenSubtask?: (task: Task) => void;
}) {
  const [, startTransition] = useTransition();
  const [isDone, setIsDone] = useState(subtask.status === 'done');
  const [editing, setEditing] = useState(false);
  const titleRef = useRef<HTMLSpanElement>(null);

  const toggleDone = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nowDone = !isDone;
    setIsDone(nowDone);
    startTransition(async () => {
      if (nowDone) await completeTask(subtask.id);
      else await uncompleteTask(subtask.id);
    });
  };

  const handleBlur = () => {
    setEditing(false);
    // Title editing via contentEditable is intentionally read-only in this list view.
    // Full editing is done via onOpenSubtask.
    if (titleRef.current) {
      titleRef.current.innerText = subtask.title;
    }
  };

  return (
    <div className={styles.subtaskRow}>
      {/* Completion circle */}
      <button
        type="button"
        className={`${styles.subtaskCircle} ${isDone ? styles.subtaskCircleDone : ''}`}
        onClick={toggleDone}
        aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
      >
        {isDone && <Check size={8} weight="bold" color="#fff" />}
      </button>

      {/* Title */}
      <span
        ref={titleRef}
        className={`${styles.subtaskTitle} ${isDone ? styles.subtaskTitleDone : ''} ${editing ? styles.subtaskTitleEditing : ''}`}
        contentEditable={editing}
        suppressContentEditableWarning
        onDoubleClick={() => { setEditing(true); setTimeout(() => titleRef.current?.focus(), 0); }}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); handleBlur(); }
          if (e.key === 'Escape') { setEditing(false); if (titleRef.current) titleRef.current.innerText = subtask.title; }
        }}
        onClick={onOpenSubtask ? () => onOpenSubtask(subtask) : undefined}
        role={onOpenSubtask ? 'button' : undefined}
        tabIndex={onOpenSubtask ? 0 : undefined}
      >
        {subtask.title}
      </span>

      {/* Right metadata */}
      <div className={styles.subtaskMeta}>
        {/* Priority dot */}
        {subtask.priority !== 4 && (
          <span
            className={styles.subtaskPriorityDot}
            style={{ background: priorityColor(subtask.priority) }}
            aria-label={`Priority ${subtask.priority}`}
          />
        )}
        {/* Due date chip */}
        {subtask.dueAt && (
          <span className={styles.subtaskDueChip}>
            {humanDueLabel(subtask.dueAt)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SubtaskInlineForm({
  parentTaskId,
  subtasks,
  labels: _labels,
  onCreated,
  onOpenSubtask,
}: SubtaskInlineFormProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const doneCount = subtasks.filter((s) => s.status === 'done').length;
  const total = subtasks.length;

  useEffect(() => {
    if (showForm) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [showForm]);

  async function handleSubmit() {
    const trimmed = title.trim();
    if (!trimmed || isSaving) return;
    setIsSaving(true);
    try {
      await createTask({ title: trimmed, parentTaskId, priority: 4 });
      setTitle('');
      inputRef.current?.focus();
      onCreated?.();
    } finally {
      setIsSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setShowForm(false);
      setTitle('');
    }
  }

  return (
    <div className={styles.section}>
      {/* Section header */}
      <button
        type="button"
        className={styles.sectionHeader}
        onClick={() => setCollapsed((v) => !v)}
        aria-expanded={!collapsed}
      >
        <span className={styles.sectionTitle}>
          Sub-tasks
          {total > 0 && (
            <span className={styles.sectionCount}>{doneCount}/{total}</span>
          )}
        </span>
        <span className={styles.sectionChevron}>
          {collapsed ? <CaretDown size={13} /> : <CaretUp size={13} />}
        </span>
      </button>

      {!collapsed && (
        <div className={styles.body}>
          {/* Subtask rows */}
          {subtasks.map((s) => (
            <SubtaskRowItem
              key={s.id}
              subtask={s}
              onOpenSubtask={onOpenSubtask}
            />
          ))}

          {/* Inline add form */}
          {showForm ? (
            <div className={styles.form}>
              <input
                ref={inputRef}
                type="text"
                className={styles.formInput}
                placeholder="Sub-task name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSaving}
              />
              <div className={styles.formActions}>
                <div className={styles.formLeft}>
                  <button
                    type="button"
                    className={styles.formIconBtn}
                    aria-label="Set due date"
                    disabled
                  >
                    <CalendarBlank size={14} />
                  </button>
                  <button
                    type="button"
                    className={styles.formIconBtn}
                    aria-label="Set priority"
                    disabled
                  >
                    <Flag size={14} />
                  </button>
                  <button
                    type="button"
                    className={styles.formIconBtn}
                    aria-label="Add label"
                    disabled
                  >
                    <Tag size={14} />
                  </button>
                </div>
                <div className={styles.formRight}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => { setShowForm(false); setTitle(''); }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.addBtn}
                    onClick={handleSubmit}
                    disabled={!title.trim() || isSaving}
                  >
                    Add task
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className={styles.addRow}
              onClick={() => setShowForm(true)}
            >
              + Add sub-task
            </button>
          )}
        </div>
      )}
    </div>
  );
}
