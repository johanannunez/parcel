import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PropertyRow } from "./PropertyRow";

export const metadata: Metadata = { title: "Properties (Admin)" };
export const dynamic = "force-dynamic";

export default async function AdminPropertiesPage() {
  const supabase = await createClient();

  const { data: properties } = await supabase
    .from("properties")
    .select(
      "id, name, address_line1, city, state, owner_id, hospitable_property_id, ical_url, active, created_at",
    )
    .order("created_at", { ascending: true });

  const ownerIds = Array.from(
    new Set((properties ?? []).map((p) => p.owner_id)),
  );

  const { data: owners } = ownerIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ownerIds)
    : { data: [] };

  const ownerMap = new Map(
    (owners ?? []).map((o) => [
      o.id,
      { name: o.full_name ?? null, email: o.email },
    ]),
  );

  const rows = (properties ?? []).map((p) => ({
    id: p.id,
    label: p.name?.trim() || p.address_line1,
    location: `${p.city}, ${p.state}`,
    ownerName: ownerMap.get(p.owner_id)?.name ?? null,
    ownerEmail: ownerMap.get(p.owner_id)?.email ?? "Unknown",
    hospitableId: p.hospitable_property_id,
    icalUrl: p.ical_url,
    active: p.active,
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
          property ID and iCal feed URL. Once connected, bookings and
          calendar data will be available to the owner in their portal.
        </p>
      </div>

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
