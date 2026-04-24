// apps/web/src/lib/admin/dashboard-briefing.ts
import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import type { CommandStripData } from './dashboard-v2';

export type BriefingItem = {
  rank: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  domain: 'operations' | 'pipeline' | 'financial' | 'intelligence' | 'portfolio';
  headline: string;
  detail: string;
  action: string | null;
};

export type DailyBriefing = {
  items: BriefingItem[];
  generatedAt: string;
  date: string;
};

export async function fetchDailyBriefing(
  strip: CommandStripData,
  context: {
    coldLeadsCount: number;
    onboardingCount: number;
    criticalInsights: number;
    warningInsights: number;
    maintenanceOverdue: number;
    maintenanceDueSoon: number;
    projectsBlocked: number;
    winbackCount: number;
    invoicesOverdue: number;
    allocationStatus: 'healthy' | 'warning' | 'critical';
  },
): Promise<DailyBriefing> {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const fallback = buildFallbackBriefing(strip, context, today);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallback;

  try {
    const client = new Anthropic({ apiKey });

    const snapshot = `
Business snapshot for ${today}:
- Overdue tasks: ${strip.overdueTasks}
- Pipeline leads: ${strip.pipelineValue > 0 ? `$${strip.pipelineValue}/mo in pipeline` : 'empty pipeline'}
- Cold leads needing re-engagement: ${context.coldLeadsCount}
- Owners in onboarding: ${context.onboardingCount}
- AI critical insights: ${context.criticalInsights}
- AI warning insights: ${context.warningInsights}
- Stuck checklist items: ${strip.stuckItems}
- Recurring maintenance overdue: ${context.maintenanceOverdue}
- Recurring maintenance due within 7 days: ${context.maintenanceDueSoon}
- Projects blocked: ${context.projectsBlocked}
- Winback opportunities (paused/churned): ${context.winbackCount}
- Open invoices: ${strip.openInvoices.count} ($${Math.round(strip.openInvoices.totalCents / 100)} total)
- Invoices overdue: ${context.invoicesOverdue}
- Pending owner invitations: ${strip.pendingInvitations}
- Treasury allocation: ${context.allocationStatus}
`.trim();

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: `You are an AI business advisor for a short-term rental property management company.
Given a daily business snapshot, identify the 3-5 highest-priority action items the operator should focus on today.

Return ONLY valid JSON with this exact structure:
{
  "items": [
    {
      "rank": 1,
      "urgency": "critical|high|medium|low",
      "domain": "operations|pipeline|financial|intelligence|portfolio",
      "headline": "Short imperative (max 8 words)",
      "detail": "One sentence explaining why this matters today (max 20 words)",
      "action": "Specific next step (max 10 words) or null"
    }
  ]
}

Rules:
- Only include items with real data signals (non-zero counts)
- Rank by urgency and business impact
- Headlines are imperative and specific ("Re-engage 3 cold leads" not "Consider outreach")
- If everything is healthy, return 1-2 positive items noting what's going well
- Maximum 5 items`,

      messages: [{ role: 'user', content: snapshot }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = JSON.parse(text.trim()) as { items: BriefingItem[] };

    return {
      items: parsed.items.slice(0, 5),
      generatedAt: new Date().toISOString(),
      date: today,
    };
  } catch {
    return fallback;
  }
}

function buildFallbackBriefing(
  strip: CommandStripData,
  context: {
    coldLeadsCount: number;
    onboardingCount: number;
    criticalInsights: number;
    warningInsights: number;
    maintenanceOverdue: number;
    projectsBlocked: number;
    winbackCount: number;
  },
  today: string,
): DailyBriefing {
  const items: BriefingItem[] = [];
  let rank = 1;

  if (strip.overdueTasks > 0) {
    items.push({
      rank: rank++,
      urgency: 'critical',
      domain: 'operations',
      headline: `${strip.overdueTasks} task${strip.overdueTasks > 1 ? 's' : ''} overdue`,
      detail: 'Overdue items block property operations and owner trust.',
      action: 'Review tasks now',
    });
  }

  if (context.criticalInsights > 0) {
    items.push({
      rank: rank++,
      urgency: 'critical',
      domain: 'intelligence',
      headline: `${context.criticalInsights} critical AI alert${context.criticalInsights > 1 ? 's' : ''}`,
      detail: 'Guest feedback flagged a critical issue requiring immediate action.',
      action: 'Review AI risk digest',
    });
  }

  if (strip.stuckItems > 0) {
    items.push({
      rank: rank++,
      urgency: 'high',
      domain: 'portfolio',
      headline: `${strip.stuckItems} checklist item${strip.stuckItems > 1 ? 's' : ''} stuck`,
      detail: 'Stuck items delay property readiness and owner confidence.',
      action: 'Check property health',
    });
  }

  if (context.coldLeadsCount > 0) {
    items.push({
      rank: rank++,
      urgency: 'medium',
      domain: 'pipeline',
      headline: `Re-engage ${context.coldLeadsCount} cold lead${context.coldLeadsCount > 1 ? 's' : ''}`,
      detail: `${context.coldLeadsCount} prospect${context.coldLeadsCount > 1 ? 's have' : ' has'} gone dark. Recovery rate drops after 30 days.`,
      action: 'Open cold leads list',
    });
  }

  if (context.maintenanceOverdue > 0) {
    items.push({
      rank: rank++,
      urgency: 'high',
      domain: 'portfolio',
      headline: `${context.maintenanceOverdue} maintenance task${context.maintenanceOverdue > 1 ? 's' : ''} overdue`,
      detail: 'Recurring maintenance keeps properties guest-ready and prevents larger repairs.',
      action: 'Schedule now',
    });
  }

  if (items.length === 0) {
    items.push({
      rank: 1,
      urgency: 'low',
      domain: 'operations',
      headline: 'All systems looking healthy',
      detail: 'No critical alerts today. Good time to review pipeline and growth.',
      action: null,
    });
  }

  return { items: items.slice(0, 5), generatedAt: new Date().toISOString(), date: today };
}
