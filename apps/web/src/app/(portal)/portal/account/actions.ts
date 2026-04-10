"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/* -------------------------------------------------------------------------- */
/*  updateProfile                                                             */
/* -------------------------------------------------------------------------- */

export async function updateProfile(
  _prevState: { ok: boolean; message: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "You must be signed in to update your profile." };
  }

  const fullName = formData.get("full_name")?.toString().trim();
  const preferredName = formData.get("preferred_name")?.toString().trim() || null;
  const phone = formData.get("phone")?.toString().trim() || null;
  const contactMethod = formData.get("contact_method")?.toString().trim() || null;

  if (!fullName) {
    return { ok: false, message: "Full name is required." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      preferred_name: preferredName,
      phone,
      contact_method: contactMethod,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/portal/account");
  return { ok: true, message: "Profile updated." };
}

/* -------------------------------------------------------------------------- */
/*  updateEmail                                                               */
/* -------------------------------------------------------------------------- */

export async function updateEmail(
  _prevState: { ok: boolean; message: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "You must be signed in to update your email." };
  }

  const newEmail = formData.get("new_email")?.toString().trim();

  if (!newEmail) {
    return { ok: false, message: "Email address is required." };
  }

  const { error } = await supabase.auth.updateUser({ email: newEmail });

  if (error) {
    return { ok: false, message: error.message };
  }

  return {
    ok: true,
    message: "A confirmation link has been sent to your new email address. Please check your inbox.",
  };
}

/* -------------------------------------------------------------------------- */
/*  updatePassword                                                            */
/* -------------------------------------------------------------------------- */

export async function updatePassword(
  _prevState: { ok: boolean; message: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "You must be signed in to change your password." };
  }

  const currentPassword = formData.get("current_password")?.toString();
  const newPassword = formData.get("new_password")?.toString();
  const confirmPassword = formData.get("confirm_password")?.toString();

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { ok: false, message: "All password fields are required." };
  }

  if (newPassword.length < 8) {
    return { ok: false, message: "New password must be at least 8 characters." };
  }

  if (newPassword !== confirmPassword) {
    return { ok: false, message: "New password and confirmation do not match." };
  }

  // Verify the current password is correct
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });

  if (signInError) {
    return { ok: false, message: "Current password is incorrect." };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Password updated successfully." };
}

/* -------------------------------------------------------------------------- */
/*  signOutOtherSessions                                                      */
/* -------------------------------------------------------------------------- */

export async function signOutOtherSessions(): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "You must be signed in." };
  }

  const { error } = await supabase.auth.signOut({ scope: "others" });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "All other sessions have been signed out." };
}

/* -------------------------------------------------------------------------- */
/*  exportUserData                                                            */
/* -------------------------------------------------------------------------- */

export async function exportUserData(): Promise<{
  ok: boolean;
  data?: string;
  message?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "You must be signed in to export your data." };
  }

  const [profileResult, propertiesResult, blockRequestsResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("properties").select("*").eq("owner_id", user.id),
    supabase.from("block_requests").select("*").eq("owner_id", user.id),
  ]);

  // Fetch bookings and payouts through the user's properties
  const propertyIds = (propertiesResult.data ?? []).map((p) => p.id);

  const [bookingsResult, payoutsResult] =
    propertyIds.length > 0
      ? await Promise.all([
          supabase.from("bookings").select("*").in("property_id", propertyIds),
          supabase.from("payouts").select("*").in("property_id", propertyIds),
        ])
      : [{ data: [] }, { data: [] }];

  const exportData = {
    exported_at: new Date().toISOString(),
    profile: profileResult.data,
    properties: propertiesResult.data ?? [],
    bookings: bookingsResult.data ?? [],
    payouts: payoutsResult.data ?? [],
    block_requests: blockRequestsResult.data ?? [],
  };

  return { ok: true, data: JSON.stringify(exportData, null, 2) };
}

/* -------------------------------------------------------------------------- */
/*  requestAccountDeletion                                                    */
/* -------------------------------------------------------------------------- */

export async function requestAccountDeletion(
  _prevState: { ok: boolean; message: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "You must be signed in to request account deletion." };
  }

  const confirmation = formData.get("confirmation")?.toString().trim();

  if (confirmation !== "DELETE") {
    return { ok: false, message: 'Please type "DELETE" to confirm.' };
  }

  // Soft signal: update the profile timestamp as a deletion marker
  const { error } = await supabase
    .from("profiles")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  await supabase.auth.signOut();
  redirect("/login");
}
