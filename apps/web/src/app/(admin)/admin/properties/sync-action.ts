"use server";

import { createClient } from "@/lib/supabase/server";
import { syncFromHospitable, type SyncResult } from "@/lib/hospitable-sync";
import { revalidatePath } from "next/cache";

export async function triggerSync(): Promise<SyncResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      propertiesMatched: 0,
      propertiesUnmatched: [],
      reservationsUpserted: 0,
      errors: ["Not signed in."],
    };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin")
    return {
      propertiesMatched: 0,
      propertiesUnmatched: [],
      reservationsUpserted: 0,
      errors: ["Admins only."],
    };

  const result = await syncFromHospitable();

  revalidatePath("/admin/properties");
  revalidatePath("/portal/dashboard");
  revalidatePath("/portal/calendar");
  revalidatePath("/portal/payouts");

  return result;
}
