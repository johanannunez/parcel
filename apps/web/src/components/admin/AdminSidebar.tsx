"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, LayoutGroup, AnimatePresence } from "motion/react";
import {
  House,
  UsersThree,
  Buildings,
  CalendarBlank,
  Wallet,
  EnvelopeSimple,
  ClipboardText,
  ChatCircle,
  ListChecks,
  ClockCounterClockwise,
  BookOpenText,
  Vault,
  ArrowsLeftRight,
  TrendUp,
  CaretDown,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { AdminSidebarFooter } from "@/components/admin/AdminSidebarFooter";
import css from "./AdminSidebar.module.css";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  matchPrefix?: string;
  badge?: number;
};

/* ─── Nav data ─── */

const managementNav: NavItem[] = [
  { href: "/admin", label: "Overview", icon: <House size={18} weight="duotone" /> },
  { href: "/admin/owners", label: "Owners", icon: <UsersThree size={18} weight="duotone" />, matchPrefix: "/admin/owners" },
  { href: "/admin/properties", label: "Properties", icon: <Buildings size={18} weight="duotone" />, matchPrefix: "/admin/properties" },
];

const operationsNav = (pendingBlockCount: number): NavItem[] => [
  { href: "/admin/calendar", label: "Calendar", icon: <CalendarBlank size={18} weight="duotone" />, matchPrefix: "/admin/calendar" },
  { href: "/admin/block-requests", label: "Reservations", icon: <ClipboardText size={18} weight="duotone" />, matchPrefix: "/admin/block-requests", badge: pendingBlockCount },
];

const treasuryNav: NavItem[] = [
  { href: "/admin/treasury", label: "Overview", icon: <Vault size={18} weight="duotone" /> },
  { href: "/admin/treasury/accounts", label: "Accounts", icon: <Wallet size={18} weight="duotone" />, matchPrefix: "/admin/treasury/accounts" },
  { href: "/admin/treasury/transactions", label: "Transactions", icon: <ArrowsLeftRight size={18} weight="duotone" />, matchPrefix: "/admin/treasury/transactions" },
  { href: "/admin/treasury/forecast", label: "Forecast", icon: <TrendUp size={18} weight="duotone" />, matchPrefix: "/admin/treasury/forecast" },
];

const communicationsNav: NavItem[] = [
  { href: "/admin/inquiries", label: "Inquiries", icon: <EnvelopeSimple size={18} weight="duotone" />, matchPrefix: "/admin/inquiries" },
  { href: "/admin/messages", label: "Messages", icon: <ChatCircle size={18} weight="duotone" />, matchPrefix: "/admin/messages" },
  { href: "/admin/tasks", label: "Tasks", icon: <ListChecks size={18} weight="duotone" />, matchPrefix: "/admin/tasks" },
  { href: "/admin/timeline", label: "Timeline", icon: <ClockCounterClockwise size={18} weight="duotone" />, matchPrefix: "/admin/timeline" },
  { href: "/admin/help", label: "Help Articles", icon: <BookOpenText size={18} weight="duotone" />, matchPrefix: "/admin/help" },
];

/* ─── Token constants ─── */

const T = {
  brand: "#02AAEB",
  brandLight: "var(--color-brand-light, #4cc9f0)",
  activeTextColor: "#ffffff",
  inactiveTextColor: "rgba(255,255,255,0.66)",
  activeIconColor: "var(--color-brand-light, #4cc9f0)",
  inactiveIconColor: "rgba(255,255,255,0.44)",
  activeBg: "rgba(2, 170, 235, 0.09)",
  hoverBg: "rgba(255, 255, 255, 0.045)",
  sectionLabelColor: "rgba(255,255,255,0.28)",
  badgeBg: "#f59e0b",
  badgeText: "#1a1a1a",
  indicatorGlow: "0 0 10px 1px rgba(2, 170, 235, 0.55), 0 0 3px rgba(255,255,255,0.18)",
} as const;

/* ─── Spring configs ─── */

const springSnap = { type: "spring" as const, stiffness: 420, damping: 32, mass: 0.8 };
const springIcon = { type: "spring" as const, stiffness: 520, damping: 28 };
const easeFade = { duration: 0.12 };

/* ─── AdminNavSection (collapsible) ─── */

