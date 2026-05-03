import { fetchAdminContactsList } from '@/lib/admin/people-list';
import { ContactsListView } from './ContactsListView';
import { ContactsStatusView } from './StatusView';
import { ActiveOwnersGrid } from './ActiveOwnersGrid';
import { ContactsMapView } from './ContactsMapView';
import { OnboardingPhaseBoard } from './OnboardingPhaseBoard';

type Props = {
  searchParams: Promise<{
    view?: string;
    q?: string;
    mode?: string;
    source?: string;
    assignee?: string;
  }>;
};

export default async function PeoplePage({ searchParams }: Props) {
  const { view, q, mode } = await searchParams;
  const viewKey = view ?? 'lead-pipeline';

  // Source/assignee filtering happens client-side for instant response, so we
  // fetch the full set of rows for the active view here.
  const { rows, activeView } = await fetchAdminContactsList({
    viewKey,
    search: q ?? null,
  });

  // Determine active mode: URL ?mode= overrides saved view's view_mode.
  const activeMode = mode ?? activeView.viewMode;

  if (activeMode === 'map') {
    return <ContactsMapView rows={rows} />;
  }

  // Onboarding uses its own phase board — bypass the Kanban infrastructure entirely
  if (viewKey === 'onboarding') {
    return <OnboardingPhaseBoard rows={rows} />;
  }

  // Active Owners gets its own rich grid layout instead of a kanban.
  const useActiveOwnersGrid =
    viewKey === 'active-owners' && activeMode !== 'compact';

  if (useActiveOwnersGrid) {
    return <ActiveOwnersGrid rows={rows} />;
  }

  if (activeMode === 'status') {
    return <ContactsStatusView viewKey={viewKey} rows={rows} />;
  }

  return <ContactsListView rows={rows} activeView={activeView} />;
}
