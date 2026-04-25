import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
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

export type AddressComponents = {
  street_number?: string;
  route?: string;
  locality?: string;
  administrative_area_level_1?: string;
  postal_code?: string;
  country?: string;
};

export type SocialLinks = {
  linkedin?: string | null;
  instagram?: string | null;
  facebook?: string | null;
};

export type ClientDetail = {
  // Contact fields (always present)
  id: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  source: string | null;
  lifecycleStage: LifecycleStage;
  stageChangedAt: string;
  assignedTo: string | null;
  assignedToName: string | null;
  createdAt: string;
  addressFormatted: string | null;
  addressComponents: AddressComponents | null;
  social: SocialLinks;
  preferredContactMethod: 'email' | 'phone' | 'text' | null;
  contractStartAt: string | null;
  contractEndAt: string | null;
  nextFollowUpAt: string | null;
  totalPropertiesOwned: number | null;
  newsletterSubscribed: boolean;
  managementFeePercent: number | null;
  lastActivityAt: string | null;

  // Email verification (true when auth email_confirmed_at is set)
  emailVerified: boolean;

  // Owner fields (null when contact is a pre-profile lead)
  profileId: string | null;
  entityId: string | null;
  onboardingCompletedAt: string | null;
  properties: ClientProperty[];
  lifetimeRevenue: number | null;
};

