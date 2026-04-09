"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  property_id: z.string().uuid(),
  bedrooms: z.coerce.number().int().min(1).max(10),
  bathrooms: z.coerce.number().min(0.5).max(10),
  guest_capacity: z.coerce.number().int().min(1).max(60),
  square_feet: z.union([z.coerce.number().int().min(0).max(100000), z.literal("")]).optional(),
  bed_arrangements: z.string().optional(),
});

export type SaveSpaceState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function saveSpace(
  _prev: SaveSpaceState,
  formData: FormData,
): Promise<SaveSpaceState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString();
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "A few fields need your attention.", fieldErrors };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const v = parsed.data;
  const sqft = v.square_feet === "" || v.square_feet === undefined ? null : v.square_feet;

  const { error } = await supabase
    .from("properties")
    .update({
      bedrooms: v.bedrooms,
      bathrooms: v.bathrooms,
      guest_capacity: v.guest_capacity,
      square_feet: sqft,
    })
    .eq("id", v.property_id)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/portal/setup");
  redirect(`/portal/setup?just=space&property=${v.property_id}`);
}
