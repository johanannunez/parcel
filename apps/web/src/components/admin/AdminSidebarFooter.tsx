"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition, useState, useRef, useEffect } from "react";
import { GearSix, UserSwitch, Power, Sun, Moon, Monitor, CaretDown, Check } from "@phosphor-icons/react";
import { useTheme } from "@/components/ThemeProvider";
import { signOut } from "@/app/(portal)/portal/actions";

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

const THEME_OPTIONS = [
  { value: "light" as const, icon: <Sun size={13} weight="regular" />, label: "Light" },
  { value: "dark" as const, icon: <Moon size={13} weight="regular" />, label: "Dark" },
  { value: "system" as const, icon: <Monitor size={13} weight="regular" />, label: "System" },
] as const;

function ThemeDropdown() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const current = THEME_OPTIONS.find((o) => o.value === theme) ?? THEME_OPTIONS[1];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          padding: "5px 8px",
          borderRadius: "8px",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
          color: "rgba(255,255,255,0.60)",
          fontSize: "12px",
          fontWeight: 500,
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "background 150ms ease, border-color 150ms ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.10)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.16)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.06)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center" }}>{current.icon}</span>
        {current.label}
        <CaretDown size={10} weight="bold" style={{ opacity: 0.5 }} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: 0,
            background: "var(--color-navy)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "10px",
            padding: "4px",
            minWidth: "120px",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)",
            zIndex: 50,
          }}
        >
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setTheme(opt.value); setOpen(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                width: "100%",
                padding: "6px 8px",
                borderRadius: "6px",
                background: theme === opt.value ? "rgba(255,255,255,0.08)" : "transparent",
                border: "none",
                color: theme === opt.value ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.55)",
                fontSize: "12.5px",
                fontWeight: theme === opt.value ? 600 : 400,
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                transition: "background 120ms ease, color 120ms ease",
              }}
              onMouseEnter={(e) => {
                if (theme !== opt.value) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                if (theme !== opt.value) e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center" }}>{opt.icon}</span>
              <span style={{ flex: 1 }}>{opt.label}</span>
              {theme === opt.value && (
                <Check size={11} weight="bold" style={{ color: "var(--color-brand-light)" }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminSidebarFooter({
  userName,
  userEmail,
  initials,
  avatarUrl = null,
}: {
  userName: string;
  userEmail: string;
  initials: string;
  avatarUrl?: string | null;
}) {
  const pathname = usePathname();
  const portalHref = getPortalUrl(pathname ?? "");
  const [signOutPending, startSignOut] = useTransition();

  return (
    <div
      className="mx-3 mb-6 mt-auto border-t pt-2"
      style={{ borderColor: "rgba(255,255,255,0.08)" }}
    >
      {/* Identity row — entire row links to account, gear icon as visual cue */}
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
            style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            {initials}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-semibold leading-tight" style={{ color: "#E0EDF8" }}>
            {userName}
          </div>
          <div className="mt-px truncate text-[11.5px] leading-tight" style={{ color: "rgba(255,255,255,0.40)" }}>
            {userEmail}
          </div>
        </div>
        <GearSix size={15} weight="regular" style={{ color: "rgba(255,255,255,0.35)", flexShrink: 0 }} />
      </Link>

      {/* Portal — full width */}
      <div className="px-0.5 pb-1 pt-0.5">
        <Link
          href={portalHref}
          className="flex w-full items-center justify-center gap-[7px] rounded-[10px] py-2 px-1.5 text-[12.5px] font-medium focus-visible:ring-2 focus-visible:ring-white/40"
          style={{
            color: "rgba(96,185,235,0.85)",
            background: "linear-gradient(135deg, rgba(2,170,235,0.15) 0%, rgba(27,119,190,0.15) 100%)",
            border: "1px solid rgba(2,170,235,0.22)",
            transition: "background 150ms ease, color 150ms ease",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(2,170,235,0.22) 0%, rgba(27,119,190,0.22) 100%)"; e.currentTarget.style.color = "#7dd3fc"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(2,170,235,0.15) 0%, rgba(27,119,190,0.15) 100%)"; e.currentTarget.style.color = "rgba(96,185,235,0.85)"; }}
        >
          <UserSwitch size={15} weight="duotone" className="shrink-0" />
          Portal
        </Link>
      </div>

      {/* Theme dropdown + bare sign out */}
      <div className="mt-1 flex items-center px-0.5 pb-0.5">
        <ThemeDropdown />
        <button
          type="button"
          disabled={signOutPending}
          onClick={() => startSignOut(() => signOut())}
          className="ml-auto flex items-center gap-1.5"
          style={{
            background: "none",
            border: "none",
            color: signOutPending ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.40)",
            fontSize: "12px",
            fontWeight: 500,
            cursor: signOutPending ? "wait" : "pointer",
            fontFamily: "inherit",
            padding: "5px 4px",
            transition: "color 150ms ease",
          }}
          onMouseEnter={(e) => { if (!signOutPending) e.currentTarget.style.color = "#f87171"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = signOutPending ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.40)"; }}
        >
          <Power size={13} weight="regular" />
          {signOutPending ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}
