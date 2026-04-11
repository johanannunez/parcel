"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Copy, MagnifyingGlass, Plus, Eye, X, CaretDown } from "@phosphor-icons/react";
import { NotificationBell } from "@/components/portal/NotificationBell";
import { usePortalHeaderOverride } from "@/components/portal/PortalHeaderContext";
import { useTheme } from "@/components/ThemeProvider";
import { setViewingAs, clearViewingAs } from "@/app/(portal)/portal/viewing-as-actions";

/**
 * Portal app bar.
 *
 * Brand-blue gradient bar with white title + 1-line subtitle on the left,
 * action pill (route-specific) + search pill + bell on the right. The bar
 * is rendered for every portal route. Pages should NOT render their own
 * `<PageHeader>` because the bar IS the page header.
 *
 * IMPORTANT: All "white" colors are hardcoded literal `#ffffff` (or
 * `rgba(255,255,255,...)`) instead of Tailwind's `text-white` / `bg-white`
 * classes. The worktree's globals.css redefines `--color-white: #141414`
 * inside `.dark`, and Tailwind v4's `text-white` / `bg-white` reference
 * `var(--color-white)`, so they would flip to BLACK in dark mode. Hardcoded
 * literals stay white regardless of theme.
 *
 * Subtitles must be short. Long copy is truncated. Edit `getPortalHeader`
 * to tighten any string.
 */

type PortalHeader = {
  title: string;
  subtitle?: ReactNode;
  action?: { href: string; label: string };
  copyable?: boolean;
};

export type OwnerOption = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function getPortalHeader(
  pathname: string | null,
  firstName: string,
): PortalHeader | null {
  if (!pathname) return null;

  if (pathname === "/portal/dashboard") {
    return {
      title: `${getGreeting()}, ${firstName}.`,
      subtitle: "Properties, documents, and messages, all in one view.",
    };
  }

  if (pathname === "/portal/properties") {
    return {
      title: "Your properties",
      subtitle: "Every home under Parcel management.",
      action: { href: "/portal/setup/basics", label: "Add property" },
    };
  }

  if (pathname.startsWith("/portal/properties/")) {
    return {
      title: "Property details",
      subtitle: "Bookings, documents, and listing information.",
    };
  }

  if (pathname === "/portal/documents") {
    return {
      title: "Documents",
      subtitle: "Signed agreements, tax forms, and uploaded files.",
    };
  }

  if (pathname === "/portal/reserve") {
    return {
      title: "Reserve",
      subtitle: "Request time off for your home or review past requests.",
    };
  }

  if (pathname === "/portal/tasks") {
    return {
      title: "Tasks",
      subtitle: "Action items and to-dos from your Parcel team.",
    };
  }

  if (pathname === "/portal/timeline") {
    return {
      title: "Timeline",
      subtitle: "A history of activity on your account and properties.",
    };
  }

  if (pathname === "/portal/meetings") {
    return {
      title: "Meetings",
      subtitle: "Notes and summaries from your conversations with Parcel.",
    };
  }

  if (pathname === "/portal/members") {
    return {
      title: "Members",
      subtitle: "Your Parcel team and the people on your account.",
    };
  }

  if (pathname === "/portal/financials") {
    return {
      title: "Financials",
      subtitle: "Your billing and revenue summary.",
    };
  }

  if (pathname === "/portal/calendar") {
    return {
      title: "Calendar",
      subtitle:
        "Bookings, blocked dates, and owner stays across your portfolio.",
    };
  }

  if (pathname === "/portal/messages") {
    return {
      title: "Messages",
      subtitle: "Conversations with the Parcel team and important updates.",
    };
  }

  if (pathname === "/portal/notifications") {
    return {
      title: "Notifications",
      subtitle: "Recent activity and alerts from your portfolio.",
    };
  }

  if (pathname === "/portal/hospitable") {
    return {
      title: "Hospitable",
      subtitle: "Bookings, revenue, calendar, and guest messages.",
    };
  }

  if (pathname === "/portal/account") {
    return {
      title: "Account",
      subtitle: "Your profile, security, and preferences.",
    };
  }

  if (pathname.startsWith("/portal/setup")) {
    return {
      title: "Setup",
      subtitle: "Get your property ready for guests.",
    };
  }

  return null;
}

