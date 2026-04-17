"use client";

import { useEffect, useRef, useState } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import styles from "./TopBarSearch.module.css";

/**
 * Tablet + mobile search affordance for the admin top bar.
 * Desktop uses the inline `SidebarSearch` inside the sidebar itself.
 *
 * Tapping the icon opens a full-width overlay with a focused input.
 * This mirrors the behavior of the desktop sidebar search without trying
 * to squeeze a full search input into a narrow mobile header.
 */
export function TopBarSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      // Focus after the sheet animates in so the browser scrolls correctly.
      const id = window.setTimeout(() => inputRef.current?.focus(), 40);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) setOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        aria-label="Open search"
        onClick={() => setOpen(true)}
      >
        <MagnifyingGlass size={16} weight="duotone" />
      </button>

      {open ? (
        <div
          className={styles.scrim}
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className={styles.sheet} role="dialog" aria-modal="true" aria-label="Search">
            <div className={styles.row}>
              <MagnifyingGlass size={18} weight="duotone" className={styles.rowIcon} />
              <input
                ref={inputRef}
                className={styles.input}
                placeholder="Search owners, properties, tasks, files"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search"
              />
              <button
                type="button"
                className={styles.close}
                aria-label="Close search"
                onClick={() => setOpen(false)}
              >
                <X size={14} weight="bold" />
              </button>
            </div>
            <div className={styles.body}>
              <div className={styles.sectionHead}>Actions</div>
              <div className={styles.empty}>
                {query
                  ? `No results yet for "${query}". Filtering ships in the next phase.`
                  : "Type to search owners, properties, tasks, files."}
              </div>
            </div>
            <div className={styles.footer}>
              <span>
                <kbd>↑↓</kbd>Navigate <kbd>↵</kbd>Open
              </span>
              <span>
                <kbd>Esc</kbd>Close
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
