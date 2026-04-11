"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Buildings,
  ClipboardText,
  FileText,
  ChatCircle,
  ArrowSquareOut,
  CalendarBlank,
  GearSix,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import Image from "next/image";
import {
  CommandPalette,
  CommandPaletteTrigger,
} from "@/components/portal/CommandPalette";
import { SidebarFooter } from "@/components/portal/SidebarFooter";
import { useTheme } from "@/components/ThemeProvider";
import { NotificationBell } from "@/components/portal/NotificationBell";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  matchPrefix?: string;
};

const primaryNav: NavItem[] = [
  {
    href: "/portal/dashboard",
    label: "Dashboard",
    icon: <House size={18} weight="duotone" />,
  },
  {
    href: "/portal/properties",
    label: "Properties",
    icon: <Buildings size={18} weight="duotone" />,
    matchPrefix: "/portal/properties",
  },
];

const setupNav: NavItem = {
  href: "/portal/setup",
  label: "Setup",
  icon: <ClipboardText size={18} weight="duotone" />,
  matchPrefix: "/portal/setup",
};

const secondaryNav: NavItem[] = [
  {
    href: "/portal/documents",
    label: "Documents",
    icon: <FileText size={18} weight="duotone" />,
    matchPrefix: "/portal/documents",
  },
  {
    href: "/portal/messages",
    label: "Messages",
    icon: <ChatCircle size={18} weight="duotone" />,
    matchPrefix: "/portal/messages",
  },
  {
    href: "/portal/hospitable",
    label: "Hospitable",
    icon: <ArrowSquareOut size={18} weight="duotone" />,
  },
];

export function PortalSidebar({
  userId,
  userName,
  userEmail,
  initials,
  avatarUrl = null,
  isAdmin = false,
  setupIncomplete = false,
  signOutSlot,
}: {
  userId: string;
  userName: string;
  userEmail: string;
  initials: string;
  avatarUrl?: string | null;
  isAdmin?: boolean;
  setupIncomplete?: boolean;
  signOutSlot: ReactNode;
}) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();

  const isActive = (item: NavItem) => {
    if (item.matchPrefix) return pathname?.startsWith(item.matchPrefix);
    return pathname === item.href;
  };

  const allNav: NavItem[] = [
    ...primaryNav,
    ...(setupIncomplete ? [setupNav] : []),
    ...secondaryNav,
  ];

  return (
    <aside
      aria-label="Primary navigation"
      className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r lg:flex"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
    >
      <div className="flex items-center justify-between px-6 pb-6 pt-7">
        <Link
          href="/portal/dashboard"
          className="inline-flex items-center gap-2.5 focus-visible:outline-none"
        >
          <Image
            src={resolvedTheme === "dark" ? "/brand/logo-mark-white.png" : "/brand/logo-mark.png"}
            alt="Parcel"
            width={28}
            height={28}
            className="shrink-0"
          />
          <span
            className="text-[11px] font-medium uppercase tracking-[0.18em]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Owner
          </span>
        </Link>
        <NotificationBell userId={userId} />
      </div>

      <nav className="flex-1 px-3">
        <div className="mb-2">
          <CommandPaletteTrigger />
        </div>
        <div
          className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Portfolio
        </div>
        <ul className="flex flex-col gap-0.5">
          {allNav.map((item) => {
            const active = isActive(item);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--color-warm-gray-50)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    color: active
                      ? "var(--color-text-primary)"
                      : "var(--color-text-secondary)",
                    backgroundColor: active
                      ? "var(--color-warm-gray-100)"
                      : "transparent",
                  }}
                >
                  {active ? (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full"
                      style={{ backgroundColor: "var(--color-brand)" }}
                    />
                  ) : null}
                  <span
                    className="inline-flex h-5 w-5 items-center justify-center transition-colors"
                    style={{
                      color: active
                        ? "var(--color-brand)"
                        : "var(--color-text-tertiary)",
                    }}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <SidebarFooter
        userName={userName}
        userEmail={userEmail}
        initials={initials}
        avatarUrl={avatarUrl}
        isAdmin={isAdmin}
        signOutSlot={signOutSlot}
      />
    </aside>
  );
}

