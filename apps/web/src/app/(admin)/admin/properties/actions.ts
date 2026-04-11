"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  propertyId: z.string().uuid(),
  hospitableId: z.string().min(1).max(200).nullable(),
  icalUrl: z
    .string()
    .url()
    .max(1000)
    .nullable()
    .or(z.literal("").transform(() => null)),
});

export type SaveResult = { ok: true } | { ok: false; error: string };

export async function saveHospitableConnection(
  input: unknown,
): Promise<SaveResult> {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error:
        parsed.error.issues[0]?.message ??
        "Check the fields and try again.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") return { ok: false, error: "Admins only." };

  const { error } = await supabase
    .from("properties")
    .update({
      hospitable_property_id: parsed.data.hospitableId,
      ical_url: parsed.data.icalUrl,
    })
    .eq("id", parsed.data.propertyId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/properties");
  revalidatePath("/portal/reserve");
  return { ok: true };
}
