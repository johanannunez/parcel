import type { ReactNode } from "react";

/**
 * Owner detail layout. Now a pass-through. Navigation between owners is
 * handled inline by the caret switcher in the owner header (OwnerDetailShell)
 * and by the top bar back link to /admin/owners.
 */
export default function OwnerDetailLayout({ children }: { children: ReactNode }) {
  return children;
}
