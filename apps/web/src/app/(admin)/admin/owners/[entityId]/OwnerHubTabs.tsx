"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useTransition, useRef, useState } from "react";
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
  UsersThree,
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

type EntityMember = {
  id: string;
  fullName: string | null;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  onboardedAt: string | null;
  isPending: boolean;
};

type EntityInfo = {
  id: string;
  name: string;
  type: string;
  ein: string | null;
  notes: string | null;
  members: EntityMember[];
};

type OwnerHubProps = {
  activeTab: string;
  ownerId: string;
  owner: OwnerInfo;
  entity?: EntityInfo;
  properties: Property[];
  bookings: Booking[];
  payouts: Payout[];
  blockRequests: BlockRequest[];
  setupData: unknown;
  tasks: Task[];
  notes: Note[];
  timeline: TimelineEntry[];
  documents: Document[];
  receipts: Receipt[];
};

/* ─── Section definitions ─── */

const SECTIONS = [
  { key: "overview", label: "Overview", icon: ChartBar },
  { key: "members", label: "Members", icon: UsersThree },
  { key: "reserve", label: "Reserve", icon: CalendarCheck },
  { key: "tasks", label: "Tasks", icon: ListChecks },
  { key: "timeline", label: "Timeline", icon: ClockCounterClockwise },
  { key: "notes", label: "Meetings", icon: NotePencil },
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
  entity,
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
          className="flex h-[120px] flex-col justify-center border-b px-5"
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
        className="flex min-w-0 flex-1 flex-col overflow-y-auto"
        style={{ backgroundColor: "var(--color-off-white)" }}
      >
        {/* Top bar matching sidebar header height */}
        <div
          className="flex h-[120px] shrink-0 items-center justify-between border-b px-8"
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-warm-gray-200)",
          }}
        >
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {SECTIONS.find((s) => s.key === section)?.label ?? "Overview"}
            </p>
            <h2
              className="mt-1 text-xl font-semibold tracking-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              {owner.fullName}
            </h2>
          </div>
          <div
            className="flex items-center gap-3 text-xs"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {owner.phone && <span>{owner.phone}</span>}
            {!owner.isPending && <span>{owner.email}</span>}
          </div>
        </div>

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
          {section === "members" && entity && (
            <MembersSection entity={entity} />
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
          {section === "reserve" && (
            <AdminReserveSection
              blockRequests={blockRequests}
              propertyMap={new Map(properties.map((p) => [p.id, p.name?.trim() || p.address_line1 || "Property"]))}
            />
          )}
          {section === "documents" && <DocumentsSection documents={documents} />}
          {section === "financials" && (
            <FinancialsSection
              receipts={receipts}
              properties={properties}
              ownerId={ownerId}
              ownerFirstName={owner.fullName.split(" ")[0]}
            />
          )}
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
   FINANCIALS
   ═══════════════════════════════════════════════════════════════════════════ */

const RECEIPT_CATEGORIES = [
  { value: "furniture", label: "Furniture" },
  { value: "appliance", label: "Appliance" },
  { value: "decor", label: "Decor" },
  { value: "supplies", label: "Supplies" },
  { value: "repair", label: "Repair" },
  { value: "cleaning", label: "Cleaning" },
  { value: "utilities", label: "Utilities" },
  { value: "fees", label: "Fees" },
  { value: "professional_services", label: "Professional Services" },
  { value: "other", label: "Other" },
] as const;

const FINANCIALS_SUBTABS = [
  { key: "receipts", label: "Receipts", icon: ReceiptIcon },
  { key: "invoices", label: "Invoices", icon: Invoice },
  { key: "statements", label: "Statements", icon: ChartLineUp },
  { key: "tax", label: "Tax Documents", icon: Scales },
] as const;

type FinancialsSubKey = (typeof FINANCIALS_SUBTABS)[number]["key"];

function FinancialsSection({
  receipts,
  properties,
  ownerId,
  ownerFirstName,
}: {
  receipts: Receipt[];
  properties: Property[];
  ownerId: string;
  ownerFirstName: string;
}) {
  const searchParams = useSearchParams();
  const sub = (searchParams.get("sub") as FinancialsSubKey) || "receipts";

  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const ytdSpend = receipts
    .filter((r) => new Date(r.purchase_date).getFullYear() === currentYear)
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const previousYearSpend = receipts
    .filter((r) => new Date(r.purchase_date).getFullYear() === previousYear)
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const yoyChange =
    previousYearSpend > 0
      ? Math.round(((ytdSpend - previousYearSpend) / previousYearSpend) * 100)
      : null;

  const categoryTotals = new Map<string, number>();
  receipts
    .filter((r) => new Date(r.purchase_date).getFullYear() === currentYear)
    .forEach((r) => {
      categoryTotals.set(
        r.category,
        (categoryTotals.get(r.category) ?? 0) + Number(r.amount),
      );
    });
  const topCategories = [...categoryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const maxCategoryTotal = topCategories[0]?.[1] ?? 1;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeading>Financials</SectionHeading>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <StatCard label={`${currentYear} spend`} value={formatCurrency(ytdSpend)} />
        <StatCard label={`${currentYear} invoiced`} value="$0.00" />
        <StatCard label="Account balance" value="$0.00" />
      </div>

      {topCategories.length > 0 && (
        <Card>
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div
                className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                Top categories this year
              </div>
              <div className="flex flex-col gap-2">
                {topCategories.map(([category, total]) => {
                  const label =
                    RECEIPT_CATEGORIES.find((c) => c.value === category)
                      ?.label ?? category;
                  const pct = (total / maxCategoryTotal) * 100;
                  return (
                    <div key={category} className="flex items-center gap-3">
                      <div
                        className="w-32 shrink-0 text-xs font-medium"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {label}
                      </div>
                      <div
                        className="relative h-2 flex-1 overflow-hidden rounded-full"
                        style={{ backgroundColor: "var(--color-warm-gray-100)" }}
                      >
                        <div
                          className="absolute left-0 top-0 h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background:
                              "linear-gradient(90deg, #02aaeb, #1b77be)",
                          }}
                        />
                      </div>
                      <div
                        className="w-20 shrink-0 text-right text-xs font-semibold tabular-nums"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {formatCurrency(total)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {yoyChange !== null && (
              <div
                className="flex flex-col items-end border-l pl-6"
                style={{ borderColor: "var(--color-warm-gray-200)" }}
              >
                <div
                  className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  vs {previousYear}
                </div>
                <div
                  className="mt-1 text-2xl font-semibold tabular-nums"
                  style={{
                    color: yoyChange > 0 ? "#b45309" : "#15803d",
                  }}
                >
                  {yoyChange > 0 ? "+" : ""}
                  {yoyChange}%
                </div>
                <div
                  className="text-xs"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  {formatCurrency(previousYearSpend)} prev
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      <div
        className="flex gap-1 rounded-xl border p-1"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: "var(--color-warm-gray-200)",
        }}
      >
        {FINANCIALS_SUBTABS.map((s) => {
          const active = sub === s.key;
          const Icon = s.icon;
          return (
            <Link
              key={s.key}
              href={`/admin/owners/${ownerId}?tab=financials&sub=${s.key}`}
              scroll={false}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150"
              style={{
                backgroundColor: active
                  ? "var(--color-brand)"
                  : "transparent",
                color: active ? "white" : "var(--color-text-secondary)",
              }}
            >
              <Icon size={14} weight={active ? "fill" : "regular"} />
              {s.label}
            </Link>
          );
        })}
      </div>

      {sub === "receipts" && (
        <ReceiptsSubTab
          receipts={receipts}
          properties={properties}
          ownerId={ownerId}
          currentYear={currentYear}
        />
      )}
      {sub === "invoices" && <InvoicesPlaceholder ownerFirstName={ownerFirstName} />}
      {sub === "statements" && <StatementsPlaceholder ownerFirstName={ownerFirstName} />}
      {sub === "tax" && <TaxDocumentsPlaceholder ownerFirstName={ownerFirstName} />}
    </div>
  );
}

function ReceiptsSubTab({
  receipts,
  properties,
  ownerId,
  currentYear,
}: {
  receipts: Receipt[];
  properties: Property[];
  ownerId: string;
  currentYear: number;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterYear, setFilterYear] = useState<number>(currentYear);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterVisibility, setFilterVisibility] = useState<string>("");
  const [isExporting, startExport] = useTransition();

  const years = [
    ...new Set(
      receipts.map((r) => new Date(r.purchase_date).getFullYear()),
    ),
  ].sort((a, b) => b - a);
  if (!years.includes(currentYear)) years.unshift(currentYear);

  const filtered = receipts.filter((r) => {
    if (new Date(r.purchase_date).getFullYear() !== filterYear) return false;
    if (filterCategory && r.category !== filterCategory) return false;
    if (filterVisibility && r.visibility !== filterVisibility) return false;
    return true;
  });

  function handleExport() {
    startExport(async () => {
      const result = await exportReceiptsCSV(ownerId, filterYear);
      if (result.ok && result.csv) {
        const blob = new Blob([result.csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `receipts-${filterYear}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(Number(e.target.value))}
          className="rounded-lg border px-3 py-1.5 text-xs font-medium"
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-warm-gray-200)",
            color: "var(--color-text-primary)",
          }}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg border px-3 py-1.5 text-xs font-medium"
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-warm-gray-200)",
            color: "var(--color-text-primary)",
          }}
        >
          <option value="">All categories</option>
          {RECEIPT_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <select
          value={filterVisibility}
          onChange={(e) => setFilterVisibility(e.target.value)}
          className="rounded-lg border px-3 py-1.5 text-xs font-medium"
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-warm-gray-200)",
            color: "var(--color-text-primary)",
          }}
        >
          <option value="">All visibility</option>
          <option value="visible">Visible</option>
          <option value="private">Private</option>
        </select>

        <div className="flex-1" />

        <button
          onClick={handleExport}
          disabled={isExporting || filtered.length === 0}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors duration-150 disabled:opacity-50"
          style={{
            borderColor: "var(--color-warm-gray-200)",
            color: "var(--color-text-primary)",
            backgroundColor: "var(--color-white)",
          }}
        >
          <DownloadSimple size={13} weight="bold" />
          {isExporting ? "Exporting..." : `Download ${filterYear} CSV`}
        </button>

        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, #02aaeb, #1b77be)",
          }}
        >
          <Plus size={13} weight="bold" />
          Add receipt
        </button>
      </div>

      {showAddForm && (
        <AddReceiptForm
          ownerId={ownerId}
          properties={properties}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {filtered.length === 0 ? (
        <EmptyState
          message={
            receipts.length === 0
              ? "No receipts yet. Add one to start tracking expenses."
              : "No receipts match your filters."
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((r) => (
            <ReceiptRow key={r.id} receipt={r} ownerId={ownerId} />
          ))}
        </div>
      )}
    </div>
  );
}

function AddReceiptForm({
  ownerId,
  properties,
  onClose,
}: {
  ownerId: string;
  properties: Property[];
  onClose: () => void;
}) {
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("other");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [propertyId, setPropertyId] = useState("");
  const [notes, setNotes] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [visibility, setVisibility] = useState<"visible" | "private">("visible");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!vendor.trim() || !amount.trim()) {
      setError("Vendor and amount are required.");
      return;
    }
    const amt = Number(amount);
    if (Number.isNaN(amt) || amt <= 0) {
      setError("Amount must be a positive number.");
      return;
    }

    startTransition(async () => {
      const res = await createReceipt(ownerId, {
        vendor: vendor.trim(),
        amount: amt,
        category,
        purchaseDate,
        propertyId: propertyId || undefined,
        notes: notes.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        visibility,
      });
      if (res.ok) {
        onClose();
      } else {
        setError(res.message);
      }
    });
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h4
            className="text-sm font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Add receipt
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 transition-colors hover:bg-[var(--color-warm-gray-100)]"
          >
            <Trash size={14} style={{ color: "var(--color-text-tertiary)" }} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Vendor" required>
            <input
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="Wayfair, Home Depot, etc."
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{
                backgroundColor: "var(--color-white)",
                borderColor: "var(--color-warm-gray-200)",
                color: "var(--color-text-primary)",
              }}
            />
          </FormField>

          <FormField label="Amount" required>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border py-2 pl-7 pr-3 text-sm"
                style={{
                  backgroundColor: "var(--color-white)",
                  borderColor: "var(--color-warm-gray-200)",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>
          </FormField>

          <FormField label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{
                backgroundColor: "var(--color-white)",
                borderColor: "var(--color-warm-gray-200)",
                color: "var(--color-text-primary)",
              }}
            >
              {RECEIPT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Purchase date">
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{
                backgroundColor: "var(--color-white)",
                borderColor: "var(--color-warm-gray-200)",
                color: "var(--color-text-primary)",
              }}
            />
          </FormField>

          <FormField label="Property (optional)">
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{
                backgroundColor: "var(--color-white)",
                borderColor: "var(--color-warm-gray-200)",
                color: "var(--color-text-primary)",
              }}
            >
              <option value="">All properties / general</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name?.trim() || p.address_line1}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Visibility">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setVisibility("visible")}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold"
                style={{
                  backgroundColor:
                    visibility === "visible"
                      ? "rgba(22, 163, 74, 0.12)"
                      : "var(--color-white)",
                  borderColor:
                    visibility === "visible"
                      ? "#16a34a"
                      : "var(--color-warm-gray-200)",
                  color:
                    visibility === "visible"
                      ? "#15803d"
                      : "var(--color-text-secondary)",
                }}
              >
                <Eye size={13} weight="fill" />
                Visible
              </button>
              <button
                type="button"
                onClick={() => setVisibility("private")}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold"
                style={{
                  backgroundColor:
                    visibility === "private"
                      ? "rgba(245, 158, 11, 0.14)"
                      : "var(--color-white)",
                  borderColor:
                    visibility === "private"
                      ? "#f59e0b"
                      : "var(--color-warm-gray-200)",
                  color:
                    visibility === "private"
                      ? "#b45309"
                      : "var(--color-text-secondary)",
                }}
              >
                <LockSimple size={13} weight="fill" />
                Private
              </button>
            </div>
          </FormField>
        </div>

        <FormField label="Image URL (upload coming soon)">
          <div className="flex gap-2">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 rounded-lg border px-3 py-2 text-sm"
              style={{
                backgroundColor: "var(--color-white)",
                borderColor: "var(--color-warm-gray-200)",
                color: "var(--color-text-primary)",
              }}
            />
            <button
              type="button"
              disabled
              title="AI extraction coming soon"
              className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold opacity-50"
              style={{
                borderColor: "var(--color-warm-gray-200)",
                color: "var(--color-text-tertiary)",
                backgroundColor: "var(--color-white)",
              }}
            >
              <Sparkle size={12} weight="fill" />
              Extract from image
            </button>
          </div>
        </FormField>

        <FormField label="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Optional notes about this purchase..."
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{
              backgroundColor: "var(--color-white)",
              borderColor: "var(--color-warm-gray-200)",
              color: "var(--color-text-primary)",
            }}
          />
        </FormField>

        {error && (
          <div
            className="rounded-lg border px-3 py-2 text-xs"
            style={{
              borderColor: "rgba(220, 38, 38, 0.3)",
              backgroundColor: "rgba(220, 38, 38, 0.06)",
              color: "#b91c1c",
            }}
          >
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-xs font-semibold transition-colors hover:bg-[var(--color-warm-gray-50)]"
            style={{
              borderColor: "var(--color-warm-gray-200)",
              color: "var(--color-text-secondary)",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #02aaeb, #1b77be)",
            }}
          >
            {isPending ? "Saving..." : "Save receipt"}
          </button>
        </div>
      </form>
    </Card>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {label} {required && <span style={{ color: "#dc2626" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function ReceiptRow({ receipt, ownerId }: { receipt: Receipt; ownerId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleToggleVisibility() {
    startTransition(async () => {
      await toggleReceiptVisibility(receipt.id, ownerId);
    });
  }

  function handleDelete() {
    if (!confirm(`Delete receipt from ${receipt.vendor}?`)) return;
    startTransition(async () => {
      await deleteReceipt(receipt.id, ownerId);
    });
  }

  const categoryLabel =
    RECEIPT_CATEGORIES.find((c) => c.value === receipt.category)?.label ??
    receipt.category;

  return (
    <div
      className="group flex items-center gap-4 rounded-xl border p-4 transition-colors duration-150"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{
          backgroundColor: "rgba(27, 119, 190, 0.08)",
          color: "var(--color-brand)",
        }}
      >
        {receipt.image_url ? (
          <ImageIcon size={18} weight="duotone" />
        ) : (
          <ReceiptIcon size={18} weight="duotone" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="truncate text-sm font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {receipt.vendor}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{
              backgroundColor: "var(--color-warm-gray-100)",
              color: "var(--color-text-secondary)",
            }}
          >
            {categoryLabel}
          </span>
        </div>
        <div
          className="mt-0.5 flex items-center gap-2 text-xs"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          <span>{formatDate(receipt.purchase_date)}</span>
          {receipt.propertyLabel && (
            <>
              <span>•</span>
              <span className="truncate">{receipt.propertyLabel}</span>
            </>
          )}
        </div>
      </div>

      <div
        className="text-right text-base font-semibold tabular-nums"
        style={{ color: "var(--color-text-primary)" }}
      >
        {formatCurrency(Number(receipt.amount))}
      </div>

      <button
        onClick={handleToggleVisibility}
        disabled={isPending}
        title={
          receipt.visibility === "visible"
            ? "Visible to owner. Click to make private."
            : "Private. Click to make visible to owner."
        }
        className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-warm-gray-100)]"
        style={{
          color: receipt.visibility === "visible" ? "#15803d" : "#b45309",
        }}
      >
        {receipt.visibility === "visible" ? (
          <Eye size={15} weight="fill" />
        ) : (
          <LockSimple size={15} weight="fill" />
        )}
      </button>

      <button
        onClick={handleDelete}
        disabled={isPending}
        className="flex h-8 w-8 items-center justify-center rounded-lg opacity-0 transition-opacity duration-150 hover:bg-[var(--color-warm-gray-100)] group-hover:opacity-100"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        <Trash size={14} />
      </button>
    </div>
  );
}

function InvoicesPlaceholder({ ownerFirstName }: { ownerFirstName: string }) {
  return (
    <PlaceholderCard
      icon={<Invoice size={22} weight="fill" />}
      title="Invoicing is coming soon"
      description={`Send one-off and recurring invoices to ${ownerFirstName}. Track payment status, set up auto-pay, and manage management fees, special services, and repair markups.`}
      bullets={[
        "Recurring monthly invoices",
        "One-off charges",
        "Payment status tracking",
        "Auto-pay management",
      ]}
      footnote={
        <>
          Currently managed in{" "}
          <a
            href="https://app.hubflo.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--color-brand)" }}
          >
            HubFlo
          </a>
          .
        </>
      }
    />
  );
}

function StatementsPlaceholder({ ownerFirstName }: { ownerFirstName: string }) {
  return (
    <PlaceholderCard
      icon={<ChartLineUp size={22} weight="fill" />}
      title="Monthly statements are coming soon"
      description={`A single owner-facing financial summary for ${ownerFirstName}, generated monthly and downloadable as PDF. Combines Hospitable revenue with Parcel receipts and invoices.`}
      bullets={[
        "Monthly P&L",
        "Revenue from Hospitable",
        "Parcel receipts and invoices",
        "Net to owner",
      ]}
    />
  );
}

function TaxDocumentsPlaceholder({ ownerFirstName }: { ownerFirstName: string }) {
  return (
    <PlaceholderCard
      icon={<Scales size={22} weight="fill" />}
      title="Tax documents are coming soon"
      description={`Year-end tax documents for ${ownerFirstName}'s CPA. 1099-MISC generation, expense category summaries, and depreciation schedules.`}
      bullets={[
        "1099-MISC generation",
        "Year-end expense report",
        "Depreciation tracking",
        "CPA-ready exports",
      ]}
    />
  );
}

function PlaceholderCard({
  icon,
  title,
  description,
  bullets,
  footnote,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  bullets: string[];
  footnote?: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex flex-col items-center py-8 text-center">
        <span
          className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            background:
              "linear-gradient(135deg, rgba(2, 170, 235, 0.12), rgba(27, 119, 190, 0.08))",
            color: "var(--color-brand)",
          }}
        >
          {icon}
        </span>
        <h3
          className="text-base font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {title}
        </h3>
        <p
          className="mt-2 max-w-md text-sm leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {description}
        </p>
        <ul
          className="mt-5 flex flex-col gap-1.5 text-left text-xs"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {bullets.map((b) => (
            <li key={b} className="flex items-center gap-2">
              <Check
                size={12}
                weight="bold"
                style={{ color: "var(--color-brand)" }}
              />
              {b}
            </li>
          ))}
        </ul>
        {footnote && (
          <div
            className="mt-5 text-xs"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {footnote}
          </div>
        )}
      </div>
    </Card>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/* ═══════════════════════════════════════════════════════════════════════════
   PROPERTIES
   ═══════════════════════════════════════════════════════════════════════════ */

function MembersSection({ entity }: { entity: EntityInfo }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (profileId: string, name: string) => {
    if (!confirm(`Remove ${name} from "${entity.name}"? They will get their own one-person entity.`)) {
      return;
    }
    setRemovingId(profileId);
    const { unlinkProfileFromEntity } = await import("./entity-actions");
    const result = await unlinkProfileFromEntity({ profileId });
    setRemovingId(null);
    if ("error" in result) {
      alert(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <SectionHeading>Entity Members</SectionHeading>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--color-warm-gray-50)]"
          style={{ borderColor: "var(--color-warm-gray-200)", color: "var(--color-text-primary)" }}
        >
          <NotePencil size={13} weight="bold" />
          Edit entity
        </button>
      </div>

      {/* Entity info card */}
      <div
        className="rounded-xl border p-5"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: "var(--color-warm-gray-200)",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3
                className="text-base font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                {entity.name}
              </h3>
              <span
                className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{
                  backgroundColor: "rgba(2, 170, 235, 0.08)",
                  color: "var(--color-brand)",
                }}
              >
                {entity.type}
              </span>
            </div>
            {entity.ein ? (
              <p
                className="mt-1 font-mono text-xs"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                EIN: {entity.ein}
              </p>
            ) : null}
            {entity.notes ? (
              <p
                className="mt-2 text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {entity.notes}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {editOpen ? (
        <EditEntityModal
          entity={entity}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            router.refresh();
          }}
        />
      ) : null}

      {addMemberOpen ? (
        <AddMemberModal
          entityId={entity.id}
          entityName={entity.name}
          existingMemberIds={entity.members.map((m) => m.id)}
          onClose={() => setAddMemberOpen(false)}
          onAdded={() => {
            setAddMemberOpen(false);
            router.refresh();
          }}
        />
      ) : null}

      {/* Members list */}
      <div>
        <p
          className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          {entity.members.length} {entity.members.length === 1 ? "member" : "members"}
        </p>
        <div
          className="overflow-hidden rounded-xl border"
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-warm-gray-200)",
          }}
        >
          <ul>
            {entity.members.map((member, index) => {
              const initials = buildInitials(member.fullName ?? member.email);
              const displayName = member.fullName?.trim() || member.email;
              return (
                <li
                  key={member.id}
                  className="flex items-center gap-4 border-t px-5 py-4 first:border-t-0"
                  style={{ borderColor: "var(--color-warm-gray-100)" }}
                >
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={displayName}
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: "var(--color-warm-gray-100)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {initials}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="truncate text-sm font-semibold"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {displayName}
                      </span>
                      {index === 0 ? (
                        <span
                          className="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                          style={{
                            backgroundColor: "rgba(22, 163, 74, 0.08)",
                            color: "var(--color-success)",
                          }}
                        >
                          Primary
                        </span>
                      ) : null}
                      {member.isPending ? (
                        <span
                          className="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                          style={{
                            backgroundColor: "rgba(245, 158, 11, 0.08)",
                            color: "#d97706",
                          }}
                        >
                          Not invited
                        </span>
                      ) : !member.onboardedAt ? (
                        <span
                          className="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                          style={{
                            backgroundColor: "var(--color-warm-gray-100)",
                            color: "var(--color-text-tertiary)",
                          }}
                        >
                          Setting up
                        </span>
                      ) : null}
                    </div>
                    <div
                      className="mt-0.5 truncate text-xs"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      {member.email}
                      {member.phone ? ` · ${member.phone}` : null}
                    </div>
                  </div>

                  {/* Remove button (non-primary members only, if more than 1 member) */}
                  {index > 0 && entity.members.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => handleRemove(member.id, displayName)}
                      disabled={removingId === member.id}
                      className="shrink-0 rounded px-2 py-1 text-[11px] font-medium transition-colors hover:bg-[rgba(220,38,38,0.08)]"
                      style={{ color: "var(--color-error)" }}
                    >
                      {removingId === member.id ? "Removing..." : "Remove"}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>

        <button
          type="button"
          onClick={() => setAddMemberOpen(true)}
          className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-xs font-medium transition-colors hover:bg-[var(--color-warm-gray-50)]"
          style={{ borderColor: "var(--color-warm-gray-200)", color: "var(--color-brand)" }}
        >
          <Plus size={13} weight="bold" />
          Add existing profile to entity
        </button>
      </div>
    </div>
  );
}

/* ─── Edit Entity Modal ─── */

function EditEntityModal({
  entity,
  onClose,
  onSaved,
}: {
  entity: EntityInfo;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(entity.name);
  const [type, setType] = useState(entity.type);
  const [ein, setEin] = useState(entity.ein ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setError(null);
    setSaving(true);
    const { updateEntity } = await import("./entity-actions");
    const result = await updateEntity({
      entityId: entity.id,
      name: name.trim(),
      type: type as "individual" | "llc" | "partnership" | "trust" | "corporation",
      ein: ein.trim() || null,
    });
    setSaving(false);
    if ("error" in result) {
      setError(result.error ?? "Failed to save");
      return;
    }
    onSaved();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-7"
        style={{
          backgroundColor: "var(--color-white)",
          boxShadow: "0 20px 60px -12px rgba(0,0,0,0.25)",
        }}
      >
        <h3 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Edit entity
        </h3>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Update the entity name, type, or EIN. All members will see the change.
        </p>

        <div className="mt-5 flex flex-col gap-4">
          <div>
            <label
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Entity name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-brand)]"
              style={{
                borderColor: "var(--color-warm-gray-200)",
                color: "var(--color-text-primary)",
                backgroundColor: "var(--color-white)",
              }}
              placeholder="Acme Investments LLC"
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-brand)]"
              style={{
                borderColor: "var(--color-warm-gray-200)",
                color: "var(--color-text-primary)",
                backgroundColor: "var(--color-white)",
              }}
            >
              <option value="individual">Individual</option>
              <option value="llc">LLC</option>
              <option value="partnership">Partnership</option>
              <option value="trust">Trust</option>
              <option value="corporation">Corporation</option>
            </select>
          </div>

          <div>
            <label
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              EIN (optional)
            </label>
            <input
              type="text"
              value={ein}
              onChange={(e) => setEin(e.target.value)}
              className="w-full rounded-lg border px-3.5 py-2.5 font-mono text-sm outline-none transition-colors focus:border-[var(--color-brand)]"
              style={{
                borderColor: "var(--color-warm-gray-200)",
                color: "var(--color-text-primary)",
                backgroundColor: "var(--color-white)",
              }}
              placeholder="12-3456789"
            />
          </div>

          {error ? (
            <div
              className="rounded-lg border px-3 py-2 text-xs"
              style={{
                backgroundColor: "rgba(220,38,38,0.08)",
                borderColor: "rgba(220,38,38,0.2)",
                color: "var(--color-error)",
              }}
            >
              {error}
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-semibold transition-colors hover:bg-[var(--color-warm-gray-50)]"
            style={{
              borderColor: "var(--color-warm-gray-200)",
              color: "var(--color-text-primary)",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "var(--color-brand)" }}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Add Member Modal ─── */

type OwnerProfile = {
  id: string;
  full_name: string | null;
  email: string;
  entity_id: string | null;
};

function AddMemberModal({
  entityId,
  entityName,
  existingMemberIds,
  onClose,
  onAdded,
}: {
  entityId: string;
  entityName: string;
  existingMemberIds: string[];
  onClose: () => void;
  onAdded: () => void;
}) {
  const [profiles, setProfiles] = useState<OwnerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load all owner profiles on mount
  useEffect(() => {
    let cancelled = false;
    import("./entity-actions").then(async ({ getAllOwnerProfiles }) => {
      const result = await getAllOwnerProfiles();
      if (cancelled) return;
      if ("error" in result) {
        setError(result.error ?? "Failed to load profiles");
      } else {
        setProfiles(result.profiles);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter: exclude current members and filter by search
  const filtered = profiles.filter((p) => {
    if (existingMemberIds.includes(p.id)) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (p.full_name?.toLowerCase().includes(q) ?? false) ||
      p.email.toLowerCase().includes(q)
    );
  });

  const handleAdd = async (profile: OwnerProfile) => {
    setError(null);
    setAdding(profile.id);
    const { linkProfileToEntity } = await import("./entity-actions");
    const result = await linkProfileToEntity({
      profileId: profile.id,
      entityId,
    });
    setAdding(null);
    if ("error" in result) {
      setError(result.error ?? "Failed to add member");
      return;
    }
    onAdded();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl"
        style={{
          backgroundColor: "var(--color-white)",
          boxShadow: "0 20px 60px -12px rgba(0,0,0,0.25)",
        }}
      >
        <div className="border-b px-6 py-5" style={{ borderColor: "var(--color-warm-gray-200)" }}>
          <h3 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Add member to {entityName}
          </h3>
          <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Pick an existing profile to merge into this entity. Their current entity will be cleaned up if empty.
          </p>

          <div
            className="mt-4 flex items-center gap-2 rounded-lg border px-3 py-2"
            style={{ borderColor: "var(--color-warm-gray-200)", backgroundColor: "var(--color-warm-gray-50)" }}
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full bg-transparent text-sm outline-none"
              style={{ color: "var(--color-text-primary)" }}
              autoFocus
            />
          </div>
        </div>

        {error ? (
          <div
            className="border-b px-6 py-3 text-xs"
            style={{
              borderColor: "rgba(220,38,38,0.2)",
              backgroundColor: "rgba(220,38,38,0.04)",
              color: "var(--color-error)",
            }}
          >
            {error}
          </div>
        ) : null}

        <div className="max-h-[360px] overflow-y-auto">
          {loading ? (
            <p className="px-6 py-8 text-center text-sm" style={{ color: "var(--color-text-tertiary)" }}>
              Loading profiles...
            </p>
          ) : filtered.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm" style={{ color: "var(--color-text-tertiary)" }}>
              {search ? "No matching profiles." : "All profiles are already in this entity."}
            </p>
          ) : (
            <ul>
              {filtered.map((profile) => {
                const displayName = profile.full_name?.trim() || profile.email;
                const initials = buildInitials(displayName);
                return (
                  <li
                    key={profile.id}
                    className="border-t first:border-t-0"
                    style={{ borderColor: "var(--color-warm-gray-100)" }}
                  >
                    <button
                      type="button"
                      onClick={() => handleAdd(profile)}
                      disabled={adding === profile.id}
                      className="flex w-full items-center gap-3 px-6 py-3 text-left transition-colors hover:bg-[var(--color-warm-gray-50)] disabled:opacity-50"
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                        style={{
                          backgroundColor: "var(--color-warm-gray-100)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div
                          className="truncate text-sm font-medium"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {displayName}
                        </div>
                        <div
                          className="truncate text-xs"
                          style={{ color: "var(--color-text-tertiary)" }}
                        >
                          {profile.email}
                        </div>
                      </div>
                      <span
                        className="shrink-0 text-[11px] font-semibold"
                        style={{ color: adding === profile.id ? "var(--color-text-tertiary)" : "var(--color-brand)" }}
                      >
                        {adding === profile.id ? "Adding..." : "Add"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div
          className="flex justify-end border-t px-6 py-4"
          style={{ borderColor: "var(--color-warm-gray-200)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-semibold transition-colors hover:bg-[var(--color-warm-gray-50)]"
            style={{
              borderColor: "var(--color-warm-gray-200)",
              color: "var(--color-text-primary)",
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

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

/* ═══════════════════════════════════════════════════════════════════════════
   ADMIN RESERVE SECTION
   ═══════════════════════════════════════════════════════════════════════════ */

function AdminReserveSection({
  blockRequests,
  propertyMap,
}: {
  blockRequests: BlockRequest[];
  propertyMap: Map<string, string>;
}) {
  if (blockRequests.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl border px-8 py-16 text-center"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: "var(--color-warm-gray-200)",
        }}
      >
        <CalendarCheck
          size={28}
          weight="duotone"
          style={{ color: "var(--color-text-tertiary)" }}
        />
        <p className="mt-3 text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
          No block requests
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
          This owner has not submitted any block requests yet.
        </p>
      </div>
    );
  }

  const statusStyle = (s: string) => {
    if (s === "approved")
      return { bg: "rgba(22, 163, 74, 0.12)", fg: "#15803d", label: "Approved" };
    if (s === "declined")
      return { bg: "rgba(220, 38, 38, 0.10)", fg: "#b91c1c", label: "Declined" };
    return { bg: "rgba(245, 158, 11, 0.14)", fg: "#b45309", label: "Pending" };
  };

  const formatDateRange = (start: string, end: string) => {
    const s = new Date(start + "T00:00:00");
    const e = new Date(end + "T00:00:00");
    const opts: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", opts)}`;
  };

  return (
    <div className="flex flex-col gap-3">
      {blockRequests.map((req) => {
        const ss = statusStyle(req.status);
        const label = propertyMap.get(req.property_id) ?? req.propertyLabel ?? "Property";
        return (
          <div
            key={req.id}
            className="flex items-start gap-4 rounded-2xl border p-5"
            style={{
              backgroundColor: "var(--color-white)",
              borderColor: "var(--color-warm-gray-200)",
            }}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {formatDateRange(req.start_date, req.end_date)}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{ backgroundColor: ss.bg, color: ss.fg }}
                >
                  {ss.label}
                </span>
              </div>
              <div className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                {label}
              </div>
              {req.note && (
                <div
                  className="mt-1.5 text-xs italic"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {req.note}
                </div>
              )}
            </div>
            <div className="shrink-0 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
              {new Date(req.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
