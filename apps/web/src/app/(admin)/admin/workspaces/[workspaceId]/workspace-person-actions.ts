"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/supabase";
import type { AddressComponents, SocialLinks } from "@/lib/admin/workspace-contact-detail";

type ContactUpdate = Database["public"]["Tables"]["contacts"]["Update"];
type QueryError = { message: string };
type QueryResult<T> = { data: T | null; error: QueryError | null; count?: number | null };
type QueryBuilder<T> = PromiseLike<QueryResult<T>> & {
  select(columns?: string, options?: { count?: "exact"; head?: boolean }): QueryBuilder<T>;
  update(values: Record<string, unknown>): QueryBuilder<T>;
  insert(values: Record<string, unknown>): QueryBuilder<T>;
  eq(column: string, value: string): QueryBuilder<T>;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder<T>;
  limit(count: number): QueryBuilder<T>;
  single(): Promise<QueryResult<T>>;
  maybeSingle(): Promise<QueryResult<T>>;
};
type UntypedDatabaseClient = {
  from<T = unknown>(table: string): QueryBuilder<T>;
};

function untypedDatabase(client: unknown): UntypedDatabaseClient {
  return client as UntypedDatabaseClient;
}

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
// Update workspace person fields
// ---------------------------------------------------------------------------

type UpdateWorkspaceContactFields = Partial<{
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
  preferredContactMethod: 'email' | 'phone' | 'text' | 'whatsapp' | null;
  contractStartAt: string | null;
  contractEndAt: string | null;
  nextFollowUpAt: string | null;
  totalPropertiesOwned: number | null;
  newsletterSubscribed: boolean;
  managementFeePercent: number | null;
}>;

