import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { propertyLabel } from "@/lib/address";
import { TasksTab } from "@/components/admin/tasks/TasksTab";
import { PropertyDetailShell } from "./PropertyDetailShell";

export const metadata: Metadata = { title: "Property" };
export const dynamic = "force-dynamic";

type TabKey = "overview" | "tasks";
const KNOWN_TABS: readonly TabKey[] = ["overview", "tasks"];

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

  return (
    <PropertyDetailShell
      id={property.id}
      label={label}
      city={property.city}
      state={property.state}
    >
      {tab === "tasks" ? (
        <TasksTab parentType="property" parentId={property.id} />
      ) : (
        <div style={{ padding: "24px 20px", color: "#6b7280", fontSize: 13 }}>
          Overview coming soon.
        </div>
      )}
    </PropertyDetailShell>
  );
}
