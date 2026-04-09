"use client";

import { useActionState, useId } from "react";
import { WarningCircle } from "@phosphor-icons/react";
import { saveAccount, type SaveAccountState } from "./actions";
import { StepSaveBar } from "@/components/portal/setup/StepShell";

type AccountInitial = {
  full_name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
};

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID",
  "IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS",
  "MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK",
  "OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV",
  "WI","WY",
];

const initialState: SaveAccountState = {};

export function AccountForm({
  initial,
  isEditing,
}: {
  initial: AccountInitial;
  isEditing: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    saveAccount,
    initialState,
  );

  const err = (key: string) => state.fieldErrors?.[key];

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {state.error ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm"
          style={{
            borderColor: "#f1c4c4",
            backgroundColor: "#fdf4f4",
            color: "#8a1f1f",
          }}
        >
          <WarningCircle size={18} weight="fill" style={{ color: "#c0372a" }} />
          <span>{state.error}</span>
        </div>
      ) : null}

      <FormSection title="Personal details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput
            name="full_name"
            label="Full name"
            defaultValue={initial.full_name}
            placeholder="Johanan Nunez"
            required
            error={err("full_name")}
          />
          <TextInput
            name="phone"
            label="Phone"
            defaultValue={initial.phone}
            placeholder="+1 (605) 800-7033"
            type="tel"
            required
            error={err("phone")}
          />
        </div>
      </FormSection>

      <FormSection title="Mailing address">
        <div className="grid grid-cols-1 gap-4">
          <TextInput
            name="street"
            label="Street address"
            defaultValue={initial.street}
            placeholder="1234 Example Street"
            required
            error={err("street")}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_140px_160px]">
            <TextInput
              name="city"
              label="City"
              defaultValue={initial.city}
              required
              error={err("city")}
            />
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[12px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                State <span style={{ color: "var(--color-brand)" }}>*</span>
              </label>
              <select
                name="state"
                defaultValue={initial.state}
                required
                className="rounded-lg border bg-white px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2"
                style={{
                  borderColor: err("state") ? "#e3867a" : "var(--color-warm-gray-200)",
                  color: "var(--color-text-primary)",
                }}
              >
                <option value="">Select</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {err("state") ? <FieldError>{err("state")}</FieldError> : null}
            </div>
            <TextInput
              name="zip"
              label="ZIP"
              defaultValue={initial.zip}
              required
              inputMode="numeric"
              error={err("zip")}
            />
          </div>
        </div>
      </FormSection>

      <StepSaveBar pending={pending} isEditing={isEditing} />
    </form>
  );
}

function FormSection({
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
  defaultValue,
  placeholder,
  required,
  error,
  type = "text",
  inputMode,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  type?: string;
  inputMode?: "numeric" | "text" | "tel";
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
        {required ? (
          <span className="ml-1" style={{ color: "var(--color-brand)" }}>*</span>
        ) : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        inputMode={inputMode}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        aria-invalid={Boolean(error)}
        className="rounded-lg border px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2"
        style={{
          borderColor: error ? "#e3867a" : "var(--color-warm-gray-200)",
          backgroundColor: "var(--color-white)",
          color: "var(--color-text-primary)",
        }}
      />
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="flex items-center gap-1 text-[12px] font-medium"
      style={{ color: "#c0372a" }}
    >
      <WarningCircle size={12} weight="fill" />
      {children}
    </p>
  );
}
