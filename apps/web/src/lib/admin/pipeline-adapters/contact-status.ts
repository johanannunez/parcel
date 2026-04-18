import type { ContactRow, LifecycleStage } from '@/lib/admin/contact-types';
import type { Insight } from '@/lib/admin/ai-insights';
import type { StageDef, StatusCardData, StatusColumnData } from '@/components/admin/pipeline/pipeline-types';
import { stageLabel } from '@/lib/admin/lifecycle-stage';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function relativeDays(iso: string | null): string | null {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400_000);
  if (days < 1) return 'today';
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
}

type ColDef = { key: LifecycleStage; color: StageDef['color']; label: string };

const STAGE_COLUMNS_LEAD_PIPELINE: ColDef[] = [
  { key: 'lead_new', color: 'blue', label: 'Inquiry' },
  { key: 'qualified', color: 'blue', label: 'Qualified' },
  { key: 'in_discussion', color: 'violet', label: 'In Talks' },
  { key: 'contract_sent', color: 'violet', label: 'Contract Sent' },
  { key: 'lead_cold', color: 'gray', label: 'Cold' },
];

const STAGE_COLUMNS_ONBOARDING: ColDef[] = [
  { key: 'onboarding', color: 'blue', label: 'Onboarding' },
];

// Onboarding milestone board buckets contacts by how long they've been in
// the onboarding stage. These are time-based phases, not semantic milestones.
// When we have explicit step-tracking, swap this for real progress data.
type OnboardingPhase = {
  key: string;
  label: string;
  color: StageDef['color'];
  minDays: number;
  maxDays: number | null;
};

const ONBOARDING_PHASES: OnboardingPhase[] = [
  { key: 'onb_start',   label: 'Just Started', color: 'blue',   minDays: 0,   maxDays: 7 },
  { key: 'onb_active',  label: 'Active',       color: 'blue',   minDays: 7,   maxDays: 30 },
  { key: 'onb_stalled', label: 'Stalled',      color: 'amber',  minDays: 30,  maxDays: 60 },
  { key: 'onb_long',    label: 'Long Stall',   color: 'red',    minDays: 60,  maxDays: null },
];

const STAGE_COLUMNS_ACTIVE: ColDef[] = [
  { key: 'active_owner', color: 'green', label: 'Active Owner' },
];

const STAGE_COLUMNS_ARCHIVED: ColDef[] = [
  { key: 'lead_cold', color: 'gray', label: 'Cold Lead' },
  { key: 'paused',    color: 'gray', label: 'Paused' },
  { key: 'churned',   color: 'gray', label: 'Churned' },
];

function columnsForView(viewKey: string): ColDef[] {
  if (viewKey === 'lead-pipeline') return STAGE_COLUMNS_LEAD_PIPELINE;
  if (viewKey === 'onboarding') return STAGE_COLUMNS_ONBOARDING;
  if (viewKey === 'active-owners') return STAGE_COLUMNS_ACTIVE;
  if (viewKey === 'archived') return STAGE_COLUMNS_ARCHIVED;
  // Default: lead pipeline (was the default start view in DB)
  return STAGE_COLUMNS_LEAD_PIPELINE;
}

export function buildContactStatusBoard(
  rows: ContactRow[],
  insightsByContact: Record<string, Insight[]>,
  viewKey: string,
): StatusColumnData[] {
  if (viewKey === 'onboarding') {
    return buildOnboardingMilestoneBoard(rows, insightsByContact);
  }
  const columns = columnsForView(viewKey);

  return columns.map((col) => {
    const inStage = rows.filter((r) => r.lifecycleStage === col.key);
    const totalProps = inStage.reduce((sum, r) => sum + r.propertyCount, 0);
    const stage: StageDef = {
      key: col.key,
      label: col.label,
      color: col.color,
      totalLabel: totalProps > 0 ? `${totalProps} properties` : undefined,
      sublabel: undefined,
    };
    // Within the Lead Pipeline, Cold starts collapsed so the pipeline stays tight.
    // User preference overrides this via the Columns menu (persisted to localStorage).
    const defaultCollapsed =
      col.key === 'lead_cold' && viewKey === 'lead-pipeline';

    const cards: StatusCardData[] = inStage.map((r) => {
      const insight = insightsByContact[r.id]?.[0] ?? null;
      return {
        id: r.id,
        href: r.profileId ? `/admin/owners/${r.profileId}` : `/admin/contacts/${r.id}`,
        cardVariant: 'person',
        coverUrl: null,
        coverGradient: null,
        coverEmoji: null,
        statusPill: null,
        stageBadge: relativeDays(r.stageChangedAt),
        name: r.fullName,
        subline: r.companyName ?? r.email ?? null,
        stats: [
          {
            label: 'Props',
            value: String(r.propertyCount),
          },
          {
            label: 'Source',
            value: r.source ?? '—',
          },
          {
            label: 'Last',
            value: relativeDays(r.lastActivityAt) ?? '—',
          },
        ],
        assigneeAvatars: r.assignedToName
          ? [{ src: null, initials: initials(r.assignedToName), label: r.assignedToName }]
          : [],
        dueTag: null,
        insight,
      };
    });

    return { stage, cards, collapsed: defaultCollapsed };
  });
}

function daysSince(iso: string | null): number {
  if (!iso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400_000));
}

function phaseForDays(days: number): OnboardingPhase {
  for (const p of ONBOARDING_PHASES) {
    if (days >= p.minDays && (p.maxDays === null || days < p.maxDays)) return p;
  }
  return ONBOARDING_PHASES[ONBOARDING_PHASES.length - 1];
}

function buildOnboardingMilestoneBoard(
  rows: ContactRow[],
  insightsByContact: Record<string, Insight[]>,
): StatusColumnData[] {
  // Only rows actually in the onboarding stage belong here. Guard in case
  // the saved view ever widens the filter.
  const onboardingRows = rows.filter((r) => r.lifecycleStage === 'onboarding');

  return ONBOARDING_PHASES.map((phase) => {
    const inPhase = onboardingRows.filter((r) => {
      const days = daysSince(r.stageChangedAt);
      return phase === phaseForDays(days);
    });

    const stage: StageDef = {
      key: phase.key,
      label: phase.label,
      color: phase.color,
      sublabel:
        phase.maxDays === null
          ? `${phase.minDays}+ days`
          : `${phase.minDays}-${phase.maxDays} days`,
    };

    const cards: StatusCardData[] = inPhase.map((r) => {
      const insight = insightsByContact[r.id]?.[0] ?? null;
      const days = daysSince(r.stageChangedAt);
      return {
        id: r.id,
        href: r.profileId ? `/admin/owners/${r.profileId}` : `/admin/contacts/${r.id}`,
        cardVariant: 'person',
        coverUrl: null,
        coverGradient: null,
        coverEmoji: null,
        statusPill: null,
        stageBadge: `${days}d`,
        name: r.fullName,
        subline: r.companyName ?? r.email ?? null,
        stats: [
          {
            label: 'Props',
            value: String(r.propertyCount),
            fillPct: Math.min(100, r.propertyCount * 25),
          },
          {
            label: 'Last',
            value: relativeDays(r.lastActivityAt) ?? '—',
          },
        ],
        assigneeAvatars: r.assignedToName
          ? [{ src: null, initials: initials(r.assignedToName), label: r.assignedToName }]
          : [],
        dueTag: null,
        insight,
      };
    });

    return { stage, cards };
  });
}
