import { notFound, redirect } from 'next/navigation';
import { fetchContactDetail } from '@/lib/admin/contact-detail';
import { fetchRecentActivity } from '@/lib/admin/detail-rail';
import { fetchContactSources } from '@/lib/admin/contact-sources';
import { ContactDetailShell } from './ContactDetailShell';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ContactDetailPage({ params }: Props) {
  const { id } = await params;

  const [contact, sources] = await Promise.all([
    fetchContactDetail(id),
    fetchContactSources(true),
  ]);
  if (!contact) notFound();

  // Onboarded owners already have a richer page at /admin/owners/[profileId];
  // keep the contact detail route focused on pre-owner records.
  if (contact.profileId) {
    redirect(`/admin/owners/${contact.profileId}`);
  }

  const activity = await fetchRecentActivity('contact', contact.id, 10);

  return <ContactDetailShell contact={contact} activity={activity} sources={sources} />;
}
