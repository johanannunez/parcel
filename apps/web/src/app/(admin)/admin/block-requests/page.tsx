import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { propertyLabel } from "@/lib/address";
import { BlockRequestRow } from "./BlockRequestRow";

export const metadata: Metadata = { title: "Reservations to verify" };
export const dynamic = "force-dynamic";

export default async function AdminBlockRequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rows } = await supabase
    .from("block_requests")
    .select(
      "id, owner_id, property_id, start_date, end_date, note, status, created_at, profiles!block_requests_owner_id_fkey(full_name, email), properties!block_requests_property_id_fkey(address_line1, address_line2, city, state, postal_code)",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const mapped = (rows ?? []).map((r) => {
    const profile = r.profiles as unknown as {
      full_name: string | null;
      email: string;
    } | null;
    const property = r.properties as unknown as {
      address_line1: string | null;
      address_line2: string | null;
      city: string | null;
      state: string | null;
      postal_code: string | null;
    } | null;
    return {
      id: r.id,
      status: r.status as "pending" | "approved" | "declined" | "cancelled",
      startDate: r.start_date,
      endDate: r.end_date,
      note: r.note,
      createdAt: r.created_at,
      ownerName: profile?.full_name ?? null,
      ownerEmail: profile?.email ?? "",
      propertyLabel: propertyLabel(property ?? {}),
    };
  });

  const pending = mapped.filter((r) => r.status === "pending");
  const past = mapped.filter((r) => r.status !== "pending");

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10 lg:py-14">
    <div className="flex flex-col gap-10">
      <header>
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Admin
        </p>
        <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-tight" style={{ color: "var(--color-text-primary)" }}>
          Reservations to verify
        </h1>
        <p
          className="mt-2 max-w-2xl text-base"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Owners requesting time in their own homes. Check each range for
          conflicts against existing bookings and confirm clear, then mirror
          the dates in Hospitable.
        </p>
      </header>

      {pending.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2
            className="text-xs font-semibold uppercase tracking-[0.1em]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Under review ({pending.length})
          </h2>
          {pending.map((r) => (
            <BlockRequestRow key={r.id} row={r} />
          ))}
        </section>
      ) : (
        <div
          className="rounded-xl border p-6 text-center text-sm"
          style={{
            borderColor: "var(--color-warm-gray-200)",
            color: "var(--color-text-tertiary)",
          }}
        >
          No reservations to verify right now.
        </div>
      )}

      {past.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2
            className="text-xs font-semibold uppercase tracking-[0.1em]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Past requests
          </h2>
          {past.map((r) => (
            <BlockRequestRow key={r.id} row={r} />
          ))}
        </section>
      ) : null}
    </div>
    </div>
  );
}
