"use client";

import React, { useActionState } from "react";
import { saveOffboarding, type SaveOffboardingState } from "./actions";

// ---------------------------------------------------------------------------
// Local helper components
// ---------------------------------------------------------------------------

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl border p-6"
      style={{
        borderColor: "var(--color-warm-gray-200)",
        backgroundColor: "var(--color-white)",
        marginBottom: 16,
      }}
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
}: {
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
}) {
  const id = React.useId();
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
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
        style={{
          borderColor: "var(--color-warm-gray-200)",
          backgroundColor: "var(--color-white)",
          color: "var(--color-text-primary)",
        }}
      />
    </div>
  );
}

function TextAreaInput({
  name,
  label,
  placeholder,
  defaultValue,
  rows = 4,
}: {
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  rows?: number;
}) {
  const id = React.useId();
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
        rows={rows}
        className="rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 resize-none"
        style={{
          borderColor: "var(--color-warm-gray-200)",
          backgroundColor: "var(--color-white)",
          color: "var(--color-text-primary)",
        }}
      />
    </div>
  );
}

function RadioGroup({
  name,
  options,
  defaultValue,
  label,
}: {
  name: string;
  options: string[];
  defaultValue?: string;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span
        className="text-[12px] font-semibold uppercase tracking-[0.08em]"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {label}
      </span>
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

// ---------------------------------------------------------------------------
// OffboardingForm
// ---------------------------------------------------------------------------

const INITIAL_STATE: SaveOffboardingState = {};

export function OffboardingForm({
  propertyId,
  initial,
  isEditing: _isEditing,
  lastUpdated,
}: {
  propertyId: string;
  initial: Record<string, unknown>;
  isEditing: boolean;
  lastUpdated: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    saveOffboarding,
    INITIAL_STATE,
  );

  const s = (key: string) =>
    typeof initial[key] === "string" ? (initial[key] as string) : undefined;

  return (
    <form action={formAction}>
      <input type="hidden" name="property_id" value={propertyId} />

      {state.success && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            color: "#15803d",
            fontSize: 12,
            marginBottom: 16,
          }}
        >
          Saved successfully.
        </div>
      )}

      {state.error && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            fontSize: 12,
            marginBottom: 16,
          }}
        >
          {state.error}
        </div>
      )}

      {lastUpdated && (
        <p
          style={{
            fontSize: 12,
            color: "var(--color-text-tertiary)",
            marginBottom: 16,
          }}
        >
          Last updated{" "}
          {new Date(lastUpdated).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      )}

      <Section title="Timeline">
        <div className="flex flex-col gap-5">
          <TextInput
            name="termination_notice_date"
            label="Termination notice date"
            placeholder="e.g. Apr 25, 2025"
            defaultValue={s("termination_notice_date")}
          />
          <TextInput
            name="end_date"
            label="30-day end date"
            placeholder="e.g. May 25, 2025"
            defaultValue={s("end_date")}
          />
          <TextInput
            name="calendar_block_date"
            label="Calendar block-off date"
            placeholder="Within 72 business hours of notice"
            defaultValue={s("calendar_block_date")}
          />
        </div>
      </Section>

      <Section title="Reservations and payouts">
        <div className="flex flex-col gap-5">
          <TextInput
            name="active_reservations_at_notice"
            label="Active reservations at notice"
            placeholder="e.g. 3"
            defaultValue={s("active_reservations_at_notice")}
          />
          <TextInput
            name="final_payout_estimate"
            label="Final payout estimate"
            placeholder="e.g. $2,400"
            defaultValue={s("final_payout_estimate")}
          />
        </div>
      </Section>

      <Section title="Platform transition">
        <TextAreaInput
          name="platform_transfer_notes"
          label="Platform transfer notes"
          rows={4}
          placeholder="Airbnb: co-host invitation sent Apr 26. VRBO: owner reclaiming account..."
          defaultValue={s("platform_transfer_notes")}
        />
      </Section>

      <Section title="Checklist">
        <div className="flex flex-col gap-5">
          <RadioGroup
            name="key_lockbox_returned"
            label="Key and lockbox returned?"
            options={["Yes", "No", "Pending"]}
            defaultValue={s("key_lockbox_returned")}
          />
          <RadioGroup
            name="final_statement_sent"
            label="Final statement sent?"
            options={["Yes", "No", "Pending"]}
            defaultValue={s("final_statement_sent")}
          />
          <TextInput
            name="owner_acknowledged_protocol"
            label="Date owner acknowledged termination protocol"
            placeholder="e.g. Apr 25, 2025"
            defaultValue={s("owner_acknowledged_protocol")}
          />
        </div>
      </Section>

      <Section title="Notes">
        <TextAreaInput
          name="notes"
          label="Additional notes"
          rows={3}
          defaultValue={s("notes")}
        />
      </Section>

      <button
        type="submit"
        disabled={pending}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 20px",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          backgroundColor: "var(--color-brand)",
          color: "#fff",
          border: "none",
          cursor: pending ? "not-allowed" : "pointer",
          opacity: pending ? 0.6 : 1,
          transition: "opacity 0.15s",
          marginTop: 8,
        }}
      >
        {pending ? "Saving..." : "Save offboarding record"}
      </button>
    </form>
  );
}
