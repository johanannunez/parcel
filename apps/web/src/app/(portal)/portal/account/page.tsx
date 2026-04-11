import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountNav } from "./AccountNav";
import ProfileSection from "./components/ProfileSection";
import SecuritySection from "./components/SecuritySection";
import { SessionsSection } from "./components/SessionsSection";
import { NotificationsSection } from "./components/NotificationsSection";
import { InstallAppSection } from "./components/InstallAppSection";
import { RegionSection } from "./components/RegionSection";
import { DataExportSection } from "./components/DataExportSection";
import { DangerZoneSection } from "./components/DangerZoneSection";
import { EntitySection } from "./components/EntitySection";

export const metadata: Metadata = { title: "Account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch entity and other members (only if profile has an entity)
  let entity = null;
  let entityMembers: Array<{ id: string; full_name: string | null; email: string; avatar_url: string | null }> = [];

  if (profile?.entity_id) {
    const [{ data: entityData }, { data: members }] = await Promise.all([
      supabase
        .from("entities")
        .select("id, name, type, ein")
        .eq("id", profile.entity_id)
        .single(),
      supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .eq("entity_id", profile.entity_id)
        .order("created_at", { ascending: true }),
    ]);
    entity = entityData;
    entityMembers = members ?? [];
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Two-column layout: sidebar nav + content */}
      <div className="flex gap-10">
        <AccountNav />

        <div className="flex min-w-0 flex-1 flex-col gap-12">
          <ProfileSection
            profile={{
              full_name: profile?.full_name ?? null,
              preferred_name: profile?.preferred_name ?? null,
              email: user.email ?? "",
              phone: profile?.phone ?? null,
              contact_method: profile?.contact_method ?? null,
              avatar_url: profile?.avatar_url ?? null,
              created_at: profile?.created_at ?? new Date().toISOString(),
            }}
          />

          {entity ? (
            <EntitySection
              entity={entity}
              members={entityMembers}
              currentUserId={user.id}
            />
          ) : null}

          <SecuritySection userEmail={user.email ?? ""} />

          <SessionsSection />

          <NotificationsSection
            contactMethod={profile?.contact_method ?? "email"}
          />

          <InstallAppSection />

          <RegionSection timezone={profile?.timezone ?? ""} />

          <DataExportSection />

          <DangerZoneSection />
        </div>
      </div>
    </div>
  );
}
