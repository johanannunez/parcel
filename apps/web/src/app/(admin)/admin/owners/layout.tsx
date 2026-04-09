import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { OwnerListPanel } from "./OwnerListPanel";

export default async function OwnersLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  const { data: owners } = await supabase
    .from("profiles")
    .select("id, full_name, email, created_at, onboarding_completed_at")
    .eq("role", "owner")
    .order("created_at", { ascending: false });

  // Get property counts per owner
  const { data: properties } = await supabase
    .from("properties")
    .select("owner_id");

  const propertyCounts = new Map<string, number>();
  for (const p of properties ?? []) {
    propertyCounts.set(p.owner_id, (propertyCounts.get(p.owner_id) ?? 0) + 1);
  }

  const ownerList = (owners ?? []).map((o) => ({
    id: o.id,
    fullName: o.full_name?.trim() || null,
    email: o.email,
    propertyCount: propertyCounts.get(o.id) ?? 0,
    onboarded: !!o.onboarding_completed_at,
  }));

  return (
    <div className="-mx-6 -my-10 flex min-h-[calc(100vh-0px)] lg:-mx-10 lg:-my-14">
      <OwnerListPanel owners={ownerList} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
