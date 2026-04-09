"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { recordVersion } from "@/lib/wizard/version-history";

const schema = z.object({
  property_id: z.string().uuid("Property ID is required."),
});

export type AcknowledgeState = {
  error?: string;
};

export async function acknowledgeAgreement(
  _prev: AcknowledgeState,
  formData: FormData,
): Promise<AcknowledgeState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    return { error: "Property ID is missing." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const v = parsed.data;
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("properties")
    .update({ agreement_acknowledged_at: now })
    .eq("id", v.property_id)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  await recordVersion(supabase, {
    userId: user.id,
    propertyId: v.property_id,
    stepKey: "agreement-preview",
    data: { agreement_acknowledged_at: now },
  });

  revalidatePath("/portal/setup");
  redirect(`/portal/setup?just=agreement-preview&property=${v.property_id}`);
}
