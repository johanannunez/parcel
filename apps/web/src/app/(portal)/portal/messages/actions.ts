"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Reply to a conversation as an owner.
 */
export async function replyToConversation(args: {
  conversationId: string;
  body: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("messages").insert({
    conversation_id: args.conversationId,
    sender_id: user.id,
    body: args.body,
    delivery_method: "portal",
  });

  if (error) return { error: error.message };

  revalidatePath("/portal/messages");
  return { success: true };
}

/**
 * Fetch all conversations for the current owner.
 */
export async function getOwnerConversations() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { conversations: [], error: "Not authenticated" };

  // Fetch direct + announcement conversations
  const { data: conversations, error } = await supabase
    .from("conversations")
    .select("id, owner_id, subject, type, last_message_at, created_at")
    .order("last_message_at", { ascending: false })
    .limit(100);

  if (error) return { conversations: [], error: error.message };

  // Fetch last message for each conversation
  const conversationIds = (conversations ?? []).map((c) => c.id);
  const { data: messages } = conversationIds.length
    ? await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, body, delivery_method, is_system, created_at")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const lastMessageMap = new Map<string, { body: string; senderId: string; createdAt: string; isSystem: boolean }>();
  for (const m of messages ?? []) {
    if (!lastMessageMap.has(m.conversation_id)) {
      lastMessageMap.set(m.conversation_id, {
        body: m.body,
        senderId: m.sender_id,
        createdAt: m.created_at,
        isSystem: m.is_system,
      });
    }
  }

  // Count unread messages per conversation
  const { data: reads } = await supabase
    .from("message_reads")
    .select("message_id")
    .eq("reader_id", user.id);

  const readMessageIds = new Set((reads ?? []).map((r) => r.message_id));
  const unreadCounts = new Map<string, number>();
  for (const m of messages ?? []) {
    if (m.sender_id !== user.id && !readMessageIds.has(m.id)) {
      unreadCounts.set(m.conversation_id, (unreadCounts.get(m.conversation_id) ?? 0) + 1);
    }
  }

  const result = (conversations ?? []).map((c) => ({
    ...c,
    lastMessage: lastMessageMap.get(c.id) ?? null,
    unreadCount: unreadCounts.get(c.id) ?? 0,
  }));

  return { conversations: result, error: null };
}

/**
 * Fetch messages for a conversation (owner side).
 */
export async function getConversationMessagesForOwner(conversationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", conversation: null, messages: [] };

  const [convRes, msgsRes] = await Promise.all([
    supabase.from("conversations").select("id, owner_id, subject, type").eq("id", conversationId).single(),
    supabase
      .from("messages")
      .select("id, conversation_id, sender_id, body, is_system, delivery_method, metadata, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }),
  ]);

  if (convRes.error || !convRes.data) return { error: "Conversation not found", conversation: null, messages: [] };

  // Enrich messages with sender profile (name + avatar)
  const senderIds = [...new Set((msgsRes.data ?? []).map((m) => m.sender_id))];
  const { data: senders } = senderIds.length
    ? await supabase.from("profiles").select("id, full_name, email, role, avatar_url").in("id", senderIds)
    : { data: [] };
  const senderMap = new Map(
    (senders ?? []).map((s) => [s.id, { name: s.full_name?.trim() || s.email, role: s.role, avatarUrl: s.avatar_url }]),
  );

  const messages = (msgsRes.data ?? []).map((m) => ({
    ...m,
    senderName: senderMap.get(m.sender_id)?.name ?? "The Parcel Company",
    senderRole: senderMap.get(m.sender_id)?.role ?? "admin",
    senderAvatarUrl: senderMap.get(m.sender_id)?.avatarUrl ?? null,
  }));

  return {
    conversation: convRes.data,
    messages,
    error: null,
  };
}

/**
 * Record a read receipt (called silently from the client).
 */
export async function recordMessageRead(args: {
  messageId: string;
  deviceInfo?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Try insert first, then update if exists
  const { error: insertErr } = await supabase.from("message_reads").insert({
    message_id: args.messageId,
    reader_id: user.id,
    device_info: args.deviceInfo ?? null,
  });

  if (insertErr?.code === "23505") {
    // Unique constraint violation: already exists, increment
    await supabase.rpc("increment_message_read", {
      p_message_id: args.messageId,
      p_reader_id: user.id,
      p_device_info: args.deviceInfo ?? null,
    });
  }
}

/**
 * Get total unread message count for the current owner (for sidebar badge).
 */
export async function getUnreadMessageCount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  // Get all messages in the owner's conversations that aren't from them
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id");

  if (!conversations?.length) return 0;

  const convIds = conversations.map((c) => c.id);
  const { data: messages } = await supabase
    .from("messages")
    .select("id")
    .in("conversation_id", convIds)
    .neq("sender_id", user.id);

  if (!messages?.length) return 0;

  const msgIds = messages.map((m) => m.id);
  const { data: reads } = await supabase
    .from("message_reads")
    .select("message_id")
    .eq("reader_id", user.id)
    .in("message_id", msgIds);

  const readIds = new Set((reads ?? []).map((r) => r.message_id));
  return msgIds.filter((id) => !readIds.has(id)).length;
}
