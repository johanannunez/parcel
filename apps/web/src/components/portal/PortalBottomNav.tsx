"use client";

import { useState, useCallback, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Buildings,
  CalendarCheck,
  ChatCircle,
  DotsThree,
  FileText,
  GearSix,
  Question,
  Sun,
  Moon,
  X,
  ShieldCheck,
  ListChecks,
  ClockCounterClockwise,
  UsersThree,
  Handshake,
  CurrencyDollar,
  CaretDown,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "@/components/ThemeProvider";

type SheetNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  matchPrefix?: string;
};

const overviewItems: SheetNavItem[] = [
  { href: "/portal/dashboard", label: "Dashboard", icon: <House size={19} weight="duotone" /> },
  { href: "/portal/properties", label: "Properties", icon: <Buildings size={19} weight="duotone" />, matchPrefix: "/portal/properties" },
  { href: "/portal/documents", label: "Documents", icon: <FileText size={19} weight="duotone" />, matchPrefix: "/portal/documents" },
  { href: "/portal/financials", label: "Financials", icon: <CurrencyDollar size={19} weight="duotone" />, matchPrefix: "/portal/financials" },
  { href: "/portal/reserve", label: "Reserve", icon: <CalendarCheck size={19} weight="duotone" />, matchPrefix: "/portal/reserve" },
];

const activityItems: SheetNavItem[] = [
  { href: "/portal/messages", label: "Messages", icon: <ChatCircle size={19} weight="duotone" />, matchPrefix: "/portal/messages" },
  { href: "/portal/meetings", label: "Meetings", icon: <Handshake size={19} weight="duotone" />, matchPrefix: "/portal/meetings" },
  { href: "/portal/tasks", label: "Tasks", icon: <ListChecks size={19} weight="duotone" />, matchPrefix: "/portal/tasks" },
  { href: "/portal/timeline", label: "Timeline", icon: <ClockCounterClockwise size={19} weight="duotone" />, matchPrefix: "/portal/timeline" },
];

const resourcesItems: SheetNavItem[] = [
  { href: "/portal/members", label: "Members", icon: <UsersThree size={19} weight="duotone" />, matchPrefix: "/portal/members" },
  { href: "/portal/help", label: "Help Center", icon: <Question size={19} weight="duotone" />, matchPrefix: "/portal/help" },
];

const sheetSections = [
  { label: "Overview", items: overviewItems },
  { label: "Activity", items: activityItems },
  { label: "Resources", items: resourcesItems },
];

const mainNavPrefixes = [
  "/portal/dashboard",
  "/portal/properties",
  "/portal/reserve",
  "/portal/messages",
];

function getActiveSection(pathname: string | null): string {
  if (!pathname) return "Overview";
  if (overviewItems.some((i) => i.matchPrefix ? pathname.startsWith(i.matchPrefix) : pathname === i.href)) return "Overview";
  if (activityItems.some((i) => i.matchPrefix ? pathname.startsWith(i.matchPrefix) : pathname === i.href)) return "Activity";
  if (resourcesItems.some((i) => i.matchPrefix ? pathname.startsWith(i.matchPrefix) : pathname === i.href)) return "Resources";
  return "Overview";
}

const mainNavItems = [
  { href: "/portal/dashboard", label: "Home", icon: <House size={22} weight="regular" />, activeIcon: <House size={22} weight="fill" /> },
  { href: "/portal/properties", label: "Properties", icon: <Buildings size={22} weight="regular" />, activeIcon: <Buildings size={22} weight="fill" />, matchPrefix: "/portal/properties" },
  { href: "/portal/reserve", label: "Reserve", icon: <CalendarCheck size={22} weight="regular" />, activeIcon: <CalendarCheck size={22} weight="fill" />, matchPrefix: "/portal/reserve" },
  { href: "/portal/messages", label: "Messages", icon: <ChatCircle size={22} weight="regular" />, activeIcon: <ChatCircle size={22} weight="fill" />, matchPrefix: "/portal/messages" },
];

