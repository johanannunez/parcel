'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createContact } from '@/lib/admin/contact-actions';
import type { LifecycleStage } from '@/lib/admin/contact-types';
import { STAGE_LABEL } from '@/lib/admin/lifecycle-stage';
import styles from './ContactForm.module.css';

const SOURCE_OPTIONS = [
  'Referral',
  'Instagram',
  'Website',
  'Cold outreach',
  'Event',
  'Other',
];

const INITIAL_STAGES: LifecycleStage[] = [
  'lead_new',
  'qualified',
  'in_discussion',
  'contract_sent',
  'onboarding',
];

export function ContactForm({ onClose }: { onClose: () => void }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [source, setSource] = useState<string>(SOURCE_OPTIONS[0]);
  const [estimatedMrr, setEstimatedMrr] = useState('');
  const [lifecycleStage, setLifecycleStage] = useState<LifecycleStage>('lead_new');
  const [notes, setNotes] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submit = () => {
    if (!fullName.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const mrr = estimatedMrr.trim() ? Number(estimatedMrr) : null;
        const result = await createContact({
          fullName,
          email: email || null,
          phone: phone || null,
          companyName: companyName || null,
          source,
          estimatedMrr: mrr && !Number.isNaN(mrr) ? mrr : null,
          lifecycleStage,
          notes: notes || null,
        });
        router.push(`/admin/clients/${result.entityId}`);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
    });
  };

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className={styles.field}>
        <label className={styles.label} htmlFor="contact-name">Full name</label>
        <input
          id="contact-name"
          className={styles.input}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Maya Thompson"
          autoFocus
          required
        />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="contact-email">Email</label>
          <input
            id="contact-email"
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="maya@example.com"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="contact-phone">Phone</label>
          <input
            id="contact-phone"
            type="tel"
            className={styles.input}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 555-0100"
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="contact-company">Company (optional)</label>
        <input
          id="contact-company"
          className={styles.input}
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Thompson Holdings"
        />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="contact-source">Source</label>
          <select
            id="contact-source"
            className={styles.select}
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            {SOURCE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="contact-mrr">Estimated MRR</label>
          <input
            id="contact-mrr"
            type="number"
            min="0"
            step="100"
            className={styles.input}
            value={estimatedMrr}
            onChange={(e) => setEstimatedMrr(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="contact-stage">Initial stage</label>
        <select
          id="contact-stage"
          className={styles.select}
          value={lifecycleStage}
          onChange={(e) => setLifecycleStage(e.target.value as LifecycleStage)}
        >
          {INITIAL_STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="contact-notes">Notes</label>
        <textarea
          id="contact-notes"
          className={styles.textarea}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional context about this contact"
        />
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={onClose}>
          Cancel
        </button>
        <button
          type="submit"
          className={styles.btnPrimary}
          disabled={!fullName.trim() || isPending}
        >
          {isPending ? 'Creating…' : 'Create contact'}
        </button>
      </div>
    </form>
  );
}
