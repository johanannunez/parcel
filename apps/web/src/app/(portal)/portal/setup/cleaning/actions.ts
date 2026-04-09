"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { recordVersion } from "@/lib/wizard/version-history";

const schema = z.object({
  property_id: z.string().uuid("Property ID is required."),
  cleaning_choice: z.enum(["parcel", "byoc"]),
  cleaner_name: z.string().trim().max(200).optional().default(""),
  cleaner_phone: z.string().trim().max(50).optional().default(""),
  cleaner_email: z.string().trim().max(200).optional().default(""),
  cleaner_experience: z.string().trim().max(200).optional().default(""),
  work_style: z.string().trim().optional().default(""),
  emergency_ok: z.string().trim().optional().default(""),
  available_days: z.string().trim().optional().default(""),
  cities_covered: z.string().trim().max(500).optional().default(""),
  cleaner_notes: z.string().trim().max(2000).optional().default(""),
  has_equipment: z.string().trim().optional().default(""),
});

export type SaveCleaningState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function saveCleaning(
  _prev: SaveCleaningState,
  formData: FormData,
): Promise<SaveCleaningState> {
  const raw = Object.fromEntries(formData.entries());
  // Collect multi-value available_days
  const availableDays = formData.getAll("available_days").map(String);
  const data = { ...raw, available_days: availableDays.join(",") };
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString();
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Please choose a cleaning option.", fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const v = parsed.data;

  const cleaningTeam = v.cleaning_choice === "byoc" ? {
    name: v.cleaner_name || null,
    phone: v.cleaner_phone || null,
    email: v.cleaner_email || null,
    experience: v.cleaner_experience || null,
    work_style: v.work_style || null,
    emergency_ok: v.emergency_ok || null,
    available_days: availableDays.length > 0 ? availableDays : null,
    cities_covered: v.cities_covered || null,
    notes: v.cleaner_notes || null,
    has_equipment: v.has_equipment === "true",
  } : null;

  const { error } = await supabase
    .from("properties")
    .update({
      cleaning_choice: v.cleaning_choice,
      cleaning_team: cleaningTeam,
    })
    .eq("id", v.property_id)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  await recordVersion(supabase, {
    userId: user.id,
    propertyId: v.property_id,
    stepKey: "cleaning",
    data: {
      cleaning_choice: v.cleaning_choice,
      cleaning_team: cleaningTeam,
    },
  });

  revalidatePath("/portal/setup");
  redirect(`/portal/setup?just=cleaning&property=${v.property_id}`);
}
