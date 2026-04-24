"use client";

import { useState, useTransition } from "react";
import { X } from "@phosphor-icons/react";
import { CustomSelect } from "@/components/admin/CustomSelect";
import type { SelectOption } from "@/components/admin/CustomSelect";
import type { ClientDetail } from "@/lib/admin/client-detail";
import { updateClientFields } from "./client-actions";
import styles from "./ClientEditDrawer.module.css";

const STAGE_OPTIONS: SelectOption[] = [
  { value: "lead_new",      label: "New Lead"      },
  { value: "qualified",     label: "Qualified"     },
  { value: "in_discussion", label: "In Discussion" },
  { value: "contract_sent", label: "Contract Sent" },
  { value: "onboarding",    label: "Onboarding"    },
  { value: "active_owner",  label: "Active Owner"  },
  { value: "offboarding",   label: "Offboarding"   },
  { value: "lead_cold",     label: "Cold Lead"     },
  { value: "paused",        label: "Paused"        },
  { value: "churned",       label: "Churned"       },
];

export function ClientEditDrawer({
  client,
  open,
  onClose,
}: {
  client: ClientDetail;
  open: boolean;
  onClose: () => void;
}) {
  const [fullName, setFullName] = useState(client.fullName);
  const [email, setEmail] = useState(client.email ?? "");
  const [phone, setPhone] = useState(client.phone ?? "");
  const [company, setCompany] = useState(client.companyName ?? "");
  const [mrr, setMrr] = useState(client.estimatedMrr?.toString() ?? "");
  const [stage, setStage] = useState(client.lifecycleStage);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateClientFields(client.id, {
        fullName: fullName.trim() || client.fullName,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        companyName: company.trim() || undefined,
        estimatedMrr: mrr ? parseFloat(mrr) : null,
        lifecycleStage: stage,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onClose();
    });
  }

  return (
    <>
      <div
        className={open ? `${styles.backdrop} ${styles.backdropOpen}` : styles.backdrop}
        onClick={onClose}
      />
      <aside className={open ? `${styles.drawer} ${styles.drawerOpen}` : styles.drawer}>
        <header className={styles.drawerHeader}>
          <h2 className={styles.drawerTitle}>Edit Client</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className={styles.drawerBody}>
          <div className={styles.field}>
            <label className={styles.label}>Full Name</label>
            <input
              className={styles.input}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Phone</label>
            <input
              className={styles.input}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Company</label>
            <input
              className={styles.input}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Estimated MRR ($)</label>
            <input
              className={styles.input}
              type="number"
              min="0"
              value={mrr}
              onChange={(e) => setMrr(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Stage</label>
            <CustomSelect
              value={stage}
              onChange={(val) => setStage(val as typeof stage)}
              options={STAGE_OPTIONS}
            />
          </div>

          {error ? <p className={styles.errorMsg}>{error}</p> : null}
        </div>

        <footer className={styles.drawerFooter}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={isPending}>
            Cancel
          </button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </footer>
      </aside>
    </>
  );
}
