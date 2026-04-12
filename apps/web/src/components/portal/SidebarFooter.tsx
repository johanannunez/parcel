"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sun,
  Moon,
  GearSix,
  ShieldStar,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useTheme } from "@/components/ThemeProvider";

function getAdminUrl(pathname: string): string {
  const map: Array<[string, string]> = [
    ["/portal/properties", "/admin/properties"],
    ["/portal/calendar", "/admin/calendar"],
    ["/portal/payouts", "/admin/payouts"],
    ["/portal/messages", "/admin/messages"],
    ["/portal/tasks", "/admin/tasks"],
    ["/portal/timeline", "/admin/timeline"],
    ["/portal/reserve", "/admin/block-requests"],
    ["/portal/account", "/admin/account"],
    ["/portal/help", "/admin/help"],
  ];
  for (const [prefix, dest] of map) {
    if (pathname.startsWith(prefix)) return dest;
  }
  return "/admin";
}

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
  const pathname = usePathname();
  const adminHref = getAdminUrl(pathname ?? "");

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
          <GearSix size={18} weight="duotone" className="shrink-0" />
          Account
        </Link>

        {isAdmin ? (
          <Link
            href={adminHref}
            className="my-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold"
            style={{
              background: "linear-gradient(135deg, #F6A825 0%, #D4860A 100%)",
              color: "#fff",
              boxShadow: "0 2px 8px rgba(196, 120, 10, 0.28)",
              textDecoration: "none",
            }}
          >
            <ShieldStar size={18} weight="duotone" className="shrink-0" style={{ color: "#fff" }} />
            Admin
          </Link>
        ) : null}

        <button
          type="button"
          onClick={toggleTheme}
          className="sidebar-footer-row"
        >
          {resolvedTheme === "dark" ? (
            <Sun size={18} weight="duotone" className="shrink-0" />
          ) : (
            <Moon size={18} weight="duotone" className="shrink-0" />
          )}
          {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
        </button>

        {signOutSlot}
      </div>
    </div>
  );
}
