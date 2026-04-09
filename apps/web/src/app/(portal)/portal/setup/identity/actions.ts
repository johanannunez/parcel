"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  legal_name: z.string().trim().min(1, "Full legal name is required."),
  license_number: z.string().trim().min(1, "License number is required."),
  issuing_state: z.string().trim().min(2, "Issuing state is required."),
  expiration_date: z.string().min(1, "Expiration date is required."),
  consent: z.literal("true", {
    message: "You must consent to identity verification.",
  }),
});

export type SaveIdentityState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function saveIdentity(
  _prev: SaveIdentityState,
  formData: FormData,
): Promise<SaveIdentityState> {
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

  // TODO: Upload front_photo and back_photo to Supabase Storage
  // once the PENDING migration creates the owner_kyc table and
  // the property-photos bucket. For now, store the text fields only.
  // The file uploads will be wired after migration runs.

  // Store in profiles metadata for now (owner_kyc table pending)
  const v = parsed.data;
  const kycData = {
    legal_name: v.legal_name,
    license_number: v.license_number,
    issuing_state: v.issuing_state,
    expiration_date: v.expiration_date,
    consent_given: true,
    consent_at: new Date().toISOString(),
  };

  // Once the PENDING migration creates owner_kyc, insert here.
  // For now, log the data and proceed. The identity step will
  // be fully functional after migration + types regen.
  console.log("[identity] KYC data collected:", kycData);

  revalidatePath("/portal/setup");
  redirect("/portal/setup?just=identity");
}
