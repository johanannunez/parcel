import { fetchAdminContactsList } from '@/lib/admin/people-list';
import { ContactsListView } from '../../people/ContactsListView';
import { ContactsStatusView } from '../../people/StatusView';
import { ActiveOwnersGrid } from '../../people/ActiveOwnersGrid';
import { ContactsMapView } from '../../people/ContactsMapView';

type Props = {
  searchParams: Promise<{
    view?: string;
    q?: string;
    mode?: string;
    source?: string;
    assignee?: string;
  }>;
};

const WORKSPACE_VIEW_KEYS = new Set(['active-owners', 'offboarding', 'archived']);

export default async function WorkspacesPage({ searchParams }: Props) {
  const { view, q, mode } = await searchParams;
  const viewKey = view && WORKSPACE_VIEW_KEYS.has(view) ? view : 'active-owners';

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
    return <ActiveOwnersGrid rows={rows} basePath="/admin/workspaces" useWorkspaceId />;
  }

  if (activeMode === 'status') {
    return <ContactsStatusView viewKey={viewKey} rows={rows} basePath="/admin/workspaces" useWorkspaceId />;
  }

  return (
    <ContactsListView
      rows={rows}
      activeView={activeView}
      basePath="/admin/workspaces"
      useWorkspaceId
    />
  );
}
