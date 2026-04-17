"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { CaretDown, MagnifyingGlass, X } from "@phosphor-icons/react";

type Owner = { id: string; name: string | null };
type Property = {
  id: string;
  street: string;
  unit: string | null;
  location: string;
  owners: Owner[];
};

export type FilterSelection = {
  ownerIds: Set<string>;
  propertyIds: Set<string>;
};

type FilterTab = "owners" | "properties";

export type PropertyFilterTriggerProps = {
  open: boolean;
  toggle: () => void;
  hasSelection: boolean;
  totalVisible: number;
  totalAll: number;
  totalSelected: number;
};

export function PropertyFilterPopover({
  owners,
  properties,
  selection,
  onChange,
  totalVisible,
  totalAll,
  renderTrigger,
  hideChips = false,
  popoverAlign = "right",
  hideSearchRow = false,
  externalQuery,
  onExternalQueryChange,
  externalOpen,
  onExternalOpenChange,
  portal = false,
  popoverWidth,
}: {
  owners: Owner[];
  properties: Property[];
  selection: FilterSelection;
  onChange: (next: FilterSelection) => void;
  totalVisible: number;
  totalAll: number;
  renderTrigger?: (props: PropertyFilterTriggerProps) => ReactNode;
  hideChips?: boolean;
  popoverAlign?: "left" | "right";
  hideSearchRow?: boolean;
  externalQuery?: string;
  onExternalQueryChange?: (next: string) => void;
  externalOpen?: boolean;
  onExternalOpenChange?: (next: boolean) => void;
  portal?: boolean;
  popoverWidth?: number;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = (next: boolean) => {
    if (onExternalOpenChange) onExternalOpenChange(next);
    else setInternalOpen(next);
  };
  const [internalQuery, setInternalQuery] = useState("");
  const query = externalQuery ?? internalQuery;
  const setQuery = (next: string) => {
    if (onExternalQueryChange) onExternalQueryChange(next);
    else setInternalQuery(next);
  };
  const [tab, setTab] = useState<FilterTab>("owners");
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [portalRect, setPortalRect] = useState<{ top: number; left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    if (!portal || !open || !triggerRef.current) return;
    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = popoverWidth ?? Math.max(rect.width, 320);
      const left = popoverAlign === "right"
        ? rect.right - width
        : rect.left;
      setPortalRect({
        top: rect.bottom + 8,
        left: Math.max(12, left),
        width,
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [portal, open, popoverAlign, popoverWidth]);

  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (ref.current && ref.current.contains(target)) return;
      if (popoverRef.current && popoverRef.current.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filteredOwners = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? owners.filter((o) => (o.name ?? "").toLowerCase().includes(q))
      : owners;
    // Always alphabetical by name (case-insensitive); unknowns last
    return [...base].sort((a, b) => {
      const an = (a.name ?? "").toLowerCase();
      const bn = (b.name ?? "").toLowerCase();
      if (!an && bn) return 1;
      if (an && !bn) return -1;
      return an.localeCompare(bn);
    });
  }, [owners, query]);

  const filteredProperties = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? properties.filter(
          (p) =>
            p.street.toLowerCase().includes(q) ||
            p.location.toLowerCase().includes(q) ||
            (p.unit ?? "").toLowerCase().includes(q),
        )
      : properties;
    // Alphabetical by street
    return [...base].sort((a, b) =>
      a.street.toLowerCase().localeCompare(b.street.toLowerCase()),
    );
  }, [properties, query]);

  const totalSelected = selection.ownerIds.size + selection.propertyIds.size;
  const hasSelection = totalSelected > 0;

  function toggleOwner(id: string) {
    const next = new Set(selection.ownerIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange({ ...selection, ownerIds: next });
  }

  function toggleProperty(id: string) {
    const next = new Set(selection.propertyIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange({ ...selection, propertyIds: next });
  }

  function clearAll() {
    onChange({ ownerIds: new Set(), propertyIds: new Set() });
    setQuery("");
  }

  const popoverBody = open ? (
    <div
      ref={popoverRef}
      style={{
        position: portal ? "fixed" : "absolute",
        top: portal ? (portalRect?.top ?? 0) : "calc(100% + 6px)",
        left: portal ? (portalRect?.left ?? 0) : popoverAlign === "left" ? 0 : undefined,
        right: portal ? undefined : popoverAlign === "right" ? 0 : undefined,
        width: portal ? (portalRect?.width ?? 320) : "max-content",
        zIndex: 200,
        minWidth: "260px",
        maxWidth: portal ? undefined : "420px",
        maxHeight: "480px",
        borderRadius: "12px",
        border: "1px solid var(--color-warm-gray-200)",
        backgroundColor: "var(--color-white)",
        boxShadow: "0 20px 44px rgba(0,0,0,0.18), 0 4px 10px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {!hideSearchRow && (
        <div
          style={{
            padding: "10px 12px",
            borderBottom: "1px solid var(--color-warm-gray-100)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <MagnifyingGlass size={14} weight="bold" color="var(--color-text-tertiary)" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search owners or properties..."
            autoFocus
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: "13px",
              color: "var(--color-text-primary)",
              background: "transparent",
            }}
          />
          {hasSelection && (
            <button
              type="button"
              onClick={clearAll}
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#02AAEB",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: "2px 4px",
              }}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Segmented toggle: Owners | Properties */}
      <div
        style={{
          padding: hideSearchRow ? "12px 12px 0" : "10px 12px 0",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            padding: "3px",
            borderRadius: "8px",
            backgroundColor: "var(--color-warm-gray-100)",
            border: "1px solid var(--color-warm-gray-200)",
            flex: 1,
          }}
        >
          <SegmentButton
            active={tab === "owners"}
            onClick={() => setTab("owners")}
            label="Owners"
            count={filteredOwners.length}
            selectedCount={selection.ownerIds.size}
          />
          <SegmentButton
            active={tab === "properties"}
            onClick={() => setTab("properties")}
            label="Properties"
            count={filteredProperties.length}
            selectedCount={selection.propertyIds.size}
          />
        </div>
      </div>

      {tab === "owners" ? (
        <ScrollableListWithAlphabet
          items={filteredOwners.map((o) => ({
            id: o.id,
            letter: (o.name ?? "?").trim().charAt(0).toUpperCase() || "?",
            render: (
              <CheckRow
                key={o.id}
                label={o.name ?? "Unknown"}
                sublabel="Shows all their properties"
                checked={selection.ownerIds.has(o.id)}
                onToggle={() => toggleOwner(o.id)}
              />
            ),
          }))}
          emptyText="No owners match"
        />
      ) : (
        <ScrollableListWithAlphabet
          items={filteredProperties.map((p) => ({
            id: p.id,
            letter: p.street.trim().charAt(0).toUpperCase() || "?",
            render: (
              <CheckRow
                key={p.id}
                label={p.unit ? `${p.unit}, ${p.street}` : p.street}
                sublabel={p.location}
                checked={selection.propertyIds.has(p.id)}
                onToggle={() => toggleProperty(p.id)}
              />
            ),
          }))}
          emptyText="No properties match"
        />
      )}

      {/* Footer */}
      <div
        style={{
          padding: "8px 12px",
          borderTop: "1px solid var(--color-warm-gray-100)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "11px",
          color: "var(--color-text-tertiary)",
          backgroundColor: "var(--color-warm-gray-50)",
        }}
      >
        <span>Combine owners + properties freely</span>
        <span style={{ fontWeight: 600, color: "var(--color-text-secondary)" }}>
          {totalVisible} showing
        </span>
      </div>
    </div>
  ) : null;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div ref={triggerRef}>
        {renderTrigger ? (
          renderTrigger({
            open,
            toggle: () => setOpen(!open),
            hasSelection,
            totalVisible,
            totalAll,
            totalSelected,
          })
        ) : (
          <button
          type="button"
          onClick={() => setOpen(!open)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 14px",
            borderRadius: "8px",
            border: "1px solid var(--color-warm-gray-200)",
            backgroundColor: "var(--color-white)",
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--color-text-primary)",
            cursor: "pointer",
            transition: "border-color 120ms ease, box-shadow 120ms ease",
            boxShadow: hasSelection
              ? "0 0 0 3px rgba(2, 170, 235, 0.14)"
              : "none",
            borderColor: hasSelection ? "#02AAEB" : "var(--color-warm-gray-200)",
          }}
        >
          <span style={{ fontWeight: 600 }}>
            {hasSelection ? (
              <>
                <span style={{ color: "#02AAEB" }}>{totalSelected}</span> selected
              </>
            ) : (
              <>
                Showing <span style={{ fontWeight: 700 }}>{totalVisible}</span> of{" "}
                {totalAll}
              </>
            )}
          </span>
          <CaretDown
            size={12}
            weight="bold"
            style={{
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 150ms ease",
              color: "var(--color-text-tertiary)",
            }}
          />
        </button>
        )}
      </div>

      {portal && typeof document !== "undefined"
        ? open && createPortal(popoverBody, document.body)
        : popoverBody}

      {/* Selected chips (below the button, wrap) */}
      {hasSelection && !hideChips && (
        <div
          style={{
            marginTop: "8px",
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {Array.from(selection.ownerIds).map((id) => {
            const o = owners.find((x) => x.id === id);
            if (!o) return null;
            return (
              <SelectionChip
                key={`o-${id}`}
                label={o.name ?? "Unknown"}
                prefix="owner:"
                onRemove={() => toggleOwner(id)}
              />
            );
          })}
          {Array.from(selection.propertyIds).map((id) => {
            const p = properties.find((x) => x.id === id);
            if (!p) return null;
            return (
              <SelectionChip
                key={`p-${id}`}
                label={p.unit ? `${p.unit}, ${p.street}` : p.street}
                prefix=""
                onRemove={() => toggleProperty(id)}
              />
            );
          })}
          <button
            type="button"
            onClick={clearAll}
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--color-text-tertiary)",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: "3px 6px",
            }}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── internals ─── */

function SegmentButton({
  active,
  onClick,
  label,
  count,
  selectedCount,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  selectedCount: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: "6px 10px",
        borderRadius: "6px",
        border: "none",
        backgroundColor: active ? "var(--color-white)" : "transparent",
        fontSize: "12px",
        fontWeight: active ? 700 : 500,
        color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "5px",
        boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
        transition: "background-color 120ms ease, color 120ms ease, box-shadow 120ms ease",
      }}
    >
      <span>{label}</span>
      <span
        style={{
          fontSize: "10px",
          fontWeight: 700,
          padding: "1px 5px",
          borderRadius: "999px",
          backgroundColor: selectedCount > 0
            ? "rgba(2, 170, 235, 0.15)"
            : "var(--color-warm-gray-100)",
          color: selectedCount > 0 ? "#02AAEB" : "var(--color-text-tertiary)",
          fontVariantNumeric: "tabular-nums",
          minWidth: "16px",
          textAlign: "center",
        }}
      >
        {selectedCount > 0 ? selectedCount : count}
      </span>
    </button>
  );
}

function CheckRow({
  label,
  sublabel,
  checked,
  onToggle,
}: {
  label: string;
  sublabel?: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        width: "100%",
        padding: "7px 12px",
        border: "none",
        background: checked ? "rgba(2, 170, 235, 0.06)" : "transparent",
        cursor: "pointer",
        textAlign: "left",
        transition: "background-color 120ms ease",
      }}
      onMouseEnter={(e) => {
        if (!checked) e.currentTarget.style.backgroundColor = "var(--color-warm-gray-50)";
      }}
      onMouseLeave={(e) => {
        if (!checked) e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <span
        aria-hidden
        style={{
          width: "16px",
          height: "16px",
          borderRadius: "4px",
          border: `1.5px solid ${checked ? "#02AAEB" : "var(--color-warm-gray-300, #d1d5db)"}`,
          backgroundColor: checked ? "#02AAEB" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "background-color 120ms ease, border-color 120ms ease",
        }}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M1.5 5.5L4 8L8.5 2.5"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--color-text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
        {sublabel && (
          <div
            style={{
              fontSize: "10.5px",
              color: "var(--color-text-tertiary)",
              marginTop: "1px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {sublabel}
          </div>
        )}
      </div>
    </button>
  );
}

/* ─── Scrollable list with alphabet tick rail ─── */

function ScrollableListWithAlphabet({
  items,
  emptyText,
}: {
  items: Array<{ id: string; letter: string; render: React.ReactNode }>;
  emptyText: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  // Which letters are actually present (as the user sees them)
  const presentLetters = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) set.add(it.letter);
    return set;
  }, [items]);

  // Group items by letter to emit letter anchors between them
  const groups = useMemo(() => {
    const byLetter = new Map<string, typeof items>();
    for (const it of items) {
      const arr = byLetter.get(it.letter) ?? [];
      arr.push(it);
      byLetter.set(it.letter, arr);
    }
    // Preserve the alphabetical order of the letters (items are already sorted)
    const seen = new Set<string>();
    const ordered: Array<{ letter: string; items: typeof items }> = [];
    for (const it of items) {
      if (seen.has(it.letter)) continue;
      seen.add(it.letter);
      ordered.push({ letter: it.letter, items: byLetter.get(it.letter)! });
    }
    return ordered;
  }, [items]);

  // Track which letter-group is currently topmost in the scroll viewport
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    function updateActive() {
      if (!scroller) return;
      const top = scroller.getBoundingClientRect().top;
      let nearest: string | null = null;
      let nearestDelta = Infinity;
      for (const [letter, el] of letterRefs.current) {
        const rect = el.getBoundingClientRect();
        const delta = rect.top - top;
        // Pick the anchor whose top is closest to (but not below) the viewport top
        if (delta <= 8 && Math.abs(delta) < Math.abs(nearestDelta)) {
          nearestDelta = delta;
          nearest = letter;
        }
      }
      setActiveLetter(nearest ?? (groups[0]?.letter ?? null));
    }

    updateActive();
    scroller.addEventListener("scroll", updateActive, { passive: true });
    return () => scroller.removeEventListener("scroll", updateActive);
  }, [groups]);

  function jumpToLetter(letter: string) {
    const el = letterRefs.current.get(letter);
    const scroller = scrollRef.current;
    if (!el || !scroller) return;
    scroller.scrollTo({
      top: el.offsetTop - scroller.offsetTop,
      behavior: "smooth",
    });
  }

  if (items.length === 0) {
    return <EmptyState text={emptyText} />;
  }

  return (
    <div
      style={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        position: "relative",
      }}
    >
      <div
        ref={scrollRef}
        style={{
          overflowY: "auto",
          flex: 1,
          padding: "6px 0 4px",
          scrollbarWidth: "none",
        }}
      >
        {groups.map((g) => (
          <div
            key={g.letter}
            ref={(el) => {
              if (el) letterRefs.current.set(g.letter, el);
              else letterRefs.current.delete(g.letter);
            }}
          >
            {g.items.map((it) => (
              <div key={it.id}>{it.render}</div>
            ))}
          </div>
        ))}
      </div>

      {/* Alphabet ticker rail */}
      <AlphabetTicker
        present={presentLetters}
        active={activeLetter}
        onSelect={jumpToLetter}
      />
    </div>
  );
}

