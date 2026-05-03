/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { propertyLabel } from "@/lib/address";
import type { EntityStatus } from "@/lib/admin/entity-detail-types";
import type {
  EntityDetailData,
  EntityDetailMember,
  EntityDetailProperty,
  EntityDetailActivityEntry,
  EntityDetailSwitcherRow,
  OverviewState,
} from "@/lib/admin/entity-detail-types";

export type {
  EntityDetailData,
  EntityDetailMember,
  EntityDetailProperty,
  EntityDetailActivityEntry,
  EntityDetailSwitcherRow,
  EntityDetailRecord,
} from "@/lib/admin/entity-detail-types";
export { formatMonthYear } from "@/lib/admin/entity-detail-types";

/**
 * Server-side data layer for the admin entity detail page. This
 * deliberately returns a compact shape suited to the entity shell: anything
 * the tabs need to render should flow through here, so the tab components
 * can stay as dumb presentational pieces.
 *
 * Heuristics worth calling out up front (documented in code so a future
 * reviewer doesn't have to dig):
 *
 *   Overview state (onboarding vs operating):
 *     - The Launchpad completion data is not tracked in a single table yet,
 *       so we approximate from the linked portal profile when one exists.
 *       Contact-only entities stay in onboarding until they have a portal
 *       profile and published properties.
 *
 *   Status pill:
 *     - `not_invited`  all members have `@pending.theparcelco.com` emails
 *     - `active`       every member has `onboarding_completed_at` stamped
 *     - `setting_up`   at least one property but onboarding not stamped
 *     - `invited`      fallback (real email, no properties)
 */

function deriveStatus({
  allPending,
  allOnboarded,
  propertyCount,
}: {
  allPending: boolean;
  allOnboarded: boolean;
  propertyCount: number;
}): EntityStatus {
  if (allPending) return "not_invited";
  if (allOnboarded) return "active";
  if (propertyCount > 0) return "setting_up";
  return "invited";
}

function deriveOverviewState(args: {
  lifecycleStage: string | null;
  primaryOnboarded: boolean;
  allPropertiesPublished: boolean;
}): OverviewState {
  const stage = args.lifecycleStage;
  if (
    stage === "lead_new" ||
    stage === "qualified" ||
    stage === "in_discussion" ||
    stage === "contract_sent"
  ) {
    return "lead";
  }
  if (stage === "paused" || stage === "churned") {
    return "dormant";
  }
  // Fall back to existing property/profile heuristic for onboarding vs operating.
  if (args.primaryOnboarded && args.allPropertiesPublished) return "operating";
  return "onboarding";
}

