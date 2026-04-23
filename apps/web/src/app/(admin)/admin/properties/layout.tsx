import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { normalizeUnit, shortenStreet } from "@/lib/address";
import { getShowTestData } from "@/lib/admin/test-data";
import { PropertiesLayoutClient } from "./PropertiesLayoutClient";

export default async function PropertiesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const showTestData = await getShowTestData();

  // Lightweight fetch just for the top-bar search popover. The full property
  // detail fetch still lives in page.tsx.
  let propertiesQuery = supabase
    .from("properties")
    .select(
      "id, address_line1, address_line2, city, state, postal_code, owner_id, created_at",
    )
    .order("created_at", { ascending: true });

  if (!showTestData) {
    propertiesQuery = propertiesQuery.not("id", "like", "0000%");
  }

  const [{ data: properties }, { data: propertyOwnersData }] = await Promise.all([
    propertiesQuery,
    supabase.from("property_owners").select("property_id, owner_id"),
  ]);

  const ownersByPropertyId = new Map<string, Set<string>>();
  for (const p of properties ?? []) {
    const set = new Set<string>();
    if (p.owner_id) set.add(p.owner_id);
    ownersByPropertyId.set(p.id, set);
  }
  for (const row of propertyOwnersData ?? []) {
    ownersByPropertyId.get(row.property_id)?.add(row.owner_id);
  }

  const ownerIds = Array.from(
    new Set(Array.from(ownersByPropertyId.values()).flatMap((s) => Array.from(s))),
  );

  const { data: ownersProfiles } = ownerIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ownerIds)
    : { data: [] as { id: string; full_name: string | null }[] };

  const owners = (ownersProfiles ?? []).map((o) => ({
    id: o.id,
    name: (o.full_name as string | null) ?? null,
  }));

  const summaries = (properties ?? []).map((p) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const line2 = (p as any).address_line2 as string | null;
    const ownerIdSet = ownersByPropertyId.get(p.id) ?? new Set<string>();
    return {
      id: p.id,
      street: shortenStreet(p.address_line1),
      unit: line2 ? normalizeUnit(line2) : null,
      location: `${p.city}, ${p.state} ${p.postal_code ?? ""}`.trim(),
      owners: Array.from(ownerIdSet).map((id) => ({
        id,
        name: owners.find((o) => o.id === id)?.name ?? null,
      })),
    };
  });

  return (
    <PropertiesLayoutClient owners={owners} summaries={summaries}>
      {children}
    </PropertiesLayoutClient>
  );
}
