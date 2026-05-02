# Lead Pipeline + Onboarding Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the time-bucketed onboarding view with a real phase board (Documents → Finances → Listings), simplify the lead pipeline to 4 columns, rename "Inquiry" to "Contacted," and add a "Mark as Signed" action on Contract Sent cards that graduates a lead to owner.

**Architecture:** The lead pipeline continues to use the existing `ContactsKanbanBoard` + `buildContactStatusBoard` path, with column definitions trimmed to 4 stages. The onboarding view is extracted to a new standalone server component (`OnboardingPhaseBoard`) that fetches task completion counts per contact and renders three phase columns independently of the Kanban infrastructure. A new `markContractSigned` server action moves a contact from `contract_sent` to `onboarding` and seeds tasks.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (server client via `createClient`), `'use server'` actions, CSS Modules, `@dnd-kit/core` (no changes needed).

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `apps/web/src/lib/admin/onboarding-templates.ts` | Modify | Replace placeholder tasks with real 32-task checklist; update totals to 10/6/16 |
| `apps/web/src/lib/admin/lifecycle-stage.ts` | Modify | Rename `lead_new` display label from "Inquiry" to "Contacted" |
| `apps/web/src/lib/admin/pipeline-adapters/contact-status.ts` | Modify | Remove "In Talks" and "Onboarding" from lead pipeline columns; remove unused onboarding milestone builder |
| `apps/web/src/app/(admin)/admin/contacts/actions.ts` | Modify | Add `markContractSigned` server action |
| `apps/web/src/app/(admin)/admin/contacts/ContactsKanbanBoard.tsx` | Modify | Add `MarkAsSignedButton` component; render it on Contract Sent cards |
| `apps/web/src/app/(admin)/admin/contacts/ContactsKanbanBoard.module.css` | Modify | Add `.signedBtn` style for the Mark as Signed button |
| `apps/web/src/lib/admin/onboarding-phase-counts.ts` | Create | Server-only data fetcher: computes Documents/Finances/Listings done+total per contact |
| `apps/web/src/app/(admin)/admin/contacts/OnboardingPhaseBoard.tsx` | Create | Async server component rendering the three-column phase board |
| `apps/web/src/app/(admin)/admin/contacts/OnboardingPhaseBoard.module.css` | Create | Styles for the phase board columns and cards |
| `apps/web/src/app/(admin)/admin/contacts/page.tsx` | Modify | Intercept `viewKey === 'onboarding'` and render `OnboardingPhaseBoard` instead of `ContactsStatusView` |

---

## Task 1: Update Onboarding Templates to Real Checklist

**Files:**
- Modify: `apps/web/src/lib/admin/onboarding-templates.ts`

- [ ] **Step 1: Replace the file contents with the real checklist**

