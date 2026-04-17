# Plan D — Status (Kanban) View, Monday Surfaces, and AI Insight Cards

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the pipeline Status view (Kanban with vivid stage columns, top metrics bar, card B++ with photo + stats + AI insights) across all three pipeline pages (Contacts, Properties, Projects). This is the plan that makes the system LOOK like the locked-in design. Ship criterion: switch any pipeline page to "Status" view and see a Kanban board with the correct stages, populated cards (real photos + avatars + stats), at least one AI insight rendered on a card, and a top metrics tile row above the columns.

**Depends on:** Plan A (contacts), Plan B (tasks for stat counts), Plan C (projects). AI insights runtime (agents) is NOT in scope — this plan only ships the surface and seed rows.

**Architecture:** A set of generic, entity-agnostic components: `StatusBoard`, `StatusColumn`, `StatusCard`, `MetricsBar`, `AiInsightCard`. Each entity provides an adapter that maps its row shape and saved-view filter to the generic props. One new table `ai_insights` (polymorphic) plus a reader helper.

---

## File plan

**New files:**

- `apps/web/supabase/migrations/20260420_ai_insights.sql`
- `apps/web/src/lib/admin/ai-insights.ts` — reader `fetchInsightsByParent(parentType, parentIds)`
- `apps/web/src/components/admin/pipeline/StatusBoard.tsx` — entity-agnostic Kanban shell
- `apps/web/src/components/admin/pipeline/StatusBoard.module.css`
- `apps/web/src/components/admin/pipeline/StatusColumn.tsx`
- `apps/web/src/components/admin/pipeline/StatusColumn.module.css`
- `apps/web/src/components/admin/pipeline/StatusCard.tsx` — "Card B++" composer
- `apps/web/src/components/admin/pipeline/StatusCard.module.css`
- `apps/web/src/components/admin/pipeline/MetricsBar.tsx`
- `apps/web/src/components/admin/pipeline/MetricsBar.module.css`
- `apps/web/src/components/admin/pipeline/AiInsightCard.tsx`
- `apps/web/src/components/admin/pipeline/AiInsightCard.module.css`
- `apps/web/src/components/admin/pipeline/pipeline-types.ts` — generic props types
- `apps/web/src/lib/admin/pipeline-adapters/contact-status.ts` — adapter
- `apps/web/src/lib/admin/pipeline-adapters/property-status.ts`
- `apps/web/src/lib/admin/pipeline-adapters/project-status.ts`
- `apps/web/src/app/(admin)/admin/contacts/StatusView.tsx`
- `apps/web/src/app/(admin)/admin/properties/StatusView.tsx`
- `apps/web/src/app/(admin)/admin/projects/StatusView.tsx`

**Modified files:**

- `apps/web/src/app/(admin)/admin/contacts/page.tsx` — check `?view=<key>`; if the view's `view_mode='status'`, render `<StatusView ... />` instead of list
- `apps/web/src/app/(admin)/admin/properties/page.tsx` — same pattern, but integrate with the existing view switcher (Status/Gallery/Table)
- `apps/web/src/app/(admin)/admin/projects/page.tsx` — same
- `apps/web/src/lib/admin/contacts-list.ts` — add a groupedByStage option for status view
- `apps/web/src/lib/admin/projects-list.ts` — add groupedByStatus option

**Notes:**

- Card B++ uses pure-CSS stage column gradients. Stage colors come from a pure helper `pipelineStageColor(stage)` that handles all three entities.
- Cover images: property uses real `cover_photo_url`; contact uses a gradient block with the contact's initials; project uses the emoji on its type color.
- AI insights display is purely server-driven: on the server, fetch all insights for the parent IDs on page, pass into the card component; if `insights.length === 0` the card simply does not render an insight tile.

---

## Task 1: Migration — ai_insights table

**Files:**
- Create: `apps/web/supabase/migrations/20260420_ai_insights.sql`

