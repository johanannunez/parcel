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
 * Create a new workspace with its first person. Used for the Workspace-first admin
 * flow, where every owner relationship needs at least one person attached.
 */
export async function createWorkspace(args: {
  name: string;
  type?: "individual" | "llc" | "partnership" | "trust" | "s_corp" | "c_corp";
  ein?: string;
  firstPerson: {
    fullName: string;
    email?: string | null;
    phone?: string | null;
    relationshipRole?: "primary_owner" | "co_owner" | "spouse" | "accountant" | "manager" | "other";
    responsibilities?: Array<"day_to_day" | "finance" | "decision_maker" | "property_setup">;
    portalAccess?: "not_invited" | "invite_later";
  };
}) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const svc = createServiceClient();
  const workspaceName = args.name.trim();
  const personName = args.firstPerson.fullName.trim();

  if (!workspaceName) return { error: "Workspace name is required" };
  if (!personName) return { error: "First person is required" };

  const { data: workspace, error } = await svc
    .from("workspaces")
    .insert({
      name: workspaceName,
      type: args.type ?? "individual",
      ein: args.ein?.trim() || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const [firstName, ...lastNameParts] = personName.split(/\s+/);
  const lastName = lastNameParts.join(" ") || null;
  const personMetadata = {
    workspace_role: args.firstPerson.relationshipRole ?? "primary_owner",
    responsibilities: args.firstPerson.responsibilities?.length
      ? args.firstPerson.responsibilities
      : ["day_to_day"],
    portal_access: args.firstPerson.portalAccess ?? "not_invited",
  };

  const { data: person, error: personError } = await svc
    .from("contacts")
    .insert({
      full_name: personName,
      first_name: firstName || null,
      last_name: lastName,
      email: args.firstPerson.email?.trim() || null,
      phone: args.firstPerson.phone?.trim() || null,
      company_name: args.type === "individual" ? null : workspaceName,
      workspace_id: workspace.id,
      lifecycle_stage: "active_owner",
      source: "Admin",
      metadata: personMetadata,
    })
    .select("id")
    .single();

  if (personError || !person) {
    await svc.from("workspaces").delete().eq("id", workspace.id);
    return { error: personError?.message ?? "Failed to create first person" };
  }

  revalidatePath("/admin/workspaces");
  revalidatePath(`/admin/workspaces/${workspace.id}`);
  return { success: true, workspaceId: workspace.id, personId: person.id };
}

/**
 * Rename a Workspace or update its legal type, EIN, or notes.
 */
export async function updateWorkspace(args: {
  workspaceId: string;
  name?: string;
  type?: "individual" | "llc" | "partnership" | "trust" | "s_corp" | "c_corp";
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
    .from("workspaces")
    .update(updates)
    .eq("id", args.workspaceId);

  if (error) return { error: error.message };

  revalidatePath("/admin/workspaces");
  revalidatePath(`/admin/workspaces/${args.workspaceId}`);
  return { success: true };
}

/**
 * Move a profile from its current workspace to a different one.
 * Use this to merge profiles into a business workspace.
 */
export async function linkProfileToWorkspace(args: {
  profileId: string;
  workspaceId: string;
}) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const svc = createServiceClient();

  // Get the current workspace_id of this profile
  const { data: profile } = await svc
    .from("profiles")
    .select("workspace_id")
    .eq("id", args.profileId)
    .single();

  const oldWorkspaceId = profile?.workspace_id;

  // Move the profile to the new workspace
  const { error } = await svc
    .from("profiles")
    .update({ workspace_id: args.workspaceId })
    .eq("id", args.profileId);

  if (error) return { error: error.message };

  // If the old workspace is now empty, delete it (cleanup)
  if (oldWorkspaceId && oldWorkspaceId !== args.workspaceId) {
    const { count } = await svc
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", oldWorkspaceId);

    if ((count ?? 0) === 0) {
      await svc.from("workspaces").delete().eq("id", oldWorkspaceId);
    }
  }

  revalidatePath("/admin/workspaces");
  revalidatePath(`/admin/workspaces/${args.workspaceId}`);
  return { success: true };
}

/**
 * Remove a profile from its current workspace. Creates a fresh one-person
 * workspace for that profile (so they don't end up orphaned).
 */
export async function unlinkProfileFromWorkspace(args: { profileId: string }) {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error };

  const svc = createServiceClient();

  const { data: profile } = await svc
    .from("profiles")
    .select("id, full_name, email, workspace_id")
    .eq("id", args.profileId)
    .single();

  if (!profile) return { error: "Profile not found" };

  const oldWorkspaceId = profile.workspace_id;

  // Create a fresh one-person workspace for this profile
  const { data: newWorkspace, error: createErr } = await svc
    .from("workspaces")
    .insert({
      name: profile.full_name?.trim() || profile.email,
      type: "individual",
    })
    .select("id")
    .single();

  if (createErr || !newWorkspace) return { error: createErr?.message ?? "Failed to create workspace" };

  // Link the profile to the new workspace
  const { error: linkErr } = await svc
    .from("profiles")
    .update({ workspace_id: newWorkspace.id })
    .eq("id", args.profileId);

  if (linkErr) return { error: linkErr.message };

  // Clean up old workspace if empty
  if (oldWorkspaceId) {
    const { count } = await svc
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", oldWorkspaceId);

    if ((count ?? 0) === 0) {
      await svc.from("workspaces").delete().eq("id", oldWorkspaceId);
    }
  }

  revalidatePath("/admin/workspaces");
  return { success: true, newWorkspaceId: newWorkspace.id };
}

/**
 * Get all owner profiles (for workspace member picker).
 */
export async function getAllOwnerProfiles() {
  const auth = await requireAdmin();
  if ("error" in auth) return { error: auth.error, profiles: [] };

  const svc = createServiceClient();
  const { data } = await svc
    .from("profiles")
    .select("id, full_name, email, workspace_id")
    .eq("role", "owner")
    .order("full_name");

  return { profiles: data ?? [] };
}
