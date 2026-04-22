"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import {
  GearSix,
  UserSwitch,
  Sun,
  Moon,
  Monitor,
  Flask,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { toggleShowTestDataAction } from "@/lib/admin/test-data";

function getPortalUrl(pathname: string): string {
  const map: Array<[string, string]> = [
    ["/admin/properties", "/portal/properties"],
    ["/admin/calendar", "/portal/calendar"],
    ["/admin/inbox", "/portal/messages"],
    ["/admin/tasks", "/portal/tasks"],
    ["/admin/timeline", "/portal/timeline"],
    ["/admin/account", "/portal/account"],
    ["/admin/help", "/portal/help"],
  ];
  for (const [prefix, dest] of map) {
    if (pathname.startsWith(prefix)) return dest;
  }
  return "/portal/dashboard";
}

function ThemePill() {
  const { theme, setTheme } = useTheme();

  const segs = [
    { value: "light" as const, icon: <Sun size={15} weight="regular" />, activeStyle: { background: "rgba(251,191,36,0.18)", color: "#fbbf24" }, ariaLabel: "Set theme: light" },
    { value: "dark"  as const, icon: <Moon size={15} weight="regular" />, activeStyle: { background: "rgba(96,165,250,0.18)", color: "#60a5fa" }, ariaLabel: "Set theme: dark" },
    { value: "system" as const, icon: <Monitor size={15} weight="regular" />, activeStyle: { background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,1)" }, ariaLabel: "Set theme: system" },
  ] as const;

  return (
    <div
      className="flex flex-1 items-center gap-0.5 rounded-full p-0.5"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
    >
      {segs.map((seg) => {
        const isActive = theme === seg.value;
        return (
          <button
            key={seg.value}
            type="button"
            onClick={() => setTheme(seg.value)}
            className="flex flex-1 items-center justify-center rounded-full px-2.5 py-1.5 transition-colors"
            style={isActive ? seg.activeStyle : { color: "rgba(255,255,255,0.38)" }}
            aria-label={seg.ariaLabel}
          >
            {seg.icon}
          </button>
        );
      })}
    </div>
  );
}

function TestDataPill({ showTestData }: { showTestData: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <div
      className="flex items-center gap-0.5 rounded-full p-0.5"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
    >
      {/* On segment — Flask, green when active */}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!showTestData) startTransition(async () => {
            try {
              await toggleShowTestDataAction();
            } catch (err) {
              console.error('Failed to toggle test data:', err);
            }
          });
        }}
        className="flex items-center justify-center rounded-full px-2.5 py-1.5 transition-colors"
        style={showTestData
          ? { background: "rgba(52,211,153,0.18)", color: "#34d399" }
          : { color: "rgba(255,255,255,0.38)" }
        }
        aria-label="Show test data"
        aria-pressed={showTestData}
      >
        <Flask size={15} weight="regular" />
      </button>

      {/* Off segment — Flask with backslash overlay, red when active */}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (showTestData) startTransition(async () => {
            try {
              await toggleShowTestDataAction();
            } catch (err) {
              console.error('Failed to toggle test data:', err);
            }
          });
        }}
        className="flex items-center justify-center rounded-full px-2.5 py-1.5 transition-colors"
        style={!showTestData
          ? { background: "rgba(248,113,113,0.18)", color: "#f87171" }
          : { color: "rgba(255,255,255,0.38)" }
        }
        aria-label="Hide test data"
        aria-pressed={!showTestData}
      >
        <span className="relative inline-flex items-center justify-center">
          <Flask size={15} weight="regular" />
          <span
            className="pointer-events-none absolute rounded-sm"
            style={{
              top: "50%",
              left: "50%",
              width: "140%",
              height: "1px",
              background: "currentColor",
              transform: "translate(-50%, -50%) rotate(45deg)",
            }}
          />
        </span>
      </button>
    </div>
  );
}

export function AdminSidebarFooter({
  userName,
  userEmail,
  initials,
  avatarUrl = null,
  signOutSlot,
  showTestData = false,
}: {
  userName: string;
  userEmail: string;
  initials: string;
  avatarUrl?: string | null;
  signOutSlot: ReactNode;
  showTestData?: boolean;
}) {
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
        <Link href="/admin/account" className="admin-footer-row">
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

        {/* Theme + Test data controls */}
        <div className="flex gap-1.5 px-1 pt-1 pb-0.5">
          <ThemePill />
          <TestDataPill showTestData={showTestData} />
        </div>

        {signOutSlot}
      </div>
    </div>
  );
}
