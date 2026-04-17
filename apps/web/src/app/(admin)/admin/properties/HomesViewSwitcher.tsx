"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { SquaresFour, Table as TableIcon } from "@phosphor-icons/react";
import styles from "./HomesViewSwitcher.module.css";

export type HomesViewKey = "gallery" | "table";

type TabDef = { key: HomesViewKey; label: string; onClick: () => void };

const ICONS: Record<HomesViewKey, React.ReactNode> = {
  gallery: <SquaresFour size={14} weight="duotone" />,
  table: <TableIcon size={14} weight="duotone" />,
};

export function HomesViewSwitcher({
  activeKey,
  tabs,
  subdued = false,
}: {
  activeKey: HomesViewKey | null;
  tabs: TabDef[];
  subdued?: boolean;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<CSSProperties>({ opacity: 0 });

  useLayoutEffect(() => {
    if (!shellRef.current) return;
    if (activeKey === null) {
      setIndicator((prev) => ({ ...prev, opacity: 0 }));
      return;
    }
    const active = shellRef.current.querySelector<HTMLElement>(
      `[data-key="${activeKey}"]`,
    );
    if (!active) {
      setIndicator((prev) => ({ ...prev, opacity: 0 }));
      return;
    }
    const parentRect = shellRef.current.getBoundingClientRect();
    const rect = active.getBoundingClientRect();
    setIndicator({
      transform: `translateX(${rect.left - parentRect.left}px)`,
      width: `${rect.width}px`,
      opacity: 1,
    });
  }, [activeKey, tabs.length, subdued]);

  return (
    <div
      ref={shellRef}
      className={`${styles.switcher} ${subdued ? styles.switcherSubdued : ""}`}
      role="tablist"
      aria-label="View mode"
    >
      <span className={styles.indicator} style={indicator} aria-hidden />
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            data-key={tab.key}
            className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
            onClick={tab.onClick}
          >
            <span className={styles.icon} aria-hidden>
              {ICONS[tab.key]}
            </span>
            <span className={styles.label}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
