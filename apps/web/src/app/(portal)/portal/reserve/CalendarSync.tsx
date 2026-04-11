"use client";

import { useState } from "react";
import { Copy, Check, X } from "@phosphor-icons/react";

type CalendarOption = {
  id: "google" | "apple" | "outlook";
  label: string;
  iconSlug: string;
  brand: string;
  steps: string[];
};

const OPTIONS: CalendarOption[] = [
  {
    id: "google",
    label: "Google Calendar",
    iconSlug: "googlecalendar",
    brand: "#1a73e8",
    steps: [
      "Open Google Calendar on a computer.",
      'In the left sidebar, click the "+" next to "Other calendars" and choose "From URL".',
      "Paste the link above and click Add calendar. Bookings appear within a few minutes.",
    ],
  },
  {
    id: "apple",
    label: "Apple Calendar",
    iconSlug: "apple",
    brand: "#000000",
    steps: [
      "Open the Calendar app on iPhone, iPad, or Mac.",
      "iPhone/iPad: tap Calendars at the bottom, then Add Calendar, then Add Subscription Calendar. Mac: File menu, New Calendar Subscription.",
      "Paste the link above and save. Bookings sync automatically.",
    ],
  },
  {
    id: "outlook",
    label: "Outlook",
    iconSlug: "microsoftoutlook",
    brand: "#0078d4",
    steps: [
      "Open Outlook on the web at outlook.live.com.",
      'In the left sidebar, click Add calendar, then Subscribe from web.',
      "Paste the link above, give it a name, and click Import.",
    ],
  },
];

export function CalendarSync({
  icalUrl,
}: {
  icalUrl: string | null;
}) {
  const [active, setActive] = useState<CalendarOption | null>(null);
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    if (!icalUrl) return;
    await navigator.clipboard.writeText(icalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section
      className="rounded-2xl border p-6"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
      aria-labelledby="calendar-sync-heading"
    >
      <div className="flex flex-col gap-1">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Mirror to your personal calendar
        </p>
        <h2
          id="calendar-sync-heading"
          className="text-xl font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          Sync bookings to the calendar you already use
        </h2>
        <p
          className="mt-2 max-w-2xl text-sm leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Every booking on this page will mirror to Google, Apple, or Outlook
          automatically. This is one-way. Anything you add to your personal
          calendar will not block dates on Parcel. To reserve dates for your
          own use, submit a block request below.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                  ? "var(--color-warm-gray-50, #FAF8F5)"
                  : "var(--color-white)",
                borderColor: isActive
                  ? "var(--color-brand)"
                  : "var(--color-warm-gray-200)",
              }}
              aria-expanded={isActive}
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: "var(--color-white)",
                  border: "1px solid var(--color-warm-gray-200)",
                }}
                aria-hidden
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://cdn.simpleicons.org/${opt.iconSlug}/${opt.brand.replace("#", "")}`}
                  alt=""
                  className="h-5 w-5"
                />
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
          className="mt-5 rounded-xl border p-5"
          style={{
            backgroundColor: "var(--color-warm-gray-50, #FAF8F5)",
            borderColor: "var(--color-warm-gray-200)",
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              Connect {active.label}
            </h3>
            <button
              type="button"
              onClick={() => setActive(null)}
              className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-warm-gray-100)]"
              style={{ color: "var(--color-text-secondary)" }}
              aria-label="Close instructions"
            >
              <X size={14} weight="bold" />
            </button>
          </div>

          {icalUrl ? (
            <div
              className="mt-3 flex items-center gap-2 rounded-lg border px-3 py-2"
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
                    <Copy size={12} weight="bold" /> Copy link
                  </>
                )}
              </button>
            </div>
          ) : (
            <p
              className="mt-3 rounded-lg border border-dashed px-3 py-2 text-xs"
              style={{
                color: "var(--color-text-secondary)",
                borderColor: "var(--color-warm-gray-300, #D6D1CC)",
              }}
            >
              Your sync link is being generated. Check back shortly, or message
              us in the portal and we will set it up for you.
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
    </section>
  );
}
