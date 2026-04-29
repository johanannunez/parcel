"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  CheckSquare,
  AddressBook,
  Kanban,
  Buildings,
  House,
  CalendarBlank,
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

type MenuItem =
  | { kind: CreateKind; label: string; icon: React.ReactNode; kbd: string; action: "modal" }
  | { kind: "meeting"; label: string; icon: React.ReactNode; kbd: string; action: "navigate"; href: string };

type Section = {
  label: string;
  items: MenuItem[];
};

const SECTIONS: Section[] = [
  {
    label: "Work",
    items: [
      { kind: "task",    label: "Task",    icon: <CheckSquare   size={13} weight="duotone" />, kbd: "T", action: "modal" },
      { kind: "meeting", label: "Meeting", icon: <CalendarBlank size={13} weight="duotone" />, kbd: "M", action: "navigate", href: "/admin/calendar" },
    ],
  },
  {
    label: "People",
    items: [
      { kind: "contact", label: "Contact", icon: <AddressBook size={13} weight="duotone" />, kbd: "C", action: "modal" },
      { kind: "owner",   label: "Owner",   icon: <Buildings    size={13} weight="duotone" />, kbd: "O", action: "modal" },
    ],
  },
  {
    label: "Business",
    items: [
      { kind: "property", label: "Property", icon: <House   size={13} weight="duotone" />, kbd: "P", action: "modal" },
      { kind: "project",  label: "Project",  icon: <Kanban  size={13} weight="duotone" />, kbd: "J", action: "modal" },
    ],
  },
];

const MENU_WIDTH = 220;
const GAP = 8;

export function CreateMenu({ placement = "sidebar" }: { placement?: "sidebar" | "topbar" } = {}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

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

  function dispatchModal(kind: CreateKind) {
    window.dispatchEvent(new CustomEvent("admin:create-open", { detail: { kind } }));
    setOpen(false);
  }

  function handleItem(item: MenuItem) {
    if (item.action === "navigate") {
      router.push(item.href);
      setOpen(false);
    } else {
      dispatchModal(item.kind);
    }
  }

  useEffect(() => {
    if (!open) return;
    const keyMap: Record<string, MenuItem | undefined> = {};
    for (const section of SECTIONS) {
      for (const item of section.items) {
        keyMap[item.kbd.toLowerCase()] = item;
      }
    }
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      const item = keyMap[e.key.toLowerCase()];
      if (item) {
        e.preventDefault();
        handleItem(item);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        {SECTIONS.map((section, si) => (
          <div key={section.label}>
            {si > 0 ? <div className={styles.divider} /> : null}
            <div className={styles.sectionLabel}>{section.label}</div>
            {section.items.map((item) => (
              <button
                key={item.kind}
                type="button"
                className={styles.item}
                onClick={() => handleItem(item)}
              >
                <span className={styles.icon}>{item.icon}</span>
                <span>{item.label}</span>
                <span className={styles.kbd}>{item.kbd}</span>
              </button>
            ))}
          </div>
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
