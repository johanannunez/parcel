"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Send a message from admin to an owner.
 * Creates a conversation if one doesn't exist, then inserts the message.
 */
export async function sendMessage(args: {
  ownerId: string;
  body: string;
  deliveryMethod?: "portal" | "email";
  subject?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const svc = createServiceClient();

  // Find or create a direct conversation with this owner
  const { data: existing } = await svc
    .from("conversations")
    .select("id")
    .eq("owner_id", args.ownerId)
    .eq("type", "direct")
    .maybeSingle();

  let conversationId = existing?.id;

  if (!conversationId) {
    const { data: conv, error: convErr } = await svc
      .from("conversations")
      .insert({
        owner_id: args.ownerId,
        type: "direct",
        subject: args.subject ?? null,
      })
      .select("id")
      .single();

    if (convErr || !conv) return { error: convErr?.message ?? "Failed to create conversation" };
    conversationId = conv.id;
  }

  // Insert the message
  const { data: msg, error: msgErr } = await svc
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: args.body,
      delivery_method: args.deliveryMethod ?? "portal",
      metadata: args.subject ? { subject: args.subject } : {},
    })
    .select("id, created_at")
    .single();

  if (msgErr || !msg) return { error: msgErr?.message ?? "Failed to send message" };

  revalidatePath("/admin/messages");
  return { success: true, messageId: msg.id, conversationId };
}

/**
 * Send a broadcast announcement to all owners.
 */
export async function sendBroadcast(args: {
  subject: string;
  body: string;
  deliveryMethod?: "portal" | "portal_email";
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const svc = createServiceClient();

  // Create announcement conversation (owner_id = null)
  const { data: conv, error: convErr } = await svc
    .from("conversations")
    .insert({
      owner_id: null,
      type: "announcement",
      subject: args.subject,
    })
    .select("id")
    .single();

  if (convErr || !conv) return { error: convErr?.message ?? "Failed to create announcement" };

  // Insert the message
  const { data: msg, error: msgErr } = await svc
    .from("messages")
    .insert({
      conversation_id: conv.id,
      sender_id: user.id,
      body: args.body,
      is_system: true,
      delivery_method: args.deliveryMethod === "portal_email" ? "email" : "portal",
      metadata: { subject: args.subject },
    })
    .select("id")
    .single();

  if (msgErr || !msg) return { error: msgErr?.message ?? "Failed to send announcement" };

  revalidatePath("/admin/messages");
  return { success: true, conversationId: conv.id };
}

/**
 * Fetch all conversations for the admin inbox.
 */
export async function getAdminConversations(filter?: string) {
  const svc = createServiceClient();

  let query = svc
    .from("conversations")
    .select(`
      id,
      owner_id,
      subject,
      type,
      last_message_at,
      created_at
    `)
    .order("last_message_at", { ascending: false })
    .limit(100);

  if (filter === "unread") {
    // We'll handle unread filtering client-side for now
  } else if (filter === "announcements") {
    query = query.eq("type", "announcement");
  } else if (filter === "email_logs") {
    query = query.eq("type", "email_log");
  }

  const { data, error } = await query;
  if (error) return { error: error.message, conversations: [] };

  // Fetch owner profiles and last messages in parallel
  const ownerIds = [...new Set((data ?? []).map((c) => c.owner_id).filter(Boolean))] as string[];
  const conversationIds = (data ?? []).map((c) => c.id);

  const [ownersRes, messagesRes] = await Promise.all([
    ownerIds.length
      ? svc.from("profiles").select("id, full_name, email").in("id", ownerIds)
      : { data: [] },
    conversationIds.length
      ? svc
          .from("messages")
          .select("id, conversation_id, sender_id, body, delivery_method, created_at")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false })
      : { data: [] },
  ]);

  const ownerMap = new Map(
    (ownersRes.data ?? []).map((o) => [o.id, { name: o.full_name?.trim() || o.email, email: o.email }]),
  );

  // Get last message per conversation
  const lastMessageMap = new Map<string, { body: string; senderId: string; createdAt: string; deliveryMethod: string }>();
  for (const m of messagesRes.data ?? []) {
    if (!lastMessageMap.has(m.conversation_id)) {
      lastMessageMap.set(m.conversation_id, {
        body: m.body,
        senderId: m.sender_id,
        createdAt: m.created_at,
        deliveryMethod: m.delivery_method,
      });
    }
  }

  const conversations = (data ?? []).map((c) => ({
    ...c,
    ownerName: c.owner_id ? ownerMap.get(c.owner_id)?.name ?? "Unknown" : null,
    ownerEmail: c.owner_id ? ownerMap.get(c.owner_id)?.email ?? "" : null,
    lastMessage: lastMessageMap.get(c.id) ?? null,
  }));

  return { conversations, error: null };
}

/**
 * Fetch messages for a specific conversation.
 */
export async function getConversationMessages(conversationId: string) {
  const svc = createServiceClient();

  const [convRes, msgsRes] = await Promise.all([
    svc.from("conversations").select("id, owner_id, subject, type").eq("id", conversationId).single(),
    svc
      .from("messages")
      .select("id, conversation_id, sender_id, body, is_system, delivery_method, metadata, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }),
  ]);

  if (convRes.error || !convRes.data) return { error: "Conversation not found", conversation: null, messages: [] };

  // Fetch read data for all messages
  const messageIds = (msgsRes.data ?? []).map((m) => m.id);
  const { data: reads } = messageIds.length
    ? await svc.from("message_reads").select("message_id, reader_id, first_read_at, read_count, last_read_at, device_info").in("message_id", messageIds)
    : { data: [] };

  const readMap = new Map<string, Array<{ readerId: string; firstReadAt: string; readCount: number; lastReadAt: string; deviceInfo: string | null }>>();
  for (const r of reads ?? []) {
    const existing = readMap.get(r.message_id) ?? [];
    existing.push({
      readerId: r.reader_id,
      firstReadAt: r.first_read_at,
      readCount: r.read_count,
      lastReadAt: r.last_read_at,
      deviceInfo: r.device_info,
    });
    readMap.set(r.message_id, existing);
  }

  // Fetch sender profiles
  const senderIds = [...new Set((msgsRes.data ?? []).map((m) => m.sender_id))];
  const { data: senders } = senderIds.length
    ? await svc.from("profiles").select("id, full_name, email, role").in("id", senderIds)
    : { data: [] };
  const senderMap = new Map((senders ?? []).map((s) => [s.id, { name: s.full_name?.trim() || s.email, role: s.role }]));

  const messages = (msgsRes.data ?? []).map((m) => ({
    ...m,
    senderName: senderMap.get(m.sender_id)?.name ?? "Unknown",
    senderRole: senderMap.get(m.sender_id)?.role ?? "owner",
    reads: readMap.get(m.id) ?? [],
  }));

  // Get owner profile if direct conversation
  let ownerProfile = null;
  if (convRes.data.owner_id) {
    const { data: profile } = await svc
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", convRes.data.owner_id)
      .single();
    ownerProfile = profile;
  }

  return {
    conversation: { ...convRes.data, ownerProfile },
    messages,
    error: null,
  };
}
