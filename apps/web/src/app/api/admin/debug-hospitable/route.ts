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

  // Step 1: Get one property ID
  const propsRes = await fetch(
    "https://public.api.hospitable.com/v2/properties?per_page=1",
    {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    },
  );
  if (!propsRes.ok) {
    return Response.json(
      { error: `Properties ${propsRes.status}`, body: await propsRes.text() },
      { status: 502 },
    );
  }
  const propsJson = await propsRes.json();
  const propId = propsJson?.data?.[0]?.id;
  if (!propId) {
    return Response.json({ error: "No properties found" }, { status: 404 });
  }

  // Step 1b: Get ALL property IDs
  const allPropsRes = await fetch(
    "https://public.api.hospitable.com/v2/properties?per_page=100",
    {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    },
  );
  const allPropsJson = await allPropsRes.json();
  const allPropIds: string[] = (allPropsJson?.data ?? []).map((p: { id: string }) => p.id);

  // Step 2: Get reservations across all properties with financials
  const url = new URL("https://public.api.hospitable.com/v2/reservations");
  url.searchParams.set("per_page", "2");
  url.searchParams.set("include", "guest,financials,properties");
  url.searchParams.set("start_date", "2025-10-01");
  url.searchParams.set("end_date", "2026-12-31");
  allPropIds.forEach((id, i) => {
    url.searchParams.set(`properties[${i}]`, id);
  });

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    return Response.json(
      { error: `Hospitable ${res.status}`, body: await res.text() },
      { status: 502 },
    );
  }

  const json = await res.json();
  const first = json?.data?.[0] ?? null;

  return Response.json({
    propertyUsed: propId,
    topLevelKeys: first ? Object.keys(first) : [],
    financials: first?.financials ?? "MISSING",
    financialsKeys: first?.financials ? Object.keys(first.financials) : [],
    rawReservation: first,
  });
}
