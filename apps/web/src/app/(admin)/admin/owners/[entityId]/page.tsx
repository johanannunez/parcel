import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchOwnerDetail } from "@/lib/admin/owner-detail";
import { OwnerDetailShell } from "./OwnerDetailShell";
import { OverviewTab } from "./OverviewTab";
import { TabPlaceholder } from "./TabPlaceholder";

export const metadata: Metadata = {
  title: "Owner Hub",
};
export const dynamic = "force-dynamic";

type TabKey =
  | "overview"
  | "properties"
  | "financials"
  | "activity"
  | "files"
  | "settings";

const KNOWN_TABS: readonly TabKey[] = [
  "overview",
  "properties",
  "financials",
  "activity",
  "files",
  "settings",
];

export default async function OwnerHubPage({
  params,
  searchParams,
}: {
  params: Promise<{ entityId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { entityId } = await params;
  const { tab: tabParam = "overview" } = await searchParams;
  const tab: TabKey = (KNOWN_TABS as readonly string[]).includes(tabParam)
    ? (tabParam as TabKey)
    : "overview";

  const data = await fetchOwnerDetail(entityId);
  if (!data) notFound();

  return (
    <OwnerDetailShell data={data}>
      {tab === "overview" ? <OverviewTab data={data} /> : null}
      {tab === "properties" ? (
        <TabPlaceholder
          title="Properties. Rebuilding."
          body="This tab is being rebuilt with the new design. In the meantime, the full properties list is available in the admin Properties page."
          linkHref="/admin/properties"
          linkLabel="Go to Properties"
        />
      ) : null}
      {tab === "financials" ? (
        <TabPlaceholder
          title="Financials. Rebuilding."
          body="Stripe invoicing and the new financials dashboard are shipping in a later plan. You can still see payouts in the admin Payouts page."
          linkHref="/admin/payouts"
          linkLabel="Go to Payouts"
        />
      ) : null}
      {tab === "activity" ? (
        <TabPlaceholder
          title="Activity. Rebuilding."
          body="The full activity feed will show everything across this owner and their properties. Until then, the Timeline page has the complete log."
          linkHref="/admin/timeline"
          linkLabel="Go to Timeline"
        />
      ) : null}
      {tab === "files" ? (
        <TabPlaceholder
          title="Files. Rebuilding."
          body="Every document for this owner (W9s, ACH forms, agreements) will live here once the new documents storage ships."
        />
      ) : null}
      {tab === "settings" ? (
        <TabPlaceholder
          title="Settings. Rebuilding."
          body="The full ten-section settings surface (Personal info, Account, Business entity, Notifications, Payments, and more) is shipping in Plan 4."
        />
      ) : null}
    </OwnerDetailShell>
  );
}
