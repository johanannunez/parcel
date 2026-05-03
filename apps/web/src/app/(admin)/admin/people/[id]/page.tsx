import { notFound, redirect } from 'next/navigation';
import { fetchContactDetail } from '@/lib/admin/contact-detail';
import { fetchRecentActivity } from '@/lib/admin/detail-rail';
import { fetchContactSources } from '@/lib/admin/contact-sources';
import { fetchCommunications } from '@/lib/admin/fetch-communications';
import { ContactDetailShell } from './ContactDetailShell';

export const dynamic = 'force-dynamic';

type TabKey = 'overview' | 'communications';

const KNOWN_TABS: readonly TabKey[] = ['overview', 'communications'];

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function ContactDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab: tabParam = 'overview' } = await searchParams;
  const tab: TabKey = (KNOWN_TABS as readonly string[]).includes(tabParam)
    ? (tabParam as TabKey)
    : 'overview';

  const [contact, sources] = await Promise.all([
    fetchContactDetail(id),
    fetchContactSources(true),
  ]);
  if (!contact) notFound();

  // Onboarded owners already have a richer Workspace page.
  // Keep the contact detail route focused on pre-owner records.
  if (contact.profileId) {
    redirect(contact.workspaceId ? `/admin/workspaces/${contact.workspaceId}` : "/admin/workspaces?view=active-owners");
  }

  const activity = await fetchRecentActivity('contact', contact.id, 10);

  const communicationsData =
    tab === 'communications'
      ? await fetchCommunications('contact', id)
      : null;

  return (
    <ContactDetailShell
      contact={contact}
      activity={activity}
      sources={sources}
      activeTab={tab}
      communicationsData={communicationsData}
    />
  );
}
