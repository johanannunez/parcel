"use client";

import { useEffect, useState } from "react";
import type { Changelog } from "@/lib/admin/changelogs";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  feature: { bg: "rgba(2,170,235,0.15)", color: "#02AAEB" },
  fix: { bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
  improvement: { bg: "rgba(16,185,129,0.15)", color: "#10b981" },
  breaking: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b" },
};

function TagPill({ tag }: { tag: string | null }) {
  if (!tag) return null;
  const style = TAG_COLORS[tag] ?? { bg: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.55)" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 7px",
        borderRadius: "99px",
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        background: style.bg,
        color: style.color,
        flexShrink: 0,
      }}
    >
      {tag}
    </span>
  );
}

export function WhatsNewPanel() {
  const [entries, setEntries] = useState<Changelog[] | null>(null);

  useEffect(() => {
    fetch("/api/changelogs")
      .then((r) => r.json())
      .then((data: Changelog[]) => setEntries(data))
      .catch(() => setEntries([]));
  }, []);

  if (entries === null) {
    return (
      <div
        style={{
          padding: "40px 20px",
          textAlign: "center",
          color: "rgba(255,255,255,0.25)",
          fontSize: "13px",
        }}
      >
        Loading…
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div
        style={{
          padding: "40px 20px",
          textAlign: "center",
          color: "rgba(255,255,255,0.35)",
          fontSize: "13px",
        }}
      >
        No updates yet.
      </div>
    );
  }

  return (
    <div style={{ padding: "8px 0 16px" }}>
      {entries.map((e, idx) => (
        <div key={e.id}>
          <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  flex: 1,
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#E0EDF8",
                  lineHeight: 1.3,
                }}
              >
                {e.title}
              </span>
              {e.version && (
                <span
                  style={{
                    fontSize: "10.5px",
                    fontFamily: "ui-monospace, monospace",
                    color: "rgba(255,255,255,0.35)",
                    flexShrink: 0,
                  }}
                >
                  {e.version}
                </span>
              )}
              <TagPill tag={e.tag} />
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "12px",
                color: "rgba(255,255,255,0.45)",
                lineHeight: 1.6,
              }}
            >
              {e.body}
            </p>
            <span
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.25)",
              }}
            >
              {formatDate(e.published_at)}
            </span>
          </div>
          {idx < entries.length - 1 && (
            <div
              style={{
                height: "1px",
                background: "rgba(255,255,255,0.05)",
                margin: "0 20px",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
