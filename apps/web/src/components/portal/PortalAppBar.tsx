"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { NotificationBell } from "@/components/portal/NotificationBell";
import { usePortalHeaderOverride } from "@/components/portal/PortalHeaderContext";
import { useTheme } from "@/components/ThemeProvider";

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
  subtitle?: string;
  action?: { href: string; label: string };
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

export function PortalAppBar({ firstName }: { firstName: string }) {
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
        {/* Left: title + single-line subtitle */}
        {header ? (
          <div className="min-w-0 flex-1">
            <h1
              className="truncate text-[19px] font-semibold leading-tight tracking-[-0.012em] sm:text-[22px]"
              style={{ color: "#ffffff" }}
            >
              {header.title}
            </h1>
            {header.subtitle ? (
              <p
                className="mt-1 max-w-[640px] truncate text-[12.5px] leading-snug sm:text-[13px]"
                style={{ color: "rgba(255, 255, 255, 0.78)" }}
              >
                {header.subtitle}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Right: action + search + bell */}
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
          <SearchPill />
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
