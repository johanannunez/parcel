import { fetchInsightsByParent } from '@/lib/admin/ai-insights';
import type { ContactRow } from '@/lib/admin/contact-types';
import { StatusBoardClient } from './StatusBoardClient';

export async function ContactsStatusView({
  viewKey,
  rows,
  basePath,
  useWorkspaceId,
}: {
  viewKey: string;
  rows: ContactRow[];
  basePath?: string;
  useWorkspaceId?: boolean;
}) {
  const insightsMap = await fetchInsightsByParent(
    'contact',
    rows.map((r) => r.id),
  );

  return (
    <StatusBoardClient
      viewKey={viewKey}
      rows={rows}
      insightsMap={insightsMap}
      basePath={basePath}
      useWorkspaceId={useWorkspaceId}
    />
  );
}
