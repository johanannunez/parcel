"use client";

import { useState, useCallback, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  UsersThree,
  CalendarBlank,
  ChatCircle,
  List,
  Buildings,
  UserSwitch,
  Wallet,
  Vault,
  EnvelopeSimple,
  ClipboardText,
  ListChecks,
  ClockCounterClockwise,
  BookOpenText,
  GearSix,
  CaretDown,
  X,
  SignOut,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";

/* ── Types ── */

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  activeIcon: ReactNode;
  matchPrefix?: string;
};

type SheetNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  matchPrefix?: string;
  badge?: number;
};

/* ── Bottom tab items (always visible) ── */

const navItems: NavItem[] = [
  {
    href: "/admin",
    label: "Overview",
    icon: <House size={22} weight="regular" />,
    activeIcon: <House size={22} weight="fill" />,
  },
  {
    href: "/admin/owners",
    label: "Owners",
    icon: <UsersThree size={22} weight="regular" />,
    activeIcon: <UsersThree size={22} weight="fill" />,
    matchPrefix: "/admin/owners",
  },
  {
    href: "/admin/calendar",
    label: "Calendar",
    icon: <CalendarBlank size={22} weight="regular" />,
    activeIcon: <CalendarBlank size={22} weight="fill" />,
    matchPrefix: "/admin/calendar",
  },
  {
    href: "/admin/messages",
    label: "Messages",
    icon: <ChatCircle size={22} weight="regular" />,
    activeIcon: <ChatCircle size={22} weight="fill" />,
    matchPrefix: "/admin/messages",
  },
];

/* ── Sheet accordion section data ── */

const managementItems = (pendingBlockCount: number): SheetNavItem[] => [
  { href: "/admin", label: "Overview", icon: <House size={19} weight="duotone" /> },
  { href: "/admin/owners", label: "Owners", icon: <UsersThree size={19} weight="duotone" />, matchPrefix: "/admin/owners" },
  { href: "/admin/properties", label: "Properties", icon: <Buildings size={19} weight="duotone" />, matchPrefix: "/admin/properties" },
  { href: "/admin/calendar", label: "Calendar", icon: <CalendarBlank size={19} weight="duotone" />, matchPrefix: "/admin/calendar" },
  { href: "/admin/block-requests", label: "Reservations", icon: <ClipboardText size={19} weight="duotone" />, matchPrefix: "/admin/block-requests", badge: pendingBlockCount },
  { href: "/admin/treasury", label: "Treasury", icon: <Vault size={19} weight="duotone" />, matchPrefix: "/admin/treasury" },
];

const communicationsItems: SheetNavItem[] = [
  { href: "/admin/inquiries", label: "Inquiries", icon: <EnvelopeSimple size={19} weight="duotone" />, matchPrefix: "/admin/inquiries" },
  { href: "/admin/messages", label: "Messages", icon: <ChatCircle size={19} weight="duotone" />, matchPrefix: "/admin/messages" },
  { href: "/admin/tasks", label: "Tasks", icon: <ListChecks size={19} weight="duotone" />, matchPrefix: "/admin/tasks" },
  { href: "/admin/timeline", label: "Timeline", icon: <ClockCounterClockwise size={19} weight="duotone" />, matchPrefix: "/admin/timeline" },
];

const toolsItems: SheetNavItem[] = [
  { href: "/admin/help", label: "Help Articles", icon: <BookOpenText size={19} weight="duotone" />, matchPrefix: "/admin/help" },
  { href: "/admin/account", label: "Account", icon: <GearSix size={19} weight="duotone" />, matchPrefix: "/admin/account" },
];

/* ── Helpers ── */

const mainNavPrefixes = ["/admin", "/admin/owners", "/admin/calendar", "/admin/messages"];

function getActiveSection(pathname: string | null, pendingBlockCount: number): string {
  if (!pathname) return "Management";
  const mgmt = managementItems(pendingBlockCount);
  if (mgmt.some((i) => (i.matchPrefix ? pathname.startsWith(i.matchPrefix) : pathname === i.href))) return "Management";
  if (communicationsItems.some((i) => (i.matchPrefix ? pathname.startsWith(i.matchPrefix) : pathname === i.href))) return "Communications";
  if (toolsItems.some((i) => (i.matchPrefix ? pathname.startsWith(i.matchPrefix) : pathname === i.href))) return "Tools";
  return "Management";
}

