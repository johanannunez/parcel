'use client';

import {
  useState,
  useTransition,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import Image from 'next/image';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Check } from '@phosphor-icons/react';
import type { Task, TaskLabel, TaskStatus } from '@/lib/admin/task-types';
import { updateTask, createTask } from '@/lib/admin/task-actions';
import styles from './TasksBoardView.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type GroupBy = 'status' | 'priority';

type ColumnDef = {
  key: string;
  label: string;
  color: string;
};

type Props = {
  tasks: Task[];
  labels: TaskLabel[];
  onOpenTask: (task: Task) => void;
  onTaskUpdate: (id: string, patch: Partial<Task>) => void;
};

// ─── Column definitions ───────────────────────────────────────────────────────

const STATUS_COLUMNS: ColumnDef[] = [
  { key: 'todo', label: 'To Do', color: '#6b7280' },
  { key: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { key: 'blocked', label: 'Blocked', color: '#ef4444' },
  { key: 'done', label: 'Done', color: '#10b981' },
];

const PRIORITY_COLUMNS: ColumnDef[] = [
  { key: '1', label: 'P1 Urgent', color: '#ef4444' },
  { key: '2', label: 'P2 High', color: '#f59e0b' },
  { key: '3', label: 'P3 Medium', color: '#3b82f6' },
  { key: '4', label: 'P4 None', color: '#9ca3af' },
];

// ─── Date helpers ─────────────────────────────────────────────────────────────

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

function isOverdue(iso: string, status: string): boolean {
  if (status === 'done') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

const PRIORITY_DOT_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#f59e0b',
  3: '#3b82f6',
  4: '#9ca3af',
};

// ─── Inline add form ──────────────────────────────────────────────────────────

function ColumnAddForm({
  columnKey,
  groupBy,
  onAdded,
}: {
  columnKey: string;
  groupBy: GroupBy;
  onAdded: (task: Task) => void;
}) {
  const [active, setActive] = useState(false);
  const [title, setTitle] = useState('');
  const [isSubmitting, startSubmit] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const open = () => {
    setActive(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };
  const cancel = () => {
    setActive(false);
    setTitle('');
  };

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    startSubmit(async () => {
      const input =
        groupBy === 'status'
          ? { title: trimmed, priority: 4 as const, status: columnKey as TaskStatus }
          : { title: trimmed, priority: Number(columnKey) as 1 | 2 | 3 | 4 };

      const { id } = await createTask(input);
      const now = new Date().toISOString();
      const newTask: Task = {
        id,
        parentTaskId: null,
        title: trimmed,
        description: null,
        status: groupBy === 'status' ? (columnKey as TaskStatus) : 'todo',
        priority: groupBy === 'priority' ? (Number(columnKey) as 1 | 2 | 3 | 4) : 4,
        assigneeId: null,
        assigneeName: null,
        assigneeAvatarUrl: null,
        createdById: null,
        createdByName: null,
        dueAt: null,
        completedAt: null,
        createdAt: now,
        parent: null,
        subtaskCount: 0,
        subtaskDoneCount: 0,
        tags: [],
        labelIds: [],
        linkedPropertyId: null,
        linkedContactId: null,
        linkedProjectId: null,
      };
      onAdded(newTask);
      setTitle('');
      setActive(false);
    });
  };

  if (active) {
    return (
      <div className={styles.addForm}>
        <input
          ref={inputRef}
          type="text"
          className={styles.addInput}
          placeholder="Task name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'Escape') cancel();
          }}
          disabled={isSubmitting}
        />
      </div>
    );
  }

  return (
    <button type="button" className={styles.addBtn} onClick={open}>
      <Plus size={12} />
      Add task
    </button>
  );
}

// ─── Kanban card ──────────────────────────────────────────────────────────────

