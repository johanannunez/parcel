import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { hasHospitable } from "@/lib/hospitable";
import { PropertyRow } from "./PropertyRow";
import { SyncButton } from "./SyncButton";

export const metadata: Metadata = { title: "Properties (Admin)" };
export const dynamic = "force-dynamic";

export default async function AdminPropertiesPage() {
  const supabase = await createClient();

  const [{ data: properties }, { data: bookings }] = await Promise.all([
    supabase
      .from("properties")
      .select(
        "id, name, address_line1, city, state, postal_code, owner_id, hospitable_property_id, ical_url, active, created_at",
      )
      .order("created_at", { ascending: true }),
    supabase
      .from("bookings")
      .select("property_id"),
  ]);

  const ownerIds = Array.from(
    new Set((properties ?? []).map((p) => p.owner_id)),
  );

  const [{ data: owners }] = await Promise.all([
    ownerIds.length
      ? supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", ownerIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string }[] }),
  ]);

  const ownerMap = new Map(
    (owners ?? []).map((o) => [
      o.id,
      { name: o.full_name ?? null, email: o.email },
    ]),
  );

  // Booking count map: property_id -> count
  const bookingCountMap = new Map<string, number>();
  for (const b of bookings ?? []) {
    bookingCountMap.set(b.property_id, (bookingCountMap.get(b.property_id) ?? 0) + 1);
  }

  const rows = (properties ?? []).map((p) => ({
    id: p.id,
    name: p.name?.trim() || null,
    address: p.address_line1,
    location: `${p.city}, ${p.state} ${p.postal_code ?? ""}`.trim(),
    ownerName: ownerMap.get(p.owner_id)?.name ?? null,
    ownerEmail: ownerMap.get(p.owner_id)?.email ?? "Unknown",
    hospitableId: p.hospitable_property_id,
    icalUrl: p.ical_url,
    active: p.active,
    bookingCount: bookingCountMap.get(p.id) ?? 0,
  }));

  const connected = rows.filter((r) => r.hospitableId);
  const unconnected = rows.filter((r) => !r.hospitableId);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Properties
        </h1>
        <p
          className="mt-2 max-w-2xl text-sm"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          Connect each property to Hospitable by pasting its Hospitable
          property ID and iCal feed URL. Once connected, hit Sync to pull
          bookings and calendar data into the portal.
        </p>
      </div>

      {hasHospitable() ? <SyncButton /> : (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            backgroundColor: "rgba(248, 113, 113, 0.06)",
            borderColor: "rgba(248, 113, 113, 0.2)",
            color: "#fca5a5",
          }}
        >
          HOSPITABLE_API is not set. Add it to Doppler to enable syncing.
        </div>
      )}

      {unconnected.length > 0 ? (
        <Section
          title="Needs connection"
          count={unconnected.length}
        >
          {unconnected.map((r) => (
            <PropertyRow key={r.id} row={r} />
          ))}
        </Section>
      ) : null}

      <Section title="All properties" count={rows.length}>
        {rows.map((r) => (
          <PropertyRow key={r.id} row={r} />
        ))}
      </Section>
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-white">
          {title}
        </h2>
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{
            backgroundColor: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          {count}
        </span>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}
