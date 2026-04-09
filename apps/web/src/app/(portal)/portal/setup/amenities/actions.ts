"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { recordVersion } from "@/lib/wizard/version-history";

const schema = z.object({
  property_id: z.string().uuid("Property ID is required."),
  amenities: z.string().optional().default("[]"),
});

export type SaveAmenitiesState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

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
  try {
    amenitiesList = JSON.parse(v.amenities);
  } catch {
    return { error: "Invalid amenities data." };
  }

  const { error } = await supabase
    .from("properties")
    .update({ amenities: amenitiesList })
    .eq("id", v.property_id)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  await recordVersion(supabase, {
    userId: user.id,
    propertyId: v.property_id,
    stepKey: "amenities",
    data: { amenities: amenitiesList },
  });

  revalidatePath("/portal/setup");
  redirect(`/portal/setup?just=amenities&property=${v.property_id}`);
}