function KanbanCard({
  task,
  groupBy,
  onOpen,
  onComplete,
  isDragging = false,
}: {
  task: Task;
  groupBy: GroupBy;
  onOpen: (task: Task) => void;
  onComplete: (taskId: string) => void;
  isDragging?: boolean;
}) {
  const isDone = task.status === 'done';
  const dueOverdue = task.dueAt ? isOverdue(task.dueAt, task.status) : false;

  return (
    <div className={`${styles.card} ${isDragging ? styles.cardDragging : ''}`}>
      {/* Line 1: completion + title */}
      <div className={styles.cardLine1}>
        <button
          type="button"
          className={`${styles.completeCircle} ${isDone ? styles.completeCircleDone : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onComplete(task.id);
          }}
          aria-label={isDone ? 'Mark as to-do' : 'Mark complete'}
        >
          {isDone && <Check size={8} weight="bold" color="#fff" />}
        </button>
        <span
          className={`${styles.cardTitle} ${isDone ? styles.cardTitleDone : ''}`}
          onClick={() => onOpen(task)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onOpen(task);
          }}
        >
          {task.title}
        </span>
      </div>

      {/* Line 2: metadata */}
      {(groupBy === 'status' || task.dueAt || task.parent || task.assigneeName || task.assigneeAvatarUrl) && (
        <div className={styles.cardMeta}>
          {/* Priority dot when grouping by status */}
          {groupBy === 'status' && (
            <span
              className={styles.cardPriorityDot}
              style={{ background: PRIORITY_DOT_COLORS[task.priority] }}
              title={`P${task.priority}`}
            />
          )}

          {/* Due date */}
          {task.dueAt && (
            <span className={`${styles.cardDueChip} ${dueOverdue ? styles.cardDueChipOverdue : ''}`}>
              {humanDueLabel(task.dueAt)}
            </span>
          )}

          {/* Parent chip */}
          {task.parent && (
            <span className={styles.cardParentChip}>{task.parent.label}</span>
          )}

          {/* Assignee avatar */}
          {task.assigneeAvatarUrl ? (
            <Image
              src={task.assigneeAvatarUrl}
              alt={task.assigneeName ?? 'Assignee'}
              width={16}
              height={16}
              className={styles.cardAvatar}
            />
          ) : task.assigneeName ? (
            <span className={styles.cardAvatarFallback} aria-label={task.assigneeName}>
              {task.assigneeName
                .split(' ')
                .map((p) => p[0])
                .slice(0, 2)
                .join('')}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ─── Sortable card wrapper ────────────────────────────────────────────────────

function SortableCard({
  task,
  groupBy,
  onOpen,
  onComplete,
}: {
  task: Task;
  groupBy: GroupBy;
  onOpen: (task: Task) => void;
  onComplete: (taskId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard
        task={task}
        groupBy={groupBy}
        onOpen={onOpen}
        onComplete={onComplete}
        isDragging={isDragging}
      />
    </div>
  );
}

// ─── Droppable column ─────────────────────────────────────────────────────────

function BoardColumn({
  column,
  tasks,
  groupBy,
  onOpen,
  onComplete,
  onTaskAdded,
}: {
  column: ColumnDef;
  tasks: Task[];
  groupBy: GroupBy;
  onOpen: (task: Task) => void;
  onComplete: (taskId: string) => void;
  onTaskAdded: (task: Task, columnKey: string) => void;
}) {
  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  return (
    <div className={styles.column}>
      <div className={styles.columnHeader}>
        <span className={styles.columnDot} style={{ background: column.color }} />
        <span className={styles.columnLabel}>{column.label}</span>
        <span className={styles.columnCount}>{tasks.length}</span>
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className={styles.columnCards} data-column={column.key}>
          {tasks.map((task) => (
            <SortableCard
              key={task.id}
              task={task}
              groupBy={groupBy}
              onOpen={onOpen}
              onComplete={onComplete}
            />
          ))}
        </div>
      </SortableContext>

      <div className={styles.columnFooter}>
        <ColumnAddForm
          columnKey={column.key}
          groupBy={groupBy}
          onAdded={(task) => onTaskAdded(task, column.key)}
        />
      </div>
    </div>
  );
}

// ─── Build column map from tasks ──────────────────────────────────────────────

function buildColumnMap(tasks: Task[], groupBy: GroupBy): Map<string, Task[]> {
  const columns = groupBy === 'status' ? STATUS_COLUMNS : PRIORITY_COLUMNS;
  const map = new Map<string, Task[]>();
  for (const col of columns) {
    map.set(col.key, []);
  }
  for (const task of tasks) {
    const key =
      groupBy === 'status' ? task.status : String(task.priority);
    const bucket = map.get(key);
    if (bucket) {
      bucket.push(task);
    } else {
      // Fallback — put in last column
      const lastKey = columns[columns.length - 1].key;
      map.get(lastKey)!.push(task);
    }
  }
  return map;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TasksBoardView({ tasks, labels: _labels, onOpenTask, onTaskUpdate }: Props) {
  const [groupBy, setGroupBy] = useState<GroupBy>('status');
  const [columnMap, setColumnMap] = useState<Map<string, Task[]>>(() =>
    buildColumnMap(tasks, groupBy),
  );
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [, startTransition] = useTransition();

  // Rebuild column map when tasks or groupBy changes
  useEffect(() => {
    setColumnMap(buildColumnMap(tasks, groupBy));
  }, [tasks, groupBy]);

  const columns = groupBy === 'status' ? STATUS_COLUMNS : PRIORITY_COLUMNS;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  // Find which column a task belongs to
  const findColumn = useCallback(
    (taskId: string): string | null => {
      for (const [colKey, colTasks] of columnMap.entries()) {
        if (colTasks.some((t) => t.id === taskId)) return colKey;
      }
      return null;
    },
    [columnMap],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const taskId = event.active.id as string;
      for (const colTasks of columnMap.values()) {
        const found = colTasks.find((t) => t.id === taskId);
        if (found) { setActiveTask(found); break; }
      }
    },
    [columnMap],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTask(null);

      const { active, over } = event;
      if (!over) return;

      const taskId = active.id as string;
      const overId = over.id as string;

      const sourceCol = findColumn(taskId);
      if (!sourceCol) return;

      // Determine target column: over.id can be a column key or a task id
      let targetCol: string | null = null;
      if (columnMap.has(overId)) {
        targetCol = overId;
      } else {
        targetCol = findColumn(overId);
      }

      if (!targetCol || targetCol === sourceCol) return;

      // Optimistic local update
      setColumnMap((prev) => {
        const next = new Map(prev);
        const srcTasks = [...(next.get(sourceCol) ?? [])];
        const tgtTasks = [...(next.get(targetCol!) ?? [])];

        const taskIdx = srcTasks.findIndex((t) => t.id === taskId);
        if (taskIdx === -1) return prev;
        const [movedTask] = srcTasks.splice(taskIdx, 1);

        // Update task field
        let updatedTask: Task;
        if (groupBy === 'status') {
          updatedTask = { ...movedTask, status: targetCol! as TaskStatus };
        } else {
          updatedTask = { ...movedTask, priority: Number(targetCol!) as 1 | 2 | 3 | 4 };
        }

        tgtTasks.push(updatedTask);
        next.set(sourceCol, srcTasks);
        next.set(targetCol!, tgtTasks);
        return next;
      });

      // Propagate to parent + server
      if (groupBy === 'status') {
        const patch = { status: targetCol as TaskStatus };
        onTaskUpdate(taskId, patch);
        startTransition(async () => {
          await updateTask(taskId, patch);
        });
      } else {
        const patch = { priority: Number(targetCol) as 1 | 2 | 3 | 4 };
        onTaskUpdate(taskId, patch);
        startTransition(async () => {
          await updateTask(taskId, patch);
        });
      }
    },
    [findColumn, columnMap, groupBy, onTaskUpdate],
  );

  const handleComplete = useCallback(
    (taskId: string) => {
      setColumnMap((prev) => {
        const next = new Map(prev);
        for (const [colKey, colTasks] of next.entries()) {
          const idx = colTasks.findIndex((t) => t.id === taskId);
          if (idx === -1) continue;
          const task = colTasks[idx];
          const nowDone = task.status !== 'done';
          const updatedTask: Task = { ...task, status: nowDone ? 'done' : 'todo' };

          if (groupBy === 'status') {
            // Move to/from done column
            const newColKey = nowDone ? 'done' : 'todo';
            const updatedSrc = colTasks.filter((_, i) => i !== idx);
            next.set(colKey, updatedSrc);
            const doneCol = [...(next.get(newColKey) ?? [])];
            doneCol.push(updatedTask);
            next.set(newColKey, doneCol);
          } else {
            // Priority grouping: just update in place
            const updated = [...colTasks];
            updated[idx] = updatedTask;
            next.set(colKey, updated);
          }
          break;
        }
        return next;
      });

      // Propagate to parent + server
      onTaskUpdate(taskId, { status: 'done' });
      startTransition(async () => {
        await updateTask(taskId, { status: 'done' });
      });
    },
    [groupBy, onTaskUpdate],
  );

  const handleTaskAdded = useCallback(
    (task: Task, columnKey: string) => {
      setColumnMap((prev) => {
        const next = new Map(prev);
        const colTasks = [...(next.get(columnKey) ?? [])];
        colTasks.push(task);
        next.set(columnKey, colTasks);
        return next;
      });
    },
    [],
  );

  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.groupToggle}>
          <button
            type="button"
            className={`${styles.groupBtn} ${groupBy === 'status' ? styles.groupBtnActive : ''}`}
            onClick={() => setGroupBy('status')}
          >
            Status
          </button>
          <button
            type="button"
            className={`${styles.groupBtn} ${groupBy === 'priority' ? styles.groupBtnActive : ''}`}
            onClick={() => setGroupBy('priority')}
          >
            Priority
          </button>
        </div>
      </div>

      {/* Board */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className={styles.board}>
          {columns.map((col) => {
            const colTasks = columnMap.get(col.key) ?? [];
            return (
              <BoardColumn
                key={col.key}
                column={col}
                tasks={colTasks}
                groupBy={groupBy}
                onOpen={onOpenTask}
                onComplete={handleComplete}
                onTaskAdded={handleTaskAdded}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <KanbanCard
              task={activeTask}
              groupBy={groupBy}
              onOpen={onOpenTask}
              onComplete={handleComplete}
              isDragging={false}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
