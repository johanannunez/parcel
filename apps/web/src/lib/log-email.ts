import { createServiceClient } from "@/lib/supabase/service";

/**
 * Log an outbound email to an owner's conversation history.
 * Creates an email_log conversation (or appends to existing) so the
 * owner can see the email record in their portal Messages page.
 *
 * Call this from anywhere that sends an email to an owner
 * (block request approvals, payout notifications, etc.).
 */
export async function logEmailToOwner(args: {
  ownerId: string;
  senderId: string;
  subject: string;
  bodyHtml: string;
  resendId?: string;
}) {
  const svc = createServiceClient();

  // Find or create an email_log conversation for this owner
  const { data: existing } = await svc
    .from("conversations")
    .select("id")
    .eq("owner_id", args.ownerId)
    .eq("type", "email_log")
    .maybeSingle();

  let conversationId = existing?.id;

  if (!conversationId) {
    const { data: conv } = await svc
      .from("conversations")
      .insert({
        owner_id: args.ownerId,
        type: "email_log",
        subject: "Email history",
      })
      .select("id")
      .single();

    conversationId = conv?.id;
  }

  if (!conversationId) return;

  await svc.from("messages").insert({
    conversation_id: conversationId,
    sender_id: args.senderId,
    body: args.bodyHtml,
    is_system: true,
    delivery_method: "email",
    metadata: {
      subject: args.subject,
      resend_id: args.resendId ?? null,
    },
  });
}
