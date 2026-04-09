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

  const { count: pendingBlockCount } = await supabase
    .from("block_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="text-lg font-semibold tracking-tight text-white"
            >
              Parcel Admin
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/admin"
                className="transition-colors hover:text-white"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                Overview
              </Link>
              <Link
                href="/admin/block-requests"
                className="inline-flex items-center gap-2 transition-colors hover:text-white"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                Block requests
                {pendingBlockCount && pendingBlockCount > 0 ? (
                  <span
                    className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold"
                    style={{
                      backgroundColor: "#f59e0b",
                      color: "#1a1a1a",
                    }}
                  >
                    {pendingBlockCount}
                  </span>
                ) : null}
              </Link>
            </nav>
          </div>

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
