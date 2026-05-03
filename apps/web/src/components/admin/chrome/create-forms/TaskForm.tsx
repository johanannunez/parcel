'use client';

import { useState, useTransition } from 'react';
import { createTask } from '@/lib/admin/task-actions';
import { createAttachmentRecord } from '@/lib/admin/attachment-actions';
import { useCreateScope } from '../CreateScopeContext';
import type { ParentType, TaskType } from '@/lib/admin/task-types';
import type { RecurrenceRule } from '@/lib/admin/recurrence';
import { RichDescriptionEditor } from '@/components/admin/tasks/RichDescriptionEditor';
import { AttachmentsField } from '@/components/admin/tasks/AttachmentsField';
import { RecurrenceField } from '@/components/admin/tasks/RecurrenceField';
import { CustomSelect } from '@/components/admin/CustomSelect';
import { DatePickerInput } from '@/components/admin/DatePickerInput';
import type { UploadedAttachment, AttachmentScope } from '@/lib/admin/attachment-upload';
import styles from './TaskForm.module.css';

type PresetKey = 'today' | 'tomorrow' | '+3' | 'next_week' | 'none';

const TASK_TYPE_OPTIONS: { value: TaskType; label: string; icon: string }[] = [
  { value: 'todo',      label: 'To-do',     icon: '✓' },
  { value: 'call',      label: 'Call',       icon: '📞' },
  { value: 'meeting',   label: 'Meeting',    icon: '🤝' },
  { value: 'email',     label: 'Email',      icon: '✉️' },
  { value: 'milestone', label: 'Milestone',  icon: '🏁' },
];

const TASK_TYPE_SELECT_OPTIONS = TASK_TYPE_OPTIONS.map((opt) => ({
  value: opt.value,
  label: `${opt.icon} ${opt.label}`,
}));

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
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | null>(null);
  const [preNotifyHours, setPreNotifyHours] = useState<number | null>(null);
  const [priority, setPriority] = useState<1 | 2 | 3 | 4>(4);
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

  // Attachment scope mirrors parentType/parentId for pre-task upload path naming.
  const attachmentScope: AttachmentScope | null =
    parentType && parentId
      ? { parentType: parentType as AttachmentScope['parentType'], parentId }
      : null;

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
        const { id: taskId } = await createTask({
          title: title.trim(),
          description: description && description.trim() !== '<p></p>' ? description : undefined,
          parentType,
          parentId,
          dueAt: buildDueAt(),
          assigneeId: null,
          taskType,
          tags: parseTags(tagsRaw),
          estimatedMinutes: mins && !isNaN(mins) ? mins : null,
          recurrenceRule,
          preNotifyHours,
          priority,
        });
        // Persist any uploaded files as attachment records linked to the new task.
        for (const att of attachments) {
          await createAttachmentRecord({
            parentType: 'task',
            parentId: taskId,
            filename: att.filename,
            storagePath: att.storagePath,
            mimeType: att.mimeType,
            sizeBytes: att.sizeBytes,
          });
        }
        setPriority(4);
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
        <CustomSelect
          id="task-type"
          value={taskType}
          onChange={(value) => setTaskType(value as TaskType)}
          disabled={isPending}
          options={TASK_TYPE_SELECT_OPTIONS}
        />
      </div>

      {/* Priority */}
      <div className={styles.field}>
        <label className={styles.label}>Priority</label>
        <div className={styles.priorityRow}>
          {([
            [1, 'Urgent', '#ef4444'],
            [2, 'High',   '#f59e0b'],
            [3, 'Medium', '#60a5fa'],
            [4, 'None',   ''],
          ] as const).map(([val, label, color]) => (
            <button
              key={val}
              type="button"
              onClick={() => setPriority(val)}
              className={styles.priorityPill}
              style={
                priority === val && color
                  ? { borderColor: color, color, background: `${color}14` }
                  : priority === val && !color
                    ? { borderColor: '#647689', background: '#F6F8FB' }
                    : undefined
              }
              aria-pressed={priority === val}
              disabled={isPending}
            >
              {label}
            </button>
          ))}
        </div>
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
        <DatePickerInput
          id="task-due"
          className={styles.input}
          value={dateValue}
          onChange={(value) => {
            setDateValue(value);
            setActivePreset(null);
          }}
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

      {/* Recurrence + pre-notify */}
      <div className={styles.field}>
        <label className={styles.label}>Recurrence</label>
        <RecurrenceField
          value={recurrenceRule}
          onChange={setRecurrenceRule}
          preNotifyHours={preNotifyHours}
          onPreNotifyChange={setPreNotifyHours}
          disabled={isPending}
        />
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

      {/* Attachments */}
      <div className={styles.field}>
        <label className={styles.label}>Attachments</label>
        <AttachmentsField
          uploaded={attachments}
          onChange={setAttachments}
          scope={attachmentScope}
          disabled={isPending}
        />
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.btnCancel}
          onClick={() => { setPriority(4); onClose(); }}
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
