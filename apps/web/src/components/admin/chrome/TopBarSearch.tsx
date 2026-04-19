"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import styles from "./TopBarSearch.module.css";
import { openCommandPalette } from "./CommandPalette";

/**
 * Mobile top-bar search trigger (< 768px).
 * Icon button that opens the global command palette.
 */
export function TopBarSearch() {
  return (
    <button
      type="button"
      className={styles.trigger}
      aria-label="Open search"
      onClick={() => openCommandPalette()}
    >
      <MagnifyingGlass size={16} weight="duotone" />
    </button>
  );
}
