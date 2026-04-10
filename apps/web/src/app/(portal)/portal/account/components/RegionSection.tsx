"use client";

import { useCallback, useEffect, useState } from "react";
import { Globe, CalendarBlank } from "@phosphor-icons/react";

const STORAGE_KEY = "parcel-region-prefs";

type RegionPrefs = {
  timezone: string;
  dateFormat: string;
};

const US_TIMEZONES: { value: string; label: string }[] = [
  { value: "America/New_York", label: "Eastern" },
  { value: "America/Chicago", label: "Central" },
  { value: "America/Denver", label: "Mountain" },
  { value: "America/Los_Angeles", label: "Pacific" },
  { value: "America/Anchorage", label: "Alaska" },
  { value: "Pacific/Honolulu", label: "Hawaii" },
];

const DATE_FORMATS: { value: string; label: string }[] = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

function getDefaultTimezone(): string {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const match = US_TIMEZONES.find((tz) => tz.value === detected);
    return match ? detected : "America/New_York";
  } catch {
    return "America/New_York";
  }
}

function SelectRow({
  icon: Icon,
  label,
  description,
  value,
  options,
  onChange,
  id,
}: {
  icon: typeof Globe;
  label: string;
  description: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  id: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: "var(--color-warm-gray-100)" }}
      >
        <Icon
          size={18}
          weight="duotone"
          style={{ color: "var(--color-brand)" }}
        />
      </div>

      <div className="flex flex-1 flex-col gap-0.5">
        <label
          htmlFor={id}
          className="cursor-pointer text-sm font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {label}
        </label>
        <span
          className="text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {description}
        </span>
      </div>

      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none rounded-lg border py-2 pl-3 pr-8 text-sm outline-none transition-colors focus:border-[var(--color-brand)]"
          style={{
            borderColor: "var(--color-warm-gray-200)",
            color: "var(--color-text-primary)",
            backgroundColor: "var(--color-white)",
          }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* Custom chevron */}
        <svg
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

export function RegionSection({ timezone }: { timezone: string }) {
  const [prefs, setPrefs] = useState<RegionPrefs>({
    timezone: timezone || getDefaultTimezone(),
    dateFormat: "MM/DD/YYYY",
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<RegionPrefs>;
        setPrefs((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // localStorage unavailable or corrupt
    }
    setLoaded(true);
  }, []);

  const updatePref = useCallback(
    (key: keyof RegionPrefs, value: string) => {
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
    <section id="region">
      <h2
        className="text-xl font-semibold tracking-tight"
        style={{ color: "var(--color-text-primary)" }}
      >
        Region
      </h2>
      <p
        className="mb-6 text-sm"
        style={{ color: "var(--color-text-secondary)" }}
      >
        Set your timezone and date format preferences.
      </p>

      <div
        className="rounded-2xl border p-7"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: "var(--color-warm-gray-200)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex flex-col gap-0">
          <SelectRow
            id="region-timezone"
            icon={Globe}
            label="Timezone"
            description="Used for calendar events and payout dates."
            value={prefs.timezone}
            options={US_TIMEZONES}
            onChange={(v) => updatePref("timezone", v)}
          />

          <div
            className="my-5 border-t"
            style={{ borderColor: "var(--color-warm-gray-200)" }}
          />

          <SelectRow
            id="region-date-format"
            icon={CalendarBlank}
            label="Date format"
            description="How dates appear throughout the portal."
            value={prefs.dateFormat}
            options={DATE_FORMATS}
            onChange={(v) => updatePref("dateFormat", v)}
          />
        </div>
      </div>
    </section>
  );
}
