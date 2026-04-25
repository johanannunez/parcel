import { notFound, redirect } from "next/navigation";
import { fetchClientDetail, fetchEntityInfo, fetchEntityMembers } from "@/lib/admin/client-detail";
import { fetchOwnerDetail } from "@/lib/admin/owner-detail";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { fetchInternalNote } from "@/lib/admin/owner-facts-actions";
import { ClientDetailShell } from "./ClientDetailShell";
import { fetchAdminProfiles } from "./client-actions";
import { PropertiesTab } from "./PropertiesTab";
import { OverviewTab } from "@/app/(admin)/admin/owners/[entityId]/OverviewTab";
import { TabPlaceholder } from "@/app/(admin)/admin/owners/[entityId]/TabPlaceholder";
import { MeetingsTab } from "@/app/(admin)/admin/owners/[entityId]/MeetingsTab";
import { SettingsTab } from "@/app/(admin)/admin/owners/[entityId]/SettingsTab";
import { SETTINGS_SECTIONS, type SettingsSection } from "@/app/(admin)/admin/owners/[entityId]/settings-sections";
import type { SessionRow } from "@/app/(admin)/admin/owners/[entityId]/settings/AccountSecuritySection";
import type { ConnectionRow } from "@/app/(admin)/admin/owners/[entityId]/settings/DataPrivacySection";
import { fetchClientMeetings, fetchNextMeeting } from "@/lib/admin/client-meetings";
import { IntelligenceTab } from "./IntelligenceTab";
import { fetchInsightsByParent } from "@/lib/admin/ai-insights";
import { BillingTab } from "./BillingTab";
import { fetchClientBilling } from "@/lib/admin/client-billing";
import { DocumentsTab } from "./DocumentsTab";
import { fetchClientDocuments } from "@/lib/admin/client-documents";
import { MessagingTab } from "./MessagingTab";
import { fetchClientMessages, fetchEntityMessages } from "@/lib/admin/client-messages";
import { ClientOverviewTab } from "./ClientOverviewTab";
import { fetchContactOpenTasks } from "@/lib/admin/client-overview";
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
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; section?: string; person?: string }>;
};

