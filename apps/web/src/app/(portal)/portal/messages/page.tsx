import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPortalContext } from "@/lib/portal-context";
import { PortalMessagesShell } from "./PortalMessagesShell";

export const metadata: Metadata = {
  title: "Messages",
};
export const dynamic = "force-dynamic";

export default async function PortalMessagesPage() {
  const { userId, client, realUserId } = await getPortalContext();

  // Fetch conversations scoped to the active owner.
  const { data: conversations } = await client
    .from("conversations")
    .select("id, owner_id, subject, type, last_message_at, created_at")
    .eq("owner_id", userId)
    .order("last_message_at", { ascending: false })
    .limit(100);

  // Fetch messages for unread counting + previews
  const convIds = (conversations ?? []).map((c) => c.id);
  const { data: allMessages } = convIds.length
    ? await client
        .from("messages")
        .select("id, conversation_id, sender_id, body, is_system, delivery_method, created_at")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  // Get read receipts — use the real user's ID for read state.
  const messageIds = (allMessages ?? []).map((m) => m.id);
  const { data: reads } = messageIds.length
    ? await client
        .from("message_reads")
        .select("message_id")
        .eq("reader_id", userId)
        .in("message_id", messageIds)
    : { data: [] };

  const readMessageIds = new Set((reads ?? []).map((r) => r.message_id));

  // Build last message and unread count per conversation
  const lastMessageMap = new Map<string, { body: string; senderId: string; createdAt: string; isSystem: boolean }>();
  const unreadCounts = new Map<string, number>();

  for (const m of allMessages ?? []) {
    if (!lastMessageMap.has(m.conversation_id)) {
      lastMessageMap.set(m.conversation_id, {
        body: m.body,
        senderId: m.sender_id,
        createdAt: m.created_at,
        isSystem: m.is_system,
      });
    }
    if (m.sender_id !== userId && !readMessageIds.has(m.id)) {
      unreadCounts.set(m.conversation_id, (unreadCounts.get(m.conversation_id) ?? 0) + 1);
    }
  }

  // Separate conversations by type
  const directConversations = (conversations ?? [])
    .filter((c) => c.type === "direct")
    .map((c) => ({
      id: c.id,
      subject: c.subject,
      type: c.type as "direct",
      lastMessageAt: c.last_message_at,
      lastMessage: lastMessageMap.get(c.id) ?? null,
      unreadCount: unreadCounts.get(c.id) ?? 0,
    }));

  // Alerts: announcements + email logs (for the top strip)
  const alerts = (conversations ?? [])
    .filter((c) => c.type === "announcement" || c.type === "email_log")
    .map((c) => ({
      id: c.id,
      subject: c.subject,
      type: c.type as "announcement" | "email_log",
      lastMessageAt: c.last_message_at,
      lastMessage: lastMessageMap.get(c.id) ?? null,
      unreadCount: unreadCounts.get(c.id) ?? 0,
    }));

  // Fetch recent notifications for the active owner.
  const { data: notifications } = await client
    .from("notifications")
    .select("id, type, title, body, link, read, created_at")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <PortalMessagesShell
      conversations={directConversations}
      alerts={alerts}
      notifications={(notifications ?? []).map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        link: n.link,
        read: n.read,
        createdAt: n.created_at,
      }))}
      currentUserId={realUserId}
    />
  );
}
