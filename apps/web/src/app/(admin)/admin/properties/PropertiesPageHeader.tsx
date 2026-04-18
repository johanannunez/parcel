"use client";

import { useEffect, useState, type ReactNode } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { ViewTabs } from "./ViewTabs";

/**
 * Full-bleed brand-blue banner that mirrors the portal PortalAppBar style,
 * adapted for admin. White title + subtitle on the left, search + date/time
 * on the right. ViewTabs sit directly below the banner on a white bar.
 *
 * `rightSlot` renders on the right end of the tab strip (e.g. the filter
 * popover) so pages don't need an extra row just to hold a button.
 */
export function PropertiesPageHeader({
  activeView,
  total,
  rightSlot,
}: {
  activeView: string;
  total: number;
  rightSlot?: ReactNode;
}) {
  // Live clock, client-side only to avoid hydration flicker
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const dateLabel = now
    ? now.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "";
  const timeLabel = now
    ? now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : "";

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* ── Brand-blue banner (edge-to-edge with sidebar) ── */}
      <div
        style={{
          background: "linear-gradient(180deg, #02AAEB 0%, #1B77BE 100%)",
          padding: "22px 32px 22px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          flexWrap: "wrap",
          boxShadow: "0 1px 0 rgba(0,0,0,0.05)",
        }}
      >
        {/* Left: title + subtitle */}
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-0.02em",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Properties
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "rgba(255,255,255,0.8)",
              margin: "3px 0 0 0",
              fontWeight: 500,
            }}
          >
            {total} {total === 1 ? "home" : "homes"} under Parcel management
          </p>
        </div>

        {/* Right: search + date/time */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Search trigger */}
          <button
            type="button"
            aria-label="Search (⌘K)"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px 8px 11px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.18)",
              backgroundColor: "rgba(255,255,255,0.12)",
              fontSize: "12px",
              color: "rgba(255,255,255,0.9)",
              cursor: "pointer",
              minWidth: "220px",
              transition: "background-color 120ms ease",
              backdropFilter: "blur(4px)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.12)";
            }}
          >
            <MagnifyingGlass size={13} weight="bold" />
            <span style={{ flex: 1, textAlign: "left" }}>Search properties, items...</span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                padding: "1px 5px",
                borderRadius: "4px",
                backgroundColor: "rgba(255,255,255,0.18)",
                color: "#ffffff",
                letterSpacing: "0.02em",
              }}
            >
              ⌘K
            </span>
          </button>

          {/* Date + time block */}
          {now && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "1px",
                paddingLeft: "12px",
                borderLeft: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#ffffff",
                  letterSpacing: "-0.005em",
                }}
              >
                {dateLabel}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.7)",
                  fontVariantNumeric: "tabular-nums",
                  fontWeight: 500,
                }}
              >
                {timeLabel}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── View tab strip (white row below banner, edge-to-edge) ── */}
      <div
        style={{
          backgroundColor: "var(--color-white)",
          borderBottom: "1px solid var(--color-warm-gray-200)",
          padding: "10px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <ViewTabs activeView={activeView} />
        {rightSlot && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {rightSlot}
          </div>
        )}
      </div>
    </div>
  );
}
