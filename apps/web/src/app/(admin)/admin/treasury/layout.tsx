import type { ReactNode } from "react";
import { isTreasuryVerified, refreshTreasurySession } from "@/lib/treasury/auth";

/**
 * Treasury layout.
 *
 * Checks whether the current request carries a valid treasury_verified_at
 * cookie. If verified, silently refreshes the session timestamp so activity
 * keeps the window alive. If not, renders children unmodified — individual
 * treasury pages handle their own redirect to /admin/treasury/verify so that
 * the verify page itself is never caught in a redirect loop.
 */
export default async function TreasuryLayout({
  children,
}: {
  children: ReactNode;
}) {
  const verified = await isTreasuryVerified();

  if (verified) {
    await refreshTreasurySession();
  }

  return <>{children}</>;
}
