import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar, AdminTopBar } from "@/components/admin/AdminSidebar";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";

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
    .select("role, full_name")
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
      className="flex min-h-screen"
      style={{ backgroundColor: "var(--color-navy)" }}
    >
      <AdminSidebar
        userName={fullName}
        userEmail={user.email ?? ""}
        initials={initials}
        pendingBlockCount={pendingBlockCount ?? 0}
        signOutSlot={<AdminSignOutButton />}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopBar userName={firstName} initials={initials} />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-6xl px-6 py-10 text-white lg:px-10 lg:py-14">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function buildInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
