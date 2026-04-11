import type { ReactNode } from "react";

/**
 * Owner hub layout is now a pass-through. The hub component itself
 * renders the full viewport including owner profile, section nav,
 * and content area. This avoids nested borders and keeps the layout
 * edge-to-edge.
 */
export default function OwnerHubLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
