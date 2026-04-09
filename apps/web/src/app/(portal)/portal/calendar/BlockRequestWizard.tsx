"use client";

import {
  useCallback,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import {
  CaretLeft,
  CaretRight,
  CheckCircle,
  House,
  MapPin,
  Moon,
  User,
  Users,
  PawPrint,
  Broom,
  Lock,
  ShieldCheck,
  X,
} from "@phosphor-icons/react";
import { submitBlockRequest } from "./actions";

/* ───── Types ───── */

type Property = {
  id: string;
  name: string;
  address: string;
  bedrooms: number | null;
};

type WizardData = {
  propertyId: string;
  startDate: string | null;
  endDate: string | null;
  checkInTime: string;
  checkOutTime: string;
  reason: string;
  adults: number;
  children: number;
  pets: number;
  notes: string;
  isOwnerStaying: boolean;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  needsLockCode: boolean;
  requestedLockCode: string;
  wantsCleaning: boolean;
  damageAcknowledged: boolean;
};

const INITIAL_DATA: WizardData = {
  propertyId: "",
  startDate: null,
  endDate: null,
  checkInTime: "4:00 PM",
  checkOutTime: "10:00 AM",
  reason: "",
  adults: 1,
  children: 0,
  pets: 0,
  notes: "",
  isOwnerStaying: true,
  guestName: "",
  guestEmail: "",
  guestPhone: "",
  needsLockCode: false,
  requestedLockCode: "",
  wantsCleaning: false,
  damageAcknowledged: false,
};

const STEPS = [
  "Property & dates",
  "Stay details",
  "Who's staying",
  "Cleaning & acknowledgments",
  "Review",
];

const CHECK_IN_TIMES = ["12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];
const CHECK_OUT_TIMES = ["10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM"];
const REASONS = ["Personal stay", "Family visiting", "Renovation", "Maintenance", "Other"];

const CLEANING_FEES: Record<number, number> = { 1: 100, 2: 125, 3: 150, 4: 175 };

function cleaningFee(bedrooms: number | null): number {
  if (!bedrooms || bedrooms < 1) return 100;
  if (bedrooms > 4) return 175;
  return CLEANING_FEES[bedrooms] ?? 100;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function nightCount(start: string, end: string): number {
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  return Math.max(0, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
}

function fmtDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ───── Main Wizard ───── */

export function BlockRequestWizard({
  properties,
  ownerName,
  ownerEmail,
  onClose,
  editingBlock,
}: {
  properties: Property[];
  ownerName: string;
  ownerEmail: string;
  onClose: () => void;
  editingBlock?: import("./BlockBar").BlockRequest | null;
}) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(() => {
    if (editingBlock) {
      return {
        propertyId: editingBlock.property_id,
        startDate: editingBlock.start_date,
        endDate: editingBlock.end_date,
        checkInTime: editingBlock.check_in_time ?? "4:00 PM",
        checkOutTime: editingBlock.check_out_time ?? "10:00 AM",
        reason: editingBlock.reason ?? "",
        adults: editingBlock.adults ?? 1,
        children: editingBlock.children ?? 0,
        pets: editingBlock.pets ?? 0,
        notes: editingBlock.note ?? "",
        isOwnerStaying: editingBlock.is_owner_staying ?? true,
        guestName: editingBlock.guest_name ?? "",
        guestEmail: editingBlock.guest_email ?? "",
        guestPhone: editingBlock.guest_phone ?? "",
        needsLockCode: editingBlock.needs_lock_code ?? false,
        requestedLockCode: editingBlock.requested_lock_code ?? "",
        wantsCleaning: editingBlock.wants_cleaning ?? false,
        damageAcknowledged: editingBlock.damage_acknowledged ?? false,
      };
    }
    return { ...INITIAL_DATA, propertyId: properties[0]?.id ?? "" };
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const update = useCallback(
    (patch: Partial<WizardData>) => setData((d) => ({ ...d, ...patch })),
    [],
  );

  const selectedProperty = useMemo(
    () => properties.find((p) => p.id === data.propertyId) ?? properties[0],
    [properties, data.propertyId],
  );

  const fee = selectedProperty ? cleaningFee(selectedProperty.bedrooms) : 100;
  const nights =
    data.startDate && data.endDate ? nightCount(data.startDate, data.endDate) : 0;

  const canAdvance = (() => {
    switch (step) {
      case 0: return !!data.propertyId && !!data.startDate && !!data.endDate;
      case 1: return !!data.reason;
      case 2: return data.isOwnerStaying || data.guestName.trim().length > 0;
      case 3: return data.damageAcknowledged;
      default: return true;
    }
  })();

  const onSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await submitBlockRequest({
        propertyId: data.propertyId,
        startDate: data.startDate!,
        endDate: data.endDate!,
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime,
        reason: data.reason,
        adults: data.adults,
        children: data.children,
        pets: data.pets,
        notes: data.notes.trim() || undefined,
        isOwnerStaying: data.isOwnerStaying,
        guestName: data.isOwnerStaying ? undefined : data.guestName.trim(),
        guestEmail: data.isOwnerStaying ? undefined : data.guestEmail.trim(),
        guestPhone: data.isOwnerStaying ? undefined : data.guestPhone.trim(),
        needsLockCode: data.needsLockCode,
        requestedLockCode: data.needsLockCode ? data.requestedLockCode.trim() || undefined : undefined,
        wantsCleaning: data.wantsCleaning,
        cleaningFee: data.wantsCleaning ? fee : undefined,
        damageAcknowledged: data.damageAcknowledged,
      });
      if (result.ok) {
        setSubmitted(true);
      } else {
        setError(result.error);
      }
    });
  };

  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.36)" }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border shadow-[0_30px_80px_-20px_rgba(15,23,42,0.35)]"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: "var(--color-warm-gray-200)",
          height: "min(720px, calc(100dvh - 48px))",
        }}
      >
        {/* Header + step labels */}
        <div className="shrink-0">
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Block dates
            </p>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-warm-gray-100)]"
              style={{ color: "var(--color-text-secondary)" }}
              aria-label="Close"
            >
              <X size={14} weight="bold" />
            </button>
          </div>

          {/* Step progress with labels */}
          {!submitted && (
            <div className="flex items-center gap-0 px-6 pb-4">
              {STEPS.map((label, i) => {
                const isDone = i < step;
                const isCurrent = i === step;
                const isFuture = i > step;
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="flex w-full items-center">
                      {i > 0 && (
                        <div
                          className="h-[2px] flex-1 transition-colors duration-200"
                          style={{
                            backgroundColor: isDone || isCurrent
                              ? "var(--color-brand)"
                              : "var(--color-warm-gray-200)",
                          }}
                        />
                      )}
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-200"
                        style={{
                          backgroundColor: isDone
                            ? "var(--color-brand)"
                            : isCurrent
                              ? "var(--color-brand)"
                              : "var(--color-warm-gray-100)",
                          color: isDone || isCurrent
                            ? "#ffffff"
                            : "var(--color-text-tertiary)",
                        }}
                      >
                        {isDone ? "✓" : i + 1}
                      </span>
                      {i < STEPS.length - 1 && (
                        <div
                          className="h-[2px] flex-1 transition-colors duration-200"
                          style={{
                            backgroundColor: isDone
                              ? "var(--color-brand)"
                              : "var(--color-warm-gray-200)",
                          }}
                        />
                      )}
                    </div>
                    <span
                      className="text-[10px] font-medium leading-tight text-center"
                      style={{
                        color: isCurrent
                          ? "var(--color-brand)"
                          : isFuture
                            ? "var(--color-text-tertiary)"
                            : "var(--color-text-secondary)",
                      }}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Divider */}
          <div
            className="h-px w-full"
            style={{ backgroundColor: "var(--color-warm-gray-100)" }}
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {submitted ? (
            <SuccessScreen
              property={selectedProperty}
              data={data}
              ownerEmail={ownerEmail}
              nights={nights}
              fee={fee}
              onClose={onClose}
            />
          ) : (
            <>
              {step === 0 && <StepPropertyDates properties={properties} data={data} update={update} nights={nights} />}
              {step === 1 && <StepStayDetails data={data} update={update} />}
              {step === 2 && <StepWhoStaying data={data} update={update} ownerName={ownerName} ownerEmail={ownerEmail} />}
              {step === 3 && <StepCleaning data={data} update={update} bedrooms={selectedProperty?.bedrooms ?? null} fee={fee} />}
              {step === 4 && <StepReview data={data} property={selectedProperty} ownerName={ownerName} ownerEmail={ownerEmail} nights={nights} fee={fee} error={error} />}
            </>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div
            className="flex shrink-0 items-center justify-between border-t px-6 py-4"
            style={{ borderColor: "var(--color-warm-gray-200)" }}
          >
            <button
              type="button"
              onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
              className="rounded-lg px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--color-warm-gray-50)]"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {step === 0 ? "Cancel" : "Back"}
            </button>

            {step < 4 ? (
              <button
                type="button"
                disabled={!canAdvance}
                onClick={() => setStep((s) => s + 1)}
                className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ backgroundColor: "var(--color-brand)" }}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                disabled={pending}
                onClick={onSubmit}
                className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: "var(--color-brand)" }}
              >
                {pending ? "Submitting..." : "Confirm stay"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ───── Step 1: Property & Dates ───── */

function StepPropertyDates({ properties, data, update, nights }: { properties: Property[]; data: WizardData; update: (p: Partial<WizardData>) => void; nights: number }) {
  const today = useMemo(() => isoDate(new Date()), []);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [hovered, setHovered] = useState<string | null>(null);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDow = new Date(viewYear, viewMonth, 1).getDay();
  const calDays: (string | null)[] = [];
  for (let i = 0; i < startDow; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(isoDate(new Date(viewYear, viewMonth, d)));

  const onDayClick = useCallback((iso: string) => {
    if (iso < today) return;
    if (!data.startDate || (data.startDate && data.endDate)) {
      update({ startDate: iso, endDate: null });
    } else {
      if (iso < data.startDate) update({ startDate: iso, endDate: data.startDate });
      else update({ endDate: iso });
    }
  }, [data.startDate, data.endDate, today, update]);

  const effectiveEnd = data.endDate ?? hovered;
  const selStart = data.startDate && effectiveEnd && effectiveEnd < data.startDate ? effectiveEnd : data.startDate;
  const selEnd = data.startDate && effectiveEnd && effectiveEnd < data.startDate ? data.startDate : effectiveEnd;
  const isInRange = (iso: string) => { if (!selStart) return false; if (!selEnd) return iso === selStart; return iso >= selStart && iso <= selEnd; };
  const isStart = (iso: string) => iso === selStart;
  const isEnd = (iso: string) => iso === (selEnd ?? selStart);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Property and dates</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Pick the home and the dates you need blocked.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Property</Label>
        <select value={data.propertyId} onChange={(e) => update({ propertyId: e.target.value })} className="h-11 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2" style={{ backgroundColor: "var(--color-white)", borderColor: "var(--color-warm-gray-200)", color: "var(--color-text-primary)" }}>
          {properties.map((p) => (<option key={p.id} value={p.id}>{p.name} {p.address ? `· ${p.address}` : ""}</option>))}
        </select>
      </div>

      {/* Calendar */}
      <div>
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); } else setViewMonth((m) => m - 1); }} className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-warm-gray-50)]" style={{ color: "var(--color-text-secondary)" }}><CaretLeft size={14} weight="bold" /></button>
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
          <button type="button" onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); } else setViewMonth((m) => m + 1); }} className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-warm-gray-50)]" style={{ color: "var(--color-text-secondary)" }}><CaretRight size={14} weight="bold" /></button>
        </div>
        <div className="mt-2 grid grid-cols-7 text-center text-[10px] font-semibold uppercase tracking-[0.06em]" style={{ color: "var(--color-text-tertiary)" }}>
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (<div key={d} className="py-1.5">{d}</div>))}
        </div>
        <div className="grid grid-cols-7">
          {calDays.map((iso, i) => {
            if (!iso) return <div key={`e-${i}`} className="h-9" />;
            const isPast = iso < today;
            const inRange = isInRange(iso);
            const start = isStart(iso);
            const end = isEnd(iso);
            const isToday = iso === today;
            return (
              <button key={iso} type="button" disabled={isPast} onClick={() => onDayClick(iso)} onMouseEnter={() => { if (data.startDate && !data.endDate) setHovered(iso); }} onMouseLeave={() => setHovered(null)} className="relative flex h-9 items-center justify-center text-[13px] font-medium tabular-nums transition-colors" style={{ color: isPast ? "var(--color-text-tertiary)" : (start || end) ? "#ffffff" : inRange ? "var(--color-brand)" : "var(--color-text-primary)", backgroundColor: (start || end) ? "var(--color-brand)" : inRange ? "rgba(2, 170, 235, 0.14)" : "transparent", borderRadius: start && end ? "8px" : start ? "8px 0 0 8px" : end ? "0 8px 8px 0" : "0", cursor: isPast ? "default" : "pointer", opacity: isPast ? 0.4 : 1, fontWeight: isToday || start || end ? 700 : 500 }}>
                {new Date(`${iso}T00:00:00`).getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date summary */}
      {data.startDate && data.endDate ? (
        <div className="flex items-center justify-between rounded-xl border px-4 py-3" style={{ backgroundColor: "rgba(2, 170, 235, 0.04)", borderColor: "rgba(2, 170, 235, 0.2)" }}>
          <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--color-brand)" }}><MapPin size={14} weight="duotone" />{fmtDate(data.startDate)} to {fmtDate(data.endDate)}</div>
          <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--color-brand)" }}><Moon size={14} weight="duotone" />{nights} {nights === 1 ? "night" : "nights"}</div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed px-4 py-3 text-center text-sm" style={{ borderColor: "var(--color-warm-gray-200)", color: "var(--color-text-tertiary)" }}>Tap a start date, then an end date</div>
      )}

      {/* Times */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5"><Label>Check-in</Label><PillGroup options={CHECK_IN_TIMES} value={data.checkInTime} onChange={(v) => update({ checkInTime: v })} /></div>
        <div className="flex flex-col gap-1.5"><Label>Check-out</Label><PillGroup options={CHECK_OUT_TIMES} value={data.checkOutTime} onChange={(v) => update({ checkOutTime: v })} /></div>
      </div>
    </div>
  );
}

/* ───── Step 2: Stay Details ───── */

function StepStayDetails({ data, update }: { data: WizardData; update: (p: Partial<WizardData>) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Stay details</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>What is the reason for the block and who will be there?</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Reason</Label>
        <div className="flex flex-wrap gap-2">
          {REASONS.map((r) => (
            <button key={r} type="button" onClick={() => update({ reason: r })} className="rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors" style={{ backgroundColor: data.reason === r ? "rgba(2, 170, 235, 0.08)" : "var(--color-white)", borderColor: data.reason === r ? "var(--color-brand)" : "var(--color-warm-gray-200)", color: data.reason === r ? "var(--color-brand)" : "var(--color-text-primary)" }}>{r}</button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Label>Guests</Label>
        <NumberRow icon={<User size={16} weight="duotone" />} label="Adults" sublabel="Aged 13 or above" value={data.adults} min={0} max={30} onChange={(v) => update({ adults: v })} />
        <NumberRow icon={<Users size={16} weight="duotone" />} label="Children" sublabel="Aged 2 to 12" value={data.children} min={0} max={20} onChange={(v) => update({ children: v })} />
        <NumberRow icon={<PawPrint size={16} weight="duotone" />} label="Pets" sublabel="" value={data.pets} min={0} max={10} onChange={(v) => update({ pets: v })} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Additional notes (optional)</Label>
        <textarea value={data.notes} onChange={(e) => update({ notes: e.target.value })} rows={2} maxLength={500} placeholder="Special requests, early check-in, etc." className="w-full resize-none rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2" style={{ backgroundColor: "var(--color-white)", borderColor: "var(--color-warm-gray-200)", color: "var(--color-text-primary)" }} />
      </div>
    </div>
  );
}

/* ───── Step 3: Who's Staying ───── */

function StepWhoStaying({ data, update, ownerName, ownerEmail }: { data: WizardData; update: (p: Partial<WizardData>) => void; ownerName: string; ownerEmail: string }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Who's staying?</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Let us know if you are staying or if someone else will be at the property.</p>
      </div>

      <div className="flex gap-3">
        {[{ val: true, label: "I'm staying", sub: ownerName }, { val: false, label: "Someone else", sub: "Enter their details" }].map((opt) => (
          <button key={String(opt.val)} type="button" onClick={() => update({ isOwnerStaying: opt.val })} className="flex flex-1 flex-col gap-1 rounded-xl border p-4 text-left transition-colors" style={{ backgroundColor: data.isOwnerStaying === opt.val ? "rgba(2, 170, 235, 0.04)" : "var(--color-white)", borderColor: data.isOwnerStaying === opt.val ? "var(--color-brand)" : "var(--color-warm-gray-200)" }}>
            <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{opt.label}</span>
            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{opt.sub}</span>
          </button>
        ))}
      </div>

      {data.isOwnerStaying ? (
        <div className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{ backgroundColor: "var(--color-warm-gray-50)", borderColor: "var(--color-warm-gray-200)" }}>
          <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: "rgba(2, 170, 235, 0.1)", color: "var(--color-brand)" }}><User size={16} weight="duotone" /></span>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{ownerName}</p>
            <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{ownerEmail}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <TextInput label="Full name" value={data.guestName} onChange={(v) => update({ guestName: v })} placeholder="First and last name" required />
          <TextInput label="Email" value={data.guestEmail} onChange={(v) => update({ guestEmail: v })} placeholder="email@example.com" type="email" />
          <TextInput label="Phone" value={data.guestPhone} onChange={(v) => update({ guestPhone: v })} placeholder="+1 (555) 000-0000" type="tel" />
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-xl border p-4" style={{ borderColor: "var(--color-warm-gray-200)" }}>
        <div className="flex items-center gap-3">
          <Lock size={18} weight="duotone" style={{ color: "var(--color-text-secondary)" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Need a new smart lock code?</p>
            <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>If you already have your personal code, select No.</p>
          </div>
        </div>
        <div className="flex gap-2">
          {[false, true].map((val) => (
            <button key={String(val)} type="button" onClick={() => update({ needsLockCode: val })} className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors" style={{ backgroundColor: data.needsLockCode === val ? "rgba(2, 170, 235, 0.08)" : "var(--color-white)", borderColor: data.needsLockCode === val ? "var(--color-brand)" : "var(--color-warm-gray-200)", color: data.needsLockCode === val ? "var(--color-brand)" : "var(--color-text-primary)" }}>{val ? "Yes" : "No"}</button>
          ))}
        </div>
        {data.needsLockCode && <TextInput label="Preferred code" value={data.requestedLockCode} onChange={(v) => update({ requestedLockCode: v })} placeholder="e.g. 1234" />}
      </div>
    </div>
  );
}

/* ───── Step 4: Cleaning & Acknowledgments ───── */

function StepCleaning({ data, update, bedrooms, fee }: { data: WizardData; update: (p: Partial<WizardData>) => void; bedrooms: number | null; fee: number }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Cleaning and acknowledgments</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Let us know if you need a cleaning after your stay.</p>
      </div>

      <div className="flex flex-col gap-3">
        <Label>Should we schedule a cleaning after your stay?</Label>
        {[{ val: false, label: "No, they'll clean it themselves", icon: <Broom size={16} weight="duotone" /> }, { val: true, label: "Yes, schedule a cleaning", icon: <CheckCircle size={16} weight="duotone" /> }].map((opt) => (
          <button key={String(opt.val)} type="button" onClick={() => update({ wantsCleaning: opt.val })} className="flex items-center gap-3 rounded-xl border p-4 text-left transition-colors" style={{ backgroundColor: data.wantsCleaning === opt.val ? "rgba(2, 170, 235, 0.04)" : "var(--color-white)", borderColor: data.wantsCleaning === opt.val ? "var(--color-brand)" : "var(--color-warm-gray-200)" }}>
            <span style={{ color: data.wantsCleaning === opt.val ? "var(--color-brand)" : "var(--color-text-tertiary)" }}>{opt.icon}</span>
            <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{opt.label}</span>
          </button>
        ))}
        {data.wantsCleaning && (
          <div className="flex items-center justify-between rounded-lg border px-4 py-3" style={{ backgroundColor: "var(--color-warm-gray-50)", borderColor: "var(--color-warm-gray-200)" }}>
            <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Cleaning fee ({bedrooms ?? 1}-bedroom)</span>
            <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>${fee}</span>
          </div>
        )}
      </div>

      <label className="flex items-start gap-3 rounded-xl border p-4 cursor-pointer" style={{ borderColor: data.damageAcknowledged ? "var(--color-brand)" : "var(--color-warm-gray-200)", backgroundColor: data.damageAcknowledged ? "rgba(2, 170, 235, 0.04)" : "var(--color-white)" }}>
        <input type="checkbox" checked={data.damageAcknowledged} onChange={(e) => update({ damageAcknowledged: e.target.checked })} className="mt-0.5 h-4 w-4 rounded accent-[var(--color-brand)]" />
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            <ShieldCheck size={14} weight="duotone" className="mr-1 inline-block" style={{ color: "var(--color-brand)" }} />
            Liability for damage acknowledgment
          </p>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            I acknowledge that any damage to or necessary replacements for the property during my or my guests' stay will be my responsibility. I understand that the Owner will be held liable for any costs associated with damage or replacement, and agree to address any issues promptly.
          </p>
        </div>
      </label>
    </div>
  );
}

/* ───── Step 5: Review ───── */

function StepReview({ data, property, ownerName, ownerEmail, nights, fee, error }: { data: WizardData; property: Property | undefined; ownerName: string; ownerEmail: string; nights: number; fee: number; error: string | null }) {
  const stayingName = data.isOwnerStaying ? ownerName : data.guestName;
  const cleaningTotal = data.wantsCleaning ? fee : 0;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Review your request</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Make sure everything looks good before submitting.</p>
      </div>

      <ReviewCard title="Stay details">
        <ReviewRow icon={<House size={14} weight="duotone" />} label={property?.name ?? "Property"} sub={property?.address} />
        <ReviewRow icon={<MapPin size={14} weight="duotone" />} label={`${data.startDate ? fmtDate(data.startDate) : ""} to ${data.endDate ? fmtDate(data.endDate) : ""}`} sub={`${nights} ${nights === 1 ? "night" : "nights"} · Check-in ${data.checkInTime}, Check-out ${data.checkOutTime}`} />
        <ReviewRow icon={<User size={14} weight="duotone" />} label={`${stayingName}${data.adults > 0 ? ` · ${data.adults} adult${data.adults !== 1 ? "s" : ""}` : ""}`} sub={data.reason} />
      </ReviewCard>

      {(data.needsLockCode || data.wantsCleaning) && (
        <ReviewCard title="Extras">
          {data.needsLockCode && <ReviewRow icon={<Lock size={14} weight="duotone" />} label="New lock code requested" sub={data.requestedLockCode || "We will set one for you"} />}
          {data.wantsCleaning && <ReviewRow icon={<Broom size={14} weight="duotone" />} label="Cleaning scheduled" sub={`${property?.bedrooms ?? 1}-bedroom · $${fee}`} />}
        </ReviewCard>
      )}

      <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-warm-gray-200)" }}>
        <div className="flex items-center justify-between text-sm" style={{ color: "var(--color-text-secondary)" }}>
          <span>Stay total</span>
          <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>$0</span>
        </div>
        {data.wantsCleaning && (
          <div className="mt-2 flex items-center justify-between text-sm" style={{ color: "var(--color-text-secondary)" }}>
            <span>Cleaning ({property?.bedrooms ?? 1}-bedroom)</span>
            <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>${fee}</span>
          </div>
        )}
        <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm font-semibold" style={{ borderColor: "var(--color-warm-gray-200)", color: "var(--color-text-primary)" }}>
          <span>Total</span>
          <span>${cleaningTotal}</span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border px-3 py-2.5 text-sm" style={{ backgroundColor: "rgba(220,38,38,0.08)", borderColor: "rgba(220,38,38,0.3)", color: "#b91c1c" }}>{error}</div>
      )}
    </div>
  );
}

