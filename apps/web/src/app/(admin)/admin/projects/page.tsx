import type { Metadata } from 'next';
import { ProjectsStatusView } from './StatusView';

export const metadata: Metadata = { title: 'Projects (Admin)' };
export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ mode?: string }>;
};

export default async function ProjectsPage({ searchParams }: Props) {
  // Projects page ships with Status view as the default since Plan C's
  // list view has not landed yet. When Plan C merges it can add its own
  // list/table view and wire mode switching here.
  const { mode } = await searchParams;
  const _ = mode; // reserved for future mode switching

  return <ProjectsStatusView />;
}
