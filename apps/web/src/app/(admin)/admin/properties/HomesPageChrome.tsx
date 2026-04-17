"use client";

import { useEffect, useState, type ReactNode } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import styles from "./HomesPageChrome.module.css";

type SearchVariant =
  | { kind: "static" }
  | {
      kind: "input";
      value: string;
      onChange: (next: string) => void;
      placeholder?: string;
    };

export function HomesPageChrome({
  title,
  subtitle,
  search = { kind: "static" },
  toolbarLeft,
  toolbarRight,
  children,
}: {
  title: string;
  subtitle: string;
  search?: SearchVariant;
  toolbarLeft: ReactNode;
  toolbarRight?: ReactNode;
  children: ReactNode;
}) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const dateLabel = now
    ? now.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "";
  const timeLabel = now
    ? now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : "";

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.banner}>
          <div className={styles.bannerInner}>
            <div className={styles.titleBlock}>
              <h1 className={styles.title}>{title}</h1>
              <p className={styles.subtitle}>{subtitle}</p>
            </div>

            <div className={styles.bannerTools}>
              {search.kind === "input" ? (
                <div className={styles.searchWrap}>
                  <MagnifyingGlass size={14} weight="bold" className={styles.searchIcon} />
                  <input
                    type="text"
                    value={search.value}
                    onChange={(e) => search.onChange(e.target.value)}
                    placeholder={search.placeholder ?? "Search address, city, owner..."}
                    className={styles.searchInput}
                  />
                  <span className={styles.kbd}>⌘K</span>
                </div>
              ) : (
                <button type="button" className={styles.searchWrapStatic} aria-label="Search (⌘K)">
                  <MagnifyingGlass size={14} weight="bold" className={styles.searchIcon} />
                  <span className={styles.searchPlaceholder}>Search properties, items...</span>
                  <span className={styles.kbd}>⌘K</span>
                </button>
              )}

              {now && (
                <div className={styles.clock}>
                  <span className={styles.clockDate}>{dateLabel}</span>
                  <span className={styles.clockTime}>{timeLabel}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>{toolbarLeft}</div>
          {toolbarRight && <div className={styles.toolbarRight}>{toolbarRight}</div>}
        </div>
      </header>

      <section className={styles.content}>{children}</section>
    </div>
  );
}
