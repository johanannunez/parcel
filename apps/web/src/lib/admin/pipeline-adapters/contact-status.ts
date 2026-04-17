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
  { key: 'lead_new', color: 'blue', label: 'New' },
  { key: 'qualified', color: 'blue', label: 'Qualified' },
  { key: 'in_discussion', color: 'violet', label: 'In discussion' },
  { key: 'contract_sent', color: 'violet', label: 'Contract sent' },
];

const STAGE_COLUMNS_ACTIVE: ColDef[] = [
  { key: 'onboarding', color: 'blue', label: 'Onboarding' },
  { key: 'active_owner', color: 'green', label: 'Active' },
];

const STAGE_COLUMNS_CHURNED: ColDef[] = [
  { key: 'paused', color: 'gray', label: 'Paused' },
  { key: 'churned', color: 'gray', label: 'Churned' },
];

function columnsForView(viewKey: string): ColDef[] {
  if (viewKey === 'lead-pipeline') return STAGE_COLUMNS_LEAD_PIPELINE;
  if (viewKey === 'active-owners') return STAGE_COLUMNS_ACTIVE;
  if (viewKey === 'churned') return STAGE_COLUMNS_CHURNED;
  // Default: all stages
  return [
    ...STAGE_COLUMNS_LEAD_PIPELINE,
    ...STAGE_COLUMNS_ACTIVE,
    ...STAGE_COLUMNS_CHURNED,
  ];
}

export function buildContactStatusBoard(
  rows: ContactRow[],
  insightsByContact: Record<string, Insight[]>,
  viewKey: string,
): StatusColumnData[] {
  const columns = columnsForView(viewKey);

  return columns.map((col) => {
    const inStage = rows.filter((r) => r.lifecycleStage === col.key);
    const totalMrr = inStage.reduce((sum, r) => sum + (r.estimatedMrr ?? 0), 0);
    const stage: StageDef = {
      key: col.key,
      label: col.label,
      color: col.color,
      totalLabel: totalMrr > 0 ? `$${totalMrr.toLocaleString()} /mo` : undefined,
      sublabel: `${inStage.length} contact${inStage.length === 1 ? '' : 's'}`,
    };

    const cards: StatusCardData[] = inStage.map((r) => {
      const insight = insightsByContact[r.id]?.[0] ?? null;
      return {
        id: r.id,
        href: r.profileId ? `/admin/owners/${r.profileId}` : `/admin/contacts/${r.id}`,
        coverUrl: null,
        coverGradient: 'linear-gradient(135deg, #02AAEB 0%, #1B77BE 100%)',
        coverEmoji: null,
        statusPill: { label: stageLabel(r.lifecycleStage), tone: 'onb' },
        stageBadge: relativeDays(r.stageChangedAt),
        name: r.fullName,
        subline: r.companyName ?? r.email ?? null,
        stats: [
          {
            label: 'Props',
            value: String(r.propertyCount),
            fillPct: Math.min(100, r.propertyCount * 20),
          },
          {
            label: 'Last',
            value: relativeDays(r.lastActivityAt) ?? '—',
          },
          {
            label: 'MRR',
            value: r.estimatedMrr != null ? `$${r.estimatedMrr}` : '—',
            fillPct: r.estimatedMrr != null ? Math.min(100, r.estimatedMrr / 20) : 0,
            tone: 'ok',
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
