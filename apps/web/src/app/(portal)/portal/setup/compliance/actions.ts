"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { recordVersion } from "@/lib/wizard/version-history";

const schema = z.object({
  property_id: z.string().uuid("Property ID is required."),
  needs_permit: z.enum(["yes", "no", "unsure"]).optional().default("no"),
  permit_number: z.string().trim().max(200).optional().default(""),
  has_hoa: z.enum(["yes", "no"]).optional().default("no"),
  hoa_approval: z.enum(["yes", "no", "pending"]).optional().default("no"),
});

export type SaveComplianceState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function saveCompliance(
  _prev: SaveComplianceState,
  formData: FormData,
): Promise<SaveComplianceState> {
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
  const complianceDetails = {
    needs_permit: v.needs_permit,
    permit_number: v.needs_permit === "yes" ? (v.permit_number || null) : null,
    has_hoa: v.has_hoa,
    hoa_approval: v.has_hoa === "yes" ? v.hoa_approval : null,
  };

  const { error } = await supabase
    .from("properties")
    .update({ compliance_details: complianceDetails })
    .eq("id", v.property_id)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  await recordVersion(supabase, {
    userId: user.id,
    propertyId: v.property_id,
    stepKey: "compliance",
    data: complianceDetails,
  });

  revalidatePath("/portal/setup");
  redirect(`/portal/setup?just=compliance&property=${v.property_id}`);
}
