"use client";

import { useMemo } from "react";
import { ClockCounterClockwise } from "@phosphor-icons/react";
import { motion } from "motion/react";
import Link from "next/link";
import { formatRelative } from "@/lib/format";

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
  created_at: string;
  property_id: string | null;
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
  maxItems?: number;
  showViewAll?: boolean;
  viewAllHref?: string;
};

// ---------------------------------------------------------------------------
// Category color mapping
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<string, string> = {
  account: "var(--color-brand)",
  property: "#15803d",
  financial: "#15803d",
  calendar: "#b45309",
  document: "var(--color-text-secondary)",
  communication: "var(--color-brand)",
};

function categoryDotColor(category: string): string {
  return CATEGORY_COLORS[category] ?? "var(--color-text-tertiary)";
}

// ---------------------------------------------------------------------------
// Initials helper
// ---------------------------------------------------------------------------

function buildInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RecentActivityFeed({
  entries,
  profileMap,
  maxItems = 5,
  showViewAll = false,
  viewAllHref = "/admin/timeline",
}: Props) {
  const visible = useMemo(() => entries.slice(0, maxItems), [entries, maxItems]);

  if (visible.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-xl border px-6 py-10"
        style={{
          borderColor: "var(--color-warm-gray-200)",
          backgroundColor: "var(--color-white)",
        }}
      >
        <ClockCounterClockwise
          size={28}
          weight="duotone"
          style={{ color: "var(--color-text-tertiary)" }}
        />
        <span
          className="text-sm font-medium"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          No activity yet
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {visible.map((entry, index) => {
        const owner = profileMap[entry.owner_id];
        const initials = buildInitials(
          owner?.full_name || owner?.email || "?",
        );

        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
              delay: index * 0.04,
            }}
            className="flex items-center gap-3 border-b px-1 py-2.5"
            style={{ borderColor: "var(--color-warm-gray-100)" }}
          >
            {/* Owner initials avatar */}
            {owner?.avatar_url ? (
              <img
                src={owner.avatar_url}
                alt=""
                className="shrink-0 rounded-full object-cover"
                style={{ width: 24, height: 24 }}
              />
            ) : (
              <span
                className="inline-flex shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                style={{
                  width: 24,
                  height: 24,
                  backgroundColor: "var(--color-warm-gray-100)",
                  color: "var(--color-text-secondary)",
                }}
              >
                {initials}
              </span>
            )}

            {/* Owner name */}
            <span
              className="shrink-0 text-xs font-medium"
              style={{ color: "var(--color-brand)" }}
            >
              {owner?.full_name || owner?.email || "Unknown"}
            </span>

            {/* Category dot + title */}
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <span
                className="shrink-0 rounded-full"
                style={{
                  width: 6,
                  height: 6,
                  backgroundColor: categoryDotColor(entry.category),
                }}
              />
              <span
                className="truncate text-sm"
                style={{ color: "var(--color-text-primary)" }}
              >
                {entry.title}
              </span>
            </div>

            {/* Relative timestamp */}
            <span
              className="shrink-0 text-xs"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {formatRelative(entry.created_at)}
            </span>
          </motion.div>
        );
      })}

      {/* View all link */}
      {showViewAll && (
        <div className="pt-3">
          <Link
            href={viewAllHref}
            className="text-xs font-semibold outline-none focus-visible:underline"
            style={{ color: "var(--color-brand)" }}
          >
            View all activity
          </Link>
        </div>
      )}
    </div>
  );
}
