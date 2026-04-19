"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import styles from "./SidebarDrawer.module.css";

export function openSidebarDrawer() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("admin:sidebar-drawer-open"));
  }
}

export function closeSidebarDrawer() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("admin:sidebar-drawer-close"));
  }
}

type Props = {
  userName: string;
  userEmail: string;
  initials: string;
  avatarUrl?: string | null;
  pendingBlockCount: number;
  signOutSlot: ReactNode;
};

export function SidebarDrawer({
  userName,
  userEmail,
  initials,
  avatarUrl = null,
  pendingBlockCount,
  signOutSlot,
}: Props) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const openHandler = () => setOpen(true);
    const closeHandler = () => setOpen(false);
    const key = (e: KeyboardEvent) => { if (e.key === "Escape" && open) setOpen(false); };
    window.addEventListener("admin:sidebar-drawer-open", openHandler);
    window.addEventListener("admin:sidebar-drawer-close", closeHandler);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("admin:sidebar-drawer-open", openHandler);
      window.removeEventListener("admin:sidebar-drawer-close", closeHandler);
      window.removeEventListener("keydown", key);
    };
  }, [open]);

  // Close when viewport crosses to desktop (≥ 1024) or phone (< 768).
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(min-width: 1024px), (max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => { if (e.matches) setOpen(false); };
    if (mq.matches) setOpen(false);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [open]);

  // Auto-close when pathname changes (any nav link click closes the drawer).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Bulletproof body scroll lock while drawer is open.
  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  if (!mounted || !open) return null;

  const content = (
    <div
      className={styles.scrim}
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div className={styles.panel} role="dialog" aria-modal="true" aria-label="Sidebar">
        <AdminSidebar
          userName={userName}
          userEmail={userEmail}
          initials={initials}
          avatarUrl={avatarUrl}
          pendingBlockCount={pendingBlockCount}
          signOutSlot={signOutSlot}
        />
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
