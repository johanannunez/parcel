// apps/web/src/app/(admin)/admin/vendors/CreateVendorModal.tsx
'use client';
import { useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { X } from '@phosphor-icons/react';
import { createVendor } from '@/lib/admin/vendor-actions';
import styles from './CreateVendorModal.module.css';

type Props = { onClose: () => void };

export function CreateVendorModal({ onClose }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      try {
        await createVendor({
          fullName: fd.get('fullName') as string,
          companyName: (fd.get('companyName') as string) || undefined,
          phone: (fd.get('phone') as string) || undefined,
          email: (fd.get('email') as string) || undefined,
          trade: (fd.get('trade') as string) || undefined,
          notes: (fd.get('notes') as string) || undefined,
        });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create vendor');
      }
    });
  }

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Add vendor</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.field}>
            <span className={styles.label}>Full name *</span>
            <input name="fullName" required className={styles.input} placeholder="John Smith" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Trade</span>
            <input name="trade" className={styles.input} placeholder="Plumber, Electrician, Cleaner..." />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Company</span>
            <input name="companyName" className={styles.input} placeholder="Smith Plumbing LLC" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Phone</span>
            <input name="phone" className={styles.input} placeholder="+15095551234" type="tel" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <input name="email" className={styles.input} placeholder="john@smithplumbing.com" type="email" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Notes</span>
            <textarea name="notes" className={styles.textarea} rows={3} placeholder="Any notes about this vendor..." />
          </label>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={isPending}>
              {isPending ? 'Saving...' : 'Add vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
