'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { ContactSavedView } from '@/lib/admin/contact-types';
import styles from './SavedViewsTabs.module.css';

export function SavedViewsTabs({ views }: { views: ContactSavedView[] }) {
  const searchParams = useSearchParams();
  const activeKey = searchParams?.get('view') ?? 'all-contacts';

  return (
    <nav className={styles.row} aria-label="Saved views">
      {views.map((v) => {
        const isActive = v.key === activeKey;
        const href = v.key === 'all-contacts'
          ? '/admin/contacts'
          : `/admin/contacts?view=${v.key}`;
        return (
          <Link
            key={v.key}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
          >
            <span>{v.name}</span>
            <span className={`${styles.count} ${isActive ? styles.countActive : ''}`}>
              {v.count}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
