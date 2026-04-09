import { createServiceClient } from "@/lib/supabase/service";
import {
  getProperties as getHospitableProperties,
  getReservations,
  hasHospitable,
  mapPlatformToSource,
  type HospitableProperty,
  type HospitableReservation,
} from "@/lib/hospitable";

export type SyncResult = {
  propertiesMatched: number;
  propertiesCreated: number;
  propertiesUnmatched: string[];
  reservationsUpserted: number;
  errors: string[];
};

/**
 * Normalize an address string for fuzzy matching.
 * Strips punctuation, lowercases, collapses whitespace.
 */
function normalizeAddress(addr: string): string {
  return addr
    .toLowerCase()
    .replace(/[.,#]/g, "")
    .replace(/\b(street|st|avenue|ave|drive|dr|place|pl|road|rd|boulevard|blvd|court|ct|lane|ln|way)\b/g, (m) => {
      const map: Record<string, string> = {
        street: "st", st: "st",
        avenue: "ave", ave: "ave",
        drive: "dr", dr: "dr",
        place: "pl", pl: "pl",
        road: "rd", rd: "rd",
        boulevard: "blvd", blvd: "blvd",
        court: "ct", ct: "ct",
        lane: "ln", ln: "ln",
        way: "way",
      };
      return map[m] ?? m;
    })
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parse Hospitable's display address into components.
 * Format is typically: "34 Downing Dr. Adairsville, GA 30103"
 * or "1431 Jadwin Ave Richland, WA 99352"
 */
function parseHospitableAddress(hp: HospitableProperty): {
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
} {
  const display = hp.address?.display ?? hp.name ?? "";

  // Try to split on the last comma before state+zip
  // Pattern: "street part, city, ST ZIP" or "street part, city ST ZIP"
  const match = display.match(
    /^(.+?),\s*([A-Za-z\s]+?),?\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/,
  );

  if (match) {
    return {
      address_line1: match[1].trim(),
      city: match[2].trim(),
      state: match[3],
      postal_code: match[4],
    };
  }

  // Fallback: use Hospitable structured fields
  return {
    address_line1: display.replace(/,?\s*\w{2}\s+\d{5}.*$/, "").replace(/,\s*[^,]+$/, "").trim() || display,
    city: hp.address?.city ?? "Unknown",
    state: hp.address?.state ?? "Unknown",
    postal_code: "",
  };
}

/**
 * Full sync: pull properties + reservations from Hospitable and write to Supabase.
 *
 * Properties without a match in Supabase are CREATED automatically,
 * assigned to the adminOwnerId as a placeholder owner.
 *
 * Uses the service role client so RLS doesn't block the writes.
 */
export async function syncFromHospitable(
  adminOwnerId: string,
): Promise<SyncResult> {
  if (!hasHospitable()) {
    return {
      propertiesMatched: 0,
      propertiesCreated: 0,
      propertiesUnmatched: [],
      reservationsUpserted: 0,
      errors: ["HOSPITABLE_API is not configured."],
    };
  }

  const supabase = createServiceClient();
  const result: SyncResult = {
    propertiesMatched: 0,
    propertiesCreated: 0,
    propertiesUnmatched: [],
    reservationsUpserted: 0,
    errors: [],
  };

  // 1. Pull all properties from Hospitable
  let hospProperties: HospitableProperty[];
  try {
    hospProperties = await getHospitableProperties();
  } catch (err) {
    result.errors.push(
      `Failed to fetch Hospitable properties: ${err instanceof Error ? err.message : String(err)}`,
    );
    return result;
  }

  // 2. Load existing Supabase properties
  const { data: supabaseProperties } = await supabase
    .from("properties")
    .select("id, hospitable_property_id, name, address_line1, city, state");

  // Build hospitable_id -> supabase_id map from already-linked records
  const hospToSupabase = new Map<string, string>();
  for (const sp of supabaseProperties ?? []) {
    if (sp.hospitable_property_id) {
      hospToSupabase.set(sp.hospitable_property_id, sp.id);
    }
  }

  // Build normalized address -> supabase_id map for fuzzy matching
  const addressToSupabase = new Map<string, { id: string; linked: boolean }>();
  for (const sp of supabaseProperties ?? []) {
    const key = normalizeAddress(
      `${sp.address_line1} ${sp.city} ${sp.state}`,
    );
    addressToSupabase.set(key, {
      id: sp.id,
      linked: !!sp.hospitable_property_id,
    });
  }

  // 3. Match or create each Hospitable property
  for (const hp of hospProperties) {
    // Already linked by hospitable_property_id
    if (hospToSupabase.has(hp.id)) {
      result.propertiesMatched++;
      continue;
    }

    // Try address match
    const parsed = parseHospitableAddress(hp);
    const hospNorm = normalizeAddress(
      `${parsed.address_line1} ${parsed.city} ${parsed.state}`,
    );
    const addrMatch = addressToSupabase.get(hospNorm);

    if (addrMatch && !addrMatch.linked) {
      // Link existing Supabase property to this Hospitable property
      const { error } = await supabase
        .from("properties")
        .update({ hospitable_property_id: hp.id })
        .eq("id", addrMatch.id);

      if (!error) {
        hospToSupabase.set(hp.id, addrMatch.id);
        addrMatch.linked = true;
        result.propertiesMatched++;
        continue;
      }
    }

    // No match found: create a new property
    const { data: newProp, error: createErr } = await supabase
      .from("properties")
      .insert({
        owner_id: adminOwnerId,
        hospitable_property_id: hp.id,
        name: hp.public_name || hp.name || null,
        property_type: "co-hosting" as const,
        address_line1: parsed.address_line1,
        city: parsed.city,
        state: parsed.state,
        postal_code: parsed.postal_code,
        bedrooms: hp.capacity?.bedrooms ?? null,
        bathrooms: hp.capacity?.bathrooms ?? null,
        guest_capacity: hp.capacity?.max ?? null,
        active: hp.listed !== false,
      })
      .select("id")
      .single();

    if (createErr) {
      result.errors.push(
        `Failed to create property "${hp.name}": ${createErr.message}`,
      );
      result.propertiesUnmatched.push(hp.name || hp.id);
    } else {
      hospToSupabase.set(hp.id, newProp.id);
      result.propertiesCreated++;
    }
  }

  if (hospToSupabase.size === 0) {
    result.errors.push(
      "No properties to sync reservations for.",
    );
    return result;
  }

  // 4. Pull reservations for all linked properties
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

  // 5. Upsert reservations into bookings table
  for (const res of reservations) {
    const hospPropertyId =
      res.property_id ?? res.properties?.data?.[0]?.id;

    if (!hospPropertyId) {
      result.errors.push(
        `Reservation ${res.id} has no property_id, skipping.`,
      );
      continue;
    }

    const supabasePropertyId = hospToSupabase.get(hospPropertyId);
    if (!supabasePropertyId) continue;

    const checkIn = res.dates?.arrival;
    const checkOut = res.dates?.departure;
    if (!checkIn || !checkOut) continue;

    const source = mapPlatformToSource(res.platform);
    const statusCategory = res.status?.category ?? "confirmed";

    let status = "confirmed";
    if (statusCategory === "cancelled" || statusCategory === "declined") {
      status = "cancelled";
    } else if (
      statusCategory === "inquiry" ||
      statusCategory === "pending"
    ) {
      status = "pending";
    }

    const guestName =
      [res.guest?.first_name, res.guest?.last_name]
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

    const { error } = await supabase.from("bookings").upsert(
      {
        external_id: res.id,
        property_id: supabasePropertyId,
        check_in: checkIn,
        check_out: checkOut,
        guest_name: guestName,
        guest_email: res.guest?.email ?? null,
        source: source as
          | "airbnb"
          | "vrbo"
          | "direct"
          | "booking_com"
          | "furnished_finder"
          | "hospitable"
          | "other",
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