export async function fetchClientDetail(contactId: string): Promise<ClientDetail | null> {
  const supabase = await createClient();

  const { data: contact, error } = await (supabase as any)
    .from("contacts")
    .select(
      `id, profile_id, full_name, display_name, company_name,
       email, phone, avatar_url, source, lifecycle_stage,
       stage_changed_at, assigned_to, created_at, management_fee_percent`
    )
    .eq("id", contactId)
    .single() as { data: Record<string, unknown> | null; error: unknown };

  if (error || !contact) return null;

  const { data: extras } = await (supabase as any)
    .from("contacts")
    .select(
      `first_name, last_name, address_formatted, address_components,
       social, preferred_contact_method, contract_start_at, contract_end_at,
       next_follow_up_at, total_properties_owned, newsletter_subscribed,
       last_activity_at`
    )
    .eq("id", contactId)
    .single() as { data: Record<string, unknown> | null };

  let profileId: string | null = (contact.profile_id as string | null) ?? null;
  let entityId: string | null = null;
  let onboardingCompletedAt: string | null = null;
  let properties: ClientProperty[] = [];
  let lifetimeRevenue: number | null = null;
  let assignedToName: string | null = null;
  let profileAvatarUrl: string | null = null;
  let emailVerified = false;

  const assignedToId = (contact.assigned_to as string | null) ?? null;
  if (assignedToId) {
    const { data: assignee } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", assignedToId)
      .single();
    assignedToName = assignee?.full_name ?? null;
  }

  if (profileId) {
    try {
      const serviceClient = createServiceClient();
      const { data: authData } = await serviceClient.auth.admin.getUserById(profileId);
      emailVerified = !!authData?.user?.email_confirmed_at;
    } catch {
      // Service key not available in this env; default to false
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("entity_id, onboarding_completed_at, avatar_url")
      .eq("id", profileId)
      .single();

    profileAvatarUrl = (profile as any)?.avatar_url ?? null;

    if (profile?.entity_id) {
      entityId = profile.entity_id;
      onboardingCompletedAt = profile.onboarding_completed_at ?? null;

      // Fetch both direct-owner properties and co-owned properties from the
      // junction table, then deduplicate by ID — same pattern as owner-detail.ts.
      const [{ data: primaryProps }, { data: coOwnedProps }] = await Promise.all([
        supabase
          .from("properties")
          .select("id")
          .eq("owner_id", profileId),
        (supabase as any)
          .from("property_owners")
          .select("property_id")
          .eq("owner_id", profileId) as Promise<{
          data: Array<{ property_id: string }> | null;
        }>,
      ]);

      const propertyIds = Array.from(
        new Set([
          ...(primaryProps ?? []).map((p: { id: string }) => p.id),
          ...(coOwnedProps ?? []).map((p) => p.property_id),
        ]),
      );

      const { data: props } = propertyIds.length > 0
        ? await supabase
            .from("properties")
            .select(
              "id, name, address_line1, city, state, setup_status, active, bedrooms, bathrooms, created_at"
            )
            .in("id", propertyIds)
        : { data: [] as any[] };

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
    id: contact.id as string,
    fullName: contact.full_name as string,
    firstName: (extras?.first_name as string | null) ?? null,
    lastName: (extras?.last_name as string | null) ?? null,
    displayName: (contact.display_name as string | null) ?? null,
    companyName: (contact.company_name as string | null) ?? null,
    email: (contact.email as string | null) ?? null,
    phone: (contact.phone as string | null) ?? null,
    avatarUrl: (contact.avatar_url as string | null) ?? profileAvatarUrl,
    source: (contact.source as string | null) ?? null,
    lifecycleStage: contact.lifecycle_stage as LifecycleStage,
    stageChangedAt: (contact.stage_changed_at as string | null) ?? "",
    assignedTo: assignedToId,
    assignedToName,
    createdAt: contact.created_at as string,
    managementFeePercent: (contact.management_fee_percent as number | null) ?? null,
    addressFormatted: (extras?.address_formatted as string | null) ?? null,
    addressComponents: (extras?.address_components as AddressComponents | null) ?? null,
    social: ((extras?.social as SocialLinks | null) ?? {}) as SocialLinks,
    preferredContactMethod: (extras?.preferred_contact_method as 'email' | 'phone' | 'text' | null) ?? null,
    contractStartAt: (extras?.contract_start_at as string | null) ?? null,
    contractEndAt: (extras?.contract_end_at as string | null) ?? null,
    nextFollowUpAt: (extras?.next_follow_up_at as string | null) ?? null,
    totalPropertiesOwned: (extras?.total_properties_owned as number | null) ?? null,
    newsletterSubscribed: (extras?.newsletter_subscribed as boolean | null) ?? false,
    lastActivityAt: (extras?.last_activity_at as string | null) ?? null,
    emailVerified,
    profileId,
    entityId,
    onboardingCompletedAt,
    properties,
    lifetimeRevenue,
  };
}

// ---------------------------------------------------------------------------
// Entity-first types
// ---------------------------------------------------------------------------

export type EntityMember = {
  id: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  portalAccess: boolean;
};

export type EntityInfo = {
  id: string;
  name: string;
  type: string | null;
};

// ---------------------------------------------------------------------------
// Entity helpers
// ---------------------------------------------------------------------------

export async function fetchEntityMembers(entityId: string): Promise<EntityMember[]> {
  const supabase = createServiceClient();

  const { data, error } = await (supabase as any)
    .from('contacts')
    .select('id, full_name, first_name, last_name, email, phone, avatar_url, profile_id')
    .eq('entity_id', entityId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return (data as any[]).map((c) => ({
    id: c.id as string,
    fullName: c.full_name as string,
    firstName: (c.first_name as string | null) ?? null,
    lastName: (c.last_name as string | null) ?? null,
    email: (c.email as string | null) ?? null,
    phone: (c.phone as string | null) ?? null,
    avatarUrl: (c.avatar_url as string | null) ?? null,
    portalAccess: !!c.profile_id,
  }));
}

export async function fetchEntityInfo(entityId: string): Promise<EntityInfo | null> {
  const supabase = createServiceClient();

  const { data, error } = await (supabase as any)
    .from('entities')
    .select('id, name, type')
    .eq('id', entityId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id as string,
    name: data.name as string,
    type: (data.type as string | null) ?? null,
  };
}

export async function fetchPrimaryContactIdForEntity(entityId: string): Promise<string | null> {
  const supabase = createServiceClient();

  const { data, error } = await (supabase as any)
    .from('contacts')
    .select('id')
    .eq('entity_id', entityId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data.id as string;
}