```sql
create table if not exists public.ai_insights (
  id             uuid primary key default gen_random_uuid(),
  parent_type    text not null check (parent_type in ('contact','property','project')),
  parent_id      uuid not null,
  agent_key      text not null,
  severity       text not null default 'info'
                 check (severity in ('info','recommendation','warning','success')),
  title          text not null,
  body           text not null,
  action_label   text,
  action_payload jsonb,
  dismissed_at   timestamptz,
  expires_at     timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists ai_insights_parent_active_idx
  on ai_insights (parent_type, parent_id)
  where dismissed_at is null and (expires_at is null or expires_at > now());

alter table ai_insights enable row level security;

drop policy if exists ai_insights_admin_rw on ai_insights;
create policy ai_insights_admin_rw on ai_insights
  for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Seed a handful of rows so the surface renders with data from day one.
-- Seeded rows are mock agent outputs; the real agent runtime is a future spec.
insert into ai_insights (parent_type, parent_id, agent_key, severity, title, body, action_label)
select 'property', p.id, 'setup_agent', 'recommendation',
       'Setup Agent',
       'Listing photos pending for over 4 days. Want a nudge email drafted for the owner?',
       'Draft nudge'
  from properties p
 where p.status = 'onboarding'
 limit 1
on conflict do nothing;

insert into ai_insights (parent_type, parent_id, agent_key, severity, title, body)
select 'contact', c.id, 'winback_agent', 'recommendation',
       'Win-back Agent',
       '41% of paused owners reactivate within 6 months. Consider a check-in in 30 days.'
  from contacts c
 where c.lifecycle_stage in ('paused','churned')
 limit 1
on conflict do nothing;
```

Apply, verify counts, commit.

```bash
git add apps/web/supabase/migrations/20260420_ai_insights.sql
git commit -m "feat(db): ai_insights table + seed mock agent rows"
```

---

## Task 2: Insight reader

**Files:**
- Create: `apps/web/src/lib/admin/ai-insights.ts`

```ts
import { createClient } from '@/lib/supabase/server';

export type InsightSeverity = 'info' | 'recommendation' | 'warning' | 'success';

export type Insight = {
  id: string;
  parentType: 'contact' | 'property' | 'project';
  parentId: string;
  agentKey: string;
  severity: InsightSeverity;
  title: string;
  body: string;
  actionLabel: string | null;
  createdAt: string;
};

export async function fetchInsightsByParent(
  parentType: Insight['parentType'],
  parentIds: string[],
): Promise<Record<string, Insight[]>> {
  if (parentIds.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ai_insights')
    .select('id, parent_type, parent_id, agent_key, severity, title, body, action_label, created_at')
    .eq('parent_type', parentType)
    .in('parent_id', parentIds)
    .is('dismissed_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const map: Record<string, Insight[]> = {};
  for (const r of data ?? []) {
    if (!map[r.parent_id]) map[r.parent_id] = [];
    map[r.parent_id].push({
      id: r.id,
      parentType: r.parent_type,
      parentId: r.parent_id,
      agentKey: r.agent_key,
      severity: r.severity,
      title: r.title,
      body: r.body,
      actionLabel: r.action_label,
      createdAt: r.created_at,
    });
  }
  return map;
}
```

Commit.

---

## Task 3: Generic pipeline types

**Files:**
- Create: `apps/web/src/components/admin/pipeline/pipeline-types.ts`

```ts
import type { ReactNode } from 'react';
import type { Insight } from '@/lib/admin/ai-insights';

export type StageColor =
  | 'blue' | 'violet' | 'green' | 'amber' | 'red' | 'gray';

export type StageDef = {
  key: string;             // stable key (e.g., 'onboarding')
  label: string;           // display ("Onboarding")
  color: StageColor;       // header gradient
  sublabel?: string;       // e.g., "avg 8d in stage"
  totalLabel?: string;     // e.g., "$5,200 /mo"
};

export type StatusCardData = {
  id: string;
  href: string;
  coverUrl: string | null;      // real photo (properties)
  coverGradient: string | null; // fallback gradient (contacts/projects)
  coverEmoji: string | null;    // optional emoji on gradient covers
  statusPill: { label: string; tone: 'live' | 'onb' | 'review' | 'stuck' | 'paused' | 'info' } | null;
  stageBadge: string | null;    // e.g., "Day 5" in top-right
  name: string;
  subline: string | null;       // company or address
  stats: Array<{ label: string; value: string; fillPct?: number; tone?: 'ok' | 'warn' | 'bad' }>;
  assigneeAvatars: Array<{ src: string | null; initials: string; label?: string }>;
  dueTag: { label: string; tone: 'bad' | 'warn' | 'calm' | 'green' } | null;
  insight: Insight | null;
};

export type StatusColumnData = {
  stage: StageDef;
  cards: StatusCardData[];
};

export type StatusBoardProps = {
  columns: StatusColumnData[];
  emptyMessage?: ReactNode;
};
```