export async function updateWorkspaceContactFields(
  contactId: string,
  fields: UpdateWorkspaceContactFields
): Promise<{ ok: boolean; message: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };

  const update: ContactUpdate & Record<string, unknown> = {};

  if (fields.firstName !== undefined || fields.lastName !== undefined) {
    const firstName = fields.firstName ?? '';
    const lastName = fields.lastName ?? '';
    update.full_name = [firstName, lastName].filter(Boolean).join(' ') || firstName;
    if (fields.firstName !== undefined) update.first_name = fields.firstName || null;
    if (fields.lastName !== undefined) update.last_name = fields.lastName || null;
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

  const db = untypedDatabase(supabase);
  const { error } = await db
    .from("contacts")
    .update(update)
    .eq("id", contactId);

  if (error) return { ok: false, message: error.message };

  // Sync name and phone to the linked profile so the Settings tab stays in sync.
  const nameOrPhoneChanged =
    fields.firstName !== undefined ||
    fields.lastName !== undefined ||
    fields.phone !== undefined;

  if (nameOrPhoneChanged) {
    const { data: contactRow } = await db
      .from<{ profile_id: string | null }>("contacts")
      .select("profile_id")
      .eq("id", contactId)
      .single();

    const profileId = contactRow?.profile_id ?? null;
    if (profileId) {
      const profileUpdate: Record<string, unknown> = {};
      if (update.full_name !== undefined) profileUpdate.full_name = update.full_name;
      if (update.phone !== undefined) profileUpdate.phone = update.phone;
      if (Object.keys(profileUpdate).length > 0) {
        await db.from("profiles").update(profileUpdate).eq("id", profileId);
      }
    }
  }

  revalidatePath(`/admin/workspaces/${contactId}`);
  revalidatePath("/admin/workspaces");
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

// ---------------------------------------------------------------------------
// Email change with portal verification
// ---------------------------------------------------------------------------

const BRAND_FROM = '"The Parcel Company" <hello@theparcelco.com>';

const LOGO_URL = "https://www.theparcelco.com/brand/logo-full-color.png";

function buildEmailChangeHtml(magicLink: string, newEmail: string): string {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#F9F7F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1C1A17;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F9F7F4;padding:40px 16px;"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(28,26,23,0.06);">
<tr><td align="center" style="padding:32px 32px 8px 32px;background:#F9F7F4;">
<img src="${LOGO_URL}" alt="The Parcel Company" width="180" style="display:block;border:0;outline:none;max-width:180px;height:auto;">
</td></tr>
<tr><td style="padding:32px 40px 8px 40px;">
<h1 style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.3;color:#1C1A17;font-weight:500;">Your account email has been updated</h1>
<p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#4a4641;">Your Parcel owner portal account email has been changed to:</p>
<div style="background:#F9F7F4;border-radius:8px;padding:12px 16px;margin:0 0 20px 0;font-size:15px;font-weight:600;color:#1C1A17;">${newEmail}</div>
<p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#4a4641;">Click the button below to verify this address and sign in to your owner portal.</p>
<a href="${magicLink}" style="display:inline-block;background:#1b77be;color:#FFFFFF;font-size:14px;font-weight:600;padding:13px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.01em;">
  Verify email
</a>
</td></tr>
<tr><td style="padding:24px 40px 32px 40px;border-top:1px solid #eee8df;">
<p style="margin:0 0 6px 0;font-size:13px;line-height:1.6;color:#8a8680;">The Parcel Company &middot; Rentals Made Easy</p>
<p style="margin:0 0 12px 0;font-size:13px;line-height:1.6;color:#8a8680;">Questions? Just reply to this email or write us at <a href="mailto:hello@theparcelco.com" style="color:#3D6B61;text-decoration:none;">hello@theparcelco.com</a>.</p>
<p style="margin:0;font-size:12px;line-height:1.5;color:#b3ada4;">If you did not expect this change, contact your property manager immediately.</p>
</td></tr>
</table></td></tr></table>
</body></html>`;
}

export async function updateEmailWithPortalSync(
  contactId: string,
  newEmail: string,
): Promise<{ ok: boolean; message: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };

  // Get profile_id for this contact
  const db = untypedDatabase(supabase);
  const { data: contact } = await db
    .from<{ profile_id: string | null }>("contacts")
    .select("profile_id")
    .eq("id", contactId)
    .single();

  const profileId = contact?.profile_id ?? null;

  // Update contacts.email
  const { error: dbError } = await db
    .from("contacts")
    .update({ email: newEmail })
    .eq("id", contactId);

  if (dbError) return { ok: false, message: dbError.message };

  // If this contact has a portal account, update auth email and send login link
  if (profileId) {
    try {
      const serviceClient = createServiceClient();

      // Change auth email immediately (admin override). email_confirm: false
      // leaves email_confirmed_at null so the badge shows "Unverified" until
      // the owner logs in via the magic link below.
      await serviceClient.auth.admin.updateUserById(profileId, {
        email: newEmail,
        email_confirm: false,
      });

      // Generate a magic link for the new email address
      const { data: linkData } = await serviceClient.auth.admin.generateLink({
        type: "magiclink",
        email: newEmail,
      });

      const magicLink = (linkData as { properties?: { action_link?: string } } | null)
        ?.properties?.action_link;

      if (magicLink) {
        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: BRAND_FROM,
              to: newEmail,
              subject: "Your Parcel account email has been updated",
              html: buildEmailChangeHtml(magicLink, newEmail),
            }),
          });
        }
      }
    } catch (err) {
      console.error("[updateEmailWithPortalSync] auth/email step failed:", err);
      // contacts.email was already updated; auth failure is non-fatal
    }
  }

  revalidatePath(`/admin/workspaces/${contactId}`);
  revalidatePath("/admin/workspaces");
  return { ok: true, message: "Email updated" };
}

// ---------------------------------------------------------------------------
// Update workspace fields (for owner workspace names and types)
// ---------------------------------------------------------------------------

export async function updateWorkspaceFields(
  workspaceId: string,
  fields: { name?: string; type?: string },
): Promise<void> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) throw new Error(authError);
  const updates: Record<string, unknown> = {};
  if (fields.name !== undefined) updates.name = fields.name.trim();
  if (fields.type !== undefined) updates.type = fields.type;
  if (Object.keys(updates).length === 0) return;
  const { error } = await untypedDatabase(supabase).from("workspaces").update(updates).eq("id", workspaceId);
  if (error) throw error;
  revalidatePath(`/admin/workspaces/${workspaceId}`);
  revalidatePath("/admin/workspaces");
}

// ---------------------------------------------------------------------------
// Add person to workspace
// ---------------------------------------------------------------------------

export async function addPersonToWorkspace(
  workspaceId: string,
  input: { firstName: string; lastName: string; email?: string | null; phone?: string | null }
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const fullName = `${input.firstName.trim()} ${input.lastName.trim()}`.trim();

  const { data, error } = await untypedDatabase(supabase)
    .from<{ id: string }>("contacts")
    .insert({
      full_name: fullName,
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      email: input.email ?? null,
      phone: input.phone ?? null,
      workspace_id: workspaceId,
      lifecycle_stage: "lead_new",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[addPersonToWorkspace]", error?.message);
    return { ok: false, error: "Failed to add person." };
  }

  revalidatePath(`/admin/workspaces/${workspaceId}`);
  revalidatePath("/admin/workspaces");
  return { ok: true, id: data.id };
}

// ---------------------------------------------------------------------------
// Remove person from workspace
// ---------------------------------------------------------------------------

export async function removePersonFromWorkspace(
  contactId: string,
  workspaceId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, error: authError };

  const db = untypedDatabase(supabase);
  const { count } = await db
    .from("contacts")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  if ((count ?? 0) <= 1) {
    return { ok: false, error: "Cannot remove the only person in an workspace." };
  }

  const { data: contact } = await db
    .from<{ full_name: string | null }>("contacts")
    .select("full_name")
    .eq("id", contactId)
    .maybeSingle();

  const { data: newWorkspace, error: workspaceError } = await db
    .from<{ id: string }>("workspaces")
    .insert({ name: contact?.full_name ?? "Unknown", type: "individual" })
    .select("id")
    .single();

  if (workspaceError || !newWorkspace) {
    console.error("[removePersonFromWorkspace] workspace error:", workspaceError?.message);
    return { ok: false, error: "Failed to create new workspace for removed person." };
  }

  // Re-check count before mutating (narrow the TOCTOU window)
  const { count: countNow } = await db
    .from("contacts")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  if ((countNow ?? 0) <= 1) {
    return { ok: false, error: "Cannot remove the only person in an workspace." };
  }

  const { error: updateError } = await db
    .from("contacts")
    .update({ workspace_id: newWorkspace.id })
    .eq("id", contactId);

  if (updateError) {
    console.error("[removePersonFromWorkspace] update error:", updateError.message);
    return { ok: false, error: "Failed to unlink person from workspace." };
  }

  revalidatePath(`/admin/workspaces/${workspaceId}`);
  revalidatePath(`/admin/workspaces/${contactId}`);
  revalidatePath("/admin/workspaces");
  return { ok: true };
}
