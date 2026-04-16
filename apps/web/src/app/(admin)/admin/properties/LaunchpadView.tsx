"use client";

import { useState, useMemo } from "react";
import { PropertyChecklistCard } from "./PropertyChecklistCard";
import { computeChecklistStats, STATUS_CONFIG, type ChecklistItem } from "@/lib/checklist";

type Owner = {
  id: string;
  name: string | null;
  shortName: string | null;
};

type Property = {
  id: string;
  street: string;
  unit: string | null;
  location: string;
  owners: Owner[];
};

type SortMode = "completion" | "alpha";

export function LaunchpadView({
  properties,
  checklistItems,
  owners,
}: {
  properties: Property[];
  checklistItems: ChecklistItem[];
  owners: Array<{ id: string; name: string | null }>;
}) {
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortMode>("completion");

  // Group checklist items by property
  const itemsByProperty = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>();
    for (const item of checklistItems) {
      const arr = map.get(item.property_id) ?? [];
      arr.push(item);
      map.set(item.property_id, arr);
    }
    return map;
  }, [checklistItems]);

  // Filter properties
  const filtered = useMemo(() => {
    let list = properties;

    if (ownerFilter !== "all") {
      list = list.filter((p) => p.owners.some((o) => o.id === ownerFilter));
    }

    if (statusFilter === "incomplete") {
      list = list.filter((p) => {
        const items = itemsByProperty.get(p.id) ?? [];
        const stats = computeChecklistStats(items);
        return stats.pct < 100;
      });
    } else if (statusFilter === "stuck") {
      list = list.filter((p) => {
        const items = itemsByProperty.get(p.id) ?? [];
        return items.some((i) => i.status === "stuck");
      });
    }

    // Sort
    if (sortBy === "completion") {
      list = [...list].sort((a, b) => {
        const aPct = computeChecklistStats(itemsByProperty.get(a.id) ?? []).pct;
        const bPct = computeChecklistStats(itemsByProperty.get(b.id) ?? []).pct;
        return aPct - bPct; // least complete first
      });
    } else {
      list = [...list].sort((a, b) => a.street.localeCompare(b.street));
    }

    return list;
  }, [properties, ownerFilter, statusFilter, sortBy, itemsByProperty]);

  // Global stats
  const globalStats = computeChecklistStats(checklistItems);
  const propertiesWithChecklists = properties.filter((p) => (itemsByProperty.get(p.id) ?? []).length > 0).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Summary bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          padding: "14px 16px",
          borderRadius: "10px",
          border: "1px solid var(--color-warm-gray-200)",
          backgroundColor: "var(--color-white)",
        }}
      >
        {/* Headline stats */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "16px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {properties.length} {properties.length === 1 ? "Home" : "Homes"}
          </span>
          {globalStats.total > 0 && (
            <>
              <span style={{ fontSize: "13px", color: "var(--color-text-tertiary)" }}>
                {globalStats.pct}% Complete
              </span>
              <span style={{ fontSize: "13px", color: "var(--color-text-tertiary)", fontVariantNumeric: "tabular-nums" }}>
                {globalStats.completed} / {globalStats.total} Done
              </span>
            </>
          )}
          {propertiesWithChecklists < properties.length && (
            <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)", fontStyle: "italic" }}>
              {properties.length - propertiesWithChecklists} not set up
            </span>
          )}
        </div>

        {/* Status pills */}
        {globalStats.total > 0 && (
          <div style={{ display: "flex", gap: "6px", marginLeft: "auto" }}>
            {(["not_started", "in_progress", "pending_owner", "stuck", "completed"] as const).map((s) => {
              const count = s === "completed" ? globalStats.completed
                : s === "in_progress" ? globalStats.inProgress
                : s === "pending_owner" ? globalStats.pendingOwner
                : s === "stuck" ? globalStats.stuck
                : globalStats.notStarted;
              if (count === 0) return null;
              return (
                <span
                  key={s}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "3px 8px",
                    borderRadius: "5px",
                    fontSize: "11px",
                    fontWeight: 600,
                    backgroundColor: STATUS_CONFIG[s].bg,
                    color: STATUS_CONFIG[s].color,
                  }}
                >
                  {count} {STATUS_CONFIG[s].label}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        {/* Owner filter */}
        {owners.length > 1 && (
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid var(--color-warm-gray-200)",
              backgroundColor: "var(--color-white)",
              fontSize: "12px",
              color: "var(--color-text-primary)",
              cursor: "pointer",
            }}
          >
            <option value="all">All owners</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>{o.name ?? o.id}</option>
            ))}
          </select>
        )}

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: "6px 10px",
            borderRadius: "6px",
            border: "1px solid var(--color-warm-gray-200)",
            backgroundColor: "var(--color-white)",
            fontSize: "12px",
            color: "var(--color-text-primary)",
            cursor: "pointer",
          }}
        >
          <option value="all">All statuses</option>
          <option value="incomplete">Incomplete only</option>
          <option value="stuck">Stuck only</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortMode)}
          style={{
            padding: "6px 10px",
            borderRadius: "6px",
            border: "1px solid var(--color-warm-gray-200)",
            backgroundColor: "var(--color-white)",
            fontSize: "12px",
            color: "var(--color-text-primary)",
            cursor: "pointer",
          }}
        >
          <option value="completion">Sort by completion %</option>
          <option value="alpha">Sort A to Z</option>
        </select>

        <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)", marginLeft: "auto" }}>
          Showing {filtered.length} of {properties.length}
        </span>
      </div>

      {/* Property cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filtered.map((p) => (
          <PropertyChecklistCard
            key={p.id}
            propertyId={p.id}
            street={p.street}
            unit={p.unit}
            location={p.location}
            owners={p.owners}
            items={itemsByProperty.get(p.id) ?? []}
          />
        ))}

        {filtered.length === 0 && (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "var(--color-text-tertiary)",
              fontSize: "14px",
            }}
          >
            No properties match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}