```typescript
// apps/web/src/lib/admin/onboarding-templates.ts

export type OnboardingPhase = 'documents' | 'finances' | 'listings';

export type OnboardingTaskTemplate = {
  title: string;
  phase: OnboardingPhase;
  estimatedMinutes: number;
};

export const ONBOARDING_PHASE_TOTALS: Record<OnboardingPhase, number> = {
  documents: 10,
  finances:  6,
  listings:  16,
};

export const ONBOARDING_TASKS: OnboardingTaskTemplate[] = [
  // Documents (10) — owner provides
  { title: 'Host Rental Agreement',          phase: 'documents', estimatedMinutes: 15 },
  { title: 'Paid Initial Onboarding Fee',    phase: 'documents', estimatedMinutes: 10 },
  { title: 'ACH Authorization Form',         phase: 'documents', estimatedMinutes: 10 },
  { title: 'Card Authorization Form',        phase: 'documents', estimatedMinutes: 10 },
  { title: 'W9 Form',                        phase: 'documents', estimatedMinutes: 10 },
  { title: 'Identity Verification',          phase: 'documents', estimatedMinutes:  5 },
  { title: 'Property Setup Form',            phase: 'documents', estimatedMinutes: 15 },
  { title: 'Wi-Fi Account Information',      phase: 'documents', estimatedMinutes:  5 },
  { title: 'Recommendations for Guidebook',  phase: 'documents', estimatedMinutes: 20 },
  { title: 'Block Dates on the Calendar',    phase: 'documents', estimatedMinutes: 10 },
  // Finances (6) — admin sets up
  { title: 'Technology Fee',                 phase: 'finances',  estimatedMinutes: 10 },
  { title: 'Airbnb (Payout & Taxes)',        phase: 'finances',  estimatedMinutes: 15 },
  { title: 'Hospitable (Payouts)',           phase: 'finances',  estimatedMinutes: 10 },
  { title: 'Price Labs (Pricing)',           phase: 'finances',  estimatedMinutes: 15 },
  { title: 'VRBO (Payout & Taxes)',          phase: 'finances',  estimatedMinutes: 15 },
  { title: 'Owner Card on Turno',            phase: 'finances',  estimatedMinutes: 10 },
  // Listings (16) — admin creates, owner has visibility
  { title: 'Client Account',                phase: 'listings',  estimatedMinutes: 15 },
  { title: 'Airbnb',                        phase: 'listings',  estimatedMinutes: 20 },
  { title: 'VRBO',                          phase: 'listings',  estimatedMinutes: 20 },
  { title: 'Hospitable',                    phase: 'listings',  estimatedMinutes: 15 },
  { title: 'Turno',                         phase: 'listings',  estimatedMinutes: 15 },
  { title: 'Booking.com',                   phase: 'listings',  estimatedMinutes: 20 },
  { title: 'Furnished Finder',              phase: 'listings',  estimatedMinutes: 20 },
  { title: 'Turbo Tenant',                  phase: 'listings',  estimatedMinutes: 15 },
  { title: 'ALE Solutions',                 phase: 'listings',  estimatedMinutes: 15 },
  { title: 'CRS Temporary Housing',         phase: 'listings',  estimatedMinutes: 15 },
  { title: 'Sedgwick',                      phase: 'listings',  estimatedMinutes: 15 },
  { title: 'TaCares',                       phase: 'listings',  estimatedMinutes: 15 },
  { title: 'The Link Housing',              phase: 'listings',  estimatedMinutes: 15 },
  { title: 'Alacrity',                      phase: 'listings',  estimatedMinutes: 15 },
  { title: 'Build MP',                      phase: 'listings',  estimatedMinutes: 15 },
  { title: 'CHBO',                          phase: 'listings',  estimatedMinutes: 15 },
];

export function phaseTag(phase: OnboardingPhase): string {
  return `onboarding:${phase}`;
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/web && pnpm exec tsc --noEmit 2>&1 | grep -v ".next/types"
```

Expected: no output (zero errors).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/admin/onboarding-templates.ts
git commit -m "feat: update onboarding templates to real 32-task checklist (10/6/16)"
```

---

## Task 2: Rename "Inquiry" to "Contacted"

**Files:**
- Modify: `apps/web/src/lib/admin/lifecycle-stage.ts`

- [ ] **Step 1: Update the label**

In `lifecycle-stage.ts`, change line 4 from:
```typescript
  lead_new: 'Inquiry',
