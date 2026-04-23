# Operational Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Parcel admin dashboard with a four-section operational command center: property health grid, attention queue, task surface, and AI-powered guest intelligence.

**Architecture:** Server components fetch all data in parallel on page load. The guest intelligence section is backed by an API route (`/api/cron/guest-intelligence`) that runs on demand (Refresh button) and via Vercel cron (twice daily). Results are stored in the existing `ai_insights` table and read server-side. All UI is built in an isolated git worktree first; merged to main only after preview approval.

**Tech Stack:** Next.js 16 App Router, Supabase (server client), CSS Modules, Tailwind CSS 4, Phosphor Icons, Anthropic SDK (`@anthropic-ai/sdk`), Vercel cron.

---

## Pre-flight: What already exists

- `apps/web/src/lib/checklist.ts` — `CHECKLIST_TEMPLATE` (32 items), `ChecklistStatus` type (`not_started | in_progress | pending_owner | stuck | completed`), `ChecklistCategory` type (`documents | finances | listings`)
- `apps/web/src/lib/admin/ai-insights.ts` — `fetchInsightsByParent()`, `Insight` type, `InsightSeverity` type
- `apps/web/src/lib/admin/task-types.ts` — `Task`, `TaskGroup`, `TaskParent` types
- `apps/web/src/lib/admin/tasks-list.ts` — `fetchAdminTasksList()`
- `apps/web/src/lib/hospitable.ts` — `getProperties()`, `getReservations()`, `getCalendar()`, `hasHospitable()`
- `apps/web/src/lib/admin/task-actions.ts` — `completeTask()`, `uncompleteTask()` (server actions)
- `apps/web/src/app/(admin)/admin/tasks/TaskRow.tsx` — existing task row with avatar, due date, completion toggle
- `apps/web/supabase/migrations/20260420_ai_insights.sql` — `ai_insights` table with `action_payload jsonb` column (use this for rich metadata — no new migration needed)
- `ai_insights` unique constraint: `(parent_type, parent_id, agent_key)` — use prefixed agent keys (`guest_intelligence:owner:0`, `guest_intelligence:house:0`) and delete old ones before insert

**Important constraints:**
- Apply any new migrations via Supabase MCP `apply_migration` tool — NOT the CLI
- `pnpm exec tsc --noEmit` for type checking (no `typecheck` script)
- Dev port is 4000 (`doppler run -- next dev -p 4000`); worktree runs on 4001

---

## File Map

### New files

| File | Responsibility |
|------|---------------|
| `apps/web/src/lib/admin/dashboard-data.ts` | Server-side data fetch for Sections 1 + 2 (property health + attention queue) |
| `apps/web/src/lib/admin/dashboard-tasks.ts` | Fetch overdue/due-today tasks for Section 3 |
| `apps/web/src/lib/admin/guest-intelligence.ts` | Claude prompt, Hospitable fetch orchestration, Supabase write for Section 4 |
| `apps/web/src/lib/admin/insight-actions.ts` | Server actions: dismiss insight, create task + subtasks from insight |
| `apps/web/src/app/(admin)/admin/PropertyHealthGrid.tsx` | Section 1 UI — property cards with category indicators |
| `apps/web/src/app/(admin)/admin/PropertyHealthGrid.module.css` | Styles for Section 1 |
| `apps/web/src/app/(admin)/admin/AttentionQueue.tsx` | Section 2 UI — blocked items grouped by bucket |
| `apps/web/src/app/(admin)/admin/AttentionQueue.module.css` | Styles for Section 2 |
| `apps/web/src/app/(admin)/admin/DashboardTaskSurface.tsx` | Section 3 UI — compact task list with tabs (client component for tab switching) |
| `apps/web/src/app/(admin)/admin/DashboardTaskSurface.module.css` | Styles for Section 3 |
| `apps/web/src/app/(admin)/admin/GuestIntelligence.tsx` | Section 4 UI — two-column insight cards + Refresh button (client) |
| `apps/web/src/app/(admin)/admin/GuestIntelligence.module.css` | Styles for Section 4 |
| `apps/web/src/app/(admin)/admin/InsightDetailPanel.tsx` | Slide-in detail panel: issue, severity reason, sources, fixes, actions |
| `apps/web/src/app/(admin)/admin/InsightDetailPanel.module.css` | Styles for detail panel |
| `apps/web/src/app/api/cron/guest-intelligence/route.ts` | POST handler — runs guest intelligence sync, protected by `CRON_SECRET` |

### Modified files

| File | Change |
|------|--------|
| `apps/web/src/app/(admin)/admin/page.tsx` | Replace stat cards + timeline with four new sections |
| `apps/web/src/lib/hospitable.ts` | Add `getPropertyReviews()` and `getPropertyMessages()` |
| `apps/web/vercel.json` (create if absent) | Add cron config: `0 5,15 * * *` → `/api/cron/guest-intelligence` |

---

## Phase 1: Worktree + Property Health Grid + Attention Queue

### Task 1: Create worktree

- [ ] **Step 1: Create the git worktree**

```bash
cd /Users/johanannunez/workspace/parcel
git worktree add ../parcel-dashboard-preview -b feat/operational-dashboard
```

- [ ] **Step 2: Verify it was created**

```bash
git worktree list
```

Expected output includes `parcel-dashboard-preview` on branch `feat/operational-dashboard`.

- [ ] **Step 3: Install dependencies in worktree**

```bash
cd /Users/johanannunez/workspace/parcel-dashboard-preview
pnpm install
```

- [ ] **Step 4: Start dev server on port 4001**

```bash
cd apps/web && doppler run -- next dev -p 4001
```

Verify `http://localhost:4001/admin` loads. Leave running in background for the duration of Phase 1.

---

### Task 2: Dashboard data fetcher (Sections 1 + 2)

**Files:**
- Create: `apps/web/src/lib/admin/dashboard-data.ts`

- [ ] **Step 1: Create the file**

