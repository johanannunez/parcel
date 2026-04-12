"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { recordVersion } from "@/lib/wizard/version-history";

const spotSchema = z.object({
  name: z.string().trim().max(200),
  why: z.string().trim().max(1000),
  address: z.string().trim().max(500),
});

const schema = z.object({
  property_id: z.string().uuid("Property ID is required."),
  spots: z.string().optional().default("[]"),
});

export type SaveRecommendationsState = {
  error?: string;
};

export async function saveRecommendations(
  _prev: SaveRecommendationsState,
  formData: FormData,
): Promise<SaveRecommendationsState> {
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

  let spots: { name: string; why: string; address: string }[] = [];
  try {
    const rawSpots = JSON.parse(v.spots);
    if (Array.isArray(rawSpots)) {
      spots = rawSpots
        .filter((s: unknown) => {
          const result = spotSchema.safeParse(s);
          return result.success && result.data.name.length > 0;
        });
    }
  } catch {
    return { error: "Invalid recommendations data." };
  }

  const { error } = await supabase
    .from("properties")
    .update({ guidebook_spots: spots as unknown as import("@/types/supabase").Json })
    .eq("id", v.property_id)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  // Log activity (fire-and-forget)
  const svc = createServiceClient();
  svc.from("activity_log").insert({
    action: "property_updated",
    entity_type: "property",
    entity_id: v.property_id,
    actor_id: user.id,
    metadata: {
      field_name: "recommendations",
      spot_count: spots.length,
      description: `Local recommendations updated (${spots.length} spots)`,
    },
  }).then(() => {}, () => {});

  await recordVersion(supabase, {
    userId: user.id,
    propertyId: v.property_id,
    stepKey: "recommendations",
    data: { guidebook_spots: spots },
  });

  revalidatePath("/portal/setup");
  redirect(`/portal/setup?just=recommendations&property=${v.property_id}`);
}
