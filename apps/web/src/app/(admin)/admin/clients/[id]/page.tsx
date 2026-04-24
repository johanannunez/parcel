import { notFound } from 'next/navigation';
import { fetchClientDetail } from '@/lib/admin/client-detail';
import { ClientDetailShell } from './ClientDetailShell';
import { PropertiesTab } from './PropertiesTab';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function ClientDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab } = await searchParams;

  const client = await fetchClientDetail(id);
  if (!client) notFound();

  const activeTab = tab ?? 'overview';

  let content: React.ReactNode;
  if (activeTab === 'properties') {
    content = <PropertiesTab properties={client.properties} />;
  } else {
    // Overview and all other tabs render a placeholder until implemented.
    content = null;
  }

  return <ClientDetailShell client={client}>{content}</ClientDetailShell>;
}
