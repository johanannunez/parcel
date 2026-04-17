import type { ReactNode } from 'react';
import { PageTitle } from '@/components/admin/chrome/PageTitle';
import { PipelineViewSwitcher } from '@/components/admin/chrome/PipelineViewSwitcher';

export default function ContactsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageTitle
        title="Contacts"
        subtitle="Leads and owners under Parcel management"
      />
      {/* Injects Status/List switcher into the admin top bar center slot */}
      <PipelineViewSwitcher defaultMode="compact" />
      {children}
    </>
  );
}