```
to:
```typescript
  lead_new: 'Contacted',
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/web && pnpm exec tsc --noEmit 2>&1 | grep -v ".next/types"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/admin/lifecycle-stage.ts
git commit -m "feat: rename lead pipeline 'Inquiry' to 'Contacted'"
```

---

## Task 3: Simplify Lead Pipeline Columns

**Files:**
- Modify: `apps/web/src/lib/admin/pipeline-adapters/contact-status.ts`

- [ ] **Step 1: Update `STAGE_COLUMNS_LEAD_PIPELINE`**

Find the current definition:
```typescript
const STAGE_COLUMNS_LEAD_PIPELINE: ColDef[] = [
  { key: 'lead_new',       color: 'blue',   label: 'Inquiry'       },
  { key: 'qualified',      color: 'blue',   label: 'Qualified'     },
  { key: 'in_discussion',  color: 'violet', label: 'In Talks'      },
  { key: 'contract_sent',  color: 'violet', label: 'Contract Sent' },
  { key: 'onboarding',     color: 'green',  label: 'Onboarding'    },
  { key: 'lead_cold',      color: 'gray',   label: 'Cold'          },
];
```

Replace with:
```typescript
const STAGE_COLUMNS_LEAD_PIPELINE: ColDef[] = [
  { key: 'lead_new',      color: 'blue',   label: 'Contacted'     },
  { key: 'qualified',     color: 'blue',   label: 'Qualified'     },
  { key: 'contract_sent', color: 'violet', label: 'Contract Sent' },
  { key: 'lead_cold',     color: 'gray',   label: 'Cold'          },
];
```

- [ ] **Step 2: Remove the unused onboarding milestone infrastructure**

Delete the following from the file (they are replaced by `OnboardingPhaseBoard` in Task 7):

- The `OnboardingPhase` type definition (lines ~40–47)
- The `ONBOARDING_PHASES` constant (lines ~49–54)
- The `STAGE_COLUMNS_ONBOARDING` constant
- The `buildOnboardingMilestoneBoard` function
- The early-return in `buildContactStatusBoard` that calls `buildOnboardingMilestoneBoard`:
  ```typescript
  // REMOVE these lines:
  if (viewKey === 'onboarding') {
    return buildOnboardingMilestoneBoard(rows, insightsByContact, basePath);
  }
  ```

Also remove the `'onboarding'` case from `columnsForView`:
```typescript
// REMOVE this line:
if (viewKey === 'onboarding') return STAGE_COLUMNS_ONBOARDING;
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd apps/web && pnpm exec tsc --noEmit 2>&1 | grep -v ".next/types"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/admin/pipeline-adapters/contact-status.ts
git commit -m "feat: simplify lead pipeline to 4 columns, remove stale onboarding milestone builder"
```

---

## Task 4: Add `markContractSigned` Server Action

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/contacts/actions.ts`

- [ ] **Step 1: Add the import for `seedOnboardingTasks` at the top of `actions.ts`**

The file already has this import — confirm it is present:
```typescript
import { seedOnboardingTasks } from '@/lib/admin/onboarding-actions';
```

If missing, add it after the existing imports.

- [ ] **Step 2: Add the `markContractSigned` action at the bottom of `actions.ts`**

```typescript
export async function markContractSigned(
  contactId: string,
): Promise<ActionResult> {
  const auth = await getAdminUser();
  if (!auth.ok) return auth;
  const { supabase } = auth;

  const { error } = await supabase
    .from('contacts')
    .update({
      lifecycle_stage: 'onboarding',
      stage_changed_at: new Date().toISOString(),
    })
    .eq('id', contactId);

  if (error) return { ok: false, error: error.message };

  await seedOnboardingTasks(contactId);

  revalidatePath('/admin/contacts');
  revalidatePath('/admin/clients');
  revalidatePath('/admin/leads');
  return { ok: true, data: null };
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd apps/web && pnpm exec tsc --noEmit 2>&1 | grep -v ".next/types"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/(admin)/admin/contacts/actions.ts
git commit -m "feat: add markContractSigned server action"
```

---

## Task 5: Add "Mark as Signed" Button to Contract Sent Cards

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/contacts/ContactsKanbanBoard.tsx`
- Modify: `apps/web/src/app/(admin)/admin/contacts/ContactsKanbanBoard.module.css`

- [ ] **Step 1: Add `useTransition` to the React import and add the server action import**

At the top of `ContactsKanbanBoard.tsx`, update the React import:
```typescript
import { useMemo, useState, useTransition } from 'react';
```

Add the server action import after the existing imports:
```typescript
import { markContractSigned } from './actions';
```

- [ ] **Step 2: Add the `MarkAsSignedButton` component at the bottom of `ContactsKanbanBoard.tsx`**

```typescript
function MarkAsSignedButton({ contactId }: { contactId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await markContractSigned(contactId);
    });
  }

  return (
    <button
      type="button"
      className={styles.signedBtn}
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? 'Moving...' : '✓ Mark as Signed'}
    </button>
  );
}
```

- [ ] **Step 3: Render the button in `DraggableCard` when `stageKey === 'contract_sent'`**

Find the `DraggableCard` component's return value:
```typescript
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.cardWrap}${isDraggingThis ? ` ${styles.draggingPlaceholder}` : ''}`}
      {...listeners}
      {...attributes}
    >
      <ContactStatusCard card={card} />
    </div>
  );
```

