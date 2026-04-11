import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { OwnerListPanel, type EntityRow } from "./OwnerListPanel";

export default async function OwnersLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  // Fetch all owner profiles, their entities, and property counts
  const [{ data: profiles }, { data: entities }, { data: properties }, { data: coOwned }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, created_at, onboarding_completed_at, entity_id")
        .eq("role", "owner")
        .order("created_at", { ascending: true }),
      supabase
        .from("entities")
        .select("id, name, type")
        .order("name", { ascending: true }),
      supabase.from("properties").select("id, owner_id"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from("property_owners").select("owner_id, property_id") as Promise<{
        data: Array<{ owner_id: string; property_id: string }> | null;
      }>,
    ]);

  // Map profile_id -> entity_id
  const profileToEntity = new Map<string, string>();
  for (const p of profiles ?? []) {
    if (p.entity_id) profileToEntity.set(p.id, p.entity_id);
  }

  // Group profiles by entity_id
  const entityMembers = new Map<string, typeof profiles>();
  for (const p of profiles ?? []) {
    if (!p.entity_id) continue;
    const list = entityMembers.get(p.entity_id) ?? [];
    list.push(p);
    entityMembers.set(p.entity_id, list);
  }

  // Compute property counts per entity (across all member profiles)
  const entityProperties = new Map<string, Set<string>>();

  // Primary ownership via properties.owner_id
  for (const prop of properties ?? []) {
    const entityId = profileToEntity.get(prop.owner_id);
    if (!entityId) continue;
    if (!entityProperties.has(entityId)) entityProperties.set(entityId, new Set());
    entityProperties.get(entityId)!.add(prop.id);
  }

  // Co-ownership via property_owners junction
  for (const po of coOwned ?? []) {
    const entityId = profileToEntity.get(po.owner_id);
    if (!entityId) continue;
    if (!entityProperties.has(entityId)) entityProperties.set(entityId, new Set());
    entityProperties.get(entityId)!.add(po.property_id);
  }

  const isPending = (email: string) => email.endsWith("@pending.theparcelco.com");

  // Build entity rows
  const entityList: EntityRow[] = (entities ?? []).map((entity) => {
    const members = entityMembers.get(entity.id) ?? [];
    const primary = members[0];
    const allOnboarded = members.every((m) => !!m?.onboarding_completed_at);
    const allPending = members.every((m) => isPending(m?.email ?? ""));

    return {
      id: entity.id,
      name: entity.name,
      type: entity.type,
      memberCount: members.length,
      primaryMemberName: primary?.full_name?.trim() || null,
      primaryEmail: primary?.email ?? "",
      propertyCount: entityProperties.get(entity.id)?.size ?? 0,
      onboarded: allOnboarded,
      pending: allPending,
    };
  }).filter((e) => e.memberCount > 0); // Hide entities with no members

  return (
    <div className="flex min-h-screen">
      <OwnerListPanel entities={entityList} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
