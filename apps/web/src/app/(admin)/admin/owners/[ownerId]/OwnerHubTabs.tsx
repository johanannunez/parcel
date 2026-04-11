"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTransition, useRef, useState } from "react";
import {
  House,
  ChartBar,
  ListChecks,
  ClockCounterClockwise,
  NotePencil,
  FileText,
  CurrencyDollar,
  Buildings,
  Lightning,
  EnvelopeSimple,
  CalendarCheck,
  LockSimple,
  Eye,
  Plus,
  Check,
  Circle,
  Trash,
  CaretRight,
  Warning,
  ArrowsClockwise,
  Receipt as ReceiptIcon,
  Invoice,
  ChartLineUp,
  Scales,
  DownloadSimple,
  Sparkle,
  Image as ImageIcon,
} from "@phosphor-icons/react";
import {
  createOwnerTask,
  toggleTaskStatus,
  deleteTask,
  createOwnerNote,
  toggleNoteVisibility,
  deleteNote,
  addTimelineEntry,
} from "./hub-actions";
import {
  createReceipt,
  deleteReceipt,
  toggleReceiptVisibility,
  exportReceiptsCSV,
} from "./financials-actions";
import { InviteOwnerButton } from "./InviteOwnerButton";

/* ─── Types ─── */

type Property = {
  id: string;
  name: string | null;
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
  active: boolean;
  hospitable_property_id: string | null;
  setup_status: string;
  created_at: string;
};

type Booking = {
  id: string;
  property_id: string;
  propertyLabel: string;
  guest_name: string | null;
  check_in: string;
  check_out: string;
  source: string;
  status: string;
  total_amount: number | null;
  currency: string;
};

type Payout = {
  id: string;
  property_id: string;
  propertyLabel: string;
  period_start: string;
  period_end: string;
  gross_revenue: number;
  fees: number;
  net_payout: number;
  paid_at: string | null;
};

type BlockRequest = {
  id: string;
  property_id: string;
  propertyLabel: string;
  start_date: string;
  end_date: string;
  note: string | null;
  status: string;
  created_at: string;
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  property_id: string | null;
  propertyLabel: string | null;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
};

type Note = {
  id: string;
  body: string;
  visibility: string;
  property_id: string | null;
  propertyLabel: string | null;
  created_by_name: string | null;
  created_at: string;
};

type TimelineEntry = {
  id: string;
  event_type: string;
  title: string;
  body: string | null;
  property_id: string | null;
  propertyLabel: string | null;
  created_at: string;
};

type Document = {
  id: string;
  title: string;
  doc_type: string;
  status: string;
  scope: string;
  file_url: string | null;
  created_at: string;
};

type Receipt = {
  id: string;
  vendor: string;
  amount: number;
  currency: string;
  category: string;
  purchase_date: string;
  image_url: string | null;
  notes: string | null;
  visibility: string;
  property_id: string | null;
  propertyLabel: string | null;
  created_at: string;
};

type OwnerInfo = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  createdAt: string;
  onboardedAt: string | null;
  isPending: boolean;
};

type OwnerHubProps = {
  activeTab: string;
  ownerId: string;
  owner: OwnerInfo;
  properties: Property[];
  bookings: Booking[];
  payouts: Payout[];
  blockRequests: BlockRequest[];
  setupData: any;
  tasks: Task[];
  notes: Note[];
  timeline: TimelineEntry[];
  documents: Document[];
  receipts: Receipt[];
};

/* ─── Section definitions ─── */

const SECTIONS = [
  { key: "overview", label: "Overview", icon: ChartBar },
  { key: "tasks", label: "Tasks", icon: ListChecks },
  { key: "timeline", label: "Timeline", icon: ClockCounterClockwise },
  { key: "notes", label: "Notes", icon: NotePencil },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "financials", label: "Financials", icon: CurrencyDollar },
  { key: "properties", label: "Properties", icon: Buildings },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

/* ─── Main component ─── */

function buildInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function OwnerHubTabs({
  activeTab,
  ownerId,
  owner,
  properties,
  bookings,
  payouts,
  blockRequests,
  setupData,
  tasks,
  notes,
  timeline,
  documents,
  receipts,
}: OwnerHubProps) {
  const searchParams = useSearchParams();
  const section = (searchParams.get("tab") as SectionKey) || activeTab || "overview";

  const pendingTaskCount = tasks.filter((t) => t.status !== "done").length;

  const memberSince = new Date(owner.createdAt).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <div
      className="flex"
      style={{
        minHeight: "calc(100vh - var(--admin-topbar-h, 0px))",
      }}
    >
      {/* ─── Left sidebar ─── */}
      <nav
        className="flex w-[240px] shrink-0 flex-col border-r"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: "var(--color-warm-gray-200)",
        }}
      >
        {/* Owner profile header */}
        <div
          className="border-b px-5 py-5"
          style={{ borderColor: "var(--color-warm-gray-200)" }}
        >
          <div className="flex items-start gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{
                background: "linear-gradient(135deg, #02aaeb, #1b77be)",
              }}
            >
              {buildInitials(owner.fullName)}
            </span>
            <div className="min-w-0 flex-1">
              <h1
                className="truncate text-[15px] font-semibold leading-tight"
                style={{ color: "var(--color-text-primary)" }}
              >
                {owner.fullName}
              </h1>
              <div
                className="mt-0.5 truncate text-[11px]"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                {owner.isPending ? "No email on file" : owner.email}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            {owner.isPending ? (
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{
                  backgroundColor: "var(--color-warm-gray-100)",
                  color: "var(--color-text-tertiary)",
                }}
              >
                Not invited
              </span>
            ) : owner.onboardedAt ? (
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{
                  backgroundColor: "rgba(22, 163, 74, 0.12)",
                  color: "#15803d",
                }}
              >
                Onboarded
              </span>
            ) : (
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.14)",
                  color: "#b45309",
                }}
              >
                Setting up
              </span>
            )}
            <span
              className="text-[10px]"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Since {memberSince}
            </span>
          </div>
        </div>

        {/* Section nav */}
        <div className="flex flex-1 flex-col gap-0.5 p-2">
          {SECTIONS.map((s) => {
            const active = section === s.key;
            const Icon = s.icon;
            const badge =
              s.key === "tasks"
                ? pendingTaskCount
                : s.key === "notes"
                  ? notes.length
                  : null;

            return (
              <Link
                key={s.key}
                href={`/admin/owners/${ownerId}?tab=${s.key}`}
                scroll={false}
                className="group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150"
                style={{
                  color: active
                    ? "var(--color-brand)"
                    : "var(--color-text-secondary)",
                  backgroundColor: active
                    ? "var(--color-warm-gray-100)"
                    : "transparent",
                }}
              >
                {active && (
                  <span
                    className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full"
                    style={{ backgroundColor: "var(--color-brand)" }}
                  />
                )}
                <Icon
                  size={16}
                  weight={active ? "fill" : "regular"}
                  style={{
                    color: active
                      ? "var(--color-brand)"
                      : "var(--color-text-tertiary)",
                  }}
                />
                <span className="flex-1">{s.label}</span>
                {badge != null && badge > 0 && (
                  <span
                    className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold"
                    style={{
                      backgroundColor: active
                        ? "rgba(27, 119, 190, 0.15)"
                        : "var(--color-warm-gray-100)",
                      color: active
                        ? "var(--color-brand)"
                        : "var(--color-text-tertiary)",
                    }}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom actions */}
        {owner.isPending && (
          <div
            className="border-t px-3 py-3"
            style={{ borderColor: "var(--color-warm-gray-200)" }}
          >
            <InviteOwnerButton ownerId={ownerId} ownerName={owner.fullName} />
          </div>
        )}
      </nav>

      {/* ─── Right content area ─── */}
      <div
        className="min-w-0 flex-1 overflow-y-auto"
        style={{ backgroundColor: "var(--color-off-white)" }}
      >
        <div className="px-8 py-8">
          {section === "overview" && (
            <OverviewSection
              properties={properties}
              bookings={bookings}
              payouts={payouts}
              tasks={tasks}
              timeline={timeline}
              ownerId={ownerId}
            />
          )}
          {section === "tasks" && (
            <TasksSection
              tasks={tasks}
              properties={properties}
              ownerId={ownerId}
            />
          )}
          {section === "timeline" && (
            <TimelineSection
              timeline={timeline}
              properties={properties}
              ownerId={ownerId}
            />
          )}
          {section === "notes" && (
            <NotesSection
              notes={notes}
              properties={properties}
              ownerId={ownerId}
            />
          )}
          {section === "documents" && <DocumentsSection documents={documents} />}
          {section === "properties" && (
            <PropertiesSection properties={properties} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   OVERVIEW
   ═══════════════════════════════════════════════════════════════════════════ */

function OverviewSection({
  properties,
  bookings,
  payouts,
  tasks,
  timeline,
  ownerId,
}: {
  properties: Property[];
  bookings: Booking[];
  payouts: Payout[];
  tasks: Task[];
  timeline: TimelineEntry[];
  ownerId: string;
}) {
  const upcomingBookings = bookings.filter(
    (b) => new Date(b.check_in) >= new Date(),
  ).length;
  const totalRevenue = payouts.reduce((sum, p) => sum + p.gross_revenue, 0);
  const pendingTasks = tasks.filter((t) => t.status !== "done").length;
  const lastPayout = payouts.find((p) => p.paid_at);

  const stats = [
    { label: "Properties", value: String(properties.length) },
    { label: "Upcoming bookings", value: String(upcomingBookings) },
    {
      label: "Total revenue",
      value: totalRevenue > 0 ? `$${totalRevenue.toLocaleString()}` : "$0",
    },
    { label: "Pending tasks", value: String(pendingTasks) },
  ];

  const recentTasks = tasks.filter((t) => t.status !== "done").slice(0, 3);
  const recentTimeline = timeline.slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeading>Overview</SectionHeading>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} />
        ))}
      </div>

      {/* Two-column: recent tasks + recent timeline */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Recent tasks</CardTitle>
            <Link
              href={`/admin/owners/${ownerId}?tab=tasks`}
              className="flex items-center gap-0.5 text-xs font-medium transition-colors duration-150"
              style={{ color: "var(--color-brand)" }}
            >
              View all <CaretRight size={12} weight="bold" />
            </Link>
          </CardHeader>
          {recentTasks.length === 0 ? (
            <EmptyState message="No pending tasks." />
          ) : (
            <div className="flex flex-col gap-2">
              {recentTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                  style={{ backgroundColor: "var(--color-warm-gray-50)" }}
                >
                  <Circle
                    size={14}
                    weight="regular"
                    style={{ color: "var(--color-text-tertiary)", flexShrink: 0 }}
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-sm font-medium"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {t.title}
                    </div>
                    {t.propertyLabel && (
                      <div
                        className="mt-0.5 truncate text-xs"
                        style={{ color: "var(--color-text-tertiary)" }}
                      >
                        {t.propertyLabel}
                      </div>
                    )}
                  </div>
                  <PriorityChip priority={t.priority} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <Link
              href={`/admin/owners/${ownerId}?tab=timeline`}
              className="flex items-center gap-0.5 text-xs font-medium transition-colors duration-150"
              style={{ color: "var(--color-brand)" }}
            >
              View all <CaretRight size={12} weight="bold" />
            </Link>
          </CardHeader>
          {recentTimeline.length === 0 ? (
            <EmptyState message="No activity recorded yet." />
          ) : (
            <div className="flex flex-col gap-2">
              {recentTimeline.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 rounded-lg px-3 py-2.5"
                  style={{ backgroundColor: "var(--color-warm-gray-50)" }}
                >
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: "var(--color-warm-gray-100)" }}
                  >
                    <TimelineIcon eventType={entry.event_type} size={12} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-sm font-medium"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {entry.title}
                    </div>
                    <div
                      className="mt-0.5 text-xs"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      {formatRelativeTime(entry.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Properties summary */}
      {properties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Properties</CardTitle>
            <Link
              href={`/admin/owners/${ownerId}?tab=properties`}
              className="flex items-center gap-0.5 text-xs font-medium transition-colors duration-150"
              style={{ color: "var(--color-brand)" }}
            >
              View all <CaretRight size={12} weight="bold" />
            </Link>
          </CardHeader>
          <div className="flex flex-col gap-2">
            {properties.slice(0, 3).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg px-3 py-2.5"
                style={{ backgroundColor: "var(--color-warm-gray-50)" }}
              >
                <div className="min-w-0">
                  <div
                    className="truncate text-sm font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {p.name?.trim() || p.address_line1}
                  </div>
                  <div
                    className="mt-0.5 text-xs"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    {p.city}, {p.state}
                  </div>
                </div>
                <StatusBadge status={p.active ? "active" : "inactive"} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TASKS
   ═══════════════════════════════════════════════════════════════════════════ */

function TasksSection({
  tasks,
  properties,
  ownerId,
}: {
  tasks: Task[];
  properties: Property[];
  ownerId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const pendingTasks = tasks.filter((t) => t.status !== "done");
  const doneTasks = tasks.filter((t) => t.status === "done");

  function handleCreateTask(formData: FormData) {
    const title = formData.get("title") as string;
    if (!title.trim()) return;

    startTransition(async () => {
      const result = await createOwnerTask(ownerId, {
        title: title.trim(),
        propertyId: (formData.get("propertyId") as string) || undefined,
        priority: (formData.get("priority") as string) || "medium",
        dueDate: (formData.get("dueDate") as string) || undefined,
      });
      if (result.ok) {
        formRef.current?.reset();
        setShowForm(false);
      }
    });
  }

  function handleToggle(taskId: string) {
    startTransition(async () => {
      await toggleTaskStatus(taskId, ownerId);
    });
  }

  function handleDelete(taskId: string) {
    startTransition(async () => {
      await deleteTask(taskId, ownerId);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <SectionHeading>Tasks</SectionHeading>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-150"
            style={{ backgroundColor: "var(--color-brand)" }}
          >
            <Plus size={13} weight="bold" />
            Add task
          </button>
        )}
      </div>

      {/* Add task form */}
      {showForm && (
        <Card>
          <form ref={formRef} action={handleCreateTask}>
            <div className="flex flex-col gap-3">
              <input
                name="title"
                type="text"
                placeholder="Task title"
                required
                autoFocus
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors duration-150"
                style={{
                  borderColor: "var(--color-warm-gray-200)",
                  backgroundColor: "var(--color-white)",
                  color: "var(--color-text-primary)",
                }}
              />
              <div className="flex flex-wrap gap-3">
                <select
                  name="propertyId"
                  className="rounded-lg border px-3 py-1.5 text-xs outline-none"
                  style={{
                    borderColor: "var(--color-warm-gray-200)",
                    backgroundColor: "var(--color-white)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  <option value="">No property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name?.trim() || p.address_line1}
                    </option>
                  ))}
                </select>
                <select
                  name="priority"
                  defaultValue="medium"
                  className="rounded-lg border px-3 py-1.5 text-xs outline-none"
                  style={{
                    borderColor: "var(--color-warm-gray-200)",
                    backgroundColor: "var(--color-white)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <input
                  name="dueDate"
                  type="date"
                  className="rounded-lg border px-3 py-1.5 text-xs outline-none"
                  style={{
                    borderColor: "var(--color-warm-gray-200)",
                    backgroundColor: "var(--color-white)",
                    color: "var(--color-text-secondary)",
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition-opacity duration-150 disabled:opacity-50"
                  style={{ backgroundColor: "var(--color-brand)" }}
                >
                  {isPending ? "Saving..." : "Save task"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg px-4 py-1.5 text-xs font-medium transition-colors duration-150"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </Card>
      )}

      {/* Pending tasks */}
      {pendingTasks.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <SectionLabel>Pending ({pendingTasks.length})</SectionLabel>
          {pendingTasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              onToggle={handleToggle}
              onDelete={handleDelete}
              isPending={isPending}
            />
          ))}
        </div>
      )}

      {/* Done tasks */}
      {doneTasks.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <SectionLabel>Completed ({doneTasks.length})</SectionLabel>
          {doneTasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              onToggle={handleToggle}
              onDelete={handleDelete}
              isPending={isPending}
            />
          ))}
        </div>
      )}

      {tasks.length === 0 && !showForm && (
        <EmptyState message="No tasks yet. Add one to get started." />
      )}
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
  onDelete,
  isPending,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
}) {
  const isDone = task.status === "done";

  return (
    <div
      className="group flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors duration-150"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
        opacity: isDone ? 0.65 : 1,
      }}
    >
      <button
        onClick={() => onToggle(task.id)}
        disabled={isPending}
        className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150 disabled:opacity-40"
        style={{
          borderColor: isDone ? "#16a34a" : "var(--color-warm-gray-200)",
          backgroundColor: isDone ? "#16a34a" : "transparent",
        }}
        title={isDone ? "Reopen task" : "Complete task"}
      >
        {isDone && <Check size={10} weight="bold" color="white" />}
      </button>
      <div className="min-w-0 flex-1">
        <div
          className="text-sm font-medium"
          style={{
            color: "var(--color-text-primary)",
            textDecoration: isDone ? "line-through" : "none",
          }}
        >
          {task.title}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          {task.propertyLabel && (
            <span
              className="text-xs"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {task.propertyLabel}
            </span>
          )}
          {task.due_date && (
            <span
              className="text-xs"
              style={{
                color: isOverdue(task.due_date) && !isDone
                  ? "#dc2626"
                  : "var(--color-text-tertiary)",
              }}
            >
              Due {formatDate(task.due_date)}
            </span>
          )}
        </div>
      </div>
      <PriorityChip priority={task.priority} />
      <button
        onClick={() => onDelete(task.id)}
        disabled={isPending}
        className="opacity-0 transition-opacity duration-150 group-hover:opacity-100 disabled:opacity-30"
        title="Delete task"
      >
        <Trash size={14} style={{ color: "var(--color-text-tertiary)" }} />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TIMELINE
   ═══════════════════════════════════════════════════════════════════════════ */

function TimelineSection({
  timeline,
  properties,
  ownerId,
}: {
  timeline: TimelineEntry[];
  properties: Property[];
  ownerId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleAddEntry(formData: FormData) {
    const title = formData.get("title") as string;
    if (!title.trim()) return;

    startTransition(async () => {
      const result = await addTimelineEntry(ownerId, {
        eventType: (formData.get("eventType") as string) || "note",
        title: title.trim(),
        body: (formData.get("body") as string) || undefined,
        propertyId: (formData.get("propertyId") as string) || undefined,
      });
      if (result.ok) {
        formRef.current?.reset();
        setShowForm(false);
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <SectionHeading>Timeline</SectionHeading>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-150"
            style={{ backgroundColor: "var(--color-brand)" }}
          >
            <Plus size={13} weight="bold" />
            Add entry
          </button>
        )}
      </div>

      {/* Add entry form */}
      {showForm && (
        <Card>
          <form ref={formRef} action={handleAddEntry}>
            <div className="flex flex-col gap-3">
              <input
                name="title"
                type="text"
                placeholder="Entry title"
                required
                autoFocus
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors duration-150"
                style={{
                  borderColor: "var(--color-warm-gray-200)",
                  backgroundColor: "var(--color-white)",
                  color: "var(--color-text-primary)",
                }}
              />
              <textarea
                name="body"
                placeholder="Details (optional)"
                rows={2}
                className="w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none transition-colors duration-150"
                style={{
                  borderColor: "var(--color-warm-gray-200)",
                  backgroundColor: "var(--color-white)",
                  color: "var(--color-text-primary)",
                }}
              />
              <div className="flex flex-wrap gap-3">
                <select
                  name="eventType"
                  defaultValue="note"
                  className="rounded-lg border px-3 py-1.5 text-xs outline-none"
                  style={{
                    borderColor: "var(--color-warm-gray-200)",
                    backgroundColor: "var(--color-white)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  <option value="note">Note</option>
                  <option value="email">Email</option>
                  <option value="event">Event</option>
                  <option value="task">Task</option>
                  <option value="document">Document</option>
                  <option value="system">System</option>
                </select>
                <select
                  name="propertyId"
                  className="rounded-lg border px-3 py-1.5 text-xs outline-none"
                  style={{
                    borderColor: "var(--color-warm-gray-200)",
                    backgroundColor: "var(--color-white)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  <option value="">No property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name?.trim() || p.address_line1}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition-opacity duration-150 disabled:opacity-50"
                  style={{ backgroundColor: "var(--color-brand)" }}
                >
                  {isPending ? "Saving..." : "Save entry"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg px-4 py-1.5 text-xs font-medium transition-colors duration-150"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </Card>
      )}

      {/* Timeline feed */}
      {timeline.length === 0 ? (
        <EmptyState message="No activity recorded yet." />
      ) : (
        <div className="relative flex flex-col gap-0">
          {/* Vertical line */}
          <div
            className="absolute left-[19px] top-4 bottom-4 w-px"
            style={{ backgroundColor: "var(--color-warm-gray-200)" }}
          />
          {timeline.map((entry, i) => (
            <div key={entry.id} className="relative flex items-start gap-4 py-3">
              {/* Icon circle */}
              <span
                className="relative z-10 flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border"
                style={{
                  backgroundColor: "var(--color-white)",
                  borderColor: "var(--color-warm-gray-200)",
                }}
              >
                <TimelineIcon eventType={entry.event_type} size={16} />
              </span>
              {/* Content */}
              <div className="min-w-0 flex-1 pt-1.5">
                <div
                  className="text-sm font-medium"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {entry.title}
                </div>
                {entry.body && (
                  <div
                    className="mt-1 text-sm leading-relaxed"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {entry.body}
                  </div>
                )}
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className="text-xs"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    {formatRelativeTime(entry.created_at)}
                  </span>
                  {entry.propertyLabel && (
                    <>
                      <span
                        className="text-xs"
                        style={{ color: "var(--color-warm-gray-200)" }}
                      >
                        ·
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "var(--color-text-tertiary)" }}
                      >
                        {entry.propertyLabel}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   NOTES
   ═══════════════════════════════════════════════════════════════════════════ */

function NotesSection({
  notes,
  properties,
  ownerId,
}: {
  notes: Note[];
  properties: Property[];
  ownerId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [formVisibility, setFormVisibility] = useState<"private" | "visible">(
    "private",
  );

  function handleCreateNote(formData: FormData) {
    const body = formData.get("body") as string;
    if (!body.trim()) return;

    startTransition(async () => {
      const result = await createOwnerNote(ownerId, {
        body: body.trim(),
        visibility: formVisibility,
        propertyId: (formData.get("propertyId") as string) || undefined,
      });
      if (result.ok) {
        formRef.current?.reset();
        setFormVisibility("private");
        setShowForm(false);
      }
    });
  }

  function handleToggleVisibility(noteId: string) {
    startTransition(async () => {
      await toggleNoteVisibility(noteId, ownerId);
    });
  }

  function handleDeleteNote(noteId: string) {
    startTransition(async () => {
      await deleteNote(noteId, ownerId);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <SectionHeading>Notes</SectionHeading>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-150"
            style={{ backgroundColor: "var(--color-brand)" }}
          >
            <Plus size={13} weight="bold" />
            Add note
          </button>
        )}
      </div>

      {/* Add note form */}
      {showForm && (
        <Card>
          <form ref={formRef} action={handleCreateNote}>
            <div className="flex flex-col gap-3">
              <textarea
                name="body"
                placeholder="Write a note..."
                required
                autoFocus
                rows={3}
                className="w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none transition-colors duration-150"
                style={{
                  borderColor: "var(--color-warm-gray-200)",
                  backgroundColor: "var(--color-white)",
                  color: "var(--color-text-primary)",
                }}
              />
              <div className="flex flex-wrap items-center gap-3">
                <select
                  name="propertyId"
                  className="rounded-lg border px-3 py-1.5 text-xs outline-none"
                  style={{
                    borderColor: "var(--color-warm-gray-200)",
                    backgroundColor: "var(--color-white)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  <option value="">No property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name?.trim() || p.address_line1}
                    </option>
                  ))}
                </select>

                {/* Visibility toggle */}
                <button
                  type="button"
                  onClick={() =>
                    setFormVisibility((v) =>
                      v === "private" ? "visible" : "private",
                    )
                  }
                  className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors duration-150"
                  style={{
                    borderColor:
                      formVisibility === "private"
                        ? "rgba(245, 158, 11, 0.3)"
                        : "rgba(22, 163, 74, 0.3)",
                    backgroundColor:
                      formVisibility === "private"
                        ? "rgba(245, 158, 11, 0.06)"
                        : "rgba(22, 163, 74, 0.06)",
                    color:
                      formVisibility === "private" ? "#b45309" : "#15803d",
                  }}
                >
                  {formVisibility === "private" ? (
                    <LockSimple size={12} weight="fill" />
                  ) : (
                    <Eye size={12} weight="fill" />
                  )}
                  {formVisibility === "private"
                    ? "Private"
                    : "Visible to owner"}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition-opacity duration-150 disabled:opacity-50"
                  style={{ backgroundColor: "var(--color-brand)" }}
                >
                  {isPending ? "Saving..." : "Save note"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormVisibility("private");
                  }}
                  className="rounded-lg px-4 py-1.5 text-xs font-medium transition-colors duration-150"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </Card>
      )}

      {/* Notes list */}
      {notes.length === 0 && !showForm ? (
        <EmptyState message="No notes yet. Add one to get started." />
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map((note) => {
            const isPrivate = note.visibility === "private";
            return (
              <div
                key={note.id}
                className="group relative rounded-lg border pl-4 transition-colors duration-150"
                style={{
                  backgroundColor: "var(--color-white)",
                  borderColor: "var(--color-warm-gray-200)",
                  borderLeftWidth: "3px",
                  borderLeftColor: isPrivate
                    ? "rgba(245, 158, 11, 0.6)"
                    : "rgba(22, 163, 74, 0.6)",
                }}
              >
                <div className="px-3 py-3.5">
                  <div
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {note.body}
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    {/* Visibility badge */}
                    <button
                      onClick={() => handleToggleVisibility(note.id)}
                      disabled={isPending}
                      className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-opacity duration-150 disabled:opacity-50"
                      style={{
                        backgroundColor: isPrivate
                          ? "rgba(245, 158, 11, 0.1)"
                          : "rgba(22, 163, 74, 0.1)",
                        color: isPrivate ? "#b45309" : "#15803d",
                      }}
                      title={
                        isPrivate
                          ? "Click to make visible to owner"
                          : "Click to make private"
                      }
                    >
                      {isPrivate ? (
                        <LockSimple size={10} weight="fill" />
                      ) : (
                        <Eye size={10} weight="fill" />
                      )}
                      {isPrivate ? "Private" : "Visible"}
                    </button>
                    {note.propertyLabel && (
                      <span
                        className="text-xs"
                        style={{ color: "var(--color-text-tertiary)" }}
                      >
                        {note.propertyLabel}
                      </span>
                    )}
                    <span
                      className="text-xs"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      {note.created_by_name || "Admin"}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      {formatRelativeTime(note.created_at)}
                    </span>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      disabled={isPending}
                      className="ml-auto opacity-0 transition-opacity duration-150 group-hover:opacity-100 disabled:opacity-30"
                      title="Delete note"
                    >
                      <Trash
                        size={13}
                        style={{ color: "var(--color-text-tertiary)" }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DOCUMENTS
   ═══════════════════════════════════════════════════════════════════════════ */

function DocumentsSection({ documents }: { documents: Document[] }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <SectionHeading>Documents</SectionHeading>
        <button
          disabled
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors duration-150 disabled:opacity-50"
          style={{
            borderColor: "var(--color-warm-gray-200)",
            color: "var(--color-text-secondary)",
            backgroundColor: "var(--color-white)",
          }}
          title="Coming soon"
        >
          <Plus size={13} weight="bold" />
          Upload document
        </button>
      </div>

      {documents.length === 0 ? (
        <EmptyState message="No documents yet." />
      ) : (
        <div className="flex flex-col gap-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
              style={{
                backgroundColor: "var(--color-white)",
                borderColor: "var(--color-warm-gray-200)",
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: "var(--color-warm-gray-50)" }}
                >
                  <FileText
                    size={16}
                    style={{ color: "var(--color-text-tertiary)" }}
                  />
                </span>
                <div className="min-w-0">
                  <div
                    className="truncate text-sm font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {doc.title}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span
                      className="text-xs capitalize"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      {doc.doc_type.replace(/_/g, " ")}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      {formatDate(doc.created_at)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs capitalize"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  {doc.scope}
                </span>
                <DocStatusBadge status={doc.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BILLING
   ═══════════════════════════════════════════════════════════════════════════ */

function BillingSection() {
  const placeholderMetrics = [
    { label: "Total invoiced", value: "---" },
    { label: "Outstanding", value: "---" },
    { label: "Paid", value: "---" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SectionHeading>Billing</SectionHeading>

      {/* Placeholder metrics */}
      <div className="grid grid-cols-3 gap-3">
        {placeholderMetrics.map((m) => (
          <StatCard key={m.label} label={m.label} value={m.value} />
        ))}
      </div>

      {/* Coming soon card */}
      <Card>
        <div className="flex flex-col items-center py-8 text-center">
          <span
            className="mb-3 flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(27, 119, 190, 0.1)" }}
          >
            <CurrencyDollar
              size={20}
              weight="fill"
              style={{ color: "var(--color-brand)" }}
            />
          </span>
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Invoicing is coming soon
          </h3>
          <p
            className="mt-1.5 max-w-sm text-sm leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Billing is currently managed through HubFlo. Once invoicing is built
            into Parcel, all payment history and statements will appear here.
          </p>
          <a
            href="https://app.hubflo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 rounded-lg border px-4 py-2 text-xs font-semibold transition-colors duration-150"
            style={{
              borderColor: "var(--color-warm-gray-200)",
              color: "var(--color-brand)",
              backgroundColor: "var(--color-white)",
            }}
          >
            Open HubFlo
          </a>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PROPERTIES
   ═══════════════════════════════════════════════════════════════════════════ */

function PropertiesSection({ properties }: { properties: Property[] }) {
  if (properties.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <SectionHeading>Properties</SectionHeading>
        <EmptyState message="This owner has no properties yet." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeading>Properties</SectionHeading>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {properties.map((p) => (
          <div
            key={p.id}
            className="flex flex-col rounded-xl border p-4"
            style={{
              backgroundColor: "var(--color-white)",
              borderColor: "var(--color-warm-gray-200)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {p.name?.trim() || p.address_line1}
                </div>
                <div
                  className="mt-0.5 text-xs"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  {p.address_line1}, {p.city}, {p.state} {p.postal_code}
                </div>
              </div>
              <StatusBadge status={p.active ? "active" : "inactive"} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                style={{
                  backgroundColor:
                    p.setup_status === "complete"
                      ? "rgba(22, 163, 74, 0.12)"
                      : "var(--color-warm-gray-100)",
                  color:
                    p.setup_status === "complete"
                      ? "#15803d"
                      : "var(--color-text-tertiary)",
                }}
              >
                {p.setup_status.replace(/_/g, " ")}
              </span>
              {p.hospitable_property_id ? (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    backgroundColor: "rgba(2, 170, 235, 0.12)",
                    color: "var(--color-brand-light)",
                  }}
                >
                  Connected
                </span>
              ) : (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    backgroundColor: "var(--color-warm-gray-100)",
                    color: "var(--color-text-tertiary)",
                  }}
                >
                  Not connected
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-base font-semibold tracking-tight"
      style={{ color: "var(--color-text-primary)" }}
    >
      {children}
    </h2>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em]"
      style={{ color: "var(--color-text-tertiary)" }}
    >
      {children}
    </h3>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">{children}</div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-sm font-semibold"
      style={{ color: "var(--color-text-primary)" }}
    >
      {children}
    </h3>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
    >
      <div
        className="text-[10px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {label}
      </div>
      <div
        className="mt-1.5 text-lg font-semibold"
        style={{ color: "var(--color-text-primary)" }}
      >
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    confirmed: { bg: "rgba(22, 163, 74, 0.12)", text: "#15803d" },
    active: { bg: "rgba(22, 163, 74, 0.12)", text: "#15803d" },
    approved: { bg: "rgba(22, 163, 74, 0.12)", text: "#15803d" },
    completed: { bg: "rgba(22, 163, 74, 0.12)", text: "#15803d" },
    pending: { bg: "rgba(245, 158, 11, 0.12)", text: "#b45309" },
    cancelled: { bg: "rgba(220, 38, 38, 0.12)", text: "#dc2626" },
    declined: { bg: "rgba(220, 38, 38, 0.12)", text: "#dc2626" },
    inactive: {
      bg: "var(--color-warm-gray-100)",
      text: "var(--color-text-tertiary)",
    },
  };

  const c = colors[status] ?? {
    bg: "var(--color-warm-gray-100)",
    text: "var(--color-text-tertiary)",
  };

  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {status}
    </span>
  );
}

function DocStatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    pending: { bg: "rgba(245, 158, 11, 0.12)", text: "#b45309" },
    signed: { bg: "rgba(22, 163, 74, 0.12)", text: "#15803d" },
    uploaded: { bg: "rgba(2, 170, 235, 0.12)", text: "#0284c7" },
    expired: { bg: "rgba(220, 38, 38, 0.12)", text: "#dc2626" },
  };

  const c = colors[status] ?? {
    bg: "var(--color-warm-gray-100)",
    text: "var(--color-text-tertiary)",
  };

  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {status}
    </span>
  );
}

function PriorityChip({ priority }: { priority: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    urgent: { bg: "rgba(220, 38, 38, 0.12)", text: "#dc2626" },
    high: { bg: "rgba(245, 158, 11, 0.12)", text: "#b45309" },
    medium: { bg: "var(--color-warm-gray-100)", text: "var(--color-text-tertiary)" },
    low: { bg: "var(--color-warm-gray-50)", text: "var(--color-text-tertiary)" },
  };

  const c = colors[priority] ?? colors.medium;

  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {priority}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="rounded-xl border border-dashed p-8 text-center text-sm"
      style={{
        borderColor: "var(--color-warm-gray-200)",
        color: "var(--color-text-tertiary)",
      }}
    >
      {message}
    </div>
  );
}

function TimelineIcon({
  eventType,
  size,
}: {
  eventType: string;
  size: number;
}) {
  const iconColor = "var(--color-text-tertiary)";
  const props = { size, style: { color: iconColor } };

  switch (eventType) {
    case "system":
      return <Lightning weight="fill" {...props} />;
    case "email":
      return <EnvelopeSimple weight="fill" {...props} />;
    case "event":
      return <CalendarCheck weight="fill" {...props} />;
    case "note":
    case "note_added":
      return <NotePencil weight="fill" {...props} />;
    case "task":
    case "task_created":
    case "task_status_changed":
    case "task_deleted":
      return <ListChecks weight="fill" {...props} />;
    case "document":
      return <FileText weight="fill" {...props} />;
    default:
      return <Circle weight="fill" {...props} />;
  }
}

/* ─── Utility helpers ─── */

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDateRange(start: string, end: string) {
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(dateStr);
}

function isOverdue(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}
