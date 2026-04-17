'use client';

import { useState, useTransition } from 'react';
import { createTask } from '@/lib/admin/task-actions';
import type { ParentType } from '@/lib/admin/task-types';
import styles from './TasksTab.module.css';

export function TaskCreationInlineForm({
  parentType,
  parentId,
}: {
  parentType: ParentType;
  parentId: string;
}) {
  const [title, setTitle] = useState('');
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!title.trim()) return;
    const captured = title.trim();
    setTitle('');
    startTransition(async () => {
      await createTask({ title: captured, parentType, parentId });
    });
  };

  return (
    <form
      className={styles.inlineForm}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <span className={styles.plus}>+</span>
      <input
        type="text"
        placeholder="Add a task"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={isPending}
        className={styles.inlineInput}
      />
      <button
        type="submit"
        className={styles.inlineSubmit}
        disabled={!title.trim() || isPending}
      >
        Add
      </button>
    </form>
  );
}
