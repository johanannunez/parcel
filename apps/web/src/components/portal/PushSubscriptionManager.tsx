"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, X } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";

/**
 * Manages push notification subscription.
 * Shows an inline card on the Messages page prompting the owner
 * to enable notifications if they haven't already.
 */
export function PushPermissionCard() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [dismissed, setDismissed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);

    // Check if already dismissed
    if (localStorage.getItem("parcel-push-dismissed") === "true") {
      setDismissed(true);
    }
  }, []);

  const handleEnable = useCallback(async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

    setSubscribing(true);

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        setSubscribing(false);
        return;
      }

      // Get the service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.warn("[Push] VAPID public key not set");
        setSubscribing(false);
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
      });

      // Save to Supabase
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSubscribing(false);
        return;
      }

      const subJson = subscription.toJSON();
      await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: subJson.endpoint!,
          keys: subJson.keys as Record<string, string>,
          device_info: detectDevice(),
        },
        { onConflict: "user_id,endpoint" },
      );
    } catch (err) {
      console.error("[Push] Subscription failed:", err);
    }

    setSubscribing(false);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("parcel-push-dismissed", "true");
  };

  // Don't show if: unsupported, already granted, denied, or dismissed
  if (permission === "unsupported" || permission === "granted" || permission === "denied" || dismissed) {
    return null;
  }

  return (
    <div
      className="relative flex items-center gap-3 rounded-xl border px-4 py-3"
      style={{
        borderColor: "rgba(2, 170, 235, 0.15)",
        backgroundColor: "rgba(2, 170, 235, 0.03)",
      }}
    >
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full opacity-50 transition-opacity hover:opacity-100"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        <X size={12} />
      </button>

      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: "rgba(2, 170, 235, 0.1)", color: "var(--color-brand)" }}
      >
        <Bell size={18} weight="duotone" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
          Never miss a message
        </p>
        <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
          Turn on notifications to get alerted when The Parcel Company sends you something.
        </p>
      </div>
      <button
        type="button"
        onClick={handleEnable}
        disabled={subscribing}
        className="shrink-0 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: "var(--color-brand)" }}
      >
        {subscribing ? "Enabling..." : "Enable"}
      </button>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    arr[i] = raw.charCodeAt(i);
  }
  return arr;
}

function detectDevice(): string {
  const ua = navigator.userAgent;
  let browser = "Browser";
  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome/") && !ua.includes("Edg/")) browser = "Chrome";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Safari/") && !ua.includes("Chrome/")) browser = "Safari";

  let os = "Unknown";
  if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/Mac/.test(ua)) os = "macOS";
  else if (/Win/.test(ua)) os = "Windows";

  return `${browser} on ${os}`;
}
