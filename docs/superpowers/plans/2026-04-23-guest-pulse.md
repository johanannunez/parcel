# Guest Pulse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename Guest Intelligence → Guest Pulse, add three-column model (Emergencies / House Fixes / Owner Updates), richer cards with body excerpts and address display, mark-complete action tracked separately from dismiss, dismiss confirmation for critical/warning insights, and three surfaces: dashboard widget, dedicated page, property detail tab.

**Architecture:** Three-column split is display-only — Emergencies = `house_action` + `isCritical`, House Fixes = `house_action` + not critical, Owner Updates = `owner_update`. A new `completed_at` column on `ai_insights` tracks resolved insights separately from dismissed ones. The dashboard widget caps at 4 cards per column with a "View all" link; the dedicated page and property tab show all cards with filters.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase (server actions), CSS Modules, Phosphor Icons, existing `ConfirmModal` component.

**Design doc:** `docs/plans/2026-04-23-guest-pulse-design.md`

---

## File Map

### Create
- `apps/web/supabase/migrations/20260423_ai_insights_completed_at.sql`
- `apps/web/src/app/(admin)/admin/GuestPulse.tsx` (replaces GuestIntelligence.tsx)
- `apps/web/src/app/(admin)/admin/GuestPulse.module.css` (replaces GuestIntelligence.module.css)
- `apps/web/src/app/(admin)/admin/guest-pulse/page.tsx`
- `apps/web/src/app/(admin)/admin/guest-pulse/PulseBoard.tsx`
- `apps/web/src/app/(admin)/admin/guest-pulse/PulseBoard.module.css`
- `apps/web/src/app/(admin)/admin/properties/[id]/PulseTab.tsx`

### Modify
- `apps/web/src/lib/admin/ai-insights.ts`
- `apps/web/src/lib/admin/insight-actions.ts`
- `apps/web/src/lib/admin/dashboard-data.ts`
- `apps/web/src/app/(admin)/admin/page.tsx`
- `apps/web/src/app/(admin)/admin/InsightDetailPanel.tsx`
- `apps/web/src/app/(admin)/admin/InsightDetailPanel.module.css`
- `apps/web/src/components/admin/AdminSidebar.tsx`
- `apps/web/src/app/(admin)/admin/properties/[id]/PropertyDetailShell.tsx`
- `apps/web/src/app/(admin)/admin/properties/[id]/page.tsx`

### Delete
- `apps/web/src/app/(admin)/admin/GuestIntelligence.tsx`
- `apps/web/src/app/(admin)/admin/GuestIntelligence.module.css`

---

## Task 1: DB Migration

**Files:**
- Create: `apps/web/supabase/migrations/20260423_ai_insights_completed_at.sql`

- [ ] **Step 1: Write migration**

```sql
-- Tracks when an insight was resolved (distinct from dismissed_at which means "not relevant")
ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS completed_at timestamptz;
```

- [ ] **Step 2: Apply via Supabase MCP**

Use the Supabase MCP `apply_migration` tool, project `pwoxwpryummqeqsxdgyc`, with the SQL above. Confirm success (no error response).

- [ ] **Step 3: Commit**

```bash
git add apps/web/supabase/migrations/20260423_ai_insights_completed_at.sql
git commit -m "feat: add completed_at to ai_insights for Guest Pulse"
```

---

## Task 2: Backend — completeInsight action + active feed filter

**Files:**
- Modify: `apps/web/src/lib/admin/ai-insights.ts`
- Modify: `apps/web/src/lib/admin/insight-actions.ts`

- [ ] **Step 1: Add `completed_at IS NULL` to both fetch functions in `ai-insights.ts`**

In `fetchInsightsByParent`, add `.is('completed_at', null)` immediately after the existing `.is('dismissed_at', null)` line. Do the same in `fetchInsightsByParentWithPayload`. Both functions need the same change.

Updated chain for `fetchInsightsByParent`:
```ts
const { data, error } = await supabase
  .from('ai_insights')
  .select('id, parent_type, parent_id, agent_key, severity, title, body, action_label, created_at')
  .eq('parent_type', parentType)
  .in('parent_id', parentIds)
  .is('dismissed_at', null)
  .is('completed_at', null)
  .order('created_at', { ascending: false });
```

Updated chain for `fetchInsightsByParentWithPayload`:
```ts
const { data, error } = await supabase
  .from('ai_insights')
  .select('id, parent_type, parent_id, agent_key, severity, title, body, action_label, action_payload, created_at')
  .eq('parent_type', parentType)
  .in('parent_id', parentIds)
  .is('dismissed_at', null)
  .is('completed_at', null)
  .order('created_at', { ascending: false });
```

- [ ] **Step 2: Add `completeInsight` to `insight-actions.ts`**

Add after `dismissInsight`:

```ts
export async function completeInsight(insightId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('ai_insights')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', insightId);
  if (error) throw error;
  revalidatePath('/admin');
  revalidatePath('/admin/guest-pulse');
}
```

Also add `revalidatePath('/admin/guest-pulse')` to the existing `dismissInsight` function body (after the existing `revalidatePath('/admin')` call).

- [ ] **Step 3: Type check**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web && pnpm exec tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/admin/ai-insights.ts apps/web/src/lib/admin/insight-actions.ts
git commit -m "feat: completeInsight action + filter completed from active feeds"
```

---

## Task 3: Dashboard data — address display + pulse page data

**Files:**
- Modify: `apps/web/src/lib/admin/dashboard-data.ts`

- [ ] **Step 1: Add `fetchPulsePageData` at the bottom of `dashboard-data.ts`**

```ts
export type PulseOwnerOption = {
  id: string;
  name: string;
  propertyIds: string[];
};

