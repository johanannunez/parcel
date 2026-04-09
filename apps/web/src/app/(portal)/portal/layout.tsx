import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  PortalSidebar,
  PortalTopBar,
} from "@/components/portal/PortalSidebar";
import { CommandPalette } from "@/components/portal/CommandPalette";
import { SignOutButton } from "./SignOutButton";

/**
 * Portal shell — wraps every /portal/* page.
 *
 * Layout:
 *   [sidebar (lg+)] [main content]
 *   On mobile the sidebar is replaced by a thin top bar; a full
 *   slide-over drawer lands in a later slice when we add more nav
 *   depth and actually need it.
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, timezone, role")
    .eq("id", user.id)
    .single();

  const fullName =
    profile?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "Owner";
  const firstName = fullName.split(" ")[0] ?? fullName;
  const initials = buildInitials(fullName);

  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: "var(--color-off-white)" }}
    >
      <PortalSidebar
        userName={fullName}
        userEmail={user.email ?? ""}
        initials={initials}
        timezone={profile?.timezone ?? null}
        isAdmin={profile?.role === "admin"}
        signOutSlot={<SignOutButton />}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <PortalTopBar userName={firstName} initials={initials} />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10 lg:py-14">
            {children}
          </div>
        </main>
        <CommandPalette />
      </div>
    </div>
  );
}

function buildInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "O";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
