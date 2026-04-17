"use client";

import type { ReactNode } from "react";
import styles from "./HomesPageChrome.module.css";

export function HomesPageChrome({
  toolbarLeft,
  toolbarRight,
  children,
}: {
  toolbarLeft: ReactNode;
  toolbarRight?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>{toolbarLeft}</div>
          {toolbarRight && <div className={styles.toolbarRight}>{toolbarRight}</div>}
        </div>
      </header>

      <section className={styles.content}>{children}</section>
    </div>
  );
}
