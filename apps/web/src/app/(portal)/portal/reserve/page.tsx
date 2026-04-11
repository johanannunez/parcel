import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ReserveShell } from "./ReserveShell";

export const metadata: Metadata = { title: "Reserve" };
export const dynamic = "force-dynamic";

export default async function ReservePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: properties }, requestsResult] = await Promise.all([
    supabase
      .from("properties")
      .select("id, name, address_line1, city, state")
      .order("created_at", { ascending: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("block_requests")
      .select("id, property_id, start_date, end_date, status, note, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const propertyList = (properties ?? []).map((p) => ({
    id: p.id,
    label: p.name?.trim() || p.address_line1 || "Property",
  }));

  const requests = requestsResult.data ?? [];

  return <ReserveShell properties={propertyList} requests={requests} />;
}