Commit.

---

## Task 4: Generic Kanban components

**Files:**
- Create: `StatusBoard.tsx`, `StatusColumn.tsx`, `StatusCard.tsx` (+ module.css each)

`StatusBoard.tsx`:

```tsx
'use client';
import type { StatusBoardProps } from './pipeline-types';
import { StatusColumn } from './StatusColumn';
import styles from './StatusBoard.module.css';

export function StatusBoard({ columns, emptyMessage }: StatusBoardProps) {
  if (columns.length === 0) {
    return <div className={styles.empty}>{emptyMessage ?? 'No data.'}</div>;
  }
  return (
    <div className={styles.board}>
      {columns.map((col) => (
        <StatusColumn key={col.stage.key} data={col} />
      ))}
    </div>
  );
}
```

```css
.board {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(260px, 1fr);
  gap: 14px;
  overflow-x: auto;
  padding-bottom: 6px;
}
.empty { padding: 40px 24px; text-align: center; color: #6b7280; }

@media (max-width: 1100px) {
  .board { grid-auto-columns: minmax(260px, 88%); }
}
```

`StatusColumn.tsx`:

```tsx
import { StatusCard } from './StatusCard';
import type { StatusColumnData } from './pipeline-types';
import styles from './StatusColumn.module.css';

const GRADIENTS = {
  blue:   'linear-gradient(135deg, #02AAEB 0%, #1B77BE 100%)',
  violet: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
  green:  'linear-gradient(135deg, #10B981 0%, #047857 100%)',
  amber:  'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
  red:    'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
  gray:   'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
} as const;

export function StatusColumn({ data }: { data: StatusColumnData }) {
  return (
    <div className={styles.col}>
      <header
        className={styles.head}
        style={{ background: GRADIENTS[data.stage.color] }}
      >
        <div className={styles.topRow}>
          <span className={styles.name}>{data.stage.label.toUpperCase()}</span>
          <span className={styles.count}>{data.cards.length}</span>
        </div>
        {data.stage.totalLabel ? (
          <div className={styles.total}>{data.stage.totalLabel}</div>
        ) : null}
        {data.stage.sublabel ? (
          <div className={styles.sub}>{data.stage.sublabel.toUpperCase()}</div>
        ) : null}
      </header>
      <div className={styles.cards}>
        {data.cards.map((c) => (
          <StatusCard key={c.id} card={c} />
        ))}
      </div>
    </div>
  );
}
```

```css
.col { display: flex; flex-direction: column; gap: 10px; min-width: 0; }

.head {
  border-radius: 10px;
  padding: 12px 14px;
  color: #fff;
  box-shadow: 0 4px 12px -6px rgba(0,0,0,0.2);
}
.topRow {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 6px;
}
.name { font-size: 12px; font-weight: 700; letter-spacing: 0.6px; }
.count { background: rgba(255,255,255,0.22); padding: 1px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; }
.total { font-size: 16px; font-weight: 700; line-height: 1; }
.sub { font-size: 9.5px; opacity: 0.85; margin-top: 3px; letter-spacing: 0.3px; }

.cards { display: flex; flex-direction: column; gap: 10px; }
```

`StatusCard.tsx` (Card B++):

```tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { StatusCardData } from './pipeline-types';
import { AiInsightCard } from './AiInsightCard';
import styles from './StatusCard.module.css';

const PILL_CLASS = {
  live: styles.pillLive,
  onb: styles.pillOnb,
  review: styles.pillReview,
  stuck: styles.pillStuck,
  paused: styles.pillPaused,
  info: styles.pillInfo,
} as const;

const DUE_CLASS = {
  bad: styles.dueBad,
  warn: styles.dueWarn,
  calm: styles.dueCalm,
  green: styles.dueGreen,
} as const;

const STAT_BAR_TONE = {
  ok: styles.barOk,
  warn: styles.barWarn,
  bad: styles.barBad,
} as const;

export function StatusCard({ card }: { card: StatusCardData }) {
  return (
    <Link href={card.href} className={styles.card}>
      <div
        className={styles.photo}
        style={
          card.coverUrl
            ? { backgroundImage: `url(${card.coverUrl})` }
            : { background: card.coverGradient ?? '#1a3548' }
        }
      >
        <div className={styles.photoOverlay} aria-hidden />
        {card.coverEmoji ? (
          <span className={styles.coverEmoji} aria-hidden>{card.coverEmoji}</span>
        ) : null}
        {card.statusPill ? (
          <span className={`${styles.statusPill} ${PILL_CLASS[card.statusPill.tone]}`}>
            {card.statusPill.label}
          </span>
        ) : null}
        {card.stageBadge ? (
          <span className={styles.stageBadge}>{card.stageBadge}</span>
        ) : null}
      </div>
      <div className={styles.body}>
        <div className={styles.name}>{card.name}</div>
        {card.subline ? <div className={styles.sub}>{card.subline}</div> : null}
        {card.stats.length > 0 ? (
          <div className={styles.stats}>
            {card.stats.map((s, i) => (
              <div key={i} className={styles.stat}>
                <div className={styles.statLabel}>{s.label}</div>
                <div className={styles.statValue}>{s.value}</div>
                {typeof s.fillPct === 'number' ? (
                  <div className={styles.bar}>
                    <div
                      className={`${styles.barFill} ${STAT_BAR_TONE[s.tone ?? 'ok']}`}
                      style={{ width: `${Math.max(0, Math.min(100, s.fillPct))}%` }}
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
        {card.insight ? <AiInsightCard insight={card.insight} /> : null}
        <footer className={styles.foot}>
          <div className={styles.avStack}>
            {card.assigneeAvatars.slice(0, 3).map((a, i) =>
              a.src ? (
                <Image
                  key={i}
                  src={a.src}
                  alt={a.label ?? ''}
                  width={24}
                  height={24}
                  className={styles.avatar}
                />
              ) : (
                <span key={i} className={styles.avatarFallback} aria-label={a.label}>
                  {a.initials}
                </span>
              ),
            )}
            {card.assigneeAvatars.length > 3 ? (
              <span className={styles.avatarMore}>+{card.assigneeAvatars.length - 3}</span>
            ) : null}
          </div>
          {card.dueTag ? (
            <span className={`${styles.due} ${DUE_CLASS[card.dueTag.tone]}`}>
              {card.dueTag.label}
            </span>
          ) : null}
        </footer>
      </div>
    </Link>
  );
}
```

`StatusCard.module.css`:

