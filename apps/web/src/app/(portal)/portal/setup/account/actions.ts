"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { recordVersion } from "@/lib/wizard/version-history";

const schema = z.object({
  full_name: z.string().trim().min(1, "Full name is required."),
  phone: z.string().trim().min(7, "Phone number is required."),
  street: z.string().trim().min(1, "Street address is required."),
  city: z.string().trim().min(1, "City is required."),
  state: z.string().trim().min(2, "State is required."),
  zip: z.string().trim().min(3, "ZIP code is required."),
});

export type SaveAccountState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function saveAccount(
  _prev: SaveAccountState,
  formData: FormData,
): Promise<SaveAccountState> {
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
  const mailingAddress = {
    street: v.street,
    city: v.city,
    state: v.state.toUpperCase(),
    zip: v.zip,
  };

  // Update profiles table. phone and mailing_address will exist after migration.
  // For now, update full_name always (it exists) and attempt the new columns.
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: v.full_name,
      // These will silently be ignored if columns don't exist yet
      ...(({ phone: v.phone, mailing_address: mailingAddress }) as Record<string, unknown>),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  await recordVersion(supabase, {
    userId: user.id,
    stepKey: "account",
    data: { full_name: v.full_name, phone: v.phone, mailing_address: mailingAddress },
  });

  revalidatePath("/portal/setup");
  redirect("/portal/setup?just=account");
}
