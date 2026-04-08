"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { error?: string; ok?: boolean };

export async function connectProvider(provider: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase.from("connections").upsert(
    {
      owner_id: user.id,
      provider,
      status: "connected",
      metadata: { connected_at: new Date().toISOString() },
    },
    { onConflict: "owner_id,provider" },
  );
  if (error) return { error: error.message };

  revalidatePath("/portal/connections");
  return { ok: true };
}

export async function disconnectProvider(provider: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("connections")
    .delete()
    .eq("owner_id", user.id)
    .eq("provider", provider);
  if (error) return { error: error.message };

  revalidatePath("/portal/connections");
  return { ok: true };
}
