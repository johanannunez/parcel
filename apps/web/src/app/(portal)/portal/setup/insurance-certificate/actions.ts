"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const schema = z.object({
  property_id: z.string().uuid("Property ID is required."),
  carrier_name: z.string().trim().max(500).optional().default(""),
  policy_type: z.string().trim().max(500).optional().default(""),
  policy_number: z.string().trim().max(500).optional().default(""),
  liability_coverage_amount: z.string().trim().max(500).optional().default(""),
  effective_date: z.string().trim().max(500).optional().default(""),
  expiration_date: z.string().trim().max(500).optional().default(""),
  agent_name: z.string().trim().max(500).optional().default(""),
  agent_phone: z.string().trim().max(500).optional().default(""),
});

export type SaveInsuranceCertificateState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function saveInsuranceCertificate(
  _prev: SaveInsuranceCertificateState,
  formData: FormData,
): Promise<SaveInsuranceCertificateState> {
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
        form_key: "insurance_certificate",
        data: {
          carrier_name: v.carrier_name,
          policy_type: v.policy_type,
          policy_number: v.policy_number,
          liability_coverage_amount: v.liability_coverage_amount,
          effective_date: v.effective_date,
          expiration_date: v.expiration_date,
          agent_name: v.agent_name,
          agent_phone: v.agent_phone,
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
      metadata: { field_name: "insurance_certificate", description: "Insurance certificate saved" },
    })
    .then(
      () => {},
      () => {},
    );

  revalidatePath("/portal/setup");
  redirect(`/portal/setup/platform-authorization?property=${v.property_id}`);
}
