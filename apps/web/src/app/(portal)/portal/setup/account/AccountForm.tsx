"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import {
  Camera,
  ChatCircle,
  Envelope,
  Phone,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { saveAccount, type SaveAccountState } from "./actions";
import { StepSaveBar } from "@/components/portal/setup/StepShell";

type MailingAddress = {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  emergency_contact?: { name?: string; phone?: string };
};

export type AccountInitial = {
  full_name: string;
  preferred_name: string;
  phone: string;
  avatar_url: string;
  contact_method: string;
  timezone: string;
  referral_source: string;
  mailing_address: MailingAddress | null;
};

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID",
  "IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS",
  "MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK",
  "OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV",
  "WI","WY",
];

const US_TIMEZONES: { value: string; label: string }[] = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "America/Anchorage", label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HT)" },
];

const REFERRAL_OPTIONS = [
  "Referral",
  "Social media",
  "Google search",
  "Airbnb community",
  "Real estate group",
  "Other",
];

const CONTACT_METHODS: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: "text", label: "Text message", icon: <Phone size={20} weight="duotone" /> },
  { value: "email", label: "Email", icon: <Envelope size={20} weight="duotone" /> },
  { value: "portal", label: "Portal message", icon: <ChatCircle size={20} weight="duotone" /> },
];

const initialState: SaveAccountState = {};

function detectTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (US_TIMEZONES.some((t) => t.value === tz)) return tz;
  } catch { /* ignore */ }
  return "";
}

