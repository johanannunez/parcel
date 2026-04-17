import type { Insight } from '@/lib/admin/ai-insights';
import type { StageDef, StatusCardData, StatusColumnData } from '@/components/admin/pipeline/pipeline-types';

// Property status as it exists in the DB (setup_status + active flag).
// We map to a 5-column Kanban that mirrors the intended lifecycle.
export type PropertyStatusRow = {
  id: string;
  nickname: string | null;
  street: string;
  unit: string | null;
  city: string;
  state: string;
  coverPhotoUrl: string | null;
  setupStatus: string | null;   // 'in_progress' | 'published' | null
  active: boolean;
  estimatedMrr: number | null;
  ownerNames: string[];
  bedrooms: number | null;
  bathrooms: number | null;
  createdAt: string;
};

type ColDef = { key: string; color: StageDef['color']; label: string };

export const PROPERTY_STAGE_COLUMNS: ColDef[] = [
  { key: 'onboarding',     color: 'blue',   label: 'Onboarding' },
  { key: 'listing_review', color: 'violet', label: 'Listing Review' },
  { key: 'launch_ready',   color: 'violet', label: 'Launch Ready' },
  { key: 'live',           color: 'green',  label: 'Live' },
  { key: 'paused',         color: 'gray',   label: 'Paused' },
];

/** Derive a kanban stage key from the raw DB flags. */
function deriveStage(row: PropertyStatusRow): string {
  if (!row.active) return 'paused';
  if (row.setupStatus === 'published') return 'live';
  if (row.setupStatus === 'in_progress') return 'onboarding';
  return 'onboarding';
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function relativeDays(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400_000);
  if (days < 1) return 'today';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function buildPropertyStatusBoard(
  rows: PropertyStatusRow[],
  insightsByProperty: Record<string, Insight[]>,
): StatusColumnData[] {
  return PROPERTY_STAGE_COLUMNS.map((col) => {
    const inStage = rows.filter((r) => deriveStage(r) === col.key);
    const totalMrr = inStage.reduce((s, r) => s + (r.estimatedMrr ?? 0), 0);
    const stage: StageDef = {
      key: col.key,
      label: col.label,
      color: col.color,
      totalLabel: totalMrr > 0 ? `$${totalMrr.toLocaleString()} /mo` : undefined,
      sublabel: `${inStage.length} propert${inStage.length === 1 ? 'y' : 'ies'}`,
    };

    const cards: StatusCardData[] = inStage.map((r) => {
      const insight = insightsByProperty[r.id]?.[0] ?? null;
      const address = [r.street, r.unit].filter(Boolean).join(' ');
      const location = `${r.city}, ${r.state}`;
      const stageKey = deriveStage(r);
      const pillTone =
        stageKey === 'live' ? 'live' :
        stageKey === 'onboarding' ? 'onb' :
        stageKey === 'listing_review' ? 'review' :
        stageKey === 'launch_ready' ? 'review' :
        'paused';

      return {
        id: r.id,
        href: `/admin/properties/${r.id}`,
        coverUrl: r.coverPhotoUrl,
        coverGradient: 'linear-gradient(135deg, #0F3B6B 0%, #02AAEB 100%)',
        coverEmoji: null,
        statusPill: { label: col.label, tone: pillTone },
        stageBadge: relativeDays(r.createdAt),
        name: r.nickname ?? address,
        subline: location,
        stats: [
          {
            label: 'Beds',
            value: r.bedrooms != null ? String(r.bedrooms) : '—',
          },
          {
            label: 'Baths',
            value: r.bathrooms != null ? String(r.bathrooms) : '—',
          },
          {
            label: 'MRR',
            value: r.estimatedMrr != null ? `$${r.estimatedMrr}` : '—',
            fillPct: r.estimatedMrr != null ? Math.min(100, r.estimatedMrr / 50) : 0,
            tone: 'ok',
          },
        ],
        assigneeAvatars: r.ownerNames.slice(0, 3).map((name) => ({
          src: null,
          initials: initials(name),
          label: name,
        })),
        dueTag: null,
        insight,
      };
    });

    return { stage, cards };
  });
}
