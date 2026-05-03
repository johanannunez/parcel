"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowSquareOut,
  CaretDown,
  RocketLaunch,
  FileText,
  CurrencyDollar,
  Storefront,
} from "@phosphor-icons/react";
import { StatusDropdown } from "./StatusDropdown";
import { seedChecklistForProperty } from "./actions";
import {
  STATUS_CONFIG,
  computeChecklistStats,
  getItemUrl,
  type ChecklistItem,
  type ChecklistCategory,
  type ChecklistStatus,
} from "@/lib/checklist";
import css from "./PropertyChecklistCard.module.css";

/* ─── Constants ─── */

type CategoryIcon = typeof FileText;

const CATEGORY_META: Record<
  ChecklistCategory,
  { label: string; color: string; Icon: CategoryIcon }
> = {
  documents: { label: "Documents", color: "#3b82f6", Icon: FileText },
  finances: { label: "Finances", color: "#f59e0b", Icon: CurrencyDollar },
  listings: { label: "Listings", color: "#8b5cf6", Icon: Storefront },
};

const CATEGORY_ORDER: ChecklistCategory[] = ["documents", "finances", "listings"];

const STATUS_ORDER: ChecklistStatus[] = ["not_started", "in_progress", "pending_owner", "stuck", "completed"];

type Owner = { id: string; name: string | null; shortName: string | null };

/* ─── Thick stacked status bar with numbers inside ─── */

