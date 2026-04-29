'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchOwnersForPicker,
  quickCreateAdminProperty,
  type OwnerPickerItem,
} from '@/app/(admin)/admin/properties/actions';
import styles from './ContactForm.module.css';

const PROPERTY_TYPES = [
  { value: 'str', label: 'Short-term rental (STR)' },
  { value: 'ltr', label: 'Long-term rental (LTR)' },
  { value: 'mtr', label: 'Mid-term rental (MTR)' },
  { value: 'co-hosting', label: 'Co-hosting' },
  { value: 'arbitrage', label: 'Arbitrage' },
] as const;

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
  'DC',
];

export function PropertyForm({ onClose }: { onClose: () => void }) {
  const [owners, setOwners] = useState<OwnerPickerItem[]>([]);
  const [ownerId, setOwnerId] = useState('');
  const [propertyType, setPropertyType] = useState('str');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('WA');
  const [postalCode, setPostalCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadingOwners, setLoadingOwners] = useState(true);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    fetchOwnersForPicker()
      .then((list) => {
        setOwners(list);
        if (list.length > 0) setOwnerId(list[0].id);
      })
      .finally(() => setLoadingOwners(false));
  }, []);

  const submit = () => {
    if (!ownerId || !addressLine1.trim() || !city.trim() || !state || !postalCode.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await quickCreateAdminProperty({
        ownerId,
        propertyType,
        addressLine1: addressLine1.trim(),
        city: city.trim(),
        state,
        postalCode: postalCode.trim(),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/admin/properties/${result.propertyId}`);
      onClose();
    });
  };

  const canSubmit = !!ownerId && !!addressLine1.trim() && !!city.trim() && !!postalCode.trim();

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className={styles.field}>
        <label className={styles.label} htmlFor="prop-owner">Owner</label>
        <select
          id="prop-owner"
          className={styles.select}
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
          disabled={loadingOwners}
          required
        >
          {loadingOwners ? (
            <option value="">Loading owners…</option>
          ) : owners.length === 0 ? (
            <option value="">No owners found</option>
          ) : (
            owners.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))
          )}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="prop-type">Property type</label>
        <select
          id="prop-type"
          className={styles.select}
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
        >
          {PROPERTY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="prop-address">Street address</label>
        <input
          id="prop-address"
          className={styles.input}
          value={addressLine1}
          onChange={(e) => setAddressLine1(e.target.value)}
          placeholder="e.g. 1431 Jadwin Ave"
          autoFocus
          required
        />
      </div>

      <div className={styles.row} style={{ gridTemplateColumns: '1fr 72px 90px' }}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="prop-city">City</label>
          <input
            id="prop-city"
            className={styles.input}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Richland"
            required
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="prop-state">State</label>
          <select
            id="prop-state"
            className={styles.select}
            value={state}
            onChange={(e) => setState(e.target.value)}
          >
            {US_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="prop-zip">ZIP</label>
          <input
            id="prop-zip"
            className={styles.input}
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="99352"
            required
          />
        </div>
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={onClose}>
          Cancel
        </button>
        <button
          type="submit"
          className={styles.btnPrimary}
          disabled={!canSubmit || isPending || loadingOwners}
        >
          {isPending ? 'Creating…' : 'Create property'}
        </button>
      </div>
    </form>
  );
}
