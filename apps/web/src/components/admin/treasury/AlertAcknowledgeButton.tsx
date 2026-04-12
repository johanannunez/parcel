"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AlertAcknowledgeButtonProps {
  alertId: string;
}

export function AlertAcknowledgeButton({ alertId }: AlertAcknowledgeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleAcknowledge() {
    if (loading || done) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/treasury/alerts/${alertId}/acknowledge`, {
        method: "POST",
      });

      if (res.ok) {
        setDone(true);
        // Refresh server component data so the alert disappears
        router.refresh();
      }
    } catch {
      // Silently fail — the alert stays visible and can be retried
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleAcknowledge}
      disabled={loading || done}
      aria-label="Acknowledge alert"
      style={{
        flexShrink: 0,
        marginLeft: "auto",
        padding: "3px 10px",
        borderRadius: "6px",
        border: "1px solid var(--color-warm-gray-200)",
        backgroundColor: done ? "rgba(22,163,74,0.08)" : "var(--color-white)",
        color: done ? "#15803d" : "var(--color-text-tertiary)",
        fontSize: "11px",
        fontWeight: 600,
        cursor: loading || done ? "default" : "pointer",
        opacity: loading ? 0.5 : 1,
        transition: "background-color 0.15s ease, color 0.15s ease",
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      {done ? "Dismissed" : loading ? "..." : "Dismiss"}
    </button>
  );
}
