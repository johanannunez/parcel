// Treasury re-authentication helpers
// SERVER-SIDE ONLY — never import from client components

import { cookies } from "next/headers";
import { TREASURY_SESSION_TIMEOUT_MINUTES } from "./types";

const COOKIE_NAME = "treasury_verified_at";
const MAX_AGE_SECONDS = TREASURY_SESSION_TIMEOUT_MINUTES * 60;

/**
 * Returns true if the treasury_verified_at cookie exists, is a valid
 * timestamp, and was set within the last TREASURY_SESSION_TIMEOUT_MINUTES.
 */
export async function isTreasuryVerified(): Promise<boolean> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return false;

  const ts = Number(raw);
  if (isNaN(ts)) return false;

  const ageMs = Date.now() - ts;
  return ageMs >= 0 && ageMs < MAX_AGE_SECONDS * 1000;
}

/**
 * Sets the treasury_verified_at cookie with the current timestamp.
 * httpOnly, sameSite strict, path scoped to /admin/treasury.
 * secure is set in production only.
 */
export async function setTreasuryVerified(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, String(Date.now()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin/treasury",
    maxAge: MAX_AGE_SECONDS,
  });
}

/**
 * If currently verified, refreshes the timestamp to extend the session
 * by another TREASURY_SESSION_TIMEOUT_MINUTES from now.
 */
export async function refreshTreasurySession(): Promise<void> {
  const verified = await isTreasuryVerified();
  if (!verified) return;
  await setTreasuryVerified();
}

/**
 * Deletes the treasury_verified_at cookie, forcing re-authentication
 * on the next treasury access.
 */
export async function clearTreasuryVerification(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
