import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const OPENROUTER_MODEL = "anthropic/claude-haiku-4-5";

const SYSTEM_PROMPT = `You are a property management CRM assistant analyzing a client relationship for Johan, a short-term rental property manager. You will receive context about a client — their contact history, meetings, and communications — and return a structured JSON analysis.

Return ONLY valid JSON matching this exact schema:
{
  "relationship_summary": {
    "title": "string (max 80 chars)",
    "body": "string (3-5 sentences synthesizing the relationship health, communication pattern, and trajectory)"
  },
  "risk_signals": [
    { "title": "string (max 60 chars)", "body": "string (1-2 sentences explaining the signal)", "severity": "info" | "recommendation" | "warning" }
  ],
  "sentiment": {
    "title": "string — one of: Happy, Neutral, Mildly Concerned, At Risk",
    "body": "string (2-3 sentences explaining the sentiment reading)"
  },
  "recommendations": [
    { "title": "string (max 60 chars)", "body": "string (1-2 sentences — specific, actionable)" }
  ],
  "conversation_themes": [
    { "title": "string (max 60 chars)", "body": "string (1 sentence describing the recurring theme)" }
  ]
}

risk_signals: 0-4 items. Only flag real signals. Flag: no recent contact (>14 days), overdue invoices, mentions of leaving/selling, lack of engagement.
recommendations: exactly 2-3 items. Specific to this client — not generic advice.
conversation_themes: 0-5 items. Topics that appear in 2+ interactions.

If data is sparse, return what you can confidently derive. Do not invent signals.`;

type IntelligenceResult = {
  relationship_summary: { title: string; body: string };
  risk_signals: Array<{ title: string; body: string; severity: "info" | "recommendation" | "warning" }>;
  sentiment: { title: string; body: string };
  recommendations: Array<{ title: string; body: string }>;
  conversation_themes: Array<{ title: string; body: string }>;
};

async function callClaude(userPrompt: string): Promise<IntelligenceResult | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("[client-intelligence] OPENROUTER_API_KEY not set");
    return null;
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    console.error("[client-intelligence] Claude call failed:", await res.text());
    return null;
  }

  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  const raw = data.choices[0]?.message?.content ?? "";
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned) as IntelligenceResult;
  } catch {
    console.error("[client-intelligence] JSON parse failed:", raw.slice(0, 200));
    return null;
  }
}

function buildPrompt(context: {
  contactName: string;
  lifecycleStage: string;
  daysSinceCreated: number;
  daysSinceLastActivity: number | null;
  estimatedMrr: number | null;
  source: string | null;
  meetings: Array<{ title: string; scheduledAt: string | null; notes: string | null; aiSummary: string | null }>;
  communications: Array<{ channel: string; direction: string; summary: string | null; createdAt: string }>;
}): string {
  const parts: string[] = [
    `Client: ${context.contactName}`,
    `Stage: ${context.lifecycleStage.replace(/_/g, " ")}`,
    `Days as contact: ${context.daysSinceCreated}`,
  ];
  if (context.daysSinceLastActivity != null) parts.push(`Days since last activity: ${context.daysSinceLastActivity}`);
  if (context.estimatedMrr != null) parts.push(`Estimated MRR: $${context.estimatedMrr}`);
  if (context.source) parts.push(`Source: ${context.source}`);

  if (context.meetings.length > 0) {
    parts.push("\nMeetings:");
    for (const m of context.meetings) {
      parts.push(`- ${m.title} (${m.scheduledAt ? new Date(m.scheduledAt).toLocaleDateString() : "no date"})`);
      if (m.aiSummary) parts.push(`  Summary: ${m.aiSummary}`);
      if (m.notes) parts.push(`  Notes: ${m.notes.slice(0, 200)}`);
    }
  } else {
    parts.push("\nMeetings: none");
  }

  if (context.communications.length > 0) {
    parts.push("\nCommunication events:");
    for (const c of context.communications.slice(0, 20)) {
      parts.push(`- [${c.channel}/${c.direction}] ${new Date(c.createdAt).toLocaleDateString()}: ${c.summary ?? "(no summary)"}`);
    }
  } else {
    parts.push("\nCommunication events: none");
  }

  return parts.join("\n");
}

