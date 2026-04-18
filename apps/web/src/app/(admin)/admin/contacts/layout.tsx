import type { ReactNode } from 'react';
import { PageTitle } from '@/components/admin/chrome/PageTitle';
import {
  fetchContactFilterOptions,
  fetchContactSavedViewsWithCounts,
} from '@/lib/admin/contacts-list';
import { fetchContactSources } from '@/lib/admin/contact-sources';
import { createClient } from '@/lib/supabase/server';
import { SavedViewsTabs } from './SavedViewsTabs';
import { ContactsViewSwitcher } from './ContactsViewSwitcher';
import { ContactFilterBar } from './ContactFilterBar';
import { ContactsFiltersProvider } from './ContactsFiltersProvider';
import { BoardToolsProvider } from './BoardToolsContext';
import styles from './ContactsLayout.module.css';

export const dynamic = 'force-dynamic';

export default async function ContactsLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const [{ data: authData }, views, filterOptions, allSources] =
    await Promise.all([
      supabase.auth.getUser(),
      fetchContactSavedViewsWithCounts(),
      fetchContactFilterOptions(),
      fetchContactSources(),
    ]);
  const currentUserId = authData.user?.id ?? null;

  return (
    <ContactsFiltersProvider>
      <BoardToolsProvider>
        <div className={styles.shell}>
          <PageTitle
            title="Contacts"
            subtitle="Leads and owners under Parcel management"
          />
          <ContactsViewSwitcher />
          <div className={styles.boardNav}>
            <SavedViewsTabs views={views} />
            <div className={styles.boardNavRight}>
              <ContactFilterBar
                filterOptions={filterOptions}
                views={views}
                allSources={allSources}
                currentUserId={currentUserId}
              />
            </div>
          </div>
          <div className={styles.content}>{children}</div>
        </div>
      </BoardToolsProvider>
    </ContactsFiltersProvider>
  );
}