export function PortalAppBar({
  firstName,
  owners,
  viewingAsUserId,
}: {
  firstName: string;
  owners?: OwnerOption[];
  viewingAsUserId?: string | null;
}) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const override = usePortalHeaderOverride();
  const routeHeader = getPortalHeader(pathname, firstName);
  // Override from a mounted page wins over the pathname-based lookup. This
  // lets dynamic pages (e.g. /portal/properties/[id]) set the bar title
  // with data the shell doesn't have. Route-specific actions (like the
  // "Add property" pill on /portal/properties) are kept from the route
  // lookup so overrides don't accidentally blow them away.
  const header: PortalHeader | null = override
    ? {
        title: override.title,
        subtitle: override.subtitle,
        action: routeHeader?.action,
        copyable: override.copyable,
      }
    : routeHeader;
  const isDark = resolvedTheme === "dark";

  return (
    <header
      className="sticky top-0 z-20 border-b"
      style={{
        backgroundColor: isDark ? "#141414" : "#1b77be",
        borderColor: isDark
          ? "rgba(255, 255, 255, 0.08)"
          : "rgba(255, 255, 255, 0.18)",
      }}
    >
      <div
        className={
          header
            ? "mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6 sm:py-[18px] lg:px-10"
            : "mx-auto flex max-w-6xl items-center justify-end gap-6 px-4 py-2.5 sm:px-6 lg:px-10"
        }
      >
        {/* Left: title (+ optional copy button) + single-line subtitle */}
        {header ? (
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1
                className="min-w-0 truncate text-[19px] font-semibold leading-tight tracking-[-0.012em] sm:text-[22px]"
                style={{ color: "#ffffff" }}
              >
                {header.title}
              </h1>
              {header.copyable ? (
                <CopyButton text={header.title} />
              ) : null}
            </div>
            {header.subtitle ? (
              <div
                className="mt-1 max-w-[640px] overflow-hidden text-[12.5px] leading-snug sm:text-[13px]"
                style={{ color: "rgba(255, 255, 255, 0.82)" }}
              >
                {header.subtitle}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Right: action pill (if any) + owner switcher + [clock above search] + bell */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {header?.action ? (
            <Link
              href={header.action.href}
              className="hidden h-9 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-semibold shadow-[0_6px_18px_-8px_rgba(0,0,0,0.25)] transition-[opacity,transform] active:translate-y-px sm:inline-flex"
              style={{
                backgroundColor: "#ffffff",
                color: "#1b77be",
              }}
            >
              <Plus size={13} weight="bold" />
              {header.action.label}
            </Link>
          ) : null}
          {owners && owners.length > 0 ? (
            <AdminOwnerSwitcher
              owners={owners}
              viewingAsUserId={viewingAsUserId ?? null}
            />
          ) : null}
          <div className="flex flex-col items-center gap-1.5">
            <LiveClock />
            <SearchPill />
          </div>
          <BellOnBrand />
        </div>
      </div>
    </header>
  );
}

/**
 * Search trigger styled as a wide translucent pill on the brand-blue bar.
 * Click dispatches a synthetic ⌘K keydown that the global CommandPalette
 * listener catches and opens the modal.
 *
 * Uses inline `style` for all white-derived colors so dark mode does not
 * flip them to black via the `--color-white` redefinition.
 */
function SearchPill() {
  function handleClick() {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="hidden h-9 w-[200px] items-center gap-2 rounded-full border pl-3 pr-1.5 text-[12.5px] font-medium backdrop-blur-sm transition-colors lg:w-[240px] sm:flex"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        borderColor: "rgba(255, 255, 255, 0.28)",
        color: "rgba(255, 255, 255, 0.82)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.25)";
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.42)";
        e.currentTarget.style.color = "#ffffff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.28)";
        e.currentTarget.style.color = "rgba(255, 255, 255, 0.82)";
      }}
      aria-label="Open search"
    >
      <MagnifyingGlass size={14} weight="bold" />
      <span className="flex-1 text-left">Search</span>
      <kbd
        className="ml-1 inline-flex items-center justify-center rounded border px-1.5 py-0.5 text-[9.5px] font-semibold leading-none"
        style={{
          fontFamily: "inherit",
          backgroundColor: "rgba(255, 255, 255, 0.18)",
          borderColor: "rgba(255, 255, 255, 0.32)",
          color: "rgba(255, 255, 255, 0.88)",
        }}
      >
        ⌘K
      </kbd>
    </button>
  );
}

