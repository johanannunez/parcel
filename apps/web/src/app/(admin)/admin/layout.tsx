import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "../../(portal)/portal/SignOutButton";

/**
 * Admin layout — wraps every /admin/* page.
 *
 * Phase 2 placeholder: dark header to visually distinguish admin
 * from the owner portal. The designed dark sidebar comes in Phase 3.
 *
 * Authorization is enforced by proxy.ts (redirects non-admins to
 * /portal/dashboard), but we double-check here to prevent any
 * direct-render bypass.
 */
export default async function AdminLayout({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/portal/dashboard");
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-navy)" }}
    >
      <header
        className="border-b"
        style={{
          backgroundColor: "var(--color-charcoal)",
          borderColor: "rgba(255,255,255,0.1)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/admin"
            className="text-lg font-semibold tracking-tight text-white"
          >
            Parcel Admin
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
              {user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 text-white">
        {children}
      </main>
    </div>
  );
}