```css
.card {
  display: block;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(15,23,42,0.06);
  text-decoration: none;
  transition: transform 120ms ease, box-shadow 120ms ease;
}
.card:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px -6px rgba(15,23,42,0.12);
}

.photo {
  position: relative;
  height: 88px;
  background-size: cover; background-position: center;
}
.photoOverlay {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%);
}
.coverEmoji {
  position: absolute; left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  font-size: 32px;
}

.statusPill {
  position: absolute; top: 7px; left: 7px;
  padding: 3px 7px; border-radius: 5px;
  font-size: 10px; font-weight: 700; letter-spacing: 0.4px;
  text-transform: uppercase; color: #fff;
}
.pillLive { background: #10B981; }
.pillOnb { background: #02AAEB; }
.pillReview { background: #8B5CF6; }
.pillStuck { background: #EF4444; }
.pillPaused { background: #6b7280; }
.pillInfo { background: #0F3B6B; }

.stageBadge {
  position: absolute; top: 7px; right: 7px;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
  color: #fff; font-size: 10px; padding: 3px 7px; border-radius: 5px;
}

.body { padding: 11px 12px 10px; }

.name { color: #0F3B6B; font-size: 13.5px; font-weight: 700; line-height: 1.3; }
.sub { color: #6b7280; font-size: 11.5px; margin-top: 1px; }

.stats {
  margin-top: 9px;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;
}
.stat {}
.statLabel {
  color: #9ca3af; font-size: 8.5px; letter-spacing: 0.4px;
  text-transform: uppercase; font-weight: 600;
}
.statValue {
  color: #0F3B6B; font-size: 11.5px; font-weight: 700; margin-top: 2px;
}
.bar {
  margin-top: 4px; height: 3px; background: #e5e7eb;
  border-radius: 3px; overflow: hidden;
}
.barFill { height: 100%; }
.barOk { background: #02AAEB; }
.barWarn { background: #F59E0B; }
.barBad { background: #EF4444; }

.foot {
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 9px; margin-top: 9px;
  border-top: 1px solid #e5e7eb;
}

.avStack { display: flex; }
.avatar {
  width: 24px; height: 24px; border-radius: 50%;
  border: 2px solid #fff; margin-left: -7px;
}
.avatar:first-child { margin-left: 0; }
.avatarFallback {
  width: 24px; height: 24px; border-radius: 50%;
  background: linear-gradient(135deg, #02AAEB, #1B77BE);
  color: #fff; font-size: 10px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #fff; margin-left: -7px;
}
.avatarFallback:first-child { margin-left: 0; }
.avatarMore {
  width: 24px; height: 24px; border-radius: 50%;
  background: #e5e7eb; color: #6b7280;
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: 700;
  border: 2px solid #fff; margin-left: -7px;
}

.due {
  padding: 3px 8px;
  border-radius: 5px;
  font-size: 10.5px;
  font-weight: 600;
}
.dueBad { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
.dueWarn { background: #fed7aa; color: #9a3412; border: 1px solid #fdba74; }
.dueCalm { background: rgba(2,170,235,0.12); color: #02AAEB; border: 1px solid rgba(2,170,235,0.3); }
.dueGreen { background: #d1fae5; color: #047857; border: 1px solid #a7f3d0; }
```

Commit:

```bash
git add apps/web/src/components/admin/pipeline/
git commit -m "feat(admin/pipeline): generic StatusBoard/Column/Card components (Card B++)"
```

---

## Task 5: AiInsightCard component

**Files:**
- Create: `apps/web/src/components/admin/pipeline/AiInsightCard.tsx`
- Create: `apps/web/src/components/admin/pipeline/AiInsightCard.module.css`

```tsx
import type { Insight } from '@/lib/admin/ai-insights';
import styles from './AiInsightCard.module.css';

const SEVERITY_CLASS = {
  info: styles.info,
  recommendation: styles.recommendation,
  warning: styles.warning,
  success: styles.success,
} as const;

function agentInitials(key: string): string {
  return key
    .split('_')
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);
}

export function AiInsightCard({ insight }: { insight: Insight }) {
  return (
    <aside className={`${styles.tile} ${SEVERITY_CLASS[insight.severity]}`}>
      <span className={styles.agent} aria-hidden>{agentInitials(insight.agentKey)}</span>
      <div className={styles.text}>
        <strong className={styles.agentName}>{insight.title}:</strong>{' '}
        {insight.body}
      </div>
    </aside>
  );
}
```

```css
.tile {
  margin-top: 9px;
  border: 1px solid;
  border-radius: 6px;
  padding: 8px 10px;
  display: flex; gap: 7px; align-items: flex-start;
}
.agent {
  width: 22px; height: 22px; border-radius: 50%;
  color: #fff; font-size: 9px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.agentName { font-weight: 700; margin-right: 4px; }
.text { font-size: 10.5px; line-height: 1.4; }

.info { background: rgba(2,170,235,0.10); border-color: rgba(2,170,235,0.3); color: #02AAEB; }
.info .agent { background: linear-gradient(135deg, #02AAEB, #1B77BE); }

.recommendation {
  background: linear-gradient(135deg, rgba(168,85,247,0.10), rgba(139,92,246,0.04));
  border-color: rgba(168,85,247,0.3); color: #6D28D9;
}
.recommendation .agent { background: linear-gradient(135deg, #a855f7, #6D28D9); }

.warning {
  background: linear-gradient(135deg, rgba(239,68,68,0.10), rgba(220,38,38,0.04));
  border-color: rgba(239,68,68,0.35); color: #b91c1c;
}
.warning .agent { background: linear-gradient(135deg, #ef4444, #b91c1c); }

.success {
  background: linear-gradient(135deg, rgba(16,185,129,0.10), rgba(5,150,105,0.04));
  border-color: rgba(16,185,129,0.35); color: #047857;
}
.success .agent { background: linear-gradient(135deg, #10b981, #047857); }
```

