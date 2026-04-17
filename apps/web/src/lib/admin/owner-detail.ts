/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { propertyLabel } from "@/lib/address";
import type { OwnerStatus } from "@/lib/admin/owners-list";

/**
 * Server-side data layer for the new admin owner detail page. This
 * deliberately returns a compact shape suited to the six-tab shell: anything
 * the tabs need to render should flow through here, so the tab components
 * can stay as dumb presentational pieces.
 *
 * Heuristics worth calling out up front (documented in code so a future
 * reviewer doesn't have to dig):
 *
 *   Overview state (onboarding vs operating):
 *     - The Launchpad completion data isn't tracked in a single table yet,
 *       so we approximate: an owner is "onboarding" if the primary profile
 *       has `onboarding_completed_at IS NULL` OR any of their properties
 *       have a `setup_status` other than `published`. Otherwise the owner
 *       is "operating".
 *
 *   Status pill (reused from the owners-list derivation):
 *     - `not_invited`  all members have `@pending.theparcelco.com` emails
 *     - `active`       every member has `onboarding_completed_at` stamped
 *     - `setting_up`   at least one property but onboarding not stamped
 *     - `invited`      fallback (real email, no properties)
 */

export type OwnerDetailMember = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string;
  onboardingCompletedAt: string | null;
  isPending: boolean;
};

export type OwnerDetailProperty = {
  id: string;
  label: string;
  city: string | null;
  state: string | null;
  setupStatus: string;
  active: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  createdAt: string;
};

export type OwnerDetailActivityEntry = {
  id: string;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type OwnerDetailEntity = {
  id: string;
  name: string;
  type: string;
  createdAt: string;
};

export type OwnerDetailSwitcherRow = {
  id: string;
  name: string;
  type: string;
  memberCount: number;
  propertyCount: number;
  status: OwnerStatus;
};

export type OwnerDetailData = {
  entity: OwnerDetailEntity;
  members: OwnerDetailMember[];
  primaryMember: OwnerDetailMember;
  properties: OwnerDetailProperty[];
  propertyCount: number;
  activity: OwnerDetailActivityEntry[];
  status: OwnerStatus;
  overviewState: "onboarding" | "operating";
  switcher: OwnerDetailSwitcherRow[];
};

function deriveStatus({
  allPending,
  allOnboarded,
  propertyCount,
}: {
  allPending: boolean;
  allOnboarded: boolean;
  propertyCount: number;
}): OwnerStatus {
  if (allPending) return "not_invited";
  if (allOnboarded) return "active";
  if (propertyCount > 0) return "setting_up";
  return "invited";
}

export async function fetchOwnerDetail(entityId: string): Promise<OwnerDetailData | null> {
  const supabase = await createClient();

  const [{ data: entity }, { data: members }] = await Promise.all([
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

  if (!entity || !members || members.length === 0) {
    return null;
  }

  const memberIds = members.map((m) => m.id);
  const primaryRaw = members[0];

  const [{ data: primaryProps }, { data: coOwnedProps }] = await Promise.all([
    supabase.from("properties").select("id").in("owner_id", memberIds),
    (supabase as any)
      .from("property_owners")
      .select("property_id")
      .in("owner_id", memberIds) as Promise<{
      data: Array<{ property_id: string }> | null;
    }>,
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

  const activityPromise = (supabase as any)
    .from("activity_log")
    .select("id, actor_id, action, entity_type, entity_id, metadata, created_at")
    .or(
      [
        `and(entity_type.eq.profile,entity_id.in.(${memberIds.join(",")}))`,
        propertyIds.length > 0
          ? `and(entity_type.eq.property,entity_id.in.(${propertyIds.join(",")}))`
          : null,
      ]
        .filter(Boolean)
        .join(","),
    )
    .order("created_at", { ascending: false })
    .limit(12);

  const [{ data: properties }, { data: activityRaw }] = await Promise.all([
    propertiesPromise,
    activityPromise,
  ]);

  // Build the switcher list in the same pass (so the identity-band dropdown
  // can navigate between owners without another round trip on the client).
  const [{ data: allEntities }, { data: allProfiles }, { data: allProps }, { data: allCo }] =
    await Promise.all([
      supabase.from("entities").select("id, name, type"),
      supabase
        .from("profiles")
        .select("id, email, onboarding_completed_at, entity_id")
        .eq("role", "owner"),
      supabase.from("properties").select("id, owner_id"),
      (supabase as any)
        .from("property_owners")
        .select("owner_id, property_id") as Promise<{
        data: Array<{ owner_id: string; property_id: string }> | null;
      }>,
    ]);

  const isPending = (email: string) =>
    email.endsWith("@pending.theparcelco.com");

  const membersByEntity = new Map<string, Array<{ id: string; email: string; onboardedAt: string | null }>>();
  for (const p of allProfiles ?? []) {
    if (!p.entity_id) continue;
    const arr = membersByEntity.get(p.entity_id) ?? [];
    arr.push({
      id: p.id,
      email: p.email,
      onboardedAt: p.onboarding_completed_at ?? null,
    });
    membersByEntity.set(p.entity_id, arr);
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

  const switcher: OwnerDetailSwitcherRow[] = (allEntities ?? [])
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
    .filter((v): v is OwnerDetailSwitcherRow => v !== null);

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

  const primaryMember: OwnerDetailMember = {
    id: primaryRaw.id,
    fullName: primaryRaw.full_name?.trim() || primaryRaw.email,
    email: primaryRaw.email,
    phone: primaryRaw.phone ?? null,
    avatarUrl: primaryRaw.avatar_url ?? null,
    createdAt: primaryRaw.created_at,
    onboardingCompletedAt: primaryRaw.onboarding_completed_at ?? null,
    isPending: isPending(primaryRaw.email),
  };

  const membersOut: OwnerDetailMember[] = members.map((m) => ({
    id: m.id,
    fullName: m.full_name?.trim() || m.email,
    email: m.email,
    phone: m.phone ?? null,
    avatarUrl: m.avatar_url ?? null,
    createdAt: m.created_at,
    onboardingCompletedAt: m.onboarding_completed_at ?? null,
    isPending: isPending(m.email),
  }));

  const propertiesOut: OwnerDetailProperty[] = (properties ?? []).map((p: any) => ({
    id: p.id,
    label: propertyLabel(p),
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

  // Onboarding state if primary hasn't completed onboarding OR any property
  // isn't published. This matches the spec threshold (any property below
  // "complete" Launchpad flips the whole owner into onboarding mode).
  const primaryOnboarded = !!primaryMember.onboardingCompletedAt;
  const allPropertiesPublished =
    propertiesOut.length > 0 &&
    propertiesOut.every((p) => p.setupStatus === "published");
  const overviewState: "onboarding" | "operating" =
    primaryOnboarded && allPropertiesPublished ? "operating" : "onboarding";

  const activity: OwnerDetailActivityEntry[] = (activityRaw ?? []).map(
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
  };
}

/** Short month/year label: "Apr 2026". */
export function formatMonthYear(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}
