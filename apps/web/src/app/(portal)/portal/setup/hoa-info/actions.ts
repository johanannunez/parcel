"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const schema = z.object({
  property_id: z.string().uuid("Property ID is required."),
  has_hoa: z.string().trim().max(500).optional().default(""),
  hoa_name: z.string().trim().max(500).optional().default(""),
  management_company: z.string().trim().max(500).optional().default(""),
  contact_name: z.string().trim().max(500).optional().default(""),
  contact_phone: z.string().trim().max(500).optional().default(""),
  contact_email: z.string().trim().max(500).optional().default(""),
  str_allowed: z.string().trim().max(500).optional().default(""),
  key_restrictions: z.string().trim().max(2000).optional().default(""),
});

export type SaveHoaInfoState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function saveHoaInfo(
  _prev: SaveHoaInfoState,
  formData: FormData,
): Promise<SaveHoaInfoState> {
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const v = parsed.data;

  const { error } = await (supabase as any)
    .from("property_forms")
    .upsert(
      {
        property_id: v.property_id,
        form_key: "hoa_info",
        data: {
          has_hoa: v.has_hoa,
          hoa_name: v.hoa_name,
          management_company: v.management_company,
          contact_name: v.contact_name,
          contact_phone: v.contact_phone,
          contact_email: v.contact_email,
          str_allowed: v.str_allowed,
          key_restrictions: v.key_restrictions,
        },
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "property_id,form_key" },
    );

  if (error) return { error: error.message };

  const svc = createServiceClient();
  svc
    .from("activity_log" as any)
    .insert({
      action: "property_updated",
      entity_type: "property",
      entity_id: v.property_id,
      actor_id: user.id,
      metadata: { field_name: "hoa_info", description: "HOA info saved" },
    })
    .then(
      () => {},
      () => {},
    );

  revalidatePath("/portal/setup");
  redirect(`/portal/setup/insurance-certificate?property=${v.property_id}`);
}
