"use client";

import { useEffect, useState } from "react";
import styles from "./SidebarSearch.module.css";
import { openCommandPalette } from "./CommandPalette";

/**
 * Sidebar search trigger (desktop and landscape tablet, ≥ 1024px).
 * The input is visual only — clicking, focusing, or pressing ⌘K opens the
 * global command palette. The palette owns all actual search behavior.
 */
export function SidebarSearch() {
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform));
  }, []);

  const handleOpen = () => openCommandPalette();

  return (
    <button
      type="button"
      className={styles.trigger}
      aria-label="Open search"
      onClick={handleOpen}
      onFocus={handleOpen}
    >
      <span className={styles.triggerIcon} aria-hidden>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </span>
      <span className={styles.triggerLabel}>Search</span>
      <kbd className={styles.kbdHint} aria-hidden>
        <span className={styles.kbdKey}>{isMac ? "\u2318" : "Ctrl"}</span>
        <span className={styles.kbdKey}>K</span>
      </kbd>
    </button>
  );
}
