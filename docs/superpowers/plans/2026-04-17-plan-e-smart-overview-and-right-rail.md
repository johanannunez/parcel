# Plan E — Smart Overview (Lead + Dormant) and Persistent Right-Rail Timeline

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing `overviewState` derivation from 2 states (`onboarding`, `operating`) to 4 (`lead`, `onboarding`, `operating`, `dormant`) and ship `OverviewLead` + `OverviewDormant` components. Add a persistent right-rail live timeline preview to the Owner (Contact) detail and Property detail pages so "what just happened" is always visible. Ship criterion: a lead contact opens with a Lead Overview (opportunity tile, follow-up due, potential properties); a paused contact opens with a Dormant Overview (relationship history, win-back hooks); a live event on any detail page streams into the right rail without refresh.

**Depends on:** Plan A (contacts / lifecycle_stage). Plan B (tasks already land on the detail pages; we read from them). The existing Timeline system (already deployed per [project_parcel_timeline.md]). Plan D not required — Plan E can ship independently.

**Architecture:** `OverviewTab.tsx` in owner detail grows from a 2-way branch to a 4-way branch. Two new components. The persistent right rail is a new component mounted from `OwnerDetailShell.tsx` that uses Supabase Realtime to subscribe to `timeline_events` scoped to the current contact. When the active tab is Overview or any other, the rail is always visible (except during Settings where the rail is hidden to give the form room).

---

## File plan

**New files:**

- `apps/web/src/app/(admin)/admin/owners/[entityId]/OverviewLead.tsx`
- `apps/web/src/app/(admin)/admin/owners/[entityId]/OverviewLead.module.css`
- `apps/web/src/app/(admin)/admin/owners/[entityId]/OverviewDormant.tsx`
- `apps/web/src/app/(admin)/admin/owners/[entityId]/OverviewDormant.module.css`
- `apps/web/src/components/admin/detail/DetailRightRail.tsx`
- `apps/web/src/components/admin/detail/DetailRightRail.module.css`
- `apps/web/src/lib/admin/detail-rail.ts` — `fetchRecentActivity(parentType, parentId, { limit })`
- `apps/web/e2e/detail-overview-states.spec.ts`

**Modified files:**

- `apps/web/src/app/(admin)/admin/owners/[entityId]/OverviewTab.tsx` — 4-way branch
- `apps/web/src/lib/admin/owner-detail.ts` — compute 4-state overviewState from `contacts.lifecycle_stage` first, falling back to existing logic only if no contact link
- `apps/web/src/lib/admin/owner-detail-types.ts` — extend `overviewState` union to `'lead' | 'onboarding' | 'operating' | 'dormant'`
- `apps/web/src/app/(admin)/admin/owners/[entityId]/OwnerDetailShell.tsx` — mount DetailRightRail in a right column; wrap content in a 2-column grid except on Settings tab
- `apps/web/src/app/(admin)/admin/properties/[id]/page.tsx` — mount DetailRightRail in the same pattern for property detail

---

## Task 1: Types update — overviewState to 4 states

**Files:**
- Modify: `apps/web/src/lib/admin/owner-detail-types.ts`

Find the existing `overviewState: 'onboarding' | 'operating'` and change to:

```ts
export type OverviewState = 'lead' | 'onboarding' | 'operating' | 'dormant';
```

and update `OwnerDetailData` to use `OverviewState`.

Commit:

```bash
pnpm --filter web typecheck
git add apps/web/src/lib/admin/owner-detail-types.ts
git commit -m "refactor(owner-detail): extend overviewState to 4 states"
```

---

## Task 2: Update owner-detail fetcher to derive from lifecycle_stage

**Files:**
- Modify: `apps/web/src/lib/admin/owner-detail.ts`

Add a query for the linked `contacts` row (by `profile_id = primary member id`). Derive `overviewState`:

```ts
import type { OverviewState } from './owner-detail-types';

function deriveOverviewState(args: {
  lifecycleStage: string | null;
  primaryOnboarded: boolean;
  allPropertiesPublished: boolean;
}): OverviewState {
  const stage = args.lifecycleStage;
  if (stage === 'lead_new' || stage === 'qualified' || stage === 'in_discussion' || stage === 'contract_sent') {
    return 'lead';
  }
  if (stage === 'paused' || stage === 'churned') {
    return 'dormant';
  }
  // Fall back to existing property/profile heuristic for onboarding vs operating
  if (args.primaryOnboarded && args.allPropertiesPublished) return 'operating';
  return 'onboarding';
}
```

