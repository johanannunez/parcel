'use client';

import { useState } from 'react';
import { SlidersHorizontal } from '@phosphor-icons/react';
import type { ContactFilterOptions } from '@/lib/admin/contacts-list';
import type { ContactSavedView } from '@/lib/admin/contact-types';
import type { ContactSource } from '@/lib/admin/contact-sources';
import { useContactsFilters } from './ContactsFiltersProvider';
import { ContactsFilterModal } from './ContactsFilterModal';
import styles from './ContactFilterBar.module.css';

type Props = {
  filterOptions: ContactFilterOptions;
  views: ContactSavedView[];
  allSources: ContactSource[];
  currentUserId: string | null;
};

export function ContactFilterBar({
  filterOptions,
  views,
  allSources,
  currentUserId,
}: Props) {
  const { sources, assignees } = useContactsFilters();
  const [open, setOpen] = useState(false);
  const activeCount = sources.length + assignees.length;
  const hasActive = activeCount > 0;

  return (
    <>
      <button
        type="button"
        className={`${styles.trigger} ${hasActive ? styles.triggerActive : ''}`}
        onClick={() => setOpen(true)}
        onMouseDown={(e) => e.preventDefault()}
        aria-label="Open filters"
        aria-expanded={open}
      >
        <SlidersHorizontal size={13} weight="bold" />
        <span>Filters</span>
        {hasActive ? <span className={styles.count}>{activeCount}</span> : null}
      </button>

      <ContactsFilterModal
        open={open}
        onClose={() => setOpen(false)}
        filterOptions={filterOptions}
        views={views}
        allSources={allSources}
        currentUserId={currentUserId}
      />
    </>
  );
}
