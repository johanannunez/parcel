"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/supabase";
import type { LifecycleStage } from "@/lib/admin/contact-types";

type ContactUpdate = Database["public"]["Tables"]["contacts"]["Update"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase: null as never, error: "You must be signed in." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { supabase: null as never, error: "Admin access required." };
  }

  return { supabase, error: null };
}

// ---------------------------------------------------------------------------
// Update client fields
// ---------------------------------------------------------------------------

type UpdateClientFields = Partial<{
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  estimatedMrr: number | null;
  assignedTo: string | null;
  lifecycleStage: LifecycleStage;
}>;

export async function updateClientFields(
  contactId: string,
  fields: UpdateClientFields
): Promise<{ ok: boolean; message: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };

  const update: ContactUpdate = {};
  if (fields.fullName !== undefined) update.full_name = fields.fullName;
  if (fields.email !== undefined) update.email = fields.email;
  if (fields.phone !== undefined) update.phone = fields.phone;
  if (fields.companyName !== undefined) update.company_name = fields.companyName;
  if (fields.estimatedMrr !== undefined) update.estimated_mrr = fields.estimatedMrr;
  if (fields.assignedTo !== undefined) update.assigned_to = fields.assignedTo;
  if (fields.lifecycleStage !== undefined) {
    update.lifecycle_stage =
      fields.lifecycleStage as Database["public"]["Enums"]["contact_lifecycle_stage"];
    update.stage_changed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("contacts")
    .update(update)
    .eq("id", contactId);

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/admin/clients/${contactId}`);
  revalidatePath("/admin/clients");
  return { ok: true, message: "Saved" };
}