function ThickStatusBar({
  items,
}: {
  items: ChecklistItem[];
}) {
  const stats = computeChecklistStats(items);
  const total = stats.total;
  if (total === 0) return null;

  const segments: Array<{ status: ChecklistStatus; count: number }> = STATUS_ORDER
    .map((s) => ({
      status: s,
      count: s === "completed" ? stats.completed
        : s === "in_progress" ? stats.inProgress
        : s === "pending_owner" ? stats.pendingOwner
        : s === "stuck" ? stats.stuck
        : stats.notStarted,
    }))
    .filter((s) => s.count > 0);

  return (
    <div
      style={{
        display: "flex",
        height: "32px",
        borderRadius: "8px",
        overflow: "hidden",
        backgroundColor: "var(--color-warm-gray-100)",
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.04)",
      }}
    >
      {segments.map((seg) => {
        // Segment width proportional to count of that status out of total.
        const pct = (seg.count / total) * 100;
        // Hide the number inside a segment if it's less than ~8% of total (too thin to read).
        const showNumber = pct >= 8;
        return (
          <div
            key={seg.status}
            title={`${seg.count} ${STATUS_CONFIG[seg.status].label}`}
            style={{
              flex: seg.count,
              backgroundColor: STATUS_CONFIG[seg.status].bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "6px",
              transition: "flex 0.4s ease",
            }}
          >
            {showNumber && (
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#ffffff",
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.01em",
                  textShadow: "0 1px 1px rgba(0,0,0,0.12)",
                }}
              >
                {seg.count}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Unit pill ─── */

function UnitPill({ unit }: { unit: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: "999px",
        fontSize: "13px",
        fontWeight: 700,
        color: "#02AAEB",
        backgroundColor: "rgba(2, 170, 235, 0.12)",
        letterSpacing: "-0.01em",
        lineHeight: 1.3,
        flexShrink: 0,
      }}
    >
      {unit}
    </span>
  );
}

/* ─── Owner pill ─── */

function OwnerPill({ owner }: { owner: Owner }) {
  const label = owner.name ?? "Unknown";
  return (
    <Link
      href="/admin/workspaces?view=active-owners"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "3px 9px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 500,
        color: "var(--color-text-secondary)",
        backgroundColor: "var(--color-warm-gray-100)",
        textDecoration: "none",
        transition: "background-color 0.15s ease, color 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(2, 170, 235, 0.1)";
        e.currentTarget.style.color = "#02AAEB";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "var(--color-warm-gray-100)";
        e.currentTarget.style.color = "var(--color-text-secondary)";
      }}
    >
      {label}
      <ArrowSquareOut size={10} weight="bold" style={{ opacity: 0.4 }} />
    </Link>
  );
}

/* ─── Category column ─── */

function CategoryColumn({
  category,
  items,
  isLast,
}: {
  category: ChecklistCategory;
  items: ChecklistItem[];
  isLast: boolean;
}) {
  const meta = CATEGORY_META[category];
  const stats = computeChecklistStats(items);

  return (
    <div
      style={{
        borderRight: isLast ? "none" : "1px solid var(--color-warm-gray-100)",
      }}
    >
      {/* Column header */}
      <div style={{ padding: "12px 14px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <meta.Icon
              size={13}
              weight="duotone"
              color={meta.color}
              style={{ flexShrink: 0 }}
            />
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {meta.label}
            </span>
          </div>
          <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)", fontVariantNumeric: "tabular-nums" }}>
            {stats.completed}/{stats.total}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            height: "4px",
            borderRadius: "2px",
            overflow: "hidden",
            backgroundColor: "var(--color-warm-gray-100)",
          }}
        >
          {STATUS_ORDER
            .map((s) => ({
              status: s,
              count: s === "completed" ? stats.completed
                : s === "in_progress" ? stats.inProgress
                : s === "pending_owner" ? stats.pendingOwner
                : s === "stuck" ? stats.stuck
                : stats.notStarted,
            }))
            .filter((s) => s.count > 0)
            .map((seg) => (
              <div
                key={seg.status}
                style={{
                  flex: seg.count,
                  backgroundColor: STATUS_CONFIG[seg.status].bg,
                  transition: "flex 0.4s ease",
                }}
              />
            ))}
        </div>
      </div>

      {/* Item rows */}
      <div style={{ padding: "0 0 8px" }}>
        {items.map((item) => {
          const url = getItemUrl(item.item_key);
          return (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "4px 14px",
                gap: "6px",
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Open ${item.label}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                      fontSize: "12px",
                      color: "#02AAEB",
                      textDecoration: "none",
                      fontWeight: 500,
                      lineHeight: 1.3,
                    }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
                    <ArrowSquareOut size={10} weight="bold" style={{ opacity: 0.5, flexShrink: 0 }} />
                  </a>
                ) : (
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--color-text-primary)",
                      fontWeight: 500,
                      lineHeight: 1.3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      display: "block",
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </div>
              <StatusDropdown itemId={item.id} currentStatus={item.status} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Property checklist card ─── */

export function PropertyChecklistCard({
  propertyId,
  street,
  unit,
  location,
  owners,
  items,
  defaultExpanded = false,
}: {
  propertyId: string;
  street: string;
  unit: string | null;
  location: string;
  owners: Owner[];
  items: ChecklistItem[];
  defaultExpanded?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasItems = items.length > 0;
  const stats = computeChecklistStats(items);

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: items
      .filter((i) => i.category === cat)
      .sort((a, b) => a.sort_order - b.sort_order),
  }));

  function handleSeed() {
    startTransition(async () => {
      await seedChecklistForProperty(propertyId);
    });
  }

  return (
    <div
      style={{
        borderRadius: "10px",
        border: "1px solid var(--color-warm-gray-200)",
        backgroundColor: "var(--color-white)",
        overflow: "hidden",
      }}
    >
      {/* ── Header: clickable, address/owners on the left, status bar + caret on the right ── */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
        aria-expanded={expanded}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          gap: "20px",
          flexWrap: "wrap",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        {/* Left: address line + owner pills */}
        <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
          {/* Address line */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              fontSize: "15px",
              color: "var(--color-text-primary)",
              lineHeight: 1.3,
              letterSpacing: "-0.01em",
            }}
          >
            {unit && <UnitPill unit={unit} />}
            <span style={{ fontWeight: 700 }}>{street}</span>
            <span style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}>
              {location}
            </span>
          </div>

          {/* Owner pills */}
          {owners.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              {owners.map((o) => (
                <OwnerPill key={o.id} owner={o} />
              ))}
            </div>
          )}
        </div>

        {/* Right: status bar + percentage + caret */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          {hasItems && (
            <div style={{ minWidth: "240px", width: "260px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                }}
              >
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    color: "var(--color-text-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Status Tracker
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: stats.pct === 100 ? "#16a34a" : "var(--color-text-primary)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {stats.pct}%
                </span>
              </div>
              <ThickStatusBar items={items} />
            </div>
          )}

          {/* Expand/collapse caret */}
          <CaretDown
            size={14}
            weight="bold"
            color="var(--color-text-tertiary)"
            style={{
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
              flexShrink: 0,
            }}
          />
        </div>
      </div>

      {/* ── Category columns or seed button ── */}
      {hasItems ? (
        expanded && (
          <div
            className={css.categoryGrid}
            style={{ borderTop: "1px solid var(--color-warm-gray-100)" }}
          >
            {grouped.map((g, idx) =>
              g.items.length > 0 ? (
                <CategoryColumn
                  key={g.category}
                  category={g.category}
                  items={g.items}
                  isLast={idx === grouped.length - 1}
                />
              ) : null,
            )}
          </div>
        )
      ) : (
        <div
          style={{
            padding: "24px 16px",
            borderTop: "1px solid var(--color-warm-gray-100)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <button
            type="button"
            onClick={handleSeed}
            disabled={isPending}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid #02AAEB",
              backgroundColor: "rgba(2, 170, 235, 0.06)",
              color: "#02AAEB",
              fontSize: "13px",
              fontWeight: 600,
              cursor: isPending ? "wait" : "pointer",
              opacity: isPending ? 0.6 : 1,
            }}
          >
            <RocketLaunch size={15} weight="duotone" />
            {isPending ? "Setting up..." : "Set up checklist"}
          </button>
        </div>
      )}
    </div>
  );
}
