import { fetchAdminContactsList } from '@/lib/admin/contacts-list';
import { ContactsListView } from './ContactsListView';
import { ContactsStatusView } from './StatusView';

type Props = {
  searchParams: Promise<{ view?: string; q?: string; mode?: string }>;
};

export default async function ContactsPage({ searchParams }: Props) {
  const { view, q, mode } = await searchParams;
  const viewKey = view ?? 'all-contacts';

  const { rows, views, activeView } = await fetchAdminContactsList({
    viewKey,
    search: q ?? null,
  });

  // Determine active mode: URL ?mode= overrides saved view's view_mode.
  const activeMode = mode ?? activeView.viewMode;

  if (activeMode === 'status') {
    return <ContactsStatusView viewKey={viewKey} />;
  }

  return <ContactsListView rows={rows} views={views} activeView={activeView} />;
}
