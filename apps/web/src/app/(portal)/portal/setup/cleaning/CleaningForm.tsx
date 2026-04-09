"use client";

import { useState, useId } from "react";
import { Broom, HandPalm } from "@phosphor-icons/react";
import { StepSaveBar } from "@/components/portal/setup/StepShell";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function CleaningForm() {
  const [choice, setChoice] = useState<"parcel" | "byoc" | "">("");

  return (
    <form action="/portal/setup" method="get" className="flex flex-col gap-8">
      <input type="hidden" name="just" value="cleaning" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ChoiceCard
          active={choice === "parcel"}
          onClick={() => setChoice("parcel")}
          icon={<Broom size={22} weight="duotone" />}
          title="The Parcel Company handles cleaning"
          description="We coordinate turnovers with our vetted cleaning partners."
        />
        <ChoiceCard
          active={choice === "byoc"}
          onClick={() => setChoice("byoc")}
          icon={<HandPalm size={22} weight="duotone" />}
          title="I have my own cleaner"
          description="You bring your cleaner, we coordinate scheduling."
        />
      </div>

      {choice === "byoc" && (
        <section className="rounded-2xl border p-6" style={{ borderColor: "var(--color-warm-gray-200)", backgroundColor: "var(--color-white)" }}>
          <h2 className="mb-4 text-base font-semibold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
            About your cleaner
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextInput name="cleaner_name" label="Cleaner name" required />
            <TextInput name="cleaner_phone" label="Phone" type="tel" required />
            <TextInput name="cleaner_email" label="Email" type="email" />
            <TextInput name="cleaner_experience" label="How long doing short-term cleaning?" placeholder="e.g. 2 years" />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <fieldset>
              <legend className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--color-text-tertiary)" }}>
                Works independently or team?
              </legend>
              <div className="flex gap-3">
                {["Independent", "Team"].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer hover:bg-[var(--color-warm-gray-50)]"
                    style={{ borderColor: "var(--color-warm-gray-200)", color: "var(--color-text-primary)" }}>
                    <input type="radio" name="work_style" value={opt.toLowerCase()} className="accent-[var(--color-brand)]" />
                    {opt}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--color-text-tertiary)" }}>
                Open to emergency cleanings?
              </legend>
              <div className="flex gap-3">
                {["Yes", "No", "Maybe"].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer hover:bg-[var(--color-warm-gray-50)]"
                    style={{ borderColor: "var(--color-warm-gray-200)", color: "var(--color-text-primary)" }}>
                    <input type="radio" name="emergency_ok" value={opt.toLowerCase()} className="accent-[var(--color-brand)]" />
                    {opt}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--color-text-tertiary)" }}>
              Available days
            </p>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <label key={day} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer hover:bg-[var(--color-warm-gray-50)]"
                  style={{ borderColor: "var(--color-warm-gray-200)", color: "var(--color-text-primary)" }}>
                  <input type="checkbox" name="available_days" value={day.toLowerCase()} className="accent-[var(--color-brand)]" />
                  {day}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4">
            <TextInput name="cities_covered" label="Cities covered" placeholder="e.g. Sioux Falls, Brandon, Tea" />
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--color-text-tertiary)" }}>
                Any notes
              </label>
              <textarea name="cleaner_notes" rows={3} placeholder="Anything else we should know..."
                className="rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: "var(--color-warm-gray-200)", backgroundColor: "var(--color-white)", color: "var(--color-text-primary)" }}
              />
            </div>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            <input type="checkbox" name="has_equipment" className="accent-[var(--color-brand)]" />
            My cleaner has their own supplies and equipment
          </label>
        </section>
      )}

      <StepSaveBar pending={false} />
    </form>
  );
}

function ChoiceCard({ active, onClick, icon, title, description }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; title: string; description: string;
}) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-start gap-3 rounded-xl border p-5 text-left transition-colors"
      style={{
        borderColor: active ? "var(--color-brand)" : "var(--color-warm-gray-200)",
        backgroundColor: active ? "rgba(2, 170, 235, 0.04)" : "var(--color-white)",
        boxShadow: active ? "0 0 0 1px var(--color-brand) inset" : "none",
      }}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: active ? "rgba(2, 170, 235, 0.12)" : "var(--color-warm-gray-50)", color: active ? "var(--color-brand)" : "var(--color-text-tertiary)" }}>
        {icon}
      </span>
      <div>
        <span className="block text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</span>
        <span className="mt-0.5 block text-[13px]" style={{ color: "var(--color-text-secondary)" }}>{description}</span>
      </div>
    </button>
  );
}

function TextInput({ name, label, placeholder, required, type = "text" }: { name: string; label: string; placeholder?: string; required?: boolean; type?: string }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--color-text-tertiary)" }}>
        {label}{required ? <span className="ml-1" style={{ color: "var(--color-brand)" }}>*</span> : null}
      </label>
      <input id={id} name={name} type={type} placeholder={placeholder} required={required}
        className="rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
        style={{ borderColor: "var(--color-warm-gray-200)", backgroundColor: "var(--color-white)", color: "var(--color-text-primary)" }}
      />
    </div>
  );
}
