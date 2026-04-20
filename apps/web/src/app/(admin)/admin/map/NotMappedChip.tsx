'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ListBullets, X } from '@phosphor-icons/react';
import { initials, stageColor, stageLabel } from '@/lib/admin/lifecycle-stage';
import type { LifecycleStage } from '@/lib/admin/contact-types';
import styles from './NotMappedChip.module.css';

export type NotMappedItem = {
  id: string;
  fullName: string;
  companyName: string | null;
  avatarUrl: string | null;
  lifecycleStage: LifecycleStage;
  kind: 'owner' | 'property';
  href: string;
};

type Props = {
  items: NotMappedItem[];
};

export function NotMappedChip({ items }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  if (items.length === 0) return null;

  return (
    <>
      <button type="button" className={styles.chip} onClick={() => setOpen(true)}>
        <ListBullets size={13} weight="duotone" />
        {items.length} {items.length === 1 ? 'contact' : 'contacts'} not mapped
      </button>

      {open ? (
        <div
          className={styles.backdrop}
          role="dialog"
          aria-modal="true"
          aria-label="Contacts not mapped"
          onClick={() => setOpen(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>Not mapped</h2>
                <p className={styles.modalSubtitle}>
                  {items.length} {items.length === 1 ? 'contact' : 'contacts'} without a geocoded address
                </p>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            <div className={styles.list}>
              {items.map((item) => {
                const color = stageColor(item.lifecycleStage);
                return (
                  <Link key={item.id} href={item.href} className={styles.row}>
                    {item.avatarUrl ? (
                      <Image
                        src={item.avatarUrl}
                        alt=""
                        width={32}
                        height={32}
                        className={styles.avatarFallback}
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className={styles.avatarFallback} style={{ background: color }}>
                        {initials(item.fullName)}
                      </div>
                    )}
                    <div>
                      <div className={styles.rowName}>{item.fullName}</div>
                      {item.companyName ? (
                        <div className={styles.rowSub}>{item.companyName}</div>
                      ) : null}
                    </div>
                    <span className={styles.pill} style={{ background: `${color}1f`, color }}>
                      {stageLabel(item.lifecycleStage)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
