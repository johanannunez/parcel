import { createServiceClient } from "@/lib/supabase/service";
import {
  getProperties as getHospitableProperties,
  getReservations,
  hasHospitable,
  mapPlatformToSource,
  type HospitableReservation,
} from "@/lib/hospitable";

export type SyncResult = {
  propertiesMatched: number;
  propertiesUnmatched: string[];
  reservationsUpserted: number;
  errors: string[];
};

/**
 * Full sync: pull properties + reservations from Hospitable and write to Supabase.
 *
 * Uses the service role client so RLS doesn't block the writes.
 * Should only be called from admin-gated server actions or webhooks.
 */
export async function syncFromHospitable(): Promise<SyncResult> {
  if (!hasHospitable()) {
    return {
      propertiesMatched: 0,
      propertiesUnmatched: [],
      reservationsUpserted: 0,
      errors: ["HOSPITABLE_API is not configured."],
    };
  }

  const supabase = createServiceClient();
  const result: SyncResult = {
    propertiesMatched: 0,
    propertiesUnmatched: [],
    reservationsUpserted: 0,
    errors: [],
  };

  // 1. Pull all properties from Hospitable
  let hospProperties;
  try {
    hospProperties = await getHospitableProperties();
  } catch (err) {
    result.errors.push(
      `Failed to fetch Hospitable properties: ${err instanceof Error ? err.message : String(err)}`,
    );
    return result;
  }

  // 2. Match Hospitable properties to Supabase properties
  const { data: supabaseProperties } = await supabase
    .from("properties")
    .select("id, hospitable_property_id, name, address_line1");

  // Build a map of hospitable_id -> supabase property id
  const hospToSupabase = new Map<string, string>();
  for (const sp of supabaseProperties ?? []) {
    if (sp.hospitable_property_id) {
      hospToSupabase.set(sp.hospitable_property_id, sp.id);
    }
  }

  // For properties not yet linked, try to auto-match by Hospitable ID
  // and update the supabase record
  const hospIds = hospProperties.map((p) => p.id);
  const linkedIds = new Set(hospToSupabase.keys());

  // Any hospitable property not in our map is unmatched
  for (const hp of hospProperties) {
    if (hospToSupabase.has(hp.id)) {
      result.propertiesMatched++;
    } else {
      // Try to auto-link if there's exactly one unlinked supabase property
      // (useful for single-property accounts like Johan's right now)
      const unlinked = (supabaseProperties ?? []).filter(
        (sp) => !sp.hospitable_property_id,
      );
      if (unlinked.length === 1 && hospProperties.length === 1) {
        const { error } = await supabase
          .from("properties")
          .update({ hospitable_property_id: hp.id })
          .eq("id", unlinked[0].id);

        if (!error) {
          hospToSupabase.set(hp.id, unlinked[0].id);
          result.propertiesMatched++;
          continue;
        }
      }
      result.propertiesUnmatched.push(
        hp.name || hp.public_name || hp.id,
      );
    }
  }

  if (hospToSupabase.size === 0) {
    result.errors.push(
      "No Hospitable properties matched to Supabase properties. Link them in /admin/properties first.",
    );
    return result;
  }

  // 3. Pull reservations for all matched properties
  // Fetch a wide window: 6 months back, 12 months forward
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const twelveMonthsAhead = new Date(now);
  twelveMonthsAhead.setMonth(twelveMonthsAhead.getMonth() + 12);

  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const matchedHospIds = Array.from(hospToSupabase.keys());

  let reservations: HospitableReservation[];
  try {
    reservations = await getReservations(matchedHospIds, {
      startDate: iso(sixMonthsAgo),
      endDate: iso(twelveMonthsAhead),
    });
  } catch (err) {
    result.errors.push(
      `Failed to fetch reservations: ${err instanceof Error ? err.message : String(err)}`,
    );
    return result;
  }

  // 4. Upsert reservations into bookings table
  for (const res of reservations) {
    const hospPropertyId =
      res.property_id ??
      res.properties?.data?.[0]?.id;

    if (!hospPropertyId) {
      result.errors.push(
        `Reservation ${res.id} has no property_id, skipping.`,
      );
      continue;
    }

    const supabasePropertyId = hospToSupabase.get(hospPropertyId);
    if (!supabasePropertyId) continue; // not a linked property

    const checkIn = res.dates?.arrival;
    const checkOut = res.dates?.departure;
    if (!checkIn || !checkOut) continue;

    const source = mapPlatformToSource(res.platform);
    const statusCategory = res.status?.category ?? "confirmed";

    // Map Hospitable status to our status values
    let status = "confirmed";
    if (statusCategory === "cancelled" || statusCategory === "declined") {
      status = "cancelled";
    } else if (statusCategory === "inquiry" || statusCategory === "pending") {
      status = "pending";
    }

    const guestName = [
      res.guest?.first_name,
      res.guest?.last_name,
    ]
      .filter(Boolean)
      .join(" ") || null;

    const totalAmount =
      res.financials?.host_payout?.amount ??
      res.financials?.total_price?.amount ??
      null;
    const currency =
      res.financials?.host_payout?.currency ??
      res.financials?.total_price?.currency ??
      "USD";

    const { error } = await supabase
      .from("bookings")
      .upsert(
        {
          external_id: res.id,
          property_id: supabasePropertyId,
          check_in: checkIn,
          check_out: checkOut,
          guest_name: guestName,
          guest_email: res.guest?.email ?? null,
          source: source as "airbnb" | "vrbo" | "direct" | "booking_com" | "furnished_finder" | "hospitable" | "other",
          status,
          total_amount: totalAmount,
          currency,
        },
        { onConflict: "external_id", ignoreDuplicates: false },
      );

    if (error) {
      result.errors.push(
        `Failed to upsert reservation ${res.id}: ${error.message}`,
      );
    } else {
      result.reservationsUpserted++;
    }
  }

  return result;
}
