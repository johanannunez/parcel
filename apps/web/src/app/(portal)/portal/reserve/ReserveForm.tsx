"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import {
  Broom,
  CaretLeft,
  CaretRight,
  CheckCircle,
  EnvelopeSimple,
  FileArrowDown,
  House,
  Lock,
  Moon,
  PawPrint,
  Phone,
  ShieldCheck,
  Sparkle,
  User,
  Users,
  WarningCircle,
} from "@phosphor-icons/react";
import { submitBlockRequest } from "./actions";
import type { ReserveProperty } from "./types";
import { ReserveSummary } from "./ReserveSummary";

/**
 * Single-page reservation form. This is the unrolled version of the
 * old 5-step BlockRequestWizard modal, reshaped for a dedicated page.
 * Users scroll through sections (Home, Dates, Stay details, Guests,
 * Logistics, Acknowledgment) and submit. A sticky live summary on the
 * right mirrors the state in real time; on mobile it collapses to a
 * stacked card above the submit button.
 */

type FormData = {
  propertyId: string;
  startDate: string | null;
  endDate: string | null;
  checkInTime: string;
  checkOutTime: string;
  reason: string;
  reasonDetail: string;
  adults: number;
  children: number;
  pets: number;
  notes: string;
  isOwnerStaying: boolean;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  needsLockCode: boolean;
  requestedLockCode: string;
  wantsCleaning: boolean;
  damageAcknowledged: boolean;
};

/**
 * Reasons that require a follow-up detail field. When the owner picks
 * one of these, a required text input appears asking "what?".
 */
const REASONS_NEED_DETAIL = new Set([
  "Renovation",
  "Maintenance",
  "Other",
]);

/** Placeholder text per reason when the detail field is required. */
const REASON_DETAIL_PLACEHOLDER: Record<string, string> = {
  Renovation: "What's being renovated? (e.g., kitchen backsplash)",
  Maintenance: "What's being maintained? (e.g., HVAC service)",
  Other: "Describe the reason",
};

/**
 * Quick-add note presets. Clicking appends to the notes textarea so
 * owners don't have to type common special requests from scratch.
 */
const NOTE_SUGGESTIONS = [
  "Early check-in around 1pm",
  "Late check-out around 12pm",
  "Extra towels please",
  "Firewood stocked for the stay",
  "Grocery delivery expected",
  "Pool heated if possible",
];

/** Default pet surcharge when owner has not configured one on the property. */
const DEFAULT_PET_FEE = 25;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+\d][\d\s()+\-.]{8,}$/;

