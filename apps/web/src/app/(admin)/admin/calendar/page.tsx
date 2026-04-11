import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { propertyLabel } from "@/lib/address";

export const metadata: Metadata = {
  title: "Calendar (Admin)",
};
export const dynamic = "force-dynamic";

export default async function AdminCalendarPage() {
  const supabase = await createClient();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

  const [bookingsThisMonth, upcomingCheckIns, pendingBlocks, totalBookings] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .gte("check_in", monthStart)
        .lte("check_in", monthEnd),
      supabase
        .from("bookings")
        .select(
          "id, guest_name, check_in, check_out, property_id, status, source",
        )
        .gte("check_in", now.toISOString())
        .order("check_in", { ascending: true })
        .limit(10),
      supabase
        .from("block_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true }),
    ]);

  // Get property names for upcoming
  const propertyIds = [
    ...new Set(
      (upcomingCheckIns.data ?? []).map((b) => b.property_id),
    ),
  ];
  const { data: props } = propertyIds.length
    ? await supabase
        .from("properties")
        .select("id, address_line1, address_line2, city, state, postal_code")
        .in("id", propertyIds)
    : { data: [] };

  const propMap = new Map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (props ?? []).map((p) => [p.id, propertyLabel(p as any)]),
  );

  const monthName = now.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10 lg:py-14">
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
          Calendar
        </h1>
        <p
          className="mt-2 text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          All bookings and blocks across every property.
        </p>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label={`Bookings in ${monthName.split(" ")[0]}`} value={String(bookingsThisMonth.count ?? 0)} />
        <StatCard label="Total bookings (all time)" value={String(totalBookings.count ?? 0)} />
        <StatCard label="Reservations to verify" value={String(pendingBlocks.count ?? 0)} />
        <StatCard label="Upcoming check-ins" value={String(upcomingCheckIns.data?.length ?? 0)} />
      </section>

      {/* Upcoming */}
      {(upcomingCheckIns.data?.length ?? 0) > 0 ? (
        <section>
          <h2
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Next check-ins
          </h2>
          <div className="flex flex-col gap-2">
            {upcomingCheckIns.data!.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
                style={{
                  backgroundColor: "var(--color-white)",
                  borderColor: "var(--color-warm-gray-200)",
                }}
              >
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {b.guest_name || "Guest"}
                  </div>
                  <div
                    className="mt-0.5 text-xs"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    {propMap.get(b.property_id) ?? "Property"} ·{" "}
                    {new Date(b.check_in).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    -{" "}
                    {new Date(b.check_out).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                  style={{
                    backgroundColor: "var(--color-warm-gray-100)",
                    color: "var(--color-text-tertiary)",
                  }}
                >
                  {b.source.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{
        backgroundColor: "var(--color-white)",
        borderColor: "var(--color-warm-gray-200)",
      }}
    >
      <div
        className="text-[10px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>{value}</div>
    </div>
  );
}
