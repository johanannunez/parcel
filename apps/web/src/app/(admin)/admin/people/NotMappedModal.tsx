'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X } from '@phosphor-icons/react';
import type { ContactRow } from '@/lib/admin/contact-types';
import { initials, stageColor, stageLabel } from '@/lib/admin/lifecycle-stage';
import styles from './NotMappedModal.module.css';

type Props = {
  rows: ContactRow[];
  onClose: () => void;
};

export function NotMappedModal({ rows, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="People not mapped"
      onClick={onClose}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h2 className={styles.title}>People not mapped</h2>
            <p className={styles.subtitle}>
              {rows.length} {rows.length === 1 ? 'person is' : 'people are'}{' '}
              without a geocoded property
            </p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        <div className={styles.list}>
          {rows.map((r) => {
            const color = stageColor(r.lifecycleStage);
            return (
              <Link
                key={r.id}
                href={`/admin/people/${r.id}`}
                className={styles.row}
              >
                {r.avatarUrl ? (
                  <Image
                    src={r.avatarUrl}
                    alt=""
                    width={34}
                    height={34}
                    className={styles.avatar}
                  />
                ) : (
                  <div className={styles.avatarFallback}>
                    {initials(r.fullName)}
                  </div>
                )}
                <div className={styles.rowText}>
                  <div className={styles.rowName}>{r.fullName}</div>
                  {r.companyName ? (
                    <div className={styles.rowCompany}>{r.companyName}</div>
                  ) : null}
                </div>
                <span
                  className={styles.stagePill}
                  style={{ background: `${color}1f`, color }}
                >
                  {stageLabel(r.lifecycleStage)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
