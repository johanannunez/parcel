"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import {
  UserCircle,
  House,
  CurrencyDollar,
  CalendarBlank,
  FileText,
  ChatCircle,
  PushPin,
  ClockCounterClockwise,
  Star,
} from "@phosphor-icons/react";
import { formatMedium, formatRelative } from "@/lib/format";
import { EmptyState } from "@/components/portal/EmptyState";
import type { TimelineEntry } from "./page";

type Category =
  | "all"
  | "account"
  | "property"
  | "financial"
  | "calendar"
  | "document"
  | "communication";

type FilterPill = {
  key: Category;
  label: string;
  icon: React.ComponentType<{ size?: number; weight?: "duotone" }>;
};

const FILTER_PILLS: FilterPill[] = [
  { key: "all", label: "All", icon: ClockCounterClockwise },
  { key: "account", label: "Account", icon: UserCircle },
  { key: "property", label: "Property", icon: House },
  { key: "financial", label: "Financial", icon: CurrencyDollar },
  { key: "calendar", label: "Calendar", icon: CalendarBlank },
  { key: "document", label: "Documents", icon: FileText },
  { key: "communication", label: "Messages", icon: ChatCircle },
];

const CATEGORY_CONFIG: Record<
  string,
  { color: string; bg: string; icon: React.ComponentType<{ size?: number; weight?: "duotone" }> }
> = {
  account: {
    color: "var(--color-brand)",
    bg: "rgba(27, 119, 190, 0.10)",
    icon: UserCircle,
  },
  property: {
    color: "#15803d",
    bg: "rgba(22, 163, 74, 0.10)",
    icon: House,
  },
  financial: {
    color: "#15803d",
    bg: "rgba(22, 163, 74, 0.10)",
    icon: CurrencyDollar,
  },
  calendar: {
    color: "#b45309",
    bg: "rgba(245, 158, 11, 0.12)",
    icon: CalendarBlank,
  },
  document: {
    color: "var(--color-text-secondary)",
    bg: "var(--color-warm-gray-100)",
    icon: FileText,
  },
  communication: {
    color: "var(--color-brand)",
    bg: "rgba(27, 119, 190, 0.10)",
    icon: ChatCircle,
  },
};

const DEFAULT_CONFIG = {
  color: "var(--color-text-tertiary)",
  bg: "var(--color-warm-gray-100)",
  icon: Star,
};

function getCategoryConfig(category: string) {
  return CATEGORY_CONFIG[category] ?? DEFAULT_CONFIG;
}

function formatDayKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (today.getTime() - target.getTime()) / 86_400_000,
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return formatRelative(dateStr);

  return formatMedium(dateStr);
}

function formatEntryTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = diffMs / 86_400_000;

  if (diffDays < 7) return formatRelative(dateStr);
  return formatMedium(dateStr);
}

type TimelineViewProps = {
  entries: TimelineEntry[];
  propertyMap: Record<string, string>;
};

