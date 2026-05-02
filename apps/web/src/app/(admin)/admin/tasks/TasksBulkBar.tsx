'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Tag } from '@phosphor-icons/react';
import type { Task, TaskLabel, TaskStatus } from '@/lib/admin/task-types';
import { LabelPicker } from './LabelPicker';
import ConfirmModal from '@/components/admin/ConfirmModal';
import styles from './TasksBulkBar.module.css';

type OpenDropdown = 'status' | 'priority' | 'labels' | null;

type Props = {
  selectedIds: Set<string>;
  tasks: Task[];
  labels: TaskLabel[];
  onClear: () => void;
  onBulkUpdate: (
    ids: string[],
    patch: Partial<{ status: TaskStatus; priority: 1 | 2 | 3 | 4; labelIds: string[] }>,
  ) => void;
  onBulkDelete: (ids: string[]) => void;
};

const STATUS_OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'todo', label: 'To Do', color: '#9ca3af' },
  { value: 'in_progress', label: 'In Progress', color: '#60a5fa' },
  { value: 'blocked', label: 'Blocked', color: '#ef4444' },
  { value: 'done', label: 'Done', color: '#10b981' },
];

const PRIORITY_OPTIONS: { value: 1 | 2 | 3 | 4; label: string; color: string }[] = [
  { value: 1, label: 'P1 Urgent', color: '#ef4444' },
  { value: 2, label: 'P2 High', color: '#f59e0b' },
  { value: 3, label: 'P3 Medium', color: '#60a5fa' },
  { value: 4, label: 'P4 None', color: '#9ca3af' },
];

export function TasksBulkBar({ selectedIds, tasks: _tasks, labels, onClear, onBulkUpdate, onBulkDelete }: Props) {
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const barRef = useRef<HTMLDivElement>(null);
  const count = selectedIds.size;

  // Close dropdown on outside click
  useEffect(() => {
    if (!openDropdown) return;
    function handleMouseDown(e: MouseEvent) {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [openDropdown]);

  function toggleDropdown(key: OpenDropdown) {
    setOpenDropdown((prev) => (prev === key ? null : key));
  }

  function handleStatus(status: TaskStatus) {
    onBulkUpdate(Array.from(selectedIds), { status });
    setOpenDropdown(null);
  }

  function handlePriority(priority: 1 | 2 | 3 | 4) {
    onBulkUpdate(Array.from(selectedIds), { priority });
    setOpenDropdown(null);
  }

  function handleLabelChange(labelIds: string[]) {
    onBulkUpdate(Array.from(selectedIds), { labelIds });
    setOpenDropdown(null);
  }

  function handleDeleteConfirm() {
    onBulkDelete(Array.from(selectedIds));
    onClear();
    setShowDeleteConfirm(false);
  }

  return (
    <>
      <motion.div
        className={styles.bar}
        ref={barRef}
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      >
        <span className={styles.count}>
          {count} {count === 1 ? 'task' : 'tasks'} selected
        </span>

        <div className={styles.actions}>
          {/* Status */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => toggleDropdown('status')}
            >
              Status
            </button>
            {openDropdown === 'status' && (
              <div className={styles.dropdown}>
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => handleStatus(opt.value)}
                  >
                    <span className={styles.colorDot} style={{ background: opt.color }} />
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Priority */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => toggleDropdown('priority')}
            >
              Priority
            </button>
            {openDropdown === 'priority' && (
              <div className={styles.dropdown}>
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => handlePriority(opt.value)}
                  >
                    <span className={styles.colorDot} style={{ background: opt.color }} />
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Labels */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => toggleDropdown('labels')}
            >
              <Tag size={13} />
              Labels
            </button>
            {openDropdown === 'labels' && (
              <div className={styles.dropdown} style={{ minWidth: 220 }}>
                <LabelPicker
                  labels={labels}
                  selectedIds={[]}
                  onChange={handleLabelChange}
                  onClose={() => setOpenDropdown(null)}
                />
              </div>
            )}
          </div>

          {/* Separator */}
          <div className={styles.separator} />

          {/* Delete */}
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete
          </button>
        </div>

        {/* Clear */}
        <button
          type="button"
          className={styles.clearBtn}
          onClick={onClear}
          aria-label="Clear selection"
        >
          <X size={14} />
        </button>
      </motion.div>

      <ConfirmModal
        open={showDeleteConfirm}
        variant="danger"
        title={`Delete ${count} ${count === 1 ? 'task' : 'tasks'}?`}
        description={`This will permanently delete ${count === 1 ? 'this task' : `these ${count} tasks`}. This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