/* ───── Success Screen ───── */

function SuccessScreen({ property, data, ownerEmail, nights, fee, onClose }: { property: Property | undefined; data: WizardData; ownerEmail: string; nights: number; fee: number; onClose: () => void }) {
  const recipientEmail = data.isOwnerStaying ? ownerEmail : (data.guestEmail || ownerEmail);
  return (
    <div className="flex flex-col items-center gap-6 py-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: "rgba(22, 163, 74, 0.12)", color: "#15803d" }}><CheckCircle size={28} weight="fill" /></span>
      <div>
        <h2 className="text-xl font-semibold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Request submitted</h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          We will review your block request and confirm by email. A confirmation has been sent to{" "}
          <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>{recipientEmail}</span>.
        </p>
      </div>
      <div className="w-full max-w-sm rounded-xl border p-4 text-left" style={{ borderColor: "var(--color-warm-gray-200)", backgroundColor: "var(--color-warm-gray-50)" }}>
        <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{property?.name}</p>
        <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>{data.startDate ? fmtDate(data.startDate) : ""} to {data.endDate ? fmtDate(data.endDate) : ""} · {nights} {nights === 1 ? "night" : "nights"}</p>
        <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>Total: ${data.wantsCleaning ? fee : 0}</p>
      </div>
      <button type="button" onClick={onClose} className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "var(--color-brand)" }}>Done</button>
    </div>
  );
}