const CHECK_IN_TIMES = ["12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];
const CHECK_OUT_TIMES = ["10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM"];
const REASONS = [
  "Personal stay",
  "Family visiting",
  "Renovation",
  "Maintenance",
  "Other",
];

const CLEANING_FEES: Record<number, number> = {
  1: 100,
  2: 125,
  3: 150,
  4: 175,
};

function cleaningFee(bedrooms: number | null): number {
  if (!bedrooms || bedrooms < 1) return 100;
  if (bedrooms > 4) return 175;
  return CLEANING_FEES[bedrooms] ?? 100;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function nightCount(start: string, end: string): number {
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  return Math.max(
    0,
    Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

function fmtLongDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ReserveForm({
  properties,
  ownerName,
  ownerEmail,
  ownerPhone,
}: {
  properties: ReserveProperty[];
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
}) {
  const [data, setData] = useState<FormData>(() => ({
    propertyId: properties[0]?.id ?? "",
    startDate: null,
    endDate: null,
    checkInTime: "4:00 PM",
    checkOutTime: "10:00 AM",
    reason: "",
    reasonDetail: "",
    adults: 1,
    children: 0,
    pets: 0,
    notes: "",
    isOwnerStaying: true,
    guestFirstName: "",
    guestLastName: "",
    guestEmail: "",
    guestPhone: "",
    needsLockCode: false,
    requestedLockCode: "",
    wantsCleaning: true,
    damageAcknowledged: false,
  }));
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const update = useCallback(
    (patch: Partial<FormData>) => setData((d) => ({ ...d, ...patch })),
    [],
  );

  const selectedProperty = useMemo(
    () => properties.find((p) => p.id === data.propertyId) ?? properties[0],
    [properties, data.propertyId],
  );

  const isSingleProperty = properties.length === 1;

  const baseCleaningFee = selectedProperty
    ? (selectedProperty.cleaningFee ?? cleaningFee(selectedProperty.bedrooms))
    : 100;

  const hasPets = data.pets > 0;
  const propertyPetFee = selectedProperty?.petFee ?? DEFAULT_PET_FEE;
  const petFeeCharged = hasPets && data.wantsCleaning ? propertyPetFee : 0;
  const totalDueAtCheckout = data.wantsCleaning
    ? baseCleaningFee + petFeeCharged
    : 0;

  const petsNotAllowed =
    hasPets && selectedProperty?.petsAllowed === false;

  const nights =
    data.startDate && data.endDate
      ? nightCount(data.startDate, data.endDate)
      : 0;

  // ─── Guest validation (only matters when someone else is staying) ───
  const guestFullName = data.isOwnerStaying
    ? ownerName
    : [data.guestFirstName, data.guestLastName].filter(Boolean).join(" ").trim();

  const guestEmailValid =
    data.isOwnerStaying || data.guestEmail.trim() === ""
      ? true
      : EMAIL_REGEX.test(data.guestEmail.trim());
  const guestPhoneValid =
    data.isOwnerStaying || data.guestPhone.trim() === ""
      ? true
      : PHONE_REGEX.test(data.guestPhone.trim());

  const reasonDetailNeeded = REASONS_NEED_DETAIL.has(data.reason);
  const reasonDetailComplete =
    !reasonDetailNeeded || data.reasonDetail.trim().length > 0;

  const guestComplete = data.isOwnerStaying
    ? true
    : data.guestFirstName.trim().length > 0 &&
      data.guestLastName.trim().length > 0 &&
      data.guestEmail.trim().length > 0 &&
      guestEmailValid &&
      data.guestPhone.trim().length > 0 &&
      guestPhoneValid;

  const canSubmit =
    !!data.propertyId &&
    !!data.startDate &&
    !!data.endDate &&
    !!data.reason &&
    reasonDetailComplete &&
    guestComplete &&
    data.damageAcknowledged &&
    !pending;

  const missingFields: string[] = [];
  if (!data.propertyId) missingFields.push("property");
  if (!data.startDate || !data.endDate) missingFields.push("dates");
  if (!data.reason) missingFields.push("reason");
  if (!reasonDetailComplete) missingFields.push("reason details");
  if (!data.isOwnerStaying) {
    if (!data.guestFirstName.trim()) missingFields.push("first name");
    if (!data.guestLastName.trim()) missingFields.push("last name");
    if (!data.guestEmail.trim()) missingFields.push("email");
    else if (!guestEmailValid) missingFields.push("valid email");
    if (!data.guestPhone.trim()) missingFields.push("phone");
    else if (!guestPhoneValid) missingFields.push("valid phone");
  }
  if (!data.damageAcknowledged) missingFields.push("acknowledgment");

  // ─── Auto-populate lock code suggestion from guest phone last 4 digits ───
  const phoneDigits = data.guestPhone.replace(/\D/g, "");
  const lockCodeSuggestion =
    !data.isOwnerStaying && phoneDigits.length >= 4
      ? phoneDigits.slice(-4)
      : null;

  const onSubmit = () => {
    if (!canSubmit) return;
    setError(null);
    // Concat the reason detail into the reason field so admins see
    // "Maintenance: HVAC filter replacement" in one place. Keeps us
    // out of a schema migration for the detail sub-field.
    const reasonWithDetail =
      reasonDetailNeeded && data.reasonDetail.trim()
        ? `${data.reason}: ${data.reasonDetail.trim()}`.slice(0, 120)
        : data.reason;
    startTransition(async () => {
      const result = await submitBlockRequest({
        propertyId: data.propertyId,
        startDate: data.startDate!,
        endDate: data.endDate!,
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime,
        reason: reasonWithDetail,
        adults: data.adults,
        children: data.children,
        pets: data.pets,
        notes: data.notes.trim() || undefined,
        isOwnerStaying: data.isOwnerStaying,
        guestName: data.isOwnerStaying
          ? undefined
          : guestFullName || undefined,
        guestEmail: data.isOwnerStaying ? undefined : data.guestEmail.trim(),
        guestPhone: data.isOwnerStaying ? undefined : data.guestPhone.trim(),
        needsLockCode: data.needsLockCode,
        requestedLockCode: data.needsLockCode
          ? data.requestedLockCode.trim() || undefined
          : undefined,
        wantsCleaning: data.wantsCleaning,
        cleaningFee: data.wantsCleaning ? totalDueAtCheckout : undefined,
        damageAcknowledged: data.damageAcknowledged,
      });
      if (result.ok) {
        setSubmitted(true);
      } else {
        setError(result.error);
      }
    });
  };

  if (submitted) {
    return (
      <ReserveSuccess
        property={selectedProperty ?? null}
        ownerEmail={ownerEmail}
        data={data}
        nights={nights}
        total={totalDueAtCheckout}
        onReset={() => {
          setSubmitted(false);
          setData((d) => ({
            ...d,
            startDate: null,
            endDate: null,
            reason: "",
            reasonDetail: "",
            notes: "",
            damageAcknowledged: false,
          }));
        }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* Left: form */}
      <div className="flex flex-col gap-8">
        {/* Section 1 — Which home */}
        <Section
          number="01"
          title={isSingleProperty ? "Your home" : "Which home?"}
          description={
            isSingleProperty
              ? "We have one home on file for you."
              : "Pick the property you want to reserve."
          }
        >
          {isSingleProperty && selectedProperty ? (
            <div className="flex items-start gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: "rgba(2, 170, 235, 0.10)",
                  color: "var(--color-brand)",
                }}
              >
                <House size={18} weight="duotone" />
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className="text-[15px] font-semibold leading-tight"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {selectedProperty.name}
                </p>
                {selectedProperty.address ? (
                  <p
                    className="mt-0.5 text-[12.5px]"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {selectedProperty.address}
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <select
              value={data.propertyId}
              onChange={(e) => update({ propertyId: e.target.value })}
              className="h-11 w-full rounded-lg border px-3.5 text-sm outline-none focus:ring-2"
              style={{
                backgroundColor: "var(--color-white)",
                borderColor: "var(--color-warm-gray-200)",
                color: "var(--color-text-primary)",
              }}
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.address ? ` · ${p.address}` : ""}
                </option>
              ))}
            </select>
          )}
        </Section>

        {/* Section 2 — Dates */}
        <Section
          number="02"
          title="When?"
          description="Pick a start date, then an end date. We will check these against existing bookings."
        >
          <InlineCalendar
            startDate={data.startDate}
            endDate={data.endDate}
            onChange={(start, end) =>
              update({ startDate: start, endDate: end })
            }
          />
          {data.startDate && data.endDate ? (
            <div
              className="mt-4 flex items-center justify-between rounded-xl border px-4 py-3"
              style={{
                backgroundColor: "rgba(2, 170, 235, 0.04)",
                borderColor: "rgba(2, 170, 235, 0.25)",
              }}
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                <Moon
                  size={15}
                  weight="duotone"
                  style={{ color: "var(--color-brand)" }}
                />
                <span style={{ color: "var(--color-brand)" }}>
                  {fmtLongDate(data.startDate)} to {fmtLongDate(data.endDate)}
                </span>
              </div>
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--color-brand)" }}
              >
                {nights} {nights === 1 ? "night" : "nights"}
              </span>
            </div>
          ) : null}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <MicroLabel>Check-in time</MicroLabel>
              <select
                value={data.checkInTime}
                onChange={(e) => update({ checkInTime: e.target.value })}
                className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2"
                style={{
                  backgroundColor: "var(--color-white)",
                  borderColor: "var(--color-warm-gray-200)",
                  color: "var(--color-text-primary)",
                }}
              >
                {CHECK_IN_TIMES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <MicroLabel>Check-out time</MicroLabel>
              <select
                value={data.checkOutTime}
                onChange={(e) => update({ checkOutTime: e.target.value })}
                className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2"
                style={{
                  backgroundColor: "var(--color-white)",
                  borderColor: "var(--color-warm-gray-200)",
                  color: "var(--color-text-primary)",
                }}
              >
                {CHECK_OUT_TIMES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Section>

        {/* Section 3 — Stay details */}
        <Section
          number="03"
          title="Stay details"
          description="What is the reason for the block and who will be there?"
        >
          <div className="flex flex-col gap-2">
            <MicroLabel>Reason (required)</MicroLabel>
            <div className="flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() =>
                    update({
                      reason: r,
                      // Clear the detail when the reason flips away
                      // from a detail-requiring option, so we don't
                      // smuggle stale text.
                      reasonDetail: REASONS_NEED_DETAIL.has(r)
                        ? data.reasonDetail
                        : "",
                    })
                  }
                  className="rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor:
                      data.reason === r
                        ? "rgba(2, 170, 235, 0.08)"
                        : "var(--color-white)",
                    borderColor:
                      data.reason === r
                        ? "var(--color-brand)"
                        : "var(--color-warm-gray-200)",
                    color:
                      data.reason === r
                        ? "var(--color-brand)"
                        : "var(--color-text-primary)",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
            {reasonDetailNeeded ? (
              <input
                type="text"
                value={data.reasonDetail}
                onChange={(e) => update({ reasonDetail: e.target.value })}
                placeholder={
                  REASON_DETAIL_PLACEHOLDER[data.reason] ??
                  "Tell us more"
                }
                maxLength={100}
                className="mt-1 h-10 w-full rounded-lg border px-3.5 text-sm outline-none focus:ring-2"
                style={{
                  backgroundColor: "var(--color-white)",
                  borderColor: "var(--color-warm-gray-200)",
                  color: "var(--color-text-primary)",
                }}
              />
            ) : null}
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <MicroLabel>Guests</MicroLabel>
            <div className="flex flex-col gap-2">
              <NumberRow
                icon={<User size={16} weight="duotone" />}
                label="Adults"
                sublabel="Aged 13 or above"
                value={data.adults}
                min={0}
                max={30}
                onChange={(v) => update({ adults: v })}
              />
              <NumberRow
                icon={<Users size={16} weight="duotone" />}
                label="Children"
                sublabel="Aged 2 to 12"
                value={data.children}
                min={0}
                max={20}
                onChange={(v) => update({ children: v })}
              />
              <NumberRow
                icon={<PawPrint size={16} weight="duotone" />}
                label="Pets"
                sublabel={
                  data.wantsCleaning && hasPets
                    ? `+$${propertyPetFee} pet fee when we clean`
                    : ""
                }
                value={data.pets}
                min={0}
                max={10}
                onChange={(v) => update({ pets: v })}
              />
            </div>
            {petsNotAllowed ? (
              <div
                className="flex items-start gap-3 rounded-lg border px-4 py-3"
                style={{
                  backgroundColor: "rgba(220, 38, 38, 0.06)",
                  borderColor: "rgba(220, 38, 38, 0.28)",
                }}
              >
                <WarningCircle
                  size={16}
                  weight="fill"
                  className="mt-0.5 shrink-0"
                  style={{ color: "#b91c1c" }}
                />
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "#b91c1c" }}
                  >
                    This home is pet-free
                  </p>
                  <p
                    className="mt-0.5 text-xs leading-relaxed"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Are you sure you want to reserve with a pet? If yes, note
                    it here and we&apos;ll confirm before approving.
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <MicroLabel>Additional notes (optional)</MicroLabel>
            <div className="flex flex-wrap gap-1.5">
              {NOTE_SUGGESTIONS.map((suggestion) => {
                const alreadyIncluded = data.notes
                  .toLowerCase()
                  .includes(suggestion.toLowerCase());
                return (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      if (alreadyIncluded) return;
                      const next = data.notes.trim()
                        ? `${data.notes.trim()}. ${suggestion}`
                        : suggestion;
                      update({ notes: next });
                    }}
                    disabled={alreadyIncluded}
                    className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-40"
                    style={{
                      borderColor: alreadyIncluded
                        ? "var(--color-brand)"
                        : "var(--color-warm-gray-200)",
                      backgroundColor: alreadyIncluded
                        ? "rgba(2, 170, 235, 0.06)"
                        : "var(--color-white)",
                      color: alreadyIncluded
                        ? "var(--color-brand)"
                        : "var(--color-text-secondary)",
                    }}
                  >
                    <Sparkle size={10} weight="duotone" />
                    {suggestion}
                  </button>
                );
              })}
            </div>
            <textarea
              value={data.notes}
              onChange={(e) => update({ notes: e.target.value })}
              rows={3}
              maxLength={500}
              placeholder="Tap a suggestion above or type your own..."
              className="w-full resize-none rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:ring-2"
              style={{
                backgroundColor: "var(--color-white)",
                borderColor: "var(--color-warm-gray-200)",
                color: "var(--color-text-primary)",
              }}
            />
          </div>
        </Section>

        {/* Section 4 — Who's staying */}
        <Section
          number="04"
          title="Who's staying?"
          description="Let us know if you're staying or if someone else will be at the property."
        >
          <div className="flex gap-3">
            {(
              [
                { val: true, label: "I'm staying", sub: ownerName },
                {
                  val: false,
                  label: "Someone else",
                  sub: "Enter their details",
                },
              ] as const
            ).map((opt) => (
              <button
                key={String(opt.val)}
                type="button"
                onClick={() => update({ isOwnerStaying: opt.val })}
                className="flex flex-1 flex-col gap-1 rounded-xl border p-4 text-left transition-colors"
                style={{
                  backgroundColor:
                    data.isOwnerStaying === opt.val
                      ? "rgba(2, 170, 235, 0.04)"
                      : "var(--color-white)",
                  borderColor:
                    data.isOwnerStaying === opt.val
                      ? "var(--color-brand)"
                      : "var(--color-warm-gray-200)",
                }}
              >
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {opt.label}
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  {opt.sub}
                </span>
              </button>
            ))}
          </div>

          {data.isOwnerStaying ? (
            <div
              className="mt-4 flex flex-col gap-3 rounded-xl border p-4"
              style={{
                backgroundColor: "var(--color-warm-gray-50)",
                borderColor: "var(--color-warm-gray-200)",
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: "rgba(2, 170, 235, 0.1)",
                    color: "var(--color-brand)",
                  }}
                >
                  <User size={18} weight="duotone" />
                </span>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {ownerName}
                </p>
              </div>
              <div className="flex flex-col gap-1.5 pl-[52px]">
                <div
                  className="flex items-center gap-2 text-[12.5px]"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <EnvelopeSimple size={13} weight="duotone" />
                  <span>{ownerEmail}</span>
                </div>
                <div
                  className="flex items-center gap-2 text-[12.5px]"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <Phone size={13} weight="duotone" />
                  <span>
                    {ownerPhone || (
                      <span
                        style={{ color: "var(--color-text-tertiary)" }}
                      >
                        No phone on file
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <TextInput
                  label="First name"
                  value={data.guestFirstName}
                  onChange={(v) => update({ guestFirstName: v })}
                  placeholder="First"
                  required
                />
                <TextInput
                  label="Last name"
                  value={data.guestLastName}
                  onChange={(v) => update({ guestLastName: v })}
                  placeholder="Last"
                  required
                />
              </div>
              <TextInput
                label="Email"
                value={data.guestEmail}
                onChange={(v) => update({ guestEmail: v })}
                placeholder="guest@example.com"
                type="email"
                required
                error={
                  data.guestEmail.trim() && !guestEmailValid
                    ? "Enter a valid email address"
                    : null
                }
              />
              <TextInput
                label="Phone"
                value={data.guestPhone}
                onChange={(v) => update({ guestPhone: v })}
                placeholder="+1 (555) 000-0000"
                type="tel"
                required
                error={
                  data.guestPhone.trim() && !guestPhoneValid
                    ? "Enter a valid phone number"
                    : null
                }
              />
            </div>
          )}
        </Section>

        {/* Section 5 — Logistics */}
        <Section
          number="05"
          title="Logistics"
          description="Smart lock code and cleaning after the stay."
        >
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: "var(--color-warm-gray-200)" }}
          >
            <div className="flex items-center gap-3">
              <Lock
                size={18}
                weight="duotone"
                style={{ color: "var(--color-text-secondary)", flexShrink: 0 }}
              />
              <div className="flex-1">
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {data.isOwnerStaying
                    ? "Your personal code"
                    : "Need a new smart lock code for your guest?"}
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  {data.isOwnerStaying
                    ? "Use your own code. If you don't have one yet, pick Yes and we'll set one for you."
                    : "Create a fresh code for them. Never share your personal code."}
                </p>
              </div>
            </div>

            {/* Owner case: gentle reminder about not sharing */}
            {data.isOwnerStaying ? (
              <div
                className="mt-3 flex items-start gap-2 rounded-lg border px-3 py-2"
                style={{
                  backgroundColor: "rgba(2, 170, 235, 0.04)",
                  borderColor: "rgba(2, 170, 235, 0.22)",
                }}
              >
                <Lock
                  size={13}
                  weight="fill"
                  className="mt-0.5 shrink-0"
                  style={{ color: "var(--color-brand)" }}
                />
                <p
                  className="text-[11px] leading-relaxed"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <span
                    className="font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    This code is just for you.
                  </span>{" "}
                  Don&apos;t share it with anyone. If you need to let someone
                  else in, switch to &quot;Someone else&quot; above and we will
                  create a fresh code for them.
                </p>
              </div>
            ) : (
              <div
                className="mt-3 flex items-start gap-2 rounded-lg border px-3 py-2"
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.04)",
                  borderColor: "rgba(245, 158, 11, 0.28)",
                }}
              >
                <ShieldCheck
                  size={13}
                  weight="fill"
                  className="mt-0.5 shrink-0"
                  style={{ color: "#b45309" }}
                />
                <p
                  className="text-[11px] leading-relaxed"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  <span
                    className="font-semibold"
                    style={{ color: "#b45309" }}
                  >
                    Use a different code for your guest.
                  </span>{" "}
                  Reusing your personal code is a security risk. If they end
                  up using yours, we will rotate your code after their stay
                  to keep things safe.
                </p>
              </div>
            )}

            <div className="mt-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                {[false, true].map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => update({ needsLockCode: val })}
                    className="rounded-lg border px-3.5 py-1.5 text-sm font-medium transition-colors"
                    style={{
                      backgroundColor:
                        data.needsLockCode === val
                          ? "rgba(2, 170, 235, 0.08)"
                          : "var(--color-white)",
                      borderColor:
                        data.needsLockCode === val
                          ? "var(--color-brand)"
                          : "var(--color-warm-gray-200)",
                      color:
                        data.needsLockCode === val
                          ? "var(--color-brand)"
                          : "var(--color-text-primary)",
                    }}
                  >
                    {val ? "Yes" : "No"}
                  </button>
                ))}
              </div>
              <PinField
                value={data.requestedLockCode}
                onChange={(v) => update({ requestedLockCode: v })}
                disabled={!data.needsLockCode}
              />
            </div>

            {/* Auto-populate hint from guest phone last 4 */}
            {data.needsLockCode &&
            !data.isOwnerStaying &&
            lockCodeSuggestion ? (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-dashed px-3 py-2.5" style={{ borderColor: "rgba(2, 170, 235, 0.35)" }}>
                <div className="flex items-center gap-2">
                  <Sparkle
                    size={13}
                    weight="duotone"
                    style={{ color: "var(--color-brand)" }}
                  />
                  <p
                    className="text-[11.5px] leading-snug"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    We suggest the{" "}
                    <span
                      className="font-semibold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      last 4 digits
                    </span>{" "}
                    of your guest&apos;s phone number.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    update({ requestedLockCode: lockCodeSuggestion })
                  }
                  disabled={data.requestedLockCode === lockCodeSuggestion}
                  className="shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--color-brand)",
                    color: "#ffffff",
                  }}
                >
                  Use {lockCodeSuggestion}
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <MicroLabel>Should we schedule a cleaning after?</MicroLabel>
            {(
              [
                {
                  val: true,
                  label: "Yes, schedule a cleaning",
                  icon: <CheckCircle size={16} weight="duotone" />,
                },
                {
                  val: false,
                  label: "No, I will clean it myself",
                  icon: <Broom size={16} weight="duotone" />,
                },
              ] as const
            ).map((opt) => (
              <button
                key={String(opt.val)}
                type="button"
                onClick={() => update({ wantsCleaning: opt.val })}
                className="flex items-center gap-3 rounded-xl border p-4 text-left transition-colors"
                style={{
                  backgroundColor:
                    data.wantsCleaning === opt.val
                      ? "rgba(2, 170, 235, 0.04)"
                      : "var(--color-white)",
                  borderColor:
                    data.wantsCleaning === opt.val
                      ? "var(--color-brand)"
                      : "var(--color-warm-gray-200)",
                }}
              >
                <span
                  style={{
                    color:
                      data.wantsCleaning === opt.val
                        ? "var(--color-brand)"
                        : "var(--color-text-tertiary)",
                  }}
                >
                  {opt.icon}
                </span>
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {opt.label}
                </span>
              </button>
            ))}
            {data.wantsCleaning ? (
              <div
                className="flex flex-col gap-2 rounded-lg border px-4 py-3"
                style={{
                  backgroundColor: "var(--color-warm-gray-50)",
                  borderColor: "var(--color-warm-gray-200)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Cleaning fee ({selectedProperty?.bedrooms ?? 1}-bedroom)
                  </span>
                  <span
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    ${baseCleaningFee}
                  </span>
                </div>
                {petFeeCharged > 0 ? (
                  <div
                    className="flex items-center justify-between border-t pt-2"
                    style={{ borderColor: "var(--color-warm-gray-200)" }}
                  >
                    <span
                      className="flex items-center gap-1.5 text-sm"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <PawPrint size={13} weight="duotone" />
                      Pet fee ({data.pets} {data.pets === 1 ? "pet" : "pets"})
                    </span>
                    <span
                      className="text-sm font-semibold tabular-nums"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      ${petFeeCharged}
                    </span>
                  </div>
                ) : null}
                <div
                  className="flex items-center justify-between border-t pt-2"
                  style={{ borderColor: "var(--color-warm-gray-200)" }}
                >
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Total after stay
                  </span>
                  <span
                    className="text-sm font-bold tabular-nums"
                    style={{ color: "var(--color-brand)" }}
                  >
                    ${totalDueAtCheckout}
                  </span>
                </div>
              </div>
            ) : (
              <div
                className="flex items-start gap-3 rounded-lg border px-4 py-3"
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.04)",
                  borderColor: "rgba(245, 158, 11, 0.25)",
                }}
              >
                <FileArrowDown
                  size={16}
                  weight="duotone"
                  className="mt-0.5 shrink-0"
                  style={{ color: "#b45309" }}
                />
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Cleaning checklist required
                  </p>
                  <p
                    className="mt-0.5 text-xs"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    If you choose to clean yourself, you must follow our
                    cleaning standards.{" "}
                    <a
                      href="/portal/cleaning-checklist"
                      className="font-semibold underline"
                      style={{ color: "#b45309" }}
                    >
                      Open the checklist
                    </a>
                  </p>
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Section 6 — Acknowledgment */}
        <Section
          number="06"
          title="Acknowledgment"
          description="One last thing before we send this over."
        >
          <label
            className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors"
            style={{
              borderColor: data.damageAcknowledged
                ? "var(--color-brand)"
                : "var(--color-warm-gray-200)",
              backgroundColor: data.damageAcknowledged
                ? "rgba(2, 170, 235, 0.04)"
                : "var(--color-white)",
            }}
          >
            <input
              type="checkbox"
              checked={data.damageAcknowledged}
              onChange={(e) => update({ damageAcknowledged: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded accent-[var(--color-brand)]"
            />
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                <ShieldCheck
                  size={14}
                  weight="duotone"
                  className="mr-1 inline-block"
                  style={{ color: "var(--color-brand)" }}
                />
                Liability for damage acknowledgment
              </p>
              <p
                className="mt-1 text-xs leading-relaxed"
                style={{ color: "var(--color-text-secondary)" }}
              >
                I acknowledge that any damage to or necessary replacements for
                the property during my or my guests&apos; stay will be my
                responsibility. I agree to address any issues promptly.
              </p>
            </div>
          </label>
        </Section>

        {error ? (
          <div
            className="rounded-lg border px-4 py-3 text-sm"
            style={{
              backgroundColor: "rgba(220, 38, 38, 0.06)",
              borderColor: "rgba(220, 38, 38, 0.28)",
              color: "#b91c1c",
            }}
          >
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 lg:hidden">
          {/* Mobile: stacked summary above submit */}
          <ReserveSummary
            property={selectedProperty ?? null}
            startDate={data.startDate}
            endDate={data.endDate}
            nights={nights}
            reason={data.reason}
            reasonDetail={data.reasonDetail}
            adults={data.adults}
            childrenCount={data.children}
            pets={data.pets}
            isOwnerStaying={data.isOwnerStaying}
            guestName={guestFullName}
            ownerName={ownerName}
            wantsCleaning={data.wantsCleaning}
            baseCleaningFee={baseCleaningFee}
            petFee={petFeeCharged}
            total={totalDueAtCheckout}
            needsLockCode={data.needsLockCode}
            checkInTime={data.checkInTime}
            checkOutTime={data.checkOutTime}
            compact
          />
        </div>

        <button
          type="button"
          disabled={!canSubmit}
          onClick={onSubmit}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 lg:w-fit lg:self-end"
          style={{ backgroundColor: "var(--color-brand)" }}
        >
          {pending ? "Sending..." : "Send reservation"}
        </button>

        {!canSubmit && missingFields.length > 0 && !pending ? (
          <p
            className="text-xs lg:text-right"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Still needed: {missingFields.join(", ")}
          </p>
        ) : null}
      </div>

      {/* Right: sticky live summary (desktop only) */}
      <div className="hidden lg:block">
        <div className="sticky top-24">
          <ReserveSummary
            property={selectedProperty ?? null}
            startDate={data.startDate}
            endDate={data.endDate}
            nights={nights}
            reason={data.reason}
            reasonDetail={data.reasonDetail}
            adults={data.adults}
            childrenCount={data.children}
            pets={data.pets}
            isOwnerStaying={data.isOwnerStaying}
            guestName={guestFullName}
            ownerName={ownerName}
            wantsCleaning={data.wantsCleaning}
            baseCleaningFee={baseCleaningFee}
            petFee={petFeeCharged}
            total={totalDueAtCheckout}
            needsLockCode={data.needsLockCode}
            checkInTime={data.checkInTime}
            checkOutTime={data.checkOutTime}
          />
        </div>
      </div>
    </div>
  );
}

/* ───── Section wrapper ───── */

function Section({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold tabular-nums"
          style={{
            backgroundColor: "rgba(2, 170, 235, 0.08)",
            color: "var(--color-brand)",
          }}
        >
          {number}
        </span>
        <div className="flex flex-col gap-0.5">
          <h2
            className="text-[17px] font-semibold leading-tight tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            {title}
          </h2>
          <p
            className="text-[13px]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {description}
          </p>
        </div>
      </div>
      <div
        className="rounded-2xl border p-5"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: "var(--color-warm-gray-200)",
        }}
      >
        {children}
      </div>
    </section>
  );
}

/* ───── Inline calendar ───── */

function InlineCalendar({
  startDate,
  endDate,
  onChange,
}: {
  startDate: string | null;
  endDate: string | null;
  onChange: (start: string | null, end: string | null) => void;
}) {
  const today = useMemo(() => isoDate(new Date()), []);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [hovered, setHovered] = useState<string | null>(null);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDow = new Date(viewYear, viewMonth, 1).getDay();
  const calDays: (string | null)[] = [];
  for (let i = 0; i < startDow; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    calDays.push(isoDate(new Date(viewYear, viewMonth, d)));
  }

  const onDayClick = useCallback(
    (iso: string) => {
      if (iso < today) return;
      if (!startDate || (startDate && endDate)) {
        onChange(iso, null);
      } else {
        if (iso < startDate) onChange(iso, startDate);
        else onChange(startDate, iso);
      }
    },
    [startDate, endDate, today, onChange],
  );

  const effectiveEnd = endDate ?? hovered;
  const selStart =
    startDate && effectiveEnd && effectiveEnd < startDate
      ? effectiveEnd
      : startDate;
  const selEnd =
    startDate && effectiveEnd && effectiveEnd < startDate
      ? startDate
      : effectiveEnd;
  const isInRange = (iso: string) => {
    if (!selStart) return false;
    if (!selEnd) return iso === selStart;
    return iso >= selStart && iso <= selEnd;
  };
  const isStart = (iso: string) => iso === selStart;
  const isEnd = (iso: string) => iso === (selEnd ?? selStart);

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (viewMonth === 0) {
              setViewMonth(11);
              setViewYear((y) => y - 1);
            } else {
              setViewMonth((m) => m - 1);
            }
          }}
          className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[var(--color-warm-gray-50)]"
          style={{ color: "var(--color-text-secondary)" }}
          aria-label="Previous month"
        >
          <CaretLeft size={14} weight="bold" />
        </button>
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={() => {
            if (viewMonth === 11) {
              setViewMonth(0);
              setViewYear((y) => y + 1);
            } else {
              setViewMonth((m) => m + 1);
            }
          }}
          className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[var(--color-warm-gray-50)]"
          style={{ color: "var(--color-text-secondary)" }}
          aria-label="Next month"
        >
          <CaretRight size={14} weight="bold" />
        </button>
      </div>
      <div
        className="mt-2 grid grid-cols-7 text-center text-[10px] font-semibold uppercase tracking-[0.06em]"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="py-1.5">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {calDays.map((iso, i) => {
          if (!iso) return <div key={`e-${i}`} className="h-10" />;
          const isPast = iso < today;
          const inRange = isInRange(iso);
          const start = isStart(iso);
          const end = isEnd(iso);
          const isToday = iso === today;
          return (
            <button
              key={iso}
              type="button"
              disabled={isPast}
              onClick={() => onDayClick(iso)}
              onMouseEnter={() => {
                if (startDate && !endDate) setHovered(iso);
              }}
              onMouseLeave={() => setHovered(null)}
              className="relative flex h-10 items-center justify-center text-[13px] font-medium tabular-nums transition-colors"
              style={{
                color: isPast
                  ? "var(--color-text-tertiary)"
                  : start || end
                    ? "var(--color-white)"
                    : inRange
                      ? "var(--color-brand)"
                      : "var(--color-text-primary)",
                backgroundColor:
                  start || end
                    ? "var(--color-brand)"
                    : inRange
                      ? "rgba(2, 170, 235, 0.14)"
                      : "transparent",
                borderRadius:
                  start && end
                    ? "8px"
                    : start
                      ? "8px 0 0 8px"
                      : end
                        ? "0 8px 8px 0"
                        : "0",
                cursor: isPast ? "default" : "pointer",
                opacity: isPast ? 0.4 : 1,
                fontWeight: isToday || start || end ? 700 : 500,
              }}
            >
              {new Date(`${iso}T00:00:00`).getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───── Field helpers ───── */

function MicroLabel({ children }: { children: ReactNode }) {
  return (
    <span
      className="text-[11px] font-semibold uppercase tracking-[0.08em]"
      style={{ color: "var(--color-text-tertiary)" }}
    >
      {children}
    </span>
  );
}

function NumberRow({
  icon,
  label,
  sublabel,
  value,
  min,
  max,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  sublabel: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div
      className="flex items-center justify-between rounded-lg border px-4 py-3"
      style={{ borderColor: "var(--color-warm-gray-200)" }}
    >
      <div className="flex items-center gap-3">
        <span style={{ color: "var(--color-text-secondary)" }}>{icon}</span>
        <div>
          <p
            className="text-sm font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            {label}
          </p>
          {sublabel && (
            <p
              className="text-[11px]"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {sublabel}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className="flex h-7 w-7 items-center justify-center rounded-md border text-sm font-medium transition-colors hover:bg-[var(--color-warm-gray-50)] disabled:opacity-30"
          style={{
            borderColor: "var(--color-warm-gray-200)",
            color: "var(--color-text-primary)",
          }}
        >
          -
        </button>
        <span
          className="w-6 text-center text-sm font-semibold tabular-nums"
          style={{ color: "var(--color-text-primary)" }}
        >
          {value}
        </span>
        <button
          type="button"
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-md border text-sm font-medium transition-colors hover:bg-[var(--color-warm-gray-50)] disabled:opacity-30"
          style={{
            borderColor: "var(--color-warm-gray-200)",
            color: "var(--color-text-primary)",
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  error?: string | null;
}) {
  const hasError = Boolean(error);
  return (
    <label className="flex flex-col gap-1.5">
      <MicroLabel>{label}</MicroLabel>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="h-10 w-full rounded-lg border px-3.5 text-sm outline-none focus:ring-2"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: hasError
            ? "rgba(220, 38, 38, 0.5)"
            : "var(--color-warm-gray-200)",
          color: "var(--color-text-primary)",
        }}
      />
      {hasError ? (
        <span className="text-[11px]" style={{ color: "#b91c1c" }}>
          {error}
        </span>
      ) : null}
    </label>
  );
}

function PinField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const display = value.padEnd(4, "–").slice(0, 4).split("").join(" ");

  return (
    <div
      className="relative flex items-center rounded-lg border px-3 transition-all duration-150"
      style={{
        height: 36,
        width: 100,
        backgroundColor: disabled
          ? "var(--color-warm-gray-50)"
          : "var(--color-white)",
        borderColor: disabled
          ? "var(--color-warm-gray-200)"
          : value.length === 4
            ? "var(--color-brand)"
            : "rgba(2, 170, 235, 0.4)",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "default" : "text",
      }}
      onClick={() => !disabled && inputRef.current?.focus()}
    >
      <span
        className="text-sm font-semibold tabular-nums tracking-[0.25em]"
        style={{
          color: disabled
            ? "var(--color-text-tertiary)"
            : value
              ? "var(--color-text-primary)"
              : "var(--color-text-tertiary)",
        }}
      >
        {display}
      </span>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        maxLength={4}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const filtered = e.target.value.replace(/\D/g, "").slice(0, 4);
          onChange(filtered);
        }}
        className="absolute inset-0 h-full w-full cursor-text rounded-lg opacity-0"
        aria-label="4-digit lock code"
      />
    </div>
  );
}

/* ───── Success state ───── */

function ReserveSuccess({
  property,
  ownerEmail,
  data,
  nights,
  total,
  onReset,
}: {
  property: ReserveProperty | null;
  ownerEmail: string;
  data: FormData;
  nights: number;
  total: number;
  onReset: () => void;
}) {
  const recipientEmail = data.isOwnerStaying
    ? ownerEmail
    : data.guestEmail || ownerEmail;
  return (
    <div
      className="mx-auto flex max-w-xl flex-col items-center gap-6 rounded-2xl border p-10 text-center"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
    >
      <span
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{
          backgroundColor: "rgba(22, 163, 74, 0.12)",
          color: "#15803d",
        }}
      >
        <CheckCircle size={28} weight="fill" />
      </span>
      <div>
        <h2
          className="text-[22px] font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          Reservation sent
        </h2>
        <p
          className="mt-2 max-w-sm text-sm leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          We will check these dates against existing bookings and confirm by
          email at{" "}
          <span
            className="font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            {recipientEmail}
          </span>
          .
        </p>
      </div>
      <div
        className="flex w-full max-w-sm items-center gap-3 rounded-xl border p-4 text-left"
        style={{
          borderColor: "var(--color-warm-gray-200)",
          backgroundColor: "var(--color-warm-gray-50)",
        }}
      >
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{
            backgroundColor: "rgba(2, 170, 235, 0.10)",
            color: "var(--color-brand)",
          }}
        >
          <House size={16} weight="duotone" />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-sm font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {property?.name ?? "Property"}
          </p>
          <p
            className="mt-0.5 text-xs"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {data.startDate ? fmtLongDate(data.startDate) : ""} to{" "}
            {data.endDate ? fmtLongDate(data.endDate) : ""} · {nights}{" "}
            {nights === 1 ? "night" : "nights"}
            {total > 0 ? ` · total $${total}` : ""}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "var(--color-brand)" }}
      >
        Reserve another
      </button>
    </div>
  );
}
