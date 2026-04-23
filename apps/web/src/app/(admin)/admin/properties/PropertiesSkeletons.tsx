"use client";

import styles from "./PropertiesSkeletons.module.css";

type Dest = "launchpad" | "kanban" | "gallery" | "table";

export function PropertiesSkeleton({ dest }: { dest: Dest }) {
  return (
    <div className={styles.page} aria-busy="true" aria-live="polite">
      <div className={styles.content}>
        {dest === "gallery" && <GallerySkeleton />}
        {dest === "table" && <TableSkeleton />}
        {dest === "launchpad" && <StatusSkeleton />}
        {dest === "kanban" && <KanbanSkeleton />}
      </div>
    </div>
  );
}

function GallerySkeleton() {
  return (
    <div className={styles.galleryList}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={styles.card}>
          <div className={styles.photoSlot}>
            <div className={styles.homeTypeBadge} />
          </div>
          <div className={styles.cardContent}>
            <div className={`${styles.shim} ${styles.address}`} />
            <div className={`${styles.shim} ${styles.location}`} />
            <div className={styles.ownerChips}>
              <div className={styles.ownerChip} />
            </div>
            <div className={styles.specs}>
              <div className={`${styles.shim} ${styles.spec}`} />
              <div className={`${styles.shim} ${styles.spec}`} />
              <div className={`${styles.shim} ${styles.spec}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className={styles.tableSkeleton}>
      <div className={styles.tableHead}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className={`${styles.shim} ${styles.th}`} />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={styles.tableRow}>
          <div className={`${styles.shim} ${styles.td} ${styles.wide}`} />
          <div className={`${styles.shim} ${styles.td}`} />
          <div className={`${styles.shim} ${styles.td} ${styles.narrow}`} />
          <div className={`${styles.shim} ${styles.td} ${styles.narrow}`} />
          <div className={`${styles.shim} ${styles.td} ${styles.narrow}`} />
          <div className={`${styles.shim} ${styles.td} ${styles.narrow}`} />
          <div className={`${styles.shim} ${styles.td} ${styles.pill}`} />
        </div>
      ))}
    </div>
  );
}

function KanbanSkeleton() {
  const stageCounts = [3, 0, 0, 2, 1];
  return (
    <div style={{ display: "flex", gap: "12px", padding: "16px", overflow: "hidden", alignItems: "flex-start" }}>
      {stageCounts.map((count, i) => (
        <div key={i} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
          <div className={`${styles.shim}`} style={{ height: "32px", borderRadius: "8px" }} />
          {Array.from({ length: Math.max(count, 1) }).map((_, j) => (
            <div key={j} className={styles.card} />
          ))}
        </div>
      ))}
    </div>
  );
}

function StatusSkeleton() {
  const bands = ["documents", "finances", "listings"] as const;
  const rowsPerBand = 3;

  return (
    <div className={styles.statusShell}>
      <div className={styles.statusHeadRow}>
        <div className={styles.statusCornerCell}>
          <div className={`${styles.shim} ${styles.statusCornerLabel}`} />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.statusHeadCell}>
            <div className={`${styles.shim} ${styles.statusHeadName}`} />
            <div className={`${styles.shim} ${styles.statusHeadSub}`} />
          </div>
        ))}
      </div>

      {bands.map((band) => (
        <div key={band}>
          <div className={`${styles.statusBand} ${styles[band]}`}>
            <div className={styles.statusBandLabel}>
              <div className={`${styles.shim} ${styles.statusBandDot}`} />
              <div className={`${styles.shim} ${styles.statusBandText}`} />
            </div>
            <div className={styles.statusBandSpacer} />
          </div>
          {Array.from({ length: rowsPerBand }).map((_, i) => (
            <div key={i} className={styles.statusRow}>
              <div className={styles.statusItemCell}>
                <div className={`${styles.shim} ${styles.statusItemLabel}`} />
              </div>
              {Array.from({ length: 5 }).map((__, j) => (
                <div key={j} className={styles.statusCell}>
                  <div className={`${styles.shim} ${styles.statusCellPill}`} />
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
