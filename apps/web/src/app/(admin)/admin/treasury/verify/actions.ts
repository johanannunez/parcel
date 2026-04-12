"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { setTreasuryVerified } from "@/lib/treasury/auth";

// In-memory rate limiting: maps user ID to { attempts, lockedUntil }
// Single-admin system so a process-local Map is sufficient.
const rateLimitMap = new Map<string, { attempts: number; lockedUntil: number }>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 10 * 60 * 1000; // 10 minutes

export type VerifyState = {
  error: string | null;
  lockedUntil: number | null;
};

/**
 * Server action for the treasury re-authentication gate.
 *
 * - Reads "password" and "redirectTo" from formData
 * - Rate-limits: 5 failed attempts triggers a 10-minute lockout
 * - Verifies via Supabase signInWithPassword (uses the user's own email)
 * - On success: sets the treasury_verified_at cookie and redirects
 * - On failure: audit-logs the attempt and returns an error state
 */
export async function verifyTreasuryAccess(
  prevState: VerifyState,
  formData: FormData,
): Promise<VerifyState> {
  const password = formData.get("password");
  const redirectTo = (formData.get("redirectTo") as string | null) ?? "/admin/treasury";

  if (typeof password !== "string" || !password) {
    return { error: "Password is required.", lockedUntil: null };
  }

  // Get current user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "Session expired. Please sign in again.", lockedUntil: null };
  }

  // Check rate limit
  const now = Date.now();
  const rateEntry = rateLimitMap.get(user.id);

  if (rateEntry && rateEntry.lockedUntil > now) {
    const minutesLeft = Math.ceil((rateEntry.lockedUntil - now) / 60000);
    return {
      error: `Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft !== 1 ? "s" : ""}.`,
      lockedUntil: rateEntry.lockedUntil,
    };
  }

  // Verify password via Supabase Auth
  const svc = createServiceClient();
  const { error: authError } = await svc.auth.signInWithPassword({
    email: user.email,
    password,
  });

  if (authError) {
    // Increment attempt counter
    const attempts = (rateEntry?.attempts ?? 0) + 1;
    const lockedUntil = attempts >= MAX_ATTEMPTS ? now + LOCKOUT_MS : 0;
    rateLimitMap.set(user.id, { attempts, lockedUntil });

    // Audit log the failure (fire-and-forget)
    svc
      .from("activity_log")
      .insert({
        action: "reauth_failure",
        entity_type: "treasury",
        entity_id: null,
        actor_id: user.id,
        metadata: {
          description: "Treasury re-authentication failed",
          attempts,
          locked: lockedUntil > 0,
        },
      })
      .then(() => {}, () => {});

    if (lockedUntil > 0) {
      return {
        error: `Too many failed attempts. Try again in 10 minutes.`,
        lockedUntil,
      };
    }

    const remaining = MAX_ATTEMPTS - attempts;
    return {
      error: `Incorrect password. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
      lockedUntil: null,
    };
  }

  // Success — clear rate limit entry, set verified cookie, audit log
  rateLimitMap.delete(user.id);

  await setTreasuryVerified();

  svc
    .from("activity_log")
    .insert({
      action: "reauth_success",
      entity_type: "treasury",
      entity_id: null,
      actor_id: user.id,
      metadata: {
        description: "Treasury re-authentication succeeded",
      },
    })
    .then(() => {}, () => {});

  redirect(redirectTo);
}
