import type { ReactNode } from 'react';
import { PageTitle } from '@/components/admin/chrome/PageTitle';
import {
  fetchContactFilterOptions,
  fetchContactSavedViewsWithCounts,
} from '@/lib/admin/people-list';
import { fetchContactSources } from '@/lib/admin/contact-sources';
import { createClient } from '@/lib/supabase/server';
import { SavedViewsTabs } from '../../people/SavedViewsTabs';
import { ContactsViewSwitcher } from '../../people/ContactsViewSwitcher';
import { ContactFilterBar } from '../../people/ContactFilterBar';
import { ContactsFiltersProvider } from '../../people/ContactsFiltersProvider';
import { BoardToolsProvider } from '../../people/BoardToolsContext';
import styles from '../../people/ContactsLayout.module.css';

export const dynamic = 'force-dynamic';

const WORKSPACE_VIEW_KEYS = [
  'active-owners',
  'offboarding',
  'archived',
];

export default async function WorkspacesLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const [{ data: authData }, allViews, filterOptions, allSources] =
    await Promise.all([
      supabase.auth.getUser(),
      fetchContactSavedViewsWithCounts(),
      fetchContactFilterOptions(),
      fetchContactSources(),
    ]);
  const currentUserId = authData.user?.id ?? null;

  const views = allViews.filter((v) => {
    if (!v.isPersonal) return WORKSPACE_VIEW_KEYS.includes(v.key);
    const baseView = v.searchParams?.view;
    return baseView ? WORKSPACE_VIEW_KEYS.includes(baseView) : true;
  });

  return (
    <ContactsFiltersProvider>
      <BoardToolsProvider>
        <div className={styles.shell}>
          <PageTitle
            title="Workspaces"
            subtitle="Owner relationships, people, properties, and operating context"
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
