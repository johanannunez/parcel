import { createServiceClient } from '@/lib/supabase/service';
import type { LifecycleStage } from '@/lib/admin/contact-types';
import { AdminMapView } from './AdminMapView';
import { getShowTestData } from '@/lib/admin/test-data';

export const dynamic = 'force-dynamic';

export type OwnerMapPin = {
  contactId: string;
  fullName: string;
  companyName: string | null;
  avatarUrl: string | null;
  lifecycleStage: LifecycleStage;
  homeLat: number;
  homeLng: number;
};

export type PropertyMapPin = {
  propertyId: string;
  primaryOwnerId: string;
  ownerName: string;
  ownerLifecycleStage: LifecycleStage;
  addressLine1: string;
  city: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
};

export type UnmappedOwner = {
  contactId: string;
  fullName: string;
  companyName: string | null;
  avatarUrl: string | null;
  lifecycleStage: LifecycleStage;
};

export default async function AdminMapPage() {
  const supabase = createServiceClient();
  const showTestData = await getShowTestData();

  const mappedContactsQ = supabase
    .from('contacts')
    .select('id, full_name, company_name, avatar_url, lifecycle_stage, home_lat, home_lng')
    .not('home_lat', 'is', null)
    .not('home_lng', 'is', null);

  const unmappedContactsQ = supabase
    .from('contacts')
    .select('id, full_name, company_name, avatar_url, lifecycle_stage')
    .is('home_lat', null);

  const propertiesQ = supabase
    .from('properties')
    .select(
      `id, address_line1, city, state, latitude, longitude, contact_id,
       owner_contact:contacts!properties_contact_id_fkey(
         id, full_name, lifecycle_stage
       )`,
    )
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .not('contact_id', 'is', null);

  const [mappedOwnersResult, unmappedOwnersResult, propertiesResult] = await Promise.all([
    showTestData ? mappedContactsQ : mappedContactsQ.not('id', 'like', '0000%'),
    showTestData ? unmappedContactsQ : unmappedContactsQ.not('id', 'like', '0000%'),
    showTestData ? propertiesQ : propertiesQ.not('id', 'like', '0000%'),
  ]);

  const owners: OwnerMapPin[] = (mappedOwnersResult.data ?? []).map((r) => ({
    contactId: r.id,
    fullName: r.full_name,
    companyName: r.company_name,
    avatarUrl: r.avatar_url,
    lifecycleStage: r.lifecycle_stage as LifecycleStage,
    homeLat: Number(r.home_lat),
    homeLng: Number(r.home_lng),
  }));

  const unmappedOwners: UnmappedOwner[] = (unmappedOwnersResult.data ?? []).map((r) => ({
    contactId: r.id,
    fullName: r.full_name,
    companyName: r.company_name,
    avatarUrl: r.avatar_url,
    lifecycleStage: r.lifecycle_stage as LifecycleStage,
  }));

  const properties: PropertyMapPin[] = (propertiesResult.data ?? [])
    .filter((p) => p.contact_id != null)
    .map((p) => {
      const ownerContact = Array.isArray(p.owner_contact)
        ? p.owner_contact[0]
        : p.owner_contact;
      return {
        propertyId: p.id,
        primaryOwnerId: p.contact_id as string,
        ownerName: (ownerContact as { full_name?: string } | null)?.full_name ?? 'Unknown',
        ownerLifecycleStage: ((ownerContact as { lifecycle_stage?: string } | null)
          ?.lifecycle_stage ?? 'lead_new') as LifecycleStage,
        addressLine1: p.address_line1,
        city: p.city,
        state: p.state,
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
      };
    });

  return <AdminMapView owners={owners} properties={properties} unmappedOwners={unmappedOwners} />;
}
