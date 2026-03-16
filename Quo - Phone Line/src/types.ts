// ─── Pagination ────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  nextPageToken?: string;
}

// ─── Phone Numbers ──────────────────────────────────────────────────────────────

export interface PhoneNumberUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  groupId: string;
}

export interface PhoneNumber {
  id: string;
  groupId: string;
  name: string;
  number: string; // E.164 format, e.g. "+16058007033"
  formattedNumber: string; // e.g. "(605) 800-7033"
  symbol?: string;
  users: PhoneNumberUser[];
  createdAt: string;
  updatedAt: string;
}

// ─── Users ──────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Contacts ───────────────────────────────────────────────────────────────────

export interface ContactPhoneNumber {
  value: string;
  type?: string;
}

export interface ContactEmail {
  value: string;
  type?: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  company?: string;
  role?: string;
  phoneNumbers: ContactPhoneNumber[];
  emails: ContactEmail[];
  source?: string;
  externalId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactCustomField {
  id: string;
  name: string;
  type: "text" | "number" | "date" | "boolean";
  description?: string;
}

export interface CreateContactPayload {
  firstName: string;
  lastName: string;
  company?: string;
  role?: string;
  phoneNumbers?: ContactPhoneNumber[];
  emails?: ContactEmail[];
  source?: string;
  externalId?: string;
}

export interface UpdateContactPayload {
  firstName?: string;
  lastName?: string;
  company?: string;
  role?: string;
  phoneNumbers?: ContactPhoneNumber[];
  emails?: ContactEmail[];
}

// ─── Calls ───────────────────────────────────────────────────────────────────────

export type CallDirection = "incoming" | "outgoing";
export type CallStatus = "completed" | "missed" | "voicemail" | "failed";

export interface Call {
  id: string;
  direction: CallDirection;
  status: CallStatus;
  from: string;
  to: string;
  phoneNumberId: string;
  userId: string;
  duration: number; // seconds
  createdAt: string;
  answeredAt?: string;
  completedAt?: string;
}

export interface CallSummary {
  callId: string;
  summary: string;
  createdAt: string;
}

export interface TranscriptSegment {
  speakerName: string;
  content: string;
  startTime: number;
  endTime: number;
}

export interface CallTranscript {
  id: string;
  callId: string;
  segments: TranscriptSegment[];
  createdAt: string;
}

export interface CallVoicemail {
  callId: string;
  url: string;
  duration: number;
  transcript?: string;
  createdAt: string;
}

export interface CallRecording {
  url: string;
  duration: number;
  createdAt: string;
}

// ─── Messages ────────────────────────────────────────────────────────────────────

export type MessageDirection = "incoming" | "outgoing";
export type MessageStatus = "delivered" | "failed" | "queued" | "sending" | "undelivered";

export interface MessageMedia {
  url: string;
  contentType: string;
}

export interface Message {
  id: string;
  direction: MessageDirection;
  status: MessageStatus;
  content: string;
  from: string;
  to: string[];
  phoneNumberId: string;
  userId?: string;
  media?: MessageMedia[];
  createdAt: string;
  updatedAt: string;
}

// ─── Conversations ────────────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  phoneNumberId: string;
  participants: string[];
  unreadCount: number;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Webhooks ────────────────────────────────────────────────────────────────────

export type WebhookResourceType = "message" | "call" | "call-summary" | "call-transcript";

export interface Webhook {
  id: string;
  url: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookPayload {
  url: string;
  phoneNumberIds?: string[];
}

// ─── List Query Params ────────────────────────────────────────────────────────────

export interface ListCallsParams {
  phoneNumberId: string;
  participants?: string[];
  userId?: string;
  maxResults?: number;
  createdAfter?: string;
  createdBefore?: string;
  pageToken?: string;
}

export interface ListMessagesParams {
  phoneNumberId: string;
  participants?: string[];
  userId?: string;
  maxResults?: number;
  createdAfter?: string;
  createdBefore?: string;
  pageToken?: string;
}

export interface ListContactsParams {
  maxResults?: number;
  externalIds?: string[];
  sources?: string[];
  pageToken?: string;
}

export interface ListConversationsParams {
  maxResults?: number;
  phoneNumbers?: string[];
  userId?: string;
  createdAfter?: string;
  createdBefore?: string;
  excludeInactive?: boolean;
  updatedAfter?: string;
  updatedBefore?: string;
  pageToken?: string;
}

export interface ListUsersParams {
  maxResults?: number;
  pageToken?: string;
}

// ─── Send Message ─────────────────────────────────────────────────────────────────

export interface SendMessagePayload {
  content: string;
  from: string; // phone number ID (e.g. "PNomB1DvdK") or E.164 number
  to: [string]; // exactly one recipient in E.164 format
  userId?: string;
  setInboxStatus?: "done";
}

export interface SentMessage {
  id: string;
  to: string[];
  from: string;
  text: string;
  phoneNumberId: string | null;
  direction: "incoming" | "outgoing";
  userId: string;
  status: "queued" | "sent" | "delivered" | "undelivered" | "received";
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageResponse {
  data: SentMessage;
}

// ─── Webhook Payloads ─────────────────────────────────────────────────────────────

export interface QuoWebhookMessageObject {
  id: string;
  from: string; // E.164, the sender
  to: string[]; // E.164 array, the recipients
  content: string;
  phoneNumberId: string;
  direction: "incoming" | "outgoing";
  userId?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuoWebhookCallObject {
  id: string;
  from: string;
  to: string;
  direction: "incoming" | "outgoing";
  status: "completed" | "missed" | "voicemail" | "failed";
  phoneNumberId: string;
  userId?: string;
  duration?: number;
  createdAt: string;
}

export type QuoWebhookType =
  | "message.received"
  | "message.delivered"
  | "call.ringing"
  | "call.completed"
  | "call.recording.completed"
  | "call.summary.completed"
  | "call.transcript.completed";

export interface QuoWebhookEvent<T = QuoWebhookMessageObject | QuoWebhookCallObject> {
  id: string;
  object: "event";
  apiVersion: string;
  createdAt: string;
  type: QuoWebhookType;
  data: {
    object: T;
  };
}
