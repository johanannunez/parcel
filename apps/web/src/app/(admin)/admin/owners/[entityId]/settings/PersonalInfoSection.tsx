"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { z } from "zod";
import {
  updatePersonalInfo,
  type PersonalInfoInput,
} from "@/lib/admin/personal-info-actions";
import { saveInternalNote } from "@/lib/admin/owner-facts-actions";
import styles from "./PersonalInfoSection.module.css";

type ContactMethod = "email" | "sms" | "either";
type StoredContactMethod = "email" | "sms" | "phone" | "whatsapp" | null;

export type PersonalInfoSectionProps = {
  profile: {
    id: string;
    fullName: string;
    preferredName: string | null;
    email: string;
    phone: string | null;
    contactMethod: StoredContactMethod;
    avatarUrl: string | null;
  };
  internalNote: {
    text: string;
    updatedAt: string;
    createdByName: string | null;
  } | null;
  gradient: string;
};

/** Split "Johan Nunez" into { first: "Johan", last: "Nunez" }. */
function splitName(full: string): { first: string; last: string } {
  const trimmed = (full ?? "").trim();
  if (trimmed === "") return { first: "", last: "" };
  const idx = trimmed.indexOf(" ");
  if (idx === -1) return { first: trimmed, last: "" };
  return {
    first: trimmed.slice(0, idx),
    last: trimmed.slice(idx + 1).trim(),
  };
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function storedToUi(stored: StoredContactMethod): ContactMethod {
  if (stored === "sms") return "sms";
  if (stored === "email") return "email";
  return "either";
}

function uiToStored(ui: ContactMethod): "email" | "sms" | "phone" {
  if (ui === "email") return "email";
  if (ui === "sms") return "sms";
  return "phone";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const FormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim(),
  preferredName: z.string().trim(),
  phone: z.string().trim(),
});

