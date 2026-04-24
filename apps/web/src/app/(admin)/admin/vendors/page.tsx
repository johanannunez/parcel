// apps/web/src/app/(admin)/admin/vendors/page.tsx
import type { Metadata } from 'next';
import { fetchVendors } from '@/lib/admin/vendors-list';
import { VendorsList } from './VendorsList';

export const metadata: Metadata = { title: 'Vendors' };
export const dynamic = 'force-dynamic';

export default async function VendorsPage() {
  const vendors = await fetchVendors();
  return <VendorsList vendors={vendors} />;
}
