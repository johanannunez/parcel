import {
  fetchContactFilterOptions,
  fetchContactSavedViewsWithCounts,
  fetchAdminContactsList,
} from '@/lib/admin/contacts-list';
import { fetchContactSources } from '@/lib/admin/contact-sources';
import { createClient } from '@/lib/supabase/server';
import { PageTitle } from '@/components/admin/chrome/PageTitle';
import { SavedViewsTabs } from '../contacts/SavedViewsTabs';
import { ContactsViewSwitcher } from '../contacts/ContactsViewSwitcher';
import { ContactFilterBar } from '../contacts/ContactFilterBar';
import { ContactsFiltersProvider } from '../contacts/ContactsFiltersProvider';
import { BoardToolsProvider } from '../contacts/BoardToolsContext';
import { ContactsListView } from '../contacts/ContactsListView';
import { ContactsStatusView } from '../contacts/StatusView';
import { ActiveOwnersGrid } from '../contacts/ActiveOwnersGrid';
import { ContactsMapView } from '../contacts/ContactsMapView';
import styles from '../contacts/ContactsLayout.module.css';

export const dynamic = 'force-dynamic';

const OWNERS_VIEW_KEYS = ['active-owners', 'offboarding', 'archived'];

type Props = {
  searchParams: Promise<{
    view?: string;
    q?: string;
    mode?: string;
    source?: string;
    assignee?: string;
  }>;
};

export default async function OwnersPage({ searchParams }: Props) {
  const { view, q, mode } = await searchParams;
  const viewKey = view ?? 'active-owners';

  const supabase = await createClient();
  const [{ data: authData }, allViews, filterOptions, allSources, { rows, activeView }] =
    await Promise.all([
      supabase.auth.getUser(),
      fetchContactSavedViewsWithCounts(),
      fetchContactFilterOptions(),
      fetchContactSources(),
      fetchAdminContactsList({ viewKey, search: q ?? null }),
    ]);

  const currentUserId = authData.user?.id ?? null;
  const views = allViews.filter((v) => {
    if (!v.isPersonal) return OWNERS_VIEW_KEYS.includes(v.key);
    const baseView = v.searchParams?.view;
    return baseView ? OWNERS_VIEW_KEYS.includes(baseView) : false;
  });
  const activeMode = mode ?? activeView.viewMode;

  let board: React.ReactNode;
  if (activeMode === 'map') {
    board = <ContactsMapView rows={rows} />;
  } else if (viewKey === 'active-owners' && activeMode !== 'compact') {
    board = <ActiveOwnersGrid rows={rows} />;
  } else if (activeMode === 'status') {
    board = <ContactsStatusView viewKey={viewKey} rows={rows} />;
  } else {
    board = <ContactsListView rows={rows} activeView={activeView} />;
  }

  return (
    <ContactsFiltersProvider>
      <BoardToolsProvider>
        <div className={styles.shell}>
          <PageTitle title="Owners" subtitle="Active property owners under management" />
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
          <div className={styles.content}>{board}</div>
        </div>
      </BoardToolsProvider>
    </ContactsFiltersProvider>
  );
}
