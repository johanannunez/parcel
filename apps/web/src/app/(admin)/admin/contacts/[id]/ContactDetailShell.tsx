'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import type { ContactDetail } from '@/lib/admin/contact-detail';
import type { RailEvent } from '@/lib/admin/detail-rail';
import type { LifecycleStage } from '@/lib/admin/contact-types';
import { stageLabel, stageGroup } from '@/lib/admin/lifecycle-stage';
import { DetailRightRail } from '@/components/admin/detail/DetailRightRail';
import {
  updateContactField,
  updateContactStage,
  type UpdatableContactField,
} from '@/lib/admin/contact-actions';
import styles from './ContactDetailShell.module.css';

const STAGES: LifecycleStage[] = [
  'lead_new',
  'qualified',
  'in_discussion',
  'contract_sent',
  'onboarding',
  'active_owner',
  'lead_cold',
  'paused',
  'churned',
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400_000));
}

export function ContactDetailShell({
  contact,
  activity,
  sources,
}: {
  contact: ContactDetail;
  activity: RailEvent[];
  sources: Array<{ slug: string; label: string }>;
}) {
  const [isPending, startTransition] = useTransition();
  const group = stageGroup(contact.lifecycleStage);

  function handleStage(next: LifecycleStage) {
    startTransition(async () => {
      await updateContactStage(contact.id, next);
    });
  }

  function handleField(field: UpdatableContactField, next: string) {
    startTransition(async () => {
      await updateContactField(contact.id, field, next);
    });
  }

  const metadata = [
    { label: 'Source', value: contact.source ?? 'Unknown' },
    {
      label: 'Assigned to',
      value: contact.assignedToName ?? 'Unassigned',
    },
    {
      label: 'MRR',
      value:
        contact.estimatedMrr != null
          ? `$${contact.estimatedMrr.toLocaleString()} /mo`
          : 'Not set',
    },
    {
      label: 'In stage',
      value: `${daysSince(contact.stageChangedAt)}d`,
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumbs}>
        <Link href="/admin/contacts" className={styles.crumb}>
          Contacts
        </Link>
        <span className={styles.crumbSep}>/</span>
        <span className={styles.crumbCurrent}>{contact.fullName}</span>
      </div>

      <div className={styles.grid}>
        <section className={styles.main}>
          <header className={styles.header}>
            <div className={styles.avatar} aria-hidden>
              {initials(contact.fullName)}
            </div>
            <div className={styles.identity}>
              <h1 className={styles.name}>{contact.fullName}</h1>
              {contact.companyName ? (
                <div className={styles.company}>{contact.companyName}</div>
              ) : null}
            </div>
            <div className={`${styles.stagePill} ${styles[`stage_${group}`]}`}>
              {stageLabel(contact.lifecycleStage)}
            </div>
          </header>

          <div className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardTitle}>Stage</span>
              {isPending ? <span className={styles.saving}>Saving…</span> : null}
            </div>
            <div className={styles.stageGrid}>
              {STAGES.map((s) => {
                const isActive = s === contact.lifecycleStage;
                return (
                  <button
                    key={s}
                    type="button"
                    className={`${styles.stageBtn} ${isActive ? styles.stageBtnActive : ''}`}
                    onClick={() => handleStage(s)}
                    disabled={isActive || isPending}
                  >
                    {stageLabel(s)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardTitle}>Contact details</span>
            </div>
            <div className={styles.fields}>
              <EditableField
                label="Full name"
                value={contact.fullName}
                onSave={(v) => handleField('fullName', v)}
              />
              <EditableField
                label="Email"
                type="email"
                value={contact.email ?? ''}
                onSave={(v) => handleField('email', v)}
              />
              <EditableField
                label="Phone"
                type="tel"
                value={contact.phone ?? ''}
                onSave={(v) => handleField('phone', v)}
              />
              <EditableField
                label="Company"
                value={contact.companyName ?? ''}
                onSave={(v) => handleField('companyName', v)}
              />
              <SelectField
                label="Source"
                value={contact.source ?? ''}
                options={sources}
                onSave={(v) => handleField('source', v)}
              />
              <EditableField
                label="Estimated MRR"
                type="number"
                value={contact.estimatedMrr != null ? String(contact.estimatedMrr) : ''}
                onSave={(v) => handleField('estimatedMrr', v)}
              />
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardTitle}>
                Linked properties ({contact.properties.length})
              </span>
            </div>
            {contact.properties.length === 0 ? (
              <div className={styles.empty}>
                No properties linked yet.
              </div>
            ) : (
              <ul className={styles.propertyList}>
                {contact.properties.map((p) => (
                  <li key={p.id} className={styles.propertyRow}>
                    <Link href={`/admin/properties/${p.id}`} className={styles.propertyLink}>
                      <span className={styles.propertyName}>
                        {p.name ?? p.addressLine1 ?? 'Untitled property'}
                      </span>
                      {p.name && p.addressLine1 ? (
                        <span className={styles.propertyAddr}>{p.addressLine1}</span>
                      ) : null}
                      <span className={styles.chevron}>›</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <DetailRightRail
          parentType="contact"
          realtimeId={contact.profileId ?? contact.id}
          initialEvents={activity}
          metadata={metadata}
        />
      </div>
    </div>
  );
}

function EditableField({
  label,
  value,
  type = 'text',
  onSave,
}: {
  label: string;
  value: string;
  type?: 'text' | 'email' | 'tel' | 'number';
  onSave: (value: string) => void;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        className={styles.fieldInput}
        type={type}
        defaultValue={value}
        onBlur={(e) => {
          if (e.currentTarget.value !== value) onSave(e.currentTarget.value);
        }}
        placeholder={`Add ${label.toLowerCase()}`}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onSave,
}: {
  label: string;
  value: string;
  options: Array<{ slug: string; label: string }>;
  onSave: (value: string) => void;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <select
        className={`${styles.fieldInput} ${styles.fieldSelect}`}
        defaultValue={value}
        onChange={(e) => onSave(e.currentTarget.value)}
      >
        <option value="">Select source</option>
        {options.map((o) => (
          <option key={o.slug} value={o.slug}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