function AlphabetTicker({
  present,
  active,
  onSelect,
}: {
  present: Set<string>;
  active: string | null;
  onSelect: (letter: string) => void;
}) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 6px",
        borderLeft: "1px solid var(--color-warm-gray-100)",
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {letters.map((letter) => {
        const isPresent = present.has(letter);
        const isActive = active === letter;
        return (
          <button
            key={letter}
            type="button"
            disabled={!isPresent}
            onClick={() => isPresent && onSelect(letter)}
            aria-label={`Jump to ${letter}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "14px",
              height: "14px",
              padding: 0,
              border: "none",
              background: "transparent",
              cursor: isPresent ? "pointer" : "default",
              fontSize: "9.5px",
              fontWeight: isActive ? 800 : isPresent ? 600 : 500,
              color: isActive
                ? "#02AAEB"
                : isPresent
                ? "var(--color-text-secondary)"
                : "rgba(0,0,0,0.15)",
              borderRadius: "3px",
              transition: "color 120ms ease, background-color 120ms ease",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              if (isPresent && !isActive) {
                e.currentTarget.style.color = "#02AAEB";
              }
            }}
            onMouseLeave={(e) => {
              if (isPresent && !isActive) {
                e.currentTarget.style.color = "var(--color-text-secondary)";
              }
            }}
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: "8px 14px 12px",
        fontSize: "12px",
        color: "var(--color-text-tertiary)",
        fontStyle: "italic",
      }}
    >
      {text}
    </div>
  );
}

function SelectionChip({
  label,
  prefix,
  onRemove,
}: {
  label: string;
  prefix: string;
  onRemove: () => void;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "3px 4px 3px 9px",
        borderRadius: "999px",
        fontSize: "11.5px",
        fontWeight: 600,
        backgroundColor: "rgba(2, 170, 235, 0.1)",
        color: "#02AAEB",
      }}
    >
      {prefix && (
        <span style={{ fontWeight: 500, opacity: 0.7, marginRight: "1px" }}>{prefix}</span>
      )}
      <span
        style={{
          maxWidth: "160px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "16px",
          height: "16px",
          border: "none",
          borderRadius: "999px",
          background: "transparent",
          color: "#02AAEB",
          cursor: "pointer",
          marginLeft: "1px",
        }}
      >
        <X size={10} weight="bold" />
      </button>
    </span>
  );
}
