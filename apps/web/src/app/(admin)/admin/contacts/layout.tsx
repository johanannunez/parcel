import type { ReactNode } from 'react';
import { PageTitle } from '@/components/admin/chrome/PageTitle';

export default function ContactsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageTitle
        title="Contacts"
        subtitle="Leads and owners under Parcel management"
      />
      {children}
    </>
  );
}
