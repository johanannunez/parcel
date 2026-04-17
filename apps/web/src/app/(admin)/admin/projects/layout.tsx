import type { ReactNode } from 'react';
import { PageTitle } from '@/components/admin/chrome/PageTitle';

export default function ProjectsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageTitle
        title="Projects"
        subtitle="Internal projects and initiatives"
      />
      {children}
    </>
  );
}
