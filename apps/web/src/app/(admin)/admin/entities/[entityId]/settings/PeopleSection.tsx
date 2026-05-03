"use client";

import { useState, useTransition } from "react";
import { UserPlus, Trash } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import s from "./PersonalInfoSection.module.css";
import x from "./SettingsShared.module.css";
import type { EntityMember } from "@/lib/admin/entity-contact-detail";
import { addPersonToEntity, removePersonFromEntity } from "@/app/(admin)/admin/entities/[entityId]/entity-person-actions";
import ConfirmModal from "@/components/admin/ConfirmModal";

type Props = {
  entityId: string;
  members: EntityMember[];
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

const EMPTY_FORM: FormState = { firstName: "", lastName: "", email: "", phone: "" };

export function PeopleSection({ entityId, members }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [addPending, startAddTransition] = useTransition();
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [removePending, startRemoveTransition] = useTransition();
  const [removeError, setRemoveError] = useState<string | null>(null);

  function handleAdd() {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setFormError("First and last name are required.");
      return;
    }
    setFormError(null);
    startAddTransition(async () => {
      const result = await addPersonToEntity(entityId, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
      });
      if (result.ok) {
        setForm(EMPTY_FORM);
        setShowForm(false);
        router.refresh();
      } else {
        setFormError(result.error);
      }
    });
  }

  function handleRemoveConfirm() {
    if (!confirmRemoveId) return;
    setRemoveError(null);
    startRemoveTransition(async () => {
      const result = await removePersonFromEntity(confirmRemoveId, entityId);
      setConfirmRemoveId(null);
      if (result.ok) {
        router.refresh();
      } else {
        setRemoveError(result.error);
      }
    });
  }

  const confirmTarget = members.find((m) => m.id === confirmRemoveId);

  return (
    <div>
      <header className={s.sectionHeader}>
        <h2 className={s.sectionTitle}>People</h2>
        <p className={s.sectionSubtitle}>
          People linked to this entity. Each person gets their own portal access and communication thread.
        </p>
      </header>

      <section className={s.card}>
        <div className={s.cardHeader}>
          <span className={s.cardHeaderTitle}>Members</span>
          <span className={s.adminPill}>Admin only</span>
        </div>
        <div className={s.cardBody}>
          {removeError && <p className={x.errorMsg} style={{ marginBottom: "8px" }}>{removeError}</p>}

          {members.map((m, index) => (
            <div
              key={m.id}
              className={s.row}
              style={index < members.length - 1 ? { borderBottom: "1px solid var(--color-warm-gray-100)", paddingBottom: "10px", marginBottom: "10px" } : undefined}
            >
              <div className={s.labelCell}>
                <span className={s.label}>{m.fullName}</span>
                {index === 0 && <span className={s.labelHint}>Primary</span>}
              </div>
              <div className={s.fieldCell}>
                <span className={x.metaValue}>{m.email ?? "No email"}</span>
              </div>
              {members.length > 1 && (
                <div style={{ flex: "0 0 auto", display: "flex", alignItems: "center" }}>
                  <button
                    type="button"
                    className={x.dangerLink}
                    onClick={() => setConfirmRemoveId(m.id)}
                    disabled={removePending}
                    aria-label={`Remove ${m.fullName}`}
                  >
                    <Trash size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}

          {!showForm && (
            <div className={s.row} style={{ marginTop: "8px" }}>
              <button
                type="button"
                className={x.addLink}
                onClick={() => setShowForm(true)}
              >
                <UserPlus size={14} />
                Add person
              </button>
            </div>
          )}

          {showForm && (
            <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <div className={s.fieldCell}>
                  <label className={s.label}>First name</label>
                  <input
                    className={s.input}
                    value={form.firstName}
                    onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                    placeholder="Jane"
                    autoFocus
                  />
                </div>
                <div className={s.fieldCell}>
                  <label className={s.label}>Last name</label>
                  <input
                    className={s.input}
                    value={form.lastName}
                    onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                    placeholder="Smith"
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <div className={s.fieldCell}>
                  <label className={s.label}>Email (optional)</label>
                  <input
                    className={s.input}
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="jane@example.com"
                  />
                </div>
                <div className={s.fieldCell}>
                  <label className={s.label}>Phone (optional)</label>
                  <input
                    className={s.input}
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+1 555 000 0000"
                  />
                </div>
              </div>
              {formError && <p className={x.errorMsg}>{formError}</p>}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className={x.primaryBtn}
                  onClick={handleAdd}
                  disabled={addPending}
                >
                  {addPending ? "Adding…" : "Add person"}
                </button>
                <button
                  type="button"
                  className={x.secondaryBtn}
                  onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError(null); }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <ConfirmModal
        open={!!confirmRemoveId}
        title="Remove person"
        description={`Remove ${confirmTarget?.fullName ?? "this person"} from the entity? They will be moved to their own standalone record.`}
        variant="danger"
        confirmLabel="Remove"
        onConfirm={handleRemoveConfirm}
        onCancel={() => setConfirmRemoveId(null)}
      />
    </div>
  );
}
