"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { FunnelSimple, X } from "@phosphor-icons/react";
import styles from "./HomesView.module.css";
import { CustomSelect } from "@/components/admin/CustomSelect";
import type { HomesProperty } from "./homes-types";
import { resolveOccupancy } from "./homes-types";
import { GalleryCard } from "./GalleryCard";
import { HomesTable } from "./HomesTable";
import { PropertyDrawer } from "./PropertyDrawer";
import { usePropertiesFilter } from "./PropertiesFilterContext";
import { usePropertiesMode } from "./PropertiesModeContext";

type SortKey = "address" | "beds" | "baths" | "sqft" | "sleeps" | "status";

type PropFilters = {
  occupancies: ("occupied" | "upcoming" | "vacant")[];
  homeTypes: string[];
  bedrooms: (1 | 2 | 3 | 4 | 5)[];
  cities: string[];
};

const EMPTY_PROP_FILTERS: PropFilters = {
  occupancies: [],
  homeTypes: [],
  bedrooms: [],
  cities: [],
};

const OCCUPANCY_OPTIONS: { value: "occupied" | "upcoming" | "vacant"; label: string; color: string }[] = [
  { value: "occupied", label: "Occupied", color: "#f59e0b" },
  { value: "upcoming", label: "Upcoming", color: "#60a5fa" },
  { value: "vacant", label: "Vacant", color: "#22c55e" },
];

const BEDROOM_OPTIONS: { value: 1 | 2 | 3 | 4 | 5; label: string }[] = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5+" },
];

