// apps/web/src/app/(admin)/admin/vendors/VendorsList.tsx
'use client';
import { useState } from 'react';
import { Plus, Wrench, Phone, Envelope } from '@phosphor-icons/react';
import type { VendorRow } from '@/lib/admin/vendors-list';
import { CreateVendorModal } from './CreateVendorModal';
import styles from './VendorsList.module.css';

export function VendorsList({ vendors }: { vendors: VendorRow[] }) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Vendors</h1>
          <p className={styles.subtitle}>{vendors.length} vendor{vendors.length !== 1 ? 's' : ''}</p>
        </div>
        <button className={styles.addBtn} onClick={() => setCreateOpen(true)}>
          <Plus size={16} weight="bold" />
          Add vendor
        </button>
      </div>

      {vendors.length === 0 ? (
        <div className={styles.empty}>
          <Wrench size={32} weight="duotone" />
          <p>No vendors yet. Add your first vendor to start tracking communication and work.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {vendors.map((v) => (
            <div key={v.id} className={styles.row}>
              <div className={styles.rowMain}>
                <span className={styles.name}>{v.fullName}</span>
                {v.trade && <span className={styles.trade}>{v.trade}</span>}
                {v.companyName && <span className={styles.company}>{v.companyName}</span>}
              </div>
              <div className={styles.rowMeta}>
                {v.phone && (
                  <span className={styles.metaItem}>
                    <Phone size={12} /> {v.phone}
                  </span>
                )}
                {v.email && (
                  <span className={styles.metaItem}>
                    <Envelope size={12} /> {v.email}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {createOpen && <CreateVendorModal onClose={() => setCreateOpen(false)} />}
    </div>
  );
}
