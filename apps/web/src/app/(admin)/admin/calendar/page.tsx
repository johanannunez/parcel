import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

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
        .select("id, name, address_line1")
        .in("id", propertyIds)
    : { data: [] };

  const propMap = new Map(
    (props ?? []).map((p) => [p.id, p.name?.trim() || p.address_line1 || "Property"]),
  );

  const monthName = now.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Calendar
        </h1>
        <p
          className="mt-2 text-sm"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          All bookings and blocks across every property.
        </p>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label={`Bookings in ${monthName.split(" ")[0]}`} value={String(bookingsThisMonth.count ?? 0)} />
        <StatCard label="Total bookings (all time)" value={String(totalBookings.count ?? 0)} />
        <StatCard label="Pending block requests" value={String(pendingBlocks.count ?? 0)} />
        <StatCard label="Upcoming check-ins" value={String(upcomingCheckIns.data?.length ?? 0)} />
      </section>

      {/* Upcoming */}
      {(upcomingCheckIns.data?.length ?? 0) > 0 ? (
        <section>
          <h2
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Next check-ins
          </h2>
          <div className="flex flex-col gap-2">
            {upcomingCheckIns.data!.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
                style={{
                  backgroundColor: "var(--color-charcoal)",
                  borderColor: "rgba(255,255,255,0.06)",
                }}
              >
                <div>
                  <div className="text-sm font-medium text-white">
                    {b.guest_name || "Guest"}
                  </div>
                  <div
                    className="mt-0.5 text-xs"
                    style={{ color: "rgba(255,255,255,0.5)" }}
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
                    backgroundColor: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.5)",
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
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl border p-5"
      style={{
        backgroundColor: "var(--color-charcoal)",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="text-[10px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: "rgba(255,255,255,0.5)" }}
      >
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold text-white">{value}</div>
    </div>
  );
}
