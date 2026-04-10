"use client";

import { useEffect, useState, useTransition } from "react";
import { ShieldCheck, Devices, SignOut } from "@phosphor-icons/react";
import { signOutOtherSessions } from "../actions";

function detectBrowser(ua: string): string {
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("Chrome/") && !ua.includes("Edg/")) return "Chrome";
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "Safari";
  return "Browser";
}

function detectOS(ua: string): string {
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/Android/.test(ua)) return "Android";
  if (/Mac/.test(ua)) return "macOS";
  if (/Win/.test(ua)) return "Windows";
  if (/Linux/.test(ua)) return "Linux";
  return "Unknown OS";
}

export function SessionsSection() {
  const [browser, setBrowser] = useState("Browser");
  const [os, setOS] = useState("Unknown OS");
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    setBrowser(detectBrowser(ua));
    setOS(detectOS(ua));
  }, []);

  function handleSignOutOthers() {
    setFeedback(null);
    startTransition(async () => {
      const result = await signOutOtherSessions();
      setFeedback(result);
    });
  }

  return (
    <section id="sessions">
      <h2
        className="text-xl font-semibold tracking-tight"
        style={{ color: "var(--color-text-primary)" }}
      >
        Sessions
      </h2>
      <p
        className="mb-6 text-sm"
        style={{ color: "var(--color-text-secondary)" }}
      >
        Manage your active sessions across devices.
      </p>

      <div
        className="rounded-2xl border p-7"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: "var(--color-warm-gray-200)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* Current device */}
        <div className="flex items-center gap-4">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: "var(--color-warm-gray-100)" }}
          >
            <Devices
              size={20}
              weight="duotone"
              style={{ color: "var(--color-brand)" }}
            />
          </div>

          <div className="flex flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                {browser} on {os}
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
                style={{
                  backgroundColor: "rgba(22, 163, 74, 0.1)",
                  color: "var(--color-success)",
                }}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor: "var(--color-success)",
                    animation: "pulse 2s ease-in-out infinite",
                  }}
                />
                This device
              </span>
            </div>
            <span
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Currently active session
            </span>
          </div>
        </div>

        {/* Security info */}
        <div
          className="mt-5 flex items-center gap-3 rounded-lg px-4 py-3"
          style={{ backgroundColor: "var(--color-warm-gray-50)" }}
        >
          <ShieldCheck
            size={18}
            weight="duotone"
            style={{ color: "var(--color-success)" }}
          />
          <span
            className="text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Your session is encrypted and secure.
          </span>
        </div>

        {/* Feedback */}
        {feedback && (
          <div
            className="mt-4 rounded-lg border px-4 py-3 text-sm font-medium"
            style={{
              backgroundColor: feedback.ok
                ? "rgba(22, 163, 74, 0.08)"
                : "rgba(220, 38, 38, 0.08)",
              borderColor: feedback.ok
                ? "rgba(22, 163, 74, 0.25)"
                : "rgba(220, 38, 38, 0.25)",
              color: feedback.ok
                ? "var(--color-success)"
                : "var(--color-error)",
            }}
          >
            {feedback.message}
          </div>
        )}

        {/* Sign out other sessions */}
        <div
          className="mt-5 flex items-center justify-between border-t pt-5"
          style={{ borderColor: "var(--color-warm-gray-200)" }}
        >
          <div>
            <p
              className="text-sm font-medium"
              style={{ color: "var(--color-text-primary)" }}
            >
              Other sessions
            </p>
            <p
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Sign out of all sessions except this one.
            </p>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={handleSignOutOthers}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-60"
            style={{
              borderColor: "var(--color-warm-gray-200)",
              color: "var(--color-text-primary)",
              backgroundColor: "var(--color-white)",
            }}
          >
            <SignOut size={16} weight="bold" />
            {pending ? "Signing out..." : "Sign out other sessions"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </section>
  );
}