export default async function ClientDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab: tabParam, section: sectionParam, person: personParam } = await searchParams;

  // Resolve: [id] may be an entity ID (new) or a contact ID (legacy redirect)
  const entityInfo = await fetchEntityInfo(id);

  if (!entityInfo) {
    // Try to treat [id] as a legacy contact ID and redirect to its entity
    const svc = createServiceClient();
    const { data: contact } = await (svc as any)
      .from('contacts')
      .select('entity_id')
      .eq('id', id)
      .maybeSingle();

    if (contact?.entity_id) {
      redirect(`/admin/clients/${contact.entity_id}${tabParam ? `?tab=${tabParam}` : ''}`);
    }
    notFound();
  }

  // Resolve the active contact: prefer ?person= param, else first member
  const members = await fetchEntityMembers(id);
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

  const [client, adminProfiles] = await Promise.all([
    fetchClientDetail(activeContactId),
    fetchAdminProfiles(),
  ]);
  if (!client) notFound();

  const nextMeeting = client.profileId ? await fetchNextMeeting(client.profileId) : null;
  // Fetch full owner data for tabs that were built against OwnerDetailData.
  // Only available once the contact has a linked entity (i.e. started onboarding).
  const ownerData = client.entityId
    ? await fetchOwnerDetail(client.entityId)
    : null;

  const clientMeetings =
    client.profileId && tab === "meetings"
      ? await fetchClientMeetings(client.profileId)
      : [];

  const isOverview = tab === "overview";
  const isIntelligence = tab === "intelligence";

  const contactInsights = isOverview || isIntelligence
    ? await fetchInsightsByParent("contact", [activeContactId])
    : {};
  const insightList = contactInsights[activeContactId] ?? [];
  const generatedAt = insightList[0]?.createdAt ?? null;

  const billingData = tab === "billing" && client.profileId
    ? await fetchClientBilling(client.profileId, client.id, client.properties.length)
    : null;

  const clientDocuments = (tab === "documents" || isOverview) && client.profileId
    ? await fetchClientDocuments(client.profileId)
    : [];

  const messagingContactIds = members.map((m) => m.id);
  const allEntityMessages = tab === "messaging"
    ? await fetchEntityMessages(messagingContactIds)
    : [];
  const overviewMessages = isOverview
    ? await fetchClientMessages(activeContactId)
    : [];

  const openTasks = isOverview
    ? await fetchContactOpenTasks(activeContactId)
    : [];

  // Fetch settings data only when the settings tab is active and owner data exists.
  let profileExtras: { preferredName: string | null; contactMethod: StoredContactMethod; timezone: string | null } =
    { preferredName: null, contactMethod: null, timezone: null };
  let internalNote: Awaited<ReturnType<typeof fetchInternalNote>> = null;
  let sessions: SessionRow[] = [];
  let connections: ConnectionRow[] = [];
  let entityDetail: { id: string; name: string; type: string | null; ein: string | null; notes: string | null } | null = null;

  if (tab === "settings" && ownerData) {
    const supabase = await createClient();
    const profileId = ownerData.primaryMember.id;

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
        (meta["workspace"] as string | undefined) ??
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

    if (ownerData.entity) {
      const { data: entityRow } = await supabase
        .from("entities")
        .select("id, name, type, ein, notes")
        .eq("id", ownerData.entity.id)
        .maybeSingle();
      entityDetail = entityRow ?? null;
    }
  }

  function renderTab(): React.ReactNode {
    switch (tab) {
      case "overview":
        return (
          <ClientOverviewTab
            client={client!}
            documents={clientDocuments}
            messages={overviewMessages}
            insights={insightList}
            openTasks={openTasks}
            activityLog={ownerData?.activity ?? []}
          />
        );

      case "properties":
        return <PropertiesTab properties={client!.properties} />;

      case "tasks":
        return <TasksTab parentType="contact" parentId={activeContactId} />;

      case "meetings":
        if (!client!.profileId) {
          return (
            <TabPlaceholder
              title="Meetings"
              body="Available once the client begins onboarding."
            />
          );
        }
        return (
          <MeetingsTab
            ownerId={client!.profileId}
            ownerFirstName={client!.fullName.split(" ")[0] ?? client!.fullName}
            ownerEmail={client!.email ?? ""}
            meetings={clientMeetings}
            properties={client!.properties.map((p) => ({
              id: p.id,
              label: p.label,
            }))}
            contactId={activeContactId}
            adminProfiles={adminProfiles}
          />
        );

      case "billing":
        if (!client!.profileId || !billingData) {
          return (
            <TabPlaceholder
              title="Billing"
              body="Billing is available once the client completes onboarding."
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
        if (!client!.profileId) {
          return (
            <TabPlaceholder
              title="Documents"
              body="Documents are available once the client begins onboarding."
            />
          );
        }
        return <DocumentsTab documents={clientDocuments} />;

      case "settings":
        if (!ownerData) {
          return (
            <TabPlaceholder
              title="Settings"
              body="Settings are available once the client completes onboarding."
            />
          );
        }
        return (
          <SettingsTab
            data={ownerData}
            activeSection={section}
            profileExtras={profileExtras}
            internalNote={internalNote}
            sessions={sessions}
            connections={connections}
            entityDetail={entityDetail}
            basePath={`/admin/clients/${id}`}
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
    <ClientDetailShell
      client={client}
      adminProfiles={adminProfiles}
      nextMeeting={nextMeeting}
      entityInfo={entityInfo}
      members={members}
      activeContactId={activeContactId as string}
    >
      {renderTab()}
    </ClientDetailShell>
  );
}
