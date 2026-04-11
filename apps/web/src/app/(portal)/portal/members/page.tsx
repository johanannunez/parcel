import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MembersShell } from "./MembersShell";

export const metadata: Metadata = { title: "Members" };
export const dynamic = "force-dynamic";

type ParcelTeamMember = {
  id: string;
  name: string;
  role: string;
  location: string | null;
  avatar_url: string | null;
};

type OwnerMember = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  responsibility: string | null;
};

export default async function MembersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, parcelTeamResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, phone, avatar_url")
      .eq("id", user.id)
      .single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("parcel_team")
      .select("id, name, role, location, avatar_url, sort_order")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
  ]);

  const parcelTeam: ParcelTeamMember[] = parcelTeamResult.data ?? [];

  let ownerMembers: OwnerMember[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileAny = profile as any;
  const entityId = profileAny?.entity_id ?? null;

  if (entityId) {
    const { data: members } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, avatar_url")
      .eq("entity_id", entityId)
      .eq("role", "owner")
      .order("created_at", { ascending: true });

    ownerMembers = (members ?? []).map((m) => ({
      id: m.id,
      full_name: m.full_name,
      email: m.email ?? "",
      phone: m.phone,
      avatar_url: m.avatar_url,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      responsibility: (m as any).responsibility ?? null,
    }));
  } else {
    ownerMembers = profile
      ? [
          {
            id: user.id,
            full_name: profile.full_name,
            email: user.email ?? "",
            phone: profile.phone,
            avatar_url: profile.avatar_url,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            responsibility: (profile as any).responsibility ?? null,
          },
        ]
      : [];
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          Members
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Your Parcel team and ownership group.
        </p>
      </div>

      <MembersShell
        parcelTeam={parcelTeam}
        ownerMembers={ownerMembers}
        currentUserId={user.id}
      />
    </div>
  );
}
