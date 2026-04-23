import type { ReactNode } from 'react';
import { PageTitle } from '@/components/admin/chrome/PageTitle';
import {
  fetchContactFilterOptions,
  fetchContactSavedViewsWithCounts,
} from '@/lib/admin/contacts-list';
import { fetchContactSources } from '@/lib/admin/contact-sources';
import { createClient } from '@/lib/supabase/server';
import { SavedViewsTabs } from '../contacts/SavedViewsTabs';
import { ContactsViewSwitcher } from '../contacts/ContactsViewSwitcher';
import { ContactFilterBar } from '../contacts/ContactFilterBar';
import { ContactsFiltersProvider } from '../contacts/ContactsFiltersProvider';
import { BoardToolsProvider } from '../contacts/BoardToolsContext';
import styles from '../contacts/ContactsLayout.module.css';

export const dynamic = 'force-dynamic';

const LEADS_VIEW_KEYS = ['lead-pipeline', 'onboarding', 'archived'];

export default async function LeadsLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const [{ data: authData }, allViews, filterOptions, allSources] = await Promise.all([
    supabase.auth.getUser(),
    fetchContactSavedViewsWithCounts(),
    fetchContactFilterOptions(),
    fetchContactSources(),
  ]);
  const currentUserId = authData.user?.id ?? null;

  const views = allViews.filter((v) => {
    if (!v.isPersonal) return LEADS_VIEW_KEYS.includes(v.key);
    const baseView = v.searchParams?.view;
    return baseView ? LEADS_VIEW_KEYS.includes(baseView) : true;
  });

  return (
    <ContactsFiltersProvider>
      <BoardToolsProvider>
        <div className={styles.shell}>
          <PageTitle
            title="Leads"
            subtitle="Your acquisition pipeline"
          />
          <ContactsViewSwitcher />
          <div className={styles.boardNav}>
            <div className={styles.tabsRail}>
              <SavedViewsTabs views={views} />
            </div>
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
