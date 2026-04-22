import { createClient } from "@/lib/supabase/server";
import { getShowTestData } from "./test-data";

export type OwnerStatus = "active" | "invited" | "not_invited" | "setting_up";

/** A row in the /admin/owners list view. One row per owner profile. */
export type OwnerRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  entityId: string | null;
  entityName: string | null;
  /** primary = first member of entity by created_at, co_owner = later, solo = no entity */
  entityMemberRole: "primary" | "co_owner" | "solo";
  propertyCount: number;
  status: OwnerStatus;
  /** ISO from profiles.created_at */
  addedAt: string;
};

/**
 * Returns one row per owner profile for the admin owners list page.
 *
 * Status derivation (no launchpad table available — launchpad progress is
 * surfaced as properties.setup_status, not a per-owner percentage):
 *
 *   - `not_invited` — email ends with `@pending.theparcelco.com`. These
 *     owners were added by admin but have not accepted an invite yet.
 *   - `setting_up` — real email, has at least 1 property, but
 *     `onboarding_completed_at IS NULL`. Still working through onboarding.
 *   - `active` — real email AND `onboarding_completed_at IS NOT NULL`.
 *     Also treated as active when the owner has >=1 property even if the
 *     onboarding flag somehow never got stamped, to avoid stranding real
 *     working accounts as "invited" forever.
 *   - `invited` — real email but zero properties. Signed up, not yet
 *     populated.
 *
 * Property count includes both primary ownership (properties.owner_id) and
 * co-ownership (property_owners junction). Each property is counted once
 * even if the owner appears in both.
 */
export async function fetchAdminOwnersList(): Promise<OwnerRow[]> {
  const supabase = await createClient();
  const showTestData = await getShowTestData();

  const profilesQuery = supabase
    .from("profiles")
    .select(
      "id, full_name, email, phone, avatar_url, created_at, onboarding_completed_at, entity_id",
    )
    .eq("role", "owner")
    .order("created_at", { ascending: true });

  const filteredProfilesQuery = showTestData
    ? profilesQuery
    : profilesQuery.not("id", "like", "0000%");

  const [
    { data: profiles },
    { data: entities },
    { data: properties },
    { data: coOwned },
  ] = await Promise.all([
    filteredProfilesQuery,
    supabase.from("entities").select("id, name"),
    supabase.from("properties").select("id, owner_id"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("property_owners").select("owner_id, property_id") as Promise<{
      data: Array<{ owner_id: string; property_id: string }> | null;
    }>,
  ]);

  // Lookup entity name by id
  const entityNameById = new Map<string, string>();
  for (const e of entities ?? []) {
    entityNameById.set(e.id, e.name);
  }

  // Property count per owner (deduped across primary + co-owner sources)
  const propertyIdsByOwner = new Map<string, Set<string>>();
  for (const prop of properties ?? []) {
    if (!propertyIdsByOwner.has(prop.owner_id)) {
      propertyIdsByOwner.set(prop.owner_id, new Set());
    }
    propertyIdsByOwner.get(prop.owner_id)!.add(prop.id);
  }
  for (const link of coOwned ?? []) {
    if (!propertyIdsByOwner.has(link.owner_id)) {
      propertyIdsByOwner.set(link.owner_id, new Set());
    }
    propertyIdsByOwner.get(link.owner_id)!.add(link.property_id);
  }

  // Determine primary vs co_owner by finding the oldest profile per entity.
  // We ordered profiles by created_at ASC above, so the first profile we see
  // for a given entity is the primary.
  const primaryProfileByEntity = new Map<string, string>();
  for (const p of profiles ?? []) {
    if (!p.entity_id) continue;
    if (!primaryProfileByEntity.has(p.entity_id)) {
      primaryProfileByEntity.set(p.entity_id, p.id);
    }
  }

  const isPending = (email: string) =>
    email.endsWith("@pending.theparcelco.com");

  const rows: OwnerRow[] = (profiles ?? []).map((p) => {
    const fullName = p.full_name?.trim() || p.email || "(unknown)";
    const propertyCount = propertyIdsByOwner.get(p.id)?.size ?? 0;
    const pending = isPending(p.email);

    let status: OwnerStatus;
    if (pending) {
      status = "not_invited";
    } else if (p.onboarding_completed_at) {
      status = "active";
    } else if (propertyCount > 0) {
      // Has properties but onboarding not marked complete. Two ways to read
      // this: treat as setting_up (still onboarding) or active (property is
      // real and live). We go with `setting_up` — more accurate for the
      // admin workflow because it surfaces rows that still need attention.
      status = "setting_up";
    } else {
      status = "invited";
    }

    let entityMemberRole: OwnerRow["entityMemberRole"];
    if (!p.entity_id) {
      entityMemberRole = "solo";
    } else if (primaryProfileByEntity.get(p.entity_id) === p.id) {
      entityMemberRole = "primary";
    } else {
      entityMemberRole = "co_owner";
    }

    return {
      id: p.id,
      fullName,
      email: p.email,
      phone: p.phone ?? null,
      avatarUrl: p.avatar_url ?? null,
      entityId: p.entity_id ?? null,
      entityName: p.entity_id ? entityNameById.get(p.entity_id) ?? null : null,
      entityMemberRole,
      propertyCount,
      status,
      addedAt: p.created_at,
    };
  });

  return rows;
}
