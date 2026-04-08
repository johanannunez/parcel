import type { Metadata } from "next";
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/portal/PageHeader";
import { EmptyState } from "@/components/portal/EmptyState";
import { CalendarView } from "./CalendarView";

export const metadata: Metadata = { title: "Calendar" };
export const dynamic = "force-dynamic";

type SP = Promise<{ month?: string; year?: string }>;

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const { month, year } = await searchParams;
  const now = new Date();
  const curMonth =
    month !== undefined ? Number(month) : now.getMonth();
  const curYear = year !== undefined ? Number(year) : now.getFullYear();

  const first = new Date(curYear, curMonth, 1);
  const last = new Date(curYear, curMonth + 1, 0);

  // Fetch properties and any booking that overlaps the visible month.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const viewStart = iso(first);
  const viewEnd = iso(last);

  const [{ data: properties }, { data: bookings }] = await Promise.all([
    supabase
      .from("properties")
      .select("id, name, address_line1")
      .order("created_at", { ascending: true }),
    supabase
      .from("bookings")
      .select(
        "id, property_id, guest_name, check_in, check_out, source, status, total_amount",
      )
      .lte("check_in", viewEnd)
      .gte("check_out", viewStart)
      .neq("status", "cancelled"),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Schedule"
        title="Calendar"
        description="Every reservation across your portfolio, color-coded by property. Click a booking for details."
      />

      {(properties ?? []).length === 0 ? (
        <EmptyState
          icon={<CalendarBlank size={26} weight="duotone" />}
          title="Calendar unlocks with your first property"
          body="Add a home and we will pull in its reservations automatically."
        />
      ) : (
        <CalendarView
          year={curYear}
          month={curMonth}
          properties={(properties ?? []).map((p) => ({
            id: p.id,
            name: p.name?.trim() || p.address_line1,
          }))}
          bookings={(bookings ?? []).map((b) => ({
            id: b.id,
            property_id: b.property_id,
            guest_name: b.guest_name,
            check_in: b.check_in,
            check_out: b.check_out,
            source: b.source,
            status: b.status,
            total_amount: b.total_amount ? Number(b.total_amount) : null,
          }))}
        />
      )}
    </div>
  );
}
