import { sendMessage } from "../client.js";
import { findReservationByPhone } from "../hospitable-client.js";
import { FALLBACK_INFO_REPLY, PROPERTY_CONFIGS, QUO_PHONE_NUMBER_ID } from "../config.js";
import type { QuoWebhookEvent, QuoWebhookMessageObject } from "../types.js";

// ─── Keyword detection ────────────────────────────────────────────────────────

type InfoType = "wifi" | "parking" | "checkin" | "checkout" | "address" | "help";

const WIFI_KEYWORDS = [
  "wifi", "wi-fi", "wi fi", "internet", "network password",
  "wifi password", "the wifi", "the password", "connect to wifi",
  "what's the wifi", "whats the wifi", "wifi info",
];

const PARKING_KEYWORDS = [
  "parking", "where to park", "where can i park",
  "where do i park", "park my car", "where should i park",
];

const CHECKIN_KEYWORDS = [
  "check in", "check-in", "checkin", "check in time", "check-in time",
  "when can i arrive", "early check in", "early checkin",
  "arrival time", "what time can i check in", "what time is check in",
];

const CHECKOUT_KEYWORDS = [
  "check out", "check-out", "checkout", "check out time",
  "checkout time", "check-out time", "when do i leave",
  "what time do i check out", "late checkout", "late check out",
  "late check-out", "when is checkout",
];

const ADDRESS_KEYWORDS = [
  "address", "directions", "how do i get there",
  "where is the property", "property location", "send me the address",
  "what's the address", "whats the address", "need the address",
  "navigate to", "where are you located",
];

const HELP_KEYWORDS = [
  "help", "menu", "commands", "what can i text",
  "what can i ask", "options", "what do i text",
];

export function detectInfoType(content: string): InfoType | null {
  const lower = content.toLowerCase();
  if (HELP_KEYWORDS.some((kw) => lower.includes(kw))) return "help";
  if (WIFI_KEYWORDS.some((kw) => lower.includes(kw))) return "wifi";
  if (PARKING_KEYWORDS.some((kw) => lower.includes(kw))) return "parking";
  if (CHECKIN_KEYWORDS.some((kw) => lower.includes(kw))) return "checkin";
  if (CHECKOUT_KEYWORDS.some((kw) => lower.includes(kw))) return "checkout";
  if (ADDRESS_KEYWORDS.some((kw) => lower.includes(kw))) return "address";
  return null;
}

// ─── Reply builders ───────────────────────────────────────────────────────────

function buildHelpReply(): string {
  return (
    "Hi! Here's what you can text us for an instant reply:\n\n" +
    "DOOR CODE — Get your entry code\n" +
    "WIFI — Get WiFi name & password\n" +
    "PARKING — Get parking instructions\n" +
    "CHECK IN — Get check-in details\n" +
    "CHECK OUT — Get check-out info\n" +
    "ADDRESS — Get the property address\n\n" +
    "Reply anytime — we're here to help!"
  );
}

function buildWifiReply(firstName: string, propertyName: string, wifiName: string, wifiPassword: string): string {
  return (
    `Hi ${firstName}! Here are your WiFi details for ${propertyName}:\n\n` +
    `Network: ${wifiName}\n` +
    `Password: ${wifiPassword}\n\n` +
    `You're all connected! Reply anytime if you need anything else.`
  );
}

function buildParkingReply(firstName: string, propertyName: string, instructions: string): string {
  return (
    `Hi ${firstName}! Here's the parking info for ${propertyName}:\n\n` +
    `${instructions}\n\n` +
    `Let us know if you have any other questions!`
  );
}

function buildCheckInReply(
  firstName: string,
  propertyName: string,
  checkInTime: string,
  address: string,
  lockCode: string,
  instructions: string
): string {
  const codeSection = lockCode !== "XXXX" ? `\nDoor code: ${lockCode}` : "";
  const instrSection =
    instructions && instructions !== "PLACEHOLDER" ? `\n\n${instructions}` : "";
  return (
    `Hi ${firstName}! Here's everything you need to check in at ${propertyName}:\n\n` +
    `Check-in: ${checkInTime}\n` +
    `Address: ${address}` +
    codeSection +
    instrSection +
    `\n\nWe're so excited to have you! Reply anytime if you need anything at all.`
  );
}

