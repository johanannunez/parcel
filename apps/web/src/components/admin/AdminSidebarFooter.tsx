"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { GearSix, UserSwitch, Power, Sun, Moon, Monitor } from "@phosphor-icons/react";
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

const THEME_SEGS = [
  { value: "light" as const, icon: <Sun size={14} weight="regular" />, activeStyle: { background: "rgba(251,191,36,0.18)", color: "#fbbf24" }, label: "Light" },
  { value: "dark"  as const, icon: <Moon size={14} weight="regular" />, activeStyle: { background: "rgba(96,165,250,0.18)", color: "#60a5fa" }, label: "Dark" },
  { value: "system" as const, icon: <Monitor size={14} weight="regular" />, activeStyle: { background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,1)" }, label: "System" },
] as const;

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
  const { theme, setTheme } = useTheme();
  const [signOutPending, startSignOut] = useTransition();

  return (
    <div
      className="mx-3 mb-6 mt-auto border-t pt-2"
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
      </Link>

      {/* Account + Portal two-column cards */}
      <div className="flex gap-1.5 px-0.5 pb-1 pt-0.5">
        <Link
          href="/admin/account"
          className="flex flex-1 items-center justify-center gap-[7px] rounded-[10px] py-2 px-1.5 text-[12.5px] font-medium focus-visible:ring-2 focus-visible:ring-white/40"
          style={{
            color: "rgba(255,255,255,0.50)",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            transition: "background-color 150ms ease, color 150ms ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.50)"; }}
        >
          <GearSix size={15} weight="regular" className="shrink-0" />
          Account
        </Link>
        <Link
          href={portalHref}
          className="flex flex-1 items-center justify-center gap-[7px] rounded-[10px] py-2 px-1.5 text-[12.5px] font-medium focus-visible:ring-2 focus-visible:ring-white/40"
          style={{
            color: "rgba(96,185,235,0.85)",
            background: "linear-gradient(135deg, rgba(2,170,235,0.15) 0%, rgba(27,119,190,0.15) 100%)",
            border: "1px solid rgba(2,170,235,0.22)",
            transition: "background-color 150ms ease, color 150ms ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(2,170,235,0.22) 0%, rgba(27,119,190,0.22) 100%)"; e.currentTarget.style.color = "#7dd3fc"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(2,170,235,0.15) 0%, rgba(27,119,190,0.15) 100%)"; e.currentTarget.style.color = "rgba(96,185,235,0.85)"; }}
        >
          <UserSwitch size={15} weight="duotone" className="shrink-0" />
          Portal
        </Link>
      </div>

      {/* Bottom two-up: Theme + Sign out */}
      <div className="mt-2 flex gap-1.5 px-0.5 pb-0.5">
        {/* Theme selector */}
        <div
          className="flex flex-1 items-center gap-0.5 rounded-xl p-0.5"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {THEME_SEGS.map((seg) => {
            const isActive = theme === seg.value;
            return (
              <button
                key={seg.value}
                type="button"
                onClick={() => setTheme(seg.value)}
                className="flex flex-1 items-center justify-center rounded-lg py-[7px] focus-visible:ring-2 focus-visible:ring-white/40"
                style={{
                  ...(isActive ? seg.activeStyle : { color: "rgba(255,255,255,0.38)" }),
                  transition: "background-color 150ms ease, color 150ms ease",
                }}
                aria-label={`Set theme: ${seg.label}`}
              >
                {seg.icon}
              </button>
            );
          })}
        </div>

        {/* Sign out */}
        <button
          type="button"
          disabled={signOutPending}
          onClick={() => startSignOut(() => signOut())}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl focus-visible:ring-2 focus-visible:ring-white/40"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: signOutPending ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.45)",
            fontSize: "12px",
            fontWeight: 500,
            transition: "background-color 150ms ease, color 150ms ease, border-color 150ms ease",
            cursor: signOutPending ? "wait" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (!signOutPending) {
              const el = e.currentTarget;
              el.style.background = "rgba(248,113,113,0.12)";
              el.style.color = "#f87171";
              el.style.borderColor = "rgba(248,113,113,0.20)";
            }
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.background = "rgba(255,255,255,0.06)";
            el.style.color = signOutPending ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.45)";
            el.style.borderColor = "rgba(255,255,255,0.08)";
          }}
        >
          <Power size={14} weight="regular" />
          {signOutPending ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}
