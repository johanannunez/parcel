import { fetchAdminProjectsList } from '@/lib/admin/projects-list';
import { ProjectsListView } from './ProjectsListView';
import { ProjectsStatusView } from './StatusView';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ view?: string; q?: string; mode?: string }>;
};

export default async function ProjectsPage({ searchParams }: Props) {
  const { view, q, mode } = await searchParams;
  const activeMode = mode ?? 'status';

  if (activeMode === 'status') {
    return <ProjectsStatusView />;
  }

  const { rows, views } = await fetchAdminProjectsList({
    viewKey: view,
    search: q ?? null,
  });
  return <ProjectsListView rows={rows} views={views} />;
}
