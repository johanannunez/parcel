import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { LifecycleStage } from './contact-types';

export type ContactDetail = {
  id: string;
  profileId: string | null;
  fullName: string;
  displayName: string | null;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  source: string | null;
  sourceDetail: string | null;
  lifecycleStage: LifecycleStage;
  stageChangedAt: string;
  estimatedMrr: number | null;
  assignedTo: string | null;
  assignedToName: string | null;
  createdAt: string;
  properties: Array<{
    id: string;
    name: string | null;
    addressLine1: string | null;
  }>;
};

export async function fetchContactDetail(
  contactId: string,
): Promise<ContactDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('contacts')
    .select(
      `id, profile_id, full_name, display_name, company_name, email, phone,
       avatar_url, source, source_detail, lifecycle_stage, stage_changed_at,
       estimated_mrr, assigned_to, created_at,
       assigned_profile:profiles!contacts_assigned_to_fkey(full_name),
       properties:properties!properties_contact_id_fkey(id, name, address_line1)`,
    )
    .eq('id', contactId)
    .maybeSingle();

  if (error || !data) return null;

  const assignedProfile =
    Array.isArray(data.assigned_profile)
      ? data.assigned_profile[0]
      : (data.assigned_profile as { full_name?: string } | null);

  const properties = Array.isArray(data.properties)
    ? data.properties.map((p) => ({
        id: p.id as string,
        name: p.name as string | null,
        addressLine1: p.address_line1 as string | null,
      }))
    : [];

  return {
    id: data.id,
    profileId: data.profile_id,
    fullName: data.full_name,
    displayName: data.display_name,
    companyName: data.company_name,
    email: data.email,
    phone: data.phone,
    avatarUrl: data.avatar_url,
    source: data.source,
    sourceDetail: data.source_detail,
    lifecycleStage: data.lifecycle_stage as LifecycleStage,
    stageChangedAt: data.stage_changed_at,
    estimatedMrr:
      data.estimated_mrr == null ? null : Number(data.estimated_mrr),
    assignedTo: data.assigned_to,
    assignedToName: assignedProfile?.full_name ?? null,
    createdAt: data.created_at,
    properties,
  };
}