export async function fetchPulsePageData(): Promise<{
  propertyRefs: Array<{ id: string; name: string }>;
  ownerOptions: PulseOwnerOption[];
}> {
  const supabase = await createClient();

  const { data: properties } = await supabase
    .from('properties')
    .select('id, address_line1, name')
    .eq('active', true)
    .order('address_line1', { ascending: true, nullsFirst: false });

  const propertyRefs = (properties ?? []).map((p) => ({
    id: p.id,
    name: p.address_line1?.trim() ?? p.name?.trim() ?? '(unnamed)',
  }));

  const propIds = propertyRefs.map((p) => p.id);
  const { data: links } = await supabase
    .from('property_owners')
    .select('property_id, profile_id, profiles(id, full_name)')
    .in('property_id', propIds);

  const ownerMap = new Map<string, { name: string; propertyIds: string[] }>();
  for (const link of links ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile = (link as any).profiles as { id: string; full_name: string | null } | null;
    if (!profile) continue;
    const ownerId = profile.id;
    const ownerName = profile.full_name ?? 'Unknown';
    if (!ownerMap.has(ownerId)) ownerMap.set(ownerId, { name: ownerName, propertyIds: [] });
    ownerMap.get(ownerId)!.propertyIds.push(link.property_id);
  }

  const ownerOptions: PulseOwnerOption[] = Array.from(ownerMap.entries())
    .map(([id, { name, propertyIds }]) => ({ id, name, propertyIds }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { propertyRefs, ownerOptions };
}
```

Note: If `property_owners` columns differ (e.g., `profile_id` vs `owner_id`), check via Supabase MCP `list_tables` for `property_owners` and adjust the select string. The `profiles` join name must match the Supabase-generated FK alias.

- [ ] **Step 2: Type check**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web && pnpm exec tsc --noEmit
```

If there are type errors on the `property_owners` query, use `// eslint-disable-next-line @typescript-eslint/no-explicit-any` and cast the result as `any[]` and map manually.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/admin/dashboard-data.ts
git commit -m "feat: fetchPulsePageData with address refs and owner options"
```

---

## Task 4: GuestPulse dashboard widget (rename + three columns + rich cards)

**Files:**
- Delete: `apps/web/src/app/(admin)/admin/GuestIntelligence.tsx`
- Delete: `apps/web/src/app/(admin)/admin/GuestIntelligence.module.css`
- Create: `apps/web/src/app/(admin)/admin/GuestPulse.tsx`
- Create: `apps/web/src/app/(admin)/admin/GuestPulse.module.css`

- [ ] **Step 1: Remove old files**

```bash
git rm apps/web/src/app/\(admin\)/admin/GuestIntelligence.tsx \
       apps/web/src/app/\(admin\)/admin/GuestIntelligence.module.css
```

- [ ] **Step 2: Create `GuestPulse.module.css`**

```css
/* apps/web/src/app/(admin)/admin/GuestPulse.module.css */
.header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 16px;
}

.refreshBtn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: background 100ms, border-color 100ms;
}
.refreshBtn:hover { background: #f9fafb; border-color: #d1d5db; }
.refreshBtn:disabled { opacity: 0.5; cursor: not-allowed; }

.errorMsg { font-size: 12px; color: var(--color-error, #e05252); }

.cols {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  align-items: start;
}
@media (max-width: 900px) { .cols { grid-template-columns: 1fr; } }

.col { display: flex; flex-direction: column; }

.colLabel {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
  margin-bottom: 10px;
}
.colLabelEmergency { color: #991b1b; }

.cardList { display: flex; flex-direction: column; gap: 8px; }

.card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px 14px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: box-shadow 130ms, border-color 130ms;
}
.card:hover { box-shadow: 0 2px 12px rgba(15,59,107,0.08); border-color: #cbd5e1; }
.cardEmergency { border-color: #fecaca; background: #fff8f8; }
.cardEmergency:hover { border-color: #fca5a5; }

.cardTop {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 5px;
}

.badgeRow { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }

.badge {
  font-size: 9.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 2px 7px;
  border-radius: 5px;
}
.badgeInfo           { background: #dbeafe; color: #1d4ed8; }
.badgeRecommendation { background: #d1fae5; color: #065f46; }
.badgeWarning        { background: #fef3c7; color: #92400e; }
.badgeCritical       { background: #fee2e2; color: #991b1b; }

.categoryChip {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f3f4f6;
  color: #6b7280;
}

.sourceCount { font-size: 11px; color: #9ca3af; }

.dismissBtn {
  background: none;
  border: none;
  cursor: pointer;
  color: #d1d5db;
  padding: 2px;
  line-height: 1;
  font-size: 13px;
  transition: color 100ms;
  flex-shrink: 0;
}
.dismissBtn:hover { color: #6b7280; }

.cardTitle {
  font-size: 12.5px;
  font-weight: 600;
  color: #0F3B6B;
  line-height: 1.35;
  margin-bottom: 4px;
}

.cardExcerpt {
  font-size: 11.5px;
  color: #6b7280;
  line-height: 1.45;
  margin: 0 0 5px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.propName { font-size: 10.5px; color: #9ca3af; }

.viewAllLink {
  display: block;
  font-size: 11.5px;
  color: #1B77BE;
  text-decoration: none;
  padding: 8px 0 2px;
  font-weight: 500;
}
.viewAllLink:hover { text-decoration: underline; }

.empty {
  padding: 18px;
  text-align: center;
  color: #9ca3af;
  font-size: 12px;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px dashed #e5e7eb;
}
```

- [ ] **Step 3: Create `GuestPulse.tsx`**

```tsx
// apps/web/src/app/(admin)/admin/GuestPulse.tsx
'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowsClockwise } from '@phosphor-icons/react';
import ConfirmModal from '@/components/admin/ConfirmModal';
import type { EnrichedInsight } from '@/lib/admin/dashboard-data';
import { dismissInsight, triggerGuestIntelligenceSync } from '@/lib/admin/insight-actions';
import { InsightDetailPanel } from './InsightDetailPanel';
import styles from './GuestPulse.module.css';

const MAX_PER_COLUMN = 4;

type Props = {
  ownerUpdates: EnrichedInsight[];
  houseActions: EnrichedInsight[];
};

function severityLabel(severity: EnrichedInsight['severity'], isCritical: boolean): string {
  if (isCritical) return 'Critical';
  if (severity === 'warning') return 'Warning';
  if (severity === 'recommendation') return 'Recommendation';
  return 'Info';
}

function categoryLabel(isCritical: boolean, bucket: string): string {
  if (isCritical) return 'Emergency';
  if (bucket === 'house_action') return 'House Fix';
  return 'Owner Update';
}

function excerpt(body: string): string {
  if (body.length <= 110) return body;
  return body.slice(0, 110).trimEnd() + '…';
}

function InsightCard({
  insight,
  onOpen,
  onDismiss,
}: {
  insight: EnrichedInsight;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const isCritical = Boolean(insight.payload.isCritical);
  const { severity } = insight;
  const badgeCls =
    isCritical ? styles.badgeCritical :
    severity === 'warning' ? styles.badgeWarning :
    severity === 'recommendation' ? styles.badgeRecommendation :
    styles.badgeInfo;

  return (
    <div
      className={`${styles.card}${isCritical ? ` ${styles.cardEmergency}` : ''}`}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
    >
      <div className={styles.cardTop}>
        <div className={styles.badgeRow}>
          <span className={`${styles.badge} ${badgeCls}`}>
            {severityLabel(severity, isCritical)}
          </span>
          <span className={styles.categoryChip}>
            {categoryLabel(isCritical, insight.payload.bucket)}
          </span>
          <span className={styles.sourceCount}>
            {insight.payload.sourceCount}{' '}
            {insight.payload.sourceCount === 1 ? 'mention' : 'mentions'}
          </span>
        </div>
        <button
          type="button"
          className={styles.dismissBtn}
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
      <div className={styles.cardTitle}>{insight.title}</div>
      <p className={styles.cardExcerpt}>{excerpt(insight.body)}</p>
      <div className={styles.propName}>{insight.propertyName}</div>
    </div>
  );
}

function Column({
  label,
  labelMod,
  insights,
  dismissed,
  onOpen,
  onRequestDismiss,
}: {
  label: string;
  labelMod?: string;
  insights: EnrichedInsight[];
  dismissed: Set<string>;
  onOpen: (ins: EnrichedInsight) => void;
  onRequestDismiss: (ins: EnrichedInsight) => void;
}) {
  const visible = insights.filter((i) => !dismissed.has(i.id));
  const shown = visible.slice(0, MAX_PER_COLUMN);
  const overflow = visible.length - MAX_PER_COLUMN;

  return (
    <div className={styles.col}>
      <div className={`${styles.colLabel}${labelMod ? ` ${labelMod}` : ''}`}>{label}</div>
      <div className={styles.cardList}>
        {shown.length === 0 ? (
          <div className={styles.empty}>None right now.</div>
        ) : (
          shown.map((ins) => (
            <InsightCard
              key={ins.id}
              insight={ins}
              onOpen={() => onOpen(ins)}
              onDismiss={() => onRequestDismiss(ins)}
            />
          ))
        )}
        {overflow > 0 && (
          <Link href="/admin/guest-pulse" className={styles.viewAllLink}>
            +{overflow} more — View all
          </Link>
        )}
      </div>
    </div>
  );
}

export function GuestPulse({ ownerUpdates, houseActions }: Props) {
  const [activeInsight, setActiveInsight] = useState<EnrichedInsight | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [confirmTarget, setConfirmTarget] = useState<EnrichedInsight | null>(null);
  const [isRefreshing, startRefresh] = useTransition();
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const emergencies = houseActions.filter((i) => i.payload.isCritical);
  const houseFixes = houseActions.filter((i) => !i.payload.isCritical);

  const handleDismiss = (ins: EnrichedInsight) => {
    const isSensitive = ins.payload.isCritical || ins.severity === 'warning';
    if (isSensitive) {
      setConfirmTarget(ins);
    } else {
      executeDismiss(ins.id);
    }
  };

  const executeDismiss = (id: string) => {
    setDismissed((prev) => new Set([...prev, id]));
    if (activeInsight?.id === id) setActiveInsight(null);
    dismissInsight(id).catch(console.error);
  };

  const handleRefresh = () => {
    setRefreshError(null);
    startRefresh(async () => {
      try {
        await triggerGuestIntelligenceSync();
        window.location.reload();
      } catch (err) {
        setRefreshError(err instanceof Error ? err.message : 'Sync failed.');
      }
    });
  };

  return (
    <>
      <div className={styles.header}>
        {refreshError && <span className={styles.errorMsg}>{refreshError}</span>}
        <button
          type="button"
          className={styles.refreshBtn}
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <ArrowsClockwise size={13} weight={isRefreshing ? 'bold' : 'regular'} />
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className={styles.cols}>
        <Column
          label="Emergencies"
          labelMod={styles.colLabelEmergency}
          insights={emergencies}
          dismissed={dismissed}
          onOpen={setActiveInsight}
          onRequestDismiss={handleDismiss}
        />
        <Column
          label="House Fixes"
          insights={houseFixes}
          dismissed={dismissed}
          onOpen={setActiveInsight}
          onRequestDismiss={handleDismiss}
        />
        <Column
          label="Owner Updates"
          insights={ownerUpdates}
          dismissed={dismissed}
          onOpen={setActiveInsight}
          onRequestDismiss={handleDismiss}
        />
      </div>

      {activeInsight && (
        <InsightDetailPanel
          insight={activeInsight}
          payload={activeInsight.payload}
          propertyId={activeInsight.propertyId}
          propertyName={activeInsight.propertyName}
          onClose={() => setActiveInsight(null)}
          onDismiss={() => handleDismiss(activeInsight)}
          onComplete={() => {
            setDismissed((prev) => new Set([...prev, activeInsight.id]));
            setActiveInsight(null);
          }}
        />
      )}

      <ConfirmModal
        open={confirmTarget !== null}
        title="Dismiss this insight?"
        description="This insight is flagged as critical or a warning. Dismissing it removes it from your feed permanently."
        confirmLabel="Yes, dismiss"
        cancelLabel="Keep it"
        variant="danger"
        onConfirm={() => {
          if (confirmTarget) executeDismiss(confirmTarget.id);
          setConfirmTarget(null);
        }}
        onCancel={() => setConfirmTarget(null)}
      />
    </>
  );
}
```

- [ ] **Step 4: Type check**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web && pnpm exec tsc --noEmit
```

`InsightDetailPanel` will error on the new `propertyName`/`onDismiss`/`onComplete` props until Task 5. That's expected — resolve in that task.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/\(admin\)/admin/GuestPulse.tsx \
        apps/web/src/app/\(admin\)/admin/GuestPulse.module.css
git commit -m "feat: GuestPulse dashboard widget — three columns, rich cards, dismiss gate"
```

---

## Task 5: Update InsightDetailPanel

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/InsightDetailPanel.tsx`
- Modify: `apps/web/src/app/(admin)/admin/InsightDetailPanel.module.css`

- [ ] **Step 1: Replace `InsightDetailPanel.tsx`**

```tsx
// apps/web/src/app/(admin)/admin/InsightDetailPanel.tsx
'use client';

import { useState, useTransition } from 'react';
import { X } from '@phosphor-icons/react';
import ConfirmModal from '@/components/admin/ConfirmModal';
import type { InsightPayload } from '@/lib/admin/insight-types';
import type { Insight } from '@/lib/admin/ai-insights';
import { dismissInsight, completeInsight, createTaskFromInsight } from '@/lib/admin/insight-actions';
import styles from './InsightDetailPanel.module.css';

type Props = {
  insight: Insight;
  payload: InsightPayload;
  propertyId: string;
  propertyName: string;
  onClose: () => void;
  onDismiss?: () => void;
  onComplete?: () => void;
};

function badgeCls(severity: Insight['severity'], isCritical: boolean): string {
  if (isCritical) return styles.badgeCritical;
  if (severity === 'warning') return styles.badgeWarning;
  if (severity === 'recommendation') return styles.badgeRecommendation;
  return styles.badgeInfo;
}

function badgeLabel(severity: Insight['severity'], isCritical: boolean): string {
  if (isCritical) return 'Critical';
  if (severity === 'warning') return 'Warning';
  if (severity === 'recommendation') return 'Recommendation';
  return 'Info';
}

export function InsightDetailPanel({
  insight,
  payload,
  propertyId,
  propertyName,
  onClose,
  onDismiss,
  onComplete,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [confirmDismiss, setConfirmDismiss] = useState(false);
  const isCritical = Boolean(payload.isCritical);
  const needsConfirm = isCritical || insight.severity === 'warning';

  const handleComplete = () => {
    startTransition(async () => {
      await completeInsight(insight.id);
      onComplete?.();
      onClose();
    });
  };

  const handleCreateTask = () => {
    startTransition(async () => {
      await createTaskFromInsight({
        insightId: insight.id,
        propertyId,
        title: insight.title,
        body: insight.body,
        suggestedFixes: payload.suggestedFixes,
      });
      onClose();
    });
  };

  const executeDismiss = () => {
    startTransition(async () => {
      await dismissInsight(insight.id);
      onDismiss?.();
      onClose();
    });
  };

  const handleDismissClick = () => {
    if (needsConfirm) {
      setConfirmDismiss(true);
    } else {
      executeDismiss();
    }
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.severityRow}>
                <span className={`${styles.badge} ${badgeCls(insight.severity, isCritical)}`}>
                  {badgeLabel(insight.severity, isCritical)}
                </span>
                <span className={styles.sourceCount}>
                  {payload.sourceCount} {payload.sourceCount === 1 ? 'mention' : 'mentions'}
                </span>
              </div>
              <h2 className={styles.panelTitle}>{insight.title}</h2>
              {propertyName && <p className={styles.panelPropName}>{propertyName}</p>}
            </div>
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>

          <div className={styles.body}>
            <div>
              <div className={styles.sectionLabel}>The issue</div>
              <p className={styles.issueText}>{insight.body}</p>
            </div>
            <div>
              <div className={styles.sectionLabel}>Why this severity</div>
              <p className={styles.reasonText}>{payload.severityReason}</p>
            </div>
            {payload.sourceExcerpts.length > 0 && (
              <div>
                <div className={styles.sectionLabel}>Sources</div>
                <div className={styles.sourceList}>
                  {payload.sourceExcerpts.map((src, i) => (
                    <div key={i} className={styles.sourceItem}>
                      <div className={styles.sourceMeta}>
                        <span className={styles.sourceTypeBadge}>{src.type}</span>
                        <span className={styles.sourceName}>{src.guestFirstName}</span>
                        <span className={styles.sourceDate}>{src.approximateDate}</span>
                      </div>
                      <p className={styles.sourceQuote}>"{src.quote}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {payload.suggestedFixes.length > 0 && (
              <div>
                <div className={styles.sectionLabel}>Suggested fixes</div>
                <div className={styles.fixList}>
                  {payload.suggestedFixes.map((fix, i) => (
                    <div key={i} className={styles.fixItem}>
                      <span className={styles.fixNumber}>{i + 1}</span>
                      <span className={styles.fixText}>{fix}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleComplete}
              disabled={isPending}
            >
              {isPending ? 'Saving…' : 'Mark complete'}
            </button>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleCreateTask}
              disabled={isPending}
            >
              {payload.suggestedFixes.length > 1 ? 'Create task + subtasks' : 'Create task'}
            </button>
            <button
              type="button"
              className={styles.btnTertiary}
              onClick={handleDismissClick}
              disabled={isPending}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmDismiss}
        title="Dismiss this insight?"
        description="This is a critical or warning insight. Dismissing it removes it from your feed permanently."
        confirmLabel="Yes, dismiss"
        cancelLabel="Keep it"
        variant="danger"
        onConfirm={() => { setConfirmDismiss(false); executeDismiss(); }}
        onCancel={() => setConfirmDismiss(false)}
      />
    </>
  );
}
```

- [ ] **Step 2: Add to `InsightDetailPanel.module.css`**

Append to the end of the existing file:

```css
.panelPropName {
  font-size: 11.5px;
  color: #9ca3af;
  margin: 2px 0 0;
  line-height: 1.3;
}

.btnTertiary {
  padding: 10px 16px;
  border-radius: 10px;
  background: transparent;
  color: #9ca3af;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: background 140ms, color 140ms, border-color 140ms;
}
.btnTertiary:hover { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }
.btnTertiary:disabled { opacity: 0.5; cursor: not-allowed; }
```

Also update the existing `.footer` rule to handle three buttons:

```css
.footer {
  padding: 16px 24px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  flex-wrap: wrap;
}
```

- [ ] **Step 3: Type check**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web && pnpm exec tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/\(admin\)/admin/InsightDetailPanel.tsx \
        apps/web/src/app/\(admin\)/admin/InsightDetailPanel.module.css
git commit -m "feat: InsightDetailPanel — mark complete, address display, dismiss gate"
```

---

## Task 6: Update dashboard page + sidebar nav

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/page.tsx`
- Modify: `apps/web/src/components/admin/AdminSidebar.tsx`

- [ ] **Step 1: Update `admin/page.tsx`**

Replace the full file:

```tsx
// apps/web/src/app/(admin)/admin/page.tsx
import type { Metadata } from 'next';
import { fetchDashboardData, fetchGuestIntelligenceInsights } from '@/lib/admin/dashboard-data';
import { fetchDashboardTasks } from '@/lib/admin/dashboard-tasks';
import { PropertyHealthGrid } from './PropertyHealthGrid';
import { AttentionQueue } from './AttentionQueue';
import { DashboardTaskSurface } from './DashboardTaskSurface';
import { GuestPulse } from './GuestPulse';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [{ propertyCards, attentionItems }, tasks] = await Promise.all([
    fetchDashboardData(),
    fetchDashboardTasks(),
  ]);

  // Use address_line1 as the display label; fall back to property name
  const propertyRefs = propertyCards.map((c) => ({
    id: c.id,
    name: c.address ?? c.name,
  }));
  const { ownerUpdates, houseActions } = await fetchGuestIntelligenceInsights(propertyRefs);

  return (
    <div className={styles.page}>
      <div className={styles.midRow}>
        <DashboardTaskSurface tasks={tasks} />
        <AttentionQueue items={attentionItems} />
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Guest Pulse</h2>
        <GuestPulse ownerUpdates={ownerUpdates} houseActions={houseActions} />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Property Health</h2>
        <PropertyHealthGrid cards={propertyCards} />
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Update `AdminSidebar.tsx` — add Pulse import**

Add `Pulse` to the destructure import from `@phosphor-icons/react` (around line 7):

```ts
import {
  House,
  Pulse,         // add this
  UsersThree,
  // ... rest unchanged
} from "@phosphor-icons/react";
```

- [ ] **Step 3: Add Pulse to `navEntries` array**

Insert after the Dashboard entry (around line 67):

```ts
{ kind: "item", href: "/admin/guest-pulse", label: "Pulse", icon: <Pulse size={18} weight="duotone" />, matchPrefix: "/admin/guest-pulse" },
```

- [ ] **Step 4: Add Pulse to `adminRailItems` array**

Insert after the Dashboard entry (around line 721):

```ts
{ href: "/admin/guest-pulse", icon: <Pulse size={20} weight="duotone" />, label: "Pulse", matchPrefix: "/admin/guest-pulse" },
```

- [ ] **Step 5: Add Pulse to `pageTitle` in `AdminTopBar`**

Add before the final `return ""` (around line 626):

```ts
if (pathname.startsWith("/admin/guest-pulse")) return "Guest Pulse";
```

- [ ] **Step 6: Type check**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web && pnpm exec tsc --noEmit
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/\(admin\)/admin/page.tsx \
        apps/web/src/components/admin/AdminSidebar.tsx
git commit -m "feat: Guest Pulse in dashboard + sidebar nav"
```

---

## Task 7: Dedicated /admin/guest-pulse page

**Files:**
- Create: `apps/web/src/app/(admin)/admin/guest-pulse/page.tsx`
- Create: `apps/web/src/app/(admin)/admin/guest-pulse/PulseBoard.tsx`
- Create: `apps/web/src/app/(admin)/admin/guest-pulse/PulseBoard.module.css`

- [ ] **Step 1: Create `PulseBoard.module.css`**

```css
/* apps/web/src/app/(admin)/admin/guest-pulse/PulseBoard.module.css */
.filterBar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filterSelect {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
  font-size: 12.5px;
  color: #374151;
  cursor: pointer;
  font-family: inherit;
}
.filterSelect:focus { outline: 2px solid rgba(2,170,235,0.3); border-color: #02AAEB; }

.cols {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  align-items: start;
}
@media (max-width: 900px) { .cols { grid-template-columns: 1fr; } }

.col { display: flex; flex-direction: column; }

.colLabel {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
  margin-bottom: 10px;
}
.colLabelEmergency { color: #991b1b; }
.colCount { font-size: 10px; color: #9ca3af; margin-left: 4px; font-weight: 400; text-transform: none; letter-spacing: 0; }

.cardList { display: flex; flex-direction: column; gap: 8px; }

.card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px 14px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: box-shadow 130ms, border-color 130ms;
}
.card:hover { box-shadow: 0 2px 12px rgba(15,59,107,0.08); border-color: #cbd5e1; }
.cardEmergency { border-color: #fecaca; background: #fff8f8; }
.cardEmergency:hover { border-color: #fca5a5; }

.cardTop {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 5px;
}

.badgeRow { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }

.badge {
  font-size: 9.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 2px 7px;
  border-radius: 5px;
}
.badgeInfo           { background: #dbeafe; color: #1d4ed8; }
.badgeRecommendation { background: #d1fae5; color: #065f46; }
.badgeWarning        { background: #fef3c7; color: #92400e; }
.badgeCritical       { background: #fee2e2; color: #991b1b; }

.categoryChip {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f3f4f6;
  color: #6b7280;
}

.sourceCount { font-size: 11px; color: #9ca3af; }

.dismissBtn {
  background: none;
  border: none;
  cursor: pointer;
  color: #d1d5db;
  padding: 2px;
  line-height: 1;
  font-size: 13px;
  transition: color 100ms;
  flex-shrink: 0;
}
.dismissBtn:hover { color: #6b7280; }

.cardTitle {
  font-size: 12.5px;
  font-weight: 600;
  color: #0F3B6B;
  line-height: 1.35;
  margin-bottom: 4px;
}

.cardExcerpt {
  font-size: 11.5px;
  color: #6b7280;
  line-height: 1.45;
  margin: 0 0 5px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.propName { font-size: 10.5px; color: #9ca3af; }

.empty {
  padding: 18px;
  text-align: center;
  color: #9ca3af;
  font-size: 12px;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px dashed #e5e7eb;
}
```

- [ ] **Step 2: Create `PulseBoard.tsx`**

```tsx
// apps/web/src/app/(admin)/admin/guest-pulse/PulseBoard.tsx
'use client';

import { useState, useMemo } from 'react';
import ConfirmModal from '@/components/admin/ConfirmModal';
import type { EnrichedInsight, PulseOwnerOption } from '@/lib/admin/dashboard-data';
import { dismissInsight } from '@/lib/admin/insight-actions';
import { InsightDetailPanel } from '../InsightDetailPanel';
import styles from './PulseBoard.module.css';

type Props = {
  ownerUpdates: EnrichedInsight[];
  houseActions: EnrichedInsight[];
  propertyOptions: Array<{ id: string; name: string }>;
  ownerOptions: PulseOwnerOption[];
};

function severityLabel(severity: EnrichedInsight['severity'], isCritical: boolean): string {
  if (isCritical) return 'Critical';
  if (severity === 'warning') return 'Warning';
  if (severity === 'recommendation') return 'Recommendation';
  return 'Info';
}

function categoryLabel(isCritical: boolean, bucket: string): string {
  if (isCritical) return 'Emergency';
  if (bucket === 'house_action') return 'House Fix';
  return 'Owner Update';
}

function excerpt(body: string): string {
  if (body.length <= 110) return body;
  return body.slice(0, 110).trimEnd() + '…';
}

function InsightCard({
  insight,
  onOpen,
  onDismiss,
}: {
  insight: EnrichedInsight;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const isCritical = Boolean(insight.payload.isCritical);
  const { severity } = insight;
  const badgeCls =
    isCritical ? styles.badgeCritical :
    severity === 'warning' ? styles.badgeWarning :
    severity === 'recommendation' ? styles.badgeRecommendation :
    styles.badgeInfo;

  return (
    <div
      className={`${styles.card}${isCritical ? ` ${styles.cardEmergency}` : ''}`}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
    >
      <div className={styles.cardTop}>
        <div className={styles.badgeRow}>
          <span className={`${styles.badge} ${badgeCls}`}>
            {severityLabel(severity, isCritical)}
          </span>
          <span className={styles.categoryChip}>
            {categoryLabel(isCritical, insight.payload.bucket)}
          </span>
          <span className={styles.sourceCount}>
            {insight.payload.sourceCount}{' '}
            {insight.payload.sourceCount === 1 ? 'mention' : 'mentions'}
          </span>
        </div>
        <button
          type="button"
          className={styles.dismissBtn}
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
      <div className={styles.cardTitle}>{insight.title}</div>
      <p className={styles.cardExcerpt}>{excerpt(insight.body)}</p>
      <div className={styles.propName}>{insight.propertyName}</div>
    </div>
  );
}

export function PulseBoard({ ownerUpdates, houseActions, propertyOptions, ownerOptions }: Props) {
  const [activeInsight, setActiveInsight] = useState<EnrichedInsight | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [confirmTarget, setConfirmTarget] = useState<EnrichedInsight | null>(null);
  const [filterProperty, setFilterProperty] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');

  const ownerPropertyIds = useMemo<Set<string> | null>(() => {
    if (!filterOwner) return null;
    const owner = ownerOptions.find((o) => o.id === filterOwner);
    return owner ? new Set(owner.propertyIds) : new Set();
  }, [filterOwner, ownerOptions]);

  const passes = (ins: EnrichedInsight): boolean => {
    if (dismissed.has(ins.id)) return false;
    if (filterProperty && ins.propertyId !== filterProperty) return false;
    if (ownerPropertyIds !== null && !ownerPropertyIds.has(ins.propertyId)) return false;
    if (filterSeverity) {
      if (filterSeverity === 'critical' && !ins.payload.isCritical) return false;
      if (filterSeverity !== 'critical' && ins.severity !== filterSeverity) return false;
    }
    return true;
  };

  const emergencies = houseActions.filter((i) => i.payload.isCritical && passes(i));
  const houseFixes = houseActions.filter((i) => !i.payload.isCritical && passes(i));
  const filteredOwner = ownerUpdates.filter(passes);

  const handleDismiss = (ins: EnrichedInsight) => {
    if (ins.payload.isCritical || ins.severity === 'warning') {
      setConfirmTarget(ins);
    } else {
      executeDismiss(ins.id);
    }
  };

  const executeDismiss = (id: string) => {
    setDismissed((prev) => new Set([...prev, id]));
    if (activeInsight?.id === id) setActiveInsight(null);
    dismissInsight(id).catch(console.error);
  };

  const columns = [
    { key: 'emergencies', label: 'Emergencies', labelMod: styles.colLabelEmergency, items: emergencies },
    { key: 'house', label: 'House Fixes', items: houseFixes },
    { key: 'owner', label: 'Owner Updates', items: filteredOwner },
  ] as const;

  return (
    <>
      {(propertyOptions.length > 1 || ownerOptions.length > 0) && (
        <div className={styles.filterBar}>
          {propertyOptions.length > 1 && (
            <select
              className={styles.filterSelect}
              value={filterProperty}
              onChange={(e) => { setFilterProperty(e.target.value); setFilterOwner(''); }}
            >
              <option value="">All properties</option>
              {propertyOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          {ownerOptions.length > 0 && (
            <select
              className={styles.filterSelect}
              value={filterOwner}
              onChange={(e) => { setFilterOwner(e.target.value); setFilterProperty(''); }}
            >
              <option value="">All owners</option>
              {ownerOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          )}
          <select
            className={styles.filterSelect}
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
          >
            <option value="">All severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="recommendation">Recommendation</option>
            <option value="info">Info</option>
          </select>
        </div>
      )}

      <div className={styles.cols}>
        {columns.map(({ key, label, items, ...rest }) => {
          const labelMod = 'labelMod' in rest ? rest.labelMod : undefined;
          return (
            <div key={key} className={styles.col}>
              <div className={`${styles.colLabel}${labelMod ? ` ${labelMod}` : ''}`}>
                {label}
                {items.length > 0 && <span className={styles.colCount}>({items.length})</span>}
              </div>
              <div className={styles.cardList}>
                {items.length === 0 ? (
                  <div className={styles.empty}>None right now.</div>
                ) : (
                  items.map((ins) => (
                    <InsightCard
                      key={ins.id}
                      insight={ins}
                      onOpen={() => setActiveInsight(ins)}
                      onDismiss={() => handleDismiss(ins)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activeInsight && (
        <InsightDetailPanel
          insight={activeInsight}
          payload={activeInsight.payload}
          propertyId={activeInsight.propertyId}
          propertyName={activeInsight.propertyName}
          onClose={() => setActiveInsight(null)}
          onDismiss={() => handleDismiss(activeInsight)}
          onComplete={() => {
            setDismissed((prev) => new Set([...prev, activeInsight.id]));
            setActiveInsight(null);
          }}
        />
      )}

      <ConfirmModal
        open={confirmTarget !== null}
        title="Dismiss this insight?"
        description="This insight is flagged as critical or a warning. Dismissing it removes it permanently."
        confirmLabel="Yes, dismiss"
        cancelLabel="Keep it"
        variant="danger"
        onConfirm={() => { if (confirmTarget) executeDismiss(confirmTarget.id); setConfirmTarget(null); }}
        onCancel={() => setConfirmTarget(null)}
      />
    </>
  );
}
```

- [ ] **Step 3: Create `guest-pulse/page.tsx`**

```tsx
// apps/web/src/app/(admin)/admin/guest-pulse/page.tsx
import type { Metadata } from 'next';
import { fetchPulsePageData, fetchGuestIntelligenceInsights } from '@/lib/admin/dashboard-data';
import { PulseBoard } from './PulseBoard';

export const metadata: Metadata = { title: 'Guest Pulse' };
export const dynamic = 'force-dynamic';

export default async function GuestPulsePage() {
  const { propertyRefs, ownerOptions } = await fetchPulsePageData();
  const { ownerUpdates, houseActions } = await fetchGuestIntelligenceInsights(propertyRefs);

  return (
    <div style={{ padding: '28px 32px' }}>
      <PulseBoard
        ownerUpdates={ownerUpdates}
        houseActions={houseActions}
        propertyOptions={propertyRefs}
        ownerOptions={ownerOptions}
      />
    </div>
  );
}
```

- [ ] **Step 4: Type check**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web && pnpm exec tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/\(admin\)/admin/guest-pulse/
git commit -m "feat: /admin/guest-pulse dedicated page with filter bar"
```

---

## Task 8: Property detail Pulse tab

**Files:**
- Create: `apps/web/src/app/(admin)/admin/properties/[id]/PulseTab.tsx`
- Modify: `apps/web/src/app/(admin)/admin/properties/[id]/PropertyDetailShell.tsx`
- Modify: `apps/web/src/app/(admin)/admin/properties/[id]/page.tsx`

- [ ] **Step 1: Create `PulseTab.tsx`**

```tsx
// apps/web/src/app/(admin)/admin/properties/[id]/PulseTab.tsx
import { fetchGuestIntelligenceInsights } from '@/lib/admin/dashboard-data';
import { PulseBoard } from '../../guest-pulse/PulseBoard';

export async function PulseTab({
  propertyId,
  propertyAddress,
}: {
  propertyId: string;
  propertyAddress: string;
}) {
  const { ownerUpdates, houseActions } = await fetchGuestIntelligenceInsights([
    { id: propertyId, name: propertyAddress },
  ]);

  return (
    <div style={{ padding: '24px' }}>
      <PulseBoard
        ownerUpdates={ownerUpdates}
        houseActions={houseActions}
        propertyOptions={[{ id: propertyId, name: propertyAddress }]}
        ownerOptions={[]}
      />
    </div>
  );
}
```

- [ ] **Step 2: Update `PropertyDetailShell.tsx`**

Change `TabKey`, `TAB_ORDER`, and `TAB_LABEL`:

```ts
type TabKey = "overview" | "tasks" | "maintenance" | "pulse";
const TAB_ORDER: TabKey[] = ["overview", "tasks", "maintenance", "pulse"];
const TAB_LABEL: Record<TabKey, string> = {
  overview: "Overview",
  tasks: "Tasks",
  maintenance: "Maintenance",
  pulse: "Pulse",
};
```

- [ ] **Step 3: Update `properties/[id]/page.tsx`**

Change `TabKey` and `KNOWN_TABS`:

```ts
type TabKey = "overview" | "tasks" | "maintenance" | "pulse";
const KNOWN_TABS: readonly TabKey[] = ["overview", "tasks", "maintenance", "pulse"];
```

Add import at the top (after existing imports):

```ts
import { PulseTab } from './PulseTab';
```

Add `pulse` branch in the JSX children (add before the `overview` fallback `<div>`):

```tsx
) : tab === "pulse" ? (
  <PulseTab
    propertyId={property.id}
    propertyAddress={property.address_line1 ?? property.name ?? 'Property'}
  />
```

Full updated children block:

```tsx
{tab === "tasks" ? (
  <TasksTab parentType="property" parentId={property.id} />
) : tab === "maintenance" ? (
  <div style={{ padding: "24px" }}>
    <MaintenanceTemplatesPanelServer propertyId={property.id} />
  </div>
) : tab === "pulse" ? (
  <PulseTab
    propertyId={property.id}
    propertyAddress={property.address_line1 ?? property.name ?? 'Property'}
  />
) : (
  <div
    style={{
      padding: "32px",
      background: "#F7FAFC",
      border: "1px dashed #D4DEE8",
      borderRadius: 14,
      color: "#647689",
      fontSize: 13.5,
      lineHeight: 1.6,
    }}
  >
    Detail view in progress. Recent activity is shown on the right.
  </div>
)}
```

- [ ] **Step 4: Type check**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web && pnpm exec tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/\(admin\)/admin/properties/\[id\]/
git commit -m "feat: Pulse tab on property detail page"
```

---

## Task 9: Manual verification

- [ ] **Step 1: Start dev server**

```bash
doppler run -- pnpm next dev -p 4000 --filter=web
```

(Run from `/Users/johanannunez/workspace/parcel`)

- [ ] **Step 2: Dashboard (`http://localhost:4000/admin`)**
  - Section header says "Guest Pulse"
  - Three columns: Emergencies / House Fixes / Owner Updates
  - Emergency column label is red, emergency cards have pink border/background
  - Cards show severity badge, category chip, source count, title, 2-line body excerpt, property address (not Hospitable name)
  - Clicking a card opens the side panel
  - Panel shows: "Mark complete" (primary), "Create task" (secondary), "Dismiss" (tertiary)
  - Dismiss on warning/critical shows ConfirmModal before proceeding
  - Dismiss on info/recommendation works immediately
  - Mark complete removes the card from the feed
  - Columns with more than 4 visible cards show "+N more — View all" link

- [ ] **Step 3: Dedicated page (`http://localhost:4000/admin/guest-pulse`)**
  - "Pulse" appears in sidebar nav
  - All three columns render with full card counts
  - Filter by property narrows all columns
  - Filter by owner narrows to that owner's properties
  - Filter by severity narrows correctly
  - Property filter and owner filter are mutually exclusive (selecting one clears the other)
  - All card/panel interactions work identically to the dashboard

- [ ] **Step 4: Property detail (`http://localhost:4000/admin/properties/[any-id]`)**
  - "Pulse" tab is visible after "Maintenance"
  - Clicking Pulse shows the three-column board for that one property
  - Board shows no filter bar (only one property, no owner options)
  - Interactions work

- [ ] **Step 5: Commit any fixes found during verification**

```bash
git add -p
git commit -m "fix: Guest Pulse verification fixes"
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|---|---|
| Rename Guest Intelligence → Guest Pulse | Task 4, 6 |
| Three columns (Emergencies / House Fixes / Owner Updates) | Task 4 |
| Rich cards with body excerpt | Task 4, 7 |
| Address instead of property name | Task 3, 6 |
| Mark complete (tracked separately) | Task 2, 5 |
| Dismiss confirmation for critical/warning | Task 4, 5, 7 |
| Dedicated `/admin/guest-pulse` page | Task 7 |
| Filter by property and owner | Task 7 |
| Sidebar nav item | Task 6 |
| Property detail Pulse tab | Task 8 |
| `completed_at` DB column | Task 1 |

All spec requirements covered.

**Placeholder check:** No TBD, TODO, or "similar to" references. All code blocks are complete.

**Type consistency check:**
- `EnrichedInsight` from `dashboard-data.ts` used consistently across all tasks.
- `PulseOwnerOption` exported from `dashboard-data.ts`, imported in `PulseBoard.tsx`.
- `completeInsight` defined in Task 2, imported in Task 5.
- `InsightDetailPanel` new props (`propertyName`, `onDismiss`, `onComplete`) defined in Task 5, used correctly in Task 4 and Task 7.
