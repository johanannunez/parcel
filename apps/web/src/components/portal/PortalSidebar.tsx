"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Buildings,
  CalendarBlank,
  ClipboardText,
  Wallet,
  LifebuoyIcon as Lifebuoy,
  ShieldCheck,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import {
  CommandPalette,
  CommandPaletteTrigger,
} from "@/components/portal/CommandPalette";
import { OwnerLocalTime } from "@/components/portal/OwnerLocalTime";

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
  {
    href: "/portal/setup",
    label: "Setup",
    icon: <ClipboardText size={18} weight="duotone" />,
    matchPrefix: "/portal/setup",
  },
  {
    href: "/portal/calendar",
    label: "Calendar",
    icon: <CalendarBlank size={18} weight="duotone" />,
  },
  {
    href: "/portal/payouts",
    label: "Payouts",
    icon: <Wallet size={18} weight="duotone" />,
  },
];

export function PortalSidebar({
  userName,
  userEmail,
  initials,
  timezone,
  isAdmin = false,
  signOutSlot,
}: {
  userName: string;
  userEmail: string;
  initials: string;
  timezone: string | null;
  isAdmin?: boolean;
  signOutSlot: ReactNode;
}) {
  const pathname = usePathname();

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
      <div className="px-6 pb-6 pt-7">
        <Link
          href="/portal/dashboard"
          className="inline-flex items-baseline gap-2 focus-visible:outline-none"
        >
          <span
            className="text-[19px] font-semibold tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            Parcel
          </span>
          <span
            className="text-[11px] font-medium uppercase tracking-[0.18em]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Owner
          </span>
        </Link>
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
          {primaryNav.map((item) => {
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

        <div
          className="mt-8 px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Account
        </div>
        <ul className="flex flex-col gap-0.5">
          <li>
            <Link
              href="/help"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <span
                className="inline-flex h-5 w-5 items-center justify-center"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                <Lifebuoy size={18} weight="duotone" />
              </span>
              Help center
            </Link>
          </li>
        </ul>
      </nav>

      {isAdmin ? (
        <div className="mx-3 mb-3">
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--color-warm-gray-50)]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <span
              className="inline-flex h-5 w-5 items-center justify-center"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              <ShieldCheck size={18} weight="duotone" />
            </span>
            Switch to Admin
          </Link>
        </div>
      ) : null}

      <div
        className="mx-3 mb-4 rounded-xl border p-3"
        style={{
          borderColor: "var(--color-warm-gray-200)",
          backgroundColor: "var(--color-warm-gray-50)",
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
            style={{
              backgroundColor: "var(--color-white)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-warm-gray-200)",
            }}
          >
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <div
              className="truncate text-sm font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {userName}
            </div>
            <div
              className="truncate text-xs"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {userEmail}
            </div>
            <OwnerLocalTime timezone={timezone} />
          </div>
        </div>
        <div className="mt-3">{signOutSlot}</div>
      </div>
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
  return (
    <header
      className="flex items-center justify-between border-b px-5 py-3 lg:hidden"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
    >
      <Link
        href="/portal/dashboard"
        className="inline-flex items-baseline gap-2"
      >
        <span
          className="text-base font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          Parcel
        </span>
        <span
          className="text-[10px] font-medium uppercase tracking-[0.18em]"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Owner
        </span>
      </Link>
      <div className="flex items-center gap-3">
        <span
          className="text-xs font-medium"
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
      </div>
    </header>
  );
}
