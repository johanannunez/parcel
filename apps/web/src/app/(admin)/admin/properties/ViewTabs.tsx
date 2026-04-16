"use client";

import Link from "next/link";
import { RocketLaunch, IdentificationCard } from "@phosphor-icons/react";

const tabs = [
  {
    key: "launchpad",
    label: "Launchpad",
    href: "/admin/properties?view=launchpad",
    icon: <RocketLaunch size={14} weight="duotone" />,
  },
  {
    key: "details",
    label: "Details",
    href: "/admin/properties?view=details",
    icon: <IdentificationCard size={14} weight="duotone" />,
  },
] as const;

export function ViewTabs({ activeView }: { activeView: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        borderRadius: "8px",
        border: "1px solid var(--color-warm-gray-200)",
        overflow: "hidden",
        backgroundColor: "var(--color-warm-gray-50)",
      }}
    >
      {tabs.map((tab, idx) => {
        const active = tab.key === activeView;
        const isLast = idx === tabs.length - 1;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: active ? 600 : 500,
              color: active ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
              backgroundColor: active ? "#ffffff" : "transparent",
              textDecoration: "none",
              borderRight: isLast ? "none" : "1px solid var(--color-warm-gray-200)",
              // Active tab reads as "pressed": inset shadow + subtle inner highlight
              boxShadow: active
                ? "inset 0 1px 3px rgba(15, 23, 42, 0.09), inset 0 0 0 1px rgba(2, 170, 235, 0.16)"
                : "none",
              transition: "background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease",
            }}
          >
            <span style={{ color: active ? "#02AAEB" : "var(--color-text-tertiary)" }}>
              {tab.icon}
            </span>
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
