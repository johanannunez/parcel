"use client";

import { useActionState, useId } from "react";
import { WarningCircle } from "@phosphor-icons/react";
import { StepSaveBar } from "@/components/portal/setup/StepShell";
import { saveInsuranceCertificate, type SaveInsuranceCertificateState } from "./actions";

const initialState: SaveInsuranceCertificateState = {};

export function InsuranceCertificateForm({
  propertyId,
  initial,
  isEditing,
}: {
  propertyId: string;
  initial: Record<string, unknown>;
  isEditing: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveInsuranceCertificate, initialState);
  const err = (key: string) => state.fieldErrors?.[key];

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <input type="hidden" name="property_id" value={propertyId} />

      {state.error ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm"
          style={{ borderColor: "#f1c4c4", backgroundColor: "#fdf4f4", color: "#8a1f1f" }}
        >
          <WarningCircle size={18} weight="fill" style={{ color: "#c0372a" }} />
          <span>{state.error}</span>
        </div>
      ) : null}

      <Section title="Policy details">
        <div className="flex flex-col gap-4">
          <TextInput
            name="carrier_name"
            label="Carrier name"
            placeholder="e.g. Proper Insurance"
            defaultValue={initial.carrier_name as string | undefined}
            error={err("carrier_name")}
          />
          <div>
            <p
              className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Policy type
            </p>
            <RadioGroup
              name="policy_type"
              options={["Short-term rental", "Homeowners", "Landlord protection", "Vacation rental"]}
              defaultValue={initial.policy_type as string | undefined}
              error={err("policy_type")}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextInput
              name="policy_number"
              label="Policy number"
              placeholder="e.g. POL-2024-000123"
              defaultValue={initial.policy_number as string | undefined}
              error={err("policy_number")}
            />
            <TextInput
              name="liability_coverage_amount"
              label="Liability coverage amount"
              placeholder="e.g. $1,000,000"
              defaultValue={initial.liability_coverage_amount as string | undefined}
              error={err("liability_coverage_amount")}
            />
          </div>
        </div>
      </Section>

      <Section title="Coverage dates">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput
            name="effective_date"
            label="Effective date"
            placeholder="e.g. Jan 2024"
            defaultValue={initial.effective_date as string | undefined}
            error={err("effective_date")}
          />
          <TextInput
            name="expiration_date"
            label="Expiration date"
            placeholder="e.g. Jan 2025"
            defaultValue={initial.expiration_date as string | undefined}
            error={err("expiration_date")}
          />
        </div>
      </Section>

      <Section title="Agent contact">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput
            name="agent_name"
            label="Agent name"
            defaultValue={initial.agent_name as string | undefined}
            error={err("agent_name")}
          />
          <TextInput
            name="agent_phone"
            label="Agent phone"
            placeholder="e.g. 555-000-0000"
            defaultValue={initial.agent_phone as string | undefined}
            error={err("agent_phone")}
          />
        </div>
      </Section>

      <StepSaveBar pending={pending} isEditing={isEditing} />
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl border p-6"
      style={{ borderColor: "var(--color-warm-gray-200)", backgroundColor: "var(--color-white)" }}
    >
      <h2
        className="mb-4 text-base font-semibold tracking-tight"
        style={{ color: "var(--color-text-primary)" }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function TextInput({
  name,
  label,
  placeholder,
  defaultValue,
  error,
  type = "text",
}: {
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  error?: string;
  type?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[12px] font-semibold uppercase tracking-[0.08em]"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className="rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
        style={{
          borderColor: error ? "#e3867a" : "var(--color-warm-gray-200)",
          backgroundColor: "var(--color-white)",
          color: "var(--color-text-primary)",
        }}
      />
      {error ? (
        <p className="flex items-center gap-1 text-[12px] font-medium" style={{ color: "#c0372a" }}>
          <WarningCircle size={12} weight="fill" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

function RadioGroup({
  name,
  options,
  defaultValue,
  error,
}: {
  name: string;
  options: string[];
  defaultValue?: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <label key={opt} className="relative cursor-pointer">
            <input
              type="radio"
              name={name}
              value={opt}
              defaultChecked={defaultValue === opt}
              className="peer sr-only"
            />
            <span
              className="inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-medium"
              style={{
                borderColor: "var(--color-warm-gray-200)",
                color: "var(--color-text-secondary)",
              }}
              data-radio-pill
            >
              {opt}
            </span>
          </label>
        ))}
      </div>
      {error ? (
        <p className="flex items-center gap-1 text-[12px] font-medium" style={{ color: "#c0372a" }}>
          <WarningCircle size={12} weight="fill" />
          {error}
        </p>
      ) : null}
      <style>{`
        [data-radio-pill] { transition: background-color 0.15s, color 0.15s, border-color 0.15s; }
        input[type="radio"]:checked + [data-radio-pill] {
          background-color: var(--color-text-primary);
          color: var(--color-white);
          border-color: var(--color-text-primary);
        }
      `}</style>
    </div>
  );
}
