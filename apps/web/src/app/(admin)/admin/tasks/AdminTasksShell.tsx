"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  CalendarBlank,
  CaretRight,
  CheckCircle,
  Circle,
  EnvelopeSimple,
  Flag,
  PencilSimple,
  Phone,
  Plus,
  Rows,
  SquaresFour,
  Trash,
  UsersThree,
  Warning,
  X,
} from "@phosphor-icons/react";
import {
  format,
  isToday,
  isTomorrow,
  isPast,
  parseISO,
  isThisWeek,
} from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import {
  addComment,
  addSubtask,
  createFromTemplate,
  createTask,
  deleteTask,
  toggleSubtask,
  updateTask,
  updateTaskAssignees,
} from "./actions";

// ─── Types ───────────────────────────────────────────────────────────────────

export type TaskWithRelations = {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  status: string;
  priority: string;
  due_date: string | null;
  due_time: string | null;
  property_id: string | null;
  owner_id: string | null;
  created_at: string;
  completed_at: string | null;
  sort_order: number | null;
  assignees: { profile_id: string; name: string; avatar_url: string | null }[];
  labels: { id: string; name: string; color: string }[];
  subtasks: { id: string; title: string; completed: boolean; sort_order: number }[];
};

type OwnerProfile = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
};

type PropertyOption = {
  id: string;
  address_line1: string;
  city: string | null;
  state: string | null;
};

type LabelOption = {
  id: string;
  name: string;
  color: string;
};

type TemplateOption = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  task_type: string;
  subtasks: { title: string }[];
  default_priority: string;
};

type Props = {
  tasks: TaskWithRelations[];
  owners: OwnerProfile[];
  properties: PropertyOption[];
  labels: LabelOption[];
  templates: TemplateOption[];
  allProfiles: OwnerProfile[];
};

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUSES = [
  { value: "backlog", label: "Backlog", color: "#6B7280" },
  { value: "todo", label: "To Do", color: "#0284C7" },
  { value: "in_progress", label: "In Progress", color: "#D97706" },
  { value: "done", label: "Done", color: "#059669" },
  { value: "blocked", label: "Blocked", color: "#DC2626" },
  { value: "cancelled", label: "Cancelled", color: "#9CA3AF" },
];

const PRIORITIES = [
  { value: "low", label: "Low", color: "#6B7280" },
  { value: "medium", label: "Medium", color: "#D97706" },
  { value: "high", label: "High", color: "#DC2626" },
  { value: "urgent", label: "Urgent", color: "#DC2626" },
];

const TASK_TYPES = [
  { value: "todo", label: "Task", Icon: CheckCircle },
  { value: "call", label: "Call", Icon: Phone },
  { value: "meeting", label: "Meeting", Icon: UsersThree },
  { value: "email", label: "Email", Icon: EnvelopeSimple },
  { value: "milestone", label: "Milestone", Icon: Flag },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(status: string) {
  return STATUSES.find((s) => s.value === status)?.color ?? "#6B7280";
}

function priorityColor(priority: string) {
  return PRIORITIES.find((p) => p.value === priority)?.color ?? "#6B7280";
}

function TypeIcon({
  type,
  size = 14,
  color,
}: {
  type: string;
  size?: number;
  color?: string;
}) {
  const found = TASK_TYPES.find((t) => t.value === type);
  const Icon = found?.Icon ?? CheckCircle;
  return <Icon size={size} weight="duotone" color={color} />;
}

function formatDueDate(iso: string | null): string {
  if (!iso) return "";
  const d = parseISO(iso);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "MMM d");
}

function dueDateChipStyle(iso: string | null): { color: string; bg: string } {
  if (!iso) return { color: "var(--color-text-tertiary)", bg: "var(--color-warm-gray-100)" };
  const d = parseISO(iso);
  if (isPast(d) && !isToday(d)) return { color: "#DC2626", bg: "rgba(220,38,38,0.08)" };
  if (isToday(d)) return { color: "#D97706", bg: "rgba(217,119,6,0.08)" };
  return { color: "var(--color-text-secondary)", bg: "var(--color-warm-gray-100)" };
}

function buildPropertyLabel(p: PropertyOption) {
  const parts = [p.address_line1, p.city, p.state].filter(Boolean);
  return parts.join(", ");
}

function ownerLabel(id: string | null, owners: OwnerProfile[]) {
  if (!id) return null;
  const o = owners.find((o) => o.id === id);
  if (!o) return null;
  return o.full_name ?? o.email;
}

function Avatar({
  name,
  avatarUrl,
  size = 24,
}: {
  name: string;
  avatarUrl: string | null;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: "var(--color-brand)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.38),
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initials || "?"}
    </div>
  );
}

// ─── Pill components ──────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const s = STATUSES.find((s) => s.value === status);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 999,
        backgroundColor: `${s?.color ?? "#6B7280"}18`,
        color: s?.color ?? "#6B7280",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: s?.color ?? "#6B7280",
          flexShrink: 0,
        }}
      />
      {s?.label ?? status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const p = PRIORITIES.find((p) => p.value === priority);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 7px",
        borderRadius: 999,
        backgroundColor: `${p?.color ?? "#6B7280"}14`,
        color: p?.color ?? "#6B7280",
      }}
    >
      {priority === "urgent" && <ArrowUp size={10} weight="bold" />}
      {p?.label ?? priority}
    </span>
  );
}

// ─── Drawer section helper ────────────────────────────────────────────────────

function DrawerSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--color-text-tertiary)",
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

// ─── Task Drawer ─────────────────────────────────────────────────────────────