export function PersonalInfoSection({
  profile,
  internalNote,
  gradient,
}: PersonalInfoSectionProps) {
  const seeded = useMemo(() => splitName(profile.fullName), [profile.fullName]);

  const [firstName, setFirstName] = useState(seeded.first);
  const [lastName, setLastName] = useState(seeded.last);
  const [preferredName, setPreferredName] = useState(
    profile.preferredName ?? "",
  );
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [contact, setContact] = useState<ContactMethod>(
    storedToUi(profile.contactMethod),
  );

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const [noteText, setNoteText] = useState(internalNote?.text ?? "");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [noteSuccess, setNoteSuccess] = useState(false);
  const [notePending, startNoteTransition] = useTransition();

  const initialSnapshot = useMemo(
    () => ({
      firstName: seeded.first,
      lastName: seeded.last,
      preferredName: profile.preferredName ?? "",
      phone: profile.phone ?? "",
      contact: storedToUi(profile.contactMethod),
    }),
    [profile, seeded.first, seeded.last],
  );

  function resetForm() {
    setFirstName(initialSnapshot.firstName);
    setLastName(initialSnapshot.lastName);
    setPreferredName(initialSnapshot.preferredName);
    setPhone(initialSnapshot.phone);
    setContact(initialSnapshot.contact);
    setFormError(null);
    setFormSuccess(false);
  }

  function onSave() {
    setFormError(null);
    setFormSuccess(false);

    const parsed = FormSchema.safeParse({
      firstName,
      lastName,
      preferredName,
      phone,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Check the fields.");
      return;
    }

    const payload: PersonalInfoInput = {
      profileId: profile.id,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      preferredName: parsed.data.preferredName,
      phone: parsed.data.phone,
      contactMethod: uiToStored(contact),
    };

    startTransition(async () => {
      const result = await updatePersonalInfo(payload);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setFormSuccess(true);
    });
  }

  function onSaveNote() {
    setNoteError(null);
    setNoteSuccess(false);

    startNoteTransition(async () => {
      const result = await saveInternalNote(profile.id, noteText);
      if (!result.ok) {
        setNoteError(result.error);
        return;
      }
      setNoteSuccess(true);
    });
  }

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Personal info</h2>
        <p className={styles.sectionSubtitle}>
          Name, photo, and how we reach the owner.
        </p>
      </div>

      {/* --- Main info card --- */}
      <div className={styles.card}>
        <div className={styles.cardBody}>
          {formError ? (
            <div className={styles.inlineError} role="alert">
              {formError}
            </div>
          ) : null}
          {formSuccess ? (
            <div className={styles.inlineSuccess} role="status">
              Personal info saved.
            </div>
          ) : null}

          {/* Avatar row */}
          <div className={styles.row}>
            <div className={styles.labelCell}>
              <span className={styles.label}>Profile photo</span>
              <span className={styles.labelHint}>
                Shown to the team and on the owner portal.
              </span>
            </div>
            <div className={styles.fieldCell}>
              <div className={styles.avatarRow}>
                <div
                  className={styles.avatar}
                  style={{ background: gradient }}
                  aria-hidden
                >
                  {profile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatarUrl} alt="" />
                  ) : (
                    initials(profile.fullName || profile.email)
                  )}
                </div>
                <div className={styles.avatarActions}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    disabled
                    title="Upload coming with admin avatar flow"
                  >
                    Upload photo
                  </button>
                  <button
                    type="button"
                    className={styles.btnGhost}
                    disabled
                    title="Upload coming with admin avatar flow"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Legal name */}
          <div className={styles.row}>
            <div className={styles.labelCell}>
              <span className={styles.label}>Legal name</span>
              <span className={styles.labelHint}>
                Must match the name on tax documents.
              </span>
            </div>
            <div className={styles.fieldCell}>
              <div className={styles.inputRow}>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                />
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                />
              </div>
            </div>
          </div>

          {/* Preferred name */}
          <div className={styles.row}>
            <div className={styles.labelCell}>
              <span className={styles.label}>Preferred name</span>
              <span className={styles.labelHint}>
                What to call them day to day. Optional.
              </span>
            </div>
            <div className={styles.fieldCell}>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. Jo"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
              />
            </div>
          </div>

          {/* Email */}
          <div className={styles.row}>
            <div className={styles.labelCell}>
              <span className={styles.label}>Email</span>
              <span className={styles.labelHint}>
                Read-only. Changing requires verification flow.
              </span>
            </div>
            <div className={styles.fieldCell}>
              <div className={styles.emailWrap}>
                <input
                  type="email"
                  className={styles.input}
                  value={profile.email}
                  readOnly
                  disabled
                />
                <span className={styles.verifiedPill} aria-label="Verified">
                  <CheckCircle size={12} weight="fill" />
                  Verified
                </span>
              </div>
            </div>
          </div>

          {/* Phone */}
          <div className={styles.row}>
            <div className={styles.labelCell}>
              <span className={styles.label}>Phone</span>
              <span className={styles.labelHint}>
                Used for SMS alerts and urgent calls.
              </span>
            </div>
            <div className={styles.fieldCell}>
              <input
                type="tel"
                className={styles.input}
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Preferred contact */}
          <div className={styles.row}>
            <div className={styles.labelCell}>
              <span className={styles.label}>Preferred contact</span>
              <span className={styles.labelHint}>
                How the owner wants to hear from us.
              </span>
            </div>
            <div className={styles.fieldCell}>
              <div
                className={styles.segmented}
                role="radiogroup"
                aria-label="Preferred contact method"
              >
                {(["email", "sms", "either"] as const).map((key) => {
                  const label =
                    key === "email" ? "Email" : key === "sms" ? "SMS" : "Either";
                  const isActive = contact === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      className={`${styles.segmentedBtn} ${
                        isActive ? styles.segmentedBtnActive : ""
                      }`}
                      onClick={() => setContact(key)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.cardFooter}>
          <span className={styles.cardFooterHint}>Last updated recently</span>
          <div className={styles.cardFooterActions}>
            <button
              type="button"
              className={styles.btnGhost}
              onClick={resetForm}
              disabled={pending}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={onSave}
              disabled={pending}
            >
              {pending ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </div>

      {/* --- Internal notes card --- */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardHeaderTitle}>Internal notes</span>
          <span className={styles.adminPill}>Admin only</span>
        </div>
        <div className={styles.cardHeaderSub}>
          Private notes about this owner. Not visible in their portal.
        </div>
        <div className={styles.cardBody}>
          {noteError ? (
            <div className={styles.inlineError} role="alert">
              {noteError}
            </div>
          ) : null}
          {noteSuccess ? (
            <div className={styles.inlineSuccess} role="status">
              Note saved.
            </div>
          ) : null}
          <textarea
            className={styles.textarea}
            placeholder="Anything the team should know. Preferences, quirks, background, relationship history."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={5}
          />
        </div>
        <div className={styles.cardFooter}>
          <span className={styles.cardFooterHint}>
            Only admins can see this field.
            {internalNote?.createdByName
              ? ` Last saved by ${internalNote.createdByName}.`
              : ""}
          </span>
          <div className={styles.cardFooterActions}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={onSaveNote}
              disabled={notePending}
            >
              {notePending ? "Saving..." : "Save note"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
