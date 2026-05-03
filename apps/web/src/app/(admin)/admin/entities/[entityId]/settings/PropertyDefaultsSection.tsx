"use client";

import { useState } from "react";
import s from "./PersonalInfoSection.module.css";
import x from "./SettingsShared.module.css";

type Props = {
  propertyCount: number;
};

export function PropertyDefaultsSection({ propertyCount }: Props) {
  const [cleaningFee, setCleaningFee] = useState("150");
  const [minNightly, setMinNightly] = useState("125");
  const [weekendPremium, setWeekendPremium] = useState("15");
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [smokingAllowed, setSmokingAllowed] = useState(false);
  const [eventsAllowed, setEventsAllowed] = useState(false);
  const [houseRules, setHouseRules] = useState(
    "No parties or events. Quiet hours 10p-8a. No smoking indoors. Maximum guests per listing.",
  );

  return (
    <div>
      <header className={s.sectionHeader}>
        <h2 className={s.sectionTitle}>Property defaults</h2>
        <p className={s.sectionSubtitle}>
          Applies to {propertyCount === 1 ? "this property" : `all ${propertyCount} properties`} unless overridden.
        </p>
      </header>

      {/* Pricing defaults */}
      <section className={s.card}>
        <div className={s.cardHeader}>
          <span className={s.cardHeaderTitle}>Pricing</span>
        </div>
        <div className={s.cardBody}>
          <div className={s.row}>
            <div className={s.labelCell}>
              <label className={s.label}>Minimum nightly rate</label>
              <span className={s.labelHint}>Floor for dynamic pricing.</span>
            </div>
            <div className={s.fieldCell}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#8A9AAB", fontSize: 13 }}>$</span>
                <input
                  className={s.input}
                  type="number"
                  value={minNightly}
                  onChange={(e) => setMinNightly(e.target.value)}
                  style={{ maxWidth: 120 }}
                />
              </div>
            </div>
          </div>
          <div className={s.row}>
            <div className={s.labelCell}>
              <label className={s.label}>Weekend premium</label>
              <span className={s.labelHint}>Added on Fri + Sat nights.</span>
            </div>
            <div className={s.fieldCell}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  className={s.input}
                  type="number"
                  value={weekendPremium}
                  onChange={(e) => setWeekendPremium(e.target.value)}
                  style={{ maxWidth: 100 }}
                />
                <span style={{ color: "#8A9AAB", fontSize: 13 }}>%</span>
              </div>
            </div>
          </div>
          <div className={s.row}>
            <div className={s.labelCell}>
              <label className={s.label}>Default cleaning fee</label>
              <span className={s.labelHint}>Flat fee passed to guest.</span>
            </div>
            <div className={s.fieldCell}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#8A9AAB", fontSize: 13 }}>$</span>
                <input
                  className={s.input}
                  type="number"
                  value={cleaningFee}
                  onChange={(e) => setCleaningFee(e.target.value)}
                  style={{ maxWidth: 120 }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* House rules */}
      <section className={s.card}>
        <div className={s.cardHeader}>
          <span className={s.cardHeaderTitle}>House rules</span>
        </div>
        <div className={s.cardBody}>
          <ToggleRow
            label="Pets allowed"
            hint="Guests can bring a pet with prior approval."
            checked={petsAllowed}
            onChange={() => setPetsAllowed((v) => !v)}
          />
          <ToggleRow
            label="Smoking allowed"
            hint="Indoors and on the property."
            checked={smokingAllowed}
            onChange={() => setSmokingAllowed((v) => !v)}
          />
          <ToggleRow
            label="Events / parties"
            hint="More than the listed guest capacity gathering."
            checked={eventsAllowed}
            onChange={() => setEventsAllowed((v) => !v)}
          />
          <div className={s.row}>
            <div className={s.labelCell}>
              <label className={s.label}>Rule text</label>
              <span className={s.labelHint}>Shown to guests pre-booking.</span>
            </div>
            <div className={s.fieldCell}>
              <textarea
                className={s.textarea}
                value={houseRules}
                onChange={(e) => setHouseRules(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className={s.cardFooter}>
          <p className={s.cardFooterHint}>
            Defaults apply on new property creation. Existing properties keep their overrides.
          </p>
          <button type="button" className={s.btnPrimary} disabled>
            Save defaults
          </button>
        </div>
      </section>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className={s.row}>
      <div className={s.labelCell}>
        <label className={s.label}>{label}</label>
        <span className={s.labelHint}>{hint}</span>
      </div>
      <div className={s.fieldCell}>
        <label className={x.switch}>
          <input type="checkbox" checked={checked} onChange={onChange} />
          <span className={x.switchTrack} />
          <span className={x.switchThumb} />
        </label>
      </div>
    </div>
  );
}
