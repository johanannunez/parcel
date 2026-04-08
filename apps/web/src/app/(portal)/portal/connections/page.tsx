import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/portal/PageHeader";
import { ConnectionCard, type ConnectionState } from "./ConnectionCard";

export const metadata: Metadata = { title: "Connections" };
export const dynamic = "force-dynamic";

const CATALOG: Omit<ConnectionState, "connected" | "lastSync">[] = [
  {
    provider: "hospitable",
    label: "Hospitable",
    description: "Channel manager for listings, calendars, and messaging.",
    brand: "#1b77be",
  },
  {
    provider: "airbnb",
    label: "Airbnb",
    description: "Pull reservations and listing performance directly.",
    brand: "#FF5A5F",
  },
  {
    provider: "vrbo",
    label: "Vrbo",
    description: "Sync bookings and calendar availability from Vrbo.",
    brand: "#245ABC",
  },
  {
    provider: "stripe",
    label: "Stripe",
    description: "Receive payouts straight to your bank account.",
    brand: "#635BFF",
  },
  {
    provider: "google_calendar",
    label: "Google Calendar",
    description: "Mirror reservations into your personal calendar.",
    brand: "#1a73e8",
  },
];

export default async function ConnectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rows } = await supabase
    .from("connections")
    .select("provider, status, metadata, updated_at");

  const byProvider = new Map(
    (rows ?? []).map((r) => [
      r.provider,
      {
        status: r.status,
        lastSync:
          (r.metadata as { connected_at?: string } | null)?.connected_at ??
          r.updated_at,
      },
    ]),
  );

  const states: ConnectionState[] = CATALOG.map((c) => {
    const match = byProvider.get(c.provider);
    return {
      ...c,
      connected: match?.status === "connected",
      lastSync: match?.lastSync ?? null,
    };
  });

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Integrations"
        title="Connections"
        description="Link your booking channels, payment processor, and calendar so Parcel stays in sync with the rest of your stack."
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {states.map((c) => (
          <ConnectionCard key={c.provider} c={c} />
        ))}
      </div>
    </div>
  );
}
