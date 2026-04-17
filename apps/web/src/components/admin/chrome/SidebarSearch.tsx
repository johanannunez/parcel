"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./SidebarSearch.module.css";

export function SidebarSearch() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    if (open) window.addEventListener("mousedown", click);
    return () => window.removeEventListener("mousedown", click);
  }, [open]);

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <input
        ref={inputRef}
        className={styles.input}
        placeholder="Search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        aria-label="Search"
      />

      {open ? (
        <div className={styles.dropdown} role="listbox">
          <div className={styles.sectionHead}>Actions</div>
          <div className={styles.empty}>
            {query
              ? `No results yet for "${query}". Filtering ships in the next phase.`
              : "Type to search owners, properties, tasks, files."}
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
      ) : null}
    </div>
  );
}
