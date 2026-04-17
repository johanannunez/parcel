"use client";

import { CaretDown, CaretUp } from "@phosphor-icons/react";
import styles from "./HomesTable.module.css";
import { PropertyCoverPhoto } from "./PropertyCoverPhoto";
import { StatusPill } from "./StatusPill";
import { resolveOccupancy, type HomesProperty } from "./homes-types";

type SortKey = "address" | "beds" | "baths" | "sqft" | "sleeps" | "status";

function formatHomeType(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return raw
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function HomesTable({
  properties,
  sortKey,
  sortDir,
  onSort,
  onOpen,
}: {
  properties: HomesProperty[];
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (k: SortKey) => void;
  onOpen: (id: string) => void;
}) {
  const cols: Array<{ key: SortKey | "photo" | "owners" | "type"; label: string; sortable: boolean; align?: "left" | "right" | "center" }> = [
    { key: "photo", label: "", sortable: false },
    { key: "address", label: "Address", sortable: true },
    { key: "owners", label: "Owners", sortable: false },
    { key: "beds", label: "Beds", sortable: true, align: "center" },
    { key: "baths", label: "Baths", sortable: true, align: "center" },
    { key: "sleeps", label: "Sleeps", sortable: true, align: "center" },
    { key: "sqft", label: "Sqft", sortable: true, align: "right" },
    { key: "type", label: "Type", sortable: false },
    { key: "status", label: "Status", sortable: true },
  ];

  return (
    <div className={styles.wrap}>
      <div className={styles.scroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            {cols.map((col) => {
              const sortable = col.sortable;
              const active = sortable && col.key === sortKey;
              return (
                <th
                  key={col.key}
                  className={`${styles.th} ${col.align ? styles[`align_${col.align}`] : ""} ${sortable ? styles.thSortable : ""}`}
                  onClick={() => sortable && onSort(col.key as SortKey)}
                >
                  <span className={styles.thInner}>
                    {col.label}
                    {active &&
                      (sortDir === "asc" ? (
                        <CaretUp size={10} weight="bold" />
                      ) : (
                        <CaretDown size={10} weight="bold" />
                      ))}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {properties.map((p) => {
            const status = resolveOccupancy(p.bookings);
            const homeType = formatHomeType(p.homeType);
            return (
              <tr
                key={p.id}
                className={styles.row}
                onClick={() => onOpen(p.id)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen(p.id);
                  }
                }}
              >
                <td className={styles.td}>
                  <PropertyCoverPhoto
                    src={p.coverPhotoUrl}
                    size="sm"
                    alt={`${p.street} thumbnail`}
                  />
                </td>
                <td className={styles.td}>
                  <div className={styles.addressCell}>
                    <div className={styles.addressLine}>
                      <span className={styles.addressText}>{p.street}</span>
                      {p.unit && <span className={styles.unit}>{p.unit}</span>}
                    </div>
                    <div className={styles.sub}>
                      {p.city}, {p.state}
                    </div>
                  </div>
                </td>
                <td className={styles.td}>
                  {p.owners.length === 0 ? (
                    <span className={styles.ownerText}>—</span>
                  ) : (
                    <ul className={styles.ownerStack}>
                      {p.owners.map((o) => (
                        <li key={o.id} className={styles.ownerItem}>
                          {o.name ?? "Unknown"}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className={`${styles.td} ${styles.align_center}`}>{p.bedrooms ?? "—"}</td>
                <td className={`${styles.td} ${styles.align_center}`}>
                  {p.bathrooms != null ? `${p.bathrooms}${p.halfBathrooms ? ".5" : ""}` : "—"}
                </td>
                <td className={`${styles.td} ${styles.align_center}`}>{p.guestCapacity ?? "—"}</td>
                <td className={`${styles.td} ${styles.align_right}`}>
                  {p.squareFeet != null ? p.squareFeet.toLocaleString("en-US") : "—"}
                </td>
                <td className={styles.td}>
                  <span className={styles.typeCell}>{homeType ?? "—"}</span>
                </td>
                <td className={styles.td}>
                  <StatusPill status={status} variant="row" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
