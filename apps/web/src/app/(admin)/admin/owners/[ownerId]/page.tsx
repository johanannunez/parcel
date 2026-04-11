import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OwnerHubTabs } from "./OwnerHubTabs";

export const metadata: Metadata = {
  title: "Owner Hub",
};
export const dynamic = "force-dynamic";

export default async function OwnerHubPage({
  params,
  searchParams,
}: {
  params: Promise<{ ownerId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { ownerId } = await params;
  const { tab = "overview" } = await searchParams;
  const supabase = await createClient();

  // Fetch owner profile
  const { data: owner } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, created_at, onboarding_completed_at")
    .eq("id", ownerId)
    .eq("role", "owner")
    .single();

  if (!owner) {
    notFound();
  }

  // Get property IDs for this owner (primary + co-owned)
  const [{ data: primaryProps }, { data: coOwnedProps }] = await Promise.all([
    supabase.from("properties").select("id").eq("owner_id", ownerId),
    (supabase as any).from("property_owners").select("property_id").eq("owner_id", ownerId),
  ]);
  const propertyIds = [
    ...new Set([
      ...(primaryProps ?? []).map((p) => p.id),
      ...(coOwnedProps ?? []).map((po: { property_id: string }) => po.property_id),
    ]),
  ];

  // Fetch all data in parallel
  const [
    { data: properties },
    { data: bookings },
    { data: payouts },
    { data: blockRequests },
    { data: setupDraft },
    { data: tasks },
    { data: notes },
    { data: timeline },
    { data: documents },
    { data: receipts },
  ] = await Promise.all([
    propertyIds.length > 0
      ? supabase
          .from("properties")
          .select(
            "id, name, address_line1, city, state, postal_code, active, hospitable_property_id, setup_status, created_at",
          )
          .in("id", propertyIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    propertyIds.length > 0
      ? supabase
          .from("bookings")
          .select("id, property_id, guest_name, check_in, check_out, source, status, total_amount, currency")
          .in("property_id", propertyIds)
          .order("check_in", { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] }),
    propertyIds.length > 0
      ? supabase
          .from("payouts")
          .select("id, property_id, period_start, period_end, gross_revenue, fees, net_payout, paid_at")
          .in("property_id", propertyIds)
          .order("period_start", { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] }),
    supabase
      .from("block_requests")
      .select("id, property_id, start_date, end_date, note, status, created_at")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("owner_setup_drafts")
      .select("data")
      .eq("user_id", ownerId)
      .single(),
    // Tasks
    (supabase as any)
      .from("owner_tasks")
      .select("id, title, description, status, priority, property_id, due_date, created_at, completed_at")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false })
      .limit(100),
    // Notes
    (supabase as any)
      .from("owner_notes")
      .select("id, body, visibility, property_id, created_at")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false })
      .limit(100),
    // Timeline
    (supabase as any)
      .from("owner_timeline")
      .select("id, event_type, title, body, property_id, created_at")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false })
      .limit(100),
    // Documents
    (supabase as any)
      .from("documents")
      .select("id, title, doc_type, status, scope, file_url, created_at")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false })
      .limit(100),
    // Receipts
    (supabase as any)
      .from("owner_receipts")
      .select("id, vendor, amount, currency, category, purchase_date, image_url, notes, visibility, property_id, created_at")
      .eq("owner_id", ownerId)
      .order("purchase_date", { ascending: false })
      .limit(500),
  ]);

  // Build property name map for display
  const propertyMap = new Map(
    (properties ?? []).map((p) => [
      p.id,
      p.name?.trim() || p.address_line1 || "Property",
    ]),
  );

  return (
    <OwnerHubTabs
      activeTab={tab}
      ownerId={ownerId}
      owner={{
        id: owner.id,
        fullName: owner.full_name?.trim() || owner.email,
        email: owner.email,
        phone: owner.phone,
        createdAt: owner.created_at,
        onboardedAt: owner.onboarding_completed_at,
        isPending: owner.email.endsWith("@pending.theparcelco.com"),
      }}
      properties={properties ?? []}
      bookings={(bookings ?? []).map((b) => ({
        ...b,
        propertyLabel: propertyMap.get(b.property_id) ?? "Property",
      }))}
      payouts={(payouts ?? []).map((p) => ({
        ...p,
        propertyLabel: propertyMap.get(p.property_id) ?? "Property",
      }))}
      blockRequests={(blockRequests ?? []).map((br) => ({
        ...br,
        propertyLabel: propertyMap.get(br.property_id) ?? "Property",
      }))}
      setupData={setupDraft?.data ?? null}
      tasks={(tasks ?? []).map((t: any) => ({
        ...t,
        propertyLabel: t.property_id
          ? propertyMap.get(t.property_id) ?? "Property"
          : null,
      }))}
      notes={(notes ?? []).map((n: any) => ({
        ...n,
        propertyLabel: n.property_id
          ? propertyMap.get(n.property_id) ?? "Property"
          : null,
        created_by_name: null,
      }))}
      timeline={(timeline ?? []).map((e: any) => ({
        ...e,
        propertyLabel: e.property_id
          ? propertyMap.get(e.property_id) ?? "Property"
          : null,
      }))}
      documents={(documents ?? []).map((d: any) => ({
        ...d,
      }))}
      receipts={(receipts ?? []).map((r: any) => ({
        ...r,
        propertyLabel: r.property_id
          ? propertyMap.get(r.property_id) ?? "Property"
          : null,
      }))}
    />
  );
}
