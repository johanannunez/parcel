// apps/web/src/lib/admin/guest-intelligence.ts
import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { createServiceClient } from '@/lib/supabase/service';
import { getProperties, getPropertyReviews, getPropertyConversations } from '@/lib/hospitable';
import type { InsightPayload } from './insight-types';

const anthropic = new Anthropic();

type ClaudeInsight = {
  title: string;
  body: string;
  severity: 'info' | 'recommendation' | 'warning' | 'critical';
  severityReason: string;
  sourceCount: number;
  sourceExcerpts: InsightPayload['sourceExcerpts'];
  suggestedFixes: string[];
};

type ClaudeResponse = {
  ownerUpdates: ClaudeInsight[];
  houseActionItems: ClaudeInsight[];
};

const SYSTEM_PROMPT = `You are an expert short-term rental property manager analyzing guest feedback for a management company. You will receive reviews and messages for a property and extract two lists of insights.

Rules for severity:
- "info": positive feedback or minor non-recurring suggestions worth noting
- "recommendation": recurring preference or opportunity for improvement
- "warning": recurring issue affecting guest experience, mentioned 2+ times
- "critical": safety/security concern, broken essential appliance, or severe issue regardless of mention count (e.g., smoke detector, door lock failure, flooding, no hot water)

sourceCount is the number of distinct reviews or messages that mention the issue.

suggestedFixes should be 1-3 concrete actionable steps specific to the issue. Not generic advice.

Return ONLY valid JSON matching this schema:
{
  "ownerUpdates": [ClaudeInsight],
  "houseActionItems": [ClaudeInsight]
}

ClaudeInsight schema:
{
  "title": "string (max 80 chars)",
  "body": "string (2-4 sentences, plain language synthesis)",
  "severity": "info" | "recommendation" | "warning" | "critical",
  "severityReason": "string (1 sentence explaining the severity decision)",
  "sourceCount": number,
  "sourceExcerpts": [{ "type": "review" | "message", "guestFirstName": "string", "approximateDate": "string", "quote": "string (relevant excerpt only)" }],
  "suggestedFixes": ["string"]
}

ownerUpdates: things the property owner should know (praise worth sharing, recurring concerns, revenue opportunities, patterns the owner needs context on).
houseActionItems: physical or operational issues that need to be fixed, maintained, or addressed at the property.

If there is nothing meaningful to report in a category, return an empty array. Do not invent issues.`;

function buildUserPrompt(propertyName: string, content: string): string {
  return `Property: ${propertyName}

Guest feedback (reviews and messages from the past 90 days):

${content}

Analyze this feedback and return the JSON response.`;
}

function buildFeedbackText(
  reviews: Awaited<ReturnType<typeof getPropertyReviews>>,
  conversations: Awaited<ReturnType<typeof getPropertyConversations>>,
): string {
  const parts: string[] = [];

  for (const r of reviews) {
    if (!r.public_review && !r.private_feedback) continue;
    const name = r.guest?.first_name ?? 'Guest';
    const date = r.created_at
      ? new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
      : 'Unknown date';
    const rating = r.rating ? ` (${r.rating}/5 stars)` : '';
    if (r.public_review) parts.push(`[REVIEW] ${name}, ${date}${rating}: "${r.public_review}"`);
    if (r.private_feedback) parts.push(`[PRIVATE FEEDBACK] ${name}, ${date}: "${r.private_feedback}"`);
  }

  for (const conv of conversations) {
    const guestMsgs = (conv.messages ?? []).filter((m) => m.from === 'guest' && m.body);
    if (!guestMsgs.length) continue;
    const name = conv.guest?.first_name ?? 'Guest';
    for (const msg of guestMsgs.slice(0, 5)) {
      const date = msg.created_at
        ? new Date(msg.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
        : 'Unknown date';
      parts.push(`[MESSAGE] ${name}, ${date}: "${msg.body}"`);
    }
  }

  return parts.length > 0 ? parts.join('\n\n') : 'No guest feedback available.';
}

async function analyzeProperty(
  propertyId: string,
  propertyName: string,
): Promise<ClaudeResponse | null> {
  const [reviews, conversations] = await Promise.all([
    getPropertyReviews(propertyId, 20),
    getPropertyConversations(propertyId, 10),
  ]);

  const feedbackText = buildFeedbackText(reviews, conversations);
  if (feedbackText === 'No guest feedback available.') return null;

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(propertyName, feedbackText) }],
    });

    const text = msg.content.find((b) => b.type === 'text')?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]) as ClaudeResponse;
  } catch {
    return null;
  }
}

async function writeInsights(
  supabase: ReturnType<typeof createServiceClient>,
  propertyId: string,
  insights: ClaudeInsight[],
  bucket: 'owner_update' | 'house_action',
): Promise<void> {
  for (let i = 0; i < insights.length; i++) {
    const ins = insights[i];
    const agentKey = `guest_intelligence:${bucket}:${i}`;
    const payload: InsightPayload = {
      bucket,
      severityReason: ins.severityReason,
      sourceCount: ins.sourceCount,
      sourceExcerpts: ins.sourceExcerpts,
      suggestedFixes: ins.suggestedFixes,
      isCritical: ins.severity === 'critical',
    };

    const dbSeverity =
      ins.severity === 'critical' ? 'warning' :
      ins.severity === 'warning' ? 'warning' :
      ins.severity === 'recommendation' ? 'recommendation' :
      'info';

    await supabase.from('ai_insights').upsert(
      {
        parent_type: 'property',
        parent_id: propertyId,
        agent_key: agentKey,
        severity: dbSeverity,
        title: ins.title,
        body: ins.body,
        action_payload: payload,
        dismissed_at: null,
      },
      { onConflict: 'parent_type,parent_id,agent_key' },
    );
  }
}

export async function runGuestIntelligenceSync(): Promise<{ processed: number; skipped: number }> {
  const supabase = createServiceClient();
  const properties = await getProperties();

  let processed = 0;
  let skipped = 0;

  for (const prop of properties) {
    const propertyName = prop.public_name ?? prop.name;

    await supabase
      .from('ai_insights')
      .delete()
      .eq('parent_type', 'property')
      .eq('parent_id', prop.id)
      .like('agent_key', 'guest_intelligence:%');

    const result = await analyzeProperty(prop.id, propertyName);
    if (!result) {
      skipped++;
      continue;
    }

    await Promise.all([
      writeInsights(supabase, prop.id, result.ownerUpdates, 'owner_update'),
      writeInsights(supabase, prop.id, result.houseActionItems, 'house_action'),
    ]);

    processed++;
  }

  return { processed, skipped };
}
