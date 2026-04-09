"use client";

import { useId } from "react";
import { StepSaveBar } from "@/components/portal/setup/StepShell";

export function RulesForm() {
  return (
    <form action="/portal/setup" method="get" className="flex flex-col gap-8">
      <input type="hidden" name="just" value="rules" />

      <Section title="Guest policies">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <RadioGroup name="pets" label="Pets allowed?" options={["Yes", "No", "Conditional"]} />
          <RadioGroup name="smoking" label="Smoking allowed?" options={["Yes", "No"]} />
          <RadioGroup name="events" label="Events allowed?" options={["Yes", "No"]} />
        </div>
      </Section>

      <Section title="Timing">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TimeInput name="check_in" label="Check-in time" defaultValue="15:00" />
          <TimeInput name="check_out" label="Check-out time" defaultValue="11:00" />
          <TimeInput name="quiet_start" label="Quiet hours start" defaultValue="22:00" />
          <TimeInput name="quiet_end" label="Quiet hours end" defaultValue="08:00" />
        </div>
      </Section>

      <Section title="Additional rules">
        <textarea
          name="additional_rules"
          rows={4}
          placeholder="Any other rules guests should know about..."
          className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
          style={{
            borderColor: "var(--color-warm-gray-200)",
            backgroundColor: "var(--color-white)",
            color: "var(--color-text-primary)",
          }}
        />
      </Section>

      <Section title="Access information">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput name="lockbox_code" label="Lockbox code" placeholder="e.g. 1234" />
          <TextInput name="gate_code" label="Gate code" placeholder="e.g. #5678" />
          <TextInput name="backup_key_location" label="Backup key location" placeholder="Under the doormat, left side" />
        </div>
        <div className="mt-4">
          <label
            className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Access instructions
          </label>
          <textarea
            name="access_instructions"
            rows={3}
            placeholder="Step by step instructions for entering the property..."
            className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
            style={{
              borderColor: "var(--color-warm-gray-200)",
              backgroundColor: "var(--color-white)",
              color: "var(--color-text-primary)",
            }}
          />
        </div>
      </Section>

      <StepSaveBar pending={false} />
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl border p-6"
      style={{ borderColor: "var(--color-warm-gray-200)", backgroundColor: "var(--color-white)" }}
    >
      <h2 className="mb-4 text-base font-semibold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function RadioGroup({ name, label, options }: { name: string; label: string; options: string[] }) {
  return (
    <fieldset>
      <legend className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--color-text-tertiary)" }}>
        {label}
      </legend>
      <div className="flex gap-2">
        {options.map((opt) => (
          <label
            key={opt}
            className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-[var(--color-warm-gray-50)]"
            style={{ borderColor: "var(--color-warm-gray-200)", color: "var(--color-text-primary)" }}
          >
            <input type="radio" name={name} value={opt.toLowerCase()} className="accent-[var(--color-brand)]" />
            {opt}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function TimeInput({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--color-text-tertiary)" }}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="time"
        defaultValue={defaultValue}
        className="rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
        style={{ borderColor: "var(--color-warm-gray-200)", backgroundColor: "var(--color-white)", color: "var(--color-text-primary)" }}
      />
    </div>
  );
}

function TextInput({ name, label, placeholder }: { name: string; label: string; placeholder?: string }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--color-text-tertiary)" }}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="text"
        placeholder={placeholder}
        className="rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
        style={{ borderColor: "var(--color-warm-gray-200)", backgroundColor: "var(--color-white)", color: "var(--color-text-primary)" }}
      />
    </div>
  );
}