/* ─── Tablet Icon Rail (md to lg) ─── */

const railItems = [
  { href: "/portal/dashboard", icon: <House size={20} weight="duotone" />, label: "Home" },
  { href: "/portal/properties", icon: <Buildings size={20} weight="duotone" />, label: "Properties", matchPrefix: "/portal/properties" },
  { href: "/portal/calendar", icon: <CalendarBlank size={20} weight="duotone" />, label: "Calendar", matchPrefix: "/portal/calendar" },
  { href: "/portal/messages", icon: <ChatCircle size={20} weight="duotone" />, label: "Messages", matchPrefix: "/portal/messages" },
  { href: "/portal/documents", icon: <FileText size={20} weight="duotone" />, label: "Documents", matchPrefix: "/portal/documents" },
  { href: "/portal/account", icon: <GearSix size={20} weight="duotone" />, label: "Account", matchPrefix: "/portal/account" },
];

export function PortalIconRail() {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Navigation rail"
      className="sticky top-0 hidden h-screen w-[60px] shrink-0 flex-col items-center border-r py-4 md:flex lg:hidden"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
    >
      {/* Logo */}
      <Link
        href="/portal/dashboard"
        className="mb-6 flex h-8 w-8 items-center justify-center"
        aria-label="Parcel Home"
      >
        <img src="/brand/logo-mark.png" alt="Parcel" width={24} height={24} />
      </Link>

      {/* Nav */}
      <nav className="flex flex-1 flex-col items-center gap-1">
        {railItems.map((item) => {
          const active = item.matchPrefix
            ? pathname?.startsWith(item.matchPrefix)
            : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className="relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
              style={{
                color: active ? "var(--color-brand)" : "var(--color-text-tertiary)",
                backgroundColor: active ? "rgba(2, 170, 235, 0.08)" : "transparent",
              }}
            >
              {active ? (
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full"
                  style={{ backgroundColor: "var(--color-brand)" }}
                />
              ) : null}
              {item.icon}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function PortalTopBar({
  userName,
  initials,
}: {
  userName: string;
  initials: string;
}) {
  const pathname = usePathname();

  const pageTitle = (() => {
    if (!pathname) return "";
    if (pathname === "/portal/dashboard") return "";
    if (pathname.startsWith("/portal/properties")) return "Properties";
    if (pathname.startsWith("/portal/calendar")) return "Calendar";
    if (pathname.startsWith("/portal/messages")) return "Messages";
    if (pathname.startsWith("/portal/documents")) return "Documents";
    if (pathname.startsWith("/portal/account")) return "Account";
    if (pathname.startsWith("/portal/setup")) return "Setup";
    if (pathname.startsWith("/portal/hospitable")) return "Hospitable";
    return "";
  })();

  return (
    <header
      className="relative flex items-center justify-between border-b px-4 py-3 md:hidden"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
    >
      <Link
        href="/portal/dashboard"
        className="inline-flex items-center gap-2"
      >
        <img
          src="/brand/logo-mark.png"
          alt="Parcel"
          width={22}
          height={22}
          className="shrink-0"
        />
        <span
          className="text-[9px] font-medium uppercase tracking-[0.18em]"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Owner
        </span>
      </Link>

      {pageTitle ? (
        <span
          className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {pageTitle}
        </span>
      ) : null}

      <Link
        href="/portal/account"
        className="flex items-center gap-2"
      >
        <span
          className="hidden text-xs font-medium sm:block"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {userName}
        </span>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold"
          style={{
            backgroundColor: "var(--color-warm-gray-100)",
            color: "var(--color-text-primary)",
          }}
        >
          {initials}
        </span>
      </Link>
    </header>
  );
}
