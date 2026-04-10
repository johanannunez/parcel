"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { recordSessionLogin } from "@/lib/session-log";

export type LoginState = {
  error?: string;
};

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/portal/dashboard");

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    // Check if account was soft-deleted (30-day grace period)
    const { data: profile } = await supabase
      .from("profiles")
      .select("deleted_at")
      .eq("id", data.user.id)
      .single();

    if (profile?.deleted_at) {
      const deletedAt = new Date(profile.deleted_at);
      const daysSinceDeleted = (Date.now() - deletedAt.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceDeleted <= 30) {
        // Restore the account: clear deleted_at
        await supabase
          .from("profiles")
          .update({ deleted_at: null })
          .eq("id", data.user.id);
      } else {
        // Past 30 days: account is permanently deleted, sign them out
        await supabase.auth.signOut();
        return { error: "This account has been permanently deleted. Please contact support if you believe this is an error." };
      }
    }

    // Record session login
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
    const ua = h.get("user-agent") ?? null;
    await recordSessionLogin({ userId: data.user.id, ipAddress: ip, userAgent: ua });
  }

  redirect(redirectTo);
}