/* ───── Shared UI ───── */

function Label({ children }: { children: ReactNode }) {
  return <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--color-text-tertiary)" }}>{children}</span>;
}

function PillGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button key={opt} type="button" onClick={() => onChange(opt)} className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors" style={{ backgroundColor: value === opt ? "rgba(2, 170, 235, 0.08)" : "var(--color-white)", borderColor: value === opt ? "var(--color-brand)" : "var(--color-warm-gray-200)", color: value === opt ? "var(--color-brand)" : "var(--color-text-primary)" }}>{opt}</button>
      ))}
    </div>
  );
}

function NumberRow({ icon, label, sublabel, value, min, max, onChange }: { icon: ReactNode; label: string; sublabel: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-4 py-3" style={{ borderColor: "var(--color-warm-gray-200)" }}>
      <div className="flex items-center gap-3">
        <span style={{ color: "var(--color-text-secondary)" }}>{icon}</span>
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{label}</p>
          {sublabel && <p className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>{sublabel}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" disabled={value <= min} onClick={() => onChange(value - 1)} className="flex h-7 w-7 items-center justify-center rounded-md border text-sm font-medium transition-colors hover:bg-[var(--color-warm-gray-50)] disabled:opacity-30" style={{ borderColor: "var(--color-warm-gray-200)", color: "var(--color-text-primary)" }}>-</button>
        <span className="w-6 text-center text-sm font-semibold tabular-nums" style={{ color: "var(--color-text-primary)" }}>{value}</span>
        <button type="button" disabled={value >= max} onClick={() => onChange(value + 1)} className="flex h-7 w-7 items-center justify-center rounded-md border text-sm font-medium transition-colors hover:bg-[var(--color-warm-gray-50)] disabled:opacity-30" style={{ borderColor: "var(--color-warm-gray-200)", color: "var(--color-text-primary)" }}>+</button>
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} className="h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2" style={{ backgroundColor: "var(--color-white)", borderColor: "var(--color-warm-gray-200)", color: "var(--color-text-primary)" }} />
    </label>
  );
}

function ReviewCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-warm-gray-200)" }}>
      <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--color-text-tertiary)" }}>{title}</p>
      <div className="mt-3 flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function ReviewRow({ icon, label, sub }: { icon: ReactNode; label: string; sub?: string | null }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>{icon}</span>
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{label}</p>
        {sub && <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{sub}</p>}
      </div>
    </div>
  );
}
