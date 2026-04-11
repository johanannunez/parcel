import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { propertyLabel } from "@/lib/address";
import { OwnerHubTabs } from "./OwnerHubTabs";

export const metadata: Metadata = {
  title: "Owner Hub",
};
export const dynamic = "force-dynamic";

export default async function OwnerHubPage({
  params,
  searchParams,
}: {
  params: Promise<{ entityId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { entityId } = await params;
  const { tab = "overview" } = await searchParams;
  const supabase = await createClient();

  // Fetch entity and all member profiles
  const [{ data: entity }, { data: members }] = await Promise.all([
    supabase
      .from("entities")
      .select("id, name, type, ein, notes, created_at, updated_at")
      .eq("id", entityId)
      .single(),
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, avatar_url, created_at, onboarding_completed_at")
      .eq("entity_id", entityId)
      .eq("role", "owner")
      .order("created_at", { ascending: true }),
  ]);

  if (!entity || !members || members.length === 0) {
    notFound();
  }

  const memberIds = members.map((m) => m.id);
  const primaryMember = members[0];

  // Get property IDs across all members (primary + co-owned)
  const [{ data: primaryProps }, { data: coOwnedProps }] = await Promise.all([
    supabase.from("properties").select("id").in("owner_id", memberIds),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("property_owners")
      .select("property_id")
      .in("owner_id", memberIds),
  ]);
  const propertyIds = [
    ...new Set([
      ...(primaryProps ?? []).map((p) => p.id),
      ...((coOwnedProps as Array<{ property_id: string }> | null) ?? []).map((po) => po.property_id),
    ]),
  ];

  // Fetch all data in parallel, scoped to all member profiles
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
            "id, address_line1, address_line2, city, state, postal_code, active, hospitable_property_id, setup_status, created_at",
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
      .in("owner_id", memberIds)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("owner_setup_drafts")
      .select("data")
      .eq("user_id", primaryMember.id)
      .single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("owner_tasks")
      .select("id, title, description, status, priority, property_id, due_date, created_at, completed_at, owner_id")
      .in("owner_id", memberIds)
      .order("created_at", { ascending: false })
      .limit(100),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("owner_notes")
      .select("id, body, visibility, property_id, created_at, owner_id")
      .in("owner_id", memberIds)
      .order("created_at", { ascending: false })
      .limit(100),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("owner_timeline")
      .select("id, event_type, title, body, property_id, created_at, owner_id")
      .in("owner_id", memberIds)
      .order("created_at", { ascending: false })
      .limit(100),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("documents")
      .select("id, title, doc_type, status, scope, file_url, created_at, owner_id")
      .in("owner_id", memberIds)
      .order("created_at", { ascending: false })
      .limit(100),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("owner_receipts")
      .select("id, vendor, amount, currency, category, purchase_date, image_url, notes, visibility, property_id, created_at, owner_id")
      .in("owner_id", memberIds)
      .order("purchase_date", { ascending: false })
      .limit(500),
  ]);

  // Build property label map for display
  const propertyMap = new Map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (properties ?? []).map((p) => [p.id, propertyLabel(p as any)]),
  );

  const allMembersOnboarded = members.every((m) => !!m.onboarding_completed_at);
  const allPending = members.every((m) => m.email.endsWith("@pending.theparcelco.com"));

  return (
    <OwnerHubTabs
      activeTab={tab}
      ownerId={primaryMember.id}
      owner={{
        id: entity.id,
        fullName: entity.name,
        email: primaryMember.email,
        phone: primaryMember.phone,
        createdAt: entity.created_at,
        onboardedAt: allMembersOnboarded ? primaryMember.onboarding_completed_at : null,
        isPending: allPending,
      }}
      entity={{
        id: entity.id,
        name: entity.name,
        type: entity.type,
        ein: entity.ein,
        notes: entity.notes,
        members: members.map((m) => ({
          id: m.id,
          fullName: m.full_name,
          email: m.email,
          phone: m.phone,
          avatarUrl: m.avatar_url,
          onboardedAt: m.onboarding_completed_at,
          isPending: m.email.endsWith("@pending.theparcelco.com"),
        })),
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tasks={(tasks ?? []).map((t: any) => ({
        ...t,
        propertyLabel: t.property_id
          ? propertyMap.get(t.property_id) ?? "Property"
          : null,
      }))}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      notes={(notes ?? []).map((n: any) => ({
        ...n,
        propertyLabel: n.property_id
          ? propertyMap.get(n.property_id) ?? "Property"
          : null,
        created_by_name: null,
      }))}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      timeline={(timeline ?? []).map((e: any) => ({
        ...e,
        propertyLabel: e.property_id
          ? propertyMap.get(e.property_id) ?? "Property"
          : null,
      }))}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      documents={(documents ?? []).map((d: any) => ({
        ...d,
      }))}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      receipts={(receipts ?? []).map((r: any) => ({
        ...r,
        propertyLabel: r.property_id
          ? propertyMap.get(r.property_id) ?? "Property"
          : null,
      }))}
    />
  );
}
