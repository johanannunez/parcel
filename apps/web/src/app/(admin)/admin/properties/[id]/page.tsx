import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { propertyLabel } from "@/lib/address";
import { fetchRecentActivity } from "@/lib/admin/detail-rail";
import { TasksTab } from "@/components/admin/tasks/TasksTab";
import { MaintenanceTemplatesPanelServer } from "@/components/admin/properties/MaintenanceTemplatesPanelServer";
import { PropertyDetailShell } from "./PropertyDetailShell";

export const metadata: Metadata = { title: "Property Detail" };
export const dynamic = "force-dynamic";

type TabKey = "overview" | "tasks" | "maintenance" | "activity" | "files" | "settings";
const KNOWN_TABS: readonly TabKey[] = ["overview", "tasks", "maintenance", "activity", "files", "settings"];

export default async function PropertyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: tabParam = "overview" } = await searchParams;
  const tab: TabKey = (KNOWN_TABS as readonly string[]).includes(tabParam)
    ? (tabParam as TabKey)
    : "overview";

  const supabase = await createClient();
  const { data: property } = await supabase
    .from("properties")
    .select(
      "id, address_line1, address_line2, city, state, postal_code, name, bedrooms, bathrooms, setup_status, active, created_at, owner_id",
    )
    .eq("id", id)
    .maybeSingle();

  if (!property) notFound();

  const label = propertyLabel(property);

  // Fetch initial rail events server-side (skip on settings tab).
  const initialRailEvents =
    tab !== "settings"
      ? await fetchRecentActivity("property", id, 8)
      : [];

  return (
    <PropertyDetailShell
      property={property}
      label={label}
      activeTab={tab}
      initialRailEvents={initialRailEvents}
      realtimeId={id}
    >
      {tab === "tasks" ? (
        <TasksTab parentType="property" parentId={property.id} />
      ) : tab === "maintenance" ? (
        <div style={{ padding: "24px" }}>
          <MaintenanceTemplatesPanelServer propertyId={property.id} />
        </div>
      ) : tab === "activity" ? (
        <div className="overviewPlaceholder" style={{ padding: "40px 32px", background: "#fff", border: "1px solid #E6ECF2", borderRadius: 14 }}>
          <p style={{ fontSize: 13.5, color: "#647689", lineHeight: 1.6, margin: 0 }}>
            Activity feed coming soon.
          </p>
        </div>
      ) : tab === "files" ? (
        <div className="overviewPlaceholder" style={{ padding: "40px 32px", background: "#fff", border: "1px solid #E6ECF2", borderRadius: 14 }}>
          <p style={{ fontSize: 13.5, color: "#647689", lineHeight: 1.6, margin: 0 }}>
            Files coming soon.
          </p>
        </div>
      ) : tab === "settings" ? (
        <div style={{ padding: "40px 32px", background: "#fff", border: "1px solid #E6ECF2", borderRadius: 14 }}>
          <p style={{ fontSize: 13.5, color: "#647689", lineHeight: 1.6, margin: 0 }}>
            Settings coming soon.
          </p>
        </div>
      ) : (
        <div style={{ padding: "40px 32px", background: "#fff", border: "1px solid #E6ECF2", borderRadius: 14 }}>
          <p style={{ fontSize: 13.5, color: "#647689", lineHeight: 1.6, margin: 0 }}>
            Full property detail view is being built. The right rail is live now.
          </p>
        </div>
      )}
    </PropertyDetailShell>
  );
}
