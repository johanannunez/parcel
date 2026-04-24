"use client";

import { useState } from "react";
import Link from "next/link";
import { SquaresFour, ListBullets, Bed, Bathtub } from "@phosphor-icons/react";
import type { ClientProperty } from "@/lib/admin/client-detail";
import styles from "./PropertiesTab.module.css";

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function PropertyStatusBadge({
  active,
  setupStatus,
}: {
  active: boolean;
  setupStatus: string;
}) {
  if (!active)
    return (
      <span className={`${styles.badge} ${styles.badgeInactive}`}>
        Inactive
      </span>
    );
  if (setupStatus !== "completed")
    return (
      <span className={`${styles.badge} ${styles.badgeSetup}`}>In Setup</span>
    );
  return (
    <span className={`${styles.badge} ${styles.badgeActive}`}>Active</span>
  );
}

// ---------------------------------------------------------------------------
// Grid card
// ---------------------------------------------------------------------------

function PropertyCard({ property }: { property: ClientProperty }) {
  const address = property.addressLine1 ?? property.label;
  const location = [property.city, property.state].filter(Boolean).join(", ");

  return (
    <Link
      href={`/admin/properties/${property.id}`}
      className={styles.card}
    >
      <div className={styles.cardTop}>
        <p className={styles.cardAddress}>{address}</p>
        {location && <p className={styles.cardCity}>{location}</p>}
      </div>
      <div className={styles.cardBottom}>
        <PropertyStatusBadge
          active={property.active}
          setupStatus={property.setupStatus}
        />
        {property.bedrooms != null && (
          <span className={styles.cardMeta}>
            <Bed size={11} weight="duotone" className={styles.cardMetaIcon} />
            {property.bedrooms}
            <Bathtub
              size={11}
              weight="duotone"
              className={styles.cardMetaIcon}
            />
            {property.bathrooms}
          </span>
        )}
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Table view
// ---------------------------------------------------------------------------

function PropertyTable({ properties }: { properties: ClientProperty[] }) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th className={styles.th}>Address</th>
          <th className={styles.th}>Location</th>
          <th className={styles.th}>Status</th>
          <th className={styles.th}>Beds / Baths</th>
          <th className={styles.th}>Added</th>
        </tr>
      </thead>
      <tbody>
        {properties.map((p) => (
          <tr key={p.id} className={styles.tr}>
            <td className={styles.td}>
              <Link
                href={`/admin/properties/${p.id}`}
                className={styles.tableLink}
              >
                {p.addressLine1 ?? p.label}
              </Link>
            </td>
            <td className={styles.td}>
              {[p.city, p.state].filter(Boolean).join(", ") || "—"}
            </td>
            <td className={styles.td}>
              <PropertyStatusBadge
                active={p.active}
                setupStatus={p.setupStatus}
              />
            </td>
            <td className={styles.td}>
              {p.bedrooms != null
                ? `${p.bedrooms} / ${p.bathrooms}`
                : "—"}
            </td>
            <td className={`${styles.td} ${styles.tdMono}`}>
              {new Date(p.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function PropertiesTab({
  properties,
}: {
  properties: ClientProperty[];
}) {
  const [view, setView] = useState<"grid" | "table">("grid");

  if (properties.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>No properties linked yet.</p>
        <Link href="/admin/properties" className={styles.emptyLink}>
          Browse all properties
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <span className={styles.count}>
          {properties.length}{" "}
          {properties.length === 1 ? "property" : "properties"}
        </span>

        <div className={styles.viewToggle} role="group" aria-label="View mode">
          <button
            type="button"
            className={`${styles.toggleBtn} ${view === "grid" ? styles.toggleActive : ""}`}
            onClick={() => setView("grid")}
            aria-label="Grid view"
            aria-pressed={view === "grid"}
          >
            <SquaresFour
              size={15}
              weight={view === "grid" ? "fill" : "regular"}
            />
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${view === "table" ? styles.toggleActive : ""}`}
            onClick={() => setView("table")}
            aria-label="Table view"
            aria-pressed={view === "table"}
          >
            <ListBullets
              size={15}
              weight={view === "table" ? "fill" : "regular"}
            />
          </button>
        </div>
      </div>

      {view === "grid" ? (
        <div className={styles.grid}>
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <PropertyTable properties={properties} />
        </div>
      )}
    </div>
  );
}
