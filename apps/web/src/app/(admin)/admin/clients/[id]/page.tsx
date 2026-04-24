import { notFound } from "next/navigation";
import { fetchClientDetail } from "@/lib/admin/client-detail";
import { fetchOwnerDetail } from "@/lib/admin/owner-detail";
import { ClientDetailShell } from "./ClientDetailShell";
import { PropertiesTab } from "./PropertiesTab";
import { OverviewTab } from "@/app/(admin)/admin/owners/[entityId]/OverviewTab";
import { FinancialsTab } from "@/app/(admin)/admin/owners/[entityId]/FinancialsTab";
import { TabPlaceholder } from "@/app/(admin)/admin/owners/[entityId]/TabPlaceholder";
import { MeetingsTab } from "@/app/(admin)/admin/owners/[entityId]/MeetingsTab";
import { fetchClientMeetings } from "@/lib/admin/client-meetings";

export const dynamic = "force-dynamic";

type TabKey =
  | "overview"
  | "properties"
  | "meetings"
  | "intelligence"
  | "messaging"
  | "documents"
  | "billing"
  | "settings";

const KNOWN_TABS: readonly TabKey[] = [
  "overview",
  "properties",
  "meetings",
  "intelligence",
  "messaging",
  "documents",
  "billing",
  "settings",
];

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function ClientDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab: tabParam } = await searchParams;

  const tab: TabKey = (KNOWN_TABS as readonly string[]).includes(tabParam ?? "")
    ? (tabParam as TabKey)
    : "overview";

  const client = await fetchClientDetail(id);
  if (!client) notFound();

  // Fetch full owner data for tabs that were built against OwnerDetailData.
  // Only available once the contact has a linked entity (i.e. started onboarding).
  const ownerData = client.entityId
    ? await fetchOwnerDetail(client.entityId)
    : null;

  const clientMeetings =
    client.profileId && tab === "meetings"
      ? await fetchClientMeetings(client.profileId)
      : [];

  function renderTab(): React.ReactNode {
    switch (tab) {
      case "overview":
        if (ownerData) return <OverviewTab data={ownerData} />;
        return (
          <TabPlaceholder
            title="Overview"
            body={`This contact is in the ${client!.lifecycleStage.replace(/_/g, " ")} stage. The full overview will appear once they begin onboarding.`}
          />
        );

      case "properties":
        return <PropertiesTab properties={client!.properties} />;

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
          />
        );

      case "billing":
        if (ownerData) {
          return <FinancialsTab ownerId={ownerData.primaryMember.id} />;
        }
        return (
          <TabPlaceholder
            title="Billing"
            body="Billing and invoice history are available once the client completes onboarding."
          />
        );

      case "intelligence":
        return (
          <TabPlaceholder
            title="Intelligence"
            body="AI-powered relationship insights are coming in Phase 2."
          />
        );

      case "messaging":
        return (
          <TabPlaceholder
            title="Messaging"
            body="Direct messaging is coming in Phase 2."
          />
        );

      case "documents":
        return (
          <TabPlaceholder
            title="Documents"
            body="Document management is coming in Phase 2."
          />
        );

      case "settings":
        if (ownerData) {
          return (
            <TabPlaceholder
              title="Settings"
              body="Owner settings are accessible from the Owners section."
              linkHref={`/admin/owners/${client!.entityId}?tab=settings`}
              linkLabel="Open Settings in Owners"
            />
          );
        }
        return (
          <TabPlaceholder
            title="Settings"
            body="Settings are available once the client completes onboarding."
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
    <ClientDetailShell client={client}>
      {renderTab()}
    </ClientDetailShell>
  );
}
