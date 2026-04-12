import type { ReactNode } from "react";

/**
 * Treasury layout.
 *
 * Individual treasury pages check isTreasuryVerified() and redirect to
 * /admin/treasury/verify if needed. The layout itself is a passthrough
 * so the verify page is never caught in a redirect loop.
 *
 * Cookie refresh happens in the verify action (setTreasuryVerified),
 * not here, because Server Components cannot modify cookies.
 */
export default async function TreasuryLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
