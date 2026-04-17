import { StatusBoard } from '@/components/admin/pipeline/StatusBoard';
import { MetricsBar, type MetricTile } from '@/components/admin/pipeline/MetricsBar';
import { fetchAdminContactsList } from '@/lib/admin/contacts-list';
import { fetchInsightsByParent } from '@/lib/admin/ai-insights';
import { buildContactStatusBoard } from '@/lib/admin/pipeline-adapters/contact-status';

export async function ContactsStatusView({ viewKey }: { viewKey: string }) {
  const { rows } = await fetchAdminContactsList({ viewKey });
  const insightsMap = await fetchInsightsByParent('contact', rows.map((r) => r.id));
  const columns = buildContactStatusBoard(rows, insightsMap, viewKey);

  const totalMrr = rows.reduce((s, r) => s + (r.estimatedMrr ?? 0), 0);
  const tiles: MetricTile[] = [
    { label: 'Pipeline value', value: `$${totalMrr.toLocaleString()}`, featured: true },
    { label: 'Contacts in view', value: String(rows.length) },
    { label: 'With assigned owner', value: String(rows.filter((r) => r.assignedTo).length) },
  ];

  return (
    <div>
      <MetricsBar tiles={tiles} />
      <StatusBoard columns={columns} />
    </div>
  );
}
