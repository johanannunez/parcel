"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { recordVersion } from "@/lib/wizard/version-history";
import type { Json } from "@/types/supabase";

const schema = z.object({
  full_name: z.string().trim().min(1, "Full name is required."),
  phone: z.string().trim().min(7, "Phone number is required."),
  preferred_name: z.string().trim().optional().default(""),
  street: z.string().trim().min(1, "Street address is required."),
  city: z.string().trim().min(1, "City is required."),
  state: z.string().trim().min(2, "State is required."),
  zip: z.string().trim().min(3, "ZIP code is required."),
  emergency_name: z.string().trim().optional().default(""),
  emergency_phone: z.string().trim().optional().default(""),
  contact_method: z.string().trim().optional().default(""),
  timezone: z.string().trim().optional().default(""),
  referral_source: z.string().trim().optional().default(""),
  avatar_url: z.string().trim().optional().default(""),
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

  // Build mailing_address jsonb with nested emergency_contact
  const mailingAddress: { [key: string]: Json | undefined } = {
    street: v.street,
    city: v.city,
    state: v.state.toUpperCase(),
    zip: v.zip,
  };

  if (v.emergency_name || v.emergency_phone) {
    mailingAddress.emergency_contact = {
      name: v.emergency_name || null,
      phone: v.emergency_phone || null,
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: v.full_name,
      phone: v.phone,
      mailing_address: mailingAddress,
      preferred_name: v.preferred_name || null,
      contact_method: v.contact_method || null,
      timezone: v.timezone || null,
      referral_source: v.referral_source || null,
      avatar_url: v.avatar_url || null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  await recordVersion(supabase, {
    userId: user.id,
    stepKey: "account",
    data: {
      full_name: v.full_name,
      phone: v.phone,
      preferred_name: v.preferred_name,
      contact_method: v.contact_method,
      timezone: v.timezone,
      referral_source: v.referral_source,
      mailing_address: mailingAddress,
    },
  });

  revalidatePath("/portal/setup");
  redirect("/portal/setup?just=account");
}