```typescript
// apps/web/src/lib/admin/dashboard-data.ts
import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { ChecklistStatus, ChecklistCategory } from '@/lib/checklist';

export type CategoryHealth = {
  done: number;
  total: number;
  worst: ChecklistStatus | null; // null means all completed
};

export type PropertyHealthCard = {
  id: string;
  name: string;
  city: string;
  state: string;
  coverPhotoUrl: string | null;
  href: string;
  documents: CategoryHealth;
  finances: CategoryHealth;
  listings: CategoryHealth;
  worstOverall: 'green' | 'amber' | 'red';
};

export type AttentionItem = {
  propertyId: string;
  propertyName: string;
  propertyHref: string;
  category: ChecklistCategory;
  itemLabel: string;
  status: 'pending_owner' | 'stuck' | 'in_progress';
  daysInStatus: number;
};

const CATEGORY_TOTALS: Record<ChecklistCategory, number> = {
  documents: 10,
  finances: 6,
  listings: 16,
};

const STATUS_RANK: Record<ChecklistStatus, number> = {
  completed: -1,
  not_started: 0,
  in_progress: 1,
  pending_owner: 2,
  stuck: 3,
};

function worstStatus(statuses: ChecklistStatus[]): ChecklistStatus | null {
  const active = statuses.filter((s) => s !== 'completed');
  if (active.length === 0) return null;
  return active.reduce((a, b) => (STATUS_RANK[b] > STATUS_RANK[a] ? b : a));
}

function worstColor(status: ChecklistStatus | null): 'green' | 'amber' | 'red' {
  if (!status) return 'green';
  if (status === 'stuck') return 'red';
  return 'amber';
}

function overallColor(colors: Array<'green' | 'amber' | 'red'>): 'green' | 'amber' | 'red' {
  if (colors.includes('red')) return 'red';
  if (colors.includes('amber')) return 'amber';
  return 'green';
}

export async function fetchDashboardData(): Promise<{
  propertyCards: PropertyHealthCard[];
  attentionItems: AttentionItem[];
}> {
  const supabase = await createClient();

  const [{ data: properties }, { data: items }] = await Promise.all([
    supabase
      .from('properties')
      .select('id, nickname, street, city, state, cover_photo_url')
      .eq('active', true)
      .order('nickname', { ascending: true, nullsFirst: false }),
    supabase
      .from('property_checklist_items')
      .select('property_id, category, item_key, label, status, updated_at'),
  ]);

  if (!properties?.length) return { propertyCards: [], attentionItems: [] };

  const propIds = new Set(properties.map((p) => p.id));

  // Group items by property
  const byProp = new Map<string, typeof items>();
  for (const item of items ?? []) {
    if (!propIds.has(item.property_id)) continue;
    if (!byProp.has(item.property_id)) byProp.set(item.property_id, []);
    byProp.get(item.property_id)!.push(item);
  }

  const propertyCards: PropertyHealthCard[] = [];
  const attentionItems: AttentionItem[] = [];

  for (const p of properties) {
    const all = byProp.get(p.id) ?? [];
    const name = p.nickname ?? p.street;

    const cats: ChecklistCategory[] = ['documents', 'finances', 'listings'];
    const catHealth: Record<ChecklistCategory, CategoryHealth> = {} as Record<ChecklistCategory, CategoryHealth>;

    for (const cat of cats) {
      const catItems = all.filter((i) => i.category === cat);
      const worst = worstStatus(catItems.map((i) => i.status as ChecklistStatus));
      catHealth[cat] = {
        done: catItems.filter((i) => i.status === 'completed').length,
        total: CATEGORY_TOTALS[cat],
        worst,
      };
    }

    const colors = cats.map((c) => worstColor(catHealth[c].worst));
    propertyCards.push({
      id: p.id,
      name,
      city: p.city,
      state: p.state,
      coverPhotoUrl: p.cover_photo_url ?? null,
      href: `/admin/properties/${p.id}?view=launchpad`,
      documents: catHealth.documents,
      finances: catHealth.finances,
      listings: catHealth.listings,
      worstOverall: overallColor(colors),
    });

    // Collect attention items
    const nonDone = all.filter((i) =>
      ['pending_owner', 'stuck', 'in_progress'].includes(i.status),
    );
    for (const item of nonDone) {
      const days = Math.floor(
        (Date.now() - new Date(item.updated_at).getTime()) / 86_400_000,
      );
      attentionItems.push({
        propertyId: p.id,
        propertyName: name,
        propertyHref: `/admin/properties/${p.id}?view=launchpad`,
        category: item.category as ChecklistCategory,
        itemLabel: item.label,
        status: item.status as 'pending_owner' | 'stuck' | 'in_progress',
        daysInStatus: Math.max(0, days),
      });
    }
  }

  // Sort attention: stuck first, then pending_owner, then in_progress; within each by days desc
  const ORDER = { stuck: 0, pending_owner: 1, in_progress: 2 };
  attentionItems.sort((a, b) =>
    ORDER[a.status] !== ORDER[b.status]
      ? ORDER[a.status] - ORDER[b.status]
      : b.daysInStatus - a.daysInStatus,
  );

  return { propertyCards, attentionItems };
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/johanannunez/workspace/parcel-dashboard-preview/apps/web
pnpm exec tsc --noEmit 2>&1 | grep dashboard-data
```

Expected: no output (no errors).

- [ ] **Step 3: Commit**

```bash
cd /Users/johanannunez/workspace/parcel-dashboard-preview
git add apps/web/src/lib/admin/dashboard-data.ts
git commit -m "feat: dashboard data fetcher for property health + attention queue"
```

---

### Task 3: Property Health Grid component

**Files:**
- Create: `apps/web/src/app/(admin)/admin/PropertyHealthGrid.tsx`
- Create: `apps/web/src/app/(admin)/admin/PropertyHealthGrid.module.css`

- [ ] **Step 1: Create the CSS module**

```css
/* apps/web/src/app/(admin)/admin/PropertyHealthGrid.module.css */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.card {
  border-radius: 14px;
  border: 1.5px solid #e5e7eb;
  overflow: hidden;
  background: #fff;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  transition: box-shadow 140ms ease, border-color 140ms ease;
}
.card:hover { box-shadow: 0 4px 20px rgba(2,170,235,0.10); }

.cardRed   { border-color: rgba(239,68,68,0.35); }
.cardAmber { border-color: rgba(245,158,11,0.35); }
.cardGreen { border-color: rgba(34,197,94,0.25); }

.cover {
  width: 100%;
  height: 110px;
  object-fit: cover;
  background: linear-gradient(135deg, #0F3B6B 0%, #02AAEB 100%);
  display: block;
}

.body {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.name {
  font-size: 13.5px;
  font-weight: 600;
  color: #0F3B6B;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.location {
  font-size: 11.5px;
  color: #6b7280;
  margin-top: 1px;
}

.cats {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.catRow {
  display: flex;
  align-items: center;
  gap: 8px;
}

.catLabel {
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9ca3af;
  width: 68px;
  flex-shrink: 0;
}

.track {
  flex: 1;
  height: 5px;
  border-radius: 99px;
  background: #f3f4f6;
  overflow: hidden;
}

.fill {
  height: 100%;
  border-radius: 99px;
  transition: width 400ms ease;
}

.fillGreen { background: #22c55e; }
.fillAmber { background: #f59e0b; }
.fillRed   { background: #ef4444; }

.catCount {
  font-size: 10.5px;
  color: #9ca3af;
  width: 28px;
  text-align: right;
  flex-shrink: 0;
}

.empty {
  color: #9ca3af;
  font-size: 13px;
  padding: 24px 0;
  text-align: center;
}
```

- [ ] **Step 2: Create the component**

