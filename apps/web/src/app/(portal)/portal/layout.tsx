import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./SignOutButton";

/**
 * Portal layout — wraps every /portal/* page.
 *
 * Phase 2 placeholder: a minimal authenticated shell with a header,
 * brand, user email, and sign-out button. The full designed sidebar
 * lands in Phase 3 when the real portal pages come over from the
 * legacy Vite SPA.
 *
 * Authentication is enforced by proxy.ts before this layout runs,
 * but we double-check here so a direct import cannot bypass auth.
 */
export default async function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-off-white)" }}
    >
      <header
        className="border-b"
        style={{
          backgroundColor: "var(--color-white)",
          borderColor: "var(--color-warm-gray-200)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/portal/dashboard"
            className="text-lg font-semibold tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            Parcel
          </Link>

          <div className="flex items-center gap-4">
            <span
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">{children}</main>
    </div>
  );
}
