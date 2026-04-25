"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/supabase";
import type { AddressComponents, SocialLinks } from "@/lib/admin/client-detail";

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
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  assignedTo: string | null;
  lifecycleStage: Database["public"]["Enums"]["contact_lifecycle_stage"];
  addressFormatted: string;
  addressComponents: AddressComponents;
  social: SocialLinks;
  preferredContactMethod: 'email' | 'phone' | 'text' | null;
  contractStartAt: string | null;
  contractEndAt: string | null;
  nextFollowUpAt: string | null;
  totalPropertiesOwned: number | null;
  newsletterSubscribed: boolean;
  managementFeePercent: number | null;
}>;

export async function updateClientFields(
  contactId: string,
  fields: UpdateClientFields
): Promise<{ ok: boolean; message: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };

  const update: ContactUpdate & Record<string, unknown> = {};

  if (fields.firstName !== undefined || fields.lastName !== undefined) {
    const firstName = fields.firstName ?? '';
    const lastName = fields.lastName ?? '';
    update.full_name = [firstName, lastName].filter(Boolean).join(' ') || firstName;
  }

  if (fields.email !== undefined) update.email = fields.email;
  if (fields.phone !== undefined) update.phone = fields.phone;
  if (fields.companyName !== undefined) update.company_name = fields.companyName;
  if (fields.managementFeePercent !== undefined) update.management_fee_percent = fields.managementFeePercent;
  if (fields.assignedTo !== undefined) update.assigned_to = fields.assignedTo;
  if (fields.lifecycleStage !== undefined) {
    update.lifecycle_stage = fields.lifecycleStage;
    update.stage_changed_at = new Date().toISOString();
  }
  if (fields.addressFormatted !== undefined) update.address_formatted = fields.addressFormatted;
  if (fields.addressComponents !== undefined) update.address_components = fields.addressComponents;
  if (fields.social !== undefined) update.social = fields.social;
  if (fields.preferredContactMethod !== undefined) update.preferred_contact_method = fields.preferredContactMethod;
  if (fields.contractStartAt !== undefined) update.contract_start_at = fields.contractStartAt;
  if (fields.contractEndAt !== undefined) update.contract_end_at = fields.contractEndAt;
  if (fields.nextFollowUpAt !== undefined) update.next_follow_up_at = fields.nextFollowUpAt;
  if (fields.totalPropertiesOwned !== undefined) update.total_properties_owned = fields.totalPropertiesOwned;
  if (fields.newsletterSubscribed !== undefined) update.newsletter_subscribed = fields.newsletterSubscribed;

  const { error } = await (supabase as any)
    .from("contacts")
    .update(update)
    .eq("id", contactId);

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/admin/clients/${contactId}`);
  revalidatePath("/admin/clients");
  return { ok: true, message: "Saved" };
}

// ---------------------------------------------------------------------------
// Admin profiles (for assignee picker)
// ---------------------------------------------------------------------------

export type AdminProfile = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
};

export async function fetchAdminProfiles(): Promise<AdminProfile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("role", "admin")
    .order("full_name");
  return (data ?? []).map((p) => ({
    id: p.id,
    fullName: p.full_name ?? '',
    avatarUrl: (p.avatar_url as string | null) ?? null,
  }));
}
