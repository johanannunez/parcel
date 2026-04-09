"use client";

import { useId } from "react";
import { StepSaveBar } from "@/components/portal/setup/StepShell";

const FURNISHING_OPTIONS = [
  { value: "furnished", label: "Already furnished" },
  { value: "partial", label: "Needs partial furnishing" },
  { value: "full", label: "Needs full furnishing" },
  { value: "unsure", label: "Not sure yet" },
];

const READINESS_OPTIONS = [
  { value: "ready", label: "Yes, ready now" },
  { value: "1-2months", label: "Need 1 to 2 months" },
  { value: "3+months", label: "Need 3+ months" },
  { value: "unsure", label: "Not sure" },
];

export function FinancialForm() {
  return (
    <form action="/portal/setup" method="get" className="flex flex-col gap-8">
      <input type="hidden" name="just" value="financial" />

      <Section title="Income goals">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CurrencyInput name="min_monthly" label="What is your red line?" hint="The minimum monthly income you need to break even." required />
          <CurrencyInput name="target_monthly" label="What is your desired monthly income?" hint="Your ideal target after expenses." />
        </div>
      </Section>

      <Section title="Timeline">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DateInput name="go_live_date" label="When would you like to go live?" />
          <SelectInput name="readiness" label="Are you financially ready to begin?" options={READINESS_OPTIONS} />
        </div>
      </Section>

      <Section title="Furnishing">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectInput name="furnishing_needs" label="What are your furnishing needs?" options={FURNISHING_OPTIONS} />
          <CurrencyInput name="furnishing_budget" label="Furnishing budget" hint="A typical full furnish runs $15,000 to $40,000 depending on size." />
        </div>
      </Section>

      <StepSaveBar pending={false} />
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border p-6" style={{ borderColor: "var(--color-warm-gray-200)", backgroundColor: "var(--color-white)" }}>
      <h2 className="mb-4 text-base font-semibold tracking-tight" style={{ color: "var(--color-text-primary)" }}>{title}</h2>
      {children}
    </section>
  );
}

function CurrencyInput({ name, label, hint, required }: { name: string; label: string; hint?: string; required?: boolean }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--color-text-tertiary)" }}>
        {label}{required ? <span className="ml-1" style={{ color: "var(--color-brand)" }}>*</span> : null}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--color-text-tertiary)" }}>$</span>
        <input id={id} name={name} type="number" min="0" step="100" placeholder="0"
          className="w-full rounded-lg border py-2.5 pl-8 pr-3.5 text-sm focus:outline-none focus:ring-2"
          style={{ borderColor: "var(--color-warm-gray-200)", backgroundColor: "var(--color-white)", color: "var(--color-text-primary)" }}
        />
      </div>
      {hint ? <p className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>{hint}</p> : null}
    </div>
  );
}

function DateInput({ name, label }: { name: string; label: string }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--color-text-tertiary)" }}>{label}</label>
      <input id={id} name={name} type="date"
        className="rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
        style={{ borderColor: "var(--color-warm-gray-200)", backgroundColor: "var(--color-white)", color: "var(--color-text-primary)" }}
      />
    </div>
  );
}

function SelectInput({ name, label, options }: { name: string; label: string; options: { value: string; label: string }[] }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--color-text-tertiary)" }}>{label}</label>
      <select id={id} name={name}
        className="rounded-lg border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
        style={{ borderColor: "var(--color-warm-gray-200)", color: "var(--color-text-primary)" }}
      >
        <option value="">Select</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