function AdminNavSection({
  label,
  items,
  isActive,
  badges,
  isOpen,
  onToggle,
}: {
  label: string;
  items: NavItem[];
  isActive: (item: NavItem) => boolean | undefined;
  badges?: Record<string, number>;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={{ marginBottom: "14px" }}>
      {/* Collapsible section header */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={css.sectionToggle}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "6px 12px 6px 12px",
          fontSize: "9.5px",
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: T.sectionLabelColor,
          userSelect: "none",
          background: "none",
          border: "none",
          cursor: "pointer",
          borderRadius: "6px",
        }}
      >
        <span>{label}</span>
        <CaretDown
          size={10}
          weight="bold"
          style={{
            color: T.sectionLabelColor,
            transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 0.2s ease",
          }}
        />
      </button>

      {/* Collapsible nav items with left border */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                marginLeft: "12px",
                paddingLeft: "10px",
                paddingTop: "4px",
                paddingBottom: "2px",
                borderLeft: "2px solid rgba(255,255,255,0.06)",
              }}
            >
              <ul
                role="list"
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                }}
              >
                {items.map((item) => {
                  const active = !!isActive(item);
                  const badgeCount = badges?.[item.href] ?? item.badge ?? 0;

                  return (
                    <motion.li
                      key={item.href}
                      initial="idle"
                      whileHover="hovered"
                      animate="idle"
                      style={{ listStyle: "none" }}
                    >
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={css.navLink}
                        style={{
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "8px 12px",
                          borderRadius: "9px",
                          textDecoration: "none",
                          fontSize: "13.5px",
                          fontWeight: active ? 600 : 500,
                          letterSpacing: "0.01em",
                          lineHeight: 1.2,
                          color: active ? T.activeTextColor : T.inactiveTextColor,
                          backgroundColor: active ? T.activeBg : "transparent",
                        }}
                      >
                        {/* Hover overlay */}
                        {!active && (
                          <motion.span
                            aria-hidden
                            variants={{ idle: { opacity: 0 }, hovered: { opacity: 1 } }}
                            transition={easeFade}
                            style={{
                              position: "absolute",
                              inset: 0,
                              borderRadius: "9px",
                              backgroundColor: T.hoverBg,
                              pointerEvents: "none",
                            }}
                          />
                        )}

                        {/* Active indicator pill */}
                        {active && (
                          <motion.span
                            layoutId="admin-nav-pill"
                            aria-hidden
                            style={{
                              position: "absolute",
                              left: 0,
                              top: "50%",
                              width: "3px",
                              height: "16px",
                              borderRadius: "999px",
                              backgroundColor: T.brandLight,
                              boxShadow: T.indicatorGlow,
                              translateY: "-50%",
                            }}
                            transition={springSnap}
                          />
                        )}

                        {/* Icon */}
                        <motion.span
                          aria-hidden
                          variants={{
                            idle: { scale: 1 },
                            hovered: { scale: active ? 1 : 1.1 },
                          }}
                          transition={springIcon}
                          style={{
                            display: "inline-flex",
                            width: "20px",
                            height: "20px",
                            flexShrink: 0,
                            alignItems: "center",
                            justifyContent: "center",
                            color: active ? T.activeIconColor : T.inactiveIconColor,
                            transition: "color 0.15s ease",
                          }}
                        >
                          {item.icon}
                        </motion.span>

                        {/* Label */}
                        <span style={{ flex: 1 }}>{item.label}</span>

                        {/* Badge */}
                        {badgeCount > 0 && (
                          <motion.span
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 480, damping: 24 }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              minWidth: "18px",
                              height: "17px",
                              borderRadius: "999px",
                              padding: "0 5px",
                              fontSize: "9px",
                              fontWeight: 700,
                              backgroundColor: T.badgeBg,
                              color: T.badgeText,
                              letterSpacing: "0.02em",
                              boxShadow: "0 1px 4px rgba(245, 158, 11, 0.35)",
                            }}
                          >
                            {badgeCount > 99 ? "99+" : badgeCount}
                          </motion.span>
                        )}
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Helper: determine which section owns the current route ─── */

const sectionRoutes: Record<string, NavItem[]> = {
  Management: managementNav,
  Communications: communicationsNav,
  Treasury: treasuryNav,
};

function getActiveSections(pathname: string | null, _pendingBlockCount: number): Set<string> {
  const active = new Set<string>();
  if (!pathname) return active;

  for (const [section, items] of Object.entries(sectionRoutes)) {
    if (items.some((i) => (i.matchPrefix ? pathname.startsWith(i.matchPrefix) : pathname === i.href))) {
      active.add(section);
    }
  }

  const ops = [
    { matchPrefix: "/admin/calendar" },
    { matchPrefix: "/admin/block-requests" },
  ];
  if (ops.some((i) => pathname.startsWith(i.matchPrefix!))) {
    active.add("Operations");
  }

  // Default: open Management if nothing else matches
  if (active.size === 0) active.add("Management");
  return active;
}

/* ─── AdminSidebar ─── */

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

  // Collapsible section state. Auto-expand sections containing the active route.
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => getActiveSections(pathname, pendingBlockCount),
  );

  // When route changes, ensure the section containing the new route is open
  useEffect(() => {
    const active = getActiveSections(pathname, pendingBlockCount);
    setOpenSections((prev) => {
      const next = new Set(prev);
      for (const s of active) next.add(s);
      return next;
    });
  }, [pathname, pendingBlockCount]);

  const toggleSection = (label: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  return (
    <aside
      aria-label="Admin navigation"
      className={css.sidebar}
      style={{
        position: "sticky",
        top: 0,
        height: "100vh",
        width: "252px",
        flexShrink: 0,
        borderRight: "1px solid rgba(255,255,255,0.06)",
        background: `
          radial-gradient(ellipse 180% 28% at 50% 0%,
            rgba(2, 170, 235, 0.07) 0%,
            transparent 68%
          ),
          var(--color-navy)
        `,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "24px 0 18px",
        }}
      >
        <Link
          href="/admin"
          className={css.logoLink}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2px",
            transform: "translateX(-16px)",
            textDecoration: "none",
          }}
        >
          <Image
            src="/brand/logo-mark-white.png"
            alt="Parcel"
            width={48}
            height={48}
            style={{ flexShrink: 0 }}
          />
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            Admin
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "4px 10px 0",
          scrollbarWidth: "none",
        }}
      >
        <LayoutGroup>
          <AdminNavSection
            label="Management"
            items={managementNav}
            isActive={isActive}
            isOpen={openSections.has("Management")}
            onToggle={() => toggleSection("Management")}
          />
          <AdminNavSection
            label="Operations"
            items={operationsNav(pendingBlockCount)}
            isActive={isActive}
            isOpen={openSections.has("Operations")}
            onToggle={() => toggleSection("Operations")}
          />
          <AdminNavSection
            label="Treasury"
            items={treasuryNav}
            isActive={isActive}
            isOpen={openSections.has("Treasury")}
            onToggle={() => toggleSection("Treasury")}
          />
          <AdminNavSection
            label="Communications"
            items={communicationsNav}
            isActive={isActive}
            isOpen={openSections.has("Communications")}
            onToggle={() => toggleSection("Communications")}
          />
        </LayoutGroup>
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

