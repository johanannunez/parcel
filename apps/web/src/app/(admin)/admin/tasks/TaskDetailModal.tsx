'use client';

import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { motion } from 'motion/react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import type { Task, TaskLabel } from '@/lib/admin/task-types';
import {
  updateTask,
  completeTask,
  uncompleteTask,
  deleteTask,
} from '@/lib/admin/task-actions';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { SubtaskInlineForm } from './SubtaskInlineForm';
import { TaskComments } from './TaskComments';
import { TaskActivityLog } from './TaskActivityLog';
import { TaskAttachments } from './TaskAttachments';
import { LabelPicker } from './LabelPicker';
import { DatePickerDropdown } from './DatePickerDropdown';
import { ParentEntityPicker } from './ParentEntityPicker';
import {
  X,
  ArrowUp,
  ArrowDown,
  DotsThree,
  CaretDown,
  CaretUp,
  Flag,
  CalendarBlank,
  Check,
  Tag,
} from '@phosphor-icons/react';
import styles from './TaskDetailModal.module.css';

// ─── Priority config ─────────────────────────────────────────────────────────

const PRIORITY_OPTIONS = [
  { value: 1 as const, label: 'P1 Urgent', color: '#ef4444' },
  { value: 2 as const, label: 'P2 High', color: '#f59e0b' },
  { value: 3 as const, label: 'P3 Medium', color: '#3b82f6' },
  { value: 4 as const, label: 'P4 None', color: '#9ca3af' },
] as const;

function getPriorityConfig(p: 1 | 2 | 3 | 4) {
  return PRIORITY_OPTIONS.find((o) => o.value === p) ?? PRIORITY_OPTIONS[3];
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'todo' as const, label: 'To Do', color: '#6b7280' },
  { value: 'in_progress' as const, label: 'In Progress', color: '#3b82f6' },
  { value: 'blocked' as const, label: 'Blocked', color: '#ef4444' },
  { value: 'done' as const, label: 'Done', color: '#10b981' },
] as const;