function buildCheckOutReply(
  firstName: string,
  propertyName: string,
  checkOutTime: string,
  instructions: string
): string {
  const instrSection =
    instructions && instructions !== "PLACEHOLDER" ? ` ${instructions}` : "";
  return (
    `Hi ${firstName}! Your check-out time for ${propertyName} is ${checkOutTime}.` +
    instrSection +
    ` We hope you had an absolutely wonderful stay! If you have a moment, we'd love a review — it means the world to us. Safe travels!`
  );
}

function buildAddressReply(firstName: string, propertyName: string, address: string): string {
  return (
    `Hi ${firstName}! The address for ${propertyName} is:\n\n` +
    `${address}\n\n` +
    `See you soon! Reply if you need directions or anything else.`
  );
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function handleInfoMessage(
  event: QuoWebhookEvent<QuoWebhookMessageObject>
): Promise<{ handled: boolean; reason: string }> {
  const msg = event.data.object;

  if (msg.direction !== "incoming") {
    return { handled: false, reason: "outgoing message, skipped" };
  }

  const infoType = detectInfoType(msg.content);
  if (!infoType) {
    return { handled: false, reason: "not an info request" };
  }

  const senderPhone = msg.from;
  console.log(`[info] ${infoType} request from ${senderPhone}: "${msg.content}"`);

  // Help command doesn't need a reservation lookup
  if (infoType === "help") {
    try {
      await sendMessage({
        from: QUO_PHONE_NUMBER_ID,
        to: [senderPhone],
        content: buildHelpReply(),
        setInboxStatus: "done",
      });
    } catch (err: unknown) {
      console.error(`[info] SMS send failed (help):`, err instanceof Error ? err.message : err);
    }
    return { handled: true, reason: "sent help menu" };
  }

  const reservation = await findReservationByPhone(senderPhone);

  if (!reservation) {
    console.log(`[info] No active reservation found for ${senderPhone}, sending fallback`);
    try {
      await sendMessage({
        from: QUO_PHONE_NUMBER_ID,
        to: [senderPhone],
        content: FALLBACK_INFO_REPLY,
        setInboxStatus: "done",
      });
    } catch (err: unknown) {
      console.error(`[info] SMS send failed (fallback):`, err instanceof Error ? err.message : err);
    }
    return { handled: true, reason: `sent fallback: no reservation found (${infoType})` };
  }

  const guest = reservation.guest;
  const firstName = guest.first_name || "there";
  const propertyId = reservation.propertyId;
  const config = propertyId ? PROPERTY_CONFIGS[propertyId] : undefined;

  if (!config) {
    console.log(`[info] No property config for ${propertyId ?? "unknown"}`);
    return { handled: false, reason: "no property config" };
  }

  let replyContent: string;

  switch (infoType) {
    case "wifi":
      if (config.wifiName === "PLACEHOLDER" || config.wifiPassword === "PLACEHOLDER") {
        replyContent =
          `Hi ${firstName}! We're pulling up your WiFi details for ${config.name} and will send them to you shortly. We're sorry for the brief delay — you'll hear from us in just a moment!`;
      } else {
        replyContent = buildWifiReply(firstName, config.name, config.wifiName, config.wifiPassword);
      }
      break;

    case "parking":
      if (config.parkingInstructions === "PLACEHOLDER") {
        replyContent =
          `Hi ${firstName}! We're getting your parking details for ${config.name} and will send them to you shortly. Thank you so much for your patience!`;
      } else {
        replyContent = buildParkingReply(firstName, config.name, config.parkingInstructions);
      }
      break;

    case "checkin":
      replyContent = buildCheckInReply(
        firstName,
        config.name,
        config.checkInTime,
        config.address,
        config.lockCode,
        config.checkInInstructions
      );
      break;

    case "checkout":
      replyContent = buildCheckOutReply(
        firstName,
        config.name,
        config.checkOutTime,
        config.checkOutInstructions
      );
      break;

    case "address":
      replyContent = buildAddressReply(firstName, config.name, config.address);
      break;

    default:
      return { handled: false, reason: "unknown info type" };
  }

  try {
    await sendMessage({
      from: QUO_PHONE_NUMBER_ID,
      to: [senderPhone],
      content: replyContent,
      setInboxStatus: "done",
    });
    console.log(`[info] Sent ${infoType} info for ${config.name} to ${senderPhone}`);
  } catch (err: unknown) {
    console.error(`[info] SMS send failed:`, err instanceof Error ? err.message : err);
  }

  return {
    handled: true,
    reason: `sent ${infoType} info to ${firstName} (${guest.last_name}) for ${config.name}`,
  };
}
