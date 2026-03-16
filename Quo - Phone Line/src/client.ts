import "dotenv/config";
import type {
  Call,
  CallRecording,
  CallSummary,
  CallTranscript,
  CallVoicemail,
  Contact,
  ContactCustomField,
  Conversation,
  CreateContactPayload,
  CreateWebhookPayload,
  ListCallsParams,
  ListContactsParams,
  ListConversationsParams,
  ListMessagesParams,
  ListUsersParams,
  Message,
  PaginatedResponse,
  PhoneNumber,
  SendMessagePayload,
  SendMessageResponse,
  UpdateContactPayload,
  User,
  Webhook,
} from "./types.js";

const BASE_URL = "https://api.openphone.com";

// ─── Core fetch wrapper ─────────────────────────────────────────────────────────

async function quoFetch<T>(
  path: string,
  options: RequestInit = {},
  params?: Record<string, string | number | boolean | string[] | undefined>
): Promise<T> {
  const apiKey = process.env["QUO_API_KEY"];
  if (!apiKey) throw new Error("QUO_API_KEY is not set in environment variables.");

  const url = new URL(`${BASE_URL}${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const v of value) url.searchParams.append(key, v);
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Quo API error ${response.status} on ${path}: ${body}`);
  }

  return response.json() as Promise<T>;
}

// ─── Phone Numbers ──────────────────────────────────────────────────────────────

export async function listPhoneNumbers(userId?: string): Promise<PaginatedResponse<PhoneNumber>> {
  return quoFetch<PaginatedResponse<PhoneNumber>>("/v1/phone-numbers", {}, userId ? { userId } : undefined);
}

export async function getPhoneNumber(phoneNumberId: string): Promise<{ data: PhoneNumber }> {
  return quoFetch<{ data: PhoneNumber }>(`/v1/phone-numbers/${phoneNumberId}`);
}

// ─── Users ──────────────────────────────────────────────────────────────────────

export async function listUsers(params?: ListUsersParams): Promise<PaginatedResponse<User>> {
  return quoFetch<PaginatedResponse<User>>("/v1/users", {}, params as Record<string, string | number | boolean | string[] | undefined>);
}

export async function getUser(userId: string): Promise<{ data: User }> {
  return quoFetch<{ data: User }>(`/v1/users/${userId}`);
}

// ─── Contacts ───────────────────────────────────────────────────────────────────

export async function listContacts(params?: ListContactsParams): Promise<PaginatedResponse<Contact>> {
  return quoFetch<PaginatedResponse<Contact>>("/v1/contacts", {}, params as Record<string, string | number | boolean | string[] | undefined>);
}

export async function getContact(id: string): Promise<{ data: Contact }> {
  return quoFetch<{ data: Contact }>(`/v1/contacts/${id}`);
}

export async function createContact(payload: CreateContactPayload): Promise<{ data: Contact }> {
  return quoFetch<{ data: Contact }>("/v1/contacts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateContact(id: string, payload: UpdateContactPayload): Promise<{ data: Contact }> {
  return quoFetch<{ data: Contact }>(`/v1/contacts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteContact(id: string): Promise<void> {
  await quoFetch<void>(`/v1/contacts/${id}`, { method: "DELETE" });
}

export async function getContactCustomFields(): Promise<PaginatedResponse<ContactCustomField>> {
  return quoFetch<PaginatedResponse<ContactCustomField>>("/v1/contact-custom-fields");
}

// ─── Calls ───────────────────────────────────────────────────────────────────────

export async function listCalls(params: ListCallsParams): Promise<PaginatedResponse<Call>> {
  return quoFetch<PaginatedResponse<Call>>("/v1/calls", {}, params as unknown as Record<string, string | number | boolean | string[] | undefined>);
}

export async function getCall(callId: string): Promise<{ data: Call }> {
  return quoFetch<{ data: Call }>(`/v1/calls/${callId}`);
}

export async function getCallSummary(callId: string): Promise<{ data: CallSummary }> {
  return quoFetch<{ data: CallSummary }>(`/v1/call-summaries/${callId}`);
}

export async function getCallTranscript(id: string): Promise<{ data: CallTranscript }> {
  return quoFetch<{ data: CallTranscript }>(`/v1/call-transcripts/${id}`);
}

export async function getCallVoicemail(callId: string): Promise<{ data: CallVoicemail }> {
  return quoFetch<{ data: CallVoicemail }>(`/v1/call-voicemails/${callId}`);
}

export async function getCallRecordings(callId: string): Promise<PaginatedResponse<CallRecording>> {
  return quoFetch<PaginatedResponse<CallRecording>>(`/v1/call-recordings/${callId}`);
}

// ─── Messages ────────────────────────────────────────────────────────────────────

export async function listMessages(params: ListMessagesParams): Promise<PaginatedResponse<Message>> {
  return quoFetch<PaginatedResponse<Message>>("/v1/messages", {}, params as unknown as Record<string, string | number | boolean | string[] | undefined>);
}

export async function getMessage(id: string): Promise<{ data: Message }> {
  return quoFetch<{ data: Message }>(`/v1/messages/${id}`);
}

export async function sendMessage(payload: SendMessagePayload): Promise<SendMessageResponse> {
  return quoFetch<SendMessageResponse>("/v1/messages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Conversations ────────────────────────────────────────────────────────────────

export async function listConversations(params?: ListConversationsParams): Promise<PaginatedResponse<Conversation>> {
  return quoFetch<PaginatedResponse<Conversation>>("/v1/conversations", {}, params as Record<string, string | number | boolean | string[] | undefined>);
}

// ─── Webhooks ────────────────────────────────────────────────────────────────────

export async function listWebhooks(userId?: string): Promise<PaginatedResponse<Webhook>> {
  return quoFetch<PaginatedResponse<Webhook>>("/v1/webhooks", {}, userId ? { userId } : undefined);
}

export async function getWebhook(id: string): Promise<{ data: Webhook }> {
  return quoFetch<{ data: Webhook }>(`/v1/webhooks/${id}`);
}

export async function deleteWebhook(id: string): Promise<void> {
  await quoFetch<void>(`/v1/webhooks/${id}`, { method: "DELETE" });
}

export async function createMessageWebhook(payload: CreateWebhookPayload): Promise<{ data: Webhook }> {
  return quoFetch<{ data: Webhook }>("/v1/webhooks/messages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createCallWebhook(payload: CreateWebhookPayload): Promise<{ data: Webhook }> {
  return quoFetch<{ data: Webhook }>("/v1/webhooks/calls", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createCallSummaryWebhook(payload: CreateWebhookPayload): Promise<{ data: Webhook }> {
  return quoFetch<{ data: Webhook }>("/v1/webhooks/call-summaries", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createCallTranscriptWebhook(payload: CreateWebhookPayload): Promise<{ data: Webhook }> {
  return quoFetch<{ data: Webhook }>("/v1/webhooks/call-transcripts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
