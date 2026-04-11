"use client";

import Link from "next/link";
import {
  Sun,
  Moon,
  GearSix,
  ShieldCheck,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useTheme } from "@/components/ThemeProvider";

export function SidebarFooter({
  userName,
  userEmail,
  initials,
  avatarUrl = null,
  isAdmin = false,
  signOutSlot,
}: {
  userName: string;
  userEmail: string;
  initials: string;
  avatarUrl?: string | null;
  isAdmin?: boolean;
  signOutSlot: ReactNode;
}) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <div
      className="mx-3 mb-3 mt-auto border-t pt-2"
      style={{ borderColor: "var(--color-warm-gray-200)" }}
    >
      {/* Identity row */}
      <Link
        href="/portal/account"
        className="flex items-center gap-2.5 rounded-lg px-3 pb-1.5 pt-2.5 transition-colors hover:bg-[var(--color-warm-gray-100)]"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={userName}
            className="h-[34px] w-[34px] shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-xs font-semibold tracking-wide"
            style={{
              backgroundColor: "var(--color-warm-gray-100)",
              color: "var(--color-text-primary)",
            }}
          >
            {initials}
          </span>
        )}
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
      </Link>

      {/* Action rows */}
      <div className="pt-1 pb-1">
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

        <button
          type="button"
          onClick={toggleTheme}
          className="sidebar-footer-row"
        >
          {resolvedTheme === "dark" ? (
            <Sun size={15} weight="regular" className="shrink-0" />
          ) : (
            <Moon size={15} weight="regular" className="shrink-0" />
          )}
          {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
        </button>

        {signOutSlot}
      </div>
    </div>
  );
}
