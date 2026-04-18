import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export type BlockRequestItem = {
  id: string;
  ownerName: string | null;
  propertyLabel: string;
  startDate: string;
  endDate: string;
  createdAt: string;
};

export type ActivityItem = {
  id: string;
  title: string;
  body: string | null;
  category: string;
  createdAt: string;
};

export type AdminNotificationsResponse = {
  blockRequests: BlockRequestItem[];
  recentActivity: ActivityItem[];
  totalActionable: number;
};

async function requireAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "admin";
}

export async function GET() {
  const ok = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const supabase = await createClient();

  const [blockResult, activityResult] = await Promise.all([
    supabase
      .from("block_requests")
      .select(
        "id, start_date, end_date, created_at, profiles!block_requests_owner_id_fkey(full_name), properties!block_requests_property_id_fkey(address_line1, city)",
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("owner_timeline")
      .select("id, title, body, category, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const blockRequests: BlockRequestItem[] = (blockResult.data ?? []).map(
    (r: {
      id: string;
      start_date: string;
      end_date: string;
      created_at: string;
      profiles: { full_name: string | null } | null;
      properties: { address_line1: string | null; city: string | null } | null;
    }) => {
      const prop = r.properties;
      const label = [prop?.address_line1, prop?.city].filter(Boolean).join(", ") || "Property";
      return {
        id: r.id,
        ownerName: (r.profiles as { full_name: string | null } | null)?.full_name ?? null,
        propertyLabel: label,
        startDate: r.start_date,
        endDate: r.end_date,
        createdAt: r.created_at,
      };
    },
  );

  const recentActivity: ActivityItem[] = (activityResult.data ?? []).map(
    (r: { id: string; title: string; body: string | null; category: string; created_at: string }) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      category: r.category,
      createdAt: r.created_at,
    }),
  );

  const response: AdminNotificationsResponse = {
    blockRequests,
    recentActivity,
    totalActionable: blockRequests.length,
  };

  return NextResponse.json(response, {
    headers: { "Cache-Control": "no-store" },
  });
}
