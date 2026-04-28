'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './SubtaskInlineForm.module.css';

export type SubtaskInlineFormProps = {
  parentTaskId: string;
  defaultPriority?: 1 | 2 | 3 | 4;
  onSave: (title: string) => Promise<void>;
  onClose: () => void;
};

export function SubtaskInlineForm({
  parentTaskId: _parentTaskId,
  defaultPriority: _defaultPriority,
  onSave,
  onClose,
}: SubtaskInlineFormProps) {
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit() {
    const trimmed = title.trim();
    if (!trimmed || isSaving) return;
    setIsSaving(true);
    try {
      await onSave(trimmed);
      setTitle('');
      inputRef.current?.focus();
    } finally {
      setIsSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }

  return (
    <div className={styles.form}>
      <input
        ref={inputRef}
        type="text"
        className={styles.titleInput}
        placeholder="Sub-task name"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
      />
      <div className={styles.bottomRow}>
        <div className={styles.leftActions}>
          <button type="button" className={styles.stubBtn} disabled>
            Date
          </button>
          <button type="button" className={styles.stubBtn} disabled>
            Priority
          </button>
        </div>
        <div className={styles.rightActions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
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
  );
}
