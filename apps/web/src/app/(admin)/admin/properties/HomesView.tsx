"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CaretDown } from "@phosphor-icons/react";
import styles from "./HomesView.module.css";
import type { HomesMode, HomesProperty } from "./homes-types";
import { GalleryCard } from "./GalleryCard";
import { HomesTable } from "./HomesTable";
import { PropertyDrawer } from "./PropertyDrawer";
import { HomesPageChrome } from "./HomesPageChrome";
import { HomesViewSwitcher } from "./HomesViewSwitcher";
import {
  PropertyFilterPopover,
  type FilterSelection,
} from "./PropertyFilterPopover";

type SortKey = "address" | "beds" | "baths" | "sqft" | "sleeps" | "status";

export function HomesView({
  properties,
  initialMode,
  owners,
}: {
  properties: HomesProperty[];
  initialMode: HomesMode;
  owners: Array<{ id: string; name: string | null }>;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<HomesMode>(initialMode);
  const [selection, setSelection] = useState<FilterSelection>({
    ownerIds: new Set<string>(),
    propertyIds: new Set<string>(),
  });
  const [drawerPropertyId, setDrawerPropertyId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("address");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    const noSelection =
      selection.ownerIds.size === 0 && selection.propertyIds.size === 0;
    if (noSelection) return properties;
    return properties.filter((p) => {
      const ownerMatch = p.owners.some((o) => selection.ownerIds.has(o.id));
      const propertyMatch = selection.propertyIds.has(p.id);
      return ownerMatch || propertyMatch;
    });
  }, [properties, selection]);

  const filterPopoverProperties = useMemo(
    () =>
      properties.map((p) => ({
        id: p.id,
        street: p.street,
        unit: p.unit,
        location: `${p.city}, ${p.state}`,
        owners: p.owners.map((o) => ({ id: o.id, name: o.name })),
      })),
    [properties],
  );

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

  const handleSelectMode = (next: HomesMode) => {
    setMode(next);
    const url = new URL(window.location.href);
    url.searchParams.set("view", "details");
    url.searchParams.set("mode", next);
    router.replace(`${url.pathname}?${url.searchParams.toString()}`, { scroll: false });
  };

  return (
    <HomesPageChrome
      toolbarLeft={
        <>
          <HomesViewSwitcher
            activeKey={mode}
            tabs={[
              {
                key: "status",
                label: "Status",
                href: "/admin/properties?view=launchpad",
              },
              {
                key: "gallery",
                label: "Gallery",
                onClick: () => handleSelectMode("gallery"),
              },
              {
                key: "table",
                label: "Table",
                onClick: () => handleSelectMode("table"),
              },
            ]}
          />
          {mode === "table" && (
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
          )}
        </>
      }
      toolbarRight={
        <PropertyFilterPopover
          owners={owners}
          properties={filterPopoverProperties}
          selection={selection}
          onChange={setSelection}
          totalVisible={filtered.length}
          totalAll={properties.length}
        />
      }
    >
      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <p>No properties match your filters.</p>
        </div>
      ) : mode === "gallery" ? (
        <div className={styles.galleryList}>
          {sorted.map((p) => (
            <GalleryCard
              key={p.id}
              property={p}
              onOpen={() => setDrawerPropertyId(p.id)}
            />
          ))}
        </div>
      ) : (
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
      )}

      <PropertyDrawer
        property={active}
        onClose={() => setDrawerPropertyId(null)}
      />
    </HomesPageChrome>
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
