import type { Insight } from '@/lib/admin/ai-insights';
import type { StageDef, StatusCardData, StatusColumnData } from '@/components/admin/pipeline/pipeline-types';

// Minimal project row shape. Plan C will add more fields.
// We keep this loose so it compiles whether or not the projects table exists yet.
export type ProjectStatusRow = {
  id: string;
  name: string;
  status: string;      // 'not_started' | 'in_progress' | 'blocked' | 'done'
  type: string | null; // e.g. 'renovation', 'photography', etc.
  color: string | null;
  emoji: string | null;
  assigneeName: string | null;
  dueDate: string | null;
  createdAt: string;
};

type ColDef = { key: string; color: StageDef['color']; label: string };

const PROJECT_STAGE_COLUMNS: ColDef[] = [
  { key: 'not_started', color: 'blue',   label: 'Not Started' },
  { key: 'in_progress', color: 'violet', label: 'In Progress' },
  { key: 'blocked',     color: 'red',    label: 'Blocked' },
  { key: 'done',        color: 'green',  label: 'Done' },
];

const TYPE_GRADIENTS: Record<string, string> = {
  renovation:   'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
  photography:  'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
  marketing:    'linear-gradient(135deg, #10B981 0%, #047857 100%)',
  maintenance:  'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
};

function gradientForType(type: string | null): string {
  if (!type) return 'linear-gradient(135deg, #02AAEB 0%, #1B77BE 100%)';
  return TYPE_GRADIENTS[type] ?? 'linear-gradient(135deg, #02AAEB 0%, #1B77BE 100%)';
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function dueTone(iso: string | null): 'bad' | 'warn' | 'calm' | 'green' {
  if (!iso) return 'calm';
  const days = Math.floor((new Date(iso).getTime() - Date.now()) / 86400_000);
  if (days < 0) return 'bad';
  if (days <= 3) return 'warn';
  if (days <= 14) return 'calm';
  return 'green';
}

function formatDue(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function buildProjectStatusBoard(
  rows: ProjectStatusRow[],
  insightsByProject: Record<string, Insight[]>,
): StatusColumnData[] {
  return PROJECT_STAGE_COLUMNS.map((col) => {
    const inStage = rows.filter((r) => r.status === col.key);
    const stage: StageDef = {
      key: col.key,
      label: col.label,
      color: col.color,
      sublabel: `${inStage.length} project${inStage.length === 1 ? '' : 's'}`,
    };

    const cards: StatusCardData[] = inStage.map((r) => {
      const insight = insightsByProject[r.id]?.[0] ?? null;
      return {
        id: r.id,
        href: `/admin/projects/${r.id}`,
        coverUrl: null,
        coverGradient: gradientForType(r.type),
        coverEmoji: r.emoji ?? null,
        statusPill: { label: col.label, tone: col.key === 'done' ? 'live' : col.key === 'blocked' ? 'stuck' : 'onb' },
        stageBadge: null,
        name: r.name,
        subline: r.type ?? null,
        stats: [],
        assigneeAvatars: r.assigneeName
          ? [{ src: null, initials: initials(r.assigneeName), label: r.assigneeName }]
          : [],
        dueTag: r.dueDate
          ? { label: formatDue(r.dueDate), tone: dueTone(r.dueDate) }
          : null,
        insight,
      };
    });

    return { stage, cards };
  });
}
