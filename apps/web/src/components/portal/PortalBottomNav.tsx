"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Buildings,
  CalendarBlank,
  ChatCircle,
  DotsThree,
  FileText,
  GearSix,
  Question,
  Sun,
  Moon,
  SignOut,
  X,
  ShieldCheck,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "@/components/ThemeProvider";
import type { ReactNode } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  activeIcon: ReactNode;
  matchPrefix?: string;
};

const navItems: NavItem[] = [
  {
    href: "/portal/dashboard",
    label: "Home",
    icon: <House size={22} weight="regular" />,
    activeIcon: <House size={22} weight="fill" />,
  },
  {
    href: "/portal/properties",
    label: "Properties",
    icon: <Buildings size={22} weight="regular" />,
    activeIcon: <Buildings size={22} weight="fill" />,
    matchPrefix: "/portal/properties",
  },
  {
    href: "/portal/calendar",
    label: "Calendar",
    icon: <CalendarBlank size={22} weight="regular" />,
    activeIcon: <CalendarBlank size={22} weight="fill" />,
    matchPrefix: "/portal/calendar",
  },
  {
    href: "/portal/messages",
    label: "Messages",
    icon: <ChatCircle size={22} weight="regular" />,
    activeIcon: <ChatCircle size={22} weight="fill" />,
    matchPrefix: "/portal/messages",
  },
];

export function PortalBottomNav({
  isAdmin = false,
  signOutSlot,
}: {
  isAdmin?: boolean;
  signOutSlot: ReactNode;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const { resolvedTheme, toggleTheme } = useTheme();

  const isActive = useCallback(
    (item: NavItem) => {
      if (item.matchPrefix) return pathname?.startsWith(item.matchPrefix);
      return pathname === item.href;
    },
    [pathname],
  );

  const isMoreActive =
    pathname?.startsWith("/portal/documents") ||
    pathname?.startsWith("/portal/account") ||
    pathname?.startsWith("/portal/hospitable");

  const closeMore = useCallback(() => setMoreOpen(false), []);

  return (
    <>
      {/* Bottom Nav Bar */}
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
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors"
                style={{
                  color: active
                    ? "var(--color-brand)"
                    : "var(--color-text-tertiary)",
                }}
              >
                {active ? item.activeIcon : item.icon}
                <span
                  className="text-[10px] font-semibold leading-none"
                  style={{
                    color: active
                      ? "var(--color-brand)"
                      : "var(--color-text-tertiary)",
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
            className="flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors"
            style={{
              color: moreOpen || isMoreActive
                ? "var(--color-brand)"
                : "var(--color-text-tertiary)",
            }}
            aria-label="More options"
            aria-expanded={moreOpen}
          >
            {moreOpen ? (
              <X size={22} weight="bold" />
            ) : (
              <DotsThree size={22} weight="bold" />
            )}
            <span
              className="text-[10px] font-semibold leading-none"
              style={{
                color: moreOpen || isMoreActive
                  ? "var(--color-brand)"
                  : "var(--color-text-tertiary)",
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
                paddingBottom:
                  "calc(env(safe-area-inset-bottom, 0px) + 80px)",
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center py-3">
                <div
                  className="h-1 w-10 rounded-full"
                  style={{ backgroundColor: "var(--color-warm-gray-200)" }}
                />
              </div>

              <div className="px-4 pb-4">
                <MoreLink
                  href="/portal/documents"
                  icon={<FileText size={20} weight="duotone" />}
                  label="Documents"
                  active={pathname?.startsWith("/portal/documents")}
                  onClick={closeMore}
                />
                <MoreLink
                  href="/portal/account"
                  icon={<GearSix size={20} weight="duotone" />}
                  label="Account"
                  active={pathname?.startsWith("/portal/account")}
                  onClick={closeMore}
                />
                <MoreLink
                  href="/help"
                  icon={<Question size={20} weight="duotone" />}
                  label="Help"
                  active={pathname === "/help"}
                  onClick={closeMore}
                />

                {isAdmin ? (
                  <MoreLink
                    href="/admin"
                    icon={<ShieldCheck size={20} weight="duotone" />}
                    label="Switch to Admin"
                    onClick={closeMore}
                  />
                ) : null}

                {/* Divider */}
                <div
                  className="my-2 border-t"
                  style={{ borderColor: "var(--color-warm-gray-200)" }}
                />

                {/* Theme toggle */}
                <button
                  type="button"
                  onClick={() => {
                    toggleTheme();
                    closeMore();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {resolvedTheme === "dark" ? (
                    <Sun size={20} weight="duotone" />
                  ) : (
                    <Moon size={20} weight="duotone" />
                  )}
                  {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
                </button>

                {/* Sign out */}
                <div className="mt-1">{signOutSlot}</div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function MoreLink({
  href,
  icon,
  label,
  active = false,
  onClick,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
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
        {icon}
      </span>
      {label}
    </Link>
  );
}
