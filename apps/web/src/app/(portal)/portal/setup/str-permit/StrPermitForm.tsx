"use client";

import { useActionState, useId } from "react";
import { WarningCircle } from "@phosphor-icons/react";
import { StepSaveBar } from "@/components/portal/setup/StepShell";
import { saveStrPermit, type SaveStrPermitState } from "./actions";

const initialState: SaveStrPermitState = {};

export function StrPermitForm({
  propertyId,
  initial,
  isEditing,
}: {
  propertyId: string;
  initial: Record<string, unknown>;
  isEditing: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveStrPermit, initialState);
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

      <Section title="Permit status">
        <RadioGroup
          name="is_permit_required"
          label="Is a permit required in this market?"
          options={["Yes", "No", "Not applicable"]}
          defaultValue={initial.is_permit_required as string | undefined}
          error={err("is_permit_required")}
        />
      </Section>

      <Section title="Permit details">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextInput
              name="permit_number"
              label="Permit number"
              placeholder="e.g. STR-2024-00123"
              defaultValue={initial.permit_number as string | undefined}
              error={err("permit_number")}
            />
            <TextInput
              name="issuing_authority"
              label="Issuing authority"
              placeholder="e.g. City of Kennwick"
              defaultValue={initial.issuing_authority as string | undefined}
              error={err("issuing_authority")}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextInput
              name="issue_date"
              label="Issue date"
              placeholder="e.g. Jan 2024"
              defaultValue={initial.issue_date as string | undefined}
              error={err("issue_date")}
            />
            <TextInput
              name="expiration_date"
              label="Expiration date"
              placeholder="e.g. Dec 2025"
              defaultValue={initial.expiration_date as string | undefined}
              error={err("expiration_date")}
            />
          </div>
        </div>
      </Section>

      <Section title="Notes">
        <TextAreaInput
          name="notes"
          label="Notes"
          placeholder="Any additional details about the permit or exemption status"
          defaultValue={initial.notes as string | undefined}
          error={err("notes")}
        />
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
      <h2 className="mb-4 text-base font-semibold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
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

function TextAreaInput({
  name,
  label,
  placeholder,
  defaultValue,
  error,
}: {
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  error?: string;
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
      <textarea
        id={id}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={4}
        aria-invalid={Boolean(error)}
        className="rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none"
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
  label,
  options,
  defaultValue,
  error,
}: {
  name: string;
  label?: string;
  options: string[];
  defaultValue?: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <p
          className="mb-1 text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {label}
        </p>
      ) : null}
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
