"use client";

import { useEffect, useRef, useState } from "react";
import {
  UserCircle,
  Lock,
  Devices,
  Bell,
  DeviceMobile,
  Globe,
  DownloadSimple,
  Warning,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

type NavEntry = {
  id: string;
  label: string;
  icon: Icon;
};

const NAV_ITEMS: NavEntry[] = [
  { id: "profile", label: "Profile", icon: UserCircle },
  { id: "security", label: "Email & Password", icon: Lock },
  { id: "sessions", label: "Sessions", icon: Devices },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "install", label: "Install web app", icon: DeviceMobile },
  { id: "region", label: "Region", icon: Globe },
  { id: "data-export", label: "Data Export", icon: DownloadSimple },
  { id: "danger-zone", label: "Danger Zone", icon: Warning },
];

export function AccountNav() {
  const [activeId, setActiveId] = useState<string>("profile");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const sectionIds = NAV_ITEMS.map((item) => item.id);
    const visibleSections = new Map<string, number>();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleSections.set(entry.target.id, entry.intersectionRatio);
          } else {
            visibleSections.delete(entry.target.id);
          }
        }

        // Pick the first visible section in document order
        for (const id of sectionIds) {
          if (visibleSections.has(id)) {
            setActiveId(id);
            break;
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: [0, 0.1, 0.5] },
    );

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observerRef.current.observe(el);
    }

    return () => observerRef.current?.disconnect();
  }, []);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <>
      {/* Desktop: sticky sidebar nav */}
      <nav
        aria-label="Account sections"
        className="sticky top-28 hidden h-fit w-[200px] shrink-0 flex-col gap-0.5 lg:flex"
      >
        {NAV_ITEMS.map((item) => {
          const active = activeId === item.id;
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollTo(item.id)}
              className="relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-[var(--color-warm-gray-50)]"
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
                className="inline-flex h-5 w-5 items-center justify-center"
                style={{
                  color: active
                    ? "var(--color-brand)"
                    : "var(--color-text-tertiary)",
                }}
              >
                <IconComponent size={16} weight="duotone" />
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Mobile: horizontal scrolling pill nav */}
      <nav
        aria-label="Account sections"
        className="scrollbar-hide -mx-6 flex gap-1.5 overflow-x-auto px-6 pb-2 lg:hidden"
      >
        {NAV_ITEMS.map((item) => {
          const active = activeId === item.id;
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollTo(item.id)}
              className="flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors"
              style={{
                color: active
                  ? "var(--color-white)"
                  : "var(--color-text-secondary)",
                backgroundColor: active
                  ? "var(--color-brand)"
                  : "var(--color-white)",
                borderColor: active
                  ? "var(--color-brand)"
                  : "var(--color-warm-gray-200)",
              }}
            >
              <IconComponent size={14} weight={active ? "fill" : "duotone"} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