Replace with:
```typescript
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.cardWrap}${isDraggingThis ? ` ${styles.draggingPlaceholder}` : ''}`}
      {...listeners}
      {...attributes}
    >
      <ContactStatusCard card={card} />
      {stageKey === 'contract_sent' && (
        <MarkAsSignedButton contactId={card.id} />
      )}
    </div>
  );
```

- [ ] **Step 4: Add `.signedBtn` to `ContactsKanbanBoard.module.css`**

Append to the end of the CSS file:
```css
.signedBtn {
  display: block;
  width: 100%;
  margin-top: 6px;
  padding: 5px 10px;
  background: #10B981;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: background 120ms ease, opacity 120ms ease;
}

.signedBtn:hover {
  background: #047857;
}

.signedBtn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd apps/web && pnpm exec tsc --noEmit 2>&1 | grep -v ".next/types"
```

Expected: no output.

- [ ] **Step 6: Start dev server and verify button appears on Contract Sent cards**

```bash
cd /Users/johanannunez/workspace/parcel && doppler run -- next dev -p 4000 --turbopack
```

Open `http://localhost:4000/admin/contacts?view=lead-pipeline`. Confirm:
- Lead pipeline shows 4 columns: Contacted, Qualified, Contract Sent, Cold
- Contract Sent cards have a green "✓ Mark as Signed" button below the card content
- Clicking the button shows "Moving..." then the card disappears from the pipeline

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/(admin)/admin/contacts/ContactsKanbanBoard.tsx \
        apps/web/src/app/(admin)/admin/contacts/ContactsKanbanBoard.module.css
git commit -m "feat: add Mark as Signed button to Contract Sent cards"
```

---

## Task 6: Build Onboarding Phase Counts Data Fetcher

**Files:**
- Create: `apps/web/src/lib/admin/onboarding-phase-counts.ts`

This file is server-only. It takes the onboarding `ContactRow[]`, resolves their properties, fetches all onboarding tasks for those properties, and returns per-contact phase completion counts.

- [ ] **Step 1: Create the file**

```typescript
// apps/web/src/lib/admin/onboarding-phase-counts.ts
import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { ContactRow } from './contact-types';
import { ONBOARDING_PHASE_TOTALS } from './onboarding-templates';

export type PhaseCounts = {
  documents: { done: number; total: number };
  finances:  { done: number; total: number };
  listings:  { done: number; total: number };
};

type TaskRow = {
  parent_id: string;
  tags: string[];
  status: string;
};

type PropertyOwnerRow = {
  property_id: string;
  owner_id: string;
};

type DirectPropertyRow = {
  id: string;
  owner_id: string;
};

