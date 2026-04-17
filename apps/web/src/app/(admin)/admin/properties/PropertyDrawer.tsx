"use client";

import { useEffect } from "react";
import {
  X,
  Bed,
  Bathtub,
  Users,
  Ruler,
  Car,
  MapPin,
  Envelope,
  Calendar,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import styles from "./PropertyDrawer.module.css";
import { PropertyCoverPhoto } from "./PropertyCoverPhoto";
import { StatusPill } from "./StatusPill";
import { resolveOccupancy, type HomesProperty } from "./homes-types";

function formatLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatHomeType(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return raw
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function PropertyDrawer({
  property,
  onClose,
}: {
  property: HomesProperty | null;
  onClose: () => void;
}) {
  const open = property !== null;

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div
        className={`${styles.backdrop} ${open ? styles.backdropOpen : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`${styles.drawer} ${open ? styles.drawerOpen : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
      >
        {property && (
          <div className={styles.inner}>
            <header className={styles.header}>
              <div className={styles.headerTop}>
                <div className={styles.headline}>
                  <h2 className={styles.address}>
                    {property.street}
                    {property.unit && <span className={styles.unit}>{property.unit}</span>}
                  </h2>
                  <p className={styles.location}>
                    <MapPin size={12} weight="duotone" />
                    {property.city}, {property.state}
                    {property.postalCode ? ` ${property.postalCode}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  className={styles.closeBtn}
                  onClick={onClose}
                >
                  <X size={16} weight="bold" />
                </button>
              </div>
            </header>

            <div className={styles.coverWrap}>
              <PropertyCoverPhoto
                src={property.coverPhotoUrl}
                size="lg"
                alt={`${property.street} cover photo`}
                rounded={false}
              />
              <div className={styles.coverOverlay}>
                <StatusPill status={resolveOccupancy(property.bookings)} variant="card" />
              </div>
            </div>

            <div className={styles.body}>
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Specs</h3>
                <div className={styles.specsGrid}>
                  <div className={styles.specTile}>
                    <Bed size={16} weight="duotone" className={styles.specIcon} />
                    <div>
                      <div className={styles.specValue}>{property.bedrooms ?? "—"}</div>
                      <div className={styles.specLabel}>Bedrooms</div>
                    </div>
                  </div>
                  <div className={styles.specTile}>
                    <Bathtub size={16} weight="duotone" className={styles.specIcon} />
                    <div>
                      <div className={styles.specValue}>
                        {property.bathrooms != null
                          ? `${property.bathrooms}${property.halfBathrooms ? ".5" : ""}`
                          : "—"}
                      </div>
                      <div className={styles.specLabel}>Bathrooms</div>
                    </div>
                  </div>
                  <div className={styles.specTile}>
                    <Users size={16} weight="duotone" className={styles.specIcon} />
                    <div>
                      <div className={styles.specValue}>{property.guestCapacity ?? "—"}</div>
                      <div className={styles.specLabel}>Sleeps</div>
                    </div>
                  </div>
                  <div className={styles.specTile}>
                    <Ruler size={16} weight="duotone" className={styles.specIcon} />
                    <div>
                      <div className={styles.specValue}>
                        {property.squareFeet != null
                          ? property.squareFeet.toLocaleString("en-US")
                          : "—"}
                      </div>
                      <div className={styles.specLabel}>Sqft</div>
                    </div>
                  </div>
                  <div className={styles.specTile}>
                    <Car size={16} weight="duotone" className={styles.specIcon} />
                    <div>
                      <div className={styles.specValue}>{property.parkingSpaces ?? "—"}</div>
                      <div className={styles.specLabel}>Parking</div>
                    </div>
                  </div>
                  <div className={styles.specTile}>
                    <div className={styles.specIconBlank} />
                    <div>
                      <div className={styles.specValue}>
                        {formatHomeType(property.homeType) ?? "—"}
                      </div>
                      <div className={styles.specLabel}>Type</div>
                    </div>
                  </div>
                </div>
              </section>

              {property.owners.length > 0 && (
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>Owners</h3>
                  <ul className={styles.ownerList}>
                    {property.owners.map((o) => (
                      <li key={o.id} className={styles.ownerRow}>
                        <div className={styles.ownerName}>{o.name ?? "Unknown"}</div>
                        {o.email && (
                          <a href={`mailto:${o.email}`} className={styles.ownerEmail}>
                            <Envelope size={12} weight="duotone" />
                            {o.email}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Upcoming bookings</h3>
                {property.bookings.length === 0 ? (
                  <p className={styles.emptyText}>No upcoming bookings.</p>
                ) : (
                  <ul className={styles.bookingList}>
                    {property.bookings.slice(0, 6).map((b) => (
                      <li key={b.id} className={styles.bookingRow}>
                        <Calendar size={14} weight="duotone" className={styles.bookingIcon} />
                        <div className={styles.bookingInfo}>
                          <div className={styles.bookingDates}>
                            {formatLongDate(b.checkIn)} → {formatLongDate(b.checkOut)}
                          </div>
                          <div className={styles.bookingMeta}>
                            {b.guestName ?? "Guest"}
                            {b.nights ? ` · ${b.nights} night${b.nights === 1 ? "" : "s"}` : ""}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className={styles.actions}>
                <button type="button" className={styles.primaryAction}>
                  Edit property
                  <ArrowSquareOut size={12} weight="bold" />
                </button>
                <button type="button" className={styles.secondaryAction} onClick={onClose}>
                  Close
                </button>
              </section>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
