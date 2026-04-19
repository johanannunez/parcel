import type { ReactNode } from 'react';
import { PageTitle } from '@/components/admin/chrome/PageTitle';

export default function TasksLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageTitle title="Tasks" subtitle="Your work across every contact, property, and project" />
      {children}
    </>
  );
}
