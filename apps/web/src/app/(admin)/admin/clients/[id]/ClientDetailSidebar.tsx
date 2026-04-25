"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useTransition,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import {
  EnvelopeSimple,
  LinkedinLogo,
  InstagramLogo,
  FacebookLogo,
  Phone,
  ChatCentered,
  CheckCircle,
  XCircle,
} from "@phosphor-icons/react";
import { parsePhoneNumber } from "libphonenumber-js";
import type { ClientDetail, AddressComponents } from "@/lib/admin/client-detail";
import type { AdminProfile } from "./client-actions";
import { updateClientFields } from "./client-actions";
import { StagePopover } from "./StagePopover";
import styles from "./ClientDetailSidebar.module.css";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPhone(raw: string | null): string {
  if (!raw) return "";
  try {
    const parsed = parsePhoneNumber(raw, "US");
    if (parsed?.isValid()) return parsed.formatNational();
  } catch {
    // fall through
  }
  return raw;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}

function isoToDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function dateInputToIso(val: string): string | null {
  if (!val) return null;
  return new Date(val + "T00:00:00").toISOString();
}

// ---------------------------------------------------------------------------
// Inline editable field
// ---------------------------------------------------------------------------

type EditableFieldProps = {
  label: string;
  value: string;
  displayValue?: string;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "number";
  min?: number;
  max?: number;
  onSave: (val: string) => Promise<void>;
};