/* ─── AdminTopBar (mobile header) ─── */

export function AdminTopBar({
  initials,
  pendingBlockCount = 0,
}: {
  userName: string; // accepted for API compatibility; not displayed
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
    if (pathname.startsWith("/admin/treasury")) return "Treasury";
    if (pathname.startsWith("/admin/inquiries")) return "Inquiries";
    if (pathname.startsWith("/admin/messages")) return "Messages";
    if (pathname.startsWith("/admin/tasks")) return "Tasks";
    if (pathname.startsWith("/admin/block-requests")) return "Reservations";
    if (pathname.startsWith("/admin/timeline")) return "Timeline";
    return "";
  })();

  return (
    <header
      className={css.topBar}
      style={{
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "12px 16px",
        backgroundColor: "var(--color-navy)",
      }}
    >
      <Link
        href="/admin"
        className={css.logoLink}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          textDecoration: "none",
        }}
      >
        <Image
          src="/brand/logo-mark-white.png"
          alt="Parcel"
          width={26}
          height={26}
          style={{ flexShrink: 0 }}
        />
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.65)",
          }}
        >
          Admin
        </span>
      </Link>

      {pageTitle ? (
        <span
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "14px",
            fontWeight: 600,
            color: "#ffffff",
          }}
        >
          {pageTitle}
        </span>
      ) : null}

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {pendingBlockCount > 0 ? (
          <Link
            href="/admin/block-requests"
            aria-label={`${pendingBlockCount} reservations to verify`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "28px",
              height: "28px",
              borderRadius: "999px",
              padding: "0 6px",
              fontSize: "10px",
              fontWeight: 700,
              backgroundColor: "#f59e0b",
              color: "#1a1a1a",
              textDecoration: "none",
              boxShadow: "0 2px 6px rgba(245, 158, 11, 0.4)",
            }}
          >
            {pendingBlockCount}
          </Link>
        ) : null}
        <span
          style={{
            display: "flex",
            width: "32px",
            height: "32px",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "999px",
            fontSize: "11px",
            fontWeight: 600,
            backgroundColor: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.85)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {initials}
        </span>
      </div>
    </header>
  );
}

/* ─── AdminIconRail (tablet, md–lg) ─── */

