import type { ReactNode } from "react";

/**
 * Owners section layout is a pass-through. The list view at `/admin/owners`
 * renders edge-to-edge (full-width) and the detail view at
 * `/admin/owners/[entityId]` wraps itself in the OwnerListPanel sidebar via
 * its own layout.
 */
export default function OwnersLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
