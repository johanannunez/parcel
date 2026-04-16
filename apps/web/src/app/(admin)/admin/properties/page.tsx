import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { normalizeUnit, shortenStreet } from "@/lib/address";
import { getChecklistItemsForProperties, type ChecklistItem } from "@/lib/checklist";
import { LaunchpadView } from "./LaunchpadView";
import { GridViewPage } from "./GridViewPage";
import { PropertiesPageHeader } from "./PropertiesPageHeader";

export const metadata: Metadata = { title: "Properties (Admin)" };
export const dynamic = "force-dynamic";

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  // URL routing:
  //   ?view=launchpad  → the spreadsheet-style Launchpad. Default view.
  //   ?view=details    → per-property card view. Placeholder for the new photo-based Details.
  const view = params.view === "details" ? "details" : "launchpad";
  const supabase = await createClient();

  const [{ data: properties }, { data: propertyOwnersData }] = await Promise.all([
    supabase
      .from("properties")
      .select(
        "id, address_line1, address_line2, city, state, postal_code, owner_id, created_at",
      )
      .order("created_at", { ascending: true }),
    supabase
      .from("property_owners")
      .select("property_id, owner_id"),
  ]);

  // Build property_id → Set of owner_ids, including legacy properties.owner_id
  const ownersByPropertyId = new Map<string, Set<string>>();
  for (const p of properties ?? []) {
    const set = new Set<string>();
    if (p.owner_id) set.add(p.owner_id);
    ownersByPropertyId.set(p.id, set);
  }
  for (const row of propertyOwnersData ?? []) {
    ownersByPropertyId.get(row.property_id)?.add(row.owner_id);
  }

  // Collect all unique owner IDs across all properties
  const ownerIds = Array.from(
    new Set(
      Array.from(ownersByPropertyId.values()).flatMap((s) => Array.from(s)),
    ),
  );

  const [{ data: ownersProfiles }] = await Promise.all([
    ownerIds.length
      ? supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", ownerIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string }[] }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedOwnersProfiles = (ownersProfiles ?? []) as any[];
  const ownerMap = new Map(
    typedOwnersProfiles.map((o) => {
      const fullName = (o.full_name as string | null) ?? null;
      // In admin, always derive short name from the first word of full_name.
      // preferred_name is reserved for the owner's own portal experience.
      const shortName = fullName ? fullName.split(/\s+/)[0] : null;
      return [
        o.id as string,
        { name: fullName, shortName, email: o.email as string },
      ];
    }),
  );

  const rows = (properties ?? []).map((p) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const line2 = (p as any).address_line2 as string | null;

    // All owners for this property, primary first (from properties.owner_id)
    const ownerIdSet = ownersByPropertyId.get(p.id) ?? new Set<string>();
    const allOwnerIds = Array.from(ownerIdSet);
    const orderedOwnerIds = p.owner_id
      ? [p.owner_id, ...allOwnerIds.filter((id) => id !== p.owner_id)]
      : allOwnerIds;
    const ownersList = orderedOwnerIds.map((id) => ({
      id,
      name: ownerMap.get(id)?.name ?? null,
      shortName: ownerMap.get(id)?.shortName ?? null,
    }));

    return {
      id: p.id,
      street: shortenStreet(p.address_line1),
      unit: line2 ? normalizeUnit(line2) : null,
      location: `${p.city}, ${p.state} ${p.postal_code ?? ""}`.trim(),
      owners: ownersList,
    };
  });

  // Fetch checklist items for both views
  const propertyIds = rows.map((r) => r.id);
  const checklistItems: ChecklistItem[] =
    propertyIds.length > 0
      ? await getChecklistItemsForProperties(supabase, propertyIds)
      : [];

  if (view === "launchpad") {
    return (
      <GridViewPage
        properties={rows.map((r) => ({
          id: r.id,
          street: r.street,
          unit: r.unit,
          location: r.location,
          owners: r.owners,
        }))}
        checklistItems={checklistItems}
        owners={(ownersProfiles ?? []).map((o) => ({ id: o.id, name: o.full_name }))}
      />
    );
  }

  // Default/other: Details view (placeholder using existing card-style LaunchpadView)
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-10 lg:py-10">
      <div className="flex flex-col gap-6">
        <PropertiesPageHeader activeView={view} total={rows.length} />
        <LaunchpadView
          properties={rows.map((r) => ({
            id: r.id,
            street: r.street,
            unit: r.unit,
            location: r.location,
            owners: r.owners,
          }))}
          checklistItems={checklistItems}
          owners={(ownersProfiles ?? []).map((o) => ({ id: o.id, name: o.full_name }))}
        />
      </div>
    </div>
  );
}