const adminRailItems: Array<{
  href: string;
  icon: ReactNode;
  label: string;
  matchPrefix?: string;
  isBadged?: boolean;
}> = [
  { href: "/admin", icon: <House size={20} weight="duotone" />, label: "Overview" },
  { href: "/admin/owners", icon: <UsersThree size={20} weight="duotone" />, label: "Owners", matchPrefix: "/admin/owners" },
  { href: "/admin/properties", icon: <Buildings size={20} weight="duotone" />, label: "Properties", matchPrefix: "/admin/properties" },
  { href: "/admin/calendar", icon: <CalendarBlank size={20} weight="duotone" />, label: "Calendar", matchPrefix: "/admin/calendar" },
  { href: "/admin/block-requests", icon: <ClipboardText size={20} weight="duotone" />, label: "Reservations", matchPrefix: "/admin/block-requests", isBadged: true },
  { href: "/admin/treasury", icon: <Vault size={20} weight="duotone" />, label: "Treasury", matchPrefix: "/admin/treasury" },
  { href: "/admin/messages", icon: <ChatCircle size={20} weight="duotone" />, label: "Messages", matchPrefix: "/admin/messages" },
  { href: "/admin/tasks", icon: <ListChecks size={20} weight="duotone" />, label: "Tasks", matchPrefix: "/admin/tasks" },
  { href: "/admin/timeline", icon: <ClockCounterClockwise size={20} weight="duotone" />, label: "Timeline", matchPrefix: "/admin/timeline" },
];

export function AdminIconRail({ pendingBlockCount = 0 }: { pendingBlockCount?: number }) {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Admin navigation rail"
      className={css.rail}
      style={{
        position: "sticky",
        top: 0,
        height: "100vh",
        width: "60px",
        flexShrink: 0,
        borderRight: "1px solid rgba(255,255,255,0.06)",
        backgroundColor: "var(--color-navy)",
        padding: "16px 0",
      }}
    >
      {/* Logo */}
      <Link
        href="/admin"
        aria-label="Parcel Admin Home"
        className={css.railLink}
        style={{
          display: "flex",
          width: "36px",
          height: "36px",
          margin: "0 auto 24px",
          alignItems: "center",
          justifyContent: "center",
          textDecoration: "none",
        }}
      >
        <Image src="/brand/logo-mark-white.png" alt="Parcel" width={24} height={24} />
      </Link>

      {/* Nav */}
      <nav style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "center", gap: "4px" }}>
        {adminRailItems.map((item) => {
          const active = item.matchPrefix
            ? pathname?.startsWith(item.matchPrefix)
            : pathname === item.href;

          return (
            <motion.div
              key={item.href}
              initial="idle"
              whileHover="hovered"
              animate="idle"
              style={{ position: "relative" }}
            >
              <Link
                href={item.href}
                title={item.label}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={css.railLink}
                style={{
                  position: "relative",
                  display: "flex",
                  width: "40px",
                  height: "40px",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px",
                  textDecoration: "none",
                  color: active ? T.activeIconColor : T.inactiveIconColor,
                  backgroundColor: active ? "rgba(255,255,255,0.08)" : "transparent",
                }}
              >
                {/* Hover overlay */}
                {!active && (
                  <motion.span
                    aria-hidden
                    variants={{ idle: { opacity: 0 }, hovered: { opacity: 1 } }}
                    transition={easeFade}
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "8px",
                      backgroundColor: T.hoverBg,
                      pointerEvents: "none",
                    }}
                  />
                )}
                {/* Active left indicator */}
                {active && (
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "50%",
                      width: "3px",
                      height: "14px",
                      borderRadius: "999px",
                      backgroundColor: T.brandLight,
                      boxShadow: T.indicatorGlow,
                      transform: "translateY(-50%)",
                    }}
                  />
                )}
                {/* Icon */}
                <motion.span
                  aria-hidden
                  variants={{ idle: { scale: 1 }, hovered: { scale: active ? 1 : 1.08 } }}
                  transition={springIcon}
                >
                  {item.icon}
                </motion.span>

                {/* Badge */}
                {item.isBadged && pendingBlockCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-1px",
                      right: "-1px",
                      display: "flex",
                      minWidth: "15px",
                      height: "15px",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "999px",
                      padding: "0 3px",
                      fontSize: "8px",
                      fontWeight: 700,
                      backgroundColor: "#f59e0b",
                      color: "#1a1a1a",
                      boxShadow: "0 1px 4px rgba(245,158,11,0.4)",
                    }}
                  >
                    {pendingBlockCount}
                  </span>
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </aside>
  );
}
