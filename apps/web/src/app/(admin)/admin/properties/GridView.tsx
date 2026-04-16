"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowSquareOut,
  CaretDown,
  FileText,
  CurrencyDollar,
  Storefront,
  FolderOpen,
} from "@phosphor-icons/react";
import { DocumentModal } from "./DocumentModal";
import { updateChecklistStatus } from "./actions";
import {
  CHECKLIST_TEMPLATE,
  STATUS_CONFIG,
  computeChecklistStats,
  getItemUrl,
  getItemKind,
  type ChecklistCategory,
  type ChecklistItem,
  type ChecklistStatus,
} from "@/lib/checklist";
import css from "./GridView.module.css";

/* ─── Types ─── */

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

/* ─── Constants ─── */

// Opaque band colors (equivalent of their rgba @ 6% over white) so the sticky
// category label column never shows content bleeding through when scrolling.
type CategoryIcon = typeof FileText;

const CATEGORY_META: Record<
  ChecklistCategory,
  { label: string; accent: string; band: string; Icon: CategoryIcon }
> = {
  documents: { label: "Documents", accent: "#3b82f6", band: "#eff5fd", Icon: FileText },
  finances: { label: "Finances", accent: "#f59e0b", band: "#fef6ea", Icon: CurrencyDollar },
  listings: { label: "Listings", accent: "#8b5cf6", band: "#f3eefc", Icon: Storefront },
};

const CATEGORY_ORDER: ChecklistCategory[] = ["documents", "finances", "listings"];

const STATUS_ORDER: ChecklistStatus[] = [
  "not_started",
  "in_progress",
  "pending_owner",
  "stuck",
  "completed",
];

const COLUMN_WIDTH = 200; // wider so addresses don't truncate
const LABEL_WIDTH = 300;
const HEADER_HEIGHT = 140;
const CATEGORY_BAND_HEIGHT = 34;
const ROW_HEIGHT = 34;
const MAX_OWNER_CHIPS = 3;

/* ─── Thick mini status bar for column header ─── */

