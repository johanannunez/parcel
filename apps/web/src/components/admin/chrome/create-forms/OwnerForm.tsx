'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createEntity } from '@/app/(admin)/admin/owners/[entityId]/entity-actions';
import styles from './ContactForm.module.css';

const ENTITY_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'llc', label: 'LLC' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'trust', label: 'Trust' },
  { value: 'corporation', label: 'Corporation' },
] as const;

type EntityType = 'individual' | 'llc' | 'partnership' | 'trust' | 'corporation';

export function OwnerForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<EntityType>('individual');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const submit = () => {
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await createEntity({ name, type });
      if ('error' in result) {
        setError(result.error ?? 'Something went wrong');
        return;
      }
      router.push(`/admin/owners/${result.entityId}`);
      onClose();
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
        <label className={styles.label} htmlFor="owner-name">Entity name</label>
        <input
          id="owner-name"
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Thompson Holdings LLC"
          autoFocus
          required
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="owner-type">Entity type</label>
        <select
          id="owner-type"
          className={styles.select}
          value={type}
          onChange={(e) => setType(e.target.value as EntityType)}
        >
          {ENTITY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={onClose}>
          Cancel
        </button>
        <button
          type="submit"
          className={styles.btnPrimary}
          disabled={!name.trim() || isPending}
        >
          {isPending ? 'Creating…' : 'Create owner'}
        </button>
      </div>
    </form>
  );
}
