"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CheckSquare,
  AddressBook,
  Kanban,
} from "@phosphor-icons/react";
import styles from "./CreateMenu.module.css";

export type CreateKind =
  | "task"
  | "email"
  | "meeting"
  | "note"
  | "property"
  | "invoice"
  | "owner"
  | "contact"
  | "project";

const CONTEXTUAL: Array<{ kind: CreateKind; label: string; icon: React.ReactNode; kbd: string }> = [
  { kind: "task",     label: "Task",     icon: <CheckSquare size={13} weight="duotone" />,     kbd: "T" },
];

const GLOBAL: Array<{ kind: CreateKind; label: string; icon: React.ReactNode; kbd: string }> = [
  { kind: "contact", label: "Contact", icon: <AddressBook size={13} weight="duotone" />, kbd: "C" },
  { kind: "project", label: "Project", icon: <Kanban size={13} weight="duotone" />,      kbd: "J" },
];

const MENU_WIDTH = 210;
const GAP = 8;

export function CreateMenu({ placement = "sidebar" }: { placement?: "sidebar" | "topbar" } = {}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const updatePosition = () => {
      const rect = btnRef.current!.getBoundingClientRect();
      const vw = window.innerWidth;
      const narrowLayout = vw < 900;

      let top: number;
      let left: number;

      if (placement === "topbar" || narrowLayout) {
        top = rect.bottom + GAP;
        left = rect.right - MENU_WIDTH;
      } else {
        top = rect.top;
        left = rect.right + GAP;
      }

      if (left + MENU_WIDTH > vw - 8) left = vw - MENU_WIDTH - 8;
      if (left < 8) left = 8;
      if (top < 8) top = 8;

      setCoords({ top, left });
    };
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, placement]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    if (open) window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [open]);

  function dispatch(kind: CreateKind) {
    window.dispatchEvent(new CustomEvent("admin:create-open", { detail: { kind } }));
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const keyMap: Record<string, CreateKind> = {
      t: "task", c: "contact", j: "project",
    };
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      const k = keyMap[e.key.toLowerCase()];
      if (k) {
        e.preventDefault();
        dispatch(k);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const wrapClass =
    placement === "topbar" ? `${styles.wrap} ${styles.wrapTopbar}` : styles.wrap;

  const menu =
    open && coords ? (
      <div
        ref={menuRef}
        className={styles.menu}
        role="menu"
        style={{ top: coords.top, left: coords.left }}
      >
        {CONTEXTUAL.map((it) => (
          <button
            key={it.kind}
            type="button"
            className={styles.item}
            onClick={() => dispatch(it.kind)}
          >
            <span className={styles.icon}>{it.icon}</span>
            <span>{it.label}</span>
            <span className={styles.kbd}>{it.kbd}</span>
          </button>
        ))}
        <div className={styles.divider} />
        {GLOBAL.map((it) => (
          <button
            key={it.kind}
            type="button"
            className={styles.item}
            onClick={() => dispatch(it.kind)}
          >
            <span className={styles.icon}>{it.icon}</span>
            <span>{it.label}</span>
            <span className={styles.kbd}>{it.kbd}</span>
          </button>
        ))}
      </div>
    ) : null;

  return (
    <div className={wrapClass} ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        className={styles.btn}
        aria-label="Create new"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        +
      </button>
      {mounted && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}
