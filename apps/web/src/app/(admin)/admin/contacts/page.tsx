import { fetchAdminContactsList } from '@/lib/admin/contacts-list';
import { ContactsListView } from './ContactsListView';

type Props = {
  searchParams: Promise<{ view?: string; q?: string }>;
};

export default async function ContactsPage({ searchParams }: Props) {
  const { view, q } = await searchParams;
  const { rows, views, activeView } = await fetchAdminContactsList({
    viewKey: view,
    search: q ?? null,
  });

  return (
    <ContactsListView rows={rows} views={views} activeView={activeView} />
  );
}
