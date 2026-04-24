import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { LifecycleStage } from "@/lib/admin/contact-types";

export type ClientProperty = {
  id: string;
  label: string;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  setupStatus: string;
  active: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  createdAt: string;
};

export type ClientDetail = {
  // Contact fields (always present)
  id: string;
  fullName: string;
  displayName: string | null;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  source: string | null;
  lifecycleStage: LifecycleStage;
  stageChangedAt: string;
  estimatedMrr: number | null;
  assignedTo: string | null;
  assignedToName: string | null;
  createdAt: string;

  // Owner fields (null when contact is a pre-profile lead)
  profileId: string | null;
  entityId: string | null;
  onboardingCompletedAt: string | null;
  properties: ClientProperty[];
  lifetimeRevenue: number | null;
};

export async function fetchClientDetail(contactId: string): Promise<ClientDetail | null> {
  const supabase = await createClient();

  const { data: contact, error } = await supabase
    .from("contacts")
    .select(
      `id, profile_id, full_name, display_name, company_name,
       email, phone, avatar_url, source, lifecycle_stage,
       stage_changed_at, estimated_mrr, assigned_to, created_at`
    )
    .eq("id", contactId)
    .single();

  if (error || !contact) return null;

  let profileId: string | null = contact.profile_id ?? null;
  let entityId: string | null = null;
  let onboardingCompletedAt: string | null = null;
  let properties: ClientProperty[] = [];
  let lifetimeRevenue: number | null = null;
  let assignedToName: string | null = null;

  if (contact.assigned_to) {
    const { data: assignee } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", contact.assigned_to)
      .single();
    assignedToName = assignee?.full_name ?? null;
  }

  if (profileId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("entity_id, onboarding_completed_at")
      .eq("id", profileId)
      .single();

    if (profile?.entity_id) {
      entityId = profile.entity_id;
      onboardingCompletedAt = profile.onboarding_completed_at ?? null;

      const { data: props } = await supabase
        .from("properties")
        .select(
          "id, name, address_line1, city, state, setup_status, active, bedrooms, bathrooms, created_at"
        )
        .eq("owner_id", profileId);

      properties = (props ?? []).map((p) => ({
        id: p.id,
        label: (p.name as string | null) ?? (p.address_line1 as string | null) ?? "Unnamed Property",
        addressLine1: (p.address_line1 as string | null) ?? null,
        city: (p.city as string | null) ?? null,
        state: (p.state as string | null) ?? null,
        setupStatus: (p.setup_status as string | null) ?? "not_started",
        active: !!(p.active as boolean | null),
        bedrooms: (p.bedrooms as number | null) ?? null,
        bathrooms: (p.bathrooms as number | null) ?? null,
        createdAt: p.created_at as string,
      }));

      const propertyIds = properties.map((p) => p.id);
      if (propertyIds.length > 0) {
        const { data: payouts } = await supabase
          .from("payouts")
          .select("net_payout")
          .in("property_id", propertyIds);
        const total = (payouts ?? []).reduce(
          (sum, p) => sum + ((p.net_payout as number | null) ?? 0),
          0
        );
        lifetimeRevenue = total > 0 ? total : null;
      }
    }
  }

  return {
    id: contact.id,
    fullName: contact.full_name,
    displayName: (contact.display_name as string | null) ?? null,
    companyName: (contact.company_name as string | null) ?? null,
    email: (contact.email as string | null) ?? null,
    phone: (contact.phone as string | null) ?? null,
    avatarUrl: (contact.avatar_url as string | null) ?? null,
    source: (contact.source as string | null) ?? null,
    lifecycleStage: contact.lifecycle_stage as LifecycleStage,
    stageChangedAt: contact.stage_changed_at,
    estimatedMrr: contact.estimated_mrr == null ? null : Number(contact.estimated_mrr),
    assignedTo: (contact.assigned_to as string | null) ?? null,
    assignedToName,
    createdAt: contact.created_at,
    profileId,
    entityId,
    onboardingCompletedAt,
    properties,
    lifetimeRevenue,
  };
}