function TaskDrawer({
  task,
  owners,
  properties,
  labels,
  allProfiles,
  onClose,
  onDeleted,
}: {
  task: TaskWithRelations;
  owners: OwnerProfile[];
  properties: PropertyOption[];
  labels: LabelOption[];
  allProfiles: OwnerProfile[];
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [taskType, setTaskType] = useState(task.task_type);
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [ownerId, setOwnerId] = useState(task.owner_id ?? "");
  const [propertyId, setPropertyId] = useState(task.property_id ?? "");
  const [assigneeIds, setAssigneeIds] = useState<string[]>(
    task.assignees.map((a) => a.profile_id),
  );
  const [activeLabels, setActiveLabels] = useState<string[]>(
    task.labels.map((l) => l.id),
  );
  const [subtasks, setSubtasks] = useState(
    [...task.subtasks].sort((a, b) => a.sort_order - b.sort_order),
  );
  const [newSubtask, setNewSubtask] = useState("");
  const [commentText, setCommentText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Re-sync when switching tasks
  const prevId = useRef(task.id);
  useEffect(() => {
    if (prevId.current === task.id) return;
    prevId.current = task.id;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setTaskType(task.task_type);
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.due_date ?? "");
    setOwnerId(task.owner_id ?? "");
    setPropertyId(task.property_id ?? "");
    setAssigneeIds(task.assignees.map((a) => a.profile_id));
    setActiveLabels(task.labels.map((l) => l.id));
    setSubtasks([...task.subtasks].sort((a, b) => a.sort_order - b.sort_order));
    setError(null);
    setSaved(false);
    setConfirmDelete(false);
  }, [task]);

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const [updateRes, assigneeRes] = await Promise.all([
        updateTask(task.id, {
          title: title.trim(),
          description: description.trim() || null,
          task_type: taskType,
          status,
          priority,
          due_date: dueDate || null,
          owner_id: ownerId || null,
          property_id: propertyId || null,
        }),
        updateTaskAssignees(task.id, assigneeIds),
      ]);
      if (updateRes.error) {
        setError(updateRes.error);
        return;
      }
      if (assigneeRes.error) {
        setError(assigneeRes.error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteTask(task.id);
      if (res.error) {
        setError(res.error);
        return;
      }
      onDeleted(task.id);
      router.refresh();
    });
  };

  const handleToggleSubtask = (subtaskId: string, completed: boolean) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === subtaskId ? { ...s, completed } : s)),
    );
    startTransition(async () => {
      const res = await toggleSubtask(subtaskId, completed);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  };

  const handleAddSubtask = () => {
    const t = newSubtask.trim();
    if (!t) return;
    const optimistic = {
      id: `optimistic-${Date.now()}`,
      title: t,
      completed: false,
      sort_order: subtasks.length,
    };
    setSubtasks((prev) => [...prev, optimistic]);
    setNewSubtask("");
    startTransition(async () => {
      const res = await addSubtask(task.id, t);
      if (res.error) {
        setError(res.error);
        setSubtasks((prev) => prev.filter((s) => s.id !== optimistic.id));
      } else {
        router.refresh();
      }
    });
  };

  const handleAddComment = () => {
    const c = commentText.trim();
    if (!c) return;
    setCommentText("");
    startTransition(async () => {
      const res = await addComment(task.id, c);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  };

  const toggleAssignee = (id: string) => {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const subtaskDone = subtasks.filter((s) => s.completed).length;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.25)",
          zIndex: 40,
        }}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 480,
          maxWidth: "100vw",
          backgroundColor: "var(--color-white)",
          borderLeft: "1px solid var(--color-warm-gray-200)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          boxShadow: "var(--shadow-xl)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px 16px",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            borderBottom: "1px solid var(--color-warm-gray-200)",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              rows={2}
              style={{
                width: "100%",
                fontSize: 18,
                fontWeight: 600,
                color: "var(--color-text-primary)",
                background: "transparent",
                border: "none",
                resize: "none",
                outline: "none",
                lineHeight: 1.3,
                fontFamily: "inherit",
              }}
            />
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <StatusPill status={status} />
              <PriorityBadge priority={priority} />
              {task.due_date && (
                <span
                  style={{
                    fontSize: 11,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    color: dueDateChipStyle(task.due_date).color,
                  }}
                >
                  <CalendarBlank size={11} weight="bold" />
                  {formatDueDate(task.due_date)}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              flexShrink: 0,
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid var(--color-warm-gray-200)",
              backgroundColor: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-tertiary)",
            }}
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Type */}
          <DrawerSection label="Type">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {TASK_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTaskType(t.value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 10px",
                    borderRadius: 8,
                    border: `1px solid ${taskType === t.value ? "var(--color-brand)" : "var(--color-warm-gray-200)"}`,
                    backgroundColor: taskType === t.value ? "rgba(2,170,235,0.08)" : "transparent",
                    color: taskType === t.value ? "var(--color-brand)" : "var(--color-text-secondary)",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "border-color 120ms, background-color 120ms",
                  }}
                >
                  <t.Icon size={13} weight="duotone" />
                  {t.label}
                </button>
              ))}
            </div>
          </DrawerSection>

          {/* Status */}
          <DrawerSection label="Status">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 10px",
                    borderRadius: 8,
                    border: `1px solid ${status === s.value ? s.color : "var(--color-warm-gray-200)"}`,
                    backgroundColor: status === s.value ? `${s.color}14` : "transparent",
                    color: status === s.value ? s.color : "var(--color-text-secondary)",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "border-color 120ms, background-color 120ms",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: s.color,
                      flexShrink: 0,
                    }}
                  />
                  {s.label}
                </button>
              ))}
            </div>
          </DrawerSection>

          {/* Priority */}
          <DrawerSection label="Priority">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 10px",
                    borderRadius: 8,
                    border: `1px solid ${priority === p.value ? p.color : "var(--color-warm-gray-200)"}`,
                    backgroundColor: priority === p.value ? `${p.color}14` : "transparent",
                    color: priority === p.value ? p.color : "var(--color-text-secondary)",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "border-color 120ms, background-color 120ms",
                  }}
                >
                  {p.value === "urgent" && <ArrowUp size={10} weight="bold" />}
                  {p.label}
                </button>
              ))}
            </div>
          </DrawerSection>

          {/* Due date */}
          <DrawerSection label="Due date">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{
                fontSize: 13,
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid var(--color-warm-gray-200)",
                backgroundColor: "var(--color-warm-gray-100)",
                color: "var(--color-text-primary)",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </DrawerSection>

          {/* Owner */}
          <DrawerSection label="Owner">
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              style={{
                fontSize: 13,
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid var(--color-warm-gray-200)",
                backgroundColor: "var(--color-warm-gray-100)",
                color: "var(--color-text-primary)",
                outline: "none",
                fontFamily: "inherit",
                minWidth: 200,
              }}
            >
              <option value="">No owner</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.full_name ?? o.email}
                </option>
              ))}
            </select>
          </DrawerSection>

          {/* Property */}
          <DrawerSection label="Property">
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              style={{
                fontSize: 13,
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid var(--color-warm-gray-200)",
                backgroundColor: "var(--color-warm-gray-100)",
                color: "var(--color-text-primary)",
                outline: "none",
                fontFamily: "inherit",
                minWidth: 200,
              }}
            >
              <option value="">No property</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {buildPropertyLabel(p)}
                </option>
              ))}
            </select>
          </DrawerSection>

          {/* Assignees */}
          {allProfiles.length > 0 && (
            <DrawerSection label="Assignees">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {allProfiles.map((p) => {
                  const active = assigneeIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleAssignee(p.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 10px",
                        borderRadius: 8,
                        border: `1px solid ${active ? "var(--color-brand)" : "var(--color-warm-gray-200)"}`,
                        backgroundColor: active ? "rgba(2,170,235,0.08)" : "transparent",
                        color: active ? "var(--color-brand)" : "var(--color-text-secondary)",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      <Avatar name={p.full_name ?? p.email} avatarUrl={p.avatar_url} size={18} />
                      {p.full_name ?? p.email}
                    </button>
                  );
                })}
              </div>
            </DrawerSection>
          )}

          {/* Description */}
          <DrawerSection label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Add a description..."
              style={{
                width: "100%",
                fontSize: 13,
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid var(--color-warm-gray-200)",
                backgroundColor: "var(--color-warm-gray-100)",
                color: "var(--color-text-primary)",
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
                lineHeight: 1.5,
              }}
            />
          </DrawerSection>

          {/* Subtasks */}
          <DrawerSection
            label={`Subtasks${subtasks.length > 0 ? ` (${subtaskDone}/${subtasks.length})` : ""}`}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {subtasks.map((s) => (
                <label
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    fontSize: 13,
                    color: s.completed ? "var(--color-text-tertiary)" : "var(--color-text-primary)",
                    textDecoration: s.completed ? "line-through" : "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={s.completed}
                    onChange={(e) => handleToggleSubtask(s.id, e.target.checked)}
                    style={{
                      accentColor: "var(--color-brand)",
                      width: 15,
                      height: 15,
                      flexShrink: 0,
                    }}
                  />
                  {s.title}
                </label>
              ))}
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  placeholder="Add subtask..."
                  style={{
                    flex: 1,
                    fontSize: 12,
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "1px solid var(--color-warm-gray-200)",
                    backgroundColor: "var(--color-warm-gray-100)",
                    color: "var(--color-text-primary)",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  disabled={!newSubtask.trim()}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "none",
                    backgroundColor: "var(--color-brand)",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: newSubtask.trim() ? "pointer" : "not-allowed",
                    opacity: newSubtask.trim() ? 1 : 0.5,
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </DrawerSection>

          {/* Labels */}
          {labels.length > 0 && (
            <DrawerSection label="Labels">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {labels.map((l) => {
                  const active = activeLabels.includes(l.id);
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() =>
                        setActiveLabels((prev) =>
                          prev.includes(l.id)
                            ? prev.filter((x) => x !== l.id)
                            : [...prev, l.id],
                        )
                      }
                      style={{
                        padding: "3px 10px",
                        borderRadius: 999,
                        border: `1.5px solid ${active ? l.color : "var(--color-warm-gray-200)"}`,
                        backgroundColor: active ? `${l.color}18` : "transparent",
                        color: active ? l.color : "var(--color-text-secondary)",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {l.name}
                    </button>
                  );
                })}
              </div>
            </DrawerSection>
          )}

          {/* Comment */}
          <DrawerSection label="Add comment">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                placeholder="Leave a note..."
                style={{
                  width: "100%",
                  fontSize: 13,
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--color-warm-gray-200)",
                  backgroundColor: "var(--color-warm-gray-100)",
                  color: "var(--color-text-primary)",
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
              <button
                type="button"
                onClick={handleAddComment}
                disabled={!commentText.trim() || pending}
                style={{
                  alignSelf: "flex-end",
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: "var(--color-brand)",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: commentText.trim() ? "pointer" : "not-allowed",
                  opacity: commentText.trim() ? 1 : 0.5,
                }}
              >
                Post
              </button>
            </div>
          </DrawerSection>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--color-warm-gray-200)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid rgba(220,38,38,0.3)",
                backgroundColor: "transparent",
                color: "#DC2626",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <Trash size={14} weight="bold" />
              Delete task
            </button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Are you sure?</span>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--color-warm-gray-200)",
                  backgroundColor: "transparent",
                  color: "var(--color-text-secondary)",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: "#DC2626",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {error && (
              <span
                style={{
                  fontSize: 12,
                  color: "#DC2626",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Warning size={12} weight="fill" /> {error}
              </span>
            )}
            {saved && (
              <span style={{ fontSize: 12, color: "#059669" }}>Saved</span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={pending}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                border: "none",
                backgroundColor: "var(--color-navy)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: pending ? "not-allowed" : "pointer",
                opacity: pending ? 0.7 : 1,
              }}
            >
              {pending ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── New Task Drawer ──────────────────────────────────────────────────────────

function NewTaskDrawer({
  owners,
  properties,
  templates,
  onClose,
  defaultStatus,
}: {
  owners: OwnerProfile[];
  properties: PropertyOption[];
  labels: LabelOption[];
  templates: TemplateOption[];
  onClose: () => void;
  defaultStatus?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const titleRef = useRef<HTMLInputElement>(null);

  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskType, setTaskType] = useState("todo");
  const [status, setStatus] = useState(defaultStatus ?? "todo");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const applyTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (!templateId) return;
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    setTitle(tpl.name);
    setTaskType(tpl.task_type);
    setPriority(tpl.default_priority);
    setSubtasks(tpl.subtasks.map((s) => s.title));
    if (tpl.description) setDescription(tpl.description);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setError(null);

    if (selectedTemplate) {
      startTransition(async () => {
        const res = await createFromTemplate(
          selectedTemplate,
          ownerId || undefined,
          propertyId || undefined,
        );
        if (res.error) {
          setError(res.error);
          return;
        }
        router.refresh();
        onClose();
      });
      return;
    }

    startTransition(async () => {
      const res = await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        task_type: taskType,
        status,
        priority,
        due_date: dueDate || undefined,
        owner_id: ownerId || undefined,
        property_id: propertyId || undefined,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
      onClose();
    });
  };

  return (
    <>
      <motion.div
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.25)",
          zIndex: 40,
        }}
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 480,
          maxWidth: "100vw",
          backgroundColor: "var(--color-white)",
          borderLeft: "1px solid var(--color-warm-gray-200)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--shadow-xl)",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid var(--color-warm-gray-200)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--color-text-primary)",
              margin: 0,
            }}
          >
            New task
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid var(--color-warm-gray-200)",
              backgroundColor: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-tertiary)",
            }}
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Template picker */}
          {templates.length > 0 && (
            <DrawerSection label="Start from template">
              <select
                value={selectedTemplate}
                onChange={(e) => applyTemplate(e.target.value)}
                style={{
                  fontSize: 13,
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--color-warm-gray-200)",
                  backgroundColor: "var(--color-warm-gray-100)",
                  color: "var(--color-text-primary)",
                  outline: "none",
                  fontFamily: "inherit",
                  minWidth: 220,
                }}
              >
                <option value="">Blank task</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </DrawerSection>
          )}

          {/* Title */}
          <DrawerSection label="Title">
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              placeholder="Task title..."
              style={{
                width: "100%",
                fontSize: 14,
                fontWeight: 500,
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid var(--color-warm-gray-200)",
                backgroundColor: "var(--color-warm-gray-100)",
                color: "var(--color-text-primary)",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </DrawerSection>

          {/* Type */}
          <DrawerSection label="Type">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {TASK_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTaskType(t.value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 10px",
                    borderRadius: 8,
                    border: `1px solid ${taskType === t.value ? "var(--color-brand)" : "var(--color-warm-gray-200)"}`,
                    backgroundColor: taskType === t.value ? "rgba(2,170,235,0.08)" : "transparent",
                    color: taskType === t.value ? "var(--color-brand)" : "var(--color-text-secondary)",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  <t.Icon size={13} weight="duotone" />
                  {t.label}
                </button>
              ))}
            </div>
          </DrawerSection>

          {/* Status + Priority row */}
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <DrawerSection label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  fontSize: 13,
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--color-warm-gray-200)",
                  backgroundColor: "var(--color-warm-gray-100)",
                  color: "var(--color-text-primary)",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </DrawerSection>
            <DrawerSection label="Priority">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{
                  fontSize: 13,
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--color-warm-gray-200)",
                  backgroundColor: "var(--color-warm-gray-100)",
                  color: "var(--color-text-primary)",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </DrawerSection>
          </div>

          {/* Due date */}
          <DrawerSection label="Due date">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{
                fontSize: 13,
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid var(--color-warm-gray-200)",
                backgroundColor: "var(--color-warm-gray-100)",
                color: "var(--color-text-primary)",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </DrawerSection>

          {/* Owner + Property */}
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <DrawerSection label="Owner">
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                style={{
                  fontSize: 13,
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--color-warm-gray-200)",
                  backgroundColor: "var(--color-warm-gray-100)",
                  color: "var(--color-text-primary)",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              >
                <option value="">No owner</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.full_name ?? o.email}
                  </option>
                ))}
              </select>
            </DrawerSection>
            <DrawerSection label="Property">
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                style={{
                  fontSize: 13,
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--color-warm-gray-200)",
                  backgroundColor: "var(--color-warm-gray-100)",
                  color: "var(--color-text-primary)",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              >
                <option value="">No property</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {buildPropertyLabel(p)}
                  </option>
                ))}
              </select>
            </DrawerSection>
          </div>

          {/* Description */}
          <DrawerSection label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional description..."
              style={{
                width: "100%",
                fontSize: 13,
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid var(--color-warm-gray-200)",
                backgroundColor: "var(--color-warm-gray-100)",
                color: "var(--color-text-primary)",
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </DrawerSection>

          {/* Subtasks */}
          <DrawerSection label="Subtasks">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {subtasks.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Circle
                    size={14}
                    weight="regular"
                    style={{ color: "var(--color-text-tertiary)", flexShrink: 0 }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--color-text-primary)",
                      flex: 1,
                    }}
                  >
                    {s}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSubtasks((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-text-tertiary)",
                      padding: 2,
                    }}
                  >
                    <X size={12} weight="bold" />
                  </button>
                </div>
              ))}
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (newSubtask.trim()) {
                        setSubtasks((prev) => [...prev, newSubtask.trim()]);
                        setNewSubtask("");
                      }
                    }
                  }}
                  placeholder="Add a subtask..."
                  style={{
                    flex: 1,
                    fontSize: 12,
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: "1px solid var(--color-warm-gray-200)",
                    backgroundColor: "var(--color-warm-gray-100)",
                    color: "var(--color-text-primary)",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newSubtask.trim()) {
                      setSubtasks((prev) => [...prev, newSubtask.trim()]);
                      setNewSubtask("");
                    }
                  }}
                  disabled={!newSubtask.trim()}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: "none",
                    backgroundColor: "var(--color-warm-gray-200)",
                    color: "var(--color-text-primary)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: newSubtask.trim() ? "pointer" : "not-allowed",
                    opacity: newSubtask.trim() ? 1 : 0.5,
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </DrawerSection>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--color-warm-gray-200)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          {error && (
            <span
              style={{
                fontSize: 12,
                color: "#DC2626",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Warning size={12} weight="fill" /> {error}
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid var(--color-warm-gray-200)",
              backgroundColor: "transparent",
              color: "var(--color-text-secondary)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={pending || !title.trim()}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              backgroundColor: "var(--color-navy)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: pending || !title.trim() ? "not-allowed" : "pointer",
              opacity: pending || !title.trim() ? 0.6 : 1,
            }}
          >
            {pending ? "Creating..." : "Create task"}
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ─── Task Row (List view) ─────────────────────────────────────────────────────

function TaskRow({
  task,
  owners,
  properties,
  onClick,
}: {
  task: TaskWithRelations;
  owners: OwnerProfile[];
  properties: PropertyOption[];
  onClick: () => void;
}) {
  const typeColor = statusColor(task.status);
  const owner = ownerLabel(task.owner_id, owners);
  const prop = properties.find((p) => p.id === task.property_id);
  const dueDateStr = formatDueDate(task.due_date);
  const dueDateStyle = dueDateChipStyle(task.due_date);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        borderRadius: 0,
        cursor: "pointer",
        transition: "background-color 100ms",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor =
          "var(--color-warm-gray-100)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent";
      }}
    >
      {/* Type icon */}
      <div style={{ flexShrink: 0, opacity: 0.65 }}>
        <TypeIcon type={task.task_type} size={15} color={typeColor} />
      </div>

      {/* Middle */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color:
                task.status === "cancelled"
                  ? "var(--color-text-tertiary)"
                  : "var(--color-text-primary)",
              textDecoration:
                task.status === "cancelled" ? "line-through" : "none",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 280,
            }}
          >
            {task.title}
          </span>
          {task.labels.map((l) => (
            <span
              key={l.id}
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: "1px 6px",
                borderRadius: 999,
                backgroundColor: `${l.color}18`,
                color: l.color,
                flexShrink: 0,
              }}
            >
              {l.name}
            </span>
          ))}
          {task.subtasks.length > 0 && (
            <span
              style={{
                fontSize: 11,
                color: "var(--color-text-tertiary)",
                flexShrink: 0,
              }}
            >
              {task.subtasks.filter((s) => s.completed).length}/
              {task.subtasks.length}
            </span>
          )}
        </div>
        {(owner || prop) && (
          <div
            style={{
              fontSize: 11,
              color: "var(--color-text-tertiary)",
              marginTop: 2,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {owner && <span>{owner}</span>}
            {owner && prop && (
              <CaretRight size={9} weight="bold" />
            )}
            {prop && <span>{prop.address_line1}</span>}
          </div>
        )}
      </div>

      {/* Right */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
        }}
      >
        {task.priority !== "medium" && <PriorityBadge priority={task.priority} />}
        {dueDateStr && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              padding: "2px 7px",
              borderRadius: 6,
              backgroundColor: dueDateStyle.bg,
              color: dueDateStyle.color,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <CalendarBlank size={10} weight="bold" />
            {dueDateStr}
          </span>
        )}
        {task.assignees.length > 0 && (
          <div style={{ display: "flex", marginLeft: 4 }}>
            {task.assignees.slice(0, 3).map((a, i) => (
              <div
                key={a.profile_id}
                style={{ marginLeft: i === 0 ? 0 : -6, zIndex: 3 - i }}
              >
                <Avatar name={a.name} avatarUrl={a.avatar_url} size={22} />
              </div>
            ))}
            {task.assignees.length > 3 && (
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  backgroundColor: "var(--color-warm-gray-200)",
                  color: "var(--color-text-tertiary)",
                  fontSize: 9,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: -6,
                }}
              >
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Task Card (Board view) ───────────────────────────────────────────────────

function TaskCard({
  task,
  owners,
  properties,
  onClick,
}: {
  task: TaskWithRelations;
  owners: OwnerProfile[];
  properties: PropertyOption[];
  onClick: () => void;
}) {
  const prioColor = priorityColor(task.priority);
  const owner = ownerLabel(task.owner_id, owners);
  const prop = properties.find((p) => p.id === task.property_id);
  const dueDateStr = formatDueDate(task.due_date);
  const dueDateStyle = dueDateChipStyle(task.due_date);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      style={{
        backgroundColor: "var(--color-white)",
        border: "1px solid var(--color-warm-gray-200)",
        borderRadius: 10,
        padding: "12px 12px 12px 14px",
        cursor: "pointer",
        display: "flex",
        transition: "box-shadow 120ms, transform 120ms",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
    >
      {/* Priority strip */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          backgroundColor: prioColor,
          borderRadius: "10px 0 0 10px",
        }}
      />

      <div style={{ flex: 1, minWidth: 0, paddingLeft: 4 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              color: statusColor(task.status),
              opacity: 0.7,
              flexShrink: 0,
              marginTop: 1,
            }}
          >
            <TypeIcon type={task.task_type} size={13} color={statusColor(task.status)} />
          </div>
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color:
                task.status === "cancelled"
                  ? "var(--color-text-tertiary)"
                  : "var(--color-text-primary)",
              textDecoration:
                task.status === "cancelled" ? "line-through" : "none",
              lineHeight: 1.4,
              flex: 1,
              margin: 0,
            }}
          >
            {task.title}
          </p>
        </div>

        {(owner || prop) && (
          <div
            style={{
              fontSize: 11,
              color: "var(--color-text-tertiary)",
              marginBottom: 8,
              display: "flex",
              gap: 4,
            }}
          >
            {owner}
            {owner && prop && <span>·</span>}
            {prop && prop.address_line1}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {task.labels.slice(0, 2).map((l) => (
              <span
                key={l.id}
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: "1px 6px",
                  borderRadius: 999,
                  backgroundColor: `${l.color}18`,
                  color: l.color,
                }}
              >
                {l.name}
              </span>
            ))}
            {dueDateStr && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  padding: "1px 6px",
                  borderRadius: 6,
                  backgroundColor: dueDateStyle.bg,
                  color: dueDateStyle.color,
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <CalendarBlank size={9} weight="bold" />
                {dueDateStr}
              </span>
            )}
          </div>

          {task.assignees.length > 0 && (
            <div style={{ display: "flex" }}>
              {task.assignees.slice(0, 2).map((a, i) => (
                <div
                  key={a.profile_id}
                  style={{ marginLeft: i === 0 ? 0 : -5 }}
                >
                  <Avatar name={a.name} avatarUrl={a.avatar_url} size={20} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────

function ListView({
  tasks,
  owners,
  properties,
  onTaskClick,
}: {
  tasks: TaskWithRelations[];
  owners: OwnerProfile[];
  properties: PropertyOption[];
  onTaskClick: (task: TaskWithRelations) => void;
}) {
  const grouped = STATUSES.map((s) => ({
    status: s,
    tasks: tasks.filter((t) => t.status === s.value),
  })).filter((g) => g.tasks.length > 0);

  if (tasks.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px 24px",
          color: "var(--color-text-tertiary)",
          fontSize: 14,
        }}
      >
        No tasks match the current filters.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {grouped.map(({ status, tasks: groupTasks }) => (
        <section key={status.value}>
          {/* Section label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
              paddingLeft: 14,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: status.color,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: status.color,
              }}
            >
              {status.label}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "0 6px",
                borderRadius: 999,
                backgroundColor: `${status.color}14`,
                color: status.color,
              }}
            >
              {groupTasks.length}
            </span>
          </div>

          {/* Task rows */}
          <div
            style={{
              backgroundColor: "var(--color-white)",
              border: "1px solid var(--color-warm-gray-200)",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {groupTasks.map((task, i) => (
              <div
                key={task.id}
                style={{
                  borderTop:
                    i > 0 ? "1px solid var(--color-warm-gray-200)" : "none",
                }}
              >
                <TaskRow
                  task={task}
                  owners={owners}
                  properties={properties}
                  onClick={() => onTaskClick(task)}
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// ─── Board view ───────────────────────────────────────────────────────────────

// ─── Draggable card wrapper ───────────────────────────────────────────────────

function DraggableCard({
  task,
  owners,
  properties,
  onClick,
  isDragging,
}: {
  task: TaskWithRelations;
  owners: OwnerProfile[];
  properties: PropertyOption[];
  onClick: () => void;
  isDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    data: { task },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
        cursor: "grab",
        touchAction: "none",
      }}
    >
      <TaskCard
        task={task}
        owners={owners}
        properties={properties}
        onClick={onClick}
      />
    </div>
  );
}

// ─── Droppable column wrapper ─────────────────────────────────────────────────

function DroppableColumn({
  statusValue,
  isOver,
  children,
}: {
  statusValue: string;
  isOver: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id: statusValue });

  return (
    <div
      ref={setNodeRef}
      style={{
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        flex: 1,
        overflowY: "auto",
        minHeight: 80,
        transition: "background-color 150ms",
        backgroundColor: isOver ? "rgba(2,170,235,0.06)" : "transparent",
        borderRadius: "0 0 12px 12px",
      }}
    >
      {children}
    </div>
  );
}

// ─── Column label (inline rename) ─────────────────────────────────────────────

const BOARD_LABELS_KEY = "parcel_board_col_labels";

function loadStoredLabels(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(BOARD_LABELS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function ColumnLabel({
  statusValue,
  defaultLabel,
  color,
}: {
  statusValue: string;
  defaultLabel: string;
  color: string;
}) {
  const [storedLabels, setStoredLabels] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStoredLabels(loadStoredLabels());
  }, []);

  const displayLabel = storedLabels[statusValue] ?? defaultLabel;

  function startEdit() {
    setDraft(displayLabel);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== displayLabel) {
      const next = { ...storedLabels, [statusValue]: trimmed };
      setStoredLabels(next);
      localStorage.setItem(BOARD_LABELS_KEY, JSON.stringify(next));
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--color-text-primary)",
          background: "transparent",
          border: "none",
          outline: "none",
          borderBottom: `1px solid ${color}`,
          width: 100,
          padding: "0 2px",
        }}
        autoFocus
      />
    );
  }

  return (
    <button
      type="button"
      title="Double-click to rename"
      onDoubleClick={startEdit}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        background: "none",
        border: "none",
        padding: 0,
        cursor: "default",
        fontFamily: "inherit",
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--color-text-primary)",
        }}
      >
        {displayLabel}
      </span>
      <span
        className="col-rename-hint"
        style={{
          opacity: 0,
          color: "var(--color-text-tertiary)",
          transition: "opacity 120ms",
        }}
      >
        <PencilSimple size={10} weight="duotone" />
      </span>
      <style>{`.col-rename-hint { opacity: 0 } button:hover .col-rename-hint { opacity: 1 }`}</style>
    </button>
  );
}

// ─── BoardView ────────────────────────────────────────────────────────────────

function BoardView({
  tasks,
  owners,
  properties,
  onTaskClick,
  onAddTask,
  onStatusChange,
}: {
  tasks: TaskWithRelations[];
  owners: OwnerProfile[];
  properties: PropertyOption[];
  onTaskClick: (task: TaskWithRelations) => void;
  onAddTask: (status: string) => void;
  onStatusChange: (taskId: string, newStatus: string) => void;
}) {
  const boardStatuses = STATUSES.filter((s) => s.value !== "cancelled");
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  }

  function handleDragOver(event: { over: { id: string | number } | null }) {
    setOverColumn(event.over ? String(event.over.id) : null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    setOverColumn(null);
    const { active, over } = event;
    if (!over) return;
    const targetStatus = String(over.id);
    const task = tasks.find((t) => t.id === active.id);
    if (!task || task.status === targetStatus) return;
    onStatusChange(String(active.id), targetStatus);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          overflowY: "hidden",
          height: "calc(100vh - 230px)",
          paddingBottom: 16,
          alignItems: "stretch",
        }}
      >
        {boardStatuses.map((s) => {
          const colTasks = tasks.filter((t) => t.status === s.value);
          const isOver = overColumn === s.value;
          return (
            <div
              key={s.value}
              style={{
                flexShrink: 0,
                width: 270,
                backgroundColor: "var(--color-warm-gray-100)",
                borderRadius: 12,
                border: isOver
                  ? "1px solid var(--color-brand)"
                  : "1px solid var(--color-warm-gray-200)",
                display: "flex",
                flexDirection: "column",
                transition: "border-color 150ms",
              }}
            >
              {/* Column header */}
              <div
                style={{
                  padding: "12px 14px 10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid var(--color-warm-gray-200)",
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: s.color,
                      flexShrink: 0,
                    }}
                  />
                  <ColumnLabel
                    statusValue={s.value}
                    defaultLabel={s.label}
                    color={s.color}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "0 5px",
                      borderRadius: 999,
                      backgroundColor: `${s.color}20`,
                      color: s.color,
                    }}
                  >
                    {colTasks.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onAddTask(s.value)}
                  title={`Add task`}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    border: "1px solid var(--color-warm-gray-200)",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-text-tertiary)",
                  }}
                >
                  <Plus size={12} weight="bold" />
                </button>
              </div>

              {/* Droppable card area */}
              <DroppableColumn statusValue={s.value} isOver={isOver}>
                {colTasks.map((task) => (
                  <DraggableCard
                    key={task.id}
                    task={task}
                    owners={owners}
                    properties={properties}
                    onClick={() => onTaskClick(task)}
                    isDragging={activeTask?.id === task.id}
                  />
                ))}
                {colTasks.length === 0 && !isOver && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--color-text-tertiary)",
                      textAlign: "center",
                      padding: "20px 0",
                    }}
                  >
                    No tasks
                  </div>
                )}
              </DroppableColumn>
            </div>
          );
        })}
      </div>

      {/* Drag overlay — ghost card while dragging */}
      <DragOverlay>
        {activeTask ? (
          <div style={{ transform: "rotate(2deg)", opacity: 0.95 }}>
            <TaskCard
              task={activeTask}
              owners={owners}
              properties={properties}
              onClick={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

type Filters = {
  status: string;
  type: string;
  ownerId: string;
  due: string;
};

const filterSelectStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid var(--color-warm-gray-200)",
  backgroundColor: "var(--color-white)",
  color: "var(--color-text-primary)",
  outline: "none",
  fontFamily: "inherit",
  cursor: "pointer",
};

function FilterBar({
  filters,
  owners,
  onChange,
}: {
  filters: Filters;
  owners: OwnerProfile[];
  onChange: (f: Filters) => void;
}) {
  const set = (key: keyof Filters, value: string) =>
    onChange({ ...filters, [key]: value });

  const hasFilters = filters.status || filters.type || filters.ownerId || filters.due;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      <select
        value={filters.status}
        onChange={(e) => set("status", e.target.value)}
        style={filterSelectStyle}
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <select
        value={filters.type}
        onChange={(e) => set("type", e.target.value)}
        style={filterSelectStyle}
      >
        <option value="">All types</option>
        {TASK_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      {owners.length > 0 && (
        <select
          value={filters.ownerId}
          onChange={(e) => set("ownerId", e.target.value)}
          style={filterSelectStyle}
        >
          <option value="">All owners</option>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>
              {o.full_name ?? o.email}
            </option>
          ))}
        </select>
      )}

      <select
        value={filters.due}
        onChange={(e) => set("due", e.target.value)}
        style={filterSelectStyle}
      >
        <option value="">Any due date</option>
        <option value="overdue">Overdue</option>
        <option value="today">Due today</option>
        <option value="this_week">Due this week</option>
      </select>

      {hasFilters && (
        <button
          type="button"
          onClick={() =>
            onChange({ status: "", type: "", ownerId: "", due: "" })
          }
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid var(--color-warm-gray-200)",
            backgroundColor: "transparent",
            color: "var(--color-text-secondary)",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          <X size={11} weight="bold" />
          Clear
        </button>
      )}
    </div>
  );
}

