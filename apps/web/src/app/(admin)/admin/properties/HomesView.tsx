"use client";

import { useMemo, useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import styles from "./HomesView.module.css";
import type { HomesProperty } from "./homes-types";
import { GalleryCard } from "./GalleryCard";
import { HomesTable } from "./HomesTable";
import { PropertyDrawer } from "./PropertyDrawer";
import { usePropertiesFilter } from "./PropertiesFilterContext";
import { usePropertiesMode } from "./PropertiesModeContext";

type SortKey = "address" | "beds" | "baths" | "sqft" | "sleeps" | "status";

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

  const filtered = useMemo(() => {
    const noSelection =
      selection.ownerIds.size === 0 && selection.propertyIds.size === 0;
    if (noSelection) return properties;
    return properties.filter((p) => {
      if (selection.propertyIds.has(p.id)) return true;
      return p.owners.some((o) => selection.ownerIds.has(o.id));
    });
  }, [properties, selection]);

  const sorted = useMemo(() => {
    if (mode !== "table") return filtered;
    const list = [...filtered];
    list.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "beds":
          return ((a.bedrooms ?? -1) - (b.bedrooms ?? -1)) * dir;
        case "baths":
          return ((a.bathrooms ?? -1) - (b.bathrooms ?? -1)) * dir;
        case "sqft":
          return ((a.squareFeet ?? -1) - (b.squareFeet ?? -1)) * dir;
        case "sleeps":
          return ((a.guestCapacity ?? -1) - (b.guestCapacity ?? -1)) * dir;
        case "status":
          return (statusRank(a) - statusRank(b)) * dir;
        case "address":
        default:
          return a.street.localeCompare(b.street) * dir;
      }
    });
    return list;
  }, [filtered, mode, sortKey, sortDir]);

  const active = properties.find((p) => p.id === drawerPropertyId) ?? null;

  return (
    <div className={styles.page}>
      {mode === "table" && (
        <div className={styles.sortBar}>
          <div className={styles.sortControl}>
            <label htmlFor="sort-key" className={styles.sortLabel}>
              Sort
            </label>
            <div className={styles.sortSelect}>
              <select
                id="sort-key"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
              >
                <option value="address">Address</option>
                <option value="beds">Beds</option>
                <option value="baths">Baths</option>
                <option value="sqft">Sqft</option>
                <option value="sleeps">Sleeps</option>
                <option value="status">Status</option>
              </select>
              <CaretDown size={10} weight="bold" />
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