export async function fetchOnboardingPhaseCounts(
  rows: ContactRow[],
): Promise<Record<string, PhaseCounts>> {
  if (rows.length === 0) return {};

  const supabase = await createClient();

  // Build profileId → contactId map (one contact per profile)
  const profileToContact: Record<string, string> = {};
  const profileIds: string[] = [];
  for (const r of rows) {
    if (r.profileId) {
      profileToContact[r.profileId] = r.id;
      profileIds.push(r.profileId);
    }
  }

  if (profileIds.length === 0) {
    return Object.fromEntries(rows.map((r) => [r.id, emptyPhaseCounts()]));
  }

  // Fetch properties via direct ownership
  const { data: directProps } = await supabase
    .from('properties')
    .select('id, owner_id')
    .in('owner_id', profileIds) as { data: DirectPropertyRow[] | null };

  // Fetch properties via co-ownership junction
  const { data: coProps } = await (supabase as any)
    .from('property_owners')
    .select('property_id, owner_id')
    .in('owner_id', profileIds) as { data: PropertyOwnerRow[] | null };

  // Build profileId → propertyIds map
  const profileToProperties: Record<string, Set<string>> = {};
  for (const p of directProps ?? []) {
    if (!profileToProperties[p.owner_id]) profileToProperties[p.owner_id] = new Set();
    profileToProperties[p.owner_id].add(p.id);
  }
  for (const p of coProps ?? []) {
    if (!profileToProperties[p.owner_id]) profileToProperties[p.owner_id] = new Set();
    profileToProperties[p.owner_id].add(p.property_id);
  }

  // Collect all property IDs across all contacts
  const allPropertyIds = Array.from(
    new Set(Object.values(profileToProperties).flatMap((s) => Array.from(s))),
  );

  if (allPropertyIds.length === 0) {
    return Object.fromEntries(rows.map((r) => [r.id, emptyPhaseCounts()]));
  }

  // Fetch all onboarding tasks for those properties
  const { data: taskRows } = await (supabase as any)
    .from('tasks')
    .select('parent_id, tags, status')
    .eq('parent_type', 'property')
    .in('parent_id', allPropertyIds)
    .not('tags', 'is', null) as { data: TaskRow[] | null };

  const tasks = (taskRows ?? []).filter((t) =>
    (t.tags ?? []).includes('onboarding'),
  );

  // Build propertyId → tasks map
  const tasksByProperty: Record<string, TaskRow[]> = {};
  for (const t of tasks) {
    if (!tasksByProperty[t.parent_id]) tasksByProperty[t.parent_id] = [];
    tasksByProperty[t.parent_id].push(t);
  }

  // Compute phase counts per contact
  const result: Record<string, PhaseCounts> = {};

  for (const row of rows) {
    if (!row.profileId) {
      result[row.id] = emptyPhaseCounts();
      continue;
    }
    const propertyIds = Array.from(profileToProperties[row.profileId] ?? new Set());
    const contactTasks = propertyIds.flatMap((pid) => tasksByProperty[pid] ?? []);

    const phaseTag = (phase: string) => `onboarding:${phase}`;
    const countPhase = (phase: string) => {
      const phaseTasks = contactTasks.filter((t) => t.tags.includes(phaseTag(phase)));
      const done = phaseTasks.filter((t) => t.status === 'done').length;
      const total = phaseTasks.length || ONBOARDING_PHASE_TOTALS[phase as keyof typeof ONBOARDING_PHASE_TOTALS];
      return { done, total };
    };

    result[row.id] = {
      documents: countPhase('documents'),
      finances:  countPhase('finances'),
      listings:  countPhase('listings'),
    };
  }

  return result;
}