// ─── Main shell ───────────────────────────────────────────────────────────────

export function AdminTasksShell({
  tasks: initialTasks,
  owners,
  properties,
  labels,
  templates,
  allProfiles,
}: Props) {
  const [view, setView] = useState<"list" | "board">("list");
  const [filters, setFilters] = useState<Filters>({
    status: "",
    type: "",
    ownerId: "",
    due: "",
  });
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(
    null,
  );
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskDefaultStatus, setNewTaskDefaultStatus] = useState("todo");
  const [tasks, setTasks] = useState(initialTasks);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const filteredTasks = tasks.filter((t) => {
    if (filters.status && t.status !== filters.status) return false;
    if (filters.type && t.task_type !== filters.type) return false;
    if (filters.ownerId && t.owner_id !== filters.ownerId) return false;
    if (filters.due) {
      if (!t.due_date) return false;
      const d = parseISO(t.due_date);
      if (filters.due === "overdue" && !(isPast(d) && !isToday(d))) return false;
      if (filters.due === "today" && !isToday(d)) return false;
      if (
        filters.due === "this_week" &&
        !isThisWeek(d, { weekStartsOn: 1 })
      )
        return false;
    }
    return true;
  });

  const handleTaskDeleted = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSelectedTask(null);
  }, []);

  const handleAddFromBoard = (status: string) => {
    setNewTaskDefaultStatus(status);
    setShowNewTask(true);
  };

  const [, startStatusTransition] = useTransition();
  const handleStatusChange = useCallback(
    (taskId: string, newStatus: string) => {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
      );
      startStatusTransition(async () => {
        const result = await updateTask(taskId, { status: newStatus });
        if (result.error) {
          // Rollback on failure
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? { ...t, status: tasks.find((x) => x.id === taskId)?.status ?? t.status }
                : t,
            ),
          );
        }
      });
    },
    [tasks],
  );

  return (
    <div
      style={{
        padding: "32px 40px 24px",
      }}
    >
      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "var(--color-text-primary)",
              margin: 0,
            }}
          >
            Tasks
          </h1>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 999,
              backgroundColor: "var(--color-warm-gray-200)",
              color: "var(--color-text-secondary)",
            }}
          >
            {tasks.length}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* View toggle */}
          <div
            style={{
              display: "flex",
              padding: 3,
              borderRadius: 10,
              backgroundColor: "var(--color-warm-gray-100)",
              border: "1px solid var(--color-warm-gray-200)",
            }}
          >
            <button
              type="button"
              onClick={() => setView("list")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 10px",
                borderRadius: 7,
                border: "none",
                backgroundColor:
                  view === "list" ? "var(--color-white)" : "transparent",
                color:
                  view === "list"
                    ? "var(--color-text-primary)"
                    : "var(--color-text-tertiary)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: view === "list" ? "var(--shadow-sm)" : "none",
                transition: "background-color 120ms",
              }}
            >
              <Rows size={13} weight={view === "list" ? "fill" : "regular"} />
              List
            </button>
            <button
              type="button"
              onClick={() => setView("board")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 10px",
                borderRadius: 7,
                border: "none",
                backgroundColor:
                  view === "board" ? "var(--color-white)" : "transparent",
                color:
                  view === "board"
                    ? "var(--color-text-primary)"
                    : "var(--color-text-tertiary)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: view === "board" ? "var(--shadow-sm)" : "none",
                transition: "background-color 120ms",
              }}
            >
              <SquaresFour
                size={13}
                weight={view === "board" ? "fill" : "regular"}
              />
              Board
            </button>
          </div>

          {/* New task button */}
          <button
            type="button"
            onClick={() => {
              setNewTaskDefaultStatus("todo");
              setShowNewTask(true);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 10,
              border: "none",
              backgroundColor: "var(--color-navy)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Plus size={14} weight="bold" />
            New Task
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ marginBottom: 20 }}>
        <FilterBar filters={filters} owners={owners} onChange={setFilters} />
      </div>

      {/* Content */}
      {view === "list" ? (
        <ListView
          tasks={filteredTasks}
          owners={owners}
          properties={properties}
          onTaskClick={setSelectedTask}
        />
      ) : (
        <BoardView
          tasks={filteredTasks}
          owners={owners}
          properties={properties}
          onTaskClick={setSelectedTask}
          onAddTask={handleAddFromBoard}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Task drawer */}
      <AnimatePresence>
        {selectedTask && (
          <TaskDrawer
            task={selectedTask}
            owners={owners}
            properties={properties}
            labels={labels}
            allProfiles={allProfiles}
            onClose={() => setSelectedTask(null)}
            onDeleted={handleTaskDeleted}
          />
        )}
      </AnimatePresence>

      {/* New task drawer */}
      <AnimatePresence>
        {showNewTask && (
          <NewTaskDrawer
            owners={owners}
            properties={properties}
            labels={labels}
            templates={templates}
            defaultStatus={newTaskDefaultStatus}
            onClose={() => setShowNewTask(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
