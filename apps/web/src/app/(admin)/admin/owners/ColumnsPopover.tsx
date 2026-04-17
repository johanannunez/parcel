"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ColumnsPopover.module.css";

export type OwnerColumnKey =
  | "owner"
  | "email"
  | "phone"
  | "entity"
  | "properties"
  | "status"
  | "onboardingProgress"
  | "lastActivity"
  | "coOwners"
  | "addedDate";

export type ColumnVisibility = Record<OwnerColumnKey, boolean>;

export const DEFAULT_COLUMNS: ColumnVisibility = {
  owner: true,
  email: true,
  phone: true,
  entity: true,
  properties: true,
  status: true,
  onboardingProgress: false,
  lastActivity: false,
  coOwners: false,
  addedDate: false,
};

const VISIBLE_COLUMNS: Array<{ key: OwnerColumnKey; label: string; locked?: boolean }> = [
  { key: "owner", label: "Owner", locked: true },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "entity", label: "Entity" },
  { key: "properties", label: "Properties" },
  { key: "status", label: "Status" },
];

const OPTIONAL_COLUMNS: Array<{ key: OwnerColumnKey; label: string }> = [
  { key: "onboardingProgress", label: "Onboarding progress" },
  { key: "lastActivity", label: "Last activity" },
  { key: "coOwners", label: "Co-owners" },
  { key: "addedDate", label: "Added date" },
];

const STORAGE_KEY = "admin:owners-list:columns";

export function loadColumnsFromStorage(): ColumnVisibility {
  if (typeof window === "undefined") return DEFAULT_COLUMNS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COLUMNS;
    const parsed = JSON.parse(raw) as Partial<ColumnVisibility>;
    return { ...DEFAULT_COLUMNS, ...parsed, owner: true };
  } catch {
    return DEFAULT_COLUMNS;
  }
}

function saveColumnsToStorage(value: ColumnVisibility) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Silently ignore storage failures (private mode, quota).
  }
}

type Props = {
  value: ColumnVisibility;
  onChange: (next: ColumnVisibility) => void;
};

export function ColumnsPopover({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  const toggle = (key: OwnerColumnKey) => {
    if (key === "owner") return; // locked
    const next = { ...value, [key]: !value[key] };
    onChange(next);
    saveColumnsToStorage(next);
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={`${styles.chip} ${open ? styles.chipOpen : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={styles.gear} aria-hidden>
          &#9881;
        </span>
        Columns
        <span className={styles.caret} aria-hidden>
          &#9662;
        </span>
      </button>

      {open ? (
        <div className={styles.popover} role="menu">
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Visible columns</div>
            <ul className={styles.list}>
              {VISIBLE_COLUMNS.map((c) => (
                <li key={c.key} className={styles.row}>
                  <span className={styles.rowLabel}>{c.label}</span>
                  <ToggleSwitch
                    checked={value[c.key]}
                    disabled={c.locked}
                    onChange={() => toggle(c.key)}
                    label={c.label}
                  />
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.divider} />
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Optional</div>
            <ul className={styles.list}>
              {OPTIONAL_COLUMNS.map((c) => (
                <li key={c.key} className={styles.row}>
                  <span className={styles.rowLabel}>{c.label}</span>
                  <ToggleSwitch
                    checked={value[c.key]}
                    onChange={() => toggle(c.key)}
                    label={c.label}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ToggleSwitch({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`Toggle ${label}`}
      disabled={disabled}
      onClick={onChange}
      className={`${styles.switch} ${checked ? styles.switchOn : ""} ${disabled ? styles.switchDisabled : ""}`}
    >
      <span className={styles.switchThumb} />
    </button>
  );
}
