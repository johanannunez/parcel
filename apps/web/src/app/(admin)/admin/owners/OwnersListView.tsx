"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./OwnersListView.module.css";
import {
  ColumnsPopover,
  DEFAULT_COLUMNS,
  loadColumnsFromStorage,
  type ColumnVisibility,
  type OwnerColumnKey,
} from "./ColumnsPopover";
import type { OwnerRow, OwnerStatus } from "@/lib/admin/owners-list";

type SortMode = "alpha" | "entity";
type StatusFilter = "all" | OwnerStatus;

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "invited", label: "Invited" },
  { value: "not_invited", label: "Not invited" },
  { value: "setting_up", label: "Setting up" },
];

const STATUS_PILL_CLASS: Record<OwnerStatus, string> = {
  active: styles.pillActive,
  invited: styles.pillInvited,
  not_invited: styles.pillNone,
  setting_up: styles.pillSetup,
};

const STATUS_LABEL: Record<OwnerStatus, string> = {
  active: "Active",
  invited: "Invited",
  not_invited: "Not invited",
  setting_up: "Setting up",
};

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #02AAEB, #1B77BE)",
  "linear-gradient(135deg, #8A9AAB, #3C5266)",
  "linear-gradient(135deg, #F59E0B, #B45309)",
  "linear-gradient(135deg, #10B981, #047857)",
  "linear-gradient(135deg, #8B5CF6, #6D28D9)",
  "linear-gradient(135deg, #EF4444, #B91C1C)",
];

function gradientFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatAddedMonth(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function formatAddedFull(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function roleLabel(role: OwnerRow["entityMemberRole"]): string {
  if (role === "primary") return "Primary";
  if (role === "co_owner") return "Co-owner";
  return "Solo owner";
}

/** Grid column template for a row, based on which columns are visible. */
function buildGridTemplate(cols: ColumnVisibility): string {
  const parts: string[] = [];
  parts.push("minmax(200px, 1.4fr)"); // Owner (always)
  if (cols.email) parts.push("minmax(180px, 1.6fr)");
  if (cols.phone) parts.push("minmax(140px, 1fr)");
  if (cols.entity) parts.push("minmax(140px, 1fr)");
  if (cols.properties) parts.push("80px");
  if (cols.status) parts.push("120px");
  if (cols.onboardingProgress) parts.push("100px");
  if (cols.lastActivity) parts.push("120px");
  if (cols.coOwners) parts.push("90px");
  if (cols.addedDate) parts.push("120px");
  parts.push("48px"); // overflow menu
  return parts.join(" ");
}

type CopyKey = `${OwnerColumnKey}:${string}`;

export function OwnersListView({ initialRows }: { initialRows: OwnerRow[] }) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("alpha");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [columns, setColumns] = useState<ColumnVisibility>(DEFAULT_COLUMNS);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [hoveredCell, setHoveredCell] = useState<CopyKey | null>(null);
  const [copiedCell, setCopiedCell] = useState<CopyKey | null>(null);
  const copiedTimer = useRef<number | null>(null);
  const statusWrapRef = useRef<HTMLDivElement | null>(null);

  // Load persisted columns on mount (client-only).
  useEffect(() => {
    setColumns(loadColumnsFromStorage());
  }, []);

  // Close status menu on outside click.
  useEffect(() => {
    if (!statusMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (!statusWrapRef.current?.contains(e.target as Node)) {
        setStatusMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [statusMenuOpen]);

  // Cleanup copied-tooltip timer on unmount.
  useEffect(() => {
    return () => {
      if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
    };
  }, []);

  // Filter rows by search + status.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialRows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!q) return true;
      return (
        row.fullName.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        (row.phone?.toLowerCase().includes(q) ?? false) ||
        (row.entityName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [initialRows, search, statusFilter]);

  // Sort: alpha vs entity-grouped.
  const sortedAlpha = useMemo(() => {
    if (sortMode !== "alpha") return [];
    return [...filtered].sort((a, b) =>
      a.fullName.localeCompare(b.fullName, undefined, { sensitivity: "base" }),
    );
  }, [filtered, sortMode]);

  // Entity-grouped structure.
  type Group = {
    entityId: string | null;
    entityName: string;
    rows: OwnerRow[];
  };
  const grouped: Group[] = useMemo(() => {
    if (sortMode !== "entity") return [];
    const map = new Map<string, Group>();
    const SOLO_KEY = "__solo__";
    for (const row of filtered) {
      const key = row.entityId ?? SOLO_KEY;
      if (!map.has(key)) {
        map.set(key, {
          entityId: row.entityId,
          entityName: row.entityName ?? "No entity",
          rows: [],
        });
      }
      map.get(key)!.rows.push(row);
    }
    // Sort groups: real entities alphabetically, solo group last.
    const list = Array.from(map.values());
    list.sort((a, b) => {
      if (a.entityId === null) return 1;
      if (b.entityId === null) return -1;
      return a.entityName.localeCompare(b.entityName, undefined, {
        sensitivity: "base",
      });
    });
    // Within each group, primary first, then co-owners alphabetically.
    for (const g of list) {
      g.rows.sort((a, b) => {
        if (a.entityMemberRole === "primary" && b.entityMemberRole !== "primary")
          return -1;
        if (b.entityMemberRole === "primary" && a.entityMemberRole !== "primary")
          return 1;
        return a.fullName.localeCompare(b.fullName, undefined, {
          sensitivity: "base",
        });
      });
    }
    return list;
  }, [filtered, sortMode]);

  const gridTemplate = buildGridTemplate(columns);

  function handleRowClick(row: OwnerRow) {
    if (!row.entityId) return; // Solo owners can't be opened yet (no detail route). See plan note.
    router.push(`/admin/owners/${row.entityId}`);
  }

  async function handleCopy(key: CopyKey, value: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedCell(key);
      if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => {
        setCopiedCell(null);
      }, 1200);
    } catch {
      // Silent — user can try again.
    }
  }

  function handleInviteClick() {
    window.dispatchEvent(
      new CustomEvent("admin:create-open", { detail: { kind: "owner" } }),
    );
  }

  function handleExport() {
    console.warn("Export: coming soon");
  }

  const toggleGroup = (key: string) => {
    setCollapsed((v) => ({ ...v, [key]: !v[key] }));
  };

  return (
    <div className={styles.root}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <input
          className={styles.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter owners by name, email, phone, or entity..."
          type="search"
        />

        <div className={styles.sortPills} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={sortMode === "alpha"}
            className={`${styles.sortPill} ${sortMode === "alpha" ? styles.sortPillActive : ""}`}
            onClick={() => setSortMode("alpha")}
          >
            A &rarr; Z
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sortMode === "entity"}
            className={`${styles.sortPill} ${sortMode === "entity" ? styles.sortPillActive : ""}`}
            onClick={() => setSortMode("entity")}
          >
            Group by entity
          </button>
        </div>

        <div className={styles.statusWrap} ref={statusWrapRef}>
          <button
            type="button"
            className={`${styles.filterChip} ${statusMenuOpen ? styles.filterChipOpen : ""}`}
            onClick={() => setStatusMenuOpen((v) => !v)}
            aria-expanded={statusMenuOpen}
          >
            Status
            {statusFilter !== "all" ? `: ${STATUS_LABEL[statusFilter]}` : ""}
            <span className={styles.filterCaret} aria-hidden>
              &#9662;
            </span>
          </button>
          {statusMenuOpen ? (
            <div className={styles.statusMenu} role="menu">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={statusFilter === opt.value}
                  className={`${styles.statusMenuItem} ${statusFilter === opt.value ? styles.statusMenuItemActive : ""}`}
                  onClick={() => {
                    setStatusFilter(opt.value);
                    setStatusMenuOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <ColumnsPopover value={columns} onChange={setColumns} />

        <div className={styles.cta}>
          <span className={styles.countHint}>
            {filtered.length} of {initialRows.length}
          </span>
          <button type="button" className={styles.btn} onClick={handleExport}>
            Export
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleInviteClick}
          >
            + Invite owner
          </button>
        </div>
      </div>

      {/* List */}
      <div className={styles.list}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <strong>No owners match your filters.</strong>
            Try clearing the search or switching the status filter.
          </div>
        ) : sortMode === "alpha" ? (
          renderAlpha(sortedAlpha)
        ) : (
          renderGroups(grouped)
        )}
      </div>
    </div>
  );

  function renderAlpha(rows: OwnerRow[]) {
    const chunks: Array<{ letter: string; rows: OwnerRow[] }> = [];
    let current: { letter: string; rows: OwnerRow[] } | null = null;
    for (const row of rows) {
      const letter = (row.fullName[0] || "?").toUpperCase();
      if (!current || current.letter !== letter) {
        current = { letter, rows: [] };
        chunks.push(current);
      }
      current.rows.push(row);
    }
    return chunks.map((chunk) => (
      <div key={chunk.letter}>
        <div className={styles.alphaHeader}>{chunk.letter}</div>
        {chunk.rows.map((row) => renderRow(row))}
      </div>
    ));
  }

  function renderGroups(groups: Group[]) {
    return groups.map((group) => {
      const key = group.entityId ?? "__solo__";
      const isCollapsed = collapsed[key];
      const memberCount = group.rows.length;
      const propertyCount = group.rows.reduce(
        (sum, r) => sum + r.propertyCount,
        0,
      );
      const isSolo = group.entityId === null;
      const memberLabel =
        memberCount === 1
          ? isSolo
            ? "1 owner"
            : "1 member"
          : isSolo
            ? `${memberCount} owners`
            : `${memberCount} members`;
      const propLabel =
        propertyCount === 1 ? "1 property" : `${propertyCount} properties`;

      return (
        <div key={key}>
          <div
            className={styles.groupHeader}
            onClick={() => toggleGroup(key)}
            role="button"
            aria-expanded={!isCollapsed}
          >
            <span
              className={`${styles.groupCaret} ${isCollapsed ? styles.groupCaretCollapsed : ""}`}
              aria-hidden
            >
              &#9662;
            </span>
            <div
              className={`${styles.groupAvatar} ${isSolo ? styles.groupAvatarMuted : ""}`}
            >
              {isSolo ? <span aria-hidden>&mdash;</span> : initials(group.entityName)}
            </div>
            <div
              className={`${styles.groupName} ${isSolo ? styles.groupNameMuted : ""}`}
            >
              {group.entityName}
            </div>
            <div className={styles.groupMeta}>
              {memberLabel} &middot; {propLabel}
            </div>
            {!isSolo && group.entityId ? (
              <div className={styles.groupActions}>
                <button
                  type="button"
                  className={styles.groupLink}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/admin/owners/${group.entityId}`);
                  }}
                >
                  Open entity
                </button>
              </div>
            ) : null}
          </div>
          {!isCollapsed && group.rows.map((row) => renderRow(row))}
        </div>
      );
    });
  }

  function renderRow(row: OwnerRow) {
    const disabled = !row.entityId;
    return (
      <div
        key={row.id}
        className={`${styles.row} ${disabled ? styles.rowDisabled : ""}`}
        style={{ gridTemplateColumns: gridTemplate }}
        onClick={() => handleRowClick(row)}
      >
        <OwnerCell row={row} />
        {columns.email ? (
          <CopyCell
            columnKey="email"
            row={row}
            value={row.email}
            hoveredCell={hoveredCell}
            setHoveredCell={setHoveredCell}
            copiedCell={copiedCell}
            onCopy={handleCopy}
          />
        ) : null}
        {columns.phone ? (
          <CopyCell
            columnKey="phone"
            row={row}
            value={row.phone ?? ""}
            hoveredCell={hoveredCell}
            setHoveredCell={setHoveredCell}
            copiedCell={copiedCell}
            onCopy={handleCopy}
          />
        ) : null}
        {columns.entity ? (
          <CopyCell
            columnKey="entity"
            row={row}
            value={row.entityName ?? ""}
            hoveredCell={hoveredCell}
            setHoveredCell={setHoveredCell}
            copiedCell={copiedCell}
            onCopy={handleCopy}
          />
        ) : null}
        {columns.properties ? (
          <div className={styles.propsCell}>{row.propertyCount}</div>
        ) : null}
        {columns.status ? (
          <div>
            <span className={`${styles.pill} ${STATUS_PILL_CLASS[row.status]}`}>
              <span className={styles.dot} />
              {STATUS_LABEL[row.status]}
            </span>
          </div>
        ) : null}
        {columns.onboardingProgress ? (
          <div className={styles.copyText}>
            {row.status === "active" ? "100%" : "—"}
          </div>
        ) : null}
        {columns.lastActivity ? <div className={styles.copyText}>—</div> : null}
        {columns.coOwners ? <div className={styles.copyText}>—</div> : null}
        {columns.addedDate ? (
          <div className={styles.copyText}>{formatAddedFull(row.addedAt)}</div>
        ) : null}
        <button
          type="button"
          className={styles.rowMenuBtn}
          aria-label="More actions"
          onClick={(e) => e.stopPropagation()}
        >
          &#8230;
        </button>
      </div>
    );
  }
}

function OwnerCell({ row }: { row: OwnerRow }) {
  return (
    <div className={styles.ownerCell}>
      <div
        className={styles.ownerAvatar}
        style={{ background: gradientFor(row.id) }}
      >
        {row.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.avatarUrl} alt="" />
        ) : (
          initials(row.fullName)
        )}
      </div>
      <div className={styles.ownerText}>
        <div className={styles.ownerName}>{row.fullName}</div>
        <div className={styles.ownerSub}>
          {roleLabel(row.entityMemberRole)} &middot; Added{" "}
          {formatAddedMonth(row.addedAt)}
        </div>
      </div>
    </div>
  );
}

type CopyCellProps = {
  columnKey: OwnerColumnKey;
  row: OwnerRow;
  value: string;
  hoveredCell: CopyKey | null;
  setHoveredCell: (key: CopyKey | null) => void;
  copiedCell: CopyKey | null;
  onCopy: (key: CopyKey, value: string) => void;
};

function CopyCell({
  columnKey,
  row,
  value,
  hoveredCell,
  setHoveredCell,
  copiedCell,
  onCopy,
}: CopyCellProps) {
  const key: CopyKey = `${columnKey}:${row.id}`;
  const hovered = hoveredCell === key;
  const copied = copiedCell === key;
  const empty = !value;

  return (
    <div
      className={`${styles.copyCell} ${hovered && !empty ? styles.copyCellHover : ""}`}
      onMouseEnter={() => setHoveredCell(key)}
      onMouseLeave={() => setHoveredCell(null)}
    >
      <span
        className={`${styles.copyText} ${empty ? styles.copyEmpty : ""}`}
      >
        {value || "—"}
      </span>
      {!empty ? (
        <button
          type="button"
          className={`${styles.copyBtn} ${hovered ? styles.copyBtnVisible : ""}`}
          aria-label={`Copy ${columnKey}`}
          onClick={(e) => {
            e.stopPropagation();
            onCopy(key, value);
          }}
        >
          {/* clipboard glyph */}
          <span aria-hidden>&#10063;</span>
        </button>
      ) : null}
      {copied ? <span className={styles.copyTooltip}>Copied!</span> : null}
    </div>
  );
}
