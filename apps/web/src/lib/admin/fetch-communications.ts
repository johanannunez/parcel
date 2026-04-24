// apps/web/src/lib/admin/fetch-communications.ts
import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { CommunicationEvent } from './communication-types';
import type { CommunicationInsightPayload } from './communication-types';
import { fetchInsightsByParentWithPayload } from './ai-insights';

type CommunicationsData = {
  events: CommunicationEvent[];
  latestSummary: string | null;
  actionItems: string[];
};

function mapRow(r: Record<string, unknown>): CommunicationEvent {
  return {
    id: r.id as string,
    quoId: r.quo_id as string,
    channel: r.channel as 'call' | 'sms',
    direction: r.direction as 'inbound' | 'outbound',
    phoneFrom: r.phone_from as string,
    phoneTo: r.phone_to as string,
    rawTranscript: (r.raw_transcript as string | null) ?? null,
    durationSeconds: (r.duration_seconds as number | null) ?? null,
    recordingUrl: (r.recording_url as string | null) ?? null,
    quoSummary: (r.quo_summary as string | null) ?? null,
    entityType: (r.entity_type as CommunicationEvent['entityType']) ?? null,
    entityId: (r.entity_id as string | null) ?? null,
    processAfter: (r.process_after as string | null) ?? null,
    processedAt: (r.processed_at as string | null) ?? null,
    tier: (r.tier as CommunicationEvent['tier']) ?? null,
    claudeSummary: (r.claude_summary as string | null) ?? null,
    createdAt: r.created_at as string,
  };
}

export async function fetchCommunications(
  entityType: 'owner' | 'contact' | 'vendor',
  entityId: string
): Promise<CommunicationsData> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from('communication_events')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[fetch-communications] error:', error.message);
    return { events: [], latestSummary: null, actionItems: [] };
  }

  const events = (data ?? []).map(mapRow);

  const insightMap = await fetchInsightsByParentWithPayload(entityType, [entityId]);
  const insights = insightMap[entityId] ?? [];
  const commInsight = insights.find((i) => i.agentKey.startsWith('communication:'));
  const payload = commInsight?.actionPayload as CommunicationInsightPayload | undefined;

  return {
    events,
    latestSummary: commInsight?.body ?? null,
    actionItems: payload?.actionItems ?? [],
  };
}
