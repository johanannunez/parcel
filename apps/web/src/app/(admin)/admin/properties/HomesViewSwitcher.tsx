"use client";

import Link from "next/link";
import { RocketLaunch, SquaresFour, Table as TableIcon } from "@phosphor-icons/react";
import styles from "./HomesViewSwitcher.module.css";

export type HomesViewKey = "status" | "gallery" | "table";

type TabDef =
  | { key: HomesViewKey; label: string; href: string }
  | { key: HomesViewKey; label: string; onClick: () => void };

const ICONS: Record<HomesViewKey, React.ReactNode> = {
  status: <RocketLaunch size={14} weight="duotone" />,
  gallery: <SquaresFour size={14} weight="duotone" />,
  table: <TableIcon size={14} weight="duotone" />,
};

export function HomesViewSwitcher({
  activeKey,
  tabs,
}: {
  activeKey: HomesViewKey;
  tabs: TabDef[];
}) {
  return (
    <div className={styles.switcher} role="tablist" aria-label="View mode">
      <span className={styles.track} aria-hidden />
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        const body = (
          <>
            <span className={styles.icon} aria-hidden>
              {ICONS[tab.key]}
            </span>
            <span className={styles.label}>{tab.label}</span>
          </>
        );
        if ("href" in tab) {
          return (
            <Link
              key={tab.key}
              href={tab.href}
              role="tab"
              aria-selected={isActive}
              className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
            >
              {body}
            </Link>
          );
        }
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
            onClick={tab.onClick}
          >
            {body}
          </button>
        );
      })}
    </div>
  );
}