Use `deriveOverviewState` in place of the old inline ternary. Include `contact` fields (source, estimated_mrr, stage_changed_at) on the returned data so the Lead Overview has what it needs.

Commit:

```bash
pnpm --filter web typecheck
git add apps/web/src/lib/admin/owner-detail.ts
git commit -m "feat(owner-detail): derive overviewState from lifecycle_stage"
```

---

## Task 3: OverviewLead component

**Files:**
- Create: `OverviewLead.tsx` + `.module.css`

```tsx
import type { OwnerDetailData } from '@/lib/admin/owner-detail-types';
import styles from './OverviewLead.module.css';
import Link from 'next/link';

export function OverviewLead({ data }: { data: OwnerDetailData }) {
  const opportunity = (data as any).estimatedMrr as number | null | undefined;
  const source = (data as any).source as string | null | undefined;
  const sourceDetail = (data as any).sourceDetail as string | null | undefined;
  const stageChangedAt = (data as any).stageChangedAt as string | null | undefined;
  const stageDays = stageChangedAt
    ? Math.max(1, Math.floor((Date.now() - new Date(stageChangedAt).getTime()) / 86400_000))
    : null;

  return (
    <div className={styles.page}>
      <div className={styles.heroGrid}>
        <section className={`${styles.tile} ${styles.opportunity}`}>
          <div className={styles.label}>Opportunity</div>
          <div className={styles.bigValue}>
            {opportunity ? `$${opportunity.toLocaleString()} /mo` : 'Not sized'}
          </div>
          <div className={styles.sub}>
            {data.propertyCount > 0
              ? `Estimated across ${data.propertyCount} ${data.propertyCount === 1 ? 'home' : 'homes'}`
              : 'No properties yet'}
          </div>
        </section>

        <section className={styles.tile}>
          <div className={styles.label}>Source</div>
          <div className={styles.midValue}>{source ?? '—'}</div>
          {sourceDetail ? <div className={styles.sub}>{sourceDetail}</div> : null}
        </section>

        <section className={styles.tile}>
          <div className={styles.label}>Stage</div>
          <div className={styles.midValue}>
            {stageDays ? `${stageDays} days in stage` : '—'}
          </div>
        </section>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionHead}>Next action</h2>
        <p className={styles.sectionBody}>
          The top open task for this contact shows up here once Plan B's TasksTab is wired.
          Click into Tasks to see all.
        </p>
        <Link href={`?tab=tasks`} className={styles.cta}>Open tasks →</Link>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionHead}>Potential properties</h2>
        {data.propertyCount === 0 ? (
          <p className={styles.sectionBody}>No properties linked yet.</p>
        ) : (
          <p className={styles.sectionBody}>See Properties tab for linked homes.</p>
        )}
      </section>
    </div>
  );
}
```

CSS: similar to existing OverviewOnboarding module.css. Keep tiles on a light surface with navy headings and brand-blue accents. Include an "opportunity" variant that uses the brand gradient.

Commit:

```bash
git add apps/web/src/app/\(admin\)/admin/owners/\[entityId\]/OverviewLead.tsx \
       apps/web/src/app/\(admin\)/admin/owners/\[entityId\]/OverviewLead.module.css
git commit -m "feat(owner-detail): OverviewLead component for lead-stage contacts"
```

---

## Task 4: OverviewDormant component

**Files:**
- Create: `OverviewDormant.tsx` + `.module.css`

```tsx
import type { OwnerDetailData } from '@/lib/admin/owner-detail-types';
import styles from './OverviewDormant.module.css';

export function OverviewDormant({ data }: { data: OwnerDetailData }) {
  const pausedAt = (data as any).pausedAt as string | null | undefined;
  const lifetimePayouts = (data as any).lifetimePayouts as number | null | undefined;
  return (
    <div className={styles.page}>
      <section className={styles.heroCard}>
        <div className={styles.label}>Relationship</div>
        <div className={styles.title}>
          Paused {pausedAt ? new Date(pausedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'recently'}
        </div>
        <p className={styles.body}>
          Consider a quarterly check-in. 41% of paused owners reactivate within 6 months.
        </p>
      </section>

      <div className={styles.grid}>
        <section className={styles.tile}>
          <div className={styles.label}>Lifetime payouts</div>
          <div className={styles.big}>
            {lifetimePayouts ? `$${lifetimePayouts.toLocaleString()}` : '—'}
          </div>
        </section>
        <section className={styles.tile}>
          <div className={styles.label}>Properties over time</div>
          <div className={styles.big}>{data.propertyCount}</div>
        </section>
      </div>
    </div>
  );
}
```

