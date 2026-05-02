"use client";

import React, { useActionState } from "react";
import { saveInspection, type SaveInspectionState } from "./actions";

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
// InspectionForm
// ---------------------------------------------------------------------------

const INITIAL_STATE: SaveInspectionState = {};

export function InspectionForm({
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
    saveInspection,
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

      <Section title="General">
        <div className="flex flex-col gap-5">
          <RadioGroup
            name="overall_condition"
            label="Overall condition"
            options={["Excellent", "Good", "Fair", "Needs work"]}
            defaultValue={s("overall_condition")}
          />
          <TextInput
            name="inspection_date"
            label="Inspection date"
            placeholder="e.g. Apr 28, 2025"
            defaultValue={s("inspection_date")}
          />
          <TextInput
            name="inspector_name"
            label="Inspector name"
            defaultValue={s("inspector_name")}
          />
        </div>
      </Section>

      <Section title="Room-by-room notes">
        <TextAreaInput
          name="rooms"
          label="Room-by-room notes"
          rows={6}
          placeholder={
            "Master bedroom: Good condition, minor scuff on wall near closet.\nKitchen: Excellent.\nLiving room: Good, minor wear on sofa."
          }
          defaultValue={s("rooms")}
        />
      </Section>

      <Section title="Appliances">
        <TextAreaInput
          name="appliance_inventory"
          label="Appliance inventory"
          rows={6}
          placeholder={
            "Washer: LG WM3400CW, good condition.\nDryer: Samsung DVE45R6100W, good.\nFridge: KitchenAid, excellent."
          }
          defaultValue={s("appliance_inventory")}
        />
      </Section>

      <Section title="Damage and notes">
        <div className="flex flex-col gap-5">
          <TextAreaInput
            name="pre_existing_damage"
            label="Pre-existing damage"
            rows={4}
            placeholder="Small dent on front door frame. Scratched hardwood near kitchen island."
            defaultValue={s("pre_existing_damage")}
          />
          <TextAreaInput
            name="notes"
            label="Additional notes"
            rows={3}
            defaultValue={s("notes")}
          />
        </div>
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
        {pending ? "Saving..." : "Save inspection"}
      </button>
    </form>
  );
}
