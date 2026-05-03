import { fetchAdminContactsList } from '@/lib/admin/people-list';
import { ContactsListView } from '../people/ContactsListView';
import { ContactsStatusView } from '../people/StatusView';
import { ContactsMapView } from '../people/ContactsMapView';

type Props = {
  searchParams: Promise<{
    view?: string;
    q?: string;
    mode?: string;
    source?: string;
    assignee?: string;
  }>;
};

export default async function ProspectsPage({ searchParams }: Props) {
  const { view, q, mode } = await searchParams;
  const viewKey = view ?? 'lead-pipeline';

  const { rows, activeView } = await fetchAdminContactsList({
    viewKey,
    search: q ?? null,
  });

  const activeMode = mode ?? activeView.viewMode;

  if (activeMode === 'map') return <ContactsMapView rows={rows} />;
  if (activeMode === 'status') return <ContactsStatusView viewKey={viewKey} rows={rows} />;
  return <ContactsListView rows={rows} activeView={activeView} />;
}
