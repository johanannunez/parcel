import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchRecentActivity } from "@/lib/admin/detail-rail";
import { PropertyDetailShell } from "./PropertyDetailShell";

export const metadata: Metadata = { title: "Property Detail" };
export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = "overview" } = await searchParams;

  const supabase = await createClient();
  const { data: property } = await supabase
    .from("properties")
    .select(
      "id, address_line1, address_line2, city, state, postal_code, active, setup_status, bedrooms, bathrooms, created_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (!property) notFound();

  // Fetch initial rail events server-side (skip on settings tab).
  const initialRailEvents =
    tab !== "settings"
      ? await fetchRecentActivity("property", id, 8)
      : [];

  return (
    <PropertyDetailShell
      property={property}
      activeTab={tab}
      initialRailEvents={initialRailEvents}
      realtimeId={id}
    />
  );
}
