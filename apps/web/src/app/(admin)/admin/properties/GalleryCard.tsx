"use client";

import { Bathtub, Bed, Ruler, Users } from "@phosphor-icons/react";
import styles from "./GalleryCard.module.css";
import { PropertyCoverPhoto } from "./PropertyCoverPhoto";
import { StatusPill } from "./StatusPill";
import { resolveOccupancy, type HomesProperty } from "./homes-types";

function formatHomeType(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return raw
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function GalleryCard({
  property,
  onOpen,
}: {
  property: HomesProperty;
  onOpen: () => void;
}) {
  const status = resolveOccupancy(property.bookings);
  const homeType = formatHomeType(property.homeType);

  return (
    <button type="button" className={styles.card} onClick={onOpen}>
      <div className={styles.photoSlot}>
        <PropertyCoverPhoto
          src={property.coverPhotoUrl}
          size="md"
          alt={`${property.street} cover photo`}
          rounded={false}
        />
        {homeType && <span className={styles.homeTypeBadge}>{homeType}</span>}
      </div>

      <div className={styles.content}>
        <div className={styles.headline}>
          <div className={styles.addressLine}>
            <span className={styles.address}>{property.street}</span>
            {property.unit && <span className={styles.unit}>{property.unit}</span>}
          </div>
          <div className={styles.location}>
            {property.city}, {property.state}
            {property.postalCode ? <span className={styles.zip}>{property.postalCode}</span> : null}
          </div>
        </div>

        {property.owners.length > 0 && (
          <div className={styles.ownerChips}>
            {property.owners.map((o) => (
              <span key={o.id} className={styles.ownerChip}>
                {o.name ?? "Unknown"}
              </span>
            ))}
          </div>
        )}

        <div className={styles.specs}>
          {property.bedrooms != null && (
            <span className={styles.spec} title="Bedrooms">
              <Bed size={13} weight="duotone" />
              {property.bedrooms}
            </span>
          )}
          {property.bathrooms != null && (
            <span className={styles.spec} title="Bathrooms">
              <Bathtub size={13} weight="duotone" />
              {property.bathrooms}
              {property.halfBathrooms ? ".5" : ""}
            </span>
          )}
          {property.guestCapacity != null && (
            <span className={styles.spec} title="Sleeps">
              <Users size={13} weight="duotone" />
              {property.guestCapacity}
            </span>
          )}
          {property.squareFeet != null && (
            <span className={styles.spec} title="Square feet">
              <Ruler size={13} weight="duotone" />
              {property.squareFeet.toLocaleString("en-US")}
            </span>
          )}
        </div>

        <div className={styles.footer}>
          <StatusPill status={status} variant="row" />
        </div>
      </div>
    </button>
  );
}
