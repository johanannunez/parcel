"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/**
 * owner_facts v1 write path: internal notes card on the Settings tab.
 *
 * Behavior is intentionally simple:
 *   - If the owner has at least one existing manual fact, update the most
 *     recent one.
 *   - Otherwise insert a new manual fact row.
 *
 * Manual facts always have source_type = 'manual' and confidence = 1.0.
 * Pinned/category/expires_at are left at their defaults until v2.
 */

const SaveSchema = z.object({
  ownerId: z.string().uuid(),
  text: z.string().trim().max(4000),
});

export type SaveInternalNoteResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function saveInternalNote(
  ownerId: string,
  text: string,
): Promise<SaveInternalNoteResult> {
  const parsed = SaveSchema.safeParse({ ownerId, text });
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ?? "Note is too long or malformed.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const { data: actingProfile } = await supabase
    .from("profiles")
    .select("role, workspace_id")
    .eq("id", user.id)
    .maybeSingle();
  if (actingProfile?.role !== "admin") {
    return { ok: false, error: "Admin access required." };
  }

  // Find the owner's Workspace for revalidation later.
  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("workspace_id")
    .eq("id", parsed.data.ownerId)
    .maybeSingle();

  // Is there an existing manual fact we should update?
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from("owner_facts")
    .select("id")
    .eq("owner_id", parsed.data.ownerId)
    .eq("source_type", "manual")
    .eq("suppressed", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // If the text is empty and nothing exists yet, nothing to do.
  if (!existing && parsed.data.text === "") {
    return { ok: true, id: "" };
  }

  // If the text is empty and something exists, soft-suppress it.
  if (existing && parsed.data.text === "") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("owner_facts")
      .update({ suppressed: true, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
    if (ownerProfile?.workspace_id) {
      revalidatePath(`/admin/workspaces/${ownerProfile.workspace_id}`);
    }
    return { ok: true, id: existing.id };
  }

  if (existing) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("owner_facts")
      .update({
        text: parsed.data.text,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
    if (ownerProfile?.workspace_id) {
      revalidatePath(`/admin/workspaces/${ownerProfile.workspace_id}`);
    }
    return { ok: true, id: existing.id };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted, error } = await (supabase as any)
    .from("owner_facts")
    .insert({
      owner_id: parsed.data.ownerId,
      text: parsed.data.text,
      source_type: "manual",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { ok: false, error: error?.message ?? "Could not save note." };
  }

  if (ownerProfile?.workspace_id) {
    revalidatePath(`/admin/workspaces/${ownerProfile.workspace_id}`);
  }
  return { ok: true, id: inserted.id };
}

/**
 * Server-side fetch for the current manual note, used to pre-fill the textarea.
 * Admin-only via RLS. Returns null if no note exists yet.
 */
export async function fetchInternalNote(
  ownerId: string,
): Promise<{
  text: string;
  updatedAt: string;
  createdByName: string | null;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: actingProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (actingProfile?.role !== "admin") return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row } = await (supabase as any)
    .from("owner_facts")
    .select("text, updated_at, created_by")
    .eq("owner_id", ownerId)
    .eq("source_type", "manual")
    .eq("suppressed", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) return null;

  let createdByName: string | null = null;
  if (row.created_by) {
    const { data: creator } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", row.created_by)
      .maybeSingle();
    createdByName =
      creator?.full_name?.trim() || creator?.email || null;
  }

  return {
    text: row.text ?? "",
    updatedAt: row.updated_at,
    createdByName,
  };
}
