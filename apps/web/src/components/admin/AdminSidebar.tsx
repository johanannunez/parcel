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
  ChatCircle,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { AdminSidebarFooter } from "@/components/admin/AdminSidebarFooter";

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
  avatarUrl = null,
  pendingBlockCount,
  signOutSlot,
}: {
  userName: string;
  userEmail: string;
  initials: string;
  avatarUrl?: string | null;
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
      <div className="flex justify-center px-6 pb-8 pt-8">
        <Link
          href="/admin"
          className="inline-flex flex-col items-center gap-3 focus-visible:outline-none"
        >
          <img
            src="/brand/logo-mark-white.png"
            alt="Parcel"
            width={48}
            height={48}
            className="shrink-0"
          />
          <span
            className="text-[15px] font-bold uppercase tracking-[0.12em]"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            Admin
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-2">
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

      <AdminSidebarFooter
        userName={userName}
        userEmail={userEmail}
        initials={initials}
        avatarUrl={avatarUrl}
        signOutSlot={signOutSlot}
      />
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
  pendingBlockCount = 0,
}: {
  userName: string;
  initials: string;
  pendingBlockCount?: number;
}) {
  const pathname = usePathname();

  const pageTitle = (() => {
    if (!pathname) return "";
    if (pathname === "/admin") return "";
    if (pathname.startsWith("/admin/owners")) return "Owners";
    if (pathname.startsWith("/admin/properties")) return "Properties";
    if (pathname.startsWith("/admin/calendar")) return "Calendar";
    if (pathname.startsWith("/admin/payouts")) return "Payouts";
    if (pathname.startsWith("/admin/inquiries")) return "Inquiries";
    if (pathname.startsWith("/admin/messages")) return "Messages";
    if (pathname.startsWith("/admin/block-requests")) return "Block Requests";
    return "";
  })();

  return (
    <header
      className="relative flex items-center justify-between border-b px-4 py-3 md:hidden"
      style={{
        backgroundColor: "var(--color-navy)",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      <Link href="/admin" className="inline-flex items-center gap-2">
        <img
          src="/brand/logo-mark-white.png"
          alt="Parcel"
          width={26}
          height={26}
          className="shrink-0"
        />
        <span
          className="text-[11px] font-bold uppercase tracking-[0.1em]"
          style={{ color: "rgba(255,255,255,0.65)" }}
        >
          Admin
        </span>
      </Link>

      {pageTitle ? (
        <span
          className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-white"
        >
          {pageTitle}
        </span>
      ) : null}

      <div className="flex items-center gap-2">
        {pendingBlockCount > 0 ? (
          <Link
            href="/admin/block-requests"
            className="flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-[10px] font-bold"
            style={{ backgroundColor: "#f59e0b", color: "#1a1a1a" }}
            aria-label={`${pendingBlockCount} pending block requests`}
          >
            {pendingBlockCount}
          </Link>
        ) : null}
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

/* ─── Admin Tablet Icon Rail (md to lg) ─── */

const adminRailItems = [
  { href: "/admin", icon: <House size={20} weight="duotone" />, label: "Overview" },
  { href: "/admin/owners", icon: <UsersThree size={20} weight="duotone" />, label: "Owners", matchPrefix: "/admin/owners" },
  { href: "/admin/properties", icon: <Buildings size={20} weight="duotone" />, label: "Properties", matchPrefix: "/admin/properties" },
  { href: "/admin/calendar", icon: <CalendarBlank size={20} weight="duotone" />, label: "Calendar", matchPrefix: "/admin/calendar" },
  { href: "/admin/payouts", icon: <Wallet size={20} weight="duotone" />, label: "Payouts", matchPrefix: "/admin/payouts" },
  { href: "/admin/messages", icon: <ChatCircle size={20} weight="duotone" />, label: "Messages", matchPrefix: "/admin/messages" },
  { href: "/admin/block-requests", icon: <ClipboardText size={20} weight="duotone" />, label: "Block Requests", matchPrefix: "/admin/block-requests" },
];

export function AdminIconRail({ pendingBlockCount = 0 }: { pendingBlockCount?: number }) {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Admin navigation rail"
      className="sticky top-0 hidden h-screen w-[60px] shrink-0 flex-col items-center border-r py-4 md:flex lg:hidden"
      style={{
        backgroundColor: "var(--color-navy)",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <Link
        href="/admin"
        className="mb-6 flex h-8 w-8 items-center justify-center"
        aria-label="Parcel Admin Home"
      >
        <img src="/brand/logo-mark-white.png" alt="Parcel" width={24} height={24} />
      </Link>

      {/* Nav */}
      <nav className="flex flex-1 flex-col items-center gap-1">
        {adminRailItems.map((item) => {
          const active = item.matchPrefix
            ? pathname?.startsWith(item.matchPrefix)
            : pathname === item.href;
          const isBlockRequests = item.href === "/admin/block-requests";
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className="relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
              style={{
                color: active ? "var(--color-brand-light)" : "rgba(255,255,255,0.5)",
                backgroundColor: active ? "rgba(255,255,255,0.08)" : "transparent",
              }}
            >
              {active ? (
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full"
                  style={{ backgroundColor: "var(--color-brand-light)" }}
                />
              ) : null}
              {item.icon}
              {isBlockRequests && pendingBlockCount > 0 ? (
                <span
                  className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[8px] font-bold"
                  style={{ backgroundColor: "#f59e0b", color: "#1a1a1a" }}
                >
                  {pendingBlockCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