export async function generateClientIntelligence(contactId: string): Promise<void> {
  const supabase = await createClient();
  const serviceClient = createServiceClient();

  const { data: contact } = await supabase
    .from("contacts")
    .select("id, full_name, lifecycle_stage, estimated_mrr, source, last_activity_at, created_at, profile_id")
    .eq("id", contactId)
    .maybeSingle();

  if (!contact) {
    console.error("[client-intelligence] contact not found:", contactId);
    return;
  }

  const profileId = contact.profile_id as string | null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyClient = supabase as any;

  const [{ data: meetings }, { data: communications }] = await Promise.all([
    profileId
      ? // owner_meetings is not in the generated Supabase types — cast through any
        anyClient
          .from("owner_meetings")
          .select("title, scheduled_at, notes, ai_summary")
          .eq("owner_id", profileId)
          .order("scheduled_at", { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [] }),
    // communication_events is not in the generated Supabase types — cast through any
    anyClient
      .from("communication_events")
      .select("channel, direction, claude_summary, quo_summary, created_at")
      .eq("entity_id", contactId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const now = new Date();
  const daysSinceCreated = Math.floor((now.getTime() - new Date(contact.created_at).getTime()) / 86400000);
  const daysSinceLastActivity = contact.last_activity_at
    ? Math.floor((now.getTime() - new Date(contact.last_activity_at).getTime()) / 86400000)
    : null;

  const prompt = buildPrompt({
    contactName: contact.full_name,
    lifecycleStage: contact.lifecycle_stage,
    daysSinceCreated,
    daysSinceLastActivity,
    estimatedMrr: contact.estimated_mrr == null ? null : Number(contact.estimated_mrr),
    source: contact.source,
    meetings: ((meetings ?? []) as Array<{ title: string; scheduled_at: string | null; notes: string | null; ai_summary: string | null }>).map((m) => ({
      title: m.title,
      scheduledAt: m.scheduled_at,
      notes: m.notes,
      aiSummary: m.ai_summary,
    })),
    communications: ((communications ?? []) as Array<{ channel: string; direction: string; claude_summary: string | null; quo_summary: string | null; created_at: string }>).map((c) => ({
      channel: c.channel,
      direction: c.direction,
      summary: c.claude_summary ?? c.quo_summary,
      createdAt: c.created_at,
    })),
  });

  const result = await callClaude(prompt);
  if (!result) return;

  const now8601 = now.toISOString();

  type InsightRow = {
    parent_type: string;
    parent_id: string;
    agent_key: string;
    severity: "info" | "recommendation" | "warning" | "success";
    title: string;
    body: string;
    action_label: null;
    action_payload: null;
    created_at: string;
  };

  const rows: InsightRow[] = [];

  rows.push({
    parent_type: "contact",
    parent_id: contactId,
    agent_key: "client_intelligence:relationship_summary",
    severity: "info",
    title: result.relationship_summary.title,
    body: result.relationship_summary.body,
    action_label: null,
    action_payload: null,
    created_at: now8601,
  });

  rows.push({
    parent_type: "contact",
    parent_id: contactId,
    agent_key: "client_intelligence:sentiment",
    severity: "info",
    title: result.sentiment.title,
    body: result.sentiment.body,
    action_label: null,
    action_payload: null,
    created_at: now8601,
  });

  for (const signal of result.risk_signals) {
    rows.push({
      parent_type: "contact",
      parent_id: contactId,
      agent_key: "client_intelligence:risk_signals",
      severity: signal.severity === "warning" ? "warning" : signal.severity === "recommendation" ? "recommendation" : "info",
      title: signal.title,
      body: signal.body,
      action_label: null,
      action_payload: null,
      created_at: now8601,
    });
  }

  for (const rec of result.recommendations) {
    rows.push({
      parent_type: "contact",
      parent_id: contactId,
      agent_key: "client_intelligence:recommendations",
      severity: "recommendation",
      title: rec.title,
      body: rec.body,
      action_label: null,
      action_payload: null,
      created_at: now8601,
    });
  }

  for (const theme of result.conversation_themes) {
    rows.push({
      parent_type: "contact",
      parent_id: contactId,
      agent_key: "client_intelligence:conversation_themes",
      severity: "info",
      title: theme.title,
      body: theme.body,
      action_label: null,
      action_payload: null,
      created_at: now8601,
    });
  }

  if (rows.length === 0) return;

  // Delete old client intelligence insights before inserting fresh ones.
  // We cannot upsert here because risk_signals/recommendations/themes can have
  // multiple rows per agent_key, which would conflict on the unique constraint.
  const { error: deleteError } = await serviceClient
    .from("ai_insights")
    .delete()
    .eq("parent_type", "contact")
    .eq("parent_id", contactId)
    .like("agent_key", "client_intelligence:%");

  if (deleteError) {
    console.error("[client-intelligence] delete error:", deleteError.message);
    return;
  }

  const { error } = await serviceClient.from("ai_insights").insert(rows);
  if (error) {
    console.error("[client-intelligence] insert error:", error.message);
  }
}
