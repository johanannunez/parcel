"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function sendClientMessage(
  contactId: string,
  body: string,
): Promise<{ ok: boolean; message: string }> {
  if (!body.trim()) return { ok: false, message: "Message cannot be empty." };

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const adminId = authData.user?.id;
  if (!adminId) return { ok: false, message: "Not authenticated." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("client_messages").insert({
    contact_id: contactId,
    sender_type: "admin",
    sender_id: adminId,
    body: body.trim(),
    channel: "in_app",
  });

  if (error) {
    console.error("[messaging] send error:", error.message);
    return { ok: false, message: "Failed to send. Please try again." };
  }

  revalidatePath(`/admin/clients/${contactId}`);
  return { ok: true, message: "Sent." };
}

export async function togglePinMessage(
  messageId: string,
  contactId: string,
  pinned: boolean,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("client_messages")
    .update({ pinned: !pinned })
    .eq("id", messageId);

  if (error) return { ok: false };
  revalidatePath(`/admin/clients/${contactId}`);
  return { ok: true };
}
