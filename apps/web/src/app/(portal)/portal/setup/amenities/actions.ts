"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { recordVersion } from "@/lib/wizard/version-history";
import type { AmenityDetails } from "@/lib/wizard/amenities";

const schema = z.object({
  property_id: z.string().uuid("Property ID is required."),
  amenities: z.string().optional().default("[]"),
  details: z.string().optional().default("{}"),
});

export type SaveAmenitiesState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

/**
 * Main form submit: saves amenities + details, records version, redirects.
 */
export async function saveAmenities(
  _prev: SaveAmenitiesState,
  formData: FormData,
): Promise<SaveAmenitiesState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    return { error: "Something went wrong. Please try again." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const v = parsed.data;

  let amenitiesList: string[] = [];
  let detailsObj: AmenityDetails = {};
  try {
    amenitiesList = JSON.parse(v.amenities);
    detailsObj = JSON.parse(v.details);
  } catch {
    return { error: "Invalid amenities data." };
  }

  const payload = { selected: amenitiesList, details: detailsObj };

  const { error } = await supabase
    .from("properties")
    .update({ amenities: payload })
    .eq("id", v.property_id)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  await recordVersion(supabase, {
    userId: user.id,
    propertyId: v.property_id,
    stepKey: "amenities",
    data: payload,
  });

  revalidatePath("/portal/setup");
  redirect(`/portal/setup?just=amenities&property=${v.property_id}`);
}

/**
 * Auto-save: saves amenities + details silently, no redirect, no version history.
 */
export async function autosaveAmenities(
  propertyId: string,
  amenities: string[],
  details: AmenityDetails,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("properties")
    .update({ amenities: { selected: amenities, details } })
    .eq("id", propertyId)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };
  return {};
}
