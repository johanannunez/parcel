"use server";

import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";

const schema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  firstName: z.string().trim().max(120).optional().or(z.literal("")),
});

export type FreeTipsState = {
  error?: string;
  success?: boolean;
};

export async function submitFreeTips(
  _prev: FreeTipsState,
  formData: FormData,
): Promise<FreeTipsState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    firstName: formData.get("firstName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // Use the service client because marketing visitors are anonymous
  // and public.inquiries has strict RLS that only admins can read.
  const supabase = createServiceClient();
  const { error } = await supabase.from("inquiries").insert({
    full_name: parsed.data.firstName || "Free Tips subscriber",
    email: parsed.data.email,
    message: "Subscribed to the free tips newsletter",
    source: "free-tips",
  });

  if (error) {
    console.error("[free-tips] insert failed:", error.message);
    return { error: "Something went wrong. Please try again." };
  }

  return { success: true };
}
