import { notFound } from "next/navigation";
import { fetchEntityContactDetail, fetchEntityInfo, fetchEntityMembers } from "@/lib/admin/entity-contact-detail";
import { fetchEntityDetail } from "@/lib/admin/entity-detail";
import { createClient } from "@/lib/supabase/server";
import { fetchInternalNote } from "@/lib/admin/owner-facts-actions";
import { EntityDetailShell } from "./EntityDetailShell";
import { fetchAdminProfiles } from "./entity-person-actions";
import { PropertiesTab } from "./PropertiesTab";
import { TabPlaceholder } from "@/app/(admin)/admin/entities/[entityId]/TabPlaceholder";
import { MeetingsTab } from "@/app/(admin)/admin/entities/[entityId]/MeetingsTab";
import { SettingsTab } from "@/app/(admin)/admin/entities/[entityId]/SettingsTab";
import { SETTINGS_SECTIONS, type SettingsSection } from "@/app/(admin)/admin/entities/[entityId]/settings-sections";
import type { SessionRow } from "@/app/(admin)/admin/entities/[entityId]/settings/AccountSecuritySection";
import type { ConnectionRow } from "@/app/(admin)/admin/entities/[entityId]/settings/DataPrivacySection";
import { fetchEntityMeetings, fetchNextMeeting } from "@/lib/admin/entity-meetings";
import { IntelligenceTab } from "./IntelligenceTab";
import { fetchInsightsByParent } from "@/lib/admin/ai-insights";
import { BillingTab } from "./BillingTab";
import { fetchEntityBilling } from "@/lib/admin/entity-billing";
import { DocumentsTab } from "./DocumentsTab";
import { fetchEntityDocuments } from "@/lib/admin/entity-documents";
import { MessagingTab } from "./MessagingTab";
import { fetchEntityPersonMessages, fetchEntityMessages } from "@/lib/admin/entity-messages";
import { EntityOverviewTab } from "./EntityOverviewTab";
import { fetchEntityContactOpenTasks } from "@/lib/admin/entity-overview";
import { TasksTab } from "@/components/admin/tasks/TasksTab";

export const dynamic = "force-dynamic";

type TabKey =
  | "overview"
  | "properties"
  | "tasks"
  | "meetings"
  | "intelligence"
  | "messaging"
  | "documents"
  | "billing"
  | "settings";

const KNOWN_TABS: readonly TabKey[] = [
  "overview",
  "properties",
  "tasks",
  "meetings",
  "intelligence",
  "messaging",
  "documents",
  "billing",
  "settings",
];

const CONTACT_METHODS = ["email", "sms", "phone", "whatsapp"] as const;
type StoredContactMethod = "email" | "sms" | "phone" | "whatsapp" | null;

type Props = {
  params: Promise<{ entityId: string }>;
  searchParams: Promise<{ tab?: string; section?: string; person?: string }>;
};