export function TimelineView({ entries, propertyMap }: TimelineViewProps) {
  const [activeFilter, setActiveFilter] = useState<Category>("all");

  const filtered = useMemo(() => {
    if (activeFilter === "all") return entries;
    return entries.filter((e) => e.category === activeFilter);
  }, [entries, activeFilter]);

  const pinned = useMemo(() => filtered.filter((e) => e.is_pinned), [filtered]);
  const unpinned = useMemo(
    () => filtered.filter((e) => !e.is_pinned),
    [filtered],
  );

  const dayGroups = useMemo(() => {
    const groups: { key: string; label: string; entries: TimelineEntry[] }[] =
      [];
    const seen = new Map<string, number>();

    for (const entry of unpinned) {
      const key = formatDayKey(entry.created_at);
      const idx = seen.get(key);
      if (idx !== undefined) {
        groups[idx].entries.push(entry);
      } else {
        seen.set(key, groups.length);
        groups.push({
          key,
          label: formatDayLabel(entry.created_at),
          entries: [entry],
        });
      }
    }

    return groups;
  }, [unpinned]);

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <FilterBar active={activeFilter} onChange={setActiveFilter} />
        <EmptyState
          icon={<ClockCounterClockwise size={26} weight="duotone" />}
          title="No activity yet"
          body="Key events and milestones for your account and properties will appear here."
        />
      </div>
    );
  }

  let animIndex = 0;

  return (
    <div className="flex flex-col gap-6">
      <FilterBar active={activeFilter} onChange={setActiveFilter} />

      {pinned.length > 0 && (
        <section>
          <h2
            className="mb-3 text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Milestones
          </h2>
          <div className="flex flex-col gap-3">
            {pinned.map((entry) => {
              const i = animIndex++;
              return (
                <PinnedCard
                  key={entry.id}
                  entry={entry}
                  propertyMap={propertyMap}
                  index={i}
                />
              );
            })}
          </div>
        </section>
      )}

      <section className="relative">
        {/* Vertical line */}
        <div
          className="absolute bottom-0 left-[15px] top-0 w-px"
          style={{ backgroundColor: "var(--color-warm-gray-200)" }}
        />

        <div className="flex flex-col gap-0">
          {dayGroups.map((group) => (
            <div key={group.key}>
              {/* Sticky day header */}
              <div
                className="sticky top-0 z-20 mb-2 ml-10 pt-4 pb-1"
                style={{
                  backgroundColor: "rgba(250, 250, 250, 0.85)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
              >
                <span
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  {group.label}
                </span>
              </div>

              {group.entries.map((entry) => {
                const i = animIndex++;
                return (
                  <TimelineEntryRow
                    key={entry.id}
                    entry={entry}
                    propertyMap={propertyMap}
                    index={i}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function FilterBar({
  active,
  onChange,
}: {
  active: Category;
  onChange: (c: Category) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTER_PILLS.map((pill) => {
        const isActive = pill.key === active;
        const Icon = pill.icon;
        return (
          <button
            key={pill.key}
            type="button"
            onClick={() => onChange(pill.key)}
            className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2"
            style={{
              backgroundColor: isActive
                ? "var(--color-brand)"
                : "var(--color-warm-gray-100)",
              color: isActive
                ? "var(--color-white)"
                : "var(--color-text-secondary)",
              transition: "background-color 0.15s ease, color 0.15s ease, transform 0.1s ease",
              boxShadow: isActive ? "0 2px 8px rgba(27, 119, 190, 0.25)" : "none",
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.96)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            <Icon size={14} weight="duotone" />
            {pill.label}
          </button>
        );
      })}
    </div>
  );
}

function PinnedCard({
  entry,
  propertyMap,
  index,
}: {
  entry: TimelineEntry;
  propertyMap: Record<string, string>;
  index: number;
}) {
  const cfg = getCategoryConfig(entry.category);
  const propLabel = entry.property_id
    ? propertyMap[entry.property_id]
    : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
        delay: index < 10 ? index * 0.04 : 0,
      }}
      className="relative rounded-2xl border p-4"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
        borderLeftWidth: 3,
        borderLeftColor: "#f59e0b",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(245,158,11,0.06)",
      }}
    >
      <div
        className="absolute right-3 top-3"
        style={{ color: "#f59e0b" }}
      >
        <PushPin size={14} weight="duotone" />
      </div>

      <div className="flex items-start gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: cfg.bg, color: cfg.color }}
        >
          <cfg.icon size={16} weight="duotone" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {entry.title}
            </span>
            <span
              className="shrink-0 text-xs"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {formatEntryTime(entry.created_at)}
            </span>
          </div>

          {entry.body && (
            <p
              className="mt-1 text-sm leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {entry.body}
            </p>
          )}

          {propLabel && (
            <div className="mt-2">
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{
                  backgroundColor: "rgba(27, 119, 190, 0.10)",
                  color: "var(--color-brand)",
                }}
              >
                {propLabel}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function TimelineEntryRow({
  entry,
  propertyMap,
  index,
}: {
  entry: TimelineEntry;
  propertyMap: Record<string, string>;
  index: number;
}) {
  const cfg = getCategoryConfig(entry.category);
  const propLabel = entry.property_id
    ? propertyMap[entry.property_id]
    : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
        delay: index < 10 ? index * 0.04 : 0,
      }}
      className="relative flex gap-4 pb-4"
    >
      {/* Icon dot */}
      <div
        className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: cfg.bg, color: cfg.color }}
      >
        <cfg.icon size={16} weight="duotone" />
      </div>

      {/* Content card */}
      <div
        className="min-w-0 flex-1 rounded-2xl border p-4"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: "var(--color-warm-gray-200)",
          boxShadow: "var(--shadow-card)",
          transition: "box-shadow 0.2s ease, border-color 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "var(--shadow-md)";
          e.currentTarget.style.borderColor = "var(--color-warm-gray-400)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "var(--shadow-card)";
          e.currentTarget.style.borderColor = "var(--color-warm-gray-200)";
        }}
      >
        <div className="flex items-baseline justify-between gap-2">
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {entry.title}
          </span>
          <span
            className="shrink-0 text-xs"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {formatEntryTime(entry.created_at)}
          </span>
        </div>

        {entry.body && (
          <p
            className="mt-1 text-sm leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {entry.body}
          </p>
        )}

        {propLabel && (
          <div className="mt-2">
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{
                backgroundColor: "rgba(27, 119, 190, 0.10)",
                color: "var(--color-brand)",
              }}
            >
              {propLabel}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
