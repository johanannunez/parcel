"use client";

import { useState, useTransition, useRef } from "react";
import {
  MagnifyingGlass,
  Eye,
  EyeSlash,
  PushPin,
  Trash,
  Plus,
  X,
  CalendarCheck,
  Circle,
  House,
  CurrencyDollar,
  ChatsCircle,
  FolderOpen,
  UserCircle,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { formatMedium, formatRelative } from "@/lib/format";
import {
  toggleTimelineVisibility,
  toggleTimelinePin,
  softDeleteTimelineEntry,
  createTimelineEntry,
} from "./actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TimelineEntry = {
  id: string;
  owner_id: string;
  event_type: string;
  category: string;
  title: string;
  body: string | null;
  property_id: string | null;
  icon: string | null;
  visibility: string;
  is_pinned: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
};

type Props = {
  entries: TimelineEntry[];
  profileMap: Record<string, Profile>;
  propertyMap: Record<string, string>;
  propertiesByOwner: Record<string, { id: string; label: string }[]>;
  profiles: Profile[];
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "account", label: "Account" },
  { value: "property", label: "Property" },
  { value: "financial", label: "Financial" },
  { value: "calendar", label: "Calendar" },
  { value: "document", label: "Document" },
  { value: "communication", label: "Communication" },
] as const;

const VISIBILITY_FILTERS = [
  { value: "all", label: "All" },
  { value: "owner", label: "Owner Visible" },
  { value: "admin_only", label: "Admin Only" },
] as const;

// ---------------------------------------------------------------------------
// Category icon mapping (duotone, matches portal)
// ---------------------------------------------------------------------------

function CategoryIcon({ category, size }: { category: string; size: number }) {
  const iconColor = "var(--color-text-tertiary)";
  const props = { size, weight: "duotone" as const, style: { color: iconColor } };

  switch (category) {
    case "account":
      return <UserCircle {...props} />;
    case "property":
      return <House {...props} />;
    case "financial":
      return <CurrencyDollar {...props} />;
    case "calendar":
      return <CalendarCheck {...props} />;
    case "document":
      return <FolderOpen {...props} />;
    case "communication":
      return <ChatsCircle {...props} />;
    default:
      return <Circle {...props} />;
  }
}

// ---------------------------------------------------------------------------
// Avatar helper
// ---------------------------------------------------------------------------

function OwnerAvatar({
  profile,
  size = 32,
}: {
  profile: Profile | undefined;
  size?: number;
}) {
  const initials = buildInitials(profile?.full_name || profile?.email || "?");

  if (profile?.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt=""
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-xs font-semibold"
      style={{
        width: size,
        height: size,
        backgroundColor: "var(--color-warm-gray-100)",
        color: "var(--color-text-secondary)",
      }}
    >
      {initials}
    </span>
  );
}

function buildInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ---------------------------------------------------------------------------
// Relative time with absolute fallback after 7 days
// ---------------------------------------------------------------------------

function timeLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  if (diffMs < sevenDays) return formatRelative(dateStr);
  return formatMedium(dateStr);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function AdminTimelineView({
  entries,
  profileMap,
  propertyMap,
  propertiesByOwner,
  profiles,
}: Props) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const lowerSearch = search.toLowerCase();

  const filtered = entries.filter((e) => {
    if (!showDeleted && e.deleted_at) return false;
    if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
    if (visibilityFilter !== "all" && e.visibility !== visibilityFilter) return false;
    if (lowerSearch) {
      const matchTitle = e.title.toLowerCase().includes(lowerSearch);
      const matchBody = e.body?.toLowerCase().includes(lowerSearch);
      const ownerProfile = profileMap[e.owner_id];
      const matchOwner =
        ownerProfile?.full_name?.toLowerCase().includes(lowerSearch) ||
        ownerProfile?.email?.toLowerCase().includes(lowerSearch);
      if (!matchTitle && !matchBody && !matchOwner) return false;
    }
    return true;
  });

  const activeEntries = filtered.filter((e) => !e.deleted_at);
  const deletedEntries = filtered.filter((e) => e.deleted_at);

  return (
    <div className="flex flex-col gap-6">
      {/* Controls bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1" style={{ minWidth: 220 }}>
            <MagnifyingGlass
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--color-text-tertiary)" }}
            />
            <input
              type="text"
              placeholder="Search entries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-1"
              style={{
                borderColor: "var(--color-warm-gray-200)",
                backgroundColor: "var(--color-white)",
                color: "var(--color-text-primary)",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-brand)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-warm-gray-200)"; }}
            />
          </div>

          {/* Add entry button */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2"
            style={{
              background: "var(--color-brand-gradient)",
              boxShadow: "0 2px 8px rgba(27, 119, 190, 0.25)",
              transition: "opacity 0.15s ease, transform 0.1s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.97)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            {showAddForm ? <X size={14} weight="bold" /> : <Plus size={14} weight="bold" />}
            {showAddForm ? "Close" : "Add entry"}
          </button>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category pills */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => {
              const isActive = categoryFilter === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setCategoryFilter(cat.value)}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-1"
                  style={{
                    backgroundColor: isActive
                      ? "var(--color-brand)"
                      : "var(--color-warm-gray-100)",
                    color: isActive ? "var(--color-white)" : "var(--color-text-secondary)",
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div
            className="hidden h-5 w-px sm:block"
            style={{ backgroundColor: "var(--color-warm-gray-200)" }}
          />

          {/* Visibility filter */}
          <div className="flex gap-1.5">
            {VISIBILITY_FILTERS.map((vis) => {
              const isActive = visibilityFilter === vis.value;
              return (
                <button
                  key={vis.value}
                  onClick={() => setVisibilityFilter(vis.value)}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-1"
                  style={{
                    backgroundColor: isActive
                      ? "var(--color-brand)"
                      : "var(--color-warm-gray-100)",
                    color: isActive ? "var(--color-white)" : "var(--color-text-secondary)",
                  }}
                >
                  {vis.label}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div
            className="hidden h-5 w-px sm:block"
            style={{ backgroundColor: "var(--color-warm-gray-200)" }}
          />

          {/* Show deleted toggle */}
          <label
            className="flex cursor-pointer items-center gap-2 text-xs font-medium"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="accent-[var(--color-brand)]"
            />
            Show deleted
          </label>
        </div>
      </div>

      {/* Add entry form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden" }}
          >
            <AddEntryForm
              profiles={profiles}
              propertiesByOwner={propertiesByOwner}
              onDone={() => setShowAddForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline feed */}
      {activeEntries.length === 0 && deletedEntries.length === 0 ? (
        <div
          className="rounded-xl border px-6 py-12 text-center text-sm"
          style={{
            borderColor: "var(--color-warm-gray-200)",
            color: "var(--color-text-tertiary)",
          }}
        >
          No timeline entries match your filters.
        </div>
      ) : (
        <div className="flex flex-col gap-0">
          {activeEntries.map((entry) => (
            <TimelineRow
              key={entry.id}
              entry={entry}
              profileMap={profileMap}
              propertyMap={propertyMap}
              isPending={isPending}
              confirmDeleteId={confirmDeleteId}
              onConfirmDelete={setConfirmDeleteId}
              onToggleVisibility={(id) => {
                startTransition(async () => {
                  void (await toggleTimelineVisibility(id));
                });
              }}
              onTogglePin={(id) => {
                startTransition(async () => {
                  void (await toggleTimelinePin(id));
                });
              }}
              onDelete={(id) => {
                startTransition(async () => {
                  void (await softDeleteTimelineEntry(id));
                  setConfirmDeleteId(null);
                });
              }}
            />
          ))}

          {/* Deleted entries section */}
          {showDeleted && deletedEntries.length > 0 && (
            <>
              <div
                className="mt-6 mb-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                Deleted entries
              </div>
              {deletedEntries.map((entry) => (
                <TimelineRow
                  key={entry.id}
                  entry={entry}
                  profileMap={profileMap}
                  propertyMap={propertyMap}
                  isPending={isPending}
                  confirmDeleteId={confirmDeleteId}
                  onConfirmDelete={setConfirmDeleteId}
                  onToggleVisibility={() => {}}
                  onTogglePin={() => {}}
                  onDelete={() => {}}
                  isDeleted
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline row
// ---------------------------------------------------------------------------

function TimelineRow({
  entry,
  profileMap,
  propertyMap,
  isPending,
  confirmDeleteId,
  onConfirmDelete,
  onToggleVisibility,
  onTogglePin,
  onDelete,
  isDeleted = false,
}: {
  entry: TimelineEntry;
  profileMap: Record<string, Profile>;
  propertyMap: Record<string, string>;
  isPending: boolean;
  confirmDeleteId: string | null;
  onConfirmDelete: (id: string | null) => void;
  onToggleVisibility: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleted?: boolean;
}) {
  const owner = profileMap[entry.owner_id];
  const deletedBy = entry.deleted_by ? profileMap[entry.deleted_by] : null;
  const propertyName = entry.property_id ? propertyMap[entry.property_id] : null;
  const isConfirming = confirmDeleteId === entry.id;

  return (
    <div
      className="group flex items-start gap-4 rounded-xl border px-4 py-4"
      style={{
        borderColor: isDeleted ? "rgba(220, 38, 38, 0.15)" : "var(--color-warm-gray-200)",
        backgroundColor: isDeleted ? "rgba(220, 38, 38, 0.03)" : "var(--color-white)",
        opacity: isDeleted ? 0.7 : 1,
        boxShadow: isDeleted ? "none" : "var(--shadow-card)",
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
      }}
      onMouseEnter={(e) => {
        if (!isDeleted) {
          e.currentTarget.style.boxShadow = "var(--shadow-md)";
          e.currentTarget.style.borderColor = "var(--color-warm-gray-400)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isDeleted) {
          e.currentTarget.style.boxShadow = "var(--shadow-card)";
          e.currentTarget.style.borderColor = "var(--color-warm-gray-200)";
        }
      }}
    >
      {/* Owner avatar */}
      <div className="shrink-0 pt-0.5">
        <OwnerAvatar profile={owner} size={32} />
      </div>

      {/* Category icon circle */}
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: "var(--color-warm-gray-200)",
        }}
      >
        <CategoryIcon category={entry.category} size={16} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            {/* Owner name */}
            <div
              className="text-xs font-medium"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {owner?.full_name || owner?.email || "Unknown owner"}
            </div>

            {/* Title */}
            <div
              className="mt-0.5 text-sm font-semibold"
              style={{
                color: "var(--color-text-primary)",
                textDecoration: isDeleted ? "line-through" : "none",
              }}
            >
              {entry.title}
            </div>

            {/* Body preview */}
            {entry.body && (
              <div
                className="mt-1 line-clamp-2 text-sm leading-relaxed"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {entry.body}
              </div>
            )}

            {/* Meta row */}
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span
                className="text-xs"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                {timeLabel(entry.created_at)}
              </span>

              {propertyName && (
                <>
                  <Dot />
                  <span
                    className="rounded-md px-1.5 py-0.5 text-[11px] font-medium"
                    style={{
                      backgroundColor: "var(--color-warm-gray-100)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {propertyName}
                  </span>
                </>
              )}

              <Dot />

              {/* Visibility badge */}
              {entry.visibility === "owner" ? (
                <span
                  className="rounded-md px-1.5 py-0.5 text-[11px] font-medium"
                  style={{
                    backgroundColor: "rgba(34, 197, 94, 0.1)",
                    color: "rgb(22, 163, 74)",
                  }}
                >
                  Visible
                </span>
              ) : (
                <span
                  className="rounded-md px-1.5 py-0.5 text-[11px] font-medium"
                  style={{
                    backgroundColor: "rgba(245, 158, 11, 0.1)",
                    color: "rgb(217, 119, 6)",
                  }}
                >
                  Admin Only
                </span>
              )}

              {/* Pinned indicator */}
              {entry.is_pinned && (
                <>
                  <Dot />
                  <span
                    className="flex items-center gap-0.5 text-[11px] font-medium"
                    style={{ color: "rgb(217, 119, 6)" }}
                  >
                    <PushPin size={11} weight="fill" />
                    Pinned
                  </span>
                </>
              )}

              {/* Deleted badge */}
              {isDeleted && (
                <>
                  <Dot />
                  <span
                    className="rounded-md px-1.5 py-0.5 text-[11px] font-medium"
                    style={{
                      backgroundColor: "rgba(220, 38, 38, 0.1)",
                      color: "rgb(220, 38, 38)",
                    }}
                  >
                    Deleted
                  </span>
                </>
              )}

              {isDeleted && entry.deleted_at && (
                <>
                  <Dot />
                  <span
                    className="text-[11px]"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    Deleted by {deletedBy?.full_name || deletedBy?.email || "admin"} on{" "}
                    {formatMedium(entry.deleted_at)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          {!isDeleted && (
            <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              <ActionButton
                title={
                  entry.visibility === "owner"
                    ? "Make admin only"
                    : "Make visible to owner"
                }
                onClick={() => onToggleVisibility(entry.id)}
                disabled={isPending}
              >
                {entry.visibility === "owner" ? (
                  <EyeSlash size={15} />
                ) : (
                  <Eye size={15} />
                )}
              </ActionButton>

              <ActionButton
                title={entry.is_pinned ? "Unpin" : "Pin"}
                onClick={() => onTogglePin(entry.id)}
                disabled={isPending}
              >
                <PushPin
                  size={15}
                  weight={entry.is_pinned ? "fill" : "regular"}
                  style={
                    entry.is_pinned ? { color: "rgb(217, 119, 6)" } : undefined
                  }
                />
              </ActionButton>

              {isConfirming ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onDelete(entry.id)}
                    disabled={isPending}
                    className="rounded-md px-2 py-1 text-[11px] font-semibold text-white transition-colors duration-150 disabled:opacity-50"
                    style={{ backgroundColor: "rgb(220, 38, 38)" }}
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => onConfirmDelete(null)}
                    className="rounded-md px-2 py-1 text-[11px] font-medium transition-colors duration-150"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <ActionButton
                  title="Delete"
                  onClick={() => onConfirmDelete(entry.id)}
                  disabled={isPending}
                >
                  <Trash size={15} />
                </ActionButton>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add entry form
// ---------------------------------------------------------------------------

function AddEntryForm({
  profiles,
  propertiesByOwner,
  onDone,
}: {
  profiles: Profile[];
  propertiesByOwner: Record<string, { id: string; label: string }[]>;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const ownerProperties = selectedOwnerId
    ? propertiesByOwner[selectedOwnerId] ?? []
    : [];

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createTimelineEntry(formData);
      if (result.ok) {
        formRef.current?.reset();
        setSelectedOwnerId("");
        onDone();
      }
    });
  }

  const inputStyle = {
    borderColor: "var(--color-warm-gray-200)",
    backgroundColor: "var(--color-white)",
    color: "var(--color-text-primary)",
  };

  const selectStyle = {
    ...inputStyle,
    color: "var(--color-text-secondary)" as const,
  };

  return (
    <div
      className="rounded-xl border p-5"
      style={{
        borderColor: "var(--color-warm-gray-200)",
        backgroundColor: "var(--color-white)",
      }}
    >
      <div
        className="mb-4 text-[10px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        New Timeline Entry
      </div>
      <form ref={formRef} action={handleSubmit}>
        <div className="flex flex-col gap-3">
          {/* Row 1: Owner + Category */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              name="owner_id"
              required
              value={selectedOwnerId}
              onChange={(e) => setSelectedOwnerId(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm outline-none"
              style={selectStyle}
            >
              <option value="">Select owner...</option>
              {profiles
                .filter((p) => p.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name || p.email}
                  </option>
                ))}
            </select>

            <select
              name="category"
              defaultValue="account"
              className="rounded-lg border px-3 py-2 text-sm outline-none"
              style={selectStyle}
            >
              <option value="account">Account</option>
              <option value="property">Property</option>
              <option value="financial">Financial</option>
              <option value="calendar">Calendar</option>
              <option value="document">Document</option>
              <option value="communication">Communication</option>
            </select>
          </div>

          {/* Row 2: Event type + Title */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              name="event_type"
              type="text"
              placeholder="Event type (e.g. note, email)"
              defaultValue="note"
              className="rounded-lg border px-3 py-2 text-sm outline-none"
              style={inputStyle}
            />
            <input
              name="title"
              type="text"
              placeholder="Title"
              required
              className="rounded-lg border px-3 py-2 text-sm outline-none"
              style={inputStyle}
            />
          </div>

          {/* Row 3: Body */}
          <textarea
            name="body"
            placeholder="Body (optional)"
            rows={2}
            className="w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none"
            style={inputStyle}
          />

          {/* Row 4: Property + Visibility + Icon */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select
              name="property_id"
              className="rounded-lg border px-3 py-2 text-sm outline-none"
              style={selectStyle}
            >
              <option value="">No property</option>
              {ownerProperties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>

            <select
              name="visibility"
              defaultValue="owner"
              className="rounded-lg border px-3 py-2 text-sm outline-none"
              style={selectStyle}
            >
              <option value="owner">Visible to owner</option>
              <option value="admin_only">Admin only</option>
            </select>

            <input
              name="icon"
              type="text"
              placeholder="Icon name (optional)"
              className="rounded-lg border px-3 py-2 text-sm outline-none"
              style={inputStyle}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity duration-150 disabled:opacity-50"
              style={{ backgroundColor: "var(--color-brand)" }}
            >
              {isPending ? "Creating..." : "Create entry"}
            </button>
            <button
              type="button"
              onClick={onDone}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared small components
// ---------------------------------------------------------------------------

function ActionButton({
  children,
  title,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150 disabled:opacity-50"
      style={{ color: "var(--color-text-tertiary)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--color-warm-gray-100)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {children}
    </button>
  );
}

function Dot() {
  return (
    <span className="text-xs" style={{ color: "var(--color-warm-gray-200)" }}>
      ·
    </span>
  );
}
