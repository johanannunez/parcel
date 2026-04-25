import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ClientMessage = {
  id: string;
  contactId: string;
  senderType: "admin" | "client";
  senderId: string;
  senderName: string;
  body: string;
  channel: "in_app" | "email";
  pinned: boolean;
  readAt: string | null;
  createdAt: string;
};

export async function fetchClientMessages(contactId: string): Promise<ClientMessage[]> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("client_messages")
    .select(`
      id, contact_id, sender_type, sender_id, body, channel, pinned, read_at, created_at,
      sender:profiles(full_name)
    `)
    .eq("contact_id", contactId)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[client-messages] fetch error:", error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const sender = row.sender as { full_name: string } | null;
    return {
      id: row.id as string,
      contactId: row.contact_id as string,
      senderType: row.sender_type as "admin" | "client",
      senderId: row.sender_id as string,
      senderName: sender?.full_name ?? "Unknown",
      body: row.body as string,
      channel: row.channel as "in_app" | "email",
      pinned: row.pinned as boolean,
      readAt: (row.read_at as string | null) ?? null,
      createdAt: row.created_at as string,
    };
  });
}

export async function fetchEntityMessages(contactIds: string[]): Promise<ClientMessage[]> {
  if (contactIds.length === 0) return [];
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("client_messages")
    .select(`
      id, contact_id, sender_type, sender_id, body, channel, pinned, read_at, created_at,
      sender:profiles(full_name)
    `)
    .in("contact_id", contactIds)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[client-messages] fetchEntityMessages error:", error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const sender = row.sender as { full_name: string } | null;
    return {
      id: row.id as string,
      contactId: row.contact_id as string,
      senderType: row.sender_type as "admin" | "client",
      senderId: row.sender_id as string,
      senderName: sender?.full_name ?? "Unknown",
      body: row.body as string,
      channel: row.channel as "in_app" | "email",
      pinned: row.pinned as boolean,
      readAt: (row.read_at as string | null) ?? null,
      createdAt: row.created_at as string,
    };
  });
}
