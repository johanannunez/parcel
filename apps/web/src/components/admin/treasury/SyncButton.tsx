"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowsClockwise } from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";

const COOLDOWN_SECONDS = 5 * 60; // 5 minutes

interface SyncButtonProps {
  lastSyncedAt: string | null;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function relativeTime(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "";
  }
}

export function SyncButton({ lastSyncedAt }: SyncButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0); // seconds remaining
  const [relTime, setRelTime] = useState<string | null>(
    lastSyncedAt ? relativeTime(lastSyncedAt) : null
  );

  // Keep relative time fresh
  useEffect(() => {
    if (!lastSyncedAt) return;
    setRelTime(relativeTime(lastSyncedAt));
    const id = setInterval(() => {
      setRelTime(relativeTime(lastSyncedAt));
    }, 30_000);
    return () => clearInterval(id);
  }, [lastSyncedAt]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1_000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleSync = useCallback(async () => {
    if (loading || cooldown > 0) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/treasury/sync", { method: "POST" });

      if (res.status === 429) {
        const body = await res.json().catch(() => ({}));
        const retryAfter = body?.retryAfterMinutes ?? body?.retry_after_minutes ?? null;
        setError(
          retryAfter
            ? `Please wait ${retryAfter} minute${retryAfter === 1 ? "" : "s"}`
            : "Please wait before syncing again"
        );
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? "Sync failed. Try again.");
        setLoading(false);
        return;
      }

      // Success
      setCooldown(COOLDOWN_SECONDS);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }, [loading, cooldown, router]);

  const disabled = loading || cooldown > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {relTime && !loading && cooldown === 0 && (
          <span
            style={{
              fontSize: "12px",
              color: "var(--color-text-tertiary)",
            }}
          >
            Synced {relTime}
          </span>
        )}

        {cooldown > 0 && (
          <span
            style={{
              fontSize: "12px",
              color: "var(--color-text-tertiary)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            Next sync in {formatCountdown(cooldown)}
          </span>
        )}

        <button
          onClick={handleSync}
          disabled={disabled}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            borderRadius: "8px",
            border: disabled ? "1.5px solid var(--color-warm-gray-200)" : "1.5px solid #02AAEB",
            backgroundColor: disabled ? "var(--color-white)" : "#02AAEB",
            color: disabled ? "var(--color-text-tertiary)" : "#fff",
            fontSize: "13px",
            fontWeight: 600,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.6 : 1,
            transition: "background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease",
          }}
          aria-label="Sync treasury data now"
        >
          <ArrowsClockwise
            size={14}
            weight="bold"
            style={{
              animation: loading ? "spin 0.7s linear infinite" : undefined,
            }}
          />
          {loading ? "Syncing..." : cooldown > 0 ? "Synced" : "Sync Now"}
        </button>
      </div>

      {error && (
        <span
          style={{
            fontSize: "11px",
            color: "#dc2626",
          }}
        >
          {error}
        </span>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
