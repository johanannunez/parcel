// Shared admin guard for Treasury API routes
// SERVER-SIDE ONLY — never import from client components

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isTreasuryVerified } from "./auth";
import type { User } from "@supabase/supabase-js";

type GuardSuccess = { ok: true; user: User };
type GuardFailure = { ok: false; response: NextResponse };

export async function treasuryAdminGuard(): Promise<GuardSuccess | GuardFailure> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  const verified = await isTreasuryVerified();
  if (!verified) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Treasury session expired. Re-authenticate." },
        { status: 403 },
      ),
    };
  }

  return { ok: true, user };
}