export default async function EntityDetailPage({ params, searchParams }: Props) {
  const { entityId } = await params;
  const { tab: tabParam, section: sectionParam, person: personParam } = await searchParams;

  const entityInfo = await fetchEntityInfo(entityId);

  if (!entityInfo) {
    notFound();
  }

  // Resolve the active contact: prefer ?person= param, else first member
  const members = await fetchEntityMembers(entityId);
  const activeContactId = (personParam && members.find((m) => m.id === personParam))
    ? personParam
    : members[0]?.id ?? null;

  if (!activeContactId) notFound();

  const tab: TabKey = (KNOWN_TABS as readonly string[]).includes(tabParam ?? "")
    ? (tabParam as TabKey)
    : "overview";

  const section: SettingsSection = (SETTINGS_SECTIONS as readonly string[]).includes(sectionParam ?? "")
    ? (sectionParam as SettingsSection)
    : "personal";

  const [entityContact, adminProfiles] = await Promise.all([
    fetchEntityContactDetail(activeContactId),
    fetchAdminProfiles(),
  ]);
  if (!entityContact) notFound();

  const nextMeeting = entityContact.profileId ? await fetchNextMeeting(entityContact.profileId) : null;
  // Fetch full entity data once the active person is attached to an entity.
  const entityData = entityContact.entityId
    ? await fetchEntityDetail(entityContact.entityId)
    : null;

  const meetingProfileId = entityContact.profileId ?? activeContactId;
  const entityMeetings =
    tab === "meetings" && meetingProfileId
      ? await fetchEntityMeetings(meetingProfileId)
      : [];

  const isOverview = tab === "overview";
  const isIntelligence = tab === "intelligence";

  const contactInsights = isOverview || isIntelligence
    ? await fetchInsightsByParent("contact", [activeContactId])
    : {};
  const insightList = contactInsights[activeContactId] ?? [];
  const generatedAt = insightList[0]?.createdAt ?? null;

  const billingData = tab === "billing" && entityContact.profileId
    ? await fetchEntityBilling(entityContact.profileId, entityContact.id, entityContact.properties.length)
    : null;

  const entityDocuments = (tab === "documents" || isOverview) && entityContact.profileId
    ? await fetchEntityDocuments(entityContact.profileId)
    : [];

  const messagingContactIds = members.map((m) => m.id);
  const allEntityMessages = tab === "messaging"
    ? await fetchEntityMessages(messagingContactIds)
    : [];
  const overviewMessages = isOverview
    ? await fetchEntityPersonMessages(activeContactId)
    : [];

  const openTasks = isOverview
    ? await fetchEntityContactOpenTasks(activeContactId)
    : [];

  // Fetch settings data only when the settings tab is active and owner data exists.
  let profileExtras: { preferredName: string | null; contactMethod: StoredContactMethod; timezone: string | null } =
    { preferredName: null, contactMethod: null, timezone: null };
  let internalNote: Awaited<ReturnType<typeof fetchInternalNote>> = null;
  let sessions: SessionRow[] = [];
  let connections: ConnectionRow[] = [];
  let entityDetail: { id: string; name: string; type: string | null; ein: string | null; notes: string | null } | null = null;

  if (tab === "settings" && entityData) {
    const supabase = await createClient();
    const profileId = entityData.primaryMember.id;

    const [{ data: extras }, fetchedNote, { data: rawSessions }, { data: rawConnections }] =
      await Promise.all([
        supabase.from("profiles").select("preferred_name, contact_method, timezone").eq("id", profileId).maybeSingle(),
        fetchInternalNote(profileId),
        supabase.from("session_log").select("id, logged_in_at, device_type, browser, os, city, country").eq("user_id", profileId).order("logged_in_at", { ascending: false }).limit(8),
        supabase.from("connections").select("id, provider, external_account_id, status, metadata, connected_at").eq("owner_id", profileId).order("connected_at", { ascending: false }),
      ]);

    const rawContact = extras?.contact_method ?? null;
    profileExtras = {
      preferredName: extras?.preferred_name ?? null,
      contactMethod: rawContact && (CONTACT_METHODS as readonly string[]).includes(rawContact as (typeof CONTACT_METHODS)[number])
        ? (rawContact as StoredContactMethod)
        : null,
      timezone: extras?.timezone ?? null,
    };
    internalNote = fetchedNote;
    sessions = (rawSessions ?? []).map((r) => ({
      id: r.id,
      loggedInAt: r.logged_in_at,
      deviceType: r.device_type,
      browser: r.browser,
      os: r.os,
      city: r.city,
      country: r.country,
    }));
    connections = (rawConnections ?? []).map((r) => {
      const meta = (r.metadata ?? {}) as Record<string, unknown>;
      const label =
        (meta["listing_title"] as string | undefined) ??
        (meta["calendar_email"] as string | undefined) ??
        r.external_account_id ??
        "";
      return {
        id: r.id,
        provider: r.provider,
        label,
        status: r.status ?? "connected",
        connectedAt: r.connected_at,
      };
    });

    if (entityData.entity) {
      const { data: entityRow } = await supabase
        .from("entities")
        .select("id, name, type, ein, notes")
        .eq("id", entityData.entity.id)
        .maybeSingle();
      entityDetail = entityRow ?? null;
    }
  }

  function renderTab(): React.ReactNode {
    switch (tab) {
      case "overview":
        return (
          <EntityOverviewTab
            entityContact={entityContact!}
            documents={entityDocuments}
            messages={overviewMessages}
            insights={insightList}
            openTasks={openTasks}
            activityLog={entityData?.activity ?? []}
          />
        );

      case "properties":
        return <PropertiesTab properties={entityContact!.properties} />;

      case "tasks":
        return <TasksTab parentType="contact" parentId={activeContactId} />;

      case "meetings":
        return (
          <MeetingsTab
            ownerId={entityContact!.profileId ?? activeContactId}
            ownerFirstName={entityContact!.fullName.split(" ")[0] ?? entityContact!.fullName}
            ownerEmail={entityContact!.email ?? ""}
            ownerPhone={entityContact!.phone ?? null}
            meetings={entityMeetings}
            properties={entityContact!.properties.map((p) => ({
              id: p.id,
              label: p.label,
            }))}
            contactId={activeContactId}
            adminProfiles={adminProfiles}
          />
        );

      case "billing":
        if (!entityContact!.profileId || !billingData) {
          return (
            <TabPlaceholder
              title="Billing"
              body="Billing is available once the entity completes onboarding."
            />
          );
        }
        return <BillingTab billing={billingData} />;

      case "intelligence":
        return (
          <IntelligenceTab
            contactId={activeContactId}
            insights={insightList}
            generatedAt={generatedAt}
          />
        );

      case "messaging":
        return (
          <MessagingTab
            contactId={activeContactId}
            messages={allEntityMessages}
            members={members}
            activeContactId={activeContactId}
          />
        );

      case "documents":
        if (!entityContact!.profileId) {
          return (
            <TabPlaceholder
              title="Documents"
              body="Documents are available once the entity begins onboarding."
            />
          );
        }
        return <DocumentsTab documents={entityDocuments} />;

      case "settings":
        if (!entityData) {
          return (
            <TabPlaceholder
              title="Settings"
              body="Settings are available once the entity completes onboarding."
            />
          );
        }
        return (
          <SettingsTab
            data={entityData}
            activeSection={section}
            profileExtras={profileExtras}
            internalNote={internalNote}
            sessions={sessions}
            connections={connections}
            entityDetail={entityDetail}
            basePath={`/admin/entities/${entityId}`}
            adminMembers={members}
            adminEntityId={entityInfo!.id}
          />
        );

      default:
        return (
          <TabPlaceholder
            title="Not found"
            body="This tab does not exist."
          />
        );
    }
  }

  return (
    <EntityDetailShell
      entityContact={entityContact}
      adminProfiles={adminProfiles}
      nextMeeting={nextMeeting}
      entityInfo={entityInfo}
      members={members}
      activeContactId={activeContactId as string}
    >
      {renderTab()}
    </EntityDetailShell>
  );
}
