import { notFound } from 'next/navigation';
import { fetchProjectDetail } from '@/lib/admin/project-detail';
import { ProjectDetailShell } from './ProjectDetailShell';
import { OverviewTab } from './OverviewTab';
import { FilesTab } from './FilesTab';
import { SettingsTab } from './SettingsTab';
import { TasksTab } from './TasksTab';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function ProjectDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab = 'overview' } = await searchParams;
  const project = await fetchProjectDetail(id);
  if (!project) notFound();

  let body;
  if (tab === 'tasks') {
    body = <TasksTab projectId={project.id} taskCount={project.taskCount} taskDoneCount={project.taskDoneCount} />;
  } else if (tab === 'files') {
    body = <FilesTab projectId={project.id} />;
  } else if (tab === 'settings') {
    body = <SettingsTab project={project} />;
  } else {
    body = <OverviewTab project={project} />;
  }

  return (
    <ProjectDetailShell project={project}>
      {body}
    </ProjectDetailShell>
  );
}
