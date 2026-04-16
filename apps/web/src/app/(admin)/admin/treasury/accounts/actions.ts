"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isTreasuryVerified } from "@/lib/treasury/auth";

/**
 * Removes an individual treasury account row.
 * Requires an active admin session and a valid treasury verification cookie.
 */
export async function removeAccount(accountId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Forbidden");
  }

  const verified = await isTreasuryVerified();
  if (!verified) {
    redirect("/admin/treasury/verify?redirect=/admin/treasury/accounts");
  }

  const service = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (service as any)
    .from("treasury_accounts")
    .delete()
    .eq("id", accountId) as { error: { message: string } | null };

  if (error) {
    throw new Error(`Failed to remove account: ${error.message}`);
  }

  // Audit log
  await service.from("activity_log").insert({
    actor_id: user.id,
    action: "account_remove",
    entity_type: "treasury_account",
    entity_id: accountId,
    metadata: {
      description: "Treasury account removed from view",
    },
  });
}

/**
 * Marks a treasury connection as disconnected and writes an audit log entry.
 * Requires an active admin session and a valid treasury verification cookie.
 */
export async function disconnectBank(connectionId: string): Promise<void> {
  // Verify session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Forbidden");
  }

  const verified = await isTreasuryVerified();
  if (!verified) {
    redirect("/admin/treasury/verify?redirect=/admin/treasury/accounts");
  }

  const service = createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (service as any)
    .from("treasury_connections")
    .update({ status: "disconnected" })
    .eq("id", connectionId) as { error: { message: string } | null };

  if (error) {
    throw new Error(`Failed to disconnect bank: ${error.message}`);
  }

  // Audit log: account_disconnect
  await service.from("activity_log").insert({
    actor_id: user.id,
    action: "account_disconnect",
    entity_type: "treasury_connection",
    entity_id: connectionId,
    metadata: {
      description: "Treasury bank connection disconnected",
    },
  });
}
