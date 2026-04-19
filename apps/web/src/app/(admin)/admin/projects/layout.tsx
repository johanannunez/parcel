import type { ReactNode } from 'react';
import { PageTitle } from '@/components/admin/chrome/PageTitle';
import { PipelineViewSwitcher } from '@/components/admin/chrome/PipelineViewSwitcher';

export default function ProjectsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageTitle
        title="Projects"
        subtitle="Internal initiatives, onboardings, and ideas"
      />
      <PipelineViewSwitcher defaultMode="status" />
      {children}
    </>
  );
}
