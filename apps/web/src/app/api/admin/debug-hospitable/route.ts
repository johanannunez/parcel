import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/debug-hospitable
 *
 * Fetches a single reservation from Hospitable with financials included
 * and returns the raw JSON shape. Admin-only. Temporary diagnostic route.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const token = process.env.HOSPITABLE_API;
  if (!token) {
    return Response.json({ error: "HOSPITABLE_API not set" }, { status: 500 });
  }

  const url = new URL("https://public.api.hospitable.com/v2/reservations");
  url.searchParams.set("per_page", "1");
  url.searchParams.set("include", "guest,financials,properties");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    return Response.json(
      { error: `Hospitable ${res.status}`, body },
      { status: 502 },
    );
  }

  const json = await res.json();

  // Return the full raw shape of the first reservation
  const firstReservation = json?.data?.[0] ?? null;

  return Response.json({
    rawReservation: firstReservation,
    financialsPath: {
      "res.financials": firstReservation?.financials ?? "MISSING",
      "res.financials?.host_payout": firstReservation?.financials?.host_payout ?? "MISSING",
      "res.financials?.host_payout?.amount": firstReservation?.financials?.host_payout?.amount ?? "MISSING",
      "res.financials?.data": (firstReservation?.financials as Record<string, unknown>)?.data ?? "MISSING",
    },
    topLevelKeys: firstReservation ? Object.keys(firstReservation) : [],
  });
}
