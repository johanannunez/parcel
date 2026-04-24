// apps/web/src/lib/admin/resolve-phone.ts
import 'server-only';
import { createServiceClient } from '@/lib/supabase/service';
import { normalizePhone } from './normalize-phone';
import type { ResolvedEntity } from './communication-types';

/**
 * Resolve a phone number to an entity in priority order:
 * owner (profiles) > contact (contacts) > vendor (vendors) > unknown.
 *
 * All three queries run in parallel. First match by priority wins.
 * Phone is normalized to E.164 before lookup.
 */
export async function resolvePhone(rawPhone: string): Promise<ResolvedEntity> {
  const phone = normalizePhone(rawPhone);
  const supabase = createServiceClient();

  const [ownerResult, contactResult, vendorResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('phone', phone)
      .eq('role', 'owner')
      .maybeSingle(),
    supabase
      .from('contacts')
      .select('id, full_name, display_name')
      .eq('phone', phone)
      .maybeSingle(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('vendors')
      .select('id, full_name')
      .eq('phone', phone)
      .maybeSingle() as Promise<{ data: { id: string; full_name: string | null } | null; error: unknown }>,
  ]);

  if (ownerResult.data) {
    const { data: propData } = await supabase
      .from('property_owners')
      .select('property_id')
      .eq('owner_id', ownerResult.data.id);
    return {
      type: 'owner',
      entityId: ownerResult.data.id,
      displayName: ownerResult.data.full_name ?? phone,
      propertyIds: (propData ?? []).map((r) => r.property_id),
    };
  }

  if (contactResult.data) {
    return {
      type: 'contact',
      entityId: contactResult.data.id,
      displayName:
        contactResult.data.display_name ??
        contactResult.data.full_name ??
        phone,
      propertyIds: [],
    };
  }

  if (vendorResult.data) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: vpData } = await (supabase as any)
      .from('vendor_properties')
      .select('property_id')
      .eq('vendor_id', vendorResult.data.id) as { data: Array<{ property_id: string }> | null };
    return {
      type: 'vendor',
      entityId: vendorResult.data.id,
      displayName: vendorResult.data.full_name ?? phone,
      propertyIds: (vpData ?? []).map((r) => r.property_id),
    };
  }

  return { type: 'unknown', phone };
}