function ordinalSuffix(day: number): string {
  const rem100 = day % 100;
  if (rem100 >= 11 && rem100 <= 13) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

/**
 * Live clock for the portal app bar.
 *
 * Single row: date · divider · time, centered above the search+bell row.
 * Hidden below `md` — the mobile bar only has room for the bell.
 *
 * Renders at opacity 0 until mounted to avoid a hydration mismatch between
 * the server's "now" and the client's. The invisible skeleton reserves the
 * exact horizontal space so nothing shifts when the clock appears.
 *
 * White colors are hardcoded literals — not `text-white` — because
 * globals.css redefines `--color-white` in dark mode.
 */
function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  let dateAriaStr = "Sat, Apr 11th, 2026";
  let timeStr = "12:00:00 AM";
  let dateNode: ReactNode = "Sat, Apr 11th, 2026";

  if (now) {
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    timeStr = `${displayHours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} ${period}`;

    const day = now.getDate();
    const suffix = ordinalSuffix(day);
    const weekday = now.toLocaleDateString("en-US", { weekday: "short" });
    const month = now.toLocaleDateString("en-US", { month: "short" });
    const year = now.getFullYear();

    dateAriaStr = `${weekday}, ${month} ${day}${suffix}, ${year}`;
    dateNode = (
      <>
        {weekday}, {month} {day}
        <span
          style={{
            fontSize: "8.5px",
            verticalAlign: "baseline",
            fontWeight: 600,
            opacity: 0.65,
            letterSpacing: "0.03em",
          }}
        >
          {suffix}
        </span>
        , {year}
      </>
    );
  }

  return (
    <div
      className="hidden items-center gap-2 md:flex"
      style={{ opacity: now ? 1 : 0 }}
      aria-label={`${dateAriaStr}, ${timeStr}`}
      suppressHydrationWarning
    >
      <span
        className="text-[11px] font-semibold"
        style={{ color: "rgba(255, 255, 255, 0.82)" }}
      >
        {dateNode}
      </span>
      {/* Thin vertical divider */}
      <span
        className="h-[13px] w-px shrink-0"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.35)" }}
        aria-hidden
      />
      <span
        className="text-[11px] font-bold tabular-nums"
        style={{ color: "#ffffff" }}
      >
        {timeStr}
      </span>
      {/* Pulsing live dot after the time */}
      <span className="relative flex h-2 w-2 shrink-0">
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
          style={{ backgroundColor: "#4ade80" }}
        />
        <span
          className="relative inline-flex h-2 w-2 rounded-full"
          style={{ backgroundColor: "#4ade80" }}
        />
      </span>
    </div>
  );
}

/**
 * NotificationBell wrapper that forces the trigger button to white and the
 * unread badge to white-on-brand-blue. Uses Tailwind arbitrary variants
 * with `[&_button[aria-label='Notifications']]` descendant selectors plus
 * `!important` so we override NotificationBell's inline styles without
 * editing NotificationBell itself (another agent owns that file).
 *
 * Color values are HARDCODED literals — not `text-white` / `bg-white` —
 * because the worktree redefines `--color-white` in dark mode.
 *
 * The dropdown panel (when you click the bell) is unaffected: its internal
 * selectors don't match the descendant pattern, so dropdown text stays
 * dark-on-light as designed.
 */
