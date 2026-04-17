import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchOwnerDetail } from "@/lib/admin/owner-detail";
import { fetchInternalNote } from "@/lib/admin/owner-facts-actions";
import { createClient } from "@/lib/supabase/server";
import { OwnerDetailShell } from "./OwnerDetailShell";
import { OverviewTab } from "./OverviewTab";
import { TabPlaceholder } from "./TabPlaceholder";
import { FinancialsTab } from "./FinancialsTab";
import {
  SettingsTab,
  SETTINGS_SECTIONS,
  type SettingsSection,
} from "./SettingsTab";

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

type StoredContactMethod = "email" | "sms" | "phone" | "whatsapp" | null;
const CONTACT_METHODS = ["email", "sms", "phone", "whatsapp"] as const;

export default async function OwnerHubPage({
  params,
  searchParams,
}: {
  params: Promise<{ entityId: string }>;
  searchParams: Promise<{ tab?: string; section?: string }>;
}) {
  const { entityId } = await params;
  const { tab: tabParam = "overview", section: sectionParam = "personal" } =
    await searchParams;
  const tab: TabKey = (KNOWN_TABS as readonly string[]).includes(tabParam)
    ? (tabParam as TabKey)
    : "overview";
  const section: SettingsSection = (SETTINGS_SECTIONS as readonly string[]).includes(
    sectionParam,
  )
    ? (sectionParam as SettingsSection)
    : "personal";

  const data = await fetchOwnerDetail(entityId);
  if (!data) notFound();

  // Fetch the extras Settings > Personal info needs. Only hit these when the
  // Settings tab is active so other tabs don't pay the cost.
  let profileExtras: {
    preferredName: string | null;
    contactMethod: StoredContactMethod;
  } = { preferredName: null, contactMethod: null };
  let internalNote: Awaited<ReturnType<typeof fetchInternalNote>> = null;

  if (tab === "settings") {
    const supabase = await createClient();
    const { data: extras } = await supabase
      .from("profiles")
      .select("preferred_name, contact_method")
      .eq("id", data.primaryMember.id)
      .maybeSingle();
    const rawContact = extras?.contact_method ?? null;
    profileExtras = {
      preferredName: extras?.preferred_name ?? null,
      contactMethod:
        rawContact && (CONTACT_METHODS as readonly string[]).includes(rawContact)
          ? (rawContact as StoredContactMethod)
          : null,
    };
    internalNote = await fetchInternalNote(data.primaryMember.id);
  }

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
        <FinancialsTab ownerId={data.primaryMember.id} />
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
        <SettingsTab
          data={data}
          activeSection={section}
          profileExtras={profileExtras}
          internalNote={internalNote}
        />
      ) : null}
    </OwnerDetailShell>
  );
}