function PropertiesFilterPanel({
  filters,
  onChange,
  onClear,
  availableTypes,
  availableCities,
}: {
  filters: PropFilters;
  onChange: (f: PropFilters) => void;
  onClear: () => void;
  availableTypes: string[];
  availableCities: string[];
}) {
  const toggle = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const hasActive =
    filters.occupancies.length > 0 ||
    filters.homeTypes.length > 0 ||
    filters.bedrooms.length > 0 ||
    filters.cities.length > 0;

  return (
    <div className={styles.filterPanel} onClick={(e) => e.stopPropagation()}>
      <div className={styles.filterPanelHeader}>
        <span className={styles.filterPanelTitle}>Filters</span>
        {hasActive && (
          <button type="button" className={styles.filterClearBtn} onClick={onClear}>
            Clear all
          </button>
        )}
      </div>

      <div className={styles.filterSection}>
        <div className={styles.filterSectionLabel}>Occupancy</div>
        <div className={styles.filterPillRow}>
          {OCCUPANCY_OPTIONS.map(({ value, label, color }) => {
            const active = filters.occupancies.includes(value);
            return (
              <button
                key={value}
                type="button"
                className={`${styles.filterPill} ${active ? styles.filterPillActive : ""}`}
                style={active ? { borderColor: color, color, background: `${color}18` } : undefined}
                onClick={() => onChange({ ...filters, occupancies: toggle(filters.occupancies, value) })}
              >
                <span className={styles.filterOccupancyDot} style={{ background: color }} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {availableTypes.length > 0 && (
        <div className={styles.filterSection}>
          <div className={styles.filterSectionLabel}>Property Type</div>
          <div className={styles.filterPillRow}>
            {availableTypes.map((ht) => {
              const active = filters.homeTypes.includes(ht);
              return (
                <button
                  key={ht}
                  type="button"
                  className={`${styles.filterPill} ${active ? styles.filterPillActive : ""}`}
                  onClick={() => onChange({ ...filters, homeTypes: toggle(filters.homeTypes, ht) })}
                >
                  {ht}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className={styles.filterSection}>
        <div className={styles.filterSectionLabel}>Bedrooms</div>
        <div className={styles.filterPillRow}>
          {BEDROOM_OPTIONS.map(({ value, label }) => {
            const active = filters.bedrooms.includes(value);
            return (
              <button
                key={value}
                type="button"
                className={`${styles.filterPill} ${active ? styles.filterPillActive : ""}`}
                onClick={() => onChange({ ...filters, bedrooms: toggle(filters.bedrooms, value) })}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {availableCities.length > 1 && (
        <div className={styles.filterSection}>
          <div className={styles.filterSectionLabel}>City</div>
          <div className={styles.filterPillRow}>
            {availableCities.map((city) => {
              const active = filters.cities.includes(city);
              return (
                <button
                  key={city}
                  type="button"
                  className={`${styles.filterPill} ${active ? styles.filterPillActive : ""}`}
                  onClick={() => onChange({ ...filters, cities: toggle(filters.cities, city) })}
                >
                  {city}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PropertiesFilterChips({
  filters,
  onChange,
  onClear,
}: {
  filters: PropFilters;
  onChange: (f: PropFilters) => void;
  onClear: () => void;
}) {
  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  for (const occ of filters.occupancies) {
    const label = OCCUPANCY_OPTIONS.find((o) => o.value === occ)?.label ?? occ;
    chips.push({
      key: `occ:${occ}`,
      label,
      onRemove: () => onChange({ ...filters, occupancies: filters.occupancies.filter((x) => x !== occ) }),
    });
  }
  for (const ht of filters.homeTypes) {
    chips.push({
      key: `ht:${ht}`,
      label: ht,
      onRemove: () => onChange({ ...filters, homeTypes: filters.homeTypes.filter((x) => x !== ht) }),
    });
  }
  for (const bed of filters.bedrooms) {
    const label = BEDROOM_OPTIONS.find((o) => o.value === bed)?.label ?? String(bed);
    chips.push({
      key: `bed:${bed}`,
      label: `${label} bd`,
      onRemove: () => onChange({ ...filters, bedrooms: filters.bedrooms.filter((x) => x !== bed) }),
    });
  }
  for (const city of filters.cities) {
    chips.push({
      key: `city:${city}`,
      label: city,
      onRemove: () => onChange({ ...filters, cities: filters.cities.filter((x) => x !== city) }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className={styles.chips}>
      {chips.map((c) => (
        <span key={c.key} className={styles.chip}>
          <span className={styles.chipLabel}>{c.label}</span>
          <button
            type="button"
            className={styles.chipRemove}
            onClick={c.onRemove}
            aria-label={`Remove ${c.label} filter`}
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <button type="button" className={styles.chipClearAll} onClick={onClear}>
        Clear all
      </button>
    </div>
  );
}

export function HomesView({
  properties,
}: {
  properties: HomesProperty[];
}) {
  const { mode } = usePropertiesMode();
  const { selection } = usePropertiesFilter();
  const [drawerPropertyId, setDrawerPropertyId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("address");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [propFilters, setPropFilters] = useState<PropFilters>(EMPTY_PROP_FILTERS);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const filterBtnRef = useRef<HTMLButtonElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showFilterPanel) return;
    function handleMouseDown(e: MouseEvent) {
      if (
        filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node) &&
        filterBtnRef.current && !filterBtnRef.current.contains(e.target as Node)
      ) setShowFilterPanel(false);
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [showFilterPanel]);

  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    for (const p of properties) { if (p.homeType) set.add(p.homeType); }
    return Array.from(set).sort();
  }, [properties]);

  const availableCities = useMemo(() => {
    const set = new Set<string>();
    for (const p of properties) { if (p.city) set.add(p.city); }
    return Array.from(set).sort();
  }, [properties]);

  useEffect(() => {
    if (availableCities.length <= 1 && propFilters.cities.length > 0) {
      setPropFilters((f) => ({ ...f, cities: [] }));
    }
  }, [availableCities.length, propFilters.cities.length]);

  const activeFilterCount =
    propFilters.occupancies.length +
    propFilters.homeTypes.length +
    propFilters.bedrooms.length +
    propFilters.cities.length;

  const filtered = useMemo(() => {
    const noSelection = selection.ownerIds.size === 0 && selection.propertyIds.size === 0;
    let list = noSelection
      ? properties
      : properties.filter((p) => {
          if (selection.propertyIds.has(p.id)) return true;
          return p.owners.some((o) => selection.ownerIds.has(o.id));
        });

    if (propFilters.occupancies.length > 0) {
      list = list.filter((p) => {
        const occ = resolveOccupancy(p.bookings);
        return propFilters.occupancies.includes(occ.kind);
      });
    }
    if (propFilters.homeTypes.length > 0) {
      list = list.filter((p) => p.homeType !== null && propFilters.homeTypes.includes(p.homeType));
    }
    if (propFilters.bedrooms.length > 0) {
      list = list.filter((p) => {
        const beds = p.bedrooms;
        if (beds === null) return false;
        return propFilters.bedrooms.some((b) => (b === 5 ? beds >= 5 : beds === b));
      });
    }
    if (propFilters.cities.length > 0) {
      list = list.filter((p) => p.city !== null && propFilters.cities.includes(p.city));
    }
    return list;
  }, [properties, selection, propFilters]);

  const sorted = useMemo(() => {
    if (mode !== "table") return filtered;
    const list = [...filtered];
    list.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "beds": return ((a.bedrooms ?? -1) - (b.bedrooms ?? -1)) * dir;
        case "baths": return ((a.bathrooms ?? -1) - (b.bathrooms ?? -1)) * dir;
        case "sqft": return ((a.squareFeet ?? -1) - (b.squareFeet ?? -1)) * dir;
        case "sleeps": return ((a.guestCapacity ?? -1) - (b.guestCapacity ?? -1)) * dir;
        case "status": return (statusRank(a) - statusRank(b)) * dir;
        case "address":
        default: return a.street.localeCompare(b.street) * dir;
      }
    });
    return list;
  }, [filtered, mode, sortKey, sortDir]);

  const active = properties.find((p) => p.id === drawerPropertyId) ?? null;

  return (
    <div className={styles.page}>
      <div className={styles.filterBar}>
        <div className={styles.filterBtnWrap}>
          <button
            ref={filterBtnRef}
            type="button"
            className={`${styles.toolbarBtn} ${showFilterPanel || activeFilterCount > 0 ? styles.toolbarBtnActive : ""}`}
            onClick={() => setShowFilterPanel((v) => !v)}
            aria-label="Filter properties"
          >
            <FunnelSimple size={14} />
            Filter
            {activeFilterCount > 0 && (
              <span className={styles.toolbarBtnBadge}>{activeFilterCount}</span>
            )}
          </button>
          {showFilterPanel && (
            <div ref={filterPanelRef} className={styles.filterPanelWrap}>
              <PropertiesFilterPanel
                filters={propFilters}
                onChange={setPropFilters}
                onClear={() => setPropFilters(EMPTY_PROP_FILTERS)}
                availableTypes={availableTypes}
                availableCities={availableCities}
              />
            </div>
          )}
        </div>
        <div className={styles.filterBarCount}>
          {filtered.length} of {properties.length}
        </div>
      </div>

      <PropertiesFilterChips
        filters={propFilters}
        onChange={setPropFilters}
        onClear={() => setPropFilters(EMPTY_PROP_FILTERS)}
      />

      {mode === "table" && (
        <div className={styles.sortBar}>
          <div className={styles.sortControl}>
            <label htmlFor="sort-key" className={styles.sortLabel}>
              Sort
            </label>
            <div className={styles.sortSelect}>
              <CustomSelect
                id="sort-key"
                value={sortKey}
                onChange={(v) => setSortKey(v as SortKey)}
                options={[
                  { value: "address", label: "Address" },
                  { value: "beds", label: "Beds" },
                  { value: "baths", label: "Baths" },
                  { value: "sqft", label: "Sqft" },
                  { value: "sleeps", label: "Sleeps" },
                  { value: "status", label: "Status" },
                ]}
              />
            </div>
            <button
              type="button"
              className={styles.sortDir}
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              aria-label={`Sort ${sortDir === "asc" ? "descending" : "ascending"}`}
            >
              {sortDir === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>
      )}

      <div className={styles.content}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <p>No properties match your filters.</p>
          </div>
        ) : (
          <>
            <div
              className={styles.modePane}
              style={{ display: mode === "gallery" ? "block" : "none" }}
              aria-hidden={mode !== "gallery"}
            >
              <div className={styles.galleryList}>
                {filtered.map((p) => (
                  <GalleryCard
                    key={p.id}
                    property={p}
                    onOpen={() => setDrawerPropertyId(p.id)}
                  />
                ))}
              </div>
            </div>
            <div
              className={styles.modePane}
              style={{ display: mode === "table" ? "block" : "none" }}
              aria-hidden={mode !== "table"}
            >
              <HomesTable
                properties={sorted}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={(k) => {
                  if (k === sortKey) {
                    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                  } else {
                    setSortKey(k);
                    setSortDir("asc");
                  }
                }}
                onOpen={(id) => setDrawerPropertyId(id)}
              />
            </div>
          </>
        )}
      </div>

      <PropertyDrawer
        property={active}
        onClose={() => setDrawerPropertyId(null)}
      />
    </div>
  );
}

function statusRank(p: HomesProperty): number {
  const today = Date.now();
  for (const b of p.bookings) {
    const inMs = new Date(b.checkIn).getTime();
    const outMs = new Date(b.checkOut).getTime();
    if (inMs <= today && outMs > today) return 0;
  }
  if (p.bookings.some((b) => new Date(b.checkIn).getTime() > today)) return 1;
  return 2;
}
