'use client';

import Link from 'next/link';
import type { TaskParent } from '@/lib/admin/task-types';
import { parentLinkFor } from '@/lib/admin/parent-link';
import styles from './ParentPill.module.css';

export function ParentPill({ parent }: { parent: TaskParent | null }) {
  const link = parentLinkFor({
    type: parent?.type ?? null,
    id: parent?.id ?? null,
    contactProfileId: parent?.contactProfileId ?? null,
    fallbackLabel: parent?.label,
  });
  const content = (
    <span className={`${styles.pill} ${styles[link.color]}`}>
      <span className={styles.dot} aria-hidden />
      <span className={styles.label}>{link.label}</span>
    </span>
  );
  if (!link.href) return content;
  return (
    <Link href={link.href} onClick={(e) => e.stopPropagation()} className={styles.wrap}>
      {content}
    </Link>
  );
}
