// apps/web/src/lib/admin/communication-types.ts

export type ResolvedEntity =
  | { type: 'owner';   entityId: string; displayName: string; propertyIds: string[] }
  | { type: 'contact'; entityId: string; displayName: string; propertyIds: string[] }
  | { type: 'vendor';  entityId: string; displayName: string; propertyIds: string[] }
  | { type: 'unknown'; phone: string };

export type CommunicationEvent = {
  id: string;
  quoId: string;
  channel: 'call' | 'sms';
  direction: 'inbound' | 'outbound';
  phoneFrom: string;
  phoneTo: string;
  rawTranscript: string | null;
  durationSeconds: number | null;
  recordingUrl: string | null;
  quoSummary: string | null;
  entityType: 'owner' | 'contact' | 'vendor' | 'unknown' | null;
  entityId: string | null;
  processAfter: string | null;
  processedAt: string | null;
  tier: 'action_required' | 'fyi' | 'noise' | null;
  claudeSummary: string | null;
  createdAt: string;
};

export type CommunicationInsightPayload = {
  bucket: 'communication';
  tier: 'action_required' | 'fyi';
  actionItems: string[];
  sentiment: 'positive' | 'neutral' | 'concerned';
  eventIds: string[];
  channel: 'call' | 'sms' | 'mixed';
};
