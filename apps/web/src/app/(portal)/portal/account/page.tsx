import type { Metadata } from "next";
import { getPortalContext } from "@/lib/portal-context";
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
  const { userId, client, isImpersonating, ownerProfile } =
    await getPortalContext();

  const { data: profile } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  // Fetch entity and other members (only if profile has an entity)
  let entity = null;
  let entityMembers: Array<{
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  }> = [];

  if (profile?.entity_id) {
    const [{ data: entityData }, { data: members }] = await Promise.all([
      client
        .from("entities")
        .select("id, name, type, ein")
        .eq("id", profile.entity_id)
        .single(),
      client
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .eq("entity_id", profile.entity_id)
        .order("created_at", { ascending: true }),
    ]);
    entity = entityData;
    entityMembers = members ?? [];
  }

  const displayEmail = isImpersonating
    ? (ownerProfile?.email ?? "")
    : (profile?.email ?? "");

  return (
    <div className="flex flex-col gap-8">
      {isImpersonating && ownerProfile ? (
        <div
          className="flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm"
          style={{
            backgroundColor: "rgba(194, 65, 12, 0.06)",
            borderColor: "rgba(194, 65, 12, 0.20)",
            color: "#9a3412",
          }}
        >
          <span className="font-medium">
            Viewing{" "}
            <strong className="font-semibold">
              {ownerProfile.full_name?.trim() || ownerProfile.email}
            </strong>
            's account settings.
          </span>
          <span style={{ color: "rgba(154, 52, 18, 0.60)" }}>
            Security, sessions, and destructive actions are hidden.
          </span>
        </div>
      ) : null}

      {/* Two-column layout: sidebar nav + content */}
      <div className="flex gap-10">
        <AccountNav />

        <div className="flex min-w-0 flex-1 flex-col gap-12 pb-[70vh]">
          <ProfileSection
            profile={{
              full_name: profile?.full_name ?? null,
              preferred_name: profile?.preferred_name ?? null,
              email: displayEmail,
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
              currentUserId={userId}
            />
          ) : null}

          {!isImpersonating ? (
            <>
              <SecuritySection userEmail={displayEmail} />
              <SessionsSection />
            </>
          ) : null}

          <NotificationsSection
            contactMethod={profile?.contact_method ?? "email"}
          />

          {!isImpersonating ? <InstallAppSection /> : null}

          <RegionSection timezone={profile?.timezone ?? ""} />

          {!isImpersonating ? (
            <>
              <DataExportSection />
              <DangerZoneSection />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
