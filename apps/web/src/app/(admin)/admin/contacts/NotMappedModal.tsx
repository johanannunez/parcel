'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X } from '@phosphor-icons/react';
import type { ContactRow } from '@/lib/admin/contact-types';
import { stageGroup, stageLabel } from '@/lib/admin/lifecycle-stage';
import styles from './NotMappedModal.module.css';

const STAGE_COLOR: Record<ReturnType<typeof stageGroup>, string> = {
  lead: '#02AAEB',
  onboarding: '#8B5CF6',
  active: '#10B981',
  cold: '#0369A1',
  dormant: '#6B7280',
};

type Props = {
  rows: ContactRow[];
  onClose: () => void;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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
      aria-label="Contacts not mapped"
      onClick={onClose}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h2 className={styles.title}>Contacts not mapped</h2>
            <p className={styles.subtitle}>
              {rows.length} {rows.length === 1 ? 'contact' : 'contacts'}{' '}
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
            const color = STAGE_COLOR[stageGroup(r.lifecycleStage)];
            return (
              <Link
                key={r.id}
                href={`/admin/contacts/${r.id}`}
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
