"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  UsersThree,
  CalendarBlank,
  ChatCircle,
  DotsThree,
  Buildings,
  Wallet,
  EnvelopeSimple,
  ClipboardText,
  X,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
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

export function AdminBottomNav({
  pendingBlockCount = 0,
  signOutSlot,
}: {
  pendingBlockCount?: number;
  signOutSlot: ReactNode;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = useCallback(
    (item: NavItem) => {
      if (item.matchPrefix) return pathname?.startsWith(item.matchPrefix);
      return pathname === item.href;
    },
    [pathname],
  );

  const isMoreActive =
    pathname?.startsWith("/admin/properties") ||
    pathname?.startsWith("/admin/payouts") ||
    pathname?.startsWith("/admin/inquiries") ||
    pathname?.startsWith("/admin/block-requests");

  const closeMore = useCallback(() => setMoreOpen(false), []);

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
              <DotsThree size={22} weight="bold" />
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
              className="fixed inset-0 z-30 bg-black/50 md:hidden"
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
                paddingBottom:
                  "calc(env(safe-area-inset-bottom, 0px) + 80px)",
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center py-3">
                <div
                  className="h-1 w-10 rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                />
              </div>

              <div className="px-4 pb-4">
                <AdminMoreLink
                  href="/admin/properties"
                  icon={<Buildings size={20} weight="duotone" />}
                  label="Properties"
                  active={pathname?.startsWith("/admin/properties")}
                  onClick={closeMore}
                />
                <AdminMoreLink
                  href="/admin/payouts"
                  icon={<Wallet size={20} weight="duotone" />}
                  label="Payouts"
                  active={pathname?.startsWith("/admin/payouts")}
                  onClick={closeMore}
                />
                <AdminMoreLink
                  href="/admin/inquiries"
                  icon={<EnvelopeSimple size={20} weight="duotone" />}
                  label="Inquiries"
                  active={pathname?.startsWith("/admin/inquiries")}
                  onClick={closeMore}
                />
                <AdminMoreLink
                  href="/admin/block-requests"
                  icon={<ClipboardText size={20} weight="duotone" />}
                  label="Reservations"
                  active={pathname?.startsWith("/admin/block-requests")}
                  badge={pendingBlockCount}
                  onClick={closeMore}
                />

                {/* Divider */}
                <div
                  className="my-2 border-t"
                  style={{ borderColor: "rgba(255,255,255,0.08)" }}
                />

                {/* Portal link */}
                <Link
                  href="/portal/dashboard"
                  onClick={closeMore}
                  className="mb-1 flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold"
                  style={{
                    background: "linear-gradient(135deg, #02AAEB 0%, #1B77BE 100%)",
                    color: "#fff",
                    boxShadow: "0 2px 8px rgba(2, 170, 235, 0.25)",
                    textDecoration: "none",
                  }}
                >
                  <House size={20} weight="duotone" style={{ color: "#fff" }} />
                  Portal
                </Link>

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

function AdminMoreLink({
  href,
  icon,
  label,
  active = false,
  badge,
  onClick,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
      style={{
        color: active
          ? "var(--color-brand-light)"
          : "rgba(255,255,255,0.7)",
        backgroundColor: active
          ? "rgba(2, 170, 235, 0.1)"
          : "transparent",
      }}
    >
      <span
        style={{
          color: active
            ? "var(--color-brand-light)"
            : "rgba(255,255,255,0.5)",
        }}
      >
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {badge && badge > 0 ? (
        <span
          className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold"
          style={{ backgroundColor: "#f59e0b", color: "#1a1a1a" }}
        >
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
