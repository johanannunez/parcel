"use server";
import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin/auth";

export async function sendEntityMessage(
  contactId: string,
  body: string,
): Promise<{ ok: boolean; message: string }> {
  if (!body.trim()) return { ok: false, message: "Message cannot be empty." };

  let supabase: Awaited<ReturnType<typeof requireAdminUser>>["supabase"];
  let adminId: string;
  try {
    const auth = await requireAdminUser();
    supabase = auth.supabase;
    adminId = auth.user.id;
  } catch {
    return { ok: false, message: "Not authorized." };
  }

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

  revalidatePath(`/admin/entities/${contactId}`);
  return { ok: true, message: "Sent." };
}

export async function togglePinMessage(
  messageId: string,
  contactId: string,
  pinned: boolean,
): Promise<{ ok: boolean }> {
  let supabase: Awaited<ReturnType<typeof requireAdminUser>>["supabase"];
  try {
    ({ supabase } = await requireAdminUser());
  } catch {
    return { ok: false };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("client_messages")
    .update({ pinned: !pinned })
    .eq("id", messageId);

  if (error) return { ok: false };
  revalidatePath(`/admin/entities/${contactId}`);
  return { ok: true };
}
