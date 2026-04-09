import type { Metadata } from "next";
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/portal/PageHeader";
import { EmptyState } from "@/components/portal/EmptyState";
import { CalendarShell } from "./CalendarShell";

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
  const curMonth = month !== undefined ? Number(month) : now.getMonth();
  const curYear = year !== undefined ? Number(year) : now.getFullYear();

  const first = new Date(curYear, curMonth, 1);
  const last = new Date(curYear, curMonth + 1, 0);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const viewStart = iso(first);
  const viewEnd = iso(last);

  const [
    { data: properties },
    { data: bookings },
    { data: activeBlocks },
    { data: recentRequests },
  ] = await Promise.all([
    supabase
      .from("properties")
      .select("id, name, address_line1, ical_url")
      .order("created_at", { ascending: true }),
    supabase
      .from("bookings")
      .select(
        "id, property_id, guest_name, check_in, check_out, source, status, total_amount",
      )
      .lte("check_in", viewEnd)
      .gte("check_out", viewStart)
      .neq("status", "cancelled"),
    supabase
      .from("block_requests")
      .select(
        "id, property_id, start_date, end_date, status, note, created_at",
      )
      .in("status", ["approved", "pending"])
      .lte("start_date", viewEnd)
      .gte("end_date", viewStart),
    supabase
      .from("block_requests")
      .select(
        "id, property_id, start_date, end_date, status, note, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const propertyList = (properties ?? []).map((p) => ({
    id: p.id,
    name: p.name?.trim() || p.address_line1 || "Property",
    ical_url: (p as { ical_url?: string | null }).ical_url ?? null,
  }));

  const hasProperties = propertyList.length > 0;
  const primaryIcalUrl = propertyList[0]?.ical_url ?? null;

  const mappedBookings = (bookings ?? []).map((b) => ({
    id: b.id,
    property_id: b.property_id,
    guest_name: b.guest_name,
    check_in: b.check_in,
    check_out: b.check_out,
    source: b.source,
    status: b.status,
    total_amount: b.total_amount ? Number(b.total_amount) : null,
  }));

  const mappedBlocks = (activeBlocks ?? []).map((r) => ({
    id: r.id,
    property_id: r.property_id,
    start_date: r.start_date,
    end_date: r.end_date,
    status: r.status as "pending" | "approved" | "declined",
    note: r.note,
    created_at: r.created_at,
  }));

  const mappedPastRequests = (recentRequests ?? []).map((r) => ({
    id: r.id,
    property_id: r.property_id,
    start_date: r.start_date,
    end_date: r.end_date,
    status: r.status as "pending" | "approved" | "declined",
    note: r.note,
    created_at: r.created_at,
  }));

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Schedule" title="Calendar" />

      {!hasProperties ? (
        <EmptyState
          icon={<CalendarBlank size={26} weight="duotone" />}
          title="Calendar unlocks with your first property"
          body="Add a home and we will pull in its reservations automatically."
        />
      ) : (
        <CalendarShell
          year={curYear}
          month={curMonth}
          properties={propertyList.map((p) => ({ id: p.id, name: p.name }))}
          bookings={mappedBookings}
          blockRequests={mappedBlocks}
          pastRequests={mappedPastRequests}
          icalUrl={primaryIcalUrl}
        />
      )}
    </div>
  );
}
