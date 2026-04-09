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
      .select("id, name, address_line1, city, state, postal_code, bedrooms, ical_url")
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const fullName =
    profile?.full_name?.trim() || user.email?.split("@")[0] || "Owner";

  const propertyList = (properties ?? []).map((p) => ({
    id: p.id,
    name: p.name?.trim() || p.address_line1 || "Property",
    address: [p.address_line1, p.city, p.state, p.postal_code]
      .filter(Boolean)
      .join(", "),
    bedrooms: (p as { bedrooms?: number | null }).bedrooms ?? null,
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
    check_in_time: (r as Record<string, unknown>).check_in_time as string | null,
    check_out_time: (r as Record<string, unknown>).check_out_time as string | null,
    reason: (r as Record<string, unknown>).reason as string | null,
    is_owner_staying: ((r as Record<string, unknown>).is_owner_staying as boolean) ?? true,
    guest_name: (r as Record<string, unknown>).guest_name as string | null,
    guest_email: (r as Record<string, unknown>).guest_email as string | null,
    guest_phone: (r as Record<string, unknown>).guest_phone as string | null,
    adults: ((r as Record<string, unknown>).adults as number) ?? 1,
    children: ((r as Record<string, unknown>).children as number) ?? 0,
    pets: ((r as Record<string, unknown>).pets as number) ?? 0,
    needs_lock_code: ((r as Record<string, unknown>).needs_lock_code as boolean) ?? false,
    requested_lock_code: (r as Record<string, unknown>).requested_lock_code as string | null,
    wants_cleaning: ((r as Record<string, unknown>).wants_cleaning as boolean) ?? false,
    cleaning_fee: (r as Record<string, unknown>).cleaning_fee as number | null,
    damage_acknowledged: ((r as Record<string, unknown>).damage_acknowledged as boolean) ?? false,
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
          properties={propertyList.map((p) => ({
            id: p.id,
            name: p.name,
            address: p.address,
            bedrooms: p.bedrooms,
          }))}
          bookings={mappedBookings}
          blockRequests={mappedBlocks}
          pastRequests={mappedPastRequests}
          icalUrl={primaryIcalUrl}
          ownerName={fullName}
          ownerEmail={user.email ?? ""}
        />
      )}
    </div>
  );
}
