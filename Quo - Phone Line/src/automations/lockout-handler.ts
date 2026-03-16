import { sendMessage } from "../client.js";
import { findReservationByPhone } from "../hospitable-client.js";
import { FALLBACK_LOCKOUT_REPLY, PROPERTY_CONFIGS, QUO_PHONE_NUMBER_ID } from "../config.js";
import type { QuoWebhookEvent, QuoWebhookMessageObject } from "../types.js";

// ─── Keyword detection ────────────────────────────────────────────────────────────

const LOCKOUT_KEYWORDS = [
  "locked out",
  "lock out",
  "lockout",
  "can't get in",
  "cant get in",
  "cannot get in",
  "door code",
  "lock code",
  "access code",
  "key code",
  "entry code",
  "key not working",
  "code not working",
  "code doesn't work",
  "code isnt working",
  "can't open",
  "cant open",
  "cannot open",
  "door won't open",
  "door wont open",
  "stuck outside",
];

export function isLockoutMessage(content: string): boolean {
  const lower = content.toLowerCase();
  return LOCKOUT_KEYWORDS.some((kw) => lower.includes(kw));
}

// ─── Reply builder ────────────────────────────────────────────────────────────────

function buildLockoutReply(
  firstName: string,
  propertyName: string,
  lockCode: string,
  address: string
): string {
  return (
    `Hi ${firstName}! Your door code for ${propertyName} is ${lockCode}. ` +
    `Address: ${address}. ` +
    `If you're still having trouble, reply and we'll call you right away.`
  );
}

function buildUnknownCodeReply(firstName: string, propertyName: string): string {
  return (
    `Hi ${firstName}! We found your reservation at ${propertyName}. ` +
    `We're sending your door code separately. If it's urgent, reply and we'll call you right back.`
  );
}

// ─── Main handler ─────────────────────────────────────────────────────────────────

export async function handleLockoutMessage(
  event: QuoWebhookEvent<QuoWebhookMessageObject>
): Promise<{ handled: boolean; reason: string }> {
  const msg = event.data.object;

  // Only process inbound messages
  if (msg.direction !== "incoming") {
    return { handled: false, reason: "outgoing message, skipped" };
  }

  // Only act on lockout-related content
  if (!isLockoutMessage(msg.content)) {
    return { handled: false, reason: "not a lockout message" };
  }

  const senderPhone = msg.from;
  console.log(`[lockout] Lockout message from ${senderPhone}: "${msg.content}"`);

  // Look up the sender in Hospitable
  const reservation = await findReservationByPhone(senderPhone);

  if (!reservation) {
    console.log(`[lockout] No active reservation found for ${senderPhone}, sending fallback`);
    try {
      await sendMessage({
        from: QUO_PHONE_NUMBER_ID,
        to: [senderPhone],
        content: FALLBACK_LOCKOUT_REPLY,
        setInboxStatus: "done",
      });
    } catch (err: unknown) {
      console.error(`[lockout] SMS send failed (fallback):`, err instanceof Error ? err.message : err);
    }
    return { handled: true, reason: "sent fallback: no reservation found" };
  }

  const guest = reservation.guest;
  const firstName = guest.first_name || "there";

  // propertyId is injected by hospitable-client during the per-property reservation fetch
  const propertyId = reservation.propertyId;
  const propertyConfig = propertyId ? PROPERTY_CONFIGS[propertyId] : undefined;

  let replyContent: string;

  if (propertyConfig && propertyConfig.lockCode !== "XXXX") {
    replyContent = buildLockoutReply(
      firstName,
      propertyConfig.name,
      propertyConfig.lockCode,
      propertyConfig.address
    );
    console.log(`[lockout] Sending lock code for ${propertyConfig.name} to ${senderPhone}`);
  } else {
    // We found the guest but don't have the property code configured
    const propertyName = propertyConfig?.name ?? "your property";
    replyContent = buildUnknownCodeReply(firstName, propertyName);
    console.log(`[lockout] Guest found but no lock code configured for property ${propertyId ?? "unknown"}`);
  }

  try {
    await sendMessage({
      from: QUO_PHONE_NUMBER_ID,
      to: [senderPhone],
      content: replyContent,
      setInboxStatus: "done",
    });
  } catch (err: unknown) {
    console.error(`[lockout] SMS send failed:`, err instanceof Error ? err.message : err);
  }

  return {
    handled: true,
    reason: `replied to ${firstName} (${guest.last_name}) for reservation ${reservation.code}`,
  };
}
