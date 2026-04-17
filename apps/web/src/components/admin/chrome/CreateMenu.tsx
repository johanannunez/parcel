"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CheckSquare,
  EnvelopeSimple,
  CalendarBlank,
  NotePencil,
  House,
  CurrencyDollar,
  UserCircle,
  Target,
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
  | "lead";

const CONTEXTUAL: Array<{ kind: CreateKind; label: string; icon: React.ReactNode; kbd: string }> = [
  { kind: "task",     label: "Task",     icon: <CheckSquare size={13} weight="duotone" />,     kbd: "T" },
  { kind: "email",    label: "Email",    icon: <EnvelopeSimple size={13} weight="duotone" />,  kbd: "E" },
  { kind: "meeting",  label: "Meeting",  icon: <CalendarBlank size={13} weight="duotone" />,   kbd: "M" },
  { kind: "note",     label: "Note",     icon: <NotePencil size={13} weight="duotone" />,      kbd: "N" },
  { kind: "property", label: "Property", icon: <House size={13} weight="duotone" />,           kbd: "P" },
  { kind: "invoice",  label: "Invoice",  icon: <CurrencyDollar size={13} weight="duotone" />,  kbd: "I" },
];

const GLOBAL: Array<{ kind: CreateKind; label: string; icon: React.ReactNode; kbd: string }> = [
  { kind: "owner", label: "Owner", icon: <UserCircle size={13} weight="duotone" />, kbd: "O" },
  { kind: "lead",  label: "Lead",  icon: <Target size={13} weight="duotone" />,     kbd: "L" },
];

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
      const menuWidth = 210;
      const gap = 8;
      if (placement === "sidebar") {
        setCoords({ top: rect.top, left: rect.right + gap });
      } else {
        setCoords({ top: rect.bottom + gap, left: rect.right - menuWidth });
      }
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

  useEffect(() => {
    if (!open) return;
    const keyMap: Record<string, CreateKind> = {
      t: "task", e: "email", m: "meeting", n: "note",
      p: "property", i: "invoice", o: "owner", l: "lead",
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

  function dispatch(kind: CreateKind) {
    window.dispatchEvent(new CustomEvent("admin:create-open", { detail: { kind } }));
    setOpen(false);
  }

  const wrapClass =
    placement === "topbar" ? `${styles.wrap} ${styles.wrapTopbar}` : styles.wrap;

  const menu =
    open && coords ? (
      <div
        ref={menuRef}
        className={styles.menu}
        role="menu"
        style={{ position: "fixed", top: coords.top, left: coords.left, zIndex: 1000 }}
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
