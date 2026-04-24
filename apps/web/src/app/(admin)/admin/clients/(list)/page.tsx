import { fetchAdminContactsList } from '@/lib/admin/contacts-list';
import { ContactsListView } from '../../contacts/ContactsListView';
import { ContactsStatusView } from '../../contacts/StatusView';
import { ActiveOwnersGrid } from '../../contacts/ActiveOwnersGrid';
import { ContactsMapView } from '../../contacts/ContactsMapView';

type Props = {
  searchParams: Promise<{
    view?: string;
    q?: string;
    mode?: string;
    source?: string;
    assignee?: string;
  }>;
};

export default async function ClientsPage({ searchParams }: Props) {
  const { view, q, mode } = await searchParams;
  const viewKey = view ?? 'lead-pipeline';

  const { rows, activeView } = await fetchAdminContactsList({
    viewKey,
    search: q ?? null,
  });

  const activeMode = mode ?? activeView.viewMode;

  if (activeMode === 'map') {
    return <ContactsMapView rows={rows} />;
  }

  const useActiveOwnersGrid =
    viewKey === 'active-owners' && activeMode !== 'compact';

  if (useActiveOwnersGrid) {
    return <ActiveOwnersGrid rows={rows} />;
  }

  if (activeMode === 'status') {
    return <ContactsStatusView viewKey={viewKey} rows={rows} />;
  }

  return (
    <ContactsListView
      rows={rows}
      activeView={activeView}
      basePath="/admin/clients"
    />
  );
}
