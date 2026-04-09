"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  UsersThree,
  Buildings,
  CalendarBlank,
  Wallet,
  EnvelopeSimple,
  ClipboardText,
  UserCircle,
  ChatCircle,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  matchPrefix?: string;
  badge?: number;
};

const mainNav: NavItem[] = [
  {
    href: "/admin",
    label: "Overview",
    icon: <House size={18} weight="duotone" />,
  },
  {
    href: "/admin/owners",
    label: "Owners",
    icon: <UsersThree size={18} weight="duotone" />,
    matchPrefix: "/admin/owners",
  },
  {
    href: "/admin/properties",
    label: "Properties",
    icon: <Buildings size={18} weight="duotone" />,
    matchPrefix: "/admin/properties",
  },
  {
    href: "/admin/calendar",
    label: "Calendar",
    icon: <CalendarBlank size={18} weight="duotone" />,
    matchPrefix: "/admin/calendar",
  },
  {
    href: "/admin/payouts",
    label: "Payouts",
    icon: <Wallet size={18} weight="duotone" />,
    matchPrefix: "/admin/payouts",
  },
  {
    href: "/admin/inquiries",
    label: "Inquiries",
    icon: <EnvelopeSimple size={18} weight="duotone" />,
    matchPrefix: "/admin/inquiries",
  },
  {
    href: "/admin/messages",
    label: "Messages",
    icon: <ChatCircle size={18} weight="duotone" />,
    matchPrefix: "/admin/messages",
  },
];

export function AdminSidebar({
  userName,
  userEmail,
  initials,
  pendingBlockCount,
  signOutSlot,
}: {
  userName: string;
  userEmail: string;
  initials: string;
  pendingBlockCount: number;
  signOutSlot: ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (item: NavItem) => {
    if (item.matchPrefix) return pathname?.startsWith(item.matchPrefix);
    return pathname === item.href;
  };

  const opsNav: NavItem[] = [
    {
      href: "/admin/block-requests",
      label: "Block requests",
      icon: <ClipboardText size={18} weight="duotone" />,
      matchPrefix: "/admin/block-requests",
      badge: pendingBlockCount,
    },
  ];

  return (
    <aside
      aria-label="Admin navigation"
      className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r lg:flex"
      style={{
        backgroundColor: "var(--color-navy)",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <div className="px-6 pb-6 pt-7">
        <Link
          href="/admin"
          className="inline-flex items-baseline gap-2 focus-visible:outline-none"
        >
          <span className="text-[19px] font-semibold tracking-tight text-white">
            Parcel
          </span>
          <span
            className="text-[11px] font-medium uppercase tracking-[0.18em]"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Admin
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3">
        <SectionLabel>Main</SectionLabel>
        <ul className="flex flex-col gap-0.5">
          {mainNav.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item)} />
          ))}
        </ul>

        <SectionLabel className="mt-8">Operations</SectionLabel>
        <ul className="flex flex-col gap-0.5">
          {opsNav.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item)} />
          ))}
        </ul>
      </nav>

      {/* Switch to portal */}
      <div className="mx-3 mb-3">
        <Link
          href="/portal/dashboard"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          style={{ color: "rgba(255,255,255,0.5)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <span className="inline-flex h-5 w-5 items-center justify-center">
            <UserCircle size={18} weight="duotone" />
          </span>
          Switch to Portal
        </Link>
      </div>

      {/* User card */}
      <div
        className="mx-3 mb-4 rounded-xl border p-3"
        style={{
          borderColor: "rgba(255,255,255,0.08)",
          backgroundColor: "var(--color-charcoal)",
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">
              {userName}
            </div>
            <div
              className="truncate text-xs"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              {userEmail}
            </div>
          </div>
        </div>
        <div className="mt-3">{signOutSlot}</div>
      </div>
    </aside>
  );
}

function SectionLabel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] ${className}`}
      style={{ color: "rgba(255,255,255,0.4)" }}
    >
      {children}
    </div>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className="group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        style={{
          color: active ? "white" : "rgba(255,255,255,0.7)",
          backgroundColor: active ? "rgba(255,255,255,0.08)" : "transparent",
        }}
        onMouseEnter={(e) => {
          if (!active)
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)";
        }}
        onMouseLeave={(e) => {
          if (!active) e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        {active ? (
          <span
            aria-hidden
            className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full"
            style={{ backgroundColor: "var(--color-brand-light)" }}
          />
        ) : null}
        <span
          className="inline-flex h-5 w-5 items-center justify-center"
          style={{
            color: active ? "var(--color-brand-light)" : "rgba(255,255,255,0.5)",
          }}
        >
          {item.icon}
        </span>
        <span className="flex-1">{item.label}</span>
        {item.badge && item.badge > 0 ? (
          <span
            className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold"
            style={{
              backgroundColor: "#f59e0b",
              color: "#1a1a1a",
            }}
          >
            {item.badge}
          </span>
        ) : null}
      </Link>
    </li>
  );
}

export function AdminTopBar({
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
        backgroundColor: "var(--color-navy)",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      <Link href="/admin" className="inline-flex items-baseline gap-2">
        <span className="text-base font-semibold tracking-tight text-white">
          Parcel
        </span>
        <span
          className="text-[10px] font-medium uppercase tracking-[0.18em]"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          Admin
        </span>
      </Link>
      <div className="flex items-center gap-3">
        <span
          className="text-xs font-medium"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          {userName}
        </span>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold"
          style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            color: "white",
          }}
        >
          {initials}
        </span>
      </div>
    </header>
  );
}
