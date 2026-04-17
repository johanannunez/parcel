'use client';

import { useState, useTransition } from 'react';
import { createTask } from '@/lib/admin/task-actions';
import { useCreateScope } from '../CreateScopeContext';
import type { ParentType, TaskType } from '@/lib/admin/task-types';
import { RichDescriptionEditor } from '@/components/admin/tasks/RichDescriptionEditor';
import styles from './TaskForm.module.css';

type PresetKey = 'today' | 'tomorrow' | '+3' | 'next_week' | 'none';

const TASK_TYPE_OPTIONS: { value: TaskType; label: string; icon: string }[] = [
  { value: 'todo',      label: 'To-do',     icon: '✓' },
  { value: 'call',      label: 'Call',       icon: '📞' },
  { value: 'meeting',   label: 'Meeting',    icon: '🤝' },
  { value: 'email',     label: 'Email',      icon: '✉️' },
  { value: 'milestone', label: 'Milestone',  icon: '🏁' },
];

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateInputValue(d: Date): string {
  // Returns YYYY-MM-DD in local time
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function nextMonday(base: Date): Date {
  const d = new Date(base);
  const dow = d.getDay(); // 0=Sun
  const daysUntilMonday = dow === 0 ? 1 : 8 - dow;
  d.setDate(d.getDate() + daysUntilMonday);
  return d;
}

export function TaskForm({ onClose }: { onClose: () => void }) {
  const { target } = useCreateScope();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('todo');
  const [dateValue, setDateValue] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [activePreset, setActivePreset] = useState<PresetKey | null>(null);
  const [tagsRaw, setTagsRaw] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
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

  const applyPreset = (key: PresetKey) => {
    if (isPending) return;
    const today = new Date();
    if (key === 'none') {
      setDateValue('');
      setTimeValue('');
      setActivePreset('none');
      return;
    }
    let target: Date;
    switch (key) {
      case 'today':
        target = today;
        break;
      case 'tomorrow':
        target = addDays(today, 1);
        break;
      case '+3':
        target = addDays(today, 3);
        break;
      case 'next_week':
        target = nextMonday(today);
        break;
      default:
        return;
    }
    setDateValue(toDateInputValue(target));
    setActivePreset(key);
  };

  const buildDueAt = (): string | null => {
    if (!dateValue) return null;
    if (timeValue) {
      return new Date(`${dateValue}T${timeValue}`).toISOString();
    }
    return new Date(`${dateValue}T00:00:00`).toISOString();
  };

  const parseTags = (raw: string): string[] =>
    raw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

  const submit = () => {
    if (!title.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const mins = estimatedMinutes ? parseInt(estimatedMinutes, 10) : null;
        await createTask({
          title: title.trim(),
          description: description && description.trim() !== '<p></p>' ? description : undefined,
          parentType,
          parentId,
          dueAt: buildDueAt(),
          assigneeId: null,
          taskType,
          tags: parseTags(tagsRaw),
          estimatedMinutes: mins && !isNaN(mins) ? mins : null,
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
      {/* Title */}
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

      {/* Task type */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="task-type">
          Type
        </label>
        <select
          id="task-type"
          className={styles.select}
          value={taskType}
          onChange={(e) => setTaskType(e.target.value as TaskType)}
          disabled={isPending}
        >
          {TASK_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.icon} {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Due date */}
      <div className={styles.field}>
        <label className={styles.label}>Due date</label>
        <div className={styles.presets}>
          {(
            [
              { key: 'today', label: 'Today' },
              { key: 'tomorrow', label: 'Tomorrow' },
              { key: '+3', label: '+3 days' },
              { key: 'next_week', label: 'Next week' },
              { key: 'none', label: 'No date' },
            ] as { key: PresetKey; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              disabled={isPending}
              className={`${styles.preset}${activePreset === key ? ` ${styles.presetActive}` : ''}`}
              onClick={() => applyPreset(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          id="task-due"
          type="date"
          className={styles.input}
          value={dateValue}
          onChange={(e) => {
            setDateValue(e.target.value);
            setActivePreset(null);
          }}
          disabled={isPending}
        />
        {dateValue ? (
          <input
            id="task-time"
            type="time"
            className={`${styles.input} ${styles.timeInput}`}
            value={timeValue}
            onChange={(e) => setTimeValue(e.target.value)}
            disabled={isPending}
          />
        ) : null}
      </div>

      {/* Tags */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="task-tags">
          Tags
        </label>
        <input
          id="task-tags"
          className={styles.input}
          value={tagsRaw}
          onChange={(e) => setTagsRaw(e.target.value)}
          placeholder="follow-up, urgent, q2"
          disabled={isPending}
        />
        <span className={styles.fieldHint}>Separate tags with commas</span>
      </div>

      {/* Estimated minutes */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="task-estimate">
          Estimate
        </label>
        <div className={styles.estimateWrap}>
          <input
            id="task-estimate"
            type="number"
            min={1}
            className={styles.input}
            style={{ paddingRight: 48 }}
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(e.target.value)}
            placeholder="30"
            disabled={isPending}
          />
          <span className={styles.estimateUnit}>min</span>
        </div>
      </div>

      {/* Description */}
      <div className={styles.field}>
        <label className={styles.label}>
          Description
        </label>
        <RichDescriptionEditor
          value={description}
          onChange={setDescription}
          placeholder="Describe the task..."
          minHeight={120}
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
          {isPending ? 'Creating...' : 'Create task'}
        </button>
      </div>
    </form>
  );
}