Commit.

---

## Task 6: MetricsBar component

**Files:**
- Create: `apps/web/src/components/admin/pipeline/MetricsBar.tsx` + `.module.css`

```tsx
import styles from './MetricsBar.module.css';

export type MetricTile = {
  label: string;
  value: string;
  delta?: { text: string; tone?: 'ok' | 'warn' | 'bad' };
  featured?: boolean;
};

export function MetricsBar({ tiles }: { tiles: MetricTile[] }) {
  if (tiles.length === 0) return null;
  return (
    <div className={styles.bar}>
      {tiles.map((t, i) => (
        <div
          key={i}
          className={`${styles.tile} ${t.featured ? styles.featured : ''}`}
        >
          <div className={styles.label}>{t.label}</div>
          <div className={styles.value}>{t.value}</div>
          {t.delta ? (
            <div className={`${styles.delta} ${t.delta.tone ? styles['delta_' + t.delta.tone] : ''}`}>
              {t.delta.text}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
```

```css
.bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.tile {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 11px 14px;
  box-shadow: 0 1px 2px rgba(15,23,42,0.04);
}
.featured {
  background: linear-gradient(135deg, #02AAEB 0%, #1B77BE 100%);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 6px 16px -4px rgba(2,170,235,0.5);
}

.label {
  color: #6b7280; font-size: 9.5px;
  letter-spacing: 1.2px; text-transform: uppercase;
  margin-bottom: 3px; font-weight: 600;
}
.featured .label { color: rgba(255,255,255,0.85); }

.value {
  color: #0F3B6B; font-size: 18px; font-weight: 700; line-height: 1;
}
.featured .value { color: #fff; }

.delta { color: #10B981; font-size: 11px; margin-top: 4px; }
.featured .delta { color: rgba(255,255,255,0.9); }
.delta_warn { color: #F59E0B; }
.delta_bad { color: #EF4444; }
```

Commit.

---

## Task 7: Pipeline adapters

Each entity gets a pure adapter that transforms its row shape into the generic card props plus column config.

**Files:**
- Create: `apps/web/src/lib/admin/pipeline-adapters/contact-status.ts`
- Create: `apps/web/src/lib/admin/pipeline-adapters/property-status.ts`
- Create: `apps/web/src/lib/admin/pipeline-adapters/project-status.ts`

Contact adapter (sample; the others follow the same pattern):

```ts
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

const STAGE_COLUMNS_LEAD_PIPELINE: { key: LifecycleStage; color: StageDef['color']; label: string; }[] = [
  { key: 'lead_new', color: 'blue', label: 'New' },
  { key: 'qualified', color: 'blue', label: 'Qualified' },
  { key: 'in_discussion', color: 'violet', label: 'In discussion' },
  { key: 'contract_sent', color: 'violet', label: 'Contract sent' },
];

export function buildContactStatusBoard(
  rows: ContactRow[],
  insightsByContact: Record<string, Insight[]>,
  viewKey: string,
): StatusColumnData[] {
  const columns = viewKey === 'lead-pipeline'
    ? STAGE_COLUMNS_LEAD_PIPELINE
    : viewKey === 'active-owners'
      ? [{ key: 'active_owner' as const, color: 'green' as const, label: 'Active' }]
      : viewKey === 'churned'
        ? [
            { key: 'paused' as const, color: 'gray' as const, label: 'Paused' },
            { key: 'churned' as const, color: 'gray' as const, label: 'Churned' },
          ]
        : STAGE_COLUMNS_LEAD_PIPELINE;

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
```

Property adapter: stage columns = `onboarding`, `listing_review`, `launch_ready`, `live`, `paused`. Cover = `cover_photo_url`. Stats = setup%/tasks/est_mrr for onboarding; this_mo/nights/rating for live.

