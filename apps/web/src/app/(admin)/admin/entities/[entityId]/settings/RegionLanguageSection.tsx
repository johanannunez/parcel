"use client";

import { useState, useTransition } from "react";
import { CustomSelect } from "@/components/admin/CustomSelect";
import s from "./PersonalInfoSection.module.css";
import { updateProfileRegion } from "@/lib/admin/settings-actions";

const TIMEZONES = [
  { v: "America/Los_Angeles", l: "Pacific, Los Angeles" },
  { v: "America/Denver",      l: "Mountain, Denver" },
  { v: "America/Phoenix",     l: "Mountain, Phoenix (no DST)" },
  { v: "America/Chicago",     l: "Central, Chicago" },
  { v: "America/New_York",    l: "Eastern, New York" },
  { v: "America/Anchorage",   l: "Alaska, Anchorage" },
  { v: "Pacific/Honolulu",    l: "Hawaii, Honolulu" },
  { v: "UTC",                 l: "UTC" },
];

const LANGUAGES = [
  { v: "en-US", l: "English (US)" },
  { v: "en-GB", l: "English (UK)" },
  { v: "es-US", l: "Spanish (US)" },
  { v: "fr-CA", l: "French (Canada)" },
];

const CURRENCIES = [
  { v: "USD", l: "USD, US Dollar" },
  { v: "CAD", l: "CAD, Canadian Dollar" },
  { v: "MXN", l: "MXN, Mexican Peso" },
];

type Props = {
  profileId: string;
  timezone: string | null;
};

export function RegionLanguageSection({ profileId, timezone }: Props) {
  const [tz, setTz] = useState(timezone ?? "America/Los_Angeles");
  const [lang, setLang] = useState("en-US");
  const [currency, setCurrency] = useState("USD");
  const [weekStart, setWeekStart] = useState<"sun" | "mon">("sun");
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(null);

  const dirty = tz !== (timezone ?? "America/Los_Angeles");

  function onSave() {
    setStatus(null);
    startTransition(async () => {
      const res = await updateProfileRegion({ profileId, timezone: tz });
      setStatus(
        res.ok
          ? { ok: true, msg: "Region saved." }
          : { ok: false, msg: res.error },
      );
    });
  }

  return (
    <div>
      <header className={s.sectionHeader}>
        <h2 className={s.sectionTitle}>Region &amp; language</h2>
        <p className={s.sectionSubtitle}>
          Timezone, language, currency, and calendar start.
        </p>
      </header>

      <section className={s.card}>
        <div className={s.cardHeader}>
          <span className={s.cardHeaderTitle}>Locale</span>
        </div>
        <div className={s.cardBody}>
          <div className={s.row}>
            <div className={s.labelCell}>
              <label className={s.label}>Time zone</label>
              <span className={s.labelHint}>Used for all displayed times.</span>
            </div>
            <div className={s.fieldCell}>
              <CustomSelect
                value={tz}
                onChange={setTz}
                options={TIMEZONES.map((t) => ({ value: t.v, label: t.l }))}
              />
            </div>
          </div>

          <div className={s.row}>
            <div className={s.labelCell}>
              <label className={s.label}>Language</label>
              <span className={s.labelHint}>Interface + email language.</span>
            </div>
            <div className={s.fieldCell}>
              <CustomSelect
                value={lang}
                onChange={setLang}
                options={LANGUAGES.map((l) => ({ value: l.v, label: l.l }))}
              />
            </div>
          </div>

          <div className={s.row}>
            <div className={s.labelCell}>
              <label className={s.label}>Currency</label>
              <span className={s.labelHint}>Payouts stay in USD today.</span>
            </div>
            <div className={s.fieldCell}>
              <CustomSelect
                value={currency}
                onChange={setCurrency}
                options={CURRENCIES.map((c) => ({ value: c.v, label: c.l }))}
              />
            </div>
          </div>

          <div className={s.row}>
            <div className={s.labelCell}>
              <label className={s.label}>Week starts</label>
              <span className={s.labelHint}>Used in the calendar view.</span>
            </div>
            <div className={s.fieldCell}>
              <div className={s.segmented}>
                <button
                  type="button"
                  className={`${s.segmentedBtn} ${
                    weekStart === "sun" ? s.segmentedBtnActive : ""
                  }`}
                  onClick={() => setWeekStart("sun")}
                >
                  Sunday
                </button>
                <button
                  type="button"
                  className={`${s.segmentedBtn} ${
                    weekStart === "mon" ? s.segmentedBtnActive : ""
                  }`}
                  onClick={() => setWeekStart("mon")}
                >
                  Monday
                </button>
              </div>
            </div>
          </div>

          {status && !status.ok && (
            <div className={s.inlineError}>{status.msg}</div>
          )}
          {status && status.ok && (
            <div className={s.inlineSuccess}>{status.msg}</div>
          )}
        </div>
        <div className={s.cardFooter}>
          <p className={s.cardFooterHint}>
            Time zone change saves to the profile. Language and currency persist next.
          </p>
          <button
            type="button"
            className={s.btnPrimary}
            disabled={!dirty || pending}
            onClick={onSave}
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </section>
    </div>
  );
}