function EditableField({
  label,
  value,
  displayValue,
  placeholder,
  type = "text",
  min,
  max,
  onSave,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing, value]);

  const commit = useCallback(async () => {
    const trimmed = draft.trim();
    if (trimmed === value) {
      setEditing(false);
      return;
    }
    if (type === "email" && trimmed && !trimmed.includes("@")) {
      setDraft(value);
      setEditing(false);
      return;
    }
    if (type === "number" && trimmed !== "") {
      const num = parseFloat(trimmed);
      if (isNaN(num) || (min !== undefined && num < min) || (max !== undefined && num > max)) {
        setDraft(value);
        setEditing(false);
        return;
      }
    }
    setSaving(true);
    await onSave(trimmed);
    setSaving(false);
    setEditing(false);
  }, [draft, value, type, min, max, onSave]);

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); commit(); }
    if (e.key === "Escape") { setDraft(value); setEditing(false); }
  };

  const shown = displayValue ?? value;

  return (
    <div className={styles.fieldRow}>
      <span className={styles.fieldLabel}>{label}</span>
      <div className={styles.fieldValue}>
        {editing ? (
          <input
            ref={inputRef}
            className={`${styles.inlineInput} ${saving ? styles.inlineInputSaving : ""}`}
            type={type}
            value={draft}
            min={min}
            max={max}
            placeholder={placeholder}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKey}
            disabled={saving}
          />
        ) : (
          <button
            className={`${styles.valueBtn} ${!shown ? styles.valueBtnEmpty : ""}`}
            onClick={() => setEditing(true)}
            type="button"
          >
            {shown || placeholder || "—"}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Side-by-side editable field pair
// ---------------------------------------------------------------------------

function EditableFieldPair({
  labelA,
  valueA,
  placeholderA,
  labelB,
  valueB,
  placeholderB,
  onSaveA,
  onSaveB,
}: {
  labelA: string;
  valueA: string;
  placeholderA?: string;
  labelB: string;
  valueB: string;
  placeholderB?: string;
  onSaveA: (val: string) => Promise<void>;
  onSaveB: (val: string) => Promise<void>;
}) {
  return (
    <div className={styles.fieldRowPair}>
      <div className={styles.fieldPairItem}>
        <EditableField
          label={labelA}
          value={valueA}
          placeholder={placeholderA}
          onSave={onSaveA}
        />
      </div>
      <div className={styles.fieldPairItem}>
        <EditableField
          label={labelB}
          value={valueB}
          placeholder={placeholderB}
          onSave={onSaveB}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Date field pair
// ---------------------------------------------------------------------------

function DateFieldPair({
  labelA,
  isoA,
  labelB,
  isoB,
  onSaveA,
  onSaveB,
}: {
  labelA: string;
  isoA: string | null;
  labelB: string;
  isoB: string | null;
  onSaveA: (iso: string | null) => Promise<void>;
  onSaveB: (iso: string | null) => Promise<void>;
}) {
  const [editingA, setEditingA] = useState(false);
  const [editingB, setEditingB] = useState(false);
  const [draftA, setDraftA] = useState(isoToDateInput(isoA));
  const [draftB, setDraftB] = useState(isoToDateInput(isoB));
  const [, startTransition] = useTransition();

  const commitA = () => {
    setEditingA(false);
    const newIso = dateInputToIso(draftA);
    if (newIso !== isoA) {
      startTransition(async () => { await onSaveA(newIso); });
    }
  };

  const commitB = () => {
    setEditingB(false);
    const newIso = dateInputToIso(draftB);
    if (newIso !== isoB) {
      startTransition(async () => { await onSaveB(newIso); });
    }
  };

  return (
    <div className={styles.fieldRowPair}>
      <div className={styles.fieldPairItem}>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>{labelA}</span>
          <div className={styles.fieldValue}>
            {editingA ? (
              <div className={styles.dateInputWrapper}>
                <input
                  className={styles.dateInput}
                  type="date"
                  value={draftA}
                  onChange={(e) => setDraftA(e.target.value)}
                  onBlur={commitA}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitA();
                    if (e.key === "Escape") { setDraftA(isoToDateInput(isoA)); setEditingA(false); }
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <button
                className={`${styles.valueBtn} ${!isoA ? styles.valueBtnEmpty : ""}`}
                onClick={() => setEditingA(true)}
                type="button"
              >
                {formatDate(isoA) || "—"}
              </button>
            )}
          </div>
        </div>
      </div>
      <div className={styles.fieldPairItem}>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>{labelB}</span>
          <div className={styles.fieldValue}>
            {editingB ? (
              <div className={styles.dateInputWrapper}>
                <input
                  className={styles.dateInput}
                  type="date"
                  value={draftB}
                  onChange={(e) => setDraftB(e.target.value)}
                  onBlur={commitB}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitB();
                    if (e.key === "Escape") { setDraftB(isoToDateInput(isoB)); setEditingB(false); }
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <button
                className={`${styles.valueBtn} ${!isoB ? styles.valueBtnEmpty : ""}`}
                onClick={() => setEditingB(true)}
                type="button"
              >
                {formatDate(isoB) || "—"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Address field with Google Places autocomplete
// ---------------------------------------------------------------------------

type PlacePrediction = {
  place_id: string;
  description: string;
};

function AddressField({
  value,
  onSave,
}: {
  value: string | null;
  onSave: (formatted: string, components: AddressComponents) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState(value ?? "");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setQuery(value ?? "");
      setPredictions([]);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing, value]);

  // Close on outside click
  useEffect(() => {
    if (!editing) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setEditing(false);
        setQuery(value ?? "");
        setPredictions([]);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [editing, value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) { setPredictions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(q)}`);
        const json = await res.json() as { predictions?: PlacePrediction[] };
        setPredictions(json.predictions ?? []);
      } catch {
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const selectPrediction = async (pred: PlacePrediction) => {
    setPredictions([]);
    setQuery(pred.description);
    try {
      const res = await fetch(`/api/places/details?place_id=${encodeURIComponent(pred.place_id)}`);
      const json = await res.json() as {
        result?: {
          formatted_address?: string;
          address_components?: Array<{ types: string[]; long_name: string; short_name: string }>;
        };
      };
      if (json.result) {
        const formatted = json.result.formatted_address ?? pred.description;
        const components: AddressComponents = {};
        for (const c of json.result.address_components ?? []) {
          if (c.types.includes("street_number")) components.street_number = c.long_name;
          if (c.types.includes("route")) components.route = c.long_name;
          if (c.types.includes("locality")) components.locality = c.long_name;
          if (c.types.includes("administrative_area_level_1")) components.administrative_area_level_1 = c.short_name;
          if (c.types.includes("postal_code")) components.postal_code = c.long_name;
          if (c.types.includes("country")) components.country = c.short_name;
        }
        await onSave(formatted, components);
        setQuery(formatted);
      }
    } catch {
      // keep whatever was typed
    }
    setEditing(false);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setEditing(false);
      setQuery(value ?? "");
      setPredictions([]);
    }
  };

  return (
    <div className={styles.fieldRow} ref={containerRef}>
      <span className={styles.fieldLabel}>Address</span>
      <div className={`${styles.fieldValue} ${styles.fieldValueAddress}`}>
        {editing ? (
          <div className={styles.addressInputWrap}>
            <input
              ref={inputRef}
              className={styles.inlineInput}
              type="text"
              value={query}
              onChange={handleChange}
              onKeyDown={handleKey}
              placeholder="Search address…"
              autoComplete="off"
            />
            {(predictions.length > 0 || loading) && (
              <div className={styles.predictionDropdown}>
                {loading && predictions.length === 0 && (
                  <div className={styles.predictionLoading}>Searching…</div>
                )}
                {predictions.map((p) => (
                  <button
                    key={p.place_id}
                    type="button"
                    className={styles.predictionItem}
                    onMouseDown={() => selectPrediction(p)}
                  >
                    {p.description}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button
            className={`${styles.valueBtn} ${!value ? styles.valueBtnEmpty : ""} ${styles.valueBtnAddress}`}
            onClick={() => setEditing(true)}
            type="button"
          >
            {value || "—"}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Social icons row
// ---------------------------------------------------------------------------

type SocialKey = "linkedin" | "instagram" | "facebook";

const SOCIAL_CONFIG: {
  key: SocialKey;
  Icon: React.ComponentType<{ size?: number; weight?: "regular" | "fill" | "bold" | "duotone" | "light" | "thin"; className?: string }>;
  label: string;
  prefix: string;
}[] = [
  { key: "linkedin",  Icon: LinkedinLogo,   label: "LinkedIn",  prefix: "https://linkedin.com/in/" },
  { key: "instagram", Icon: InstagramLogo,  label: "Instagram", prefix: "https://instagram.com/"   },
  { key: "facebook",  Icon: FacebookLogo,   label: "Facebook",  prefix: "https://facebook.com/"    },
];

function SocialRow({
  social,
  onSave,
}: {
  social: { linkedin?: string | null; instagram?: string | null; facebook?: string | null };
  onSave: (key: SocialKey, url: string | null) => Promise<void>;
}) {
  const [editingKey, setEditingKey] = useState<SocialKey | null>(null);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const openEdit = (key: SocialKey) => {
    setEditingKey(key);
    setDraft(social[key] ?? "");
  };

  useEffect(() => {
    if (editingKey) inputRef.current?.focus();
  }, [editingKey]);

  const commit = async () => {
    if (!editingKey) return;
    const trimmed = draft.trim() || null;
    await onSave(editingKey, trimmed);
    setEditingKey(null);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); commit(); }
    if (e.key === "Escape") { setEditingKey(null); }
  };

  return (
    <div className={styles.fieldRow}>
      <span className={styles.fieldLabel}>Social</span>
      <div className={styles.socialIcons}>
        {SOCIAL_CONFIG.map(({ key, Icon, label }) => {
          const url = social[key];
          const hasUrl = !!url;
          return (
            <button
              key={key}
              type="button"
              aria-label={label}
              className={`${styles.socialBtn} ${hasUrl ? styles.socialBtnActive : styles.socialBtnEmpty}`}
              onClick={() => {
                if (hasUrl) {
                  window.open(url!, "_blank", "noopener,noreferrer");
                } else {
                  openEdit(key);
                }
              }}
              onContextMenu={(e) => { e.preventDefault(); openEdit(key); }}
              title={hasUrl ? `Open ${label}` : `Add ${label} URL (right-click to edit)`}
            >
              <Icon size={18} weight={hasUrl ? "fill" : "regular"} />
            </button>
          );
        })}
      </div>
      {editingKey && (
        <div className={styles.socialEditRow}>
          <input
            ref={inputRef}
            className={styles.inlineInput}
            type="url"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKey}
            placeholder={`Paste ${editingKey} URL…`}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Assigned-to dropdown
// ---------------------------------------------------------------------------

function AssignedField({
  value,
  profiles,
  onSave,
}: {
  value: string | null;
  profiles: AdminProfile[];
  onSave: (id: string | null) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();

  const current = profiles.find((p) => p.id === value);

  const select = (id: string | null) => {
    setEditing(false);
    if (id !== value) {
      startTransition(async () => { await onSave(id); });
    }
  };

  return (
    <div className={styles.fieldRow}>
      <span className={styles.fieldLabel}>Assigned</span>
      <div className={styles.fieldValue}>
        {editing ? (
          <div className={styles.assignedDropdown}>
            <button
              type="button"
              className={`${styles.assignedOption} ${!value ? styles.assignedOptionActive : ""}`}
              onMouseDown={() => select(null)}
            >
              Unassigned
            </button>
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`${styles.assignedOption} ${p.id === value ? styles.assignedOptionActive : ""}`}
                onMouseDown={() => select(p.id)}
              >
                {p.fullName}
              </button>
            ))}
          </div>
        ) : (
          <button
            className={`${styles.valueBtn} ${!current ? styles.valueBtnEmpty : ""}`}
            onClick={() => setEditing(true)}
            type="button"
          >
            {current?.fullName ?? "Unassigned"}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preferred contact method toggle
// ---------------------------------------------------------------------------

type ContactMethod = "email" | "phone" | "text";

const CONTACT_METHODS: { key: ContactMethod; Icon: React.ComponentType<{ size?: number; weight?: "regular" | "fill" | "bold" | "duotone" | "light" | "thin" }>; label: string }[] = [
  { key: "email", Icon: EnvelopeSimple, label: "Email" },
  { key: "phone", Icon: Phone,          label: "Phone" },
  { key: "text",  Icon: ChatCentered,   label: "Text"  },
];

// ---------------------------------------------------------------------------
// Section divider
// ---------------------------------------------------------------------------

function SectionHeader({ label }: { label: string }) {
  return <div className={styles.sectionHeader}>{label}</div>;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ClientDetailSidebar({
  client,
  adminProfiles,
}: {
  client: ClientDetail;
  adminProfiles: AdminProfile[];
}) {
  // Local optimistic copies of mutable fields
  const [firstName,   setFirstName]   = useState(client.firstName   ?? "");
  const [lastName,    setLastName]     = useState(client.lastName    ?? "");
  const [email,       setEmail]        = useState(client.email       ?? "");
  const [phone,       setPhone]        = useState(client.phone       ?? "");
  const [company,     setCompany]      = useState(client.companyName ?? "");
  const source = client.source ?? "";
  const [addressFmt,  setAddressFmt]   = useState(client.addressFormatted ?? null);
  const [social,      setSocial]       = useState(client.social);
  const [assignedTo,  setAssignedTo]   = useState(client.assignedTo);
  const [contactMethod, setContactMethod] = useState(client.preferredContactMethod);
  const [contractStart, setContractStart] = useState(client.contractStartAt);
  const [contractEnd,   setContractEnd]   = useState(client.contractEndAt);
  const [feePercent,    setFeePercent]    = useState(
    client.managementFeePercent !== null ? String(client.managementFeePercent) : ""
  );
  const [propsOwned,    setPropsOwned]    = useState(
    client.totalPropertiesOwned !== null ? String(client.totalPropertiesOwned) : ""
  );
  const [newsletter,    setNewsletter]    = useState(client.newsletterSubscribed);

  async function save(fields: Parameters<typeof updateClientFields>[1]) {
    await updateClientFields(client.id, fields);
  }

  // ── Contact saves ──────────────────────────────────────────────────────
  const saveFirstName = async (val: string) => {
    setFirstName(val);
    await save({ firstName: val, lastName });
  };
  const saveLastName = async (val: string) => {
    setLastName(val);
    await save({ firstName, lastName: val });
  };
  const saveEmail = async (val: string) => {
    setEmail(val);
    await save({ email: val });
  };
  const savePhone = async (val: string) => {
    setPhone(val);
    await save({ phone: val });
  };
  const saveCompany = async (val: string) => {
    setCompany(val);
    await save({ companyName: val });
  };
  const saveAddress = async (formatted: string, components: AddressComponents) => {
    setAddressFmt(formatted);
    await save({ addressFormatted: formatted, addressComponents: components });
  };
  const saveSocial = async (key: SocialKey, url: string | null) => {
    const updated = { ...social, [key]: url };
    setSocial(updated);
    await save({ social: updated });
  };

  // ── Pipeline saves ──────────────────────────────────────────────────────
  // source is display-only — updating it is not yet supported by the server action
  const saveAssigned = async (id: string | null) => {
    setAssignedTo(id);
    await save({ assignedTo: id });
  };

  // ── Contract saves ──────────────────────────────────────────────────────
  const saveContractStart = async (iso: string | null) => {
    setContractStart(iso);
    await save({ contractStartAt: iso });
  };
  const saveContractEnd = async (iso: string | null) => {
    setContractEnd(iso);
    await save({ contractEndAt: iso });
  };
  const saveFeePercent = async (val: string) => {
    const num = val === "" ? null : parseFloat(val);
    setFeePercent(val);
    await save({ managementFeePercent: num });
  };

  // ── Owner saves ─────────────────────────────────────────────────────────
  const saveContactMethod = async (method: ContactMethod) => {
    const next = contactMethod === method ? null : method;
    setContactMethod(next);
    await save({ preferredContactMethod: next });
  };
  const savePropsOwned = async (val: string) => {
    const num = val === "" ? null : parseInt(val, 10);
    setPropsOwned(val);
    await save({ totalPropertiesOwned: num });
  };
  const saveNewsletter = async () => {
    const next = !newsletter;
    setNewsletter(next);
    await save({ newsletterSubscribed: next });
  };

  const hasPortal = client.profileId !== null;

  return (
    <aside className={styles.sidebar}>

      {/* ── Contact ─────────────────────────────────────────────────────── */}
      <SectionHeader label="Contact" />

      <EditableFieldPair
        labelA="First"
        valueA={firstName}
        placeholderA="First name"
        labelB="Last"
        valueB={lastName}
        placeholderB="Last name"
        onSaveA={saveFirstName}
        onSaveB={saveLastName}
      />

      <EditableField
        label="Email"
        value={email}
        type="email"
        placeholder="email@example.com"
        onSave={saveEmail}
      />

      <EditableField
        label="Phone"
        value={phone}
        displayValue={formatPhone(phone)}
        type="tel"
        placeholder="+1 (555) 000-0000"
        onSave={savePhone}
      />

      <EditableField
        label="Company"
        value={company}
        placeholder="Company name"
        onSave={saveCompany}
      />

      <AddressField value={addressFmt} onSave={saveAddress} />

      <SocialRow social={social} onSave={saveSocial} />

      <div className={styles.divider} />

      {/* ── Pipeline ────────────────────────────────────────────────────── */}
      <SectionHeader label="Pipeline" />

      <div className={styles.fieldRow}>
        <span className={styles.fieldLabel}>Stage</span>
        <div className={styles.fieldValue}>
          <StagePopover contactId={client.id} stage={client.lifecycleStage} />
        </div>
      </div>

      <div className={styles.fieldRowPair}>
        <div className={styles.fieldPairItem}>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Source</span>
            <div className={styles.fieldValue}>
              <span className={`${styles.readonlyValue} ${!source ? styles.valueBtnEmpty : ""}`}>
                {source || "—"}
              </span>
            </div>
          </div>
        </div>
        <div className={styles.fieldPairItem}>
          <AssignedField
            value={assignedTo}
            profiles={adminProfiles}
            onSave={saveAssigned}
          />
        </div>
      </div>

      <div className={styles.divider} />

      {/* ── Contract ────────────────────────────────────────────────────── */}
      <SectionHeader label="Contract" />

      <DateFieldPair
        labelA="Start"
        isoA={contractStart}
        labelB="End"
        isoB={contractEnd}
        onSaveA={saveContractStart}
        onSaveB={saveContractEnd}
      />

      <EditableField
        label="Mgmt fee"
        value={feePercent}
        displayValue={feePercent ? `${feePercent}%` : ""}
        type="number"
        min={0}
        max={100}
        placeholder="0%"
        onSave={saveFeePercent}
      />

      <div className={styles.divider} />

      {/* ── Owner ───────────────────────────────────────────────────────── */}
      <SectionHeader label="Owner" />

      {/* Preferred contact method */}
      <div className={styles.fieldRow}>
        <span className={styles.fieldLabel}>Prefers</span>
        <div className={styles.contactMethodRow}>
          {CONTACT_METHODS.map(({ key, Icon, label }) => (
            <button
              key={key}
              type="button"
              aria-label={label}
              aria-pressed={contactMethod === key}
              className={`${styles.methodBtn} ${contactMethod === key ? styles.methodBtnActive : ""}`}
              onClick={() => saveContactMethod(key)}
              title={label}
            >
              <Icon size={15} weight={contactMethod === key ? "fill" : "regular"} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Properties owned */}
      <div className={styles.fieldRowPair}>
        <div className={styles.fieldPairItem}>
          <EditableField
            label="Owned"
            value={propsOwned}
            displayValue={propsOwned ? `${propsOwned} owned` : ""}
            type="number"
            min={0}
            placeholder="0"
            onSave={savePropsOwned}
          />
        </div>
        <div className={styles.fieldPairItem}>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Managed</span>
            <div className={styles.fieldValue}>
              <span className={styles.readonlyValue}>
                {client.properties.length} w/ Parcel
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Portal access + newsletter */}
      <div className={styles.fieldRowPair}>
        <div className={styles.fieldPairItem}>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Portal</span>
            <div className={styles.fieldValue}>
              <span className={`${styles.portalStatus} ${hasPortal ? styles.portalStatusActive : styles.portalStatusNone}`}>
                {hasPortal ? (
                  <><CheckCircle size={13} weight="fill" /> Has access</>
                ) : (
                  <><XCircle size={13} weight="regular" /> No access</>
                )}
              </span>
            </div>
          </div>
        </div>
        <div className={styles.fieldPairItem}>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Newsletter</span>
            <div className={styles.fieldValue}>
              <button
                type="button"
                className={`${styles.newsletterToggle} ${newsletter ? styles.newsletterToggleOn : ""}`}
                onClick={saveNewsletter}
                aria-pressed={newsletter}
                aria-label="Toggle newsletter subscription"
              >
                {newsletter ? "Subscribed" : "Off"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.divider} />

      {/* ── Meta ────────────────────────────────────────────────────────── */}
      <div className={styles.metaRow}>
        <span className={styles.metaLabel}>Added</span>
        <span className={styles.metaValue}>
          {new Date(client.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>

    </aside>
  );
}
