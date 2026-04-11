import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  PortalSidebar,
  PortalIconRail,
  PortalTopBar,
} from "@/components/portal/PortalSidebar";
import { PortalBottomNav } from "@/components/portal/PortalBottomNav";
import { PullToRefresh } from "@/components/portal/PullToRefresh";
import { CommandPalette } from "@/components/portal/CommandPalette";
import { NotificationsProvider } from "@/components/portal/NotificationsProvider";
import { SignOutButton } from "./SignOutButton";
import { InstallBanner } from "@/components/portal/InstallBanner";

/**
 * Portal shell — wraps every /portal/* page.
 *
 * NotificationsProvider owns the single realtime subscription so any
 * number of NotificationBell components (desktop sidebar, tablet rail,
 * mobile top bar) can render without opening multiple channels.
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

  const [{ data: profile }, { data: properties }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, role, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase
      .from("properties")
      .select("id, property_type, address_line1, city, state, bedrooms, bathrooms, guest_capacity")
      .limit(50),
  ]);

  // Setup is incomplete if: no properties, or any property missing key fields
  const setupIncomplete =
    !properties ||
    properties.length === 0 ||
    properties.some(
      (p) =>
        !p.property_type ||
        !p.address_line1 ||
        !p.city ||
        !p.state ||
        p.bedrooms === null ||
        p.bathrooms === null ||
        p.guest_capacity === null,
    );

  const fullName =
    profile?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "Owner";
  const firstName = fullName.split(" ")[0] ?? fullName;
  const initials = buildInitials(fullName);

  return (
    <NotificationsProvider userId={user.id}>
      <div
        className="flex min-h-screen overflow-x-hidden"
        style={{ backgroundColor: "var(--color-off-white)" }}
      >
        <PortalIconRail />
        <PortalSidebar
          userName={fullName}
          userEmail={user.email ?? ""}
          initials={initials}
          avatarUrl={profile?.avatar_url ?? null}
          isAdmin={profile?.role === "admin"}
          setupIncomplete={setupIncomplete}
          signOutSlot={<SignOutButton />}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <PortalTopBar userName={firstName} initials={initials} />
          <main className="flex-1 pb-20 md:pb-0">
            <PullToRefresh>
              <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-10 lg:py-14">
                <InstallBanner />
                {children}
              </div>
            </PullToRefresh>
          </main>
          <CommandPalette />
        </div>

        <PortalBottomNav
          isAdmin={profile?.role === "admin"}
          signOutSlot={<SignOutButton />}
        />
      </div>
    </NotificationsProvider>
  );
}

function buildInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "O";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
