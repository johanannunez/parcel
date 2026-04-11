import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar, AdminIconRail, AdminTopBar } from "@/components/admin/AdminSidebar";
import { AdminBottomNav } from "@/components/admin/AdminBottomNav";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import { PullToRefresh } from "@/components/portal/PullToRefresh";

/**
 * Admin layout with dark vertical sidebar.
 *
 * Authorization: proxy.ts redirects non-admins to /portal/dashboard.
 * We double-check here to prevent any direct-render bypass.
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
    .select("role, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/portal/dashboard");
  }

  const { count: pendingBlockCount } = await supabase
    .from("block_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const fullName =
    profile?.full_name?.trim() || user.email?.split("@")[0] || "Admin";
  const firstName = fullName.split(" ")[0] ?? fullName;
  const initials = buildInitials(fullName);

  return (
    <div
      className="flex min-h-screen overflow-x-hidden"
      style={{ backgroundColor: "var(--color-navy)" }}
    >
      <AdminIconRail pendingBlockCount={pendingBlockCount ?? 0} />
      <AdminSidebar
        userName={fullName}
        userEmail={user.email ?? ""}
        initials={initials}
        avatarUrl={profile?.avatar_url ?? null}
        pendingBlockCount={pendingBlockCount ?? 0}
        signOutSlot={<AdminSignOutButton />}
      />

      <div className="flex min-w-0 flex-1 flex-col" style={{ backgroundColor: "var(--color-off-white)", color: "var(--color-text-primary)" }}>
        <AdminTopBar userName={firstName} initials={initials} pendingBlockCount={pendingBlockCount ?? 0} />
        <main className="flex-1 pb-20 md:pb-0">
          <PullToRefresh>{children}</PullToRefresh>
        </main>
      </div>

      <AdminBottomNav
        pendingBlockCount={pendingBlockCount ?? 0}
        signOutSlot={<AdminSignOutButton />}
      />
    </div>
  );
}

function buildInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