function emptyPhaseCounts(): PhaseCounts {
  return {
    documents: { done: 0, total: ONBOARDING_PHASE_TOTALS.documents },
    finances:  { done: 0, total: ONBOARDING_PHASE_TOTALS.finances },
    listings:  { done: 0, total: ONBOARDING_PHASE_TOTALS.listings },
  };
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/web && pnpm exec tsc --noEmit 2>&1 | grep -v ".next/types"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/admin/onboarding-phase-counts.ts
git commit -m "feat: add onboarding phase counts data fetcher"
```

---

## Task 7: Build OnboardingPhaseBoard Component

**Files:**
- Create: `apps/web/src/app/(admin)/admin/contacts/OnboardingPhaseBoard.tsx`
- Create: `apps/web/src/app/(admin)/admin/contacts/OnboardingPhaseBoard.module.css`

The phase a contact belongs to is computed from their task counts:
- Documents not complete → Documents column
- Documents complete, Finances not → Finances column
- Documents + Finances complete, Listings not → Listings column

- [ ] **Step 1: Create the CSS module**

```css
/* apps/web/src/app/(admin)/admin/contacts/OnboardingPhaseBoard.module.css */

.board {
  display: flex;
  gap: 12px;
  padding: 14px 24px;
  overflow-x: auto;
  align-items: flex-start;
  flex: 1 1 auto;
  min-height: 0;
  scrollbar-width: none;
}

.board::-webkit-scrollbar {
  display: none;
}

.col {
  flex: 0 0 280px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid transparent;
}

.colHead {
  padding: 10px 14px 12px;
  color: #fff;
}

.colTitle {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.colSub {
  font-size: 10px;
  opacity: 0.75;
  margin-top: 2px;
}

.colCount {
  font-size: 11px;
  opacity: 0.85;
  margin-top: 6px;
}

.colBody {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  flex: 1;
}

/* Cards */
.card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 10px 11px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  text-decoration: none;
  display: block;
  color: inherit;
  transition: box-shadow 120ms ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.cardTop {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 9px;
}

.avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  flex-shrink: 0;
}

.cardName {
  font-size: 11px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.2;
}

.cardMeta {
  font-size: 9px;
  color: #94a3b8;
  margin-top: 1px;
}

/* Phase bars */
.phases {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.phaseRow {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.phaseRow.dim {
  opacity: 0.25;
}

.phaseRow.done {
  opacity: 0.45;
}

.phaseLabel {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.phaseName {
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.phaseFrac {
  font-size: 8px;
  font-weight: 600;
}

.phaseTrack {
  height: 4px;
  border-radius: 2px;
  overflow: hidden;
}

.phaseFill {
  height: 100%;
  border-radius: 2px;
  transition: width 300ms ease;
}

.emptyCol {
  padding: 20px 12px;
  font-size: 11px;
  color: #94a3b8;
  text-align: center;
}
```

- [ ] **Step 2: Create the component**

```typescript
// apps/web/src/app/(admin)/admin/contacts/OnboardingPhaseBoard.tsx
import Link from 'next/link';
import type { ContactRow } from '@/lib/admin/contact-types';
import { fetchOnboardingPhaseCounts, type PhaseCounts } from '@/lib/admin/onboarding-phase-counts';
import styles from './OnboardingPhaseBoard.module.css';

type Props = {
  rows: ContactRow[];
  basePath?: string;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarGradient(id: string): string {
  const hue = parseInt(id.replace(/-/g, '').slice(0, 6), 16) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

function currentPhase(counts: PhaseCounts): 'documents' | 'finances' | 'listings' {
  if (counts.documents.done < counts.documents.total) return 'documents';
  if (counts.finances.done < counts.finances.total) return 'finances';
  return 'listings';
}

function daysSinceStage(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400_000);
  if (days < 1) return 'today';
  if (days === 1) return '1d';
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

const PHASES = [
  {
    key: 'documents' as const,
    label: 'Documents',
    sub: 'Owner provides',
    headStyle: 'linear-gradient(135deg, #F59E0B, #B45309)',
    colBg: 'rgba(245,158,11,0.05)',
    colBorder: 'rgba(245,158,11,0.22)',
    activeColor: '#B45309',
    trackBg: '#fef3c7',
    fillColor: '#F59E0B',
  },
  {
    key: 'finances' as const,
    label: 'Finances',
    sub: 'Admin sets up',
    headStyle: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
    colBg: 'rgba(139,92,246,0.05)',
    colBorder: 'rgba(139,92,246,0.22)',
    activeColor: '#6D28D9',
    trackBg: '#ede9fe',
    fillColor: '#8B5CF6',
  },
  {
    key: 'listings' as const,
    label: 'Listings',
    sub: 'Admin + owner both see',
    headStyle: 'linear-gradient(135deg, #02AAEB, #1B77BE)',
    colBg: 'rgba(2,170,235,0.05)',
    colBorder: 'rgba(2,170,235,0.22)',
    activeColor: '#1B77BE',
    trackBg: '#e0f2fe',
    fillColor: '#02AAEB',
  },
] as const;

type PhaseKey = 'documents' | 'finances' | 'listings';

export async function OnboardingPhaseBoard({ rows, basePath = '/admin/contacts' }: Props) {
  const onboardingRows = rows.filter((r) => r.lifecycleStage === 'onboarding');
  const phaseCounts = await fetchOnboardingPhaseCounts(onboardingRows);

  // Group contacts by their current active phase
  const byPhase: Record<PhaseKey, ContactRow[]> = {
    documents: [],
    finances:  [],
    listings:  [],
  };

  for (const row of onboardingRows) {
    const counts = phaseCounts[row.id];
    if (!counts) {
      byPhase.documents.push(row);
      continue;
    }
    byPhase[currentPhase(counts)].push(row);
  }

  return (
    <div className={styles.board}>
      {PHASES.map((phase) => {
        const contactsInPhase = byPhase[phase.key];
        return (
          <div
            key={phase.key}
            className={styles.col}
            style={{ background: phase.colBg, border: `1px solid ${phase.colBorder}` }}
          >
            <header
              className={styles.colHead}
              style={{ background: phase.headStyle }}
            >
              <div className={styles.colTitle}>{phase.label}</div>
              <div className={styles.colSub}>{phase.sub}</div>
              <div className={styles.colCount}>{contactsInPhase.length} owner{contactsInPhase.length !== 1 ? 's' : ''}</div>
            </header>

            <div className={styles.colBody}>
              {contactsInPhase.length === 0 ? (
                <div className={styles.emptyCol}>No owners in this phase</div>
              ) : (
                contactsInPhase.map((row) => {
                  const counts = phaseCounts[row.id];
                  const href = row.profileId
                    ? `/admin/owners/${row.profileId}`
                    : `${basePath}/${row.id}`;

                  return (
                    <Link key={row.id} href={href} className={styles.card}>
                      <div className={styles.cardTop}>
                        <div
                          className={styles.avatar}
                          style={{ background: avatarGradient(row.id) }}
                        >
                          {initials(row.fullName)}
                        </div>
                        <div>
                          <div className={styles.cardName}>{row.fullName}</div>
                          <div className={styles.cardMeta}>
                            {row.propertyCount} prop{row.propertyCount !== 1 ? 's' : ''} · {daysSinceStage(row.stageChangedAt)}
                          </div>
                        </div>
                      </div>

                      {counts && (
                        <div className={styles.phases}>
                          {PHASES.map((p) => {
                            const pc = counts[p.key];
                            const isActive = p.key === phase.key;
                            const isDone = pc.done >= pc.total;
                            const pct = pc.total === 0 ? 0 : Math.round((pc.done / pc.total) * 100);

                            let rowClass = styles.phaseRow;
                            if (!isActive && isDone) rowClass += ` ${styles.done}`;
                            if (!isActive && !isDone) rowClass += ` ${styles.dim}`;

                            const nameColor = isDone ? '#10B981' : isActive ? p.activeColor : '#94a3b8';
                            const fillColor = isDone ? '#10B981' : p.fillColor;
                            const trackBg   = isDone ? '#dcfce7'  : p.trackBg;

                            return (
                              <div key={p.key} className={rowClass}>
                                <div className={styles.phaseLabel}>
                                  <span className={styles.phaseName} style={{ color: nameColor }}>
                                    {p.label}{isDone ? ' ✓' : ''}
                                  </span>
                                  <span className={styles.phaseFrac} style={{ color: nameColor }}>
                                    {pc.done}/{pc.total}
                                  </span>
                                </div>
                                <div className={styles.phaseTrack} style={{ background: trackBg }}>
                                  <div
                                    className={styles.phaseFill}
                                    style={{ width: `${pct}%`, background: fillColor }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd apps/web && pnpm exec tsc --noEmit 2>&1 | grep -v ".next/types"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/(admin)/admin/contacts/OnboardingPhaseBoard.tsx \
        apps/web/src/app/(admin)/admin/contacts/OnboardingPhaseBoard.module.css
git commit -m "feat: build OnboardingPhaseBoard component with phase progress bars"
```

---

## Task 8: Wire OnboardingPhaseBoard into Page Routing

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/contacts/page.tsx`

- [ ] **Step 1: Add the import**

At the top of `page.tsx`, add:
```typescript
import { OnboardingPhaseBoard } from './OnboardingPhaseBoard';
```

- [ ] **Step 2: Intercept the onboarding view before the status/list render**

In `ContactsPage`, after the `activeMode === 'map'` check and before the `useActiveOwnersGrid` check, add:

```typescript
  // Onboarding uses its own phase board — bypass the Kanban infrastructure entirely
  if (viewKey === 'onboarding') {
    return <OnboardingPhaseBoard rows={rows} />;
  }
```

The full updated function body should look like:

```typescript
export default async function ContactsPage({ searchParams }: Props) {
  const { view, q, mode } = await searchParams;
  const viewKey = view ?? 'lead-pipeline';

  const { rows, activeView } = await fetchAdminContactsList({
    viewKey,
    search: q ?? null,
  });

  const activeMode = mode ?? activeView.viewMode;

  if (activeMode === 'map') {
    return <ContactsMapView rows={rows} />;
  }

  // Onboarding uses its own phase board
  if (viewKey === 'onboarding') {
    return <OnboardingPhaseBoard rows={rows} />;
  }

  const useActiveOwnersGrid =
    viewKey === 'active-owners' && activeMode !== 'compact';

  if (useActiveOwnersGrid) {
    return <ActiveOwnersGrid rows={rows} />;
  }

  if (activeMode === 'status') {
    return <ContactsStatusView viewKey={viewKey} rows={rows} />;
  }

  return <ContactsListView rows={rows} activeView={activeView} />;
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd apps/web && pnpm exec tsc --noEmit 2>&1 | grep -v ".next/types"
```

Expected: no output.

- [ ] **Step 4: Start dev server and verify the full flow**

```bash
cd /Users/johanannunez/workspace/parcel && doppler run -- next dev -p 4000 --turbopack
```

Verify each of these in the browser:

1. `http://localhost:4000/admin/contacts?view=lead-pipeline`
   - 4 columns: Contacted, Qualified, Contract Sent, Cold
   - Cold is collapsed by default
   - No "In Talks" column, no "Onboarding" column
   - Contract Sent cards show green "✓ Mark as Signed" button

2. `http://localhost:4000/admin/contacts?view=onboarding`
   - Three phase columns: Documents (orange), Finances (violet), Listings (blue)
   - Each card shows all three phase progress bars
   - Completed phases show green with ✓
   - Future phases are ghosted

3. `http://localhost:4000/admin/contacts?view=active-owners`
   - Still shows the existing `ActiveOwnersGrid` — no change

4. Click "✓ Mark as Signed" on a Contract Sent card
   - Button shows "Moving..."
   - Card disappears from lead pipeline
   - Contact appears in Onboarding board under Documents column

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/(admin)/admin/contacts/page.tsx
git commit -m "feat: wire OnboardingPhaseBoard into contacts routing for onboarding view"
```

---

## Self-Review

**Spec coverage:**
- ✅ Lead Pipeline: 4 columns (Contacted/Qualified/Contract Sent/Cold) — Tasks 2, 3
- ✅ "In Talks" removed from pipeline — Task 3
- ✅ "Onboarding" column removed from pipeline — Task 3
- ✅ "Inquiry" renamed to "Contacted" — Task 2
- ✅ Mark as Signed action — Tasks 4, 5
- ✅ Seeds 32-task checklist — Task 4 (calls `seedOnboardingTasks`)
- ✅ Onboarding phase board (Documents/Finances/Listings) — Tasks 6, 7, 8
- ✅ Phase bars on all cards showing all 3 phases — Task 7
- ✅ Cards route to owner detail page — Task 7 (`/admin/owners/${profileId}`)
- ✅ Task counts aggregated across all contact's properties — Task 6
- ✅ Real 32-task checklist (10/6/16) — Task 1
- ✅ Active Owners unchanged — no task needed, spec confirms no changes
- ✅ No DB migration needed — confirmed in spec, no migrations added

**Type consistency:**
- `PhaseCounts` defined in Task 6, used in Task 7 via import — consistent
- `fetchOnboardingPhaseCounts` takes `ContactRow[]`, returns `Record<string, PhaseCounts>` — used correctly in Task 7
- `OnboardingPhaseBoard` receives `rows: ContactRow[]` — matches what `page.tsx` passes in Task 8
- `markContractSigned` takes `contactId: string`, returns `Promise<ActionResult>` — called correctly in Task 5

**Placeholder scan:** No TBDs, no TODOs, no "implement later" — all steps have complete code.
