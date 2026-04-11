"use client";

import { useEffect, useState, useRef } from "react";
import { DownloadSimple, X, Export } from "@phosphor-icons/react";

const VISIT_KEY = "parcel-visit-count";
const DISMISS_KEY = "parcel-install-dismissed";
const MIN_VISITS = 2;

/**
 * PWA install banner. Shows after the owner's 2nd visit.
 * Handles Chrome/Edge (beforeinstallprompt) and iOS Safari (manual instructions).
 */
export function InstallBanner() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Already dismissed
    if (localStorage.getItem(DISMISS_KEY) === "true") return;

    // Increment visit counter
    const count = parseInt(localStorage.getItem(VISIT_KEY) ?? "0", 10) + 1;
    localStorage.setItem(VISIT_KEY, String(count));

    // Not enough visits yet
    if (count < MIN_VISITS) return;

    // Detect iOS
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    // Listen for Chrome/Edge install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // On iOS, show the banner directly (no beforeinstallprompt event)
    if (ios) {
      setShow(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPromptRef.current) {
      deferredPromptRef.current.prompt();
      const result = await deferredPromptRef.current.userChoice;
      if (result.outcome === "accepted") {
        setShow(false);
      }
      deferredPromptRef.current = null;
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, "true");
  };

  if (!show) return null;

  return (
    <div
      className="relative flex items-center gap-3 rounded-xl border px-4 py-3"
      style={{
        borderLeft: "3px solid var(--color-brand)",
        borderColor: "var(--color-warm-gray-200)",
        borderLeftColor: "var(--color-brand)",
        backgroundColor: "rgba(2, 170, 235, 0.02)",
      }}
    >
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full opacity-40 transition-opacity hover:opacity-100"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        <X size={12} />
      </button>

      <img
        src="/brand/logo-mark.png"
        alt=""
        width={28}
        height={28}
        className="shrink-0"
      />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
          Install Parcel for a faster experience
        </p>
        {isIOS ? (
          <p className="mt-0.5 flex items-center gap-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Tap <Export size={12} weight="bold" style={{ color: "var(--color-brand)" }} /> then &quot;Add to Home Screen&quot;
          </p>
        ) : (
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Add to your home screen for quick access.
          </p>
        )}
      </div>

      {!isIOS ? (
        <button
          type="button"
          onClick={handleInstall}
          className="shrink-0 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--color-brand)" }}
        >
          <span className="flex items-center gap-1.5">
            <DownloadSimple size={14} weight="bold" />
            Install
          </span>
        </button>
      ) : null}
    </div>
  );
}

// TypeScript declaration for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}
