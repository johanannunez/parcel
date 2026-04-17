'use client';

import { useState, useTransition } from 'react';
import { createTask } from '@/lib/admin/task-actions';
import { useCreateScope } from '../CreateScopeContext';
import type { ParentType } from '@/lib/admin/task-types';
import styles from './TaskForm.module.css';

export function TaskForm({ onClose }: { onClose: () => void }) {
  const { target } = useCreateScope();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // scope target kind "owner" maps to parentType "contact" in the tasks schema
  const parentType: ParentType | null =
    target?.kind === 'owner'
      ? 'contact'
      : target?.kind === 'property'
      ? 'property'
      : null;
  const parentId: string | null = target?.id ?? null;

  const submit = () => {
    if (!title.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        await createTask({
          title: title.trim(),
          description: description.trim() || undefined,
          parentType,
          parentId,
          dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
    });
  };

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className={styles.field}>
        <label className={styles.label} htmlFor="task-title">
          Title
        </label>
        <input
          id="task-title"
          className={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          autoFocus
          required
          disabled={isPending}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="task-due">
          Due date
        </label>
        <input
          id="task-due"
          type="date"
          className={styles.input}
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          disabled={isPending}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="task-desc">
          Description
        </label>
        <textarea
          id="task-desc"
          className={styles.textarea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional notes"
          rows={3}
          disabled={isPending}
        />
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.btnCancel}
          onClick={onClose}
          disabled={isPending}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={styles.btnSubmit}
          disabled={!title.trim() || isPending}
        >
          {isPending ? 'Creating…' : 'Create task'}
        </button>
      </div>
    </form>
  );
}