export function AccountForm({
  initial,
  email,
  userId,
  isEditing,
}: {
  initial: AccountInitial;
  email: string;
  userId: string;
  isEditing: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveAccount, initialState);
  const err = (key: string) => state.fieldErrors?.[key];

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url || "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Contact methods (multi-select, stored as comma-separated)
  const [contactMethods, setContactMethods] = useState<Set<string>>(
    () => new Set(initial.contact_method ? initial.contact_method.split(",").filter(Boolean) : []),
  );
  const toggleContactMethod = (value: string) => {
    setContactMethods((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  // Timezone: auto-detect if not already set
  const [timezone, setTimezone] = useState(initial.timezone || "");
  useEffect(() => {
    if (!timezone) {
      const detected = detectTimezone();
      if (detected) setTimezone(detected);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Referral source
  const [referralSource, setReferralSource] = useState(initial.referral_source || "");
  const isOtherReferral = referralSource === "Other" ||
    (referralSource && !REFERRAL_OPTIONS.slice(0, -1).includes(referralSource));
  const [referralOther, setReferralOther] = useState(
    isOtherReferral && referralSource !== "Other" ? referralSource : "",
  );

  // Mailing address defaults
  const addr = initial.mailing_address;
  const emergency = addr?.emergency_contact;

  // Initials for avatar fallback
  const initials = buildInitials(initial.full_name || email);

  async function handleAvatarUpload(file: File) {
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) return;
    if (file.size > 5 * 1024 * 1024) return;

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/avatar/profile.${ext}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("property-photos")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("property-photos")
        .getPublicUrl(path);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      setAvatarUrl(publicUrl);

      // Write to profile
      await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);
    } catch {
      // Silently fail, user can retry
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveAvatar() {
    setAvatarUrl("");
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", userId);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleAvatarUpload(file);
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
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

      {/* Hidden fields for non-input state */}
      <input type="hidden" name="avatar_url" value={avatarUrl} />
      <input type="hidden" name="contact_method" value={Array.from(contactMethods).join(",")} />
      <input type="hidden" name="timezone" value={timezone} />
      <input
        type="hidden"
        name="referral_source"
        value={isOtherReferral ? referralOther || "Other" : referralSource}
      />

      {/* 1. Profile photo */}
      <FormSection title="Profile photo">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="group relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed transition-colors hover:border-[var(--color-brand)]"
            style={{
              borderColor: avatarUrl ? "transparent" : "var(--color-warm-gray-200)",
              backgroundColor: avatarUrl ? "transparent" : "var(--color-warm-gray-50)",
            }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile photo"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Camera
                  size={22}
                  weight="duotone"
                  className="transition-colors group-hover:text-[var(--color-brand)]"
                  style={{ color: "var(--color-text-tertiary)" }}
                />
                <span
                  className="text-[24px] font-semibold leading-none"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {initials}
                </span>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70">
                <div
                  className="h-5 w-5 animate-spin rounded-full border-2 border-transparent"
                  style={{ borderTopColor: "var(--color-brand)" }}
                />
              </div>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleAvatarUpload(f);
            }}
          />
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: "var(--color-brand)" }}
            >
              {avatarUrl ? "Change photo" : "Upload photo"}
            </button>
            {avatarUrl ? (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                <Trash size={12} weight="duotone" />
                Remove
              </button>
            ) : (
              <p
                className="text-xs"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                JPG, PNG, or WebP. Max 5 MB.
              </p>
            )}
          </div>
        </div>
      </FormSection>

      {/* 2. Personal details */}
      <FormSection title="Personal details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput
            name="full_name"
            label="Full name"
            defaultValue={initial.full_name}
            placeholder="Alex Rivera"
            required
            error={err("full_name")}
          />
          <TextInput
            name="preferred_name"
            label="Preferred name"
            defaultValue={initial.preferred_name}
            placeholder="Alex"
            helper="What should we call you? This is what you will see in greetings."
            error={err("preferred_name")}
          />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput
            name="phone"
            label="Phone"
            defaultValue={initial.phone}
            placeholder="+1 (555) 234-5678"
            type="tel"
            required
            error={err("phone")}
          />
          <ReadOnlyField label="Email" value={email} />
        </div>
      </FormSection>

      {/* 3. Mailing address */}
      <FormSection title="Mailing address">
        <div className="grid grid-cols-1 gap-4">
          <TextInput
            name="street"
            label="Street address"
            defaultValue={addr?.street ?? ""}
            placeholder="1234 Example Street"
            required
            error={err("street")}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_140px_160px]">
            <TextInput
              name="city"
              label="City"
              defaultValue={addr?.city ?? ""}
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
                defaultValue={addr?.state ?? ""}
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
              defaultValue={addr?.zip ?? ""}
              required
              inputMode="numeric"
              error={err("zip")}
            />
          </div>
        </div>
      </FormSection>

      {/* 4. Emergency contact */}
      <FormSection title="Emergency contact">
        <p
          className="mb-4 text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          If something happens at the property and we cannot reach you, who should we call?
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput
            name="emergency_name"
            label="Contact name"
            defaultValue={emergency?.name ?? ""}
            placeholder="Maria Santos"
          />
          <TextInput
            name="emergency_phone"
            label="Contact phone"
            defaultValue={emergency?.phone ?? ""}
            placeholder="+1 (555) 123-4567"
            type="tel"
          />
        </div>
      </FormSection>

      {/* 5. Communication preferences */}
      <FormSection title="Communication preferences">
        <div className="mb-5">
          <p
            className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            How should we reach you for urgent updates?
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {CONTACT_METHODS.map((method) => {
              const selected = contactMethods.has(method.value);
              return (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => toggleContactMethod(method.value)}
                  className="flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors"
                  style={{
                    borderColor: selected
                      ? "var(--color-brand)"
                      : "var(--color-warm-gray-200)",
                    backgroundColor: selected
                      ? "rgba(2, 170, 235, 0.04)"
                      : "var(--color-white)",
                  }}
                >
                  <span
                    style={{
                      color: selected
                        ? "var(--color-brand)"
                        : "var(--color-text-tertiary)",
                    }}
                  >
                    {method.icon}
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: selected
                        ? "var(--color-brand)"
                        : "var(--color-text-primary)",
                    }}
                  >
                    {method.label}
                  </span>
                  <span
                    className="ml-auto flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border-2 transition-colors"
                    style={{
                      borderColor: selected
                        ? "var(--color-brand)"
                        : "var(--color-warm-gray-200)",
                      backgroundColor: selected ? "var(--color-brand)" : "transparent",
                    }}
                  >
                    {selected && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            className="text-[12px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Your time zone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="rounded-lg border bg-white px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2"
            style={{
              borderColor: "var(--color-warm-gray-200)",
              color: "var(--color-text-primary)",
            }}
          >
            <option value="">Select time zone</option>
            {US_TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
          <p
            className="text-xs"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            We use this for scheduling and notifications.
          </p>
        </div>
      </FormSection>

      {/* 6. One last thing */}
      <FormSection title="One last thing">
        <div className="flex flex-col gap-1.5">
          <label
            className="text-[12px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            How did you hear about us?
          </label>
          <select
            value={isOtherReferral ? "Other" : referralSource}
            onChange={(e) => {
              setReferralSource(e.target.value);
              if (e.target.value !== "Other") setReferralOther("");
            }}
            className="rounded-lg border bg-white px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2"
            style={{
              borderColor: "var(--color-warm-gray-200)",
              color: "var(--color-text-primary)",
            }}
          >
            <option value="">Select</option>
            {REFERRAL_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {(referralSource === "Other" || isOtherReferral) && (
            <input
              type="text"
              value={referralOther}
              onChange={(e) => setReferralOther(e.target.value)}
              placeholder="Tell us more..."
              className="mt-2 rounded-lg border px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2"
              style={{
                borderColor: "var(--color-warm-gray-200)",
                backgroundColor: "var(--color-white)",
                color: "var(--color-text-primary)",
              }}
            />
          )}
          <p
            className="text-xs"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Helps us understand how owners find The Parcel Company.
          </p>
        </div>
      </FormSection>

      {/* 7. Sticky save bar */}
      <StepSaveBar pending={pending} isEditing={isEditing} />
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared sub-components                                             */
/* ------------------------------------------------------------------ */

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl border p-5"
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
  helper,
  type = "text",
  inputMode,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helper?: string;
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
      {helper && !error ? (
        <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
          {helper}
        </p>
      ) : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span
        className="text-[12px] font-semibold uppercase tracking-[0.08em]"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {label}
      </span>
      <div
        className="rounded-lg border px-3.5 py-2.5 text-sm"
        style={{
          borderColor: "var(--color-warm-gray-200)",
          backgroundColor: "var(--color-warm-gray-50)",
          color: "var(--color-text-secondary)",
        }}
      >
        {value}
      </div>
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

function buildInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "O";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