export function PortalBottomNav({
  isAdmin = false,
  signOutSlot,
  userName,
  userEmail,
  initials,
  avatarUrl = null,
}: {
  isAdmin?: boolean;
  signOutSlot: ReactNode;
  userName: string;
  userEmail: string;
  initials: string;
  avatarUrl?: string | null;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string>(() => getActiveSection(pathname));
  const { resolvedTheme, toggleTheme } = useTheme();

  // When sheet opens, snap to the section matching the active route.
  useEffect(() => {
    if (moreOpen) {
      setOpenSection(getActiveSection(pathname));
    }
  }, [moreOpen, pathname]);

  const isItemActive = useCallback(
    (item: SheetNavItem) => {
      if (item.matchPrefix) return pathname?.startsWith(item.matchPrefix);
      return pathname === item.href;
    },
    [pathname],
  );

  const isTabActive = useCallback(
    (item: (typeof mainNavItems)[number]) => {
      if (item.matchPrefix) return pathname?.startsWith(item.matchPrefix);
      return pathname === item.href;
    },
    [pathname],
  );

  const isMoreActive =
    !mainNavPrefixes.some((p) => pathname === p || pathname?.startsWith(p + "/")) &&
    pathname?.startsWith("/portal");

  const closeMore = useCallback(() => setMoreOpen(false), []);

  return (
    <>
      {/* Bottom Tab Bar */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t md:hidden"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: "var(--color-warm-gray-200)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="flex h-16 items-stretch">
          {mainNavItems.map((item) => {
            const active = isTabActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors"
                style={{ color: active ? "var(--color-brand)" : "var(--color-text-tertiary)" }}
              >
                {active ? item.activeIcon : item.icon}
                <span
                  className="text-[10px] font-semibold leading-none"
                  style={{ color: active ? "var(--color-brand)" : "var(--color-text-tertiary)" }}
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
            className="flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors"
            style={{
              color: moreOpen || isMoreActive ? "var(--color-brand)" : "var(--color-text-tertiary)",
            }}
            aria-label="More options"
            aria-expanded={moreOpen}
          >
            {moreOpen ? <X size={22} weight="bold" /> : <DotsThree size={22} weight="bold" />}
            <span
              className="text-[10px] font-semibold leading-none"
              style={{
                color: moreOpen || isMoreActive ? "var(--color-brand)" : "var(--color-text-tertiary)",
              }}
            >
              More
            </span>
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
                backgroundColor: "var(--color-white)",
                borderColor: "var(--color-warm-gray-200)",
                paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)",
                maxHeight: "82vh",
                overflowY: "auto",
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div
                  className="h-1 w-10 rounded-full"
                  style={{ backgroundColor: "var(--color-warm-gray-300)" }}
                />
              </div>

              {/* User identity */}
              <Link
                href="/portal/account"
                onClick={closeMore}
                className="mx-4 mt-2 mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--color-warm-gray-50)]"
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
                      backgroundColor: "var(--color-warm-gray-100)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {initials}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[14px] font-semibold leading-tight"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {userName}
                  </div>
                  <div
                    className="mt-px truncate text-[12px] leading-tight"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    {userEmail}
                  </div>
                </div>
                <GearSix
                  size={16}
                  weight="regular"
                  style={{ color: "var(--color-text-tertiary)", flexShrink: 0 }}
                />
              </Link>

              {/* Divider */}
              <div
                className="mx-4 my-2 border-t"
                style={{ borderColor: "var(--color-warm-gray-200)" }}
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
                        onClick={() => setOpenSection(isOpen ? "" : section.label)}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--color-warm-gray-50)]"
                        aria-expanded={isOpen}
                      >
                        <span
                          className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                          style={{ color: "var(--color-text-tertiary)" }}
                        >
                          {section.label}
                        </span>
                        <CaretDown
                          size={11}
                          weight="bold"
                          className="transition-transform duration-200"
                          style={{
                            color: "var(--color-text-tertiary)",
                            transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
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
                                borderLeft: "2px solid var(--color-warm-gray-200)",
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
                                        ? "var(--color-brand)"
                                        : "var(--color-text-secondary)",
                                      backgroundColor: active
                                        ? "rgba(2, 170, 235, 0.06)"
                                        : "transparent",
                                    }}
                                  >
                                    <span
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
                style={{ borderColor: "var(--color-warm-gray-200)" }}
              />

              {/* Footer actions */}
              <div className="px-4 pb-2">
                {isAdmin ? (
                  <Link
                    href="/admin"
                    onClick={closeMore}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--color-warm-gray-50)]"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    <ShieldCheck
                      size={19}
                      weight="duotone"
                      style={{ color: "var(--color-text-tertiary)" }}
                    />
                    Switch to Admin
                  </Link>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    toggleTheme();
                    closeMore();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-[var(--color-warm-gray-50)]"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {resolvedTheme === "dark" ? (
                    <Sun size={19} weight="duotone" style={{ color: "var(--color-text-tertiary)" }} />
                  ) : (
                    <Moon size={19} weight="duotone" style={{ color: "var(--color-text-tertiary)" }} />
                  )}
                  {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
                </button>

                <div className="mt-1">{signOutSlot}</div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
