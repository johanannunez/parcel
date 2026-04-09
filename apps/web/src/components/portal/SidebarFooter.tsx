"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sun,
  Moon,
  Question,
  GearSix,
  ShieldCheck,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";

export function SidebarFooter({
  userName,
  userEmail,
  initials,
  isAdmin = false,
  signOutSlot,
}: {
  userName: string;
  userEmail: string;
  initials: string;
  isAdmin?: boolean;
  signOutSlot: ReactNode;
}) {
  const [toastVisible, setToastVisible] = useState(false);

  function handleThemeToggle() {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  }

  return (
    <div
      className="mx-3 mb-3 mt-auto border-t pt-2"
      style={{ borderColor: "var(--color-warm-gray-200)" }}
    >
      {/* Identity row */}
      <div className="flex items-center gap-2.5 px-3 pb-1.5 pt-2.5">
        <span
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-xs font-semibold tracking-wide"
          style={{
            backgroundColor: "var(--color-warm-gray-100)",
            color: "var(--color-text-primary)",
          }}
        >
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="truncate text-[13.5px] font-semibold leading-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            {userName}
          </div>
          <div
            className="mt-px truncate text-[11.5px] leading-tight"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {userEmail}
          </div>
        </div>
      </div>

      {/* Action rows */}
      <div className="pt-1 pb-1">
        {/* Theme toggle */}
        <div className="relative">
          <button
            type="button"
            onClick={handleThemeToggle}
            className="sidebar-footer-row"
          >
            <Sun size={15} weight="regular" className="shrink-0" />
            Light mode
          </button>
          {toastVisible ? (
            <span
              className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium"
              style={{
                backgroundColor: "var(--color-text-primary)",
                color: "var(--color-white)",
              }}
            >
              Coming soon
            </span>
          ) : null}
        </div>

        <Link href="/help" className="sidebar-footer-row">
          <Question size={15} weight="regular" className="shrink-0" />
          Help
        </Link>

        <Link href="/portal/account" className="sidebar-footer-row">
          <GearSix size={15} weight="regular" className="shrink-0" />
          Account
        </Link>

        {isAdmin ? (
          <Link href="/admin" className="sidebar-footer-row">
            <ShieldCheck size={15} weight="regular" className="shrink-0" />
            Switch to Admin
          </Link>
        ) : null}

        {signOutSlot}
      </div>
    </div>
  );
}
