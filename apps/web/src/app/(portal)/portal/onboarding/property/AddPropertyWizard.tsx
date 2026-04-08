"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addProperty, type AddPropertyState } from "./actions";

const initial: AddPropertyState = {};

const TYPES: { value: string; label: string; hint: string }[] = [
  { value: "str", label: "Short term rental", hint: "Nightly stays, vacation" },
  { value: "mtr", label: "Mid term rental", hint: "30+ day corporate stays" },
  { value: "ltr", label: "Long term rental", hint: "Traditional annual lease" },
  { value: "arbitrage", label: "Arbitrage", hint: "Leased and re-rented" },
  {
    value: "co-hosting",
    label: "Co-hosting",
    hint: "We manage on your behalf",
  },
];

const STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const STEPS = ["Type", "Address", "Details", "Review"] as const;

export function AddPropertyWizard() {
  const [state, formAction, pending] = useActionState(addProperty, initial);
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({
    property_type: "str",
    name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    bedrooms: "",
    bathrooms: "",
    guest_capacity: "",
    square_feet: "",
  });

  const set = (k: keyof typeof values) => (v: string) =>
    setValues((prev) => ({ ...prev, [k]: v }));

  const stepRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Focus the first focusable input when entering a new step.
    const el = stepRef.current?.querySelector<HTMLElement>(
      'input:not([type="hidden"]), select, button[type="button"]:not([disabled])',
    );
    el?.focus();
  }, [step]);

  const canNext = () => {
    if (step === 0) return !!values.property_type;
    if (step === 1)
      return (
        !!values.address_line1 &&
        !!values.city &&
        !!values.state &&
        !!values.postal_code
      );
    if (step === 2) return true;
    return true;
  };

  return (
    <div className="flex flex-col gap-10">
      <Stepper step={step} />

      <form action={formAction} className="flex flex-col gap-8">
        {/* Hidden mirror fields so the server action sees everything */}
        {Object.entries(values).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}

        <div
          ref={stepRef}
          className="rounded-2xl border p-6 sm:p-8"
          style={{
            backgroundColor: "var(--color-white)",
            borderColor: "var(--color-warm-gray-200)",
          }}
        >
          {step === 0 ? (
            <div className="flex flex-col gap-6">
              <StepHeader
                title="What kind of property is this?"
                body="Pick the category that best matches how you plan to rent the home. You can change it later."
              />
              <div className="grid grid-cols-2 gap-3">
                {TYPES.map((t) => {
                  const active = values.property_type === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => set("property_type")(t.value)}
                      className="flex flex-col rounded-xl border p-4 text-left transition-shadow hover:shadow-[0_14px_30px_-24px_rgba(15,23,42,0.25)]"
                      style={{
                        backgroundColor: "var(--color-white)",
                        borderColor: active
                          ? "var(--color-brand)"
                          : "var(--color-warm-gray-200)",
                        boxShadow: active
                          ? "0 0 0 3px rgba(2,170,235,0.12)"
                          : undefined,
                      }}
                    >
                      <span
                        className="text-sm font-semibold"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {t.label}
                      </span>
                      <span
                        className="mt-1 text-xs"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {t.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="flex flex-col gap-6">
              <StepHeader
                title="Where is it located?"
                body="We use this to generate listings, calculate taxes, and match the right local regulations."
              />
              <Field label="Property name (optional)">
                <input
                  value={values.name}
                  onChange={(e) => set("name")(e.target.value)}
                  placeholder="Cedar Ridge Retreat"
                  className={inputCls}
                />
              </Field>
              <Field label="Street address">
                <input
                  value={values.address_line1}
                  onChange={(e) => set("address_line1")(e.target.value)}
                  placeholder="34 Downing Drive"
                  className={inputCls}
                  required
                />
              </Field>
              <Field label="Apartment, suite, etc. (optional)">
                <input
                  value={values.address_line2}
                  onChange={(e) => set("address_line2")(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="City">
                  <input
                    value={values.city}
                    onChange={(e) => set("city")(e.target.value)}
                    className={inputCls}
                    required
                  />
                </Field>
                <Field label="State">
                  <select
                    value={values.state}
                    onChange={(e) => set("state")(e.target.value)}
                    className={inputCls}
                    required
                  >
                    <option value="">Select</option>
                    {STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Postal code">
                  <input
                    value={values.postal_code}
                    onChange={(e) => set("postal_code")(e.target.value)}
                    className={inputCls}
                    required
                  />
                </Field>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="flex flex-col gap-6">
              <StepHeader
                title="Tell us about the space"
                body="Approximate counts are fine. You can refine these on the property detail page later."
              />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Field label="Bedrooms">
                  <input
                    type="number"
                    min={0}
                    value={values.bedrooms}
                    onChange={(e) => set("bedrooms")(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Bathrooms">
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    value={values.bathrooms}
                    onChange={(e) => set("bathrooms")(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Guests">
                  <input
                    type="number"
                    min={0}
                    value={values.guest_capacity}
                    onChange={(e) => set("guest_capacity")(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Square feet">
                  <input
                    type="number"
                    min={0}
                    value={values.square_feet}
                    onChange={(e) => set("square_feet")(e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="flex flex-col gap-6">
              <StepHeader
                title="Review and confirm"
                body="Double-check the details. You can edit any of this after the property is added."
              />
              <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <Row label="Type" value={TYPES.find((t) => t.value === values.property_type)?.label ?? "—"} />
                <Row label="Name" value={values.name || "—"} />
                <Row
                  label="Address"
                  value={`${values.address_line1}${values.address_line2 ? `, ${values.address_line2}` : ""}, ${values.city}, ${values.state} ${values.postal_code}`}
                />
                <Row label="Bedrooms" value={values.bedrooms || "—"} />
                <Row label="Bathrooms" value={values.bathrooms || "—"} />
                <Row label="Guests" value={values.guest_capacity || "—"} />
                <Row label="Square feet" value={values.square_feet || "—"} />
              </dl>
            </div>
          ) : null}
        </div>

        {state.error ? (
          <p
            className="text-sm"
            style={{ color: "var(--color-error)" }}
            role="alert"
          >
            {state.error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || pending}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => canNext() && setStep((s) => s + 1)}
              disabled={!canNext()}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: "var(--color-brand)" }}
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: "var(--color-brand)" }}
            >
              {pending ? "Adding..." : "Add property"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-[var(--color-warm-gray-200)] bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-brand)]";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span
        className="text-xs font-semibold uppercase tracking-[0.12em]"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt
        className="text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {label}
      </dt>
      <dd
        className="text-sm font-medium"
        style={{ color: "var(--color-text-primary)" }}
      >
        {value}
      </dd>
    </div>
  );
}

function StepHeader({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h2
        className="text-xl font-semibold tracking-tight"
        style={{ color: "var(--color-text-primary)" }}
      >
        {title}
      </h2>
      <p
        className="mt-1.5 text-sm"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {body}
      </p>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-3">
      {STEPS.map((label, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <li key={label} className="flex items-center gap-3">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold"
              style={{
                backgroundColor: done
                  ? "var(--color-brand)"
                  : active
                    ? "var(--color-brand)"
                    : "var(--color-warm-gray-100)",
                color:
                  done || active
                    ? "var(--color-white)"
                    : "var(--color-text-secondary)",
              }}
            >
              {i + 1}
            </span>
            <span
              className="hidden text-sm font-semibold sm:inline"
              style={{
                color: active
                  ? "var(--color-text-primary)"
                  : "var(--color-text-secondary)",
              }}
            >
              {label}
            </span>
            {i < STEPS.length - 1 ? (
              <span
                className="hidden h-px w-8 sm:inline-block"
                style={{ backgroundColor: "var(--color-warm-gray-200)" }}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
