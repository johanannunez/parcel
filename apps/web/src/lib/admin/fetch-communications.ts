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

  const insightMap = await fetchInsightsByParentWithPayload(entityType, [entityId]).catch(() => ({} as Record<string, never[]>));
  const insights = insightMap[entityId] ?? [];
  const commInsight = insights.find((i) => i.agentKey.startsWith('communication:'));
  const payload = commInsight?.actionPayload as CommunicationInsightPayload | undefined;

  return {
    events,
    latestSummary: commInsight?.body ?? null,
    actionItems: payload?.actionItems ?? [],
  };
}

export type UnresolvedCaller = {
  phone: string;
  claudeSummary: string | null;
  createdAt: string;
};

export type CommunicationsDashboardData = {
  recentActionItems: Array<{
    id: string;
    title: string;
    body: string;
    entityType: string;
    entityId: string;
    createdAt: string;
  }>;
  unresolvedCallers: UnresolvedCaller[];
};

export async function fetchCommunicationsDashboard(): Promise<CommunicationsDashboardData> {
  const supabase = await createClient();

  const [insightsResult, unresolvedResult] = await Promise.all([
    supabase
      .from('ai_insights')
      .select('id, parent_type, parent_id, title, body, created_at')
      .like('agent_key', 'communication:%')
      .eq('severity', 'recommendation')
      .is('dismissed_at', null)
      .order('created_at', { ascending: false })
      .limit(10),
    (supabase as any)
      .from('communication_events')
      .select('phone_from, claude_summary, created_at')
      .eq('entity_type', 'unknown')
      .not('tier', 'eq', 'noise')
      .not('processed_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const recentActionItems = (insightsResult.data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    title: r.title as string,
    body: r.body as string,
    entityType: r.parent_type as string,
    entityId: r.parent_id as string,
    createdAt: r.created_at as string,
  }));

  const seenPhones = new Set<string>();
  const unresolvedCallers: UnresolvedCaller[] = [];
  for (const r of unresolvedResult.data ?? []) {
    if (!seenPhones.has(r.phone_from)) {
      seenPhones.add(r.phone_from);
      unresolvedCallers.push({
        phone: r.phone_from,
        claudeSummary: r.claude_summary,
        createdAt: r.created_at,
      });
    }
  }

  return { recentActionItems, unresolvedCallers };
}
