'use client';

import { useState, useRef, useEffect } from 'react';
import { CalendarBlank, Flag } from '@phosphor-icons/react';
import { DatePickerDropdown } from './DatePickerDropdown';
import styles from './SubtaskInlineForm.module.css';

export type SubtaskInlineFormProps = {
  parentTaskId: string;
  defaultPriority?: 1 | 2 | 3 | 4;
  onSave: (data: { title: string; dueAt: string | null; priority: 1 | 2 | 3 | 4 | null }) => Promise<void>;
  onClose: () => void;
};

function formatDueLabel(iso: string): string {
  const parts = iso.split('T')[0].split('-').map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function SubtaskInlineForm({
  parentTaskId: _parentTaskId,
  defaultPriority: _defaultPriority,
  onSave,
  onClose,
}: SubtaskInlineFormProps) {
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [dueAt, setDueAt] = useState<string | null>(null);
  const [priority, setPriority] = useState<1 | 2 | 3 | 4 | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dateBtnRef = useRef<HTMLButtonElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const priorityBtnRef = useRef<HTMLButtonElement>(null);
  const priorityPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (
        showDatePicker &&
        datePickerRef.current &&
        !datePickerRef.current.contains(e.target as Node) &&
        dateBtnRef.current &&
        !dateBtnRef.current.contains(e.target as Node)
      ) {
        setShowDatePicker(false);
      }
      if (
        showPriorityPicker &&
        priorityPickerRef.current &&
        !priorityPickerRef.current.contains(e.target as Node) &&
        priorityBtnRef.current &&
        !priorityBtnRef.current.contains(e.target as Node)
      ) {
        setShowPriorityPicker(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showDatePicker, showPriorityPicker]);

  async function handleSubmit() {
    const trimmed = title.trim();
    if (!trimmed || isSaving) return;
    setIsSaving(true);
    try {
      await onSave({ title: trimmed, dueAt, priority });
      setTitle('');
      setDueAt(null);
      setPriority(null);
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
          {/* Date button */}
          <div className={styles.btnWrap}>
            <button
              ref={dateBtnRef}
              type="button"
              className={`${styles.metaBtn} ${dueAt ? styles.metaBtnActive : ''}`}
              onClick={() => {
                setShowPriorityPicker(false);
                setShowDatePicker((v) => !v);
              }}
              disabled={isSaving}
            >
              <CalendarBlank size={13} />
              {dueAt ? formatDueLabel(dueAt) : 'Date'}
            </button>
            {showDatePicker && (
              <div ref={datePickerRef} className={styles.pickerPopover}>
                <DatePickerDropdown
                  value={dueAt}
                  onChange={(iso) => {
                    setDueAt(iso);
                    setShowDatePicker(false);
                  }}
                  onClose={() => setShowDatePicker(false)}
                />
              </div>
            )}
          </div>

          {/* Priority button */}
          <div className={styles.btnWrap}>
            <button
              ref={priorityBtnRef}
              type="button"
              className={`${styles.metaBtn} ${priority !== null ? styles.metaBtnActive : ''}`}
              onClick={() => {
                setShowDatePicker(false);
                setShowPriorityPicker((v) => !v);
              }}
              disabled={isSaving}
            >
              <Flag size={13} />
              {priority !== null ? `P${priority}` : 'Priority'}
            </button>
            {showPriorityPicker && (
              <div ref={priorityPickerRef} className={styles.priorityPicker}>
                {([1, 2, 3, 4] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`${styles.priorityOption} ${priority === p ? styles.priorityOptionActive : ''} ${styles[`prio${p}`]}`}
                    onClick={() => {
                      setPriority(p);
                      setShowPriorityPicker(false);
                    }}
                  >
                    P{p}
                  </button>
                ))}
              </div>
            )}
          </div>
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