/* ── Component ── */

export function AdminBottomNav({
  pendingBlockCount = 0,
  signOutSlot,
  userName,
  userEmail,
  initials,
  avatarUrl = null,
}: {
  pendingBlockCount?: number;
  signOutSlot: ReactNode;
  userName: string;
  userEmail: string;
  initials: string;
  avatarUrl?: string | null;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string>(() =>
    getActiveSection(pathname, pendingBlockCount),
  );

  const portalHref = (() => {
    const map: Array<[string, string]> = [
      ["/admin/properties", "/portal/properties"],
      ["/admin/calendar", "/portal/calendar"],
      ["/admin/payouts", "/portal/payouts"],
      ["/admin/messages", "/portal/messages"],
      ["/admin/tasks", "/portal/tasks"],
      ["/admin/timeline", "/portal/timeline"],
      ["/admin/block-requests", "/portal/calendar"],
      ["/admin/account", "/portal/account"],
      ["/admin/help", "/portal/help"],
    ];
    for (const [prefix, dest] of map) {
      if (pathname?.startsWith(prefix)) return dest;
    }
    return "/portal/dashboard";
  })();

  const isActive = useCallback(
    (item: NavItem) => {
      if (item.matchPrefix) return pathname?.startsWith(item.matchPrefix);
      return pathname === item.href;
    },
    [pathname],
  );

  const isItemActive = useCallback(
    (item: SheetNavItem) => {
      if (item.matchPrefix) return pathname?.startsWith(item.matchPrefix);
      return pathname === item.href;
    },
    [pathname],
  );

  const isMoreActive =
    !mainNavPrefixes.some(
      (p) => pathname === p || (p !== "/admin" && pathname?.startsWith(p + "/")),
    ) && pathname?.startsWith("/admin") && pathname !== "/admin";

  const closeMore = useCallback(() => setMoreOpen(false), []);

  // Snap to the active section when sheet opens
  useEffect(() => {
    if (moreOpen) {
      setOpenSection(getActiveSection(pathname, pendingBlockCount));
    }
  }, [moreOpen, pathname, pendingBlockCount]);

  const sheetSections = [
    { label: "Management", items: managementItems(pendingBlockCount) },
    { label: "Communications", items: communicationsItems },
    { label: "Tools", items: toolsItems },
  ];

  return (
    <>
      {/* Bottom Nav Bar */}
      <nav
        aria-label="Admin mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t md:hidden"
        style={{
          backgroundColor: "var(--color-navy)",
          borderColor: "rgba(255,255,255,0.08)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="flex h-16 items-stretch">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMore}
                className="flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors"
                style={{
                  color: active
                    ? "var(--color-brand-light)"
                    : "rgba(255,255,255,0.45)",
                }}
              >
                {active ? item.activeIcon : item.icon}
                <span
                  className="text-[10px] font-semibold leading-none"
                  style={{
                    color: active
                      ? "var(--color-brand-light)"
                      : "rgba(255,255,255,0.45)",
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            type="button"
            onClick={() => setMoreOpen(!moreOpen)}
            className="relative flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors"
            style={{
              color: moreOpen || isMoreActive
                ? "var(--color-brand-light)"
                : "rgba(255,255,255,0.45)",
            }}
            aria-label="More options"
            aria-expanded={moreOpen}
          >
            {moreOpen ? (
              <X size={22} weight="bold" />
            ) : (
              <List size={22} weight="bold" />
            )}
            <span
              className="text-[10px] font-semibold leading-none"
              style={{
                color: moreOpen || isMoreActive
                  ? "var(--color-brand-light)"
                  : "rgba(255,255,255,0.45)",
              }}
            >
              More
            </span>
            {/* Badge for pending block requests */}
            {pendingBlockCount > 0 && !moreOpen ? (
              <span
                className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold"
                style={{ backgroundColor: "#f59e0b", color: "#1a1a1a" }}
              >
                {pendingBlockCount}
              </span>
            ) : null}
          </button>
        </div>
      </nav>

      {/* More Sheet */}
      <AnimatePresence>
        {moreOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 bg-black/30 md:hidden"
              onClick={closeMore}
              aria-hidden="true"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 340 }}
              className="fixed bottom-0 left-0 right-0 z-35 rounded-t-2xl border-t md:hidden"
              style={{
                backgroundColor: "var(--color-navy)",
                borderColor: "rgba(255,255,255,0.08)",
                paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)",
                maxHeight: "82vh",
                overflowY: "auto",
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div
                  className="h-1 w-10 rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                />
              </div>

              {/* User identity */}
              <Link
                href="/admin/account"
                onClick={closeMore}
                className="mx-4 mt-2 mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
                style={{ textDecoration: "none" }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={userName}
                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold tracking-wide"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.85)",
                    }}
                  >
                    {initials}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[14px] font-semibold leading-tight"
                    style={{ color: "#ffffff" }}
                  >
                    {userName}
                  </div>
                  <div
                    className="mt-px truncate text-[12px] leading-tight"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                  >
                    {userEmail}
                  </div>
                </div>
                <GearSix
                  size={16}
                  weight="regular"
                  style={{ color: "rgba(255,255,255,0.35)", flexShrink: 0 }}
                />
              </Link>

              {/* Divider */}
              <div
                className="mx-4 my-2 border-t"
                style={{ borderColor: "rgba(255,255,255,0.08)" }}
              />

              {/* Accordion sections */}
              <div className="px-4">
                {sheetSections.map((section) => {
                  const isOpen = openSection === section.label;
                  return (
                    <div key={section.label} className="mb-1">
                      {/* Section header */}
                      <button
                        type="button"
                        onClick={() =>
                          setOpenSection(isOpen ? "" : section.label)
                        }
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-colors"
                        aria-expanded={isOpen}
                      >
                        <span
                          className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                          style={{ color: "rgba(255,255,255,0.35)" }}
                        >
                          {section.label}
                        </span>
                        <CaretDown
                          size={11}
                          weight="bold"
                          className="transition-transform duration-200"
                          style={{
                            color: "rgba(255,255,255,0.35)",
                            transform: isOpen
                              ? "rotate(0deg)"
                              : "rotate(-90deg)",
                          }}
                        />
                      </button>

                      {/* Items with left-border treatment */}
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
                              className="ml-3 pl-3 pb-1"
                              style={{
                                borderLeft:
                                  "2px solid rgba(255,255,255,0.08)",
                              }}
                            >
                              {section.items.map((item) => {
                                const active = isItemActive(item);
                                return (
                                  <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={closeMore}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                                    style={{
                                      color: active
                                        ? "var(--color-brand-light)"
                                        : "rgba(255,255,255,0.65)",
                                      backgroundColor: active
                                        ? "rgba(2, 170, 235, 0.09)"
                                        : "transparent",
                                      textDecoration: "none",
                                    }}
                                  >
                                    <span
                                      style={{
                                        color: active
                                          ? "var(--color-brand-light)"
                                          : "rgba(255,255,255,0.4)",
                                      }}
                                    >
                                      {item.icon}
                                    </span>
                                    <span className="flex-1">{item.label}</span>
                                    {(item.badge ?? 0) > 0 ? (
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
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Divider */}
              <div
                className="mx-4 my-2 border-t"
                style={{ borderColor: "rgba(255,255,255,0.08)" }}
              />

              {/* Footer actions */}
              <div className="px-4 pb-2">
                {/* Portal link */}
                <Link
                  href={portalHref}
                  onClick={closeMore}
                  className="mb-2 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold"
                  style={{
                    background:
                      "linear-gradient(135deg, #02AAEB 0%, #1B77BE 100%)",
                    color: "#fff",
                    boxShadow: "0 2px 8px rgba(2, 170, 235, 0.25)",
                    textDecoration: "none",
                  }}
                >
                  <UserSwitch
                    size={18}
                    weight="duotone"
                    className="shrink-0"
                    style={{ color: "#fff" }}
                  />
                  Portal
                </Link>

                {/* Sign out */}
                <button
                  type="button"
                  onClick={() => {
                    closeMore();
                    // Trigger the sign out action from the slot
                    const btn = document.querySelector(
                      "[data-admin-signout]",
                    ) as HTMLButtonElement | null;
                    if (btn) btn.click();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors"
                  style={{ color: "rgba(239, 68, 68, 0.85)" }}
                >
                  <SignOut
                    size={18}
                    weight="regular"
                    style={{ color: "rgba(239, 68, 68, 0.6)" }}
                  />
                  Sign out
                </button>

                {/* Hidden real sign out slot */}
                <div className="hidden" aria-hidden="true">
                  {signOutSlot}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