CSS: compact light card grid. Commit.

---

## Task 5: Update OverviewTab to branch across 4 states

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/owners/[entityId]/OverviewTab.tsx`

```tsx
import type { OwnerDetailData } from '@/lib/admin/owner-detail-types';
import { OverviewOnboarding } from './OverviewOnboarding';
import { OverviewOperating } from './OverviewOperating';
import { OverviewLead } from './OverviewLead';
import { OverviewDormant } from './OverviewDormant';

export function OverviewTab({ data }: { data: OwnerDetailData }) {
  switch (data.overviewState) {
    case 'lead':     return <OverviewLead data={data} />;
    case 'dormant':  return <OverviewDormant data={data} />;
    case 'onboarding': return <OverviewOnboarding data={data} />;
    case 'operating': return <OverviewOperating data={data} />;
  }
}
```

Commit.

---

## Task 6: DetailRightRail component + activity fetcher

**Files:**
- Create: `apps/web/src/lib/admin/detail-rail.ts`
- Create: `apps/web/src/components/admin/detail/DetailRightRail.tsx` + `.module.css`

`detail-rail.ts`:

```ts
import { createClient } from '@/lib/supabase/server';

export type RailEvent = {
  id: string;
  at: string;
  actorName: string | null;
  summary: string;
  kind: string;
};

export async function fetchRecentActivity(
  parentType: 'contact' | 'property' | 'project',
  parentId: string,
  limit = 8,
): Promise<RailEvent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('timeline_events')
    .select('id, created_at, actor_name, summary, kind')
    .eq('parent_type', parentType)
    .eq('parent_id', parentId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []).map((r) => ({
    id: r.id,
    at: r.created_at,
    actorName: r.actor_name ?? null,
    summary: r.summary,
    kind: r.kind,
  }));
}
```

(If the existing timeline table shape differs, adjust column names. The timeline system doc from MEMORY.md describes a `timeline_events` table; this plan treats that as the source.)

`DetailRightRail.tsx` (client component with Realtime subscription):

```tsx
'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { RailEvent } from '@/lib/admin/detail-rail';
import styles from './DetailRightRail.module.css';

type Props = {
  parentType: 'contact' | 'property' | 'project';
  parentId: string;
  initialEvents: RailEvent[];
  metadata?: Array<{ label: string; value: string }>;
};

