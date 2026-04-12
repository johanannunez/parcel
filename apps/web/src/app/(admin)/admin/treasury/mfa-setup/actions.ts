"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// Rate limiting for MFA verify: maps user ID to { attempts, lockedUntil }
const mfaRateLimitMap = new Map<
  string,
  { attempts: number; lockedUntil: number }
>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 10 * 60 * 1000; // 10 minutes

export type MfaVerifyState = {
  error: string | null;
  lockedUntil: number | null;
};

/**
 * Verify a TOTP code during MFA setup to activate the factor.
 * On success, redirects to the treasury verify page.
 */
export async function verifySetupCode(
  prevState: MfaVerifyState,
  formData: FormData,
): Promise<MfaVerifyState> {
  const code = formData.get("code") as string | null;
  const factorId = formData.get("factorId") as string | null;

  if (!code || !factorId) {
    return { error: "Verification code and factor are required.", lockedUntil: null };
  }

  if (!/^\d{6}$/.test(code)) {
    return { error: "Enter a 6-digit code.", lockedUntil: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Session expired. Please sign in again.", lockedUntil: null };
  }

  // Check rate limit
  const now = Date.now();
  const rateEntry = mfaRateLimitMap.get(user.id);

  if (rateEntry && rateEntry.lockedUntil > now) {
    const minutesLeft = Math.ceil((rateEntry.lockedUntil - now) / 60000);
    return {
      error: `Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? "s" : ""}.`,
      lockedUntil: rateEntry.lockedUntil,
    };
  }

  // Challenge then verify
  const { data: challengeData, error: challengeError } =
    await supabase.auth.mfa.challenge({ factorId });

  if (challengeError || !challengeData) {
    return {
      error: challengeError?.message ?? "Failed to create MFA challenge.",
      lockedUntil: null,
    };
  }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challengeData.id,
    code,
  });

  if (verifyError) {
    // Increment attempt counter
    const attempts = (rateEntry?.attempts ?? 0) + 1;
    const lockedUntil = attempts >= MAX_ATTEMPTS ? now + LOCKOUT_MS : 0;
    mfaRateLimitMap.set(user.id, { attempts, lockedUntil });

    const svcFail = createServiceClient();
    svcFail
      .from("treasury_audit_log")
      .insert({
        action: "mfa_verify",
        resource_type: "treasury",
        resource_id: null,
        user_id: user.id,
        metadata: {
          description: "Treasury MFA setup verification failed",
          factor_id: factorId,
          attempts,
          locked: lockedUntil > 0,
          context: "setup",
        },
      })
      .then(() => {}, () => {});

    if (lockedUntil > 0) {
      return {
        error: "Too many failed attempts. Try again in 10 minutes.",
        lockedUntil,
      };
    }

    const remaining = MAX_ATTEMPTS - attempts;
    return {
      error: `Invalid code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
      lockedUntil: null,
    };
  }

  // Success: clear rate limit and audit log
  mfaRateLimitMap.delete(user.id);

  const svcSuccess = createServiceClient();
  svcSuccess
    .from("treasury_audit_log")
    .insert({
      action: "mfa_verify",
      resource_type: "treasury",
      resource_id: null,
      user_id: user.id,
      metadata: {
        description: "Treasury MFA TOTP setup completed successfully",
        factor_id: factorId,
        context: "setup",
      },
    })
    .then(() => {}, () => {});

  redirect("/admin/treasury/verify");
}
