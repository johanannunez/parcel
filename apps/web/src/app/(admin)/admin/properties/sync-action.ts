"use server";

import { createClient } from "@/lib/supabase/server";
import { syncFromHospitable, type SyncResult } from "@/lib/hospitable-sync";
import { revalidatePath } from "next/cache";

const EMPTY: SyncResult = {
  propertiesMatched: 0,
  propertiesCreated: 0,
  propertiesUnmatched: [],
  reservationsUpserted: 0,
  errors: [],
};

export async function triggerSync(): Promise<SyncResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return { ...EMPTY, errors: ["Not signed in."] };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin")
    return { ...EMPTY, errors: ["Admins only."] };

  // Pass the admin's user ID as the placeholder owner for newly created properties
  const result = await syncFromHospitable(user.id);

  revalidatePath("/admin/properties");
  revalidatePath("/portal/dashboard");
  revalidatePath("/portal/calendar");
  revalidatePath("/portal/payouts");

  return result;
}
