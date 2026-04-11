"use client";

import Link from "next/link";
import {
  Sun,
  Moon,
  Question,
  GearSix,
  UserCircle,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useTheme } from "@/components/ThemeProvider";

export function AdminSidebarFooter({
  userName,
  userEmail,
  initials,
  avatarUrl = null,
  signOutSlot,
}: {
  userName: string;
  userEmail: string;
  initials: string;
  avatarUrl?: string | null;
  signOutSlot: ReactNode;
}) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <div
      className="mx-3 mb-3 mt-auto border-t pt-2"
      style={{ borderColor: "rgba(255,255,255,0.08)" }}
    >
      {/* Identity row */}
      <Link
        href="/admin/account"
        className="flex items-center gap-2.5 rounded-lg px-3 pb-1.5 pt-2.5 transition-colors hover:bg-[rgba(255,255,255,0.04)]"
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
              backgroundColor: "rgba(255,255,255,0.08)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {initials}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div
            className="truncate text-[13.5px] font-semibold leading-tight"
            style={{ color: "#E0EDF8" }}
          >
            {userName}
          </div>
          <div
            className="mt-px truncate text-[11.5px] leading-tight"
            style={{ color: "rgba(255,255,255,0.40)" }}
          >
            {userEmail}
          </div>
        </div>
      </Link>

      {/* Action rows */}
      <div className="pt-1 pb-1">
        <button
          type="button"
          onClick={toggleTheme}
          className="admin-footer-row"
        >
          {resolvedTheme === "dark" ? (
            <Sun size={15} weight="regular" className="shrink-0" />
          ) : (
            <Moon size={15} weight="regular" className="shrink-0" />
          )}
          {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
        </button>

        <Link href="/help" className="admin-footer-row">
          <Question size={15} weight="regular" className="shrink-0" />
          Help
        </Link>

        <Link href="/portal/account" className="admin-footer-row">
          <GearSix size={15} weight="regular" className="shrink-0" />
          Account
        </Link>

        <Link href="/portal/dashboard" className="admin-footer-row">
          <UserCircle size={15} weight="regular" className="shrink-0" />
          Switch to Portal
        </Link>

        {signOutSlot}
      </div>
    </div>
  );
}
