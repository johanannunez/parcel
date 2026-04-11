"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { buildMessageEmail, buildBroadcastEmail } from "@/lib/email-template";
import { sendPushToOwner, sendPushToAllOwners } from "@/lib/push";

/* ─── Helpers ─── */

async function sendViaResend(args: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; resendId?: string; error?: string }> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn("[Messages] RESEND_API_KEY not set, skipping email");
    return { ok: false, error: "RESEND_API_KEY not set" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Parcel <hello@theparcelco.com>",
        to: args.to,
        subject: args.subject,
        html: args.html,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[Messages] Resend error:", text);
      return { ok: false, error: text };
    }

    const data = await res.json();
    return { ok: true, resendId: data.id };
  } catch (err) {
    console.error("[Messages] Resend send failed:", err);
    return { ok: false, error: String(err) };
  }
}

/* ─── Actions ─── */

/**
 * Send a message from admin to an owner.
 * Supports portal-only or email delivery.
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

  // If email delivery, send via Resend first
  let resendId: string | undefined;
  if (args.deliveryMethod === "email") {
    const { data: ownerProfile } = await svc
      .from("profiles")
      .select("email, full_name")
      .eq("id", args.ownerId)
      .single();

    if (ownerProfile?.email) {
      const subject = args.subject || "New message from The Parcel Company";
      const html = buildMessageEmail({
        subject,
        body: args.body,
        conversationId,
        ownerName: ownerProfile.full_name?.split(" ")[0] ?? undefined,
      });

      const result = await sendViaResend({
        to: ownerProfile.email,
        subject,
        html,
      });
      resendId = result.resendId;
    }
  }

  // Insert the message
  const metadata: Record<string, string> = {};
  if (args.subject) metadata.subject = args.subject;
  if (resendId) metadata.resend_id = resendId;

  const { data: msg, error: msgErr } = await svc
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: args.body,
      delivery_method: args.deliveryMethod ?? "portal",
      metadata: metadata as unknown as import("@/types/supabase").Json,
    })
    .select("id, created_at")
    .single();

  if (msgErr || !msg) return { error: msgErr?.message ?? "Failed to send message" };

  // Push notification (fire-and-forget)
  sendPushToOwner({
    ownerId: args.ownerId,
    title: "The Parcel Company",
    body: args.body,
    url: "/portal/messages",
  }).catch(() => {});

  revalidatePath("/admin/messages");
  return { success: true, messageId: msg.id, conversationId };
}

/**
 * Send a broadcast announcement to all owners.
 * Can deliver portal-only or portal + email to every owner.
 */
export async function sendBroadcast(args: {
  subject: string;
  body: string;
  deliveryMethod: "portal" | "portal_email";
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
      metadata: { subject: args.subject } as unknown as import("@/types/supabase").Json,
    })
    .select("id")
    .single();

  if (msgErr || !msg) return { error: msgErr?.message ?? "Failed to send announcement" };

  // If email delivery, send to all owners
  if (args.deliveryMethod === "portal_email") {
    const { data: owners } = await svc
      .from("profiles")
      .select("email, full_name")
      .eq("role", "owner");

    if (owners?.length) {
      const emailPromises = owners.map((owner) => {
        const html = buildBroadcastEmail({
          subject: args.subject,
          body: args.body,
          ownerName: owner.full_name?.split(" ")[0] ?? undefined,
        });
        return sendViaResend({
          to: owner.email,
          subject: args.subject,
          html,
        });
      });

      // Send in parallel, don't block on failures
      await Promise.allSettled(emailPromises);
    }
  }

  // Push notification to all owners (fire-and-forget)
  sendPushToAllOwners({
    title: "Parcel Announcement",
    body: args.body,
    url: "/portal/messages",
  }).catch(() => {});

  revalidatePath("/admin/messages");
  return { success: true, conversationId: conv.id, ownerCount: 0 };
}

/**
 * Get the count of owners (for broadcast preview).
 */
export async function getOwnerCount() {
  const svc = createServiceClient();
  const { count } = await svc
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "owner");
  return count ?? 0;
}

/**
 * Fetch all conversations for the admin inbox.
 */
export async function getAdminConversations(filter?: string) {
  const svc = createServiceClient();

  let query = svc
    .from("conversations")
    .select("id, owner_id, subject, type, last_message_at, created_at")
    .order("last_message_at", { ascending: false })
    .limit(100);

  if (filter === "announcements") {
    query = query.eq("type", "announcement");
  } else if (filter === "email_logs") {
    query = query.eq("type", "email_log");
  }

  const { data, error } = await query;
  if (error) return { error: error.message, conversations: [] };

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

  const senderIds = [...new Set((msgsRes.data ?? []).map((m) => m.sender_id))];
  const { data: senders } = senderIds.length
    ? await svc.from("profiles").select("id, full_name, email, role, avatar_url").in("id", senderIds)
    : { data: [] };
  const senderMap = new Map((senders ?? []).map((s) => [s.id, { name: s.full_name?.trim() || s.email, role: s.role, avatarUrl: s.avatar_url }]));

  const messages = (msgsRes.data ?? []).map((m) => ({
    ...m,
    senderName: senderMap.get(m.sender_id)?.name ?? "Unknown",
    senderRole: senderMap.get(m.sender_id)?.role ?? "owner",
    senderAvatarUrl: senderMap.get(m.sender_id)?.avatarUrl ?? null,
    reads: readMap.get(m.id) ?? [],
  }));

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
