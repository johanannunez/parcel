import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { propertyLabel } from "@/lib/address";
import { AdminTimelineView } from "./AdminTimelineView";

export const metadata: Metadata = { title: "Timeline" };
export const dynamic = "force-dynamic";

export default async function AdminTimelinePage() {
  const supabase = await createClient();

  const [entriesResult, profilesResult, propertiesResult] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("owner_timeline")
      .select(
        "id, owner_id, event_type, category, title, body, property_id, icon, visibility, is_pinned, deleted_at, deleted_by, metadata, created_by, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .limit(500),
    supabase
      .from("properties")
      .select("id, owner_id, address_line1, address_line2")
      .limit(500),
  ]);

  type RawEntry = {
    id: string;
    owner_id: string;
    event_type: string;
    category: string;
    title: string;
    body: string | null;
    property_id: string | null;
    icon: string | null;
    visibility: string;
    is_pinned: boolean;
    deleted_at: string | null;
    deleted_by: string | null;
    metadata: Record<string, unknown> | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
  };

  const entries: RawEntry[] = entriesResult.data ?? [];

  type Profile = {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  const profiles: Profile[] = profilesResult.data ?? [];

  const profileMap: Record<string, Profile> = {};
  for (const p of profiles) {
    profileMap[p.id] = p;
  }

  type RawProperty = {
    id: string;
    owner_id: string;
    address_line1: string;
    address_line2: string | null;
  };
  const properties: RawProperty[] = propertiesResult.data ?? [];

  const propertyMap: Record<string, string> = {};
  const propertiesByOwner: Record<string, { id: string; label: string }[]> = {};
  for (const p of properties) {
    const label = propertyLabel(p);
    propertyMap[p.id] = label;
    if (!propertiesByOwner[p.owner_id]) {
      propertiesByOwner[p.owner_id] = [];
    }
    propertiesByOwner[p.owner_id].push({ id: p.id, label });
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10 lg:py-14">
      <div className="flex flex-col gap-10">
        <AdminTimelineView
          entries={entries}
          profileMap={profileMap}
          propertyMap={propertyMap}
          propertiesByOwner={propertiesByOwner}
          profiles={profiles}
        />
      </div>
    </div>
  );
}