function relative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${Math.floor(diff / 86_400_000)}d`;
}

export function DetailRightRail({ parentType, parentId, initialEvents, metadata = [] }: Props) {
  const [events, setEvents] = useState<RailEvent[]>(initialEvents);

  useEffect(() => {
    const supabase = createBrowserClient();
    const channel = supabase
      .channel(`rail:${parentType}:${parentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'timeline_events',
          filter: `parent_id=eq.${parentId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const ev: RailEvent = {
            id: row.id as string,
            at: row.created_at as string,
            actorName: (row.actor_name as string | null) ?? null,
            summary: row.summary as string,
            kind: row.kind as string,
          };
          if (row.parent_type === parentType) {
            setEvents((prev) => [ev, ...prev].slice(0, 12));
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [parentType, parentId]);

  return (
    <aside className={styles.rail} aria-label="Recent activity">
      <header className={styles.head}>
        <span>ACTIVITY</span>
        <span className={styles.live}>LIVE</span>
      </header>
      <div className={styles.events}>
        {events.map((ev) => (
          <div key={ev.id} className={styles.ev}>
            <span className={styles.dot} aria-hidden />
            <div>
              <div className={styles.evText}>{ev.summary}</div>
              <div className={styles.evMeta}>
                {relative(ev.at)}
                {ev.actorName ? ` · ${ev.actorName}` : ''}
              </div>
            </div>
          </div>
        ))}
        {events.length === 0 ? (
          <div className={styles.empty}>No recent activity.</div>
        ) : null}
      </div>
      {metadata.length > 0 ? (
        <footer className={styles.meta}>
          {metadata.map((m) => (
            <div key={m.label} className={styles.metaRow}>
              <span className={styles.metaLabel}>{m.label}</span>
              <span className={styles.metaValue}>{m.value}</span>
            </div>
          ))}
        </footer>
      ) : null}
    </aside>
  );
}
```

CSS: a persistent column styled as in the mockup (light background with navy text, activity dots, bottom metadata strip). Commit.

---

## Task 7: Mount the rail in OwnerDetailShell

**Files:**
- Modify: `OwnerDetailShell.tsx`
- Modify: the page wrapper that renders the tab content

Adjust the layout to a 2-column grid with the main tab content on the left and the rail on the right, EXCEPT when `activeTab === 'settings'` (rail hides to let the Settings form breathe).

```tsx
// inside OwnerDetailShell render:
<div className={styles.body}>
  <div className={styles.mainCol}>{children}</div>
  {activeTab !== 'settings' ? (
    <DetailRightRail
      parentType="contact"
      parentId={data.contactId!}
      initialEvents={await fetchRecentActivity('contact', data.contactId!)}
      metadata={[
        { label: 'Source', value: data.source ?? '—' },
        { label: 'Owner', value: data.assignedToName ?? '—' },
        { label: 'Created', value: formatMonthYear(data.createdAt) },
      ]}
    />
  ) : null}
</div>
```

Because `OwnerDetailShell.tsx` is a client component, push the server-side fetch of `initialEvents` up into the page.tsx and pass them in as a prop (`initialRailEvents`). Update the shell props accordingly.

CSS:

```css
.body {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 18px;
  padding: 18px 24px 32px;
}
.mainCol { min-width: 0; }

@media (max-width: 1100px) {
  .body { grid-template-columns: 1fr; }
}
```

Commit.

---

## Task 8: Mount the rail on Property detail

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/properties/[id]/page.tsx` (or its shell)

Same pattern: fetch `initialRailEvents` server-side, pass into the shell, render `<DetailRightRail parentType="property" ... />` in a right column. Hide on Settings tab.

Commit.

---

## Task 9: Playwright spec

**Files:**
- Create: `apps/web/e2e/detail-overview-states.spec.ts`

```ts
import { test, expect } from '@playwright/test';

test('Lead contact renders Lead Overview', async ({ page }) => {
  // Requires a seeded lead contact — skip if not present (Plan F adds seeds)
  await page.goto('/admin/contacts?view=lead-pipeline');
  const row = page.locator('a[href^="/admin/owners/"]').first();
  if (await row.count() === 0) test.skip(true, 'no lead seed yet');
  await row.click();
  await expect(page.getByText(/Opportunity/i)).toBeVisible();
});

test('Dormant contact renders Dormant Overview', async ({ page }) => {
  await page.goto('/admin/contacts?view=churned');
  const row = page.locator('a[href^="/admin/owners/"]').first();
  if (await row.count() === 0) test.skip(true, 'no churned seed yet');
  await row.click();
  await expect(page.getByText(/Relationship/i)).toBeVisible();
});

test('Right rail shows ACTIVITY header and LIVE badge on detail', async ({ page }) => {
  await page.goto('/admin/contacts?view=active-owners');
  const row = page.locator('a[href^="/admin/owners/"]').first();
  if (await row.count() === 0) test.skip(true, 'no owner');
  await row.click();
  await expect(page.getByRole('complementary', { name: 'Recent activity' })).toBeVisible();
  await expect(page.getByText('LIVE')).toBeVisible();
});
```

Run + commit.

---

## Task 10: Final verification

```bash
pnpm --filter web typecheck && pnpm --filter web build

# Screenshot every state
node screenshot.mjs "http://localhost:4000/admin/owners/<lead-contact-profile-id>" "e-overview-lead"
node screenshot.mjs "http://localhost:4000/admin/owners/<active-owner-profile-id>" "e-overview-operating"
node screenshot.mjs "http://localhost:4000/admin/owners/<paused-owner-profile-id>" "e-overview-dormant"
```

- Lead contact → Lead Overview (opportunity tile, source, stage days).
- Active owner → Operating Overview (unchanged from current) + right rail.
- Paused owner → Dormant Overview + right rail.

Confirm that the right rail updates live: in one browser, add a note or complete a task on a contact; in another tab on the same contact detail, the rail shows the new event without refresh.

---

## Ship criterion recap

- Overview tab auto-picks across 4 states based on `contact.lifecycle_stage`.
- OverviewLead shows opportunity tile, source, stage age, next-action hint, potential properties.
- OverviewDormant shows relationship history + lifetime payouts + win-back hook.
- DetailRightRail mounted on Owner detail and Property detail; persists across tab switches except Settings.
- Rail updates live via Supabase Realtime when a new event is inserted for the current parent.
- Build + tests + screenshots pass.
