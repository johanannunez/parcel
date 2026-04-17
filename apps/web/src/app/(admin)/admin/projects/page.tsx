import { fetchAdminProjectsList } from '@/lib/admin/projects-list';
import { ProjectsListView } from './ProjectsListView';

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string }>;
}) {
  const { view, q } = await searchParams;
  const { rows, views } = await fetchAdminProjectsList({
    viewKey: view,
    search: q ?? null,
  });
  return <ProjectsListView rows={rows} views={views} />;
}