function BellOnBrand() {
  return (
    <div
      className="
        [&_button[aria-label='Notifications']]:![color:#ffffff]
        [&_button[aria-label='Notifications']:hover]:![background-color:rgba(255,255,255,0.15)]
        [&_button[aria-label='Notifications']>span]:![background-color:#ffffff]
        [&_button[aria-label='Notifications']>span]:![color:#1b77be]
      "
    >
      <NotificationBell align="right" />
    </div>
  );
}

/**
 * Small icon button that copies `text` to the clipboard on click.
 * Swaps the copy glyph to a check for ~1.5s after a successful copy to
 * confirm the action without a toast. Silent on clipboard-API failures
 * (older browsers, insecure contexts) since the user can still select
 * the visible title text as a fallback.
 */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable; user can still select the title manually.
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Copy ${text}`}
        title="Copy address"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
        style={{
          color: "#ffffff",
          backgroundColor: copied
            ? "rgba(255, 255, 255, 0.22)"
            : "rgba(255, 255, 255, 0.12)",
          transition: "background-color 150ms ease-out",
        }}
        onMouseEnter={(e) => {
          if (!copied) {
            e.currentTarget.style.backgroundColor =
              "rgba(255, 255, 255, 0.22)";
          }
        }}
        onMouseLeave={(e) => {
          if (!copied) {
            e.currentTarget.style.backgroundColor =
              "rgba(255, 255, 255, 0.12)";
          }
        }}
      >
        <Copy size={13} weight="bold" />
      </button>

      {/* Floating toast that drops in on successful copy and fades out */}
      <div
        role="status"
        aria-live="polite"
        aria-hidden={!copied}
        className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold"
        style={{
          backgroundColor: "rgba(17, 17, 20, 0.96)",
          color: "#ffffff",
          boxShadow: "0 10px 28px -10px rgba(0, 0, 0, 0.45)",
          opacity: copied ? 1 : 0,
          transform: copied
            ? "translate(-50%, 0) scale(1)"
            : "translate(-50%, -4px) scale(0.96)",
          transition:
            "opacity 180ms ease-out, transform 220ms cubic-bezier(0.2, 0.9, 0.3, 1.1)",
        }}
      >
        <Check
          size={11}
          weight="bold"
          style={{ color: "#22c55e" }}
          aria-hidden
        />
        Copied
      </div>
    </div>
  );
}

/**
 * Admin-only owner switcher pill for the portal app bar.
 *
 * Idle state: ghost white pill "View as ▾" — opens a dropdown of all owners.
 * Active state: amber pill showing the owner's first name + X to exit.
 * Owners without an avatar fall back to two-letter initials.
 */
function AdminOwnerSwitcher({
  owners,
  viewingAsUserId,
}: {
  owners: OwnerOption[];
  viewingAsUserId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  const currentOwner = viewingAsUserId
    ? (owners.find((o) => o.id === viewingAsUserId) ?? null)
    : null;

  const firstName =
    currentOwner?.full_name?.split(" ")[0] ??
    currentOwner?.email?.split("@")[0] ??
    "";

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  function handleSelect(ownerId: string) {
    setOpen(false);
    startTransition(() => setViewingAs(ownerId));
  }

  function handleClearClick(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(() => clearViewingAs());
  }

  const isActive = !!currentOwner;

  return (
    <div className="relative" ref={ref}>
      {/* Pill trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] font-semibold transition-colors disabled:opacity-50"
        style={
          isActive
            ? {
                backgroundColor: "rgba(245, 158, 11, 0.22)",
                borderColor: "rgba(245, 158, 11, 0.50)",
                color: "#ffffff",
              }
            : {
                backgroundColor: "rgba(255, 255, 255, 0.14)",
                borderColor: "rgba(255, 255, 255, 0.28)",
                color: "#ffffff",
              }
        }
      >
        <Eye size={13} weight="duotone" />
        {isActive ? firstName : "View as"}
        {isActive ? (
          <span
            role="button"
            aria-label="Exit owner view"
            onClick={handleClearClick}
            className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-white/20"
          >
            <X size={9} weight="bold" />
          </span>
        ) : (
          <CaretDown size={11} weight="bold" />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border"
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-warm-gray-200)",
            boxShadow: "0 8px 32px -4px rgba(0,0,0,0.14)",
          }}
        >
          <div
            className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            View portal as
          </div>
          <ul className="pb-1">
            {owners.map((owner) => {
              const isSelected = owner.id === viewingAsUserId;
              const initials = owner.full_name
                ? owner.full_name
                    .split(" ")
                    .filter(Boolean)
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : owner.email.slice(0, 2).toUpperCase();
              return (
                <li key={owner.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(owner.id)}
                    disabled={isPending}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[var(--color-warm-gray-50)] disabled:opacity-50"
                    style={{
                      backgroundColor: isSelected
                        ? "var(--color-warm-gray-100)"
                        : undefined,
                    }}
                  >
                    {owner.avatar_url ? (
                      <img
                        src={owner.avatar_url}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: "rgba(2, 170, 235, 0.12)",
                          color: "var(--color-brand)",
                        }}
                      >
                        {initials}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-sm font-semibold"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {owner.full_name ?? owner.email}
                      </div>
                      <div
                        className="truncate text-xs"
                        style={{ color: "var(--color-text-tertiary)" }}
                      >
                        {owner.email}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