Project adapter: columns = `not_started`, `in_progress`, `blocked`, `done`. Cover gradient from `project.color` or the type emoji fallback.

Commit adapters together.

---

## Task 8: StatusView components per entity

**Files:**
- Create: `apps/web/src/app/(admin)/admin/contacts/StatusView.tsx`
- Create: `apps/web/src/app/(admin)/admin/properties/StatusView.tsx`
- Create: `apps/web/src/app/(admin)/admin/projects/StatusView.tsx`

Contacts StatusView (server component, wraps MetricsBar + StatusBoard):

```tsx
import { StatusBoard } from '@/components/admin/pipeline/StatusBoard';
import { MetricsBar, type MetricTile } from '@/components/admin/pipeline/MetricsBar';
import { fetchAdminContactsList } from '@/lib/admin/contacts-list';
import { fetchInsightsByParent } from '@/lib/admin/ai-insights';
import { buildContactStatusBoard } from '@/lib/admin/pipeline-adapters/contact-status';

export async function ContactsStatusView({ viewKey }: { viewKey: string }) {
  const { rows } = await fetchAdminContactsList({ viewKey });
  const insightsMap = await fetchInsightsByParent('contact', rows.map((r) => r.id));
  const columns = buildContactStatusBoard(rows, insightsMap, viewKey);

  const totalMrr = rows.reduce((s, r) => s + (r.estimatedMrr ?? 0), 0);
  const tiles: MetricTile[] = [
    { label: 'Pipeline value', value: `$${totalMrr.toLocaleString()}`, featured: true },
    { label: 'Contacts in view', value: String(rows.length) },
    { label: 'With assigned owner', value: String(rows.filter((r) => r.assignedTo).length) },
  ];

  return (
    <div>
      <MetricsBar tiles={tiles} />
      <StatusBoard columns={columns} />
    </div>
  );
}
```

Properties and Projects StatusView follow the same shape. Each imports its own fetcher and adapter.

Commit.

---

## Task 9: Wire pages to switch between list and status views

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/contacts/page.tsx`
- Modify: `apps/web/src/app/(admin)/admin/properties/page.tsx`
- Modify: `apps/web/src/app/(admin)/admin/projects/page.tsx`

Example pattern for `contacts/page.tsx`:

```tsx
import { fetchAdminContactsList } from '@/lib/admin/contacts-list';
import { ContactsListView } from './ContactsListView';
import { ContactsStatusView } from './StatusView';

type Props = { searchParams: Promise<{ view?: string; mode?: string }> };

export default async function ContactsPage({ searchParams }: Props) {
  const { view, mode } = await searchParams;
  const viewKey = view ?? 'all-contacts';

  // Default mode based on the saved view's view_mode
  const { activeView, rows, views } = await fetchAdminContactsList({ viewKey });
  const activeMode = mode ?? activeView.viewMode;

  if (activeMode === 'status') {
    return <ContactsStatusView viewKey={viewKey} />;
  }
  return <ContactsListView rows={rows} views={views} activeView={activeView} />;
}
```

Similar for properties (supports status/gallery/compact/map — gallery and map stay as existing implementations, we only add status) and projects.

Commit.

---

## Task 10: View switcher toggles in top bar

The current Properties page already has `HomesViewSwitcher` in its top bar. For Contacts and Projects we need a similar switcher wired to the `?mode=` query string.

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/contacts/layout.tsx` (or a client page chrome) — inject a view switcher into the top bar center slot
- Same for `projects/layout.tsx`

Use the existing `TopBarSlotsContext` from the chrome plan. Pattern:

```tsx
'use client';
import { useEffect } from 'react';
import { useTopBarSlots } from '@/components/admin/chrome/TopBarSlotsContext';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const MODES = ['status', 'compact'] as const;

export function ContactsViewSwitcher() {
  const { setCenterSlot } = useTopBarSlots();
  const sp = useSearchParams();
  const mode = sp?.get('mode') ?? 'compact';

  useEffect(() => {
    setCenterSlot(
      <div role="tablist" aria-label="View mode">
        {MODES.map((m) => (
          <Link
            key={m}
            href={`?${new URLSearchParams({ ...Object.fromEntries(sp ?? []), mode: m }).toString()}`}
            aria-selected={m === mode}
          >
            {m}
          </Link>
        ))}
      </div>,
    );
    return () => setCenterSlot(null);
  }, [mode, setCenterSlot, sp]);

  return null;
}
```