```typescript
// apps/web/src/app/(admin)/admin/PropertyHealthGrid.tsx
import Link from 'next/link';
import Image from 'next/image';
import type { PropertyHealthCard, CategoryHealth } from '@/lib/admin/dashboard-data';
import styles from './PropertyHealthGrid.module.css';

function CategoryBar({ health, color }: { health: CategoryHealth; color: 'green' | 'amber' | 'red' }) {
  const pct = health.total > 0 ? Math.round((health.done / health.total) * 100) : 0;
  return (
    <div className={styles.track}>
      <div
        className={`${styles.fill} ${
          color === 'red' ? styles.fillRed :
          color === 'amber' ? styles.fillAmber :
          styles.fillGreen
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function PropertyCard({ card }: { card: PropertyHealthCard }) {
  const borderCls =
    card.worstOverall === 'red' ? styles.cardRed :
    card.worstOverall === 'amber' ? styles.cardAmber :
    styles.cardGreen;

  const docColor = card.documents.worst === 'stuck' ? 'red' : card.documents.worst ? 'amber' : 'green';
  const finColor = card.finances.worst === 'stuck' ? 'red' : card.finances.worst ? 'amber' : 'green';
  const listColor = card.listings.worst === 'stuck' ? 'red' : card.listings.worst ? 'amber' : 'green';

  return (
    <Link href={card.href} className={`${styles.card} ${borderCls}`}>
      {card.coverPhotoUrl ? (
        <Image src={card.coverPhotoUrl} alt={card.name} width={400} height={110} className={styles.cover} />
      ) : (
        <div className={styles.cover} />
      )}
      <div className={styles.body}>
        <div>
          <div className={styles.name}>{card.name}</div>
          <div className={styles.location}>{card.city}, {card.state}</div>
        </div>
        <div className={styles.cats}>
          {(
            [
              { label: 'Docs', health: card.documents, color: docColor },
              { label: 'Finance', health: card.finances, color: finColor },
              { label: 'Listings', health: card.listings, color: listColor },
            ] as const
          ).map(({ label, health, color }) => (
            <div key={label} className={styles.catRow}>
              <span className={styles.catLabel}>{label}</span>
              <CategoryBar health={health} color={color} />
              <span className={styles.catCount}>{health.done}/{health.total}</span>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}

export function PropertyHealthGrid({ cards }: { cards: PropertyHealthCard[] }) {
  if (cards.length === 0) {
    return <p className={styles.empty}>No active properties yet.</p>;
  }
  return (
    <div className={styles.grid}>
      {cards.map((card) => (
        <PropertyCard key={card.id} card={card} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

```bash
cd /Users/johanannunez/workspace/parcel-dashboard-preview/apps/web
pnpm exec tsc --noEmit 2>&1 | grep -E "PropertyHealth|dashboard-data"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
cd /Users/johanannunez/workspace/parcel-dashboard-preview
git add apps/web/src/app/\(admin\)/admin/PropertyHealthGrid.tsx
git add apps/web/src/app/\(admin\)/admin/PropertyHealthGrid.module.css
git commit -m "feat: PropertyHealthGrid component"
```

---

### Task 4: Attention Queue component

**Files:**
- Create: `apps/web/src/app/(admin)/admin/AttentionQueue.tsx`
- Create: `apps/web/src/app/(admin)/admin/AttentionQueue.module.css`

- [ ] **Step 1: Create the CSS module**

```css
/* apps/web/src/app/(admin)/admin/AttentionQueue.module.css */
.wrap { display: flex; flex-direction: column; gap: 24px; }

.bucket { display: flex; flex-direction: column; gap: 0; }

.bucketHeader {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 0 8px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dotRed   { background: #ef4444; }
.dotAmber { background: #f59e0b; }
.dotBlue  { background: #02AAEB; }

.bucketLabel {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #6b7280;
}

.bucketCount {
  font-size: 10.5px;
  color: #9ca3af;
}

.list {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

.row {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  align-items: center;
  gap: 12px;
  padding: 11px 16px;
  border-top: 1px solid #f3f4f6;
  text-decoration: none;
  transition: background 100ms ease;
}
.row:first-child { border-top: none; }
.row:hover { background: #fafbfc; }

.rowMain { display: flex; flex-direction: column; gap: 2px; min-width: 0; }

.itemLabel {
  font-size: 13px;
  font-weight: 500;
  color: #0F3B6B;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.propName {
  font-size: 11px;
  color: #9ca3af;
}

.catBadge {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 2px 7px;
  border-radius: 6px;
  background: #f3f4f6;
  color: #6b7280;
  white-space: nowrap;
}

.days {
  font-size: 11.5px;
  color: #9ca3af;
  white-space: nowrap;
  min-width: 50px;
  text-align: right;
}

.arrow {
  color: #d1d5db;
  font-size: 14px;
}

.allClear {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  color: #15803d;
  font-size: 13px;
  font-weight: 500;
}
```

- [ ] **Step 2: Create the component**

```typescript
// apps/web/src/app/(admin)/admin/AttentionQueue.tsx
import Link from 'next/link';
import type { AttentionItem } from '@/lib/admin/dashboard-data';
import styles from './AttentionQueue.module.css';

type Bucket = { status: AttentionItem['status']; label: string; dotCls: string };

const BUCKETS: Bucket[] = [
  { status: 'stuck',         label: 'Stuck',               dotCls: styles.dotRed   },
  { status: 'pending_owner', label: 'Owner needs to act',  dotCls: styles.dotAmber },
  { status: 'in_progress',   label: 'In progress',         dotCls: styles.dotBlue  },
];

function formatDays(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return '1 day';
  return `${days}d`;
}

export function AttentionQueue({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <div className={styles.allClear}>
        <span>✓</span>
        <span>All checklist items are clear. Great work.</span>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {BUCKETS.map((bucket) => {
        const bucketItems = items.filter((i) => i.status === bucket.status);
        if (bucketItems.length === 0) return null;
        return (
          <div key={bucket.status} className={styles.bucket}>
            <div className={styles.bucketHeader}>
              <span className={`${styles.dot} ${bucket.dotCls}`} />
              <span className={styles.bucketLabel}>{bucket.label}</span>
              <span className={styles.bucketCount}>({bucketItems.length})</span>
            </div>
            <div className={styles.list}>
              {bucketItems.map((item, i) => (
                <Link
                  key={`${item.propertyId}-${item.itemLabel}-${i}`}
                  href={item.propertyHref}
                  className={styles.row}
                >
                  <div className={styles.rowMain}>
                    <span className={styles.itemLabel}>{item.itemLabel}</span>
                    <span className={styles.propName}>{item.propertyName}</span>
                  </div>
                  <span className={styles.catBadge}>{item.category}</span>
                  <span className={styles.days}>{formatDays(item.daysInStatus)}</span>
                  <span className={styles.arrow}>›</span>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/johanannunez/workspace/parcel-dashboard-preview
git add apps/web/src/app/\(admin\)/admin/AttentionQueue.tsx
git add apps/web/src/app/\(admin\)/admin/AttentionQueue.module.css
git commit -m "feat: AttentionQueue component"
```

---

### Task 5: Wire Sections 1 + 2 into dashboard page

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/page.tsx`

- [ ] **Step 1: Replace the page content**

Replace the entire file with:

```typescript
// apps/web/src/app/(admin)/admin/page.tsx
import type { Metadata } from 'next';
import { fetchDashboardData } from '@/lib/admin/dashboard-data';
import { PropertyHealthGrid } from './PropertyHealthGrid';
import { AttentionQueue } from './AttentionQueue';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const { propertyCards, attentionItems } = await fetchDashboardData();

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Property Health</h2>
        <PropertyHealthGrid cards={propertyCards} />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Attention Queue</h2>
        <AttentionQueue items={attentionItems} />
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Create or update `page.module.css`** (add to existing, or create if absent)

Check if `page.module.css` exists:
```bash
ls apps/web/src/app/\(admin\)/admin/page.module.css 2>/dev/null || echo "absent"
```

If absent, create it. If present, add these classes (do not remove existing ones):

```css
/* apps/web/src/app/(admin)/admin/page.module.css */
.page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px 80px;
  display: flex;
  flex-direction: column;
  gap: 48px;
}

.section { display: flex; flex-direction: column; gap: 16px; }

.sectionTitle {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #9ca3af;
}
```

- [ ] **Step 3: Type-check the page**

```bash
cd /Users/johanannunez/workspace/parcel-dashboard-preview/apps/web
pnpm exec tsc --noEmit 2>&1 | grep -v "node_modules" | grep -v "ContactsMapView"
```

Expected: no new errors.

- [ ] **Step 4: Screenshot the dashboard at localhost:4001/admin**

```bash
cd /Users/johanannunez/workspace/parcel-dashboard-preview/apps/web
node screenshot.mjs http://localhost:4001/admin "dashboard-phase1" 2>/dev/null || \
  node /Users/johanannunez/workspace/parcel/apps/web/screenshot.mjs http://localhost:4001/admin "dashboard-phase1"
```

Read the screenshot and verify both sections render.

- [ ] **Step 5: Commit**

```bash
cd /Users/johanannunez/workspace/parcel-dashboard-preview
git add apps/web/src/app/\(admin\)/admin/page.tsx apps/web/src/app/\(admin\)/admin/page.module.css
git commit -m "feat: wire property health grid + attention queue into dashboard"
```

---

## Phase 2: Task Surface

### Task 6: Task surface data fetcher

**Files:**
- Create: `apps/web/src/lib/admin/dashboard-tasks.ts`

- [ ] **Step 1: Create the file**

```typescript
// apps/web/src/lib/admin/dashboard-tasks.ts
import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { Task } from '@/lib/admin/task-types';

export type DashboardTask = Task & {
  propertyName: string | null;
};

export type DashboardTaskFilter = 'all' | 'overdue' | 'today' | 'payouts' | 'maintenance';

const PAYOUT_KEYWORDS = ['payout', 'payment', 'pay out', 'transfer', 'disbursement', 'airbnb', 'vrbo', 'hospitable'];
const MAINTENANCE_KEYWORDS = ['maintenance', 'repair', 'fix', 'replace', 'broken', 'cleaning', 'hvac', 'plumbing', 'electrical', 'lawn', 'pest'];

function matchesKeywords(title: string, keywords: string[]): boolean {
  const lower = title.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

export async function fetchDashboardTasks(): Promise<DashboardTask[]> {
  const supabase = await createClient();

  // Fetch tasks: not done, due within next 48h or already overdue
  const cutoff = new Date(Date.now() + 48 * 3600_000).toISOString();

  const { data: tasks } = await supabase
    .from('tasks')
    .select(`
      id, parent_task_id, parent_type, parent_id, title, description, status,
      assignee_id, created_by, due_at, completed_at, created_at,
      assignee:profiles!tasks_assignee_id_fkey(full_name, avatar_url),
      creator:profiles!tasks_created_by_fkey1(full_name)
    `)
    .neq('status', 'done')
    .is('parent_task_id', null)
    .lte('due_at', cutoff)
    .not('due_at', 'is', null)
    .order('due_at', { ascending: true })
    .limit(50);

  if (!tasks?.length) return [];

  // Fetch property names for property-linked tasks
  const propIds = [...new Set(
    tasks.filter((t) => t.parent_type === 'property' && t.parent_id).map((t) => t.parent_id!)
  )];

  const propNames = new Map<string, string>();
  if (propIds.length > 0) {
    const { data: props } = await supabase
      .from('properties')
      .select('id, nickname, street')
      .in('id', propIds);
    for (const p of props ?? []) {
      propNames.set(p.id, p.nickname ?? p.street);
    }
  }

  return tasks.map((t): DashboardTask => {
    const assigneeData = t.assignee as { full_name: string | null; avatar_url: string | null } | null;
    const creatorData = t.creator as { full_name: string | null } | null;
    return {
      id: t.id,
      parentTaskId: t.parent_task_id,
      parentType: t.parent_type,
      parentId: t.parent_id,
      title: t.title,
      description: t.description,
      status: t.status,
      assigneeId: t.assignee_id,
      assigneeName: assigneeData?.full_name ?? null,
      assigneeAvatarUrl: assigneeData?.avatar_url ?? null,
      createdById: t.created_by,
      createdByName: creatorData?.full_name ?? null,
      dueAt: t.due_at,
      completedAt: t.completed_at,
      createdAt: t.created_at,
      parent: t.parent_type && t.parent_id ? {
        type: t.parent_type as 'contact' | 'property' | 'project',
        id: t.parent_id,
        label: propNames.get(t.parent_id) ?? t.parent_id,
      } : null,
      subtaskCount: 0,
      subtaskDoneCount: 0,
      propertyName: t.parent_type === 'property' && t.parent_id
        ? (propNames.get(t.parent_id) ?? null)
        : null,
    };
  });
}

export function filterDashboardTasks(
  tasks: DashboardTask[],
  filter: DashboardTaskFilter,
): DashboardTask[] {
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  switch (filter) {
    case 'overdue':
      return tasks.filter((t) => t.dueAt && new Date(t.dueAt) < now);
    case 'today':
      return tasks.filter((t) => {
        if (!t.dueAt) return false;
        const due = new Date(t.dueAt);
        return due >= now && due <= endOfToday;
      });
    case 'payouts':
      return tasks.filter((t) => matchesKeywords(t.title, PAYOUT_KEYWORDS));
    case 'maintenance':
      return tasks.filter((t) => matchesKeywords(t.title, MAINTENANCE_KEYWORDS));
    default:
      return tasks;
  }
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/johanannunez/workspace/parcel-dashboard-preview/apps/web
pnpm exec tsc --noEmit 2>&1 | grep dashboard-tasks
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/johanannunez/workspace/parcel-dashboard-preview
git add apps/web/src/lib/admin/dashboard-tasks.ts
git commit -m "feat: dashboard task surface data fetcher"
```

---

### Task 7: Dashboard Task Surface component

**Files:**
- Create: `apps/web/src/app/(admin)/admin/DashboardTaskSurface.tsx`
- Create: `apps/web/src/app/(admin)/admin/DashboardTaskSurface.module.css`

- [ ] **Step 1: Create the CSS module**

```css
/* apps/web/src/app/(admin)/admin/DashboardTaskSurface.module.css */
.wrap { display: flex; flex-direction: column; gap: 0; }

.tabs {
  display: flex;
  gap: 2px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.tab {
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 100ms, color 100ms;
}
.tab:hover { background: #f3f4f6; color: #374151; }
.tabActive  { background: #0F3B6B; color: #fff; }
.tabActive:hover { background: #0F3B6B; color: #fff; }

.list {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

.row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 12px;
  padding: 11px 16px;
  border-top: 1px solid #f3f4f6;
  text-decoration: none;
  transition: background 100ms;
}
.row:first-child { border-top: none; }
.row:hover { background: #fafbfc; }

.rowMain { display: flex; flex-direction: column; gap: 2px; min-width: 0; }

.taskTitle {
  font-size: 13px;
  font-weight: 500;
  color: #0F3B6B;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.propName {
  font-size: 11px;
  color: #9ca3af;
}

.due {
  font-size: 11.5px;
  color: #9ca3af;
  white-space: nowrap;
  text-align: right;
}
.dueOverdue { color: #ef4444; font-weight: 600; }
.dueToday   { color: #f59e0b; font-weight: 600; }

.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(2,170,235,0.12);
  color: #1B77BE;
  font-size: 9.5px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  text-transform: uppercase;
  position: relative;
}

.avatarImg {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.avatarEmpty {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #d1d5db;
}

.empty {
  padding: 32px 20px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
}

.footer {
  padding: 12px 16px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: flex-end;
}

.footerLink {
  font-size: 12px;
  font-weight: 500;
  color: #02AAEB;
  text-decoration: none;
}
.footerLink:hover { text-decoration: underline; }
```

- [ ] **Step 2: Create the component**

```typescript
// apps/web/src/app/(admin)/admin/DashboardTaskSurface.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import type { DashboardTask, DashboardTaskFilter } from '@/lib/admin/dashboard-tasks';
import { filterDashboardTasks } from '@/lib/admin/dashboard-tasks';
import styles from './DashboardTaskSurface.module.css';

const FILTERS: { key: DashboardTaskFilter; label: string }[] = [
  { key: 'all',         label: 'All'         },
  { key: 'overdue',     label: 'Overdue'     },
  { key: 'today',       label: 'Due Today'   },
  { key: 'payouts',     label: 'Payouts'     },
  { key: 'maintenance', label: 'Maintenance' },
];

function formatDue(iso: string | null): { label: string; cls: string } {
  if (!iso) return { label: '—', cls: '' };
  const now = new Date();
  const due = new Date(iso);
  const diff = due.getTime() - now.getTime();

  if (diff < 0) {
    const days = Math.ceil(Math.abs(diff) / 86_400_000);
    return { label: days === 1 ? '1d late' : `${days}d late`, cls: styles.dueOverdue };
  }

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  if (due <= endOfToday) {
    // Show time if available (due_at is timestamptz so always has time)
    const timeStr = due.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return { label: `Today ${timeStr}`, cls: styles.dueToday };
  }

  const days = Math.floor(diff / 86_400_000);
  if (days < 7) {
    const weekday = due.toLocaleDateString(undefined, { weekday: 'short' });
    const timeStr = due.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return { label: `${weekday} ${timeStr}`, cls: '' };
  }
  return {
    label: due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    cls: '',
  };
}

function Assignee({ name, avatarUrl }: { name: string | null; avatarUrl: string | null }) {
  if (avatarUrl) {
    return (
      <span className={styles.avatar} title={name ?? 'Assignee'}>
        <Image src={avatarUrl} alt={name ?? 'Assignee'} width={24} height={24} className={styles.avatarImg} />
      </span>
    );
  }
  if (name) {
    const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
    return (
      <span className={styles.avatar} title={name}>
        {initials}
      </span>
    );
  }
  return <span className={styles.avatarEmpty}>—</span>;
}

export function DashboardTaskSurface({ tasks }: { tasks: DashboardTask[] }) {
  const [filter, setFilter] = useState<DashboardTaskFilter>('all');
  const visible = filterDashboardTasks(tasks, filter);

  return (
    <div className={styles.wrap}>
      <div className={styles.tabs}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`${styles.tab} ${filter === f.key ? styles.tabActive : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {visible.length === 0 ? (
          <div className={styles.empty}>No tasks in this category.</div>
        ) : (
          visible.map((task) => {
            const due = formatDue(task.dueAt);
            return (
              <Link key={task.id} href="/admin/tasks" className={styles.row}>
                <div className={styles.rowMain}>
                  <span className={styles.taskTitle}>{task.title}</span>
                  {task.propertyName ? (
                    <span className={styles.propName}>{task.propertyName}</span>
                  ) : null}
                </div>
                <span className={`${styles.due} ${due.cls}`}>{due.label}</span>
                <Assignee name={task.assigneeName} avatarUrl={task.assigneeAvatarUrl} />
              </Link>
            );
          })
        )}
      </div>

      <div className={styles.footer}>
        <Link href="/admin/tasks" className={styles.footerLink}>
          View all tasks →
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add Section 3 to the dashboard page**

In `apps/web/src/app/(admin)/admin/page.tsx`, add these imports and the new section. The full updated file:

```typescript
// apps/web/src/app/(admin)/admin/page.tsx
import type { Metadata } from 'next';
import { fetchDashboardData } from '@/lib/admin/dashboard-data';
import { fetchDashboardTasks } from '@/lib/admin/dashboard-tasks';
import { PropertyHealthGrid } from './PropertyHealthGrid';
import { AttentionQueue } from './AttentionQueue';
import { DashboardTaskSurface } from './DashboardTaskSurface';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [{ propertyCards, attentionItems }, tasks] = await Promise.all([
    fetchDashboardData(),
    fetchDashboardTasks(),
  ]);

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Property Health</h2>
        <PropertyHealthGrid cards={propertyCards} />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Attention Queue</h2>
        <AttentionQueue items={attentionItems} />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Tasks</h2>
        <DashboardTaskSurface tasks={tasks} />
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Type-check**

```bash
cd /Users/johanannunez/workspace/parcel-dashboard-preview/apps/web
pnpm exec tsc --noEmit 2>&1 | grep -v node_modules | grep -v ContactsMapView
```

- [ ] **Step 5: Screenshot**

```bash
node screenshot.mjs http://localhost:4001/admin "dashboard-phase2"
```

Read the screenshot and verify three sections render.

- [ ] **Step 6: Commit**

```bash
cd /Users/johanannunez/workspace/parcel-dashboard-preview
git add apps/web/src/app/\(admin\)/admin/DashboardTaskSurface.tsx
git add apps/web/src/app/\(admin\)/admin/DashboardTaskSurface.module.css
git add apps/web/src/app/\(admin\)/admin/page.tsx
git commit -m "feat: dashboard task surface with filter tabs, due date+time, assignee avatar"
```

---

## Phase 3: Guest Intelligence Backend

### Task 8: Add Hospitable review + message endpoints

**Files:**
- Modify: `apps/web/src/lib/hospitable.ts`

- [ ] **Step 1: Look up the Hospitable API docs for reviews and messages**

The Hospitable v2 API endpoints (verify against https://public.api.hospitable.com/docs if needed):
- Reviews: `GET /v2/reviews?properties[]={id}` — returns paginated list of reviews per property
- Conversations: `GET /v2/conversations?properties[]={id}` with messages nested or via `GET /v2/conversations/{id}/messages`

- [ ] **Step 2: Add types and functions to `hospitable.ts`**

Append to the end of `apps/web/src/lib/hospitable.ts`:

```typescript
// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export interface HospitableReview {
  id: string;
  property_id?: string;
  guest?: { first_name?: string };
  rating?: number;
  public_review?: string;   // guest-facing text
  private_feedback?: string; // private feedback to host
  created_at?: string;
  replied_at?: string | null;
}

export async function getPropertyReviews(
  propertyId: string,
  limit = 20,
): Promise<HospitableReview[]> {
  if (!hasHospitable()) return [];
  try {
    const res = await request<PaginatedResponse<HospitableReview>>('/reviews', {
      params: { 'properties[]': propertyId, per_page: String(limit) },
      revalidate: 3600,
    });
    return res.data ?? [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Messages / Conversations
// ---------------------------------------------------------------------------

export interface HospitableMessage {
  id: string;
  body?: string;
  from?: 'guest' | 'host';
  created_at?: string;
}

export interface HospitableConversation {
  id: string;
  property_id?: string;
  guest?: { first_name?: string };
  messages?: HospitableMessage[];
  last_message_at?: string;
}

export async function getPropertyConversations(
  propertyId: string,
  limit = 10,
): Promise<HospitableConversation[]> {
  if (!hasHospitable()) return [];
  try {
    const res = await request<PaginatedResponse<HospitableConversation>>('/conversations', {
      params: { 'properties[]': propertyId, per_page: String(limit) },
      revalidate: 3600,
    });
    return res.data ?? [];
  } catch {
    return [];
  }
}
```

Note: `PaginatedResponse` is already defined in this file as `{ data: T[]; links?: { next?: string } }`. Verify the exact type name by checking the top of `hospitable.ts`.

- [ ] **Step 3: Type-check**

```bash
cd /Users/johanannunez/workspace/parcel-dashboard-preview/apps/web
pnpm exec tsc --noEmit 2>&1 | grep hospitable
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/johanannunez/workspace/parcel-dashboard-preview
git add apps/web/src/lib/hospitable.ts
git commit -m "feat: add getPropertyReviews + getPropertyConversations to Hospitable client"
```

---

### Task 9: Guest intelligence sync logic

**Files:**
- Create: `apps/web/src/lib/admin/guest-intelligence.ts`

- [ ] **Step 1: Create the file**

```typescript
// apps/web/src/lib/admin/guest-intelligence.ts
import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { createServiceClient } from '@/lib/supabase/service';
import { getProperties, getPropertyReviews, getPropertyConversations } from '@/lib/hospitable';

const anthropic = new Anthropic();

// Stored in action_payload jsonb on ai_insights
export type InsightPayload = {
  bucket: 'owner_update' | 'house_action';
  severityReason: string;
  sourceCount: number;
  sourceExcerpts: Array<{
    type: 'review' | 'message';
    guestFirstName: string;
    approximateDate: string; // e.g. "Mar 2026"
    quote: string;
  }>;
  suggestedFixes: string[];
};

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
    };

    // Map 'critical' to 'warning' for the db check constraint (info|recommendation|warning|success)
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
        action_payload: { ...payload, isCritical: ins.severity === 'critical' },
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

    // Clear old guest_intelligence insights for this property
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
```

- [ ] **Step 2: Check that `createServiceClient` exists**

```bash
grep -r "createServiceClient\|service-client\|serviceClient" /Users/johanannunez/workspace/parcel-dashboard-preview/apps/web/src/lib/supabase/ --include="*.ts" | head -5
```

If `createServiceClient` doesn't exist, check what service-level client is available and update the import. Common alternatives: `createAdminClient`, `createClient` with service role key.

- [ ] **Step 3: Type-check**

```bash
cd /Users/johanannunez/workspace/parcel-dashboard-preview/apps/web
pnpm exec tsc --noEmit 2>&1 | grep guest-intelligence
```

- [ ] **Step 4: Commit**

```bash
cd /Users/johanannunez/workspace/parcel-dashboard-preview
git add apps/web/src/lib/admin/guest-intelligence.ts
git commit -m "feat: guest intelligence sync — Hospitable + Claude → ai_insights"
```

---

### Task 10: Guest intelligence API route

**Files:**
- Create: `apps/web/src/app/api/cron/guest-intelligence/route.ts`
- Create or update: `apps/web/vercel.json`

- [ ] **Step 1: Create the API route**

```typescript
// apps/web/src/app/api/cron/guest-intelligence/route.ts
import { NextResponse } from 'next/server';
import { runGuestIntelligenceSync } from '@/lib/admin/guest-intelligence';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: Request): Promise<NextResponse> {
  // Protect with CRON_SECRET for Vercel cron calls; allow local dev without it
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const result = await runGuestIntelligenceSync();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[guest-intelligence] sync error:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create or update `vercel.json` in `apps/web/`**

Check if it exists first:
```bash
ls /Users/johanannunez/workspace/parcel-dashboard-preview/apps/web/vercel.json 2>/dev/null || echo "absent"
```

If absent, create it. If present, add the `crons` key without removing existing config:

```json
{
  "crons": [
    {
      "path": "/api/cron/guest-intelligence",
      "schedule": "0 5,15 * * *"
    }
  ]
}
```

This fires at 5:00 AM and 3:00 PM UTC daily. If you want Pacific Time (UTC-7/8), use `0 12,22 * * *` (5 AM / 3 PM PT) or `0 13,23 * * *` (PDT). Confirm which timezone you want and adjust the cron expression accordingly.

- [ ] **Step 3: Add `CRON_SECRET` to Vercel environment variables**

After deploying, add `CRON_SECRET` to Vercel project environment variables (Settings → Environment Variables). Generate a random secret:

```bash
openssl rand -hex 32
```

- [ ] **Step 4: Commit**

```bash
cd /Users/johanannunez/workspace/parcel-dashboard-preview
git add apps/web/src/app/api/cron/guest-intelligence/route.ts
git add apps/web/vercel.json 2>/dev/null || true
git commit -m "feat: guest intelligence cron API route, 5AM + 3PM daily"
```

---

## Phase 4: Guest Intelligence UI

### Task 11: Insight server actions (dismiss + create task)

**Files:**
- Create: `apps/web/src/lib/admin/insight-actions.ts`

- [ ] **Step 1: Create the file**

```typescript
// apps/web/src/lib/admin/insight-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { InsightPayload } from './guest-intelligence';

export async function dismissInsight(insightId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('ai_insights')
    .update({ dismissed_at: new Date().toISOString() })
    .eq('id', insightId);
  if (error) throw error;
  revalidatePath('/admin');
}

export async function createTaskFromInsight(params: {
  insightId: string;
  propertyId: string;
  title: string;
  body: string;
  suggestedFixes: string[];
}): Promise<{ taskId: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Create parent task
  const { data: task, error: taskErr } = await supabase
    .from('tasks')
    .insert({
      parent_type: 'property',
      parent_id: params.propertyId,
      title: params.title,
      description: params.body,
      status: 'todo',
      created_by: user.id,
    })
    .select('id')
    .single();

  if (taskErr || !task) throw taskErr ?? new Error('Failed to create task');

  // Create subtasks if multiple fixes
  if (params.suggestedFixes.length > 1) {
    const subtasks = params.suggestedFixes.map((fix) => ({
      parent_type: 'property' as const,
      parent_id: params.propertyId,
      parent_task_id: task.id,
      title: fix,
      status: 'todo' as const,
      created_by: user.id,
    }));
    await supabase.from('tasks').insert(subtasks);
  }

  revalidatePath('/admin');
  revalidatePath('/admin/tasks');
  return { taskId: task.id };
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/johanannunez/workspace/parcel-dashboard-preview/apps/web
pnpm exec tsc --noEmit 2>&1 | grep insight-actions
```

- [ ] **Step 3: Commit**

```bash
cd /Users/johanannunez/workspace/parcel-dashboard-preview
git add apps/web/src/lib/admin/insight-actions.ts
git commit -m "feat: insight server actions — dismiss, create task + subtasks"
```

---

### Task 12: Insight detail panel

**Files:**
- Create: `apps/web/src/app/(admin)/admin/InsightDetailPanel.tsx`
- Create: `apps/web/src/app/(admin)/admin/InsightDetailPanel.module.css`

- [ ] **Step 1: Create the CSS module**

```css
/* apps/web/src/app/(admin)/admin/InsightDetailPanel.module.css */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(15,59,107,0.18);
  z-index: 200;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
}

.panel {
  width: min(480px, 100vw);
  height: 100vh;
  background: #fff;
  box-shadow: -8px 0 32px rgba(15,59,107,0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.headerLeft { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; }

.severityRow { display: flex; align-items: center; gap: 8px; }

.badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 2px 8px;
  border-radius: 6px;
}
.badgeInfo           { background: #dbeafe; color: #1d4ed8; }
.badgeRecommendation { background: #d1fae5; color: #065f46; }
.badgeWarning        { background: #fef3c7; color: #92400e; }
.badgeCritical       { background: #fee2e2; color: #991b1b; }

.sourceCount { font-size: 11.5px; color: #9ca3af; }

.panelTitle {
  font-size: 16px;
  font-weight: 600;
  color: #0F3B6B;
  line-height: 1.3;
}

.closeBtn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: #f3f4f6;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 18px;
  flex-shrink: 0;
  transition: background 100ms;
}
.closeBtn:hover { background: #e5e7eb; }

.body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sectionLabel {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
  margin-bottom: 8px;
}

.issueText {
  font-size: 13.5px;
  color: #374151;
  line-height: 1.6;
}

.reasonText {
  font-size: 12.5px;
  color: #6b7280;
  line-height: 1.5;
  font-style: italic;
}

.sourceList { display: flex; flex-direction: column; gap: 10px; }

.sourceItem {
  padding: 10px 12px;
  background: #f9fafb;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sourceMeta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sourceTypeBadge {
  font-size: 9.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 1px 6px;
  border-radius: 4px;
  background: #e5e7eb;
  color: #6b7280;
}

.sourceName { font-size: 11.5px; font-weight: 600; color: #374151; }
.sourceDate { font-size: 11px; color: #9ca3af; }

.sourceQuote {
  font-size: 12.5px;
  color: #374151;
  line-height: 1.5;
  font-style: italic;
}

.fixList { display: flex; flex-direction: column; gap: 8px; }

.fixItem {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.fixNumber {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(2,170,235,0.12);
  color: #1B77BE;
  font-size: 10.5px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.fixText { font-size: 13px; color: #374151; line-height: 1.5; }

.footer {
  padding: 16px 24px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.btnPrimary {
  flex: 1;
  padding: 10px;
  border-radius: 10px;
  background: #0F3B6B;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 140ms;
}
.btnPrimary:hover { background: #1B77BE; }
.btnPrimary:disabled { opacity: 0.5; cursor: not-allowed; }

.btnSecondary {
  padding: 10px 16px;
  border-radius: 10px;
  background: #f3f4f6;
  color: #374151;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background 140ms;
}
.btnSecondary:hover { background: #e5e7eb; }
```

- [ ] **Step 2: Create the component**

```typescript
// apps/web/src/app/(admin)/admin/InsightDetailPanel.tsx
'use client';

import { useTransition } from 'react';
import { X } from '@phosphor-icons/react';
import type { InsightPayload } from '@/lib/admin/guest-intelligence';
import type { Insight } from '@/lib/admin/ai-insights';
import { dismissInsight, createTaskFromInsight } from '@/lib/admin/insight-actions';
import styles from './InsightDetailPanel.module.css';

type Props = {
  insight: Insight;
  payload: InsightPayload;
  propertyId: string;
  onClose: () => void;
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

export function InsightDetailPanel({ insight, payload, propertyId, onClose }: Props) {
  const [isPending, startTransition] = useTransition();
  const isCritical = Boolean((insight as unknown as Record<string, unknown>).action_payload && payload.isCritical);

  const handleDismiss = () => {
    startTransition(async () => {
      await dismissInsight(insight.id);
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

  return (
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
            onClick={handleCreateTask}
            disabled={isPending}
          >
            {isPending ? 'Creating…' : payload.suggestedFixes.length > 1 ? 'Create task + subtasks' : 'Create task'}
          </button>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleDismiss}
            disabled={isPending}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
```

Note: `InsightPayload` imports from `guest-intelligence.ts` which is `server-only`. Extract the `InsightPayload` type to a separate file (`insight-types.ts`) if TypeScript complains about importing a server-only module in a client component. Move the `InsightPayload` type there and import from that instead.

- [ ] **Step 3: Commit**

```bash
cd /Users/johanannunez/workspace/parcel-dashboard-preview
git add apps/web/src/app/\(admin\)/admin/InsightDetailPanel.tsx
git add apps/web/src/app/\(admin\)/admin/InsightDetailPanel.module.css
git commit -m "feat: InsightDetailPanel — issue, severity reason, sources, fixes, create task"
```

---

### Task 13: Guest Intelligence section (cards + refresh button)

**Files:**
- Create: `apps/web/src/app/(admin)/admin/GuestIntelligence.tsx`
- Create: `apps/web/src/app/(admin)/admin/GuestIntelligence.module.css`

- [ ] **Step 1: Create the CSS module**

```css
/* apps/web/src/app/(admin)/admin/GuestIntelligence.module.css */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 768px) { .cols { grid-template-columns: 1fr; } }

.col { display: flex; flex-direction: column; gap: 0; }

.colLabel {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #9ca3af;
  margin-bottom: 10px;
}

.cardList { display: flex; flex-direction: column; gap: 8px; }

.card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px 16px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition: box-shadow 130ms, border-color 130ms;
  width: 100%;
}
.card:hover { box-shadow: 0 2px 12px rgba(15,59,107,0.08); border-color: #cbd5e1; }

.cardTop {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.badgeRow { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

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

.sourceCount { font-size: 11px; color: #9ca3af; }

.dismissBtn {
  background: none;
  border: none;
  cursor: pointer;
  color: #d1d5db;
  padding: 2px;
  font-size: 14px;
  line-height: 1;
  transition: color 100ms;
  flex-shrink: 0;
}
.dismissBtn:hover { color: #6b7280; }

.cardTitle {
  font-size: 13px;
  font-weight: 600;
  color: #0F3B6B;
  line-height: 1.35;
  margin-bottom: 4px;
}

.propName { font-size: 11px; color: #9ca3af; }

.empty {
  padding: 20px;
  text-align: center;
  color: #9ca3af;
  font-size: 12.5px;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px dashed #e5e7eb;
}
```

- [ ] **Step 2: Create the component**

```typescript
// apps/web/src/app/(admin)/admin/GuestIntelligence.tsx
'use client';

import { useState, useTransition } from 'react';
import { ArrowsClockwise, X } from '@phosphor-icons/react';
import type { Insight } from '@/lib/admin/ai-insights';
import type { InsightPayload } from '@/lib/admin/guest-intelligence';
import { dismissInsight } from '@/lib/admin/insight-actions';
import { InsightDetailPanel } from './InsightDetailPanel';
import styles from './GuestIntelligence.module.css';

type EnrichedInsight = Insight & {
  payload: InsightPayload;
  propertyId: string;
  propertyName: string;
};

type Props = {
  ownerUpdates: EnrichedInsight[];
  houseActions: EnrichedInsight[];
};

function severityBadgeCls(severity: Insight['severity'], isCritical: boolean): string {
  if (isCritical) return styles.badgeCritical;
  if (severity === 'warning') return styles.badgeWarning;
  if (severity === 'recommendation') return styles.badgeRecommendation;
  return styles.badgeInfo;
}

function severityLabel(severity: Insight['severity'], isCritical: boolean): string {
  if (isCritical) return 'Critical';
  if (severity === 'warning') return 'Warning';
  if (severity === 'recommendation') return 'Recommendation';
  return 'Info';
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
  return (
    <div className={styles.card} onClick={onOpen} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpen()}>
      <div className={styles.cardTop}>
        <div className={styles.badgeRow}>
          <span className={`${styles.badge} ${severityBadgeCls(insight.severity, isCritical)}`}>
            {severityLabel(insight.severity, isCritical)}
          </span>
          <span className={styles.sourceCount}>
            {insight.payload.sourceCount} {insight.payload.sourceCount === 1 ? 'mention' : 'mentions'}
          </span>
        </div>
        <button
          type="button"
          className={styles.dismissBtn}
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
      <div className={styles.cardTitle}>{insight.title}</div>
      <div className={styles.propName}>{insight.propertyName}</div>
    </div>
  );
}

export function GuestIntelligence({ ownerUpdates, houseActions }: Props) {
  const [activeInsight, setActiveInsight] = useState<EnrichedInsight | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [isRefreshing, startRefresh] = useTransition();

  const handleDismiss = (insightId: string) => {
    setDismissed((prev) => new Set([...prev, insightId]));
    dismissInsight(insightId).catch(console.error);
  };

  const handleRefresh = () => {
    startRefresh(async () => {
      await fetch('/api/cron/guest-intelligence', { method: 'POST' });
      window.location.reload();
    });
  };

  const visibleOwner = ownerUpdates.filter((i) => !dismissed.has(i.id));
  const visibleHouse = houseActions.filter((i) => !dismissed.has(i.id));

  return (
    <>
      <div className={styles.header}>
        <span /> {/* section title is rendered by parent */}
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
        <div className={styles.col}>
          <div className={styles.colLabel}>Owner Updates</div>
          <div className={styles.cardList}>
            {visibleOwner.length === 0 ? (
              <div className={styles.empty}>No owner updates right now.</div>
            ) : (
              visibleOwner.map((ins) => (
                <InsightCard
                  key={ins.id}
                  insight={ins}
                  onOpen={() => setActiveInsight(ins)}
                  onDismiss={() => handleDismiss(ins.id)}
                />
              ))
            )}
          </div>
        </div>

        <div className={styles.col}>
          <div className={styles.colLabel}>House Action Items</div>
          <div className={styles.cardList}>
            {visibleHouse.length === 0 ? (
              <div className={styles.empty}>No house action items right now.</div>
            ) : (
              visibleHouse.map((ins) => (
                <InsightCard
                  key={ins.id}
                  insight={ins}
                  onOpen={() => setActiveInsight(ins)}
                  onDismiss={() => handleDismiss(ins.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {activeInsight ? (
        <InsightDetailPanel
          insight={activeInsight}
          payload={activeInsight.payload}
          propertyId={activeInsight.propertyId}
          onClose={() => setActiveInsight(null)}
        />
      ) : null}
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/johanannunez/workspace/parcel-dashboard-preview
git add apps/web/src/app/\(admin\)/admin/GuestIntelligence.tsx
git add apps/web/src/app/\(admin\)/admin/GuestIntelligence.module.css
git commit -m "feat: GuestIntelligence component — insight cards, detail panel, dismiss, refresh"
```

---

### Task 14: Wire Section 4 into dashboard page + final type check

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/page.tsx`

- [ ] **Step 1: Add guest intelligence data fetch and section to page**

Create a helper in `dashboard-data.ts` to fetch enriched insights:

Append to `apps/web/src/lib/admin/dashboard-data.ts`:

```typescript
import { fetchInsightsByParent } from '@/lib/admin/ai-insights';
import type { InsightPayload } from '@/lib/admin/guest-intelligence';

export type EnrichedInsight = {
  id: string;
  parentId: string;
  agentKey: string;
  severity: 'info' | 'recommendation' | 'warning' | 'success';
  title: string;
  body: string;
  createdAt: string;
  payload: InsightPayload;
  propertyId: string;
  propertyName: string;
};

export async function fetchGuestIntelligenceInsights(
  properties: Array<{ id: string; name: string }>,
): Promise<{ ownerUpdates: EnrichedInsight[]; houseActions: EnrichedInsight[] }> {
  if (properties.length === 0) return { ownerUpdates: [], houseActions: [] };

  const propIds = properties.map((p) => p.id);
  const insightMap = await fetchInsightsByParent('property', propIds);

  const ownerUpdates: EnrichedInsight[] = [];
  const houseActions: EnrichedInsight[] = [];

  for (const prop of properties) {
    const insights = insightMap[prop.id] ?? [];
    const guestInsights = insights.filter((i) => i.agentKey.startsWith('guest_intelligence:'));
    for (const ins of guestInsights) {
      const payload = ins.actionPayload as unknown as InsightPayload | null;
      if (!payload) continue;
      const enriched: EnrichedInsight = {
        id: ins.id,
        parentId: ins.parentId,
        agentKey: ins.agentKey,
        severity: ins.severity,
        title: ins.title,
        body: ins.body,
        createdAt: ins.createdAt,
        payload,
        propertyId: prop.id,
        propertyName: prop.name,
      };
      if (payload.bucket === 'owner_update') ownerUpdates.push(enriched);
      else houseActions.push(enriched);
    }
  }

  // Sort by severity: critical/warning first, then by source count desc
  const severityOrder: Record<string, number> = { warning: 0, recommendation: 1, info: 2, success: 3 };
  const sortFn = (a: EnrichedInsight, b: EnrichedInsight) => {
    const aRank = a.payload.isCritical ? -1 : (severityOrder[a.severity] ?? 3);
    const bRank = b.payload.isCritical ? -1 : (severityOrder[b.severity] ?? 3);
    if (aRank !== bRank) return aRank - bRank;
    return b.payload.sourceCount - a.payload.sourceCount;
  };

  return {
    ownerUpdates: ownerUpdates.sort(sortFn),
    houseActions: houseActions.sort(sortFn),
  };
}
```

Note: Check the exact field name for `action_payload` in the `Insight` type in `ai-insights.ts` — it may be `actionPayload` (camelCase). Adjust accordingly.

- [ ] **Step 2: Update `page.tsx` to include Section 4**

```typescript
// apps/web/src/app/(admin)/admin/page.tsx
import type { Metadata } from 'next';
import { fetchDashboardData, fetchGuestIntelligenceInsights } from '@/lib/admin/dashboard-data';
import { fetchDashboardTasks } from '@/lib/admin/dashboard-tasks';
import { PropertyHealthGrid } from './PropertyHealthGrid';
import { AttentionQueue } from './AttentionQueue';
import { DashboardTaskSurface } from './DashboardTaskSurface';
import { GuestIntelligence } from './GuestIntelligence';
import styles from './page.module.css';

export const metadata: Metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [{ propertyCards, attentionItems }, tasks] = await Promise.all([
    fetchDashboardData(),
    fetchDashboardTasks(),
  ]);

  const propertyRefs = propertyCards.map((c) => ({ id: c.id, name: c.name }));
  const { ownerUpdates, houseActions } = await fetchGuestIntelligenceInsights(propertyRefs);

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Property Health</h2>
        <PropertyHealthGrid cards={propertyCards} />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Attention Queue</h2>
        <AttentionQueue items={attentionItems} />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Tasks</h2>
        <DashboardTaskSurface tasks={tasks} />
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Guest Intelligence</h2>
        <GuestIntelligence ownerUpdates={ownerUpdates} houseActions={houseActions} />
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Full type check**

```bash
cd /Users/johanannunez/workspace/parcel-dashboard-preview/apps/web
pnpm exec tsc --noEmit 2>&1 | grep -v node_modules | grep -v ContactsMapView
```

Fix any errors before proceeding.

- [ ] **Step 4: Screenshot all four sections**

```bash
node screenshot.mjs http://localhost:4001/admin "dashboard-final" --full-page
```

Read the screenshot. Verify all four sections render correctly.

- [ ] **Step 5: Test the Refresh button manually**

Open http://localhost:4001/admin in the browser. Click the Refresh button. Check the terminal for any errors from the API route.

- [ ] **Step 6: Commit**

```bash
cd /Users/johanannunez/workspace/parcel-dashboard-preview
git add apps/web/src/app/\(admin\)/admin/page.tsx apps/web/src/lib/admin/dashboard-data.ts
git commit -m "feat: wire guest intelligence section into dashboard"
```

---

## Phase 5: Preview Review + Merge to Main

### Task 15: Screenshot review pass

- [ ] **Step 1: Take full-page screenshot**

```bash
node screenshot.mjs http://localhost:4001/admin "final-review" --full-page --side-by-side
```

- [ ] **Step 2: Check desktop + mobile**

```bash
node screenshot.mjs http://localhost:4001/admin "final-mobile" --device "iPhone 15"
```

Read both. Check for: alignment, spacing, truncation issues, empty states, color accuracy.

- [ ] **Step 3: Fix any visual issues found, re-screenshot**

Minimum two rounds of screenshot → fix → screenshot before marking done.

---

### Task 16: Merge worktree to main

> Only execute this task after Johan has reviewed the preview and given explicit approval.

- [ ] **Step 1: Push worktree branch to remote**

```bash
cd /Users/johanannunez/workspace/parcel-dashboard-preview
git push -u origin feat/operational-dashboard
```

- [ ] **Step 2: Merge into main**

```bash
cd /Users/johanannunez/workspace/parcel
git merge feat/operational-dashboard
```

- [ ] **Step 3: Verify on main dev server (port 4000)**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web && doppler run -- next dev -p 4000
```

Open http://localhost:4000/admin and verify the dashboard loads correctly.

- [ ] **Step 4: Remove worktree**

```bash
cd /Users/johanannunez/workspace/parcel
git worktree remove ../parcel-dashboard-preview
git branch -d feat/operational-dashboard
```

---

## Post-Launch Checklist

- [ ] Add `CRON_SECRET` to Vercel environment variables
- [ ] Verify Vercel cron is firing (check Vercel dashboard → Functions → Cron Jobs after first deploy)
- [ ] Confirm `ANTHROPIC_API_KEY` is set in Vercel environment
- [ ] Run the guest intelligence sync manually once via Refresh button after deploy to populate initial insights
- [ ] Monitor `ai_insights` table in Supabase to confirm rows are being written

---

## Known Gotchas

- `InsightPayload` type imported from `guest-intelligence.ts` (server-only) into client components will cause an error. Extract to `insight-types.ts` as a pure type file with no server imports.
- The `ai_insights` `severity` column only accepts `info | recommendation | warning | success`. Claude may return `critical` — map it to `warning` in the DB and store the `isCritical: true` flag in `action_payload`.
- `property_checklist_items` — confirm the exact table name matches what's in your Supabase schema. It may be `checklist_items` with a `property_id` FK.
- Vercel cron only fires on deployed production URLs, not on localhost or preview branches. Use the Refresh button for local testing.
- `fetchInsightsByParent` in `ai-insights.ts` filters `dismissed_at IS NULL`. Dismissed insights won't appear on next page load, which is the correct behavior.
