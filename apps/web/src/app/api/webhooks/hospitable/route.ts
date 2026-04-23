import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { mapPlatformToSource } from "@/lib/hospitable";
import { logTimelineEvent } from "@/lib/timeline";

/**
 * Hospitable webhook receiver.
 *
 * Handles reservation.created and reservation.updated events.
 * Upserts the reservation into the bookings table.
 *
 * Security: Hospitable sends webhooks from 38.80.170.0/24 and includes
 * a Signature header (HMAC-SHA256). For now we validate the payload
 * structure. Full HMAC verification can be added when we store the
 * webhook secret.
 */
export async function POST(req: NextRequest) {
  let payload: {
    id?: string;
    action?: string;
    data?: Record<string, unknown>;
  };

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const action = payload.action;
  if (
    action !== "reservation.created" &&
    action !== "reservation.updated"
  ) {
    // Acknowledge but ignore events we don't handle yet
    return NextResponse.json({ ok: true, skipped: action });
  }

  const data = payload.data as Record<string, unknown> | undefined;
  if (!data) {
    return NextResponse.json(
      { error: "Missing data field." },
      { status: 400 },
    );
  }

  const reservationId = data.id as string | undefined;
  const propertyId =
    (data.property_id as string | undefined) ??
    ((data.properties as { data?: { id: string }[] })?.data?.[0]?.id);

  if (!reservationId || !propertyId) {
    return NextResponse.json(
      { error: "Missing reservation or property ID." },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  // Find the supabase property linked to this hospitable property
  const { data: prop } = await supabase
    .from("properties")
    .select("id, owner_id")
    .eq("hospitable_property_id", propertyId)
    .maybeSingle();

  if (!prop) {
    // Property not linked yet; acknowledge but skip
    return NextResponse.json({ ok: true, skipped: "unlinked_property" });
  }

  const dates = data.dates as {
    arrival?: string;
    departure?: string;
  } | undefined;

  if (!dates?.arrival || !dates?.departure) {
    return NextResponse.json(
      { error: "Missing dates." },
      { status: 400 },
    );
  }

  const guest = data.guest as {
    first_name?: string;
    last_name?: string;
    email?: string;
  } | undefined;

  const platform = data.platform as string | undefined;
  const statusObj = data.status as { category?: string } | undefined;
  const statusCategory = statusObj?.category ?? "confirmed";
  const financials = data.financials as {
    host_payout?: { amount?: number; currency?: string };
    total_price?: { amount?: number; currency?: string };
  } | undefined;

  let status = "confirmed";
  if (statusCategory === "cancelled" || statusCategory === "declined") {
    status = "cancelled";
  } else if (statusCategory === "inquiry" || statusCategory === "pending") {
    status = "pending";
  }

  const guestName = [guest?.first_name, guest?.last_name]
    .filter(Boolean)
    .join(" ") || null;

  const source = mapPlatformToSource(platform) as
    | "airbnb"
    | "vrbo"
    | "direct"
    | "booking_com"
    | "furnished_finder"
    | "hospitable"
    | "other";

  const totalAmount =
    financials?.host_payout?.amount ??
    financials?.total_price?.amount ??
    null;
  const currency =
    financials?.host_payout?.currency ??
    financials?.total_price?.currency ??
    "USD";

  const { error } = await supabase.from("bookings").upsert(
    {
      external_id: reservationId,
      property_id: prop.id,
      check_in: dates.arrival,
      check_out: dates.departure,
      guest_name: guestName,
      guest_email: guest?.email ?? null,
      source,
      status,
      total_amount: totalAmount,
      currency,
    },
    { onConflict: "external_id", ignoreDuplicates: false },
  );

  if (error) {
    console.error("[Hospitable webhook] upsert error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  if (prop.owner_id) {
    const isCancelled = status === "cancelled";
    const arrival = new Date(dates.arrival).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const departure = new Date(dates.departure).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    void logTimelineEvent({
      ownerId: prop.owner_id,
      eventType: isCancelled ? "booking_cancelled" : "booking_created",
      category: "calendar",
      propertyId: prop.id,
      title: isCancelled
        ? `Booking cancelled: ${arrival} – ${departure}`
        : `New booking: ${arrival} – ${departure}`,
      body: guestName ? `Guest: ${guestName}` : undefined,
      visibility: "owner",
      metadata: { source, reservationId },
    });
  }

  return NextResponse.json({ ok: true, upserted: reservationId });
}