function HeaderStatusBar({ items }: { items: ChecklistItem[] }) {
  const stats = computeChecklistStats(items);
  const total = stats.total;
  if (total === 0) return null;

  const segments = STATUS_ORDER
    .map((s) => ({
      status: s,
      count:
        s === "completed" ? stats.completed
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
        height: "18px",
        borderRadius: "5px",
        overflow: "hidden",
        backgroundColor: "var(--color-warm-gray-100)",
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.04), inset 0 1px 2px rgba(0,0,0,0.06)",
      }}
    >
      {segments.map((seg) => {
        const pct = (seg.count / total) * 100;
        const showNumber = pct >= 14;
        return (
          <div
            key={seg.status}
            title={`${seg.count} ${STATUS_CONFIG[seg.status].label}`}
            style={{
              flex: seg.count,
              background: `linear-gradient(180deg, ${STATUS_CONFIG[seg.status].bg} 0%, ${STATUS_CONFIG[seg.status].bg} 50%, ${shadeHex(STATUS_CONFIG[seg.status].bg, -6)} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "4px",
            }}
          >
            {showNumber && (
              <span
                style={{
                  fontSize: "9.5px",
                  fontWeight: 700,
                  color: "#ffffff",
                  fontVariantNumeric: "tabular-nums",
                  textShadow: "0 1px 1px rgba(0,0,0,0.15)",
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

/* ─── Compact stacked tracker for the corner cell ─── */

function CornerStatusBar({ items }: { items: ChecklistItem[] }) {
  const stats = computeChecklistStats(items);
  const total = stats.total;
  if (total === 0) return null;

  const segments = STATUS_ORDER
    .map((s) => ({
      status: s,
      count:
        s === "completed" ? stats.completed
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
        height: "38px",
        borderRadius: "8px",
        overflow: "hidden",
        backgroundColor: "var(--color-warm-gray-100)",
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.05), inset 0 1px 3px rgba(0,0,0,0.07)",
      }}
    >
      {segments.map((seg) => {
        const pct = (seg.count / total) * 100;
        const showNumber = pct >= 6;
        const cfg = STATUS_CONFIG[seg.status];
        return (
          <div
            key={seg.status}
            title={`${seg.count} ${cfg.label}`}
            style={{
              flex: seg.count,
              background: `linear-gradient(180deg, ${shadeHex(cfg.bg, 6)} 0%, ${cfg.bg} 55%, ${shadeHex(cfg.bg, -10)} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "8px",
            }}
          >
            {showNumber && (
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 800,
                  color: "#ffffff",
                  fontVariantNumeric: "tabular-nums",
                  textShadow: "0 1px 1px rgba(0,0,0,0.18)",
                  letterSpacing: "-0.01em",
                  lineHeight: 1,
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

/* ─── Status cell ─── */

function StatusPill({ item, bare = false }: { item: ChecklistItem; bare?: boolean }) {
  const [status, setStatus] = useState<ChecklistStatus>(item.status);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setStatus(item.status), [item.status]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleSelect(next: ChecklistStatus) {
    if (next === status) {
      setOpen(false);
      return;
    }
    const prev = status;
    setStatus(next);
    setOpen(false);
    setSaving(true);
    const result = await updateChecklistStatus(item.id, next);
    setSaving(false);
    if (!result.ok) setStatus(prev);
  }

  const cfg = STATUS_CONFIG[status];

  return (
    <div ref={ref} style={{ position: "relative", height: "100%", padding: bare ? 0 : "4px" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={saving}
        className={css.statusPill}
        style={{
          width: "100%",
          height: "100%",
          padding: "0 8px",
          border: "none",
          borderRadius: "5px",
          background: `linear-gradient(180deg, ${shadeHex(cfg.bg, 6)} 0%, ${cfg.bg} 55%, ${shadeHex(cfg.bg, -6)} 100%)`,
          color: cfg.color,
          fontSize: "10.5px",
          fontWeight: 700,
          letterSpacing: "0.03em",
          cursor: saving ? "wait" : "pointer",
          textTransform: "uppercase",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.08), 0 1px 0 rgba(0,0,0,0.04)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          transition: "transform 120ms ease, box-shadow 120ms ease, filter 120ms ease",
        }}
        title={cfg.label}
      >
        {cfg.label}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 60,
            minWidth: "170px",
            borderRadius: "8px",
            border: "1px solid var(--color-warm-gray-200)",
            backgroundColor: "var(--color-white)",
            boxShadow: "0 14px 32px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.06)",
            padding: "4px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          {STATUS_ORDER.map((s) => {
            const c = STATUS_CONFIG[s];
            const isSelected = s === status;
            return (
              <button
                key={s}
                type="button"
                onClick={() => handleSelect(s)}
                className={css.menuItem}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "7px 10px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: isSelected ? "var(--color-warm-gray-100)" : "transparent",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--color-text-primary)",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "2px",
                    backgroundColor: c.bg,
                    flexShrink: 0,
                    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
                  }}
                />
                {c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Documents cell: status pill + open-document button ─── */

function DocumentCell({
  item,
  propertyLabel,
  ownerNames,
}: {
  item: ChecklistItem;
  propertyLabel: string;
  ownerNames: string[];
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        padding: "4px",
        gap: "3px",
        alignItems: "stretch",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <StatusPill item={item} bare />
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setModalOpen(true);
        }}
        aria-label={`Open ${item.label}`}
        className={css.docButton}
        style={{
          width: "26px",
          border: "1px solid var(--color-warm-gray-200)",
          borderRadius: "5px",
          backgroundColor: "var(--color-white)",
          color: "var(--color-text-secondary)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
          transition:
            "border-color 120ms ease, color 120ms ease, background-color 120ms ease, box-shadow 120ms ease",
        }}
      >
        <FolderOpen size={13} weight="duotone" />
      </button>

      <DocumentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        itemLabel={item.label}
        itemKey={item.item_key}
        kind={getItemKind(item.item_key) ?? "upload"}
        propertyLabel={propertyLabel}
        ownerNames={ownerNames}
        status={item.status}
      />
    </div>
  );
}

/* ─── Unit pill (small, placed after the street) ─── */

function UnitPill({ unit }: { unit: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "1px 6px",
        borderRadius: "4px",
        fontSize: "10px",
        fontWeight: 700,
        color: "#02AAEB",
        backgroundColor: "rgba(2, 170, 235, 0.12)",
        letterSpacing: "-0.01em",
        lineHeight: 1.4,
        flexShrink: 0,
      }}
    >
      {unit}
    </span>
  );
}

/* ─── Owner chip (compact, first names only in admin) ─── */

function OwnerChip({ owner }: { owner: Owner }) {
  const label = owner.shortName ?? owner.name ?? "Unknown";
  return (
    <Link
      href={`/admin/owners/${owner.id}`}
      className={css.ownerChip}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "2px",
        padding: "1px 6px",
        borderRadius: "4px",
        fontSize: "10.5px",
        fontWeight: 600,
        color: "var(--color-text-secondary)",
        backgroundColor: "var(--color-warm-gray-100)",
        textDecoration: "none",
        maxWidth: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        transition: "background-color 120ms ease, color 120ms ease",
      }}
      title={owner.name ?? label}
    >
      {label}
      <ArrowSquareOut size={9} weight="bold" style={{ opacity: 0.45, flexShrink: 0 }} />
    </Link>
  );
}

/* ─── Grid view ─── */

export function GridView({
  properties: _allProperties,
  visibleProperties,
  checklistItems,
  owners: _owners,
}: {
  properties: Property[];
  visibleProperties: Property[];
  checklistItems: ChecklistItem[];
  owners: Array<{ id: string; name: string | null }>;
}) {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<ChecklistCategory>>(new Set());

  function toggleCategory(cat: ChecklistCategory) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  const itemsMap = useMemo(() => {
    const map = new Map<string, Map<string, ChecklistItem>>();
    for (const item of checklistItems) {
      let inner = map.get(item.property_id);
      if (!inner) {
        inner = new Map();
        map.set(item.property_id, inner);
      }
      inner.set(item.item_key, item);
    }
    return map;
  }, [checklistItems]);

  const globalItems = useMemo(() => {
    return visibleProperties.flatMap((p) => Array.from(itemsMap.get(p.id)?.values() ?? []));
  }, [visibleProperties, itemsMap]);

  const globalStats = useMemo(() => computeChecklistStats(globalItems), [globalItems]);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", flex: 1 }}>
      <div className={css.gridWrapper}>
        <div
          className={css.grid}
          style={{
            gridTemplateColumns: `${LABEL_WIDTH}px repeat(${visibleProperties.length}, minmax(${COLUMN_WIDTH}px, 1fr))`,
            width: "100%",
          }}
        >
          {/* Top-left corner: status tracker for all visible properties */}
          <div
            className={css.cornerCell}
            style={{
              height: `${HEADER_HEIGHT}px`,
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              alignItems: "stretch",
              justifyContent: "space-between",
            }}
          >
            {/* Top row: homes count + percentage */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span
                  style={{
                    fontSize: "22px",
                    fontWeight: 800,
                    color: "var(--color-text-primary)",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {visibleProperties.length}
                </span>
                <span
                  style={{
                    fontSize: "9.5px",
                    color: "var(--color-text-tertiary)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                  }}
                >
                  {visibleProperties.length === 1 ? "Home" : "Homes"}
                </span>
              </div>
              {globalStats.total > 0 && (
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: globalStats.pct === 100 ? "#16a34a" : "var(--color-text-primary)",
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "-0.01em",
                    lineHeight: 1,
                  }}
                >
                  {globalStats.pct}%
                </span>
              )}
            </div>

            {/* Done fraction */}
            {globalStats.total > 0 && (
              <span
                style={{
                  fontSize: "10.5px",
                  color: "var(--color-text-tertiary)",
                  fontVariantNumeric: "tabular-nums",
                  fontWeight: 600,
                }}
              >
                {globalStats.completed}
                <span style={{ opacity: 0.6 }}>/{globalStats.total}</span> items done
              </span>
            )}

            {/* Stacked tracker */}
            {globalStats.total > 0 && <CornerStatusBar items={globalItems} />}
          </div>

          {/* Per-property header cells */}
          {visibleProperties.map((p) => {
            const items = Array.from(itemsMap.get(p.id)?.values() ?? []);
            const stats = computeChecklistStats(items);
            const visibleOwners = p.owners.slice(0, MAX_OWNER_CHIPS);
            const overflow = p.owners.length - visibleOwners.length;
            return (
              <div
                key={p.id}
                className={css.headerCell}
                style={{ height: `${HEADER_HEIGHT}px` }}
              >
                {/* Address block — fixed-height layout so column width stays constant */}
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "var(--color-text-primary)",
                        letterSpacing: "-0.01em",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        minWidth: 0,
                      }}
                      title={p.street}
                    >
                      {p.street}
                    </span>
                    {p.unit && <UnitPill unit={p.unit} />}
                  </div>
                  <span
                    style={{
                      fontSize: "10.5px",
                      color: "var(--color-text-tertiary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      lineHeight: 1.3,
                    }}
                    title={p.location}
                  >
                    {p.location}
                  </span>
                </div>

                {/* Owner chips: fixed 2-row grid regardless of count */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "3px",
                    minHeight: "20px",
                    alignContent: "flex-start",
                  }}
                >
                  {visibleOwners.map((o) => (
                    <OwnerChip key={o.id} owner={o} />
                  ))}
                  {overflow > 0 && (
                    <span
                      style={{
                        fontSize: "10.5px",
                        color: "var(--color-text-tertiary)",
                        padding: "1px 4px",
                        fontWeight: 600,
                      }}
                    >
                      +{overflow}
                    </span>
                  )}
                </div>

                {/* Status bar + stats — always rendered */}
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <HeaderStatusBar items={items} />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "9.5px",
                        color: "var(--color-text-tertiary)",
                        fontVariantNumeric: "tabular-nums",
                        fontWeight: 600,
                      }}
                    >
                      {stats.completed}/{stats.total}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: stats.pct === 100 ? "#16a34a" : "var(--color-text-primary)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {stats.pct}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Category bands + rows */}
          {CATEGORY_ORDER.flatMap((category) => {
            const meta = CATEGORY_META[category];
            const collapsed = collapsedCategories.has(category);
            const templates = CHECKLIST_TEMPLATE.filter((t) => t.category === category).sort(
              (a, b) => a.sort_order - b.sort_order,
            );

            const nodes: React.ReactNode[] = [
              // Category band (sticky-left label)
              <button
                key={`band-label-${category}`}
                type="button"
                onClick={() => toggleCategory(category)}
                className={css.categoryBandLabel}
                style={{
                  height: `${CATEGORY_BAND_HEIGHT}px`,
                  backgroundColor: meta.band,
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
                aria-expanded={!collapsed}
              >
                <CaretDown
                  size={11}
                  weight="bold"
                  color="var(--color-text-tertiary)"
                  style={{
                    transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
                    transition: "transform 150ms ease",
                    flexShrink: 0,
                  }}
                />
                <meta.Icon
                  size={13}
                  weight="duotone"
                  color={meta.accent}
                  style={{ flexShrink: 0 }}
                />
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                  }}
                >
                  {meta.label}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    color: "var(--color-text-tertiary)",
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: 500,
                  }}
                >
                  {templates.length}
                </span>
              </button>,
              // Category band fills across every property column
              ...visibleProperties.map((p) => (
                <div
                  key={`band-${category}-${p.id}`}
                  className={css.categoryBandFill}
                  style={{
                    height: `${CATEGORY_BAND_HEIGHT}px`,
                    backgroundColor: meta.band,
                  }}
                />
              )),
            ];

            // Item rows (skipped when collapsed)
            if (!collapsed) {
              templates.forEach((template, rowIdx) => {
                const zebra = rowIdx % 2 === 0;
                // Both variants must be OPAQUE so the sticky left column
                // fully occludes whatever scrolls behind it. Bumped contrast
                // so the alternating rows read clearly.
                const rowBg = zebra ? "#ffffff" : "#eef1f5";
                const url = getItemUrl(template.item_key);
                nodes.push(
                  <div
                    key={`label-${template.item_key}`}
                    className={css.itemLabelCell}
                    style={{ height: `${ROW_HEIGHT}px`, backgroundColor: rowBg }}
                  >
                    <span
                      style={{
                        fontSize: "10px",
                        color: "var(--color-text-tertiary)",
                        fontVariantNumeric: "tabular-nums",
                        width: "18px",
                        textAlign: "right",
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {rowIdx + 1}
                    </span>
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={css.itemLink}
                        title={template.label}
                      >
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {template.label}
                        </span>
                        <ArrowSquareOut
                          size={10}
                          weight="bold"
                          style={{ opacity: 0.5, flexShrink: 0 }}
                        />
                      </a>
                    ) : (
                      <span
                        style={{
                          color: "var(--color-text-primary)",
                          fontWeight: 500,
                          fontSize: "12.5px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={template.label}
                      >
                        {template.label}
                      </span>
                    )}
                  </div>,
                );
                visibleProperties.forEach((p) => {
                  const item = itemsMap.get(p.id)?.get(template.item_key);
                  const propertyLabel = p.unit
                    ? `${p.unit}, ${p.street}, ${p.location}`
                    : `${p.street}, ${p.location}`;
                  const ownerNames = p.owners
                    .map((o) => o.shortName ?? o.name ?? "Unknown")
                    .filter(Boolean);
                  nodes.push(
                    <div
                      key={`cell-${template.item_key}-${p.id}`}
                      className={css.cell}
                      style={{ height: `${ROW_HEIGHT}px`, backgroundColor: rowBg }}
                    >
                      {item && (
                        category === "documents" ? (
                          <DocumentCell
                            item={item}
                            propertyLabel={propertyLabel}
                            ownerNames={ownerNames}
                          />
                        ) : (
                          <StatusPill item={item} />
                        )
                      )}
                    </div>,
                  );
                });
              });
            }

            return nodes;
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── utility ─── */

function shadeHex(hex: string, percent: number): string {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return hex;
  const [r, g, b] = [m[1], m[2], m[3]].map((x) => parseInt(x, 16));
  const adjust = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c + (percent / 100) * 255)));
  const toHex = (c: number) => c.toString(16).padStart(2, "0");
  return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
}
