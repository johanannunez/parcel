import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { OwnerListPanel } from "./OwnerListPanel";

export default async function OwnersLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  const [{ data: owners }, { data: properties }, { data: coOwned }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, created_at, onboarding_completed_at")
        .eq("role", "owner")
        .order("full_name", { ascending: true }),
      supabase.from("properties").select("owner_id"),
      (supabase as any).from("property_owners").select("owner_id"),
    ]);

  // Count properties per owner: use property_owners as source of truth
  // (includes both primary and co-owners)
  const propertyCounts = new Map<string, number>();
  for (const po of coOwned ?? []) {
    propertyCounts.set(po.owner_id, (propertyCounts.get(po.owner_id) ?? 0) + 1);
  }
  // Also count primary ownership for owners not yet in junction table
  for (const p of properties ?? []) {
    if (!propertyCounts.has(p.owner_id)) {
      propertyCounts.set(p.owner_id, (propertyCounts.get(p.owner_id) ?? 0) + 1);
    }
  }

  // Determine invite status from email
  const isPending = (email: string) => email.endsWith("@pending.theparcelco.com");

  const ownerList = (owners ?? []).map((o) => ({
    id: o.id,
    fullName: o.full_name?.trim() || null,
    email: o.email,
    propertyCount: propertyCounts.get(o.id) ?? 0,
    onboarded: !!o.onboarding_completed_at,
    pending: isPending(o.email),
  }));

  return (
    <div className="flex min-h-screen">
      <OwnerListPanel owners={ownerList} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
