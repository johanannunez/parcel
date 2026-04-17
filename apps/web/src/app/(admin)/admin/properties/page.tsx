import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { normalizeUnit, shortenStreet } from "@/lib/address";
import { getChecklistItemsForProperties, type ChecklistItem } from "@/lib/checklist";
import { GridViewPage } from "./GridViewPage";
import { HomesView } from "./HomesView";
import type { HomesProperty, BookingSummary, HomesMode } from "./homes-types";

export const metadata: Metadata = { title: "Properties (Admin)" };
export const dynamic = "force-dynamic";

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  // URL routing:
  //   ?view=launchpad  → spreadsheet-style Status board (onboarding progress).
  //   ?view=details    → photo-based Homes view (Gallery or Table mode).
  const view = params.view === "launchpad" ? "launchpad" : "details";
  const modeParam = typeof params.mode === "string" ? params.mode : "";
  const homesMode: HomesMode = modeParam === "table" ? "table" : "gallery";

  const supabase = await createClient();

  const [{ data: properties }, { data: propertyOwnersData }] = await Promise.all([
    supabase
      .from("properties")
      .select(
        "id, address_line1, address_line2, city, state, postal_code, name, bedrooms, bathrooms, half_bathrooms, guest_capacity, home_type, parking_spaces, currently_rented, cover_photo_url, square_feet, owner_id, created_at",
      )
      .order("created_at", { ascending: true }),
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
        .select("id, full_name, email")
        .in("id", ownerIds)
    : { data: [] as { id: string; full_name: string | null; email: string }[] };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedOwnersProfiles = (ownersProfiles ?? []) as any[];
  const ownerMap = new Map(
    typedOwnersProfiles.map((o) => {
      const fullName = (o.full_name as string | null) ?? null;
      const shortName = fullName ? fullName.split(/\s+/)[0] : null;
      return [
        o.id as string,
        { name: fullName, shortName, email: o.email as string },
      ];
    }),
  );

  const propertyIds = (properties ?? []).map((p) => p.id);

  // Bookings (only for Homes view to compute occupancy + next guest)
  let bookingsByProperty = new Map<string, BookingSummary[]>();
  if (view === "details" && propertyIds.length > 0) {
    const todayIso = new Date().toISOString().slice(0, 10);
    const { data: bookingRows } = await supabase
      .from("bookings")
      .select("id, property_id, check_in, check_out, guest_name, nights, status")
      .in("property_id", propertyIds)
      .gte("check_out", todayIso)
      .order("check_in", { ascending: true });
    bookingsByProperty = new Map<string, BookingSummary[]>();
    for (const b of bookingRows ?? []) {
      const list = bookingsByProperty.get(b.property_id) ?? [];
      list.push({
        id: b.id,
        checkIn: b.check_in,
        checkOut: b.check_out,
        guestName: b.guest_name ?? null,
        nights: b.nights ?? null,
        status: b.status ?? null,
      });
      bookingsByProperty.set(b.property_id, list);
    }
  }

  const rows = (properties ?? []).map((p) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const line2 = (p as any).address_line2 as string | null;

    const ownerIdSet = ownersByPropertyId.get(p.id) ?? new Set<string>();
    const allOwnerIds = Array.from(ownerIdSet);
    const orderedOwnerIds = p.owner_id
      ? [p.owner_id, ...allOwnerIds.filter((id) => id !== p.owner_id)]
      : allOwnerIds;
    const ownersList = orderedOwnerIds.map((id) => ({
      id,
      name: ownerMap.get(id)?.name ?? null,
      shortName: ownerMap.get(id)?.shortName ?? null,
      email: ownerMap.get(id)?.email ?? null,
    }));

    return {
      id: p.id,
      street: shortenStreet(p.address_line1),
      unit: line2 ? normalizeUnit(line2) : null,
      location: `${p.city}, ${p.state} ${p.postal_code ?? ""}`.trim(),
      owners: ownersList,
      raw: p,
    };
  });

  if (view === "launchpad") {
    const checklistItems: ChecklistItem[] =
      propertyIds.length > 0
        ? await getChecklistItemsForProperties(supabase, propertyIds)
        : [];

    return (
      <GridViewPage
        properties={rows.map((r) => ({
          id: r.id,
          street: r.street,
          unit: r.unit,
          location: r.location,
          owners: r.owners.map((o) => ({
            id: o.id,
            name: o.name,
            shortName: o.shortName,
          })),
        }))}
        checklistItems={checklistItems}
        owners={(ownersProfiles ?? []).map((o) => ({ id: o.id, name: o.full_name }))}
      />
    );
  }

  // Homes view (photo-forward property catalog)
  const homesRows: HomesProperty[] = rows.map((r) => {
    const p = r.raw;
    return {
      id: r.id,
      nickname: p.name ?? null,
      street: r.street,
      unit: r.unit,
      city: p.city,
      state: p.state,
      postalCode: p.postal_code ?? null,
      bedrooms: p.bedrooms ?? null,
      bathrooms: p.bathrooms ?? null,
      halfBathrooms: p.half_bathrooms ?? null,
      guestCapacity: p.guest_capacity ?? null,
      homeType: p.home_type ?? null,
      parkingSpaces: p.parking_spaces ?? null,
      squareFeet: p.square_feet ?? null,
      coverPhotoUrl: p.cover_photo_url ?? null,
      owners: r.owners,
      bookings: bookingsByProperty.get(r.id) ?? [],
    };
  });

  return <HomesView properties={homesRows} initialMode={homesMode} />;
}
