import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { BlockRequestRow } from "./BlockRequestRow";

export const metadata: Metadata = { title: "Block requests" };
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
      "id, owner_id, property_id, start_date, end_date, note, status, created_at, profiles!block_requests_owner_id_fkey(full_name, email), properties!block_requests_property_id_fkey(name, address_line1)",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const mapped = (rows ?? []).map((r) => {
    const profile = r.profiles as unknown as {
      full_name: string | null;
      email: string;
    } | null;
    const property = r.properties as unknown as {
      name: string | null;
      address_line1: string | null;
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
      propertyLabel:
        property?.name?.trim() || property?.address_line1 || "Property",
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
          Block requests
        </h1>
        <p
          className="mt-2 max-w-2xl text-base"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Owners ask to reserve dates for personal use. Approve or decline
          here, then update Hospitable.
        </p>
      </header>

      {pending.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2
            className="text-xs font-semibold uppercase tracking-[0.1em]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Pending ({pending.length})
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
          No pending block requests.
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
