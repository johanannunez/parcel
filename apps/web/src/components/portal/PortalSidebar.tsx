"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Buildings,
  ClipboardText,
  FileText,
  ChatCircle,
  CalendarCheck,
  UsersThree,
  ListChecks,
  ClockCounterClockwise,
  Handshake,
  CurrencyDollar,
  GearSix,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import Image from "next/image";
import { SidebarFooter } from "@/components/portal/SidebarFooter";
import { useTheme } from "@/components/ThemeProvider";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  matchPrefix?: string;
};

const portfolioNav: NavItem[] = [
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
  {
    href: "/portal/reserve",
    label: "Reserve",
    icon: <CalendarCheck size={18} weight="duotone" />,
    matchPrefix: "/portal/reserve",
  },
  {
    href: "/portal/members",
    label: "Members",
    icon: <UsersThree size={18} weight="duotone" />,
    matchPrefix: "/portal/members",
  },
];

const setupNav: NavItem = {
  href: "/portal/setup",
  label: "Setup",
  icon: <ClipboardText size={18} weight="duotone" />,
  matchPrefix: "/portal/setup",
};

const activityNav: NavItem[] = [
  {
    href: "/portal/tasks",
    label: "Tasks",
    icon: <ListChecks size={18} weight="duotone" />,
    matchPrefix: "/portal/tasks",
  },
  {
    href: "/portal/timeline",
    label: "Timeline",
    icon: <ClockCounterClockwise size={18} weight="duotone" />,
    matchPrefix: "/portal/timeline",
  },
  {
    href: "/portal/meetings",
    label: "Meetings",
    icon: <Handshake size={18} weight="duotone" />,
    matchPrefix: "/portal/meetings",
  },
];

const resourcesNav: NavItem[] = [
  {
    href: "/portal/documents",
    label: "Documents",
    icon: <FileText size={18} weight="duotone" />,
    matchPrefix: "/portal/documents",
  },
  {
    href: "/portal/financials",
    label: "Financials",
    icon: <CurrencyDollar size={18} weight="duotone" />,
    matchPrefix: "/portal/financials",
  },
  {
    href: "/portal/messages",
    label: "Messages",
    icon: <ChatCircle size={18} weight="duotone" />,
    matchPrefix: "/portal/messages",
  },
];

function NavSection({
  label,
  items,
  isActive,
}: {
  label: string;
  items: NavItem[];
  isActive: (item: NavItem) => boolean | undefined;
}) {
  return (
    <div className="mb-4">
      <div
        className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {label}
      </div>
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
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
    </div>
  );
}

export function PortalSidebar({
  userName,
  userEmail,
  initials,
  avatarUrl = null,
  isAdmin = false,
  setupIncomplete = false,
  signOutSlot,
}: {
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

  return (
    <aside
      aria-label="Primary navigation"
      className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r lg:flex"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
    >
      <div className="flex w-full items-center justify-center py-[18px]">
        <Link
          href="/portal/dashboard"
          className="flex items-center gap-1 focus-visible:outline-none"
        >
          <Image
            src={
              resolvedTheme === "dark"
                ? "/brand/logo-mark-white.png"
                : "/brand/logo-mark.png"
            }
            alt="Parcel"
            width={48}
            height={48}
            className="shrink-0"
          />
          <span
            className="text-[15px] font-bold uppercase tracking-[0.12em]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Owner
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pt-5">
        <NavSection label="Portfolio" items={portfolioNav} isActive={isActive} />

        {setupIncomplete && (
          <div className="mb-4">
            <ul className="flex flex-col gap-0.5">
              <li>
                <Link
                  href={setupNav.href}
                  aria-current={isActive(setupNav) ? "page" : undefined}
                  className="group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--color-warm-gray-50)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    color: isActive(setupNav)
                      ? "var(--color-text-primary)"
                      : "var(--color-text-secondary)",
                    backgroundColor: isActive(setupNav)
                      ? "var(--color-warm-gray-100)"
                      : "transparent",
                  }}
                >
                  {isActive(setupNav) ? (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full"
                      style={{ backgroundColor: "var(--color-brand)" }}
                    />
                  ) : null}
                  <span
                    className="inline-flex h-5 w-5 items-center justify-center transition-colors"
                    style={{
                      color: isActive(setupNav)
                        ? "var(--color-brand)"
                        : "var(--color-text-tertiary)",
                    }}
                  >
                    {setupNav.icon}
                  </span>
                  {setupNav.label}
                </Link>
              </li>
            </ul>
          </div>
        )}

        <NavSection label="Activity" items={activityNav} isActive={isActive} />
        <NavSection label="Resources" items={resourcesNav} isActive={isActive} />
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
  {
    href: "/portal/dashboard",
    icon: <House size={20} weight="duotone" />,
    label: "Home",
  },
  {
    href: "/portal/properties",
    icon: <Buildings size={20} weight="duotone" />,
    label: "Properties",
    matchPrefix: "/portal/properties",
  },
  {
    href: "/portal/reserve",
    icon: <CalendarCheck size={20} weight="duotone" />,
    label: "Reserve",
    matchPrefix: "/portal/reserve",
  },
  {
    href: "/portal/messages",
    icon: <ChatCircle size={20} weight="duotone" />,
    label: "Messages",
    matchPrefix: "/portal/messages",
  },
  {
    href: "/portal/account",
    icon: <GearSix size={20} weight="duotone" />,
    label: "Account",
    matchPrefix: "/portal/account",
  },
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
        className="mb-3 flex h-8 w-8 items-center justify-center"
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