function getStatusConfig(s: string) {
  return STATUS_OPTIONS.find((o) => o.value === s) ?? STATUS_OPTIONS[0];
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function parseLocalDate(iso: string): Date {
  const p = iso.split('T')[0].split('-').map(Number);
  return new Date(p[0], p[1] - 1, p[2]);
}

function formatDueDate(iso: string | null): string {
  if (!iso) return 'No date';
  const d = parseLocalDate(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ─── Initials avatar ──────────────────────────────────────────────────────────

function InitialsAvatar({
  name,
  avatarUrl,
  size = 24,
}: {
  name: string | null;
  avatarUrl: string | null;
  size?: number;
}) {
  const initials = (name ?? 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name ?? ''}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#e5e7eb',
        color: '#374151',
        fontSize: size * 0.4,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initials}
    </span>
  );
}

// ─── Tiptap description editor ────────────────────────────────────────────────

function DescriptionEditor({
  initialValue,
  onBlur,
}: {
  initialValue: string | null;
  onBlur: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Add description…' }),
    ],
    content: initialValue ?? '',
    editorProps: {
      attributes: { class: styles.tiptapEditor },
    },
  });

  const handleBlur = useCallback(() => {
    if (!editor) return;
    onBlur(editor.getHTML());
  }, [editor, onBlur]);

  useEffect(() => {
    if (!editor) return;
    editor.on('blur', handleBlur);
    return () => { editor.off('blur', handleBlur); };
  }, [editor, handleBlur]);

  if (!editor) return null;

  const TB = ({
    onClick,
    active,
    title,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`${styles.tiptapBtn} ${active ? styles.tiptapBtnActive : ''}`}
    >
      {children}
    </button>
  );

  return (
    <div className={styles.tiptapWrap}>
      <div className={styles.tiptapToolbar}>
        <TB
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <b>B</b>
        </TB>
        <TB
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <i>I</i>
        </TB>
        <TB
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet list"
        >
          •
        </TB>
        <TB
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Ordered list"
        >
          1.
        </TB>
        <TB
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          title="Inline code"
        >
          {'<>'}
        </TB>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export type TaskDetailModalProps = {
  task: Task | null;
  tasks: Task[];
  subtasks?: Task[];
  labels: TaskLabel[];
  currentUserId: string | null;
  currentUserName: string | null;
  currentUserAvatarUrl: string | null;
  onClose: () => void;
  onSaved?: (taskId: string) => void;
  onNavigate?: (task: Task) => void;
  onUpdate?: (id: string, patch: Partial<Task>) => void;
};

// ─── Open field type ──────────────────────────────────────────────────────────

type OpenField =
  | 'status'
  | 'priority'
  | 'dueDate'
  | 'repeat'
  | 'labels'
  | null;

// ─── Save indicator state ─────────────────────────────────────────────────────

type SaveState = 'idle' | 'saving' | 'saved';

// ─── Main component ───────────────────────────────────────────────────────────

export function TaskDetailModal({
  task,
  tasks,
  subtasks = [],
  labels,
  currentUserId,
  currentUserName,
  currentUserAvatarUrl,
  onClose,
  onSaved,
  onNavigate,
  onUpdate,
}: TaskDetailModalProps) {
  // Local field state — mirrors the task, reset when task.id changes
  const [localStatus, setLocalStatus] = useState<string>('todo');
  const [localPriority, setLocalPriority] = useState<1 | 2 | 3 | 4>(4);
  const [localDueAt, setLocalDueAt] = useState<string | null>(null);
  const [localLabelIds, setLocalLabelIds] = useState<string[]>([]);
  const [localLinkedPropertyId, setLocalLinkedPropertyId] = useState<
    string | null
  >(null);
  const [localLinkedPropertyLabel, setLocalLinkedPropertyLabel] = useState<
    string | null
  >(null);
  const [localLinkedContactId, setLocalLinkedContactId] = useState<
    string | null
  >(null);
  const [localLinkedContactLabel, setLocalLinkedContactLabel] = useState<
    string | null
  >(null);
  const [localLinkedProjectId, setLocalLinkedProjectId] = useState<
    string | null
  >(null);
  const [localLinkedProjectLabel, setLocalLinkedProjectLabel] = useState<
    string | null
  >(null);

  // UI state
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [openField, setOpenField] = useState<OpenField>(null);
  const [commentsExpanded, setCommentsExpanded] = useState(true);
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const titleRef = useRef<HTMLDivElement>(null);
  const overflowRef = useRef<HTMLDivElement>(null);
  const openFieldContainerRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset local state when task changes
  useEffect(() => {
    if (!task) return;
    setLocalStatus(task.status);
    setLocalPriority(task.priority);
    setLocalDueAt(task.dueAt);
    setLocalLabelIds(task.labelIds ?? []);
    setLocalLinkedPropertyId(task.linkedPropertyId);
    setLocalLinkedPropertyLabel(task.parent?.type === 'property' ? task.parent.label : null);
    setLocalLinkedContactId(task.linkedContactId);
    setLocalLinkedContactLabel(task.parent?.type === 'contact' ? task.parent.label : null);
    setLocalLinkedProjectId(task.linkedProjectId);
    setLocalLinkedProjectLabel(task.parent?.type === 'project' ? task.parent.label : null);
    setOpenField(null);
    setShowOverflowMenu(false);
    setSaveState('idle');
  }, [task?.id]);

  // Sync title ref when task id or title changes, but not while the user is editing
  useEffect(() => {
    if (titleRef.current && document.activeElement !== titleRef.current) {
      titleRef.current.innerText = task?.title ?? '';
    }
  }, [task?.id, task?.title]);

  // Clear saveTimerRef on unmount to prevent state-update-after-unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Close sidebar dropdowns on click outside the sidebar
  useEffect(() => {
    if (!openField) return;
    function handleMouseDown(e: MouseEvent) {
      if (openFieldContainerRef.current && !openFieldContainerRef.current.contains(e.target as Node)) {
        setOpenField(null);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [openField]);

  // Save helper
  const withSave = useCallback(
    async (fn: () => Promise<void>) => {
      if (!task) return;
      setSaveState('saving');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      try {
        await fn();
        setSaveState('saved');
        saveTimerRef.current = setTimeout(() => setSaveState('idle'), 2000);
        onSaved?.(task.id);
      } catch {
        setSaveState('idle');
      }
    },
    [task, onSaved],
  );

  // Navigation
  const navigateTask = useCallback(
    (delta: number) => {
      if (!task || !onNavigate) return;
      const topLevel = tasks.filter((t) => !t.parentTaskId);
      const idx = topLevel.findIndex((t) => t.id === task.id);
      if (idx === -1) return;
      const next = topLevel[idx + delta];
      if (next) onNavigate(next);
    },
    [task, tasks, onNavigate],
  );

  // Keyboard shortcuts
  useEffect(() => {
    if (!task) return;
    function handleKey(e: KeyboardEvent) {
      const el = document.activeElement as HTMLElement | null;
      const inText =
        el?.tagName === 'INPUT' ||
        el?.tagName === 'TEXTAREA' ||
        el?.isContentEditable;
      if (inText) {
        if (e.key === 'Escape') {
          (el as HTMLElement).blur();
        }
        return;
      }
      if (e.key === 'Escape') {
        if (openField) { setOpenField(null); return; }
        if (showOverflowMenu) { setShowOverflowMenu(false); return; }
        onClose();
      }
      if (e.key === 'j' || e.key === 'J') navigateTask(1);
      if (e.key === 'k' || e.key === 'K') navigateTask(-1);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [task?.id, onClose, navigateTask, openField, showOverflowMenu]);

  // Close overflow menu on outside click
  useEffect(() => {
    if (!showOverflowMenu) return;
    function handleClick(e: MouseEvent) {
      if (
        overflowRef.current &&
        !overflowRef.current.contains(e.target as Node)
      ) {
        setShowOverflowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showOverflowMenu]);

  // Toggle done
  const toggleDone = useCallback(() => {
    if (!task) return;
    const isDone = localStatus === 'done';
    const nextStatus = isDone ? 'todo' : 'done';
    setLocalStatus(nextStatus);
    onUpdate?.(task.id, { status: nextStatus });
    withSave(async () => {
      if (isDone) await uncompleteTask(task.id);
      else await completeTask(task.id);
    });
  }, [task, localStatus, onUpdate, withSave]);

  // Title save
  const handleTitleBlur = useCallback(() => {
    if (!task || !titleRef.current) return;
    const newTitle = titleRef.current.innerText.trim();
    if (!newTitle || newTitle === task.title) return;
    onUpdate?.(task.id, { title: newTitle });
    withSave(() => updateTask(task.id, { title: newTitle }));
  }, [task, onUpdate, withSave]);

  // Description save (Tiptap HTML)
  const handleDescriptionBlur = useCallback(
    (html: string) => {
      if (!task) return;
      const clean = html === '<p></p>' ? null : html;
      if (clean === task.description) return;
      onUpdate?.(task.id, { description: clean });
      withSave(() => updateTask(task.id, { description: clean }));
    },
    [task, onUpdate, withSave],
  );

  // Status change
  const handleStatusChange = useCallback(
    (status: (typeof STATUS_OPTIONS)[number]['value']) => {
      if (!task) return;
      setLocalStatus(status);
      setOpenField(null);
      onUpdate?.(task.id, { status });
      withSave(() => updateTask(task.id, { status }));
    },
    [task, onUpdate, withSave],
  );

  // Priority change
  const handlePriorityChange = useCallback(
    (priority: 1 | 2 | 3 | 4) => {
      if (!task) return;
      setLocalPriority(priority);
      setOpenField(null);
      onUpdate?.(task.id, { priority });
      withSave(() => updateTask(task.id, { priority }));
    },
    [task, onUpdate, withSave],
  );

  // Due date change
  const handleDueDateChange = useCallback(
    (iso: string | null) => {
      if (!task) return;
      setLocalDueAt(iso);
      setOpenField(null);
      onUpdate?.(task.id, { dueAt: iso });
      withSave(() => updateTask(task.id, { dueAt: iso }));
    },
    [task, onUpdate, withSave],
  );

  // Label change
  const handleLabelsChange = useCallback(
    (ids: string[]) => {
      if (!task) return;
      setLocalLabelIds(ids);
      onUpdate?.(task.id, { labelIds: ids });
      withSave(() => updateTask(task.id, { labelIds: ids }));
    },
    [task, onUpdate, withSave],
  );

  // Delete task
  const handleDelete = useCallback(async () => {
    if (!task) return;
    try {
      await deleteTask(task.id);
      onClose();
    } catch (err) {
      console.error('[TaskDetailModal] delete failed', err);
    }
  }, [task, onClose]);

  // Copy link
  const handleCopyLink = useCallback(() => {
    const url = `${window.location.origin}/admin/tasks?task=${task?.id}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setShowOverflowMenu(false);
  }, [task?.id]);

  if (!task) return null;

  const statusConfig = getStatusConfig(localStatus);
  const priorityConfig = getPriorityConfig(localPriority);
  const selectedLabels = labels.filter((l) => localLabelIds.includes(l.id));
  const isDone = localStatus === 'done';

  // Task index for breadcrumb
  const topLevel = tasks.filter((t) => !t.parentTaskId);
  const taskIndex = topLevel.findIndex((t) => t.id === task.id);

  return (
    <>
      <motion.div
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
      >
        <motion.div
          className={styles.panel}
          initial={{ scale: 0.97, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.97, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          role="dialog"
          aria-modal="true"
          aria-label="Task details"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <span className={styles.breadcrumb}>
                {task.parent
                  ? task.parent.label
                  : taskIndex >= 0
                  ? `Task ${taskIndex + 1} of ${topLevel.length}`
                  : 'Tasks'}
              </span>
            </div>
            {/* Save indicator */}
            {saveState !== 'idle' && (
              <div
                className={`${styles.saveIndicator} ${
                  saveState === 'saving'
                    ? styles.saveIndicatorSaving
                    : styles.saveIndicatorSaved
                }`}
              >
                {saveState === 'saving' ? 'Saving…' : 'Saved ✓'}
              </div>
            )}
            <div className={styles.headerRight}>
              <button
                type="button"
                className={styles.headerIconBtn}
                onClick={() => navigateTask(-1)}
                aria-label="Previous task"
                disabled={taskIndex <= 0}
              >
                <ArrowUp size={16} />
              </button>
              <button
                type="button"
                className={styles.headerIconBtn}
                onClick={() => navigateTask(1)}
                aria-label="Next task"
                disabled={taskIndex >= topLevel.length - 1}
              >
                <ArrowDown size={16} />
              </button>

              {/* Overflow menu */}
              <div ref={overflowRef} className={styles.overflowWrap}>
                <button
                  type="button"
                  className={styles.headerIconBtn}
                  onClick={() => setShowOverflowMenu((v) => !v)}
                  aria-label="More options"
                >
                  <DotsThree size={18} weight="bold" />
                </button>
                {showOverflowMenu && (
                  <div className={styles.overflowMenu}>
                    <button
                      type="button"
                      className={styles.overflowItem}
                      onClick={handleCopyLink}
                    >
                      Copy link
                    </button>
                    <button
                      type="button"
                      className={`${styles.overflowItem} ${styles.overflowItemDanger}`}
                      onClick={() => { setShowOverflowMenu(false); setShowDeleteConfirm(true); }}
                    >
                      Delete task
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className={styles.body}>
            {/* Main column */}
            <div className={styles.mainCol}>
              {/* Title row */}
              <div className={styles.titleRow}>
                <button
                  type="button"
                  className={`${styles.completionCircle} ${isDone ? styles.completionCircleDone : ''}`}
                  onClick={toggleDone}
                  aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
                >
                  {isDone && <Check size={10} weight="bold" color="#fff" />}
                </button>
                <div
                  ref={titleRef}
                  className={`${styles.titleInput} ${isDone ? styles.titleInputDone : ''}`}
                  contentEditable
                  suppressContentEditableWarning
                  data-placeholder="Task name"
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      titleRef.current?.blur();
                    }
                  }}
                />
              </div>

              {/* Description (Tiptap) */}
              <DescriptionEditor
                key={task.id}
                initialValue={task.description}
                onBlur={handleDescriptionBlur}
              />

              {/* Sub-tasks */}
              <SubtaskInlineForm
                parentTaskId={task.id}
                subtasks={subtasks}
                labels={labels}
                onCreated={() => onSaved?.(task.id)}
                onOpenSubtask={(subtask) => onNavigate?.(subtask)}
              />

              {/* Comments section */}
              <div className={styles.sectionBlock}>
                <button
                  type="button"
                  className={styles.sectionHeader}
                  onClick={() => setCommentsExpanded((v) => !v)}
                >
                  <span className={styles.sectionTitle}>Comments</span>
                  {commentsExpanded ? (
                    <CaretUp size={13} />
                  ) : (
                    <CaretDown size={13} />
                  )}
                </button>
                {commentsExpanded && (
                  <TaskComments
                    taskId={task.id}
                    currentUserId={currentUserId}
                    currentUserName={currentUserName}
                    currentUserAvatarUrl={currentUserAvatarUrl}
                  />
                )}
              </div>

              {/* Activity section */}
              <div className={styles.sectionBlock}>
                <button
                  type="button"
                  className={styles.sectionHeader}
                  onClick={() => setActivityExpanded((v) => !v)}
                >
                  <span className={styles.sectionTitle}>Activity</span>
                  {activityExpanded ? (
                    <CaretUp size={13} />
                  ) : (
                    <CaretDown size={13} />
                  )}
                </button>
                {activityExpanded && <TaskActivityLog taskId={task.id} />}
              </div>
            </div>

            {/* Right sidebar */}
            <div className={styles.sidebar} ref={openFieldContainerRef}>
              {/* Status */}
              <div className={styles.sidebarField}>
                <span className={styles.sidebarLabel}>Status</span>
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className={styles.sidebarValue}
                    onClick={() =>
                      setOpenField(openField === 'status' ? null : 'status')
                    }
                  >
                    <span
                      className={styles.statusPill}
                      style={{
                        background: `${statusConfig.color}18`,
                        color: statusConfig.color,
                        border: `1px solid ${statusConfig.color}40`,
                      }}
                    >
                      {statusConfig.label}
                    </span>
                  </button>
                  {openField === 'status' && (
                    <div className={styles.dropdown}>
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          className={styles.dropdownItem}
                          onClick={() => handleStatusChange(opt.value)}
                        >
                          <span
                            style={{
                              display: 'inline-block',
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: opt.color,
                              marginRight: 8,
                              flexShrink: 0,
                            }}
                          />
                          {opt.label}
                          {localStatus === opt.value && (
                            <Check
                              size={12}
                              style={{ marginLeft: 'auto' }}
                              color="#c17b4e"
                              weight="bold"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Priority */}
              <div className={styles.sidebarField}>
                <span className={styles.sidebarLabel}>Priority</span>
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className={styles.sidebarValue}
                    onClick={() =>
                      setOpenField(
                        openField === 'priority' ? null : 'priority',
                      )
                    }
                  >
                    <Flag
                      size={14}
                      weight="fill"
                      color={priorityConfig.color}
                    />
                    <span style={{ color: priorityConfig.color, fontSize: 13 }}>
                      {priorityConfig.label}
                    </span>
                  </button>
                  {openField === 'priority' && (
                    <div className={styles.dropdown}>
                      {PRIORITY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          className={styles.dropdownItem}
                          onClick={() => handlePriorityChange(opt.value)}
                        >
                          <Flag
                            size={13}
                            weight="fill"
                            color={opt.color}
                            style={{ marginRight: 8 }}
                          />
                          <span style={{ color: '#111827' }}>{opt.label}</span>
                          {localPriority === opt.value && (
                            <Check
                              size={12}
                              style={{ marginLeft: 'auto' }}
                              color="#c17b4e"
                              weight="bold"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Assignee (display only) */}
              <div className={styles.sidebarField}>
                <span className={styles.sidebarLabel}>Assignee</span>
                <div className={styles.sidebarValue} style={{ cursor: 'default' }}>
                  {task.assigneeName ? (
                    <>
                      <InitialsAvatar
                        name={task.assigneeName}
                        avatarUrl={task.assigneeAvatarUrl}
                        size={20}
                      />
                      <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                        {task.assigneeName}
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                      Unassigned
                    </span>
                  )}
                </div>
              </div>

              {/* Due date */}
              <div className={styles.sidebarField}>
                <span className={styles.sidebarLabel}>Due Date</span>
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className={`${styles.sidebarValue} ${!localDueAt ? styles.sidebarValueEmpty : ''}`}
                    onClick={() =>
                      setOpenField(openField === 'dueDate' ? null : 'dueDate')
                    }
                  >
                    <CalendarBlank size={14} />
                    <span style={{ fontSize: 13 }}>
                      {formatDueDate(localDueAt)}
                    </span>
                  </button>
                  {openField === 'dueDate' && (
                    <div className={styles.dropdownCalendar}>
                      <DatePickerDropdown
                        value={localDueAt}
                        onChange={handleDueDateChange}
                        onClose={() => setOpenField(null)}
                        showRepeat={false}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Labels */}
              <div className={styles.sidebarField}>
                <span className={styles.sidebarLabel}>Labels</span>
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className={`${styles.sidebarValue} ${selectedLabels.length === 0 ? styles.sidebarValueEmpty : ''}`}
                    onClick={() =>
                      setOpenField(openField === 'labels' ? null : 'labels')
                    }
                  >
                    {selectedLabels.length === 0 ? (
                      <>
                        <Tag size={14} />
                        <span style={{ fontSize: 13 }}>No labels</span>
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {selectedLabels.map((l) => (
                          <span
                            key={l.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: `${l.color}18`,
                              border: `1px solid ${l.color}40`,
                              fontSize: 11,
                              color: l.color,
                              fontWeight: 500,
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: l.color,
                                flexShrink: 0,
                              }}
                            />
                            {l.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                  {openField === 'labels' && (
                    <div className={styles.dropdown} style={{ minWidth: 200 }}>
                      <LabelPicker
                        labels={labels}
                        selectedIds={localLabelIds}
                        onChange={handleLabelsChange}
                        onClose={() => setOpenField(null)}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.divider} />

              {/* Property */}
              <div className={styles.sidebarField}>
                <span className={styles.sidebarLabel}>Property</span>
                <ParentEntityPicker
                  type="property"
                  value={localLinkedPropertyId}
                  label={localLinkedPropertyLabel}
                  onChange={(id, label) => {
                    setLocalLinkedPropertyId(id);
                    setLocalLinkedPropertyLabel(label);
                    if (!task) return;
                    onUpdate?.(task.id, { linkedPropertyId: id });
                    withSave(() => updateTask(task.id, { linkedPropertyId: id }));
                  }}
                />
              </div>

              {/* Contact */}
              <div className={styles.sidebarField}>
                <span className={styles.sidebarLabel}>Contact</span>
                <ParentEntityPicker
                  type="contact"
                  value={localLinkedContactId}
                  label={localLinkedContactLabel}
                  onChange={(id, label) => {
                    setLocalLinkedContactId(id);
                    setLocalLinkedContactLabel(label);
                    if (!task) return;
                    onUpdate?.(task.id, { linkedContactId: id });
                    withSave(() => updateTask(task.id, { linkedContactId: id }));
                  }}
                />
              </div>

              {/* Project */}
              <div className={styles.sidebarField}>
                <span className={styles.sidebarLabel}>Project</span>
                <ParentEntityPicker
                  type="project"
                  value={localLinkedProjectId}
                  label={localLinkedProjectLabel}
                  onChange={(id, label) => {
                    setLocalLinkedProjectId(id);
                    setLocalLinkedProjectLabel(label);
                    if (!task) return;
                    onUpdate?.(task.id, { linkedProjectId: id });
                    withSave(() => updateTask(task.id, { linkedProjectId: id }));
                  }}
                />
              </div>

              <div className={styles.divider} />

              {/* Attachments */}
              <div className={styles.sidebarField}>
                <span className={styles.sidebarLabel}>Attachments</span>
                <TaskAttachments taskId={task.id} />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <ConfirmModal
        open={showDeleteConfirm}
        title="Delete task?"
        description="This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
