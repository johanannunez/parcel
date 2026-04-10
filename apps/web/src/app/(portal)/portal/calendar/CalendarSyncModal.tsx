"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Check, X } from "@phosphor-icons/react";

type CalendarOption = {
  id: "google" | "apple" | "outlook";
  label: string;
  icon: React.ReactNode;
  steps: string[];
};

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M18.316 5.684H24v12.632h-5.684V5.684z" fill="#1a73e8" />
      <path d="M5.684 18.316H0V5.684h5.684v12.632z" fill="#ea4335" />
      <path d="M18.316 24H5.684v-5.684h12.632V24z" fill="#34a853" />
      <path d="M18.316 5.684V0H5.684v5.684h12.632z" fill="#fbbc04" />
      <path d="M18.316 18.316H24V24h-5.684v-5.684z" fill="#188038" />
      <path d="M0 5.684h5.684V0H0v5.684z" fill="#d93025" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#000">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function OutlookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M24 7.387v10.478c0 .23-.08.424-.238.583a.795.795 0 01-.583.238h-8.322V6.566h8.322c.23 0 .424.08.583.238.159.16.238.353.238.583z" fill="#0364b8" />
      <path d="M16.566 6.566v12.12H8.476l-1.025-.153-1.178-.18V5.87l1.178-.178L8.476 5.5h8.09v1.066z" fill="#0a2767" />
      <path d="M8.476 5.5v13.186l-2.203.342L0 17.643V6.566l.847-.178L8.476 5.5z" fill="#1490df" />
      <path d="M8.476 5.5v6.566H0V5.5h8.476z" fill="#28a8ea" />
      <rect x="1.5" y="8.5" width="5.5" height="7" rx=".6" fill="#0078d4" />
      <path d="M4.238 10.5c-.9 0-1.588.72-1.588 1.6 0 .88.688 1.6 1.588 1.6.9 0 1.587-.72 1.587-1.6 0-.88-.688-1.6-1.587-1.6z" fill="#fff" />
    </svg>
  );
}

const OPTIONS: CalendarOption[] = [
  {
    id: "google",
    label: "Google Calendar",
    icon: <GoogleIcon />,
    steps: [
      "Open Google Calendar on a computer.",
      'In the left sidebar, click the "+" next to "Other calendars" and choose "From URL".',
      "Paste the link above and click Add calendar. Bookings appear within a few minutes.",
    ],
  },
  {
    id: "apple",
    label: "Apple Calendar",
    icon: <AppleIcon />,
    steps: [
      "Open the Calendar app on iPhone, iPad, or Mac.",
      "iPhone/iPad: tap Calendars at the bottom, then Add Calendar, then Add Subscription Calendar. Mac: File menu, New Calendar Subscription.",
      "Paste the link above and save. Bookings sync automatically.",
    ],
  },
  {
    id: "outlook",
    label: "Outlook",
    icon: <OutlookIcon />,
    steps: [
      "Open Outlook on the web at outlook.live.com.",
      'In the left sidebar, click Add calendar, then Subscribe from web.',
      "Paste the link above, give it a name, and click Import.",
    ],
  },
];

export function CalendarSyncModal({
  icalUrl,
  onClose,
}: {
  icalUrl: string | null;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [active, setActive] = useState<CalendarOption | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onCopy = async () => {
    if (!icalUrl) return;
    await navigator.clipboard.writeText(icalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.36)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sync-modal-title"
    >
      <div
        className="w-full max-w-lg overflow-y-auto rounded-t-2xl border p-5 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.35)] sm:rounded-2xl sm:p-6"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: "var(--color-warm-gray-200)",
          maxHeight: "calc(100dvh - 64px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Calendar sync
            </p>
            <h2
              id="sync-modal-title"
              className="mt-1 text-xl font-semibold tracking-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              Sync bookings to your calendar
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-warm-gray-100)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: "var(--color-text-secondary)" }}
            aria-label="Close"
          >
            <X size={14} weight="bold" />
          </button>
        </div>

        <p
          className="mt-3 text-sm leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Every booking will mirror to Google, Apple, or Outlook automatically.
          This is one-way. Personal calendar events will not block dates on Parcel.
        </p>

        <div className="mt-5 flex flex-col gap-2.5">
          {OPTIONS.map((opt) => {
            const isActive = active?.id === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setActive(isActive ? null : opt)}
                className="flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors"
                style={{
                  backgroundColor: isActive
                    ? "var(--color-warm-gray-50)"
                    : "var(--color-white)",
                  borderColor: isActive
                    ? "var(--color-brand)"
                    : "var(--color-warm-gray-200)",
                }}
                aria-expanded={isActive}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: "var(--color-white)",
                    border: "1px solid var(--color-warm-gray-200)",
                  }}
                  aria-hidden
                >
                  {opt.icon}
                </span>
                <span className="flex flex-col">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {opt.label}
                  </span>
                  <span
                    className="text-[11px]"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    {isActive ? "Showing instructions" : "Click to connect"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {active ? (
          <div
            className="mt-4 rounded-xl border p-4"
            style={{
              backgroundColor: "var(--color-warm-gray-50)",
              borderColor: "var(--color-warm-gray-200)",
            }}
          >
            {icalUrl ? (
              <div
                className="flex items-center gap-2 rounded-lg border px-3 py-2"
                style={{
                  backgroundColor: "var(--color-white)",
                  borderColor: "var(--color-warm-gray-200)",
                }}
              >
                <code
                  className="flex-1 truncate text-xs"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {icalUrl}
                </code>
                <button
                  type="button"
                  onClick={onCopy}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: "var(--color-brand)",
                    color: "var(--color-white)",
                  }}
                >
                  {copied ? (
                    <>
                      <Check size={12} weight="bold" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={12} weight="bold" /> Copy
                    </>
                  )}
                </button>
              </div>
            ) : (
              <p
                className="rounded-lg border border-dashed px-3 py-2 text-xs"
                style={{
                  color: "var(--color-text-secondary)",
                  borderColor: "var(--color-warm-gray-200)",
                }}
              >
                Your sync link is being generated. Check back shortly, or
                message us in the portal.
              </p>
            )}

            <ol
              className="mt-4 flex flex-col gap-2 text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {active.steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] font-semibold"
                    style={{
                      backgroundColor: "var(--color-white)",
                      color: "var(--color-text-primary)",
                      border: "1px solid var(--color-warm-gray-200)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </div>
  );
}
