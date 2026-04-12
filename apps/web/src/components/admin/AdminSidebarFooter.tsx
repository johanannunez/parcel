"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sun,
  Moon,
  Question,
  GearSix,
  UserSwitch,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useTheme } from "@/components/ThemeProvider";

function getPortalUrl(pathname: string): string {
  const map: Array<[string, string]> = [
    ["/admin/properties", "/portal/properties"],
    ["/admin/calendar", "/portal/calendar"],
    ["/admin/payouts", "/portal/payouts"],
    ["/admin/messages", "/portal/messages"],
    ["/admin/tasks", "/portal/tasks"],
    ["/admin/timeline", "/portal/timeline"],
    ["/admin/block-requests", "/portal/calendar"],
    ["/admin/account", "/portal/account"],
    ["/admin/help", "/portal/help"],
  ];
  for (const [prefix, dest] of map) {
    if (pathname.startsWith(prefix)) return dest;
  }
  return "/portal/dashboard";
}

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
  const pathname = usePathname();
  const portalHref = getPortalUrl(pathname ?? "");

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
          // eslint-disable-next-line @next/next/no-img-element
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
        <Link href="/portal/account" className="admin-footer-row">
          <GearSix size={15} weight="regular" className="shrink-0" />
          Account
        </Link>

        <Link
          href={portalHref}
          className="my-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold"
          style={{
            background: "linear-gradient(135deg, #02AAEB 0%, #1B77BE 100%)",
            color: "#fff",
            boxShadow: "0 2px 8px rgba(2, 170, 235, 0.25)",
            textDecoration: "none",
          }}
        >
          <UserSwitch size={15} weight="duotone" className="shrink-0" style={{ color: "#fff" }} />
          Portal
        </Link>

        <Link href="/help" className="admin-footer-row">
          <Question size={15} weight="regular" className="shrink-0" />
          Help
        </Link>

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

        {signOutSlot}
      </div>
    </div>
  );
}