Style matches the `HomesViewSwitcher` look (white pill on glass). Reuse its module.css if extracting to `apps/web/src/components/admin/chrome/PipelineViewSwitcher.tsx`.

Commit.

---

## Task 11: Properties page integration

The Properties Status view is the biggest win — it needs real data and real cover photos.

**Files:**
- Modify: `apps/web/src/lib/admin/properties-list.ts` (if missing, create it analogous to contacts-list.ts)
- Create: `apps/web/src/lib/admin/pipeline-adapters/property-status.ts` (flesh out)
- Wire `PropertiesStatusView` in the page switcher

Property stage columns + metric tiles:

```ts
const COLUMNS = [
  { key: 'onboarding',     color: 'blue',   label: 'Onboarding' },
  { key: 'listing_review', color: 'violet', label: 'Listing Review' },
  { key: 'launch_ready',   color: 'violet', label: 'Launch Ready' },
  { key: 'live',           color: 'green',  label: 'Live' },
  { key: 'paused',         color: 'gray',   label: 'Paused' },
] as const;
```

Metric tiles:
- Pipeline value (sum of est_mrr across non-paused homes) — featured
- Live revenue (/mo)
- In onboarding (count)
- Avg setup time (days)
- Avg rating

Commit.

---

## Task 12: Final verification

- [ ] **Step 1: Build + typecheck**

```bash
pnpm --filter web typecheck && pnpm --filter web build
```

- [ ] **Step 2: Screenshot pass (every pipeline in Status mode)**

```bash
node screenshot.mjs "http://localhost:4000/admin/contacts?view=lead-pipeline&mode=status" "d-contacts-status" --update-baseline
node screenshot.mjs "http://localhost:4000/admin/properties?mode=status" "d-properties-status" --update-baseline
node screenshot.mjs "http://localhost:4000/admin/projects?mode=status" "d-projects-status" --update-baseline
```

Read each and verify:
- Top bar unchanged.
- Below the top bar: MetricsBar with featured blue tile + others.
- Below: saved-view tabs then filter row then a Kanban board with vivid gradient column headers.
- Cards: cover/gradient, status pill, name, sub, 3 mini stats with bar fills, (optionally) AI insight tile, avatar stack, due tag.

- [ ] **Step 3: Playwright spec**

```ts
// apps/web/e2e/status-view.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Status view', () => {
  for (const [path, label] of [
    ['/admin/contacts?view=lead-pipeline&mode=status', 'Contacts'],
    ['/admin/properties?mode=status', 'Properties'],
    ['/admin/projects?mode=status', 'Projects'],
  ] as const) {
    test(`${label}: renders columns + cards`, async ({ page }) => {
      await page.goto(path);
      // Expect at least one stage header visible
      await expect(page.locator('header >> nth=0')).toBeVisible();
      // Card hrefs present
      const cards = page.locator('a[href^="/admin/"]:has(img, div[class*="photo"])');
      expect(await cards.count()).toBeGreaterThanOrEqual(0);
    });
  }
});
```

```bash
cd apps/web && pnpm dlx playwright test e2e/status-view.spec.ts --reporter=list
```

- [ ] **Step 4: Commit tests**

```bash
git add apps/web/e2e/status-view.spec.ts
git commit -m "test(admin/pipeline): playwright smoke for status view across entities"
```

---

## Ship criterion recap

- Switch any pipeline page to `?mode=status`: the board renders.
- Stage columns match the spec (blue / violet / green / gray gradients, dollar totals, sub labels).
- Cards show real cover photos (Properties), gradient + initials (Contacts), emoji + color (Projects).
- Cards show 3 mini stats with bar fills.
- At least one seeded AI insight renders on one card per entity.
- MetricsBar appears above the board with a featured blue tile.
- View switcher in the top bar center toggles between Status / Gallery / Compact.
- All builds + screenshots + playwright pass.
