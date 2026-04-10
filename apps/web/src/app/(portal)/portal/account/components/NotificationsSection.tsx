"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "parcel-notification-prefs";

type Preferences = {
  portalMessages: boolean;
  announcements: boolean;
  accountAlerts: boolean;
};

const DEFAULT_PREFS: Preferences = {
  portalMessages: true,
  announcements: true,
  accountAlerts: true,
};

const TOGGLE_ITEMS: {
  key: keyof Preferences;
  label: string;
  description: string;
}[] = [
  {
    key: "portalMessages",
    label: "Portal messages",
    description:
      "Get notified when The Parcel Company sends you a new message.",
  },
  {
    key: "announcements",
    label: "Announcements",
    description:
      "Receive system-wide updates, policy changes, and important notices.",
  },
  {
    key: "accountAlerts",
    label: "Account alerts",
    description:
      "Security notifications like new sign-ins and password changes.",
  },
];

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  id: string;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200"
      style={{
        backgroundColor: checked
          ? "var(--color-brand)"
          : "var(--color-warm-gray-200)",
      }}
    >
      <span
        className="pointer-events-none inline-block h-4.5 w-4.5 rounded-full shadow-sm transition-transform duration-200"
        style={{
          width: 18,
          height: 18,
          backgroundColor: "var(--color-white)",
          transform: checked ? "translateX(22px)" : "translateX(3px)",
        }}
      />
    </button>
  );
}

export function NotificationsSection({
  contactMethod,
}: {
  contactMethod: string;
}) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(stored) });
      }
    } catch {
      // localStorage unavailable or corrupt, use defaults
    }
    setLoaded(true);
  }, []);

  const updatePref = useCallback(
    (key: keyof Preferences, value: boolean) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: value };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // localStorage full or unavailable
        }
        return next;
      });
    },
    [],
  );

  if (!loaded) return null;

  return (
    <section id="notifications">
      <h2
        className="text-xl font-semibold tracking-tight"
        style={{ color: "var(--color-text-primary)" }}
      >
        Notifications
      </h2>
      <p
        className="mb-6 text-sm"
        style={{ color: "var(--color-text-secondary)" }}
      >
        Choose how and when you hear from us.
      </p>

      <div
        className="rounded-2xl border p-7"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: "var(--color-warm-gray-200)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* Contact method display */}
        <div
          className="mb-6 flex items-center gap-3 rounded-lg px-4 py-3"
          style={{ backgroundColor: "var(--color-warm-gray-50)" }}
        >
          <span
            className="text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Preferred contact method:{" "}
            <span
              className="font-medium capitalize"
              style={{ color: "var(--color-text-primary)" }}
            >
              {contactMethod}
            </span>
          </span>
        </div>

        {/* Toggle rows */}
        <div className="flex flex-col gap-0">
          {TOGGLE_ITEMS.map((item, index) => (
            <div
              key={item.key}
              className="flex items-center justify-between py-4"
              style={{
                borderTop:
                  index > 0
                    ? "1px solid var(--color-warm-gray-200)"
                    : undefined,
              }}
            >
              <div className="flex flex-col gap-0.5 pr-4">
                <label
                  htmlFor={`toggle-${item.key}`}
                  className="cursor-pointer text-sm font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {item.label}
                </label>
                <span
                  className="text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {item.description}
                </span>
              </div>
              <Toggle
                id={`toggle-${item.key}`}
                checked={prefs[item.key]}
                onChange={(v) => updatePref(item.key, v)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
