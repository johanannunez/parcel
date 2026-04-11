"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return { error: "Admins only" as const };
  return { user };
}

/**
 * Create a new entity. Used when grouping standalone profiles into a business.
 */
export async function createEntity(args: {
  name: string;
  type?: "individual" | "llc" | "partnership" | "trust" | "corporation";
  ein?: string;
}) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("entities")
    .insert({
      name: args.name.trim(),
      type: args.type ?? "individual",
      ein: args.ein?.trim() || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/owners");
  return { success: true, entityId: data.id };
}

/**
 * Rename an entity or update its type / EIN / notes.
 */
export async function updateEntity(args: {
  entityId: string;
  name?: string;
  type?: "individual" | "llc" | "partnership" | "trust" | "corporation";
  ein?: string | null;
  notes?: string | null;
}) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const svc = createServiceClient();
  const updates: {
    name?: string;
    type?: string;
    ein?: string | null;
    notes?: string | null;
    updated_at: string;
  } = { updated_at: new Date().toISOString() };
  if (args.name !== undefined) updates.name = args.name.trim();
  if (args.type !== undefined) updates.type = args.type;
  if (args.ein !== undefined) updates.ein = args.ein?.trim() || null;
  if (args.notes !== undefined) updates.notes = args.notes;

  const { error } = await svc
    .from("entities")
    .update(updates)
    .eq("id", args.entityId);

  if (error) return { error: error.message };

  revalidatePath("/admin/owners");
  revalidatePath(`/admin/owners/${args.entityId}`);
  return { success: true };
}

/**
 * Move a profile from its current entity to a different one.
 * Use this to merge profiles into a business entity.
 */
export async function linkProfileToEntity(args: {
  profileId: string;
  entityId: string;
}) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const svc = createServiceClient();

  // Get the current entity_id of this profile
  const { data: profile } = await svc
    .from("profiles")
    .select("entity_id")
    .eq("id", args.profileId)
    .single();

  const oldEntityId = profile?.entity_id;

  // Move the profile to the new entity
  const { error } = await svc
    .from("profiles")
    .update({ entity_id: args.entityId })
    .eq("id", args.profileId);

  if (error) return { error: error.message };

  // If the old entity is now empty, delete it (cleanup)
  if (oldEntityId && oldEntityId !== args.entityId) {
    const { count } = await svc
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("entity_id", oldEntityId);

    if ((count ?? 0) === 0) {
      await svc.from("entities").delete().eq("id", oldEntityId);
    }
  }

  revalidatePath("/admin/owners");
  revalidatePath(`/admin/owners/${args.entityId}`);
  return { success: true };
}

/**
 * Remove a profile from its current entity. Creates a fresh one-person
 * entity for that profile (so they don't end up orphaned).
 */
export async function unlinkProfileFromEntity(args: { profileId: string }) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const svc = createServiceClient();

  const { data: profile } = await svc
    .from("profiles")
    .select("id, full_name, email, entity_id")
    .eq("id", args.profileId)
    .single();

  if (!profile) return { error: "Profile not found" };

  const oldEntityId = profile.entity_id;

  // Create a fresh one-person entity for this profile
  const { data: newEntity, error: createErr } = await svc
    .from("entities")
    .insert({
      name: profile.full_name?.trim() || profile.email,
      type: "individual",
    })
    .select("id")
    .single();

  if (createErr || !newEntity) return { error: createErr?.message ?? "Failed to create entity" };

  // Link the profile to the new entity
  const { error: linkErr } = await svc
    .from("profiles")
    .update({ entity_id: newEntity.id })
    .eq("id", args.profileId);

  if (linkErr) return { error: linkErr.message };

  // Clean up old entity if empty
  if (oldEntityId) {
    const { count } = await svc
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("entity_id", oldEntityId);

    if ((count ?? 0) === 0) {
      await svc.from("entities").delete().eq("id", oldEntityId);
    }
  }

  revalidatePath("/admin/owners");
  return { success: true, newEntityId: newEntity.id };
}

/**
 * Get all owner profiles (for entity member picker).
 */
export async function getAllOwnerProfiles() {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error, profiles: [] };

  const svc = createServiceClient();
  const { data } = await svc
    .from("profiles")
    .select("id, full_name, email, entity_id")
    .eq("role", "owner")
    .order("full_name");

  return { profiles: data ?? [] };
}
