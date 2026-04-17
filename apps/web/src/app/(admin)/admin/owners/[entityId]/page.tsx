import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchOwnerDetail } from "@/lib/admin/owner-detail";
import { fetchInternalNote } from "@/lib/admin/owner-facts-actions";
import { createClient } from "@/lib/supabase/server";
import { OwnerDetailShell } from "./OwnerDetailShell";
import { OverviewTab } from "./OverviewTab";
import { TabPlaceholder } from "./TabPlaceholder";
import { FinancialsTab } from "./FinancialsTab";
import { SettingsTab } from "./SettingsTab";
import { SETTINGS_SECTIONS, type SettingsSection } from "./settings-sections";
import type { SessionRow } from "./settings/AccountSecuritySection";
import type { ConnectionRow } from "./settings/DataPrivacySection";

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

  // Fetch the extras the Settings tab needs. Only hit these when the
  // Settings tab is active so other tabs don't pay the cost.
  let profileExtras: {
    preferredName: string | null;
    contactMethod: StoredContactMethod;
    timezone: string | null;
  } = { preferredName: null, contactMethod: null, timezone: null };
  let internalNote: Awaited<ReturnType<typeof fetchInternalNote>> = null;
  let sessions: SessionRow[] = [];
  let connections: ConnectionRow[] = [];
  let entityDetail: {
    id: string;
    name: string;
    type: string | null;
    ein: string | null;
    notes: string | null;
  } | null = null;

  if (tab === "settings") {
    const supabase = await createClient();

    const { data: extras } = await supabase
      .from("profiles")
      .select("preferred_name, contact_method, timezone")
      .eq("id", data.primaryMember.id)
      .maybeSingle();
    const rawContact = extras?.contact_method ?? null;
    profileExtras = {
      preferredName: extras?.preferred_name ?? null,
      contactMethod:
        rawContact && (CONTACT_METHODS as readonly string[]).includes(rawContact)
          ? (rawContact as StoredContactMethod)
          : null,
      timezone: extras?.timezone ?? null,
    };
    internalNote = await fetchInternalNote(data.primaryMember.id);

    const { data: rawSessions } = await supabase
      .from("session_log")
      .select("id, logged_in_at, device_type, browser, os, city, country")
      .eq("user_id", data.primaryMember.id)
      .order("logged_in_at", { ascending: false })
      .limit(8);
    sessions = (rawSessions ?? []).map((r) => ({
      id: r.id,
      loggedInAt: r.logged_in_at,
      deviceType: r.device_type,
      browser: r.browser,
      os: r.os,
      city: r.city,
      country: r.country,
    }));

    const { data: rawConnections } = await supabase
      .from("connections")
      .select("id, provider, external_account_id, status, metadata, connected_at")
      .eq("owner_id", data.primaryMember.id)
      .order("connected_at", { ascending: false });
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

    const { data: rawEntity } = await supabase
      .from("entities")
      .select("id, name, type, ein, notes")
      .eq("id", data.entity.id)
      .maybeSingle();
    entityDetail = rawEntity ?? {
      id: data.entity.id,
      name: data.entity.name,
      type: null,
      ein: null,
      notes: null,
    };
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
          sessions={sessions}
          connections={connections}
          entityDetail={entityDetail}
        />
      ) : null}
    </OwnerDetailShell>
  );
}
