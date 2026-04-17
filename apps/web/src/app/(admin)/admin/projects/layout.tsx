import type { ReactNode } from 'react';
import { PageTitle } from '@/components/admin/chrome/PageTitle';
import { PipelineViewSwitcher } from '@/components/admin/chrome/PipelineViewSwitcher';

export default function ProjectsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageTitle
        title="Projects"
        subtitle="Internal projects and initiatives"
      />
      {/* Injects Status/List switcher into the admin top bar center slot */}
      <PipelineViewSwitcher defaultMode="status" />
      {children}
    </>
  );
}
