'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus } from '@phosphor-icons/react';
import styles from './LabelPicker.module.css';
import type { TaskLabel } from '@/lib/admin/task-types';

type Props = {
  labels: TaskLabel[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onClose: () => void;
};

const COLOR_SWATCHES = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#c17b4e', '#ec4899', '#14b8a6',
  '#f97316', '#6b7280', '#1d4ed8', '#065f46',
];

export function LabelPicker({ labels: initialLabels, selectedIds, onChange, onClose }: Props) {
  const [labels, setLabels] = useState<TaskLabel[]>(initialLabels);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLOR_SWATCHES[0]);
  const [saving, setSaving] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creating) {
      nameInputRef.current?.focus();
    }
  }, [creating]);

  function toggleLabel(id: string) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    onChange(next);
  }

  async function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const res = await fetch('/api/task-labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, color: newColor }),
      });
      if (!res.ok) throw new Error('Failed to create label');
      const created: TaskLabel = await res.json();
      setLabels((prev) => [...prev, created]);
      onChange([...selectedIds, created.id]);
      setNewName('');
      setNewColor(COLOR_SWATCHES[0]);
      setCreating(false);
    } catch {
      // silently ignore; user can retry
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); handleCreate(); }
    if (e.key === 'Escape') { setCreating(false); setNewName(''); }
  }

  return (
    <div className={styles.panel}>
      {/* Label list */}
      <div className={styles.list}>
        {labels.map((label) => {
          const checked = selectedIds.includes(label.id);
          return (
            <button
              key={label.id}
              type="button"
              className={styles.labelRow}
              onClick={() => toggleLabel(label.id)}
            >
              <span
                className={styles.swatch}
                style={{ background: label.color }}
              />
              <span className={styles.labelName}>{label.name}</span>
              <span className={`${styles.checkbox} ${checked ? styles.checkboxChecked : ''}`}>
                {checked && <span className={styles.checkmark}>✓</span>}
              </span>
            </button>
          );
        })}
      </div>

      {/* Create label form */}
      {creating ? (
        <div className={styles.createForm}>
          <input
            ref={nameInputRef}
            type="text"
            className={styles.nameInput}
            placeholder="Label name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className={styles.swatchGrid}>
            {COLOR_SWATCHES.map((color) => (
              <button
                key={color}
                type="button"
                className={`${styles.swatchBtn} ${newColor === color ? styles.swatchBtnActive : ''}`}
                style={{ background: color }}
                onClick={() => setNewColor(color)}
                aria-label={color}
              />
            ))}
          </div>
          <div className={styles.createActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => { setCreating(false); setNewName(''); }}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.addBtn}
              onClick={handleCreate}
              disabled={saving || !newName.trim()}
            >
              {saving ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={styles.createRow}
          onClick={() => setCreating(true)}
        >
          <Plus size={13} weight="bold" />
          <span>Create label</span>
        </button>
      )}

      {/* Done */}
      <button type="button" className={styles.doneBtn} onClick={onClose}>
        Done
      </button>
    </div>
  );
}