export async function fetchEntityDetail(entityId: string): Promise<EntityDetailData | null> {
  const supabase = await createClient();

  const [{ data: entity }, { data: profileMembers }] = await Promise.all([
    supabase
      .from("entities")
      .select("id, name, type, created_at")
      .eq("id", entityId)
      .single(),
    supabase
      .from("profiles")
      .select(
        "id, full_name, email, phone, avatar_url, created_at, onboarding_completed_at",
      )
      .eq("entity_id", entityId)
      .eq("role", "owner")
      .order("created_at", { ascending: true }),
  ]);

  if (!entity) {
    return null;
  }

  const profileIds = (profileMembers ?? []).map((m) => m.id);
  const [{ data: entityContacts }, { data: linkedContacts }] = await Promise.all([
    (supabase as any)
      .from("contacts")
      .select(
        "id, profile_id, full_name, email, phone, avatar_url, created_at, lifecycle_stage, stage_changed_at, source, source_detail, estimated_mrr, assigned_to",
      )
      .eq("entity_id", entityId)
      .order("created_at", { ascending: true }) as Promise<{
      data: Array<{
        id: string;
        profile_id: string | null;
        full_name: string | null;
        email: string | null;
        phone: string | null;
        avatar_url: string | null;
        created_at: string;
        lifecycle_stage: string | null;
        stage_changed_at: string | null;
        source: string | null;
        source_detail: string | null;
        estimated_mrr: number | null;
        assigned_to: string | null;
      }> | null;
    }>,
    profileIds.length > 0
      ? ((supabase as any)
          .from("contacts")
          .select(
            "id, profile_id, full_name, email, phone, avatar_url, created_at, lifecycle_stage, stage_changed_at, source, source_detail, estimated_mrr, assigned_to",
          )
          .in("profile_id", profileIds)
          .order("created_at", { ascending: true }) as Promise<{
          data: Array<{
            id: string;
            profile_id: string | null;
            full_name: string | null;
            email: string | null;
            phone: string | null;
            avatar_url: string | null;
            created_at: string;
            lifecycle_stage: string | null;
            stage_changed_at: string | null;
            source: string | null;
            source_detail: string | null;
            estimated_mrr: number | null;
            assigned_to: string | null;
          }> | null;
        }>)
      : Promise.resolve({ data: [] }),
  ]);

  const contactById = new Map<string, NonNullable<typeof entityContacts>[number]>();
  for (const contact of [...(entityContacts ?? []), ...(linkedContacts ?? [])]) {
    contactById.set(contact.id, contact);
  }
  const contacts = Array.from(contactById.values());

  const profileById = new Map((profileMembers ?? []).map((m) => [m.id, m]));
  const members = contacts.length > 0
    ? contacts.map((contact) => {
        const profile = contact.profile_id ? profileById.get(contact.profile_id) : null;
        return {
          id: contact.id,
          profileId: contact.profile_id,
          full_name: contact.full_name ?? profile?.full_name ?? contact.email ?? "Unnamed person",
          email: contact.email ?? profile?.email ?? "",
          phone: contact.phone ?? profile?.phone ?? null,
          avatar_url: contact.avatar_url ?? profile?.avatar_url ?? null,
          created_at: contact.created_at ?? profile?.created_at ?? entity.created_at,
          onboarding_completed_at: profile?.onboarding_completed_at ?? null,
          contact,
        };
      })
    : (profileMembers ?? []).map((profile) => ({
        id: profile.id,
        profileId: profile.id,
        full_name: profile.full_name ?? profile.email,
        email: profile.email,
        phone: profile.phone ?? null,
        avatar_url: profile.avatar_url ?? null,
        created_at: profile.created_at,
        onboarding_completed_at: profile.onboarding_completed_at ?? null,
        contact: null,
      }));

  if (members.length === 0) {
    return null;
  }

  const ownerProfileIds = Array.from(
    new Set(members.map((m) => m.profileId).filter((id): id is string => !!id)),
  );
  const contactIds = members.map((m) => m.id);
  const primaryRaw = members[0];

  const [{ data: primaryProps }, { data: coOwnedProps }] = await Promise.all([
    ownerProfileIds.length > 0
      ? supabase.from("properties").select("id").in("owner_id", ownerProfileIds)
      : Promise.resolve({ data: [] }),
    ownerProfileIds.length > 0
      ? ((supabase as any)
          .from("property_owners")
          .select("property_id")
          .in("owner_id", ownerProfileIds) as Promise<{
          data: Array<{ property_id: string }> | null;
        }>)
      : Promise.resolve({ data: [] }),
  ]);
  const propertyIds = Array.from(
    new Set([
      ...(primaryProps ?? []).map((p) => p.id),
      ...(coOwnedProps ?? []).map((p) => p.property_id),
    ]),
  );

  const propertiesPromise = propertyIds.length > 0
    ? supabase
        .from("properties")
        .select(
          "id, address_line1, address_line2, city, state, postal_code, active, setup_status, bedrooms, bathrooms, created_at",
        )
        .in("id", propertyIds)
        .order("created_at", { ascending: true })
    : Promise.resolve({ data: [] as any[] });

  const activityFilters = [
    ownerProfileIds.length > 0
      ? `and(entity_type.eq.profile,entity_id.in.(${ownerProfileIds.join(",")}))`
      : null,
    contactIds.length > 0
      ? `and(entity_type.eq.contact,entity_id.in.(${contactIds.join(",")}))`
      : null,
    propertyIds.length > 0
      ? `and(entity_type.eq.property,entity_id.in.(${propertyIds.join(",")}))`
      : null,
  ].filter(Boolean);

  const activityPromise = activityFilters.length > 0
    ? (supabase as any)
        .from("activity_log")
        .select("id, actor_id, action, entity_type, entity_id, metadata, created_at")
        .or(activityFilters.join(","))
        .order("created_at", { ascending: false })
        .limit(12)
    : Promise.resolve({ data: [] });

  const contactRow = primaryRaw.contact;

  const [{ data: properties }, { data: activityRaw }] =
    await Promise.all([propertiesPromise, activityPromise]);

  // Build the switcher list in the same pass so the identity band dropdown
  // can navigate between entities without another round trip.
  const [{ data: allEntities }, { data: allProfiles }, { data: allContacts }, { data: allProps }, { data: allCo }] =
    await Promise.all([
      supabase.from("entities").select("id, name, type"),
      supabase
        .from("profiles")
        .select("id, email, onboarding_completed_at, entity_id")
        .eq("role", "owner"),
      (supabase as any)
        .from("contacts")
        .select("id, email, profile_id, entity_id") as Promise<{
        data: Array<{ id: string; email: string | null; profile_id: string | null; entity_id: string | null }> | null;
      }>,
      supabase.from("properties").select("id, owner_id"),
      (supabase as any)
        .from("property_owners")
        .select("owner_id, property_id") as Promise<{
        data: Array<{ owner_id: string; property_id: string }> | null;
      }>,
    ]);

  const isPending = (email: string | null) =>
    !email || email.endsWith("@pending.theparcelco.com");

  const membersByEntity = new Map<string, Array<{ id: string; email: string | null; onboardedAt: string | null }>>();
  const profileOnboardedById = new Map(
    (allProfiles ?? []).map((p) => [p.id, p.onboarding_completed_at ?? null]),
  );
  const seenMembersByEntity = new Map<string, Set<string>>();
  const pushSwitcherMember = (
    entityIdForMember: string | null,
    member: { id: string; email: string | null; onboardedAt: string | null },
  ) => {
    if (!entityIdForMember) return;
    const dedupeKey = member.id;
    const seen = seenMembersByEntity.get(entityIdForMember) ?? new Set<string>();
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    seenMembersByEntity.set(entityIdForMember, seen);
    const arr = membersByEntity.get(entityIdForMember) ?? [];
    arr.push(member);
    membersByEntity.set(entityIdForMember, arr);
  };

  for (const c of allContacts ?? []) {
    pushSwitcherMember(c.entity_id, {
      id: c.profile_id ?? c.id,
      email: c.email,
      onboardedAt: c.profile_id ? profileOnboardedById.get(c.profile_id) ?? null : null,
    });
  }

  for (const p of allProfiles ?? []) {
    pushSwitcherMember(p.entity_id, {
      id: p.id,
      email: p.email,
      onboardedAt: p.onboarding_completed_at ?? null,
    });
  }

  const profileToEntity = new Map<string, string>();
  for (const p of allProfiles ?? []) {
    if (p.entity_id) profileToEntity.set(p.id, p.entity_id);
  }

  const entityPropIds = new Map<string, Set<string>>();
  for (const prop of allProps ?? []) {
    const eid = profileToEntity.get(prop.owner_id);
    if (!eid) continue;
    if (!entityPropIds.has(eid)) entityPropIds.set(eid, new Set());
    entityPropIds.get(eid)!.add(prop.id);
  }
  for (const link of allCo ?? []) {
    const eid = profileToEntity.get(link.owner_id);
    if (!eid) continue;
    if (!entityPropIds.has(eid)) entityPropIds.set(eid, new Set());
    entityPropIds.get(eid)!.add(link.property_id);
  }

  const switcher: EntityDetailSwitcherRow[] = (allEntities ?? [])
    .map((e) => {
      const memList = membersByEntity.get(e.id) ?? [];
      if (memList.length === 0) return null;
      const allPending = memList.every((m) => isPending(m.email));
      const allOnboarded = memList.every((m) => !!m.onboardedAt);
      const pc = entityPropIds.get(e.id)?.size ?? 0;
      return {
        id: e.id,
        name: e.name,
        type: e.type,
        memberCount: memList.length,
        propertyCount: pc,
        status: deriveStatus({
          allPending,
          allOnboarded,
          propertyCount: pc,
        }),
      };
    })
    .filter((v): v is EntityDetailSwitcherRow => v !== null);

  // Actor name lookup for the activity list
  const actorIdSet = new Set<string>();
  for (const a of (activityRaw ?? []) as Array<{ actor_id?: string | null }>) {
    if (a.actor_id) actorIdSet.add(a.actor_id);
  }
  const actorIds: string[] = Array.from(actorIdSet);
  const actorNameById = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: actors } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", actorIds);
    for (const a of actors ?? []) {
      actorNameById.set(a.id, a.full_name?.trim() || a.email || "Someone");
    }
  }

  const primaryMember: EntityDetailMember = {
    id: primaryRaw.id,
    fullName: primaryRaw.full_name?.trim() || primaryRaw.email,
    email: primaryRaw.email,
    phone: primaryRaw.phone ?? null,
    avatarUrl: primaryRaw.avatar_url ?? null,
    createdAt: primaryRaw.created_at,
    onboardingCompletedAt: primaryRaw.onboarding_completed_at ?? null,
    isPending: isPending(primaryRaw.email),
  };

  const membersOut: EntityDetailMember[] = members.map((m) => ({
    id: m.id,
    fullName: m.full_name?.trim() || m.email,
    email: m.email,
    phone: m.phone ?? null,
    avatarUrl: m.avatar_url ?? null,
    createdAt: m.created_at,
    onboardingCompletedAt: m.onboarding_completed_at ?? null,
    isPending: isPending(m.email),
  }));

  const propertiesOut: EntityDetailProperty[] = (properties ?? []).map((p: any) => ({
    id: p.id,
    label: propertyLabel(p),
    addressLine1: (p.address_line1 as string | null) ?? null,
    city: p.city ?? null,
    state: p.state ?? null,
    setupStatus: p.setup_status ?? "draft",
    active: !!p.active,
    bedrooms: p.bedrooms ?? null,
    bathrooms: p.bathrooms ?? null,
    createdAt: p.created_at,
  }));

  const allPending = membersOut.every((m) => m.isPending);
  const allOnboarded = membersOut.every((m) => !!m.onboardingCompletedAt);
  const propertyCount = propertiesOut.length;
  const status = deriveStatus({
    allPending,
    allOnboarded,
    propertyCount,
  });

  // Derive the 4-way overview state. contacts.lifecycle_stage wins when
  // present; property/profile heuristics are the fallback.
  const primaryOnboarded = !!primaryMember.onboardingCompletedAt;
  const allPropertiesPublished =
    propertiesOut.length > 0 &&
    propertiesOut.every((p) => p.setupStatus === "published");
  const overviewState: OverviewState = deriveOverviewState({
    lifecycleStage: contactRow?.lifecycle_stage ?? null,
    primaryOnboarded,
    allPropertiesPublished,
  });

  // Fetch assigned_to name if present on the contact row.
  let assignedToName: string | null = null;
  if (contactRow?.assigned_to) {
    const { data: assignee } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", contactRow.assigned_to)
      .maybeSingle();
    assignedToName = assignee?.full_name?.trim() || assignee?.email || null;
  }

  // Lifetime payouts for dormant contacts (sum of net_payout across all
  // properties owned by this entity).
  let lifetimePayouts: number | null = null;
  if (propertyIds.length > 0) {
    const { data: payoutsRaw } = await supabase
      .from("payouts")
      .select("net_payout")
      .in("property_id", propertyIds);
    if (payoutsRaw && payoutsRaw.length > 0) {
      lifetimePayouts = (payoutsRaw as Array<{ net_payout: number | null }>).reduce(
        (sum, p) => sum + (p.net_payout ?? 0),
        0,
      );
    }
  }

  // pausedAt: use stage_changed_at when stage is paused/churned.
  const pausedAt =
    contactRow?.lifecycle_stage === "paused" ||
    contactRow?.lifecycle_stage === "churned"
      ? (contactRow.stage_changed_at ?? null)
      : null;

  const activity: EntityDetailActivityEntry[] = (activityRaw ?? []).map(
    (a: any) => ({
      id: a.id,
      actorName: a.actor_id ? actorNameById.get(a.actor_id) ?? null : null,
      action: a.action,
      entityType: a.entity_type,
      entityId: a.entity_id ?? null,
      metadata: a.metadata ?? {},
      createdAt: a.created_at,
    }),
  );

  return {
    entity: {
      id: entity.id,
      name: entity.name,
      type: entity.type,
      createdAt: entity.created_at,
    },
    members: membersOut,
    primaryMember,
    properties: propertiesOut,
    propertyCount,
    activity,
    status,
    overviewState,
    switcher: switcher.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    ),
    // Contact-linked fields
    contactId: contactRow?.id ?? null,
    source: contactRow?.source ?? null,
    sourceDetail: contactRow?.source_detail ?? null,
    estimatedMrr: contactRow?.estimated_mrr ?? null,
    stageChangedAt: contactRow?.stage_changed_at ?? null,
    assignedTo: contactRow?.assigned_to ?? null,
    assignedToName,
    pausedAt,
    lifetimePayouts,
  };
}
