# Client Detail Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Edit drawer on `/admin/clients/[id]` with a persistent right sidebar containing always-visible, click-to-edit contact fields, and redesign the header with a stats strip and follow-up date chip.

**Architecture:** A new `ClientDetailSidebar` client component lives alongside the existing tab content in a flex-row layout. Each field uses a two-state machine (idle/editing) — clicking a value renders an inline input, blur/Enter saves via server action, Escape cancels. The header grows to show four stat chips and two action buttons. The `ClientEditDrawer` is deleted entirely.

**Tech Stack:** Next.js App Router, Supabase, TypeScript, CSS Modules, `libphonenumber-js` (new install), Google Places API (proxied through a Next.js API route using the existing server-side `GOOGLE_MAPS_API_KEY`), `motion/react` for micro-animations, `@phosphor-icons/react` for icons, `date-fns` (already installed) for date formatting.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `apps/web/supabase/migrations/20260424_contacts_new_fields.sql` | Add new columns to contacts |
| Modify | `apps/web/src/lib/admin/client-detail.ts` | Add new fields to type + query |
| Modify | `apps/web/src/app/(admin)/admin/clients/[id]/client-actions.ts` | Handle new fields in updateClientFields |
| Create | `apps/web/src/app/api/places/autocomplete/route.ts` | Proxy to Google Places autocomplete API |
| Create | `apps/web/src/app/api/places/details/route.ts` | Proxy to Google Places details API |
| Create | `apps/web/src/app/(admin)/admin/clients/[id]/StagePopover.tsx` | Stage picker popover with pill UI |
| Create | `apps/web/src/app/(admin)/admin/clients/[id]/StagePopover.module.css` | Stage popover styles |
| Create | `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailSidebar.tsx` | Persistent right sidebar |
| Create | `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailSidebar.module.css` | Sidebar styles |
| Modify | `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailShell.tsx` | New header layout + wire sidebar |
| Modify | `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailShell.module.css` | New layout, header stats, body flex-row |
| Modify | `apps/web/src/app/(admin)/admin/clients/[id]/page.tsx` | Fetch admin profiles, pass to shell |
| Delete | `apps/web/src/app/(admin)/admin/clients/[id]/ClientEditDrawer.tsx` | No longer needed |
| Delete | `apps/web/src/app/(admin)/admin/clients/[id]/ClientEditDrawer.module.css` | No longer needed |

---

## Task 1: DB Migration — New Contacts Columns

**Files:**
- Create: `apps/web/supabase/migrations/20260424_contacts_new_fields.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- apps/web/supabase/migrations/20260424_contacts_new_fields.sql

alter table contacts
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists address_formatted text,
  add column if not exists address_components jsonb,
  add column if not exists social jsonb default '{}'::jsonb,
  add column if not exists preferred_contact_method text
    check (preferred_contact_method in ('email', 'phone', 'text')),
  add column if not exists contract_start_at date,
  add column if not exists contract_end_at date,
  add column if not exists next_follow_up_at date,
  add column if not exists total_properties_owned integer,
  add column if not exists newsletter_subscribed boolean not null default false;

-- Backfill first_name / last_name from full_name for existing rows
update contacts
set
  first_name = split_part(trim(full_name), ' ', 1),
  last_name = case
    when trim(full_name) like '% %'
    then substring(trim(full_name) from position(' ' in trim(full_name)) + 1)
    else null
  end
where first_name is null;
```

- [ ] **Step 2: Apply via Supabase MCP**

Use the `mcp__claude_ai_Supabase__apply_migration` tool with:
- `project_id`: `pwoxwpryummqeqsxdgyc`
- `name`: `contacts_new_fields`
- `query`: the SQL above

Confirm the migration appears in `list_migrations` output before continuing.

---

## Task 2: Install libphonenumber-js

**Files:** `apps/web/package.json` (modified by pnpm)

- [ ] **Step 1: Install the package**

```bash
cd apps/web && pnpm add libphonenumber-js
```

Expected: package appears in `node_modules/libphonenumber-js/` and `package.json` dependencies.

- [ ] **Step 2: Verify the import works**

```bash
cd apps/web && node -e "const {parsePhoneNumber} = require('libphonenumber-js'); console.log(parsePhoneNumber('+15551234567').formatNational())"
```

Expected output: `(555) 123-4567`

---

## Task 3: Google Places API Routes

**Files:**
- Create: `apps/web/src/app/api/places/autocomplete/route.ts`
- Create: `apps/web/src/app/api/places/details/route.ts`

The client-side sidebar calls these routes to keep `GOOGLE_MAPS_API_KEY` server-side only.

- [ ] **Step 1: Create autocomplete route**

```typescript
// apps/web/src/app/api/places/autocomplete/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get('input');
  if (!input || input.trim().length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return NextResponse.json({ error: 'Maps not configured' }, { status: 500 });

  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
    },
    body: JSON.stringify({
      input,
      includedRegionCodes: ['us'],
    }),
  });

  if (!res.ok) return NextResponse.json({ suggestions: [] }, { status: 502 });

  const data = await res.json();
  const suggestions = (data.suggestions ?? []).map((s: Record<string, unknown>) => {
    const pred = s.placePrediction as Record<string, unknown> | undefined;
    return {
      placeId: pred?.placeId as string,
      description: (pred?.text as Record<string, unknown>)?.text as string,
    };
  });

  return NextResponse.json({ suggestions });
}
```

- [ ] **Step 2: Create place details route**

```typescript
// apps/web/src/app/api/places/details/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const placeId = req.nextUrl.searchParams.get('placeId');
  if (!placeId) return NextResponse.json({ error: 'Missing placeId' }, { status: 400 });

  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return NextResponse.json({ error: 'Maps not configured' }, { status: 500 });

  const fields = 'formattedAddress,addressComponents';
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?fields=${fields}`,
    {
      headers: {
        'X-Goog-Api-Key': key,
      },
    }
  );

  if (!res.ok) return NextResponse.json({ error: 'Places API error' }, { status: 502 });

  const data = await res.json();
  return NextResponse.json({
    formatted: data.formattedAddress ?? '',
    components: data.addressComponents ?? [],
  });
}
```

- [ ] **Step 3: Test the autocomplete route manually**

With the dev server running on port 4000:

```bash
curl "http://localhost:4000/api/places/autocomplete?input=123+main" | python3 -m json.tool
```

Expected: JSON with `suggestions` array containing `placeId` and `description` strings.

---

## Task 4: Extend ClientDetail Type + fetchClientDetail Query

**Files:**
- Modify: `apps/web/src/lib/admin/client-detail.ts`

- [ ] **Step 1: Add new fields to the ClientDetail type**

In `client-detail.ts`, replace the `ClientDetail` type definition with:

```typescript
export type ClientDetail = {
  // Contact fields (always present)
  id: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  source: string | null;
  lifecycleStage: LifecycleStage;
  stageChangedAt: string;
  estimatedMrr: number | null;
  assignedTo: string | null;
  assignedToName: string | null;
  createdAt: string;

  // New sidebar fields
  addressFormatted: string | null;
  addressComponents: Record<string, unknown> | null;
  social: { linkedin?: string; instagram?: string; facebook?: string };
  preferredContactMethod: 'email' | 'phone' | 'text' | null;
  contractStartAt: string | null;
  contractEndAt: string | null;
  nextFollowUpAt: string | null;
  totalPropertiesOwned: number | null;
  newsletterSubscribed: boolean;

  // Owner fields (null when contact is a pre-profile lead)
  profileId: string | null;
  entityId: string | null;
  onboardingCompletedAt: string | null;
  properties: ClientProperty[];
  lifetimeRevenue: number | null;
};
```

- [ ] **Step 2: Update the SELECT query in fetchClientDetail**

Replace the `.select(...)` string with:

```typescript
  const { data: contact, error } = await supabase
    .from("contacts")
    .select(
      `id, profile_id, full_name, first_name, last_name, display_name, company_name,
       email, phone, avatar_url, source, lifecycle_stage,
       stage_changed_at, estimated_mrr, assigned_to, created_at,
       address_formatted, address_components, social,
       preferred_contact_method, contract_start_at, contract_end_at,
       next_follow_up_at, total_properties_owned, newsletter_subscribed`
    )
    .eq("id", contactId)
    .single();
```

- [ ] **Step 3: Update the return object in fetchClientDetail**

Add the new fields to the `return { ... }` block at the bottom of `fetchClientDetail`:

```typescript
  return {
    id: contact.id,
    fullName: contact.full_name,
    firstName: (contact as any).first_name ?? null,
    lastName: (contact as any).last_name ?? null,
    displayName: (contact.display_name as string | null) ?? null,
    companyName: (contact.company_name as string | null) ?? null,
    email: (contact.email as string | null) ?? null,
    phone: (contact.phone as string | null) ?? null,
    avatarUrl: (contact.avatar_url as string | null) ?? null,
    source: (contact.source as string | null) ?? null,
    lifecycleStage: contact.lifecycle_stage as LifecycleStage,
    stageChangedAt: contact.stage_changed_at ?? "",
    estimatedMrr: contact.estimated_mrr == null ? null : Number(contact.estimated_mrr),
    assignedTo: (contact.assigned_to as string | null) ?? null,
    assignedToName,
    createdAt: contact.created_at,
    // New sidebar fields
    addressFormatted: (contact as any).address_formatted ?? null,
    addressComponents: (contact as any).address_components ?? null,
    social: (contact as any).social ?? {},
    preferredContactMethod: (contact as any).preferred_contact_method ?? null,
    contractStartAt: (contact as any).contract_start_at ?? null,
    contractEndAt: (contact as any).contract_end_at ?? null,
    nextFollowUpAt: (contact as any).next_follow_up_at ?? null,
    totalPropertiesOwned: (contact as any).total_properties_owned ?? null,
    newsletterSubscribed: (contact as any).newsletter_subscribed ?? false,
    // Owner fields
    profileId,
    entityId,
    onboardingCompletedAt,
    properties,
    lifetimeRevenue,
  };
```

- [ ] **Step 4: Verify no TypeScript errors**

```bash
cd apps/web && pnpm exec tsc --noEmit 2>&1 | grep "client-detail" | head -10
```

Expected: no errors from `client-detail.ts`.

---

## Task 5: Update updateClientFields Server Action

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/client-actions.ts`

- [ ] **Step 1: Add a fetchAdminProfiles export for the assignee picker**

Add this function at the bottom of `client-actions.ts`:

```typescript
export type AdminProfile = { id: string; fullName: string; avatarUrl: string | null };

export async function fetchAdminProfiles(): Promise<AdminProfile[]> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return [];

  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('role', 'admin')
    .order('full_name');

  return (data ?? []).map((p) => ({
    id: p.id,
    fullName: p.full_name ?? '',
    avatarUrl: (p.avatar_url as string | null) ?? null,
  }));
}
```

- [ ] **Step 2: Extend UpdateClientFields type**

Replace the `UpdateClientFields` type with:

```typescript
type UpdateClientFields = Partial<{
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  assignedTo: string | null;
  lifecycleStage: Database["public"]["Enums"]["contact_lifecycle_stage"];
  addressFormatted: string;
  addressComponents: Record<string, unknown>;
  social: { linkedin?: string; instagram?: string; facebook?: string };
  preferredContactMethod: 'email' | 'phone' | 'text' | null;
  contractStartAt: string | null;
  contractEndAt: string | null;
  nextFollowUpAt: string | null;
  totalPropertiesOwned: number | null;
  newsletterSubscribed: boolean;
}>;
```

- [ ] **Step 3: Update the update object construction in updateClientFields**

Replace the entire `const update: ContactUpdate = {}; if (fields...) ...` block with:

```typescript
  const update: ContactUpdate & Record<string, unknown> = {};

  // Derive full_name whenever either name part changes
  if (fields.firstName !== undefined || fields.lastName !== undefined) {
    const first = fields.firstName ?? '';
    const last = fields.lastName ?? '';
    (update as any).first_name = first;
    (update as any).last_name = last;
    update.full_name = [first, last].filter(Boolean).join(' ') || first || last;
  }

  if (fields.email !== undefined) update.email = fields.email;
  if (fields.phone !== undefined) update.phone = fields.phone;
  if (fields.companyName !== undefined) update.company_name = fields.companyName;
  if (fields.assignedTo !== undefined) update.assigned_to = fields.assignedTo;
  if (fields.lifecycleStage !== undefined) {
    update.lifecycle_stage = fields.lifecycleStage;
    update.stage_changed_at = new Date().toISOString();
  }
  if (fields.addressFormatted !== undefined) (update as any).address_formatted = fields.addressFormatted;
  if (fields.addressComponents !== undefined) (update as any).address_components = fields.addressComponents;
  if (fields.social !== undefined) (update as any).social = fields.social;
  if (fields.preferredContactMethod !== undefined) (update as any).preferred_contact_method = fields.preferredContactMethod;
  if (fields.contractStartAt !== undefined) (update as any).contract_start_at = fields.contractStartAt;
  if (fields.contractEndAt !== undefined) (update as any).contract_end_at = fields.contractEndAt;
  if (fields.nextFollowUpAt !== undefined) (update as any).next_follow_up_at = fields.nextFollowUpAt;
  if (fields.totalPropertiesOwned !== undefined) (update as any).total_properties_owned = fields.totalPropertiesOwned;
  if (fields.newsletterSubscribed !== undefined) (update as any).newsletter_subscribed = fields.newsletterSubscribed;
```

- [ ] **Step 4: Verify no TypeScript errors**

```bash
cd apps/web && pnpm exec tsc --noEmit 2>&1 | grep "client-actions" | head -10
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd apps/web && git add src/lib/admin/client-detail.ts src/app/\(admin\)/admin/clients/\[id\]/client-actions.ts src/app/api/places/ supabase/migrations/20260424_contacts_new_fields.sql && git commit -m "feat(clients): extend contact fields — name split, address, social, contract dates, sidebar fields"
```

---

## Task 6: Build StagePopover

**Files:**
- Create: `apps/web/src/app/(admin)/admin/clients/[id]/StagePopover.tsx`
- Create: `apps/web/src/app/(admin)/admin/clients/[id]/StagePopover.module.css`

The stage popover replaces the CustomSelect dropdown for stage selection. It opens as a floating panel below the stage field and shows all stages as colored pill buttons.

- [ ] **Step 1: Create StagePopover.tsx**

```typescript
// apps/web/src/app/(admin)/admin/clients/[id]/StagePopover.tsx
'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import type { LifecycleStage } from '@/lib/admin/contact-types';
import { updateClientFields } from './client-actions';
import styles from './StagePopover.module.css';

type StageOption = {
  value: LifecycleStage;
  label: string;
  color: 'blue' | 'violet' | 'green' | 'amber' | 'gray' | 'red';
};

const STAGES: StageOption[] = [
  { value: 'lead_new',      label: 'New Lead',       color: 'blue'   },
  { value: 'qualified',     label: 'Qualified',      color: 'blue'   },
  { value: 'in_discussion', label: 'In Talks',       color: 'violet' },
  { value: 'contract_sent', label: 'Contract Sent',  color: 'violet' },
  { value: 'onboarding',    label: 'Onboarding',     color: 'amber'  },
  { value: 'active_owner',  label: 'Active Owner',   color: 'green'  },
  { value: 'lead_cold',     label: 'Cold Lead',      color: 'gray'   },
  { value: 'paused',        label: 'Paused',         color: 'gray'   },
  { value: 'churned',       label: 'Churned',        color: 'red'    },
];

export function StagePopover({
  contactId,
  value,
  onChange,
}: {
  contactId: string;
  value: LifecycleStage;
  onChange: (stage: LifecycleStage) => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const current = STAGES.find((s) => s.value === value) ?? STAGES[0];

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function handleSelect(stage: LifecycleStage) {
    setOpen(false);
    onChange(stage);
    startTransition(async () => {
      await updateClientFields(contactId, { lifecycleStage: stage });
    });
  }

  return (
    <div ref={ref} className={styles.root}>
      <button
        className={styles.trigger}
        data-color={current.color}
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        aria-expanded={open}
      >
        {current.label}
        <span className={styles.caret} aria-hidden>▾</span>
      </button>

      {open && (
        <div className={styles.popover} role="listbox">
          {STAGES.map((s) => (
            <button
              key={s.value}
              role="option"
              aria-selected={s.value === value}
              className={styles.option}
              data-color={s.color}
              data-active={s.value === value}
              onClick={() => handleSelect(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create StagePopover.module.css**

```css
/* StagePopover.module.css */
.root {
  position: relative;
  display: inline-block;
}

.trigger {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 20px;
  border: none;
  font-family: inherit;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  text-transform: uppercase;
}

.trigger[data-color="blue"]   { background: color-mix(in srgb, #3b82f6 12%, transparent); color: #2563eb; }
.trigger[data-color="violet"] { background: color-mix(in srgb, #8b5cf6 12%, transparent); color: #7c3aed; }
.trigger[data-color="green"]  { background: color-mix(in srgb, #22c55e 12%, transparent); color: #16a34a; }
.trigger[data-color="amber"]  { background: color-mix(in srgb, #f59e0b 12%, transparent); color: #d97706; }
.trigger[data-color="red"]    { background: color-mix(in srgb, #ef4444 12%, transparent); color: #dc2626; }
.trigger[data-color="gray"]   { background: color-mix(in srgb, var(--color-warm-gray-400) 15%, transparent); color: var(--color-text-secondary); }

.caret {
  font-size: 9px;
  opacity: 0.7;
}

.popover {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 100;
  background: var(--color-surface);
  border: 1px solid var(--color-warm-gray-150);
  border-radius: 12px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  box-shadow: 0 4px 20px color-mix(in srgb, var(--color-navy) 10%, transparent);
  min-width: 140px;
}

.option {
  display: flex;
  align-items: center;
  padding: 7px 10px;
  border-radius: 8px;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  color: var(--color-text-primary);
}

.option:hover { background: var(--color-warm-gray-50); }
.option[data-active="true"] { background: var(--color-warm-gray-100); font-weight: 600; }

.option[data-color="blue"]   { color: #2563eb; }
.option[data-color="violet"] { color: #7c3aed; }
.option[data-color="green"]  { color: #16a34a; }
.option[data-color="amber"]  { color: #d97706; }
.option[data-color="red"]    { color: #dc2626; }
.option[data-color="gray"]   { color: var(--color-text-secondary); }
```

- [ ] **Step 3: Commit**

```bash
cd apps/web && git add "src/app/(admin)/admin/clients/[id]/StagePopover.tsx" "src/app/(admin)/admin/clients/[id]/StagePopover.module.css" && git commit -m "feat(clients): add StagePopover — pill-based stage picker, no dropdown"
```

---

## Task 7: Build ClientDetailSidebar

**Files:**
- Create: `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailSidebar.tsx`
- Create: `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailSidebar.module.css`

This is the core of the redesign. Each field uses a two-state machine: `idle` shows the value as styled text; `editing` shows an input in-place. Blur or Enter saves. Escape cancels.

- [ ] **Step 1: Create ClientDetailSidebar.tsx**

```typescript
// apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailSidebar.tsx
'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import {
  EnvelopeSimple, Phone, ChatTeardrop,
  LinkedinLogo, InstagramLogo, FacebookLogo,
  MapPin, Buildings, Check, Globe,
} from '@phosphor-icons/react';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { format, parseISO } from 'date-fns';
import type { ClientDetail } from '@/lib/admin/client-detail';
import type { AdminProfile } from './client-actions';
import { updateClientFields } from './client-actions';
import { StagePopover } from './StagePopover';
import styles from './ClientDetailSidebar.module.css';

type Social = { linkedin?: string; instagram?: string; facebook?: string };

function formatPhone(raw: string | null): string {
  if (!raw) return '';
  try {
    if (isValidPhoneNumber(raw, 'US')) {
      return parsePhoneNumber(raw, 'US').formatNational();
    }
  } catch { /* fallback */ }
  return raw;
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  try { return format(parseISO(iso), 'MMM d, yyyy'); } catch { return iso; }
}

// ---------------------------------------------------------------------------
// Inline field: text input
// ---------------------------------------------------------------------------
function TextField({
  label,
  value,
  placeholder,
  onSave,
  validate,
  type = 'text',
}: {
  label: string;
  value: string;
  placeholder?: string;
  onSave: (v: string) => Promise<void>;
  validate?: (v: string) => string | null;
  type?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [saving, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  function commit() {
    const trimmed = draft.trim();
    if (validate) {
      const err = validate(trimmed);
      if (err) { setError(err); return; }
    }
    setError(null);
    setEditing(false);
    if (trimmed === value) return;
    startTransition(() => onSave(trimmed));
  }

  function cancel() { setDraft(value); setError(null); setEditing(false); }

  if (!editing) {
    return (
      <div className={styles.field} onClick={() => setEditing(true)}>
        <span className={styles.fieldLabel}>{label}</span>
        <span className={styles.fieldValue} data-empty={!value}>
          {value || placeholder || `Add ${label.toLowerCase()}`}
        </span>
      </div>
    );
  }

  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        ref={inputRef}
        className={styles.fieldInput}
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
        disabled={saving}
        placeholder={placeholder}
      />
      {error && <span className={styles.fieldError}>{error}</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline field: date input (YYYY-MM-DD stored, formatted for display)
// ---------------------------------------------------------------------------
function DateField({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string | null;
  onSave: (v: string | null) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [saving, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(value ?? ''); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  function commit() {
    setEditing(false);
    const next = draft || null;
    if (next === value) return;
    startTransition(() => onSave(next));
  }

  if (!editing) {
    return (
      <div className={styles.field} onClick={() => setEditing(true)}>
        <span className={styles.fieldLabel}>{label}</span>
        <span className={styles.fieldValue} data-empty={!value}>
          {value ? formatDate(value) : `Set ${label.toLowerCase()}`}
        </span>
      </div>
    );
  }

  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        ref={inputRef}
        className={styles.fieldInput}
        type="date"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Escape') { setDraft(value ?? ''); setEditing(false); } }}
        disabled={saving}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Address field with Google Places autocomplete
// ---------------------------------------------------------------------------
type Suggestion = { placeId: string; description: string };

function AddressField({
  value,
  onSave,
}: {
  value: string | null;
  onSave: (formatted: string, components: Record<string, unknown>) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [saving, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  function handleChange(val: string) {
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (val.length < 2) { setSuggestions([]); return; }
    timerRef.current = setTimeout(async () => {
      const res = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(val)}`);
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
    }, 300);
  }

  async function handleSelect(s: Suggestion) {
    setSuggestions([]);
    setEditing(false);
    const res = await fetch(`/api/places/details?placeId=${encodeURIComponent(s.placeId)}`);
    const data = await res.json();
    startTransition(() => onSave(data.formatted, data.components));
  }

  if (!editing) {
    return (
      <div className={styles.field} onClick={() => { setEditing(true); setQuery(''); }}>
        <span className={styles.fieldLabel}>Address</span>
        <span className={styles.fieldValue} data-empty={!value}>
          {value || 'Add address'}
        </span>
      </div>
    );
  }

  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>Address</span>
      <input
        ref={inputRef}
        className={styles.fieldInput}
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') { setSuggestions([]); setEditing(false); } }}
        placeholder={value ?? 'Search address...'}
        disabled={saving}
      />
      {suggestions.length > 0 && (
        <div className={styles.suggestions}>
          {suggestions.map((s) => (
            <button key={s.placeId} className={styles.suggestion} onMouseDown={() => handleSelect(s)}>
              <MapPin size={12} weight="bold" />
              {s.description}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Social media row
// ---------------------------------------------------------------------------
function SocialRow({
  social,
  onSave,
}: {
  social: Social;
  onSave: (s: Social) => Promise<void>;
}) {
  const [editingKey, setEditingKey] = useState<keyof Social | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editingKey) inputRef.current?.focus(); }, [editingKey]);

  function startEdit(key: keyof Social) {
    setEditingKey(key);
    setDraft(social[key] ?? '');
  }

  function commit() {
    if (!editingKey) return;
    const next = { ...social, [editingKey]: draft.trim() || undefined };
    setEditingKey(null);
    startTransition(() => onSave(next));
  }

  const icons: { key: keyof Social; Icon: React.ElementType; label: string }[] = [
    { key: 'linkedin', Icon: LinkedinLogo, label: 'LinkedIn' },
    { key: 'instagram', Icon: InstagramLogo, label: 'Instagram' },
    { key: 'facebook', Icon: FacebookLogo, label: 'Facebook' },
  ];

  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>Social</span>
      {editingKey ? (
        <div className={styles.socialEdit}>
          <input
            ref={inputRef}
            className={styles.fieldInput}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditingKey(null); }}
            placeholder={`${editingKey} URL`}
            disabled={saving}
          />
        </div>
      ) : (
        <div className={styles.socialIcons}>
          {icons.map(({ key, Icon, label }) => (
            <button
              key={key}
              className={styles.socialIcon}
              data-filled={!!social[key]}
              title={social[key] ? `Open ${label}` : `Add ${label}`}
              onClick={() => {
                if (social[key]) { window.open(social[key], '_blank'); }
                else { startEdit(key); }
              }}
              onContextMenu={(e) => { e.preventDefault(); startEdit(key); }}
            >
              <Icon size={16} weight={social[key] ? 'fill' : 'regular'} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contact method toggle
// ---------------------------------------------------------------------------
type ContactMethod = 'email' | 'phone' | 'text';

function ContactMethodField({
  value,
  onSave,
}: {
  value: ContactMethod | null;
  onSave: (v: ContactMethod | null) => Promise<void>;
}) {
  const [saving, startTransition] = useTransition();
  const options: { key: ContactMethod; Icon: React.ElementType; label: string }[] = [
    { key: 'email', Icon: EnvelopeSimple, label: 'Email' },
    { key: 'phone', Icon: Phone, label: 'Phone' },
    { key: 'text', Icon: ChatTeardrop, label: 'Text' },
  ];

  function toggle(key: ContactMethod) {
    const next = value === key ? null : key;
    startTransition(() => onSave(next));
  }

  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>Preferred contact</span>
      <div className={styles.contactMethods}>
        {options.map(({ key, Icon, label }) => (
          <button
            key={key}
            className={styles.contactMethod}
            data-active={value === key}
            title={label}
            onClick={() => toggle(key)}
            disabled={saving}
          >
            <Icon size={13} weight={value === key ? 'fill' : 'regular'} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main sidebar
// ---------------------------------------------------------------------------
export function ClientDetailSidebar({
  client: initialClient,
  admins,
}: {
  client: ClientDetail;
  admins: AdminProfile[];
}) {
  const [client, setClient] = useState(initialClient);
  useEffect(() => { setClient(initialClient); }, [initialClient]);

  const save = useCallback(
    async (fields: Parameters<typeof updateClientFields>[1]) => {
      await updateClientFields(client.id, fields);
    },
    [client.id],
  );

  return (
    <aside className={styles.sidebar}>
      {/* CONTACT */}
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Contact</p>
        <div className={styles.nameRow}>
          <TextField
            label="First name"
            value={client.firstName ?? ''}
            placeholder="First"
            onSave={(v) => { setClient((c) => ({ ...c, firstName: v })); return save({ firstName: v }); }}
          />
          <TextField
            label="Last name"
            value={client.lastName ?? ''}
            placeholder="Last"
            onSave={(v) => { setClient((c) => ({ ...c, lastName: v })); return save({ lastName: v }); }}
          />
        </div>
        <TextField
          label="Email"
          value={client.email ?? ''}
          placeholder="email@example.com"
          type="email"
          validate={(v) => {
            if (!v) return null;
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Enter a valid email address';
          }}
          onSave={(v) => { setClient((c) => ({ ...c, email: v || null })); return save({ email: v || undefined }); }}
        />
        <TextField
          label="Phone"
          value={formatPhone(client.phone)}
          placeholder="+1 (555) 000-0000"
          onSave={(v) => { setClient((c) => ({ ...c, phone: v || null })); return save({ phone: v || undefined }); }}
        />
        <TextField
          label="Company"
          value={client.companyName ?? ''}
          placeholder="Company name"
          onSave={(v) => { setClient((c) => ({ ...c, companyName: v || null })); return save({ companyName: v || undefined }); }}
        />
        <AddressField
          value={client.addressFormatted}
          onSave={(formatted, components) => {
            setClient((c) => ({ ...c, addressFormatted: formatted, addressComponents: components }));
            return save({ addressFormatted: formatted, addressComponents: components });
          }}
        />
        <SocialRow
          social={client.social}
          onSave={(s) => { setClient((c) => ({ ...c, social: s })); return save({ social: s }); }}
        />
      </div>

      {/* PIPELINE */}
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Pipeline</p>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Stage</span>
          <StagePopover
            contactId={client.id}
            value={client.lifecycleStage}
            onChange={(stage) => setClient((c) => ({ ...c, lifecycleStage: stage }))}
          />
        </div>
        <div className={styles.sideBySide}>
          <TextField
            label="Source"
            value={client.source ?? ''}
            placeholder="e.g. Referral"
            onSave={(v) => save({ companyName: v })}
          />
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Assigned to</span>
            <select
              className={styles.assigneeSelect}
              value={client.assignedTo ?? ''}
              onChange={(e) => {
                const val = e.target.value || null;
                setClient((c) => ({ ...c, assignedTo: val }));
                save({ assignedTo: val });
              }}
            >
              <option value="">Unassigned</option>
              {admins.map((a) => (
                <option key={a.id} value={a.id}>{a.fullName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* CONTRACT */}
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Contract</p>
        <div className={styles.sideBySide}>
          <DateField
            label="Start date"
            value={client.contractStartAt}
            onSave={(v) => { setClient((c) => ({ ...c, contractStartAt: v })); return save({ contractStartAt: v }); }}
          />
          <DateField
            label="End date"
            value={client.contractEndAt}
            onSave={(v) => { setClient((c) => ({ ...c, contractEndAt: v })); return save({ contractEndAt: v }); }}
          />
        </div>
        <TextField
          label="Management fee %"
          value={client.estimatedMrr != null ? String(client.estimatedMrr) : ''}
          placeholder="e.g. 20"
          type="number"
          validate={(v) => {
            if (!v) return null;
            const n = parseFloat(v);
            return (n >= 0 && n <= 100) ? null : 'Must be 0–100';
          }}
          onSave={(v) => save({ companyName: v })}
        />
      </div>

      {/* OWNER */}
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Owner</p>
        <ContactMethodField
          value={client.preferredContactMethod}
          onSave={(v) => { setClient((c) => ({ ...c, preferredContactMethod: v })); return save({ preferredContactMethod: v }); }}
        />
        <TextField
          label="Total properties owned"
          value={client.totalPropertiesOwned != null ? String(client.totalPropertiesOwned) : ''}
          placeholder="e.g. 5"
          type="number"
          onSave={(v) => {
            const n = v ? parseInt(v, 10) : null;
            setClient((c) => ({ ...c, totalPropertiesOwned: n }));
            return save({ totalPropertiesOwned: n });
          }}
        />
        <div className={styles.sideBySide}>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Portal access</span>
            <span className={styles.fieldValue} data-empty={!client.profileId}>
              {client.profileId ? 'Active' : 'Not activated'}
            </span>
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Newsletter</span>
            <button
              className={styles.toggle}
              data-on={client.newsletterSubscribed}
              onClick={() => {
                const next = !client.newsletterSubscribed;
                setClient((c) => ({ ...c, newsletterSubscribed: next }));
                save({ newsletterSubscribed: next });
              }}
            >
              <span className={styles.toggleKnob} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Create ClientDetailSidebar.module.css**

```css
/* ClientDetailSidebar.module.css */
.sidebar {
  width: 288px;
  flex-shrink: 0;
  border-left: 1px solid var(--color-warm-gray-100);
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  padding: 16px 0;
  overflow: hidden;
}

.section {
  padding: 0 16px 12px;
  border-bottom: 1px solid var(--color-warm-gray-100);
  margin-bottom: 0;
}

.section:last-child {
  border-bottom: none;
}

.sectionLabel {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-tertiary, var(--color-warm-gray-400));
  margin: 0 0 8px;
  padding-top: 4px;
}

.nameRow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.sideBySide {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

/* Field */
.field {
  padding: 5px 6px;
  border-radius: 7px;
  cursor: pointer;
  position: relative;
}

.field:hover {
  background: var(--color-warm-gray-50);
}

.fieldLabel {
  display: block;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: var(--color-text-tertiary, var(--color-warm-gray-400));
  margin-bottom: 1px;
  text-transform: uppercase;
}

.fieldValue {
  display: block;
  font-size: 12.5px;
  color: var(--color-text-primary);
  line-height: 1.3;
}

.fieldValue[data-empty="true"] {
  color: var(--color-warm-gray-300);
  font-style: italic;
}

.fieldInput {
  width: 100%;
  font-family: inherit;
  font-size: 12.5px;
  color: var(--color-text-primary);
  background: var(--color-warm-gray-50);
  border: 1px solid var(--color-brand);
  border-radius: 6px;
  padding: 4px 7px;
  outline: none;
}

.fieldError {
  display: block;
  font-size: 10.5px;
  color: #dc2626;
  margin-top: 2px;
}

/* Address suggestions */
.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 50;
  background: var(--color-surface);
  border: 1px solid var(--color-warm-gray-150);
  border-radius: 10px;
  box-shadow: 0 4px 16px color-mix(in srgb, var(--color-navy) 10%, transparent);
  overflow: hidden;
}

.suggestion {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 8px 10px;
  background: none;
  border: none;
  font-family: inherit;
  font-size: 12px;
  color: var(--color-text-primary);
  text-align: left;
  cursor: pointer;
}

.suggestion:hover { background: var(--color-warm-gray-50); }

/* Social */
.socialEdit { display: flex; gap: 6px; align-items: center; }

.socialIcons {
  display: flex;
  gap: 6px;
  padding-top: 2px;
}

.socialIcon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid var(--color-warm-gray-150);
  background: var(--color-warm-gray-50);
  color: var(--color-warm-gray-400);
  cursor: pointer;
}

.socialIcon[data-filled="true"] {
  color: var(--color-brand);
  border-color: color-mix(in srgb, var(--color-brand) 30%, transparent);
  background: color-mix(in srgb, var(--color-brand) 8%, transparent);
}

.socialIcon:hover { border-color: var(--color-brand); color: var(--color-brand); }

/* Contact method */
.contactMethods {
  display: flex;
  gap: 4px;
  padding-top: 2px;
}

.contactMethod {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid var(--color-warm-gray-150);
  background: transparent;
  font-family: inherit;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.contactMethod[data-active="true"] {
  background: color-mix(in srgb, var(--color-brand) 10%, transparent);
  border-color: color-mix(in srgb, var(--color-brand) 40%, transparent);
  color: var(--color-brand);
  font-weight: 600;
}

.contactMethod:hover { border-color: var(--color-warm-gray-300); }

/* Assignee select — styled to match inline field look */
.assigneeSelect {
  width: 100%;
  font-family: inherit;
  font-size: 12.5px;
  color: var(--color-text-primary);
  background: transparent;
  border: none;
  outline: none;
  cursor: pointer;
  padding: 0;
  appearance: none;
}

/* Toggle */
.toggle {
  width: 36px;
  height: 20px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  position: relative;
  background: var(--color-warm-gray-200);
  transition: background 150ms ease;
  margin-top: 2px;
  flex-shrink: 0;
}

.toggle[data-on="true"] { background: var(--color-brand); }

.toggleKnob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 14px;
  height: 14px;
  border-radius: 7px;
  background: white;
  transition: transform 150ms ease;
}

.toggle[data-on="true"] .toggleKnob { transform: translateX(16px); }
```

- [ ] **Step 3: Commit**

```bash
cd apps/web && git add "src/app/(admin)/admin/clients/[id]/ClientDetailSidebar.tsx" "src/app/(admin)/admin/clients/[id]/ClientDetailSidebar.module.css" && git commit -m "feat(clients): add ClientDetailSidebar — inline edit per field, 4 sections"
```

---

## Task 8: Redesign ClientDetailShell — Header + Layout + Wire Sidebar

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailShell.tsx`
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailShell.module.css`
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/page.tsx`

- [ ] **Step 1: Fetch admin profiles in page.tsx**

In `page.tsx`, add this import at the top:

```typescript
import { fetchAdminProfiles } from './client-actions';
import type { AdminProfile } from './client-actions';
```

Then inside `ClientDetailPage`, add this call alongside the other parallel fetches:

```typescript
const admins = await fetchAdminProfiles();
```

Pass `admins` to `ClientDetailShell`:

```typescript
  return (
    <ClientDetailShell client={client} admins={admins}>
      {renderTab()}
    </ClientDetailShell>
  );
```

- [ ] **Step 2: Rewrite ClientDetailShell.tsx**

Replace the entire file contents with:

```typescript
// apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailShell.tsx
'use client';

import { Suspense, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { EnvelopeSimple, Phone, ChatCircle, CalendarBlank, Copy } from '@phosphor-icons/react';
import { format, parseISO, differenceInDays } from 'date-fns';
import type { ClientDetail } from '@/lib/admin/client-detail';
import type { AdminProfile } from './client-actions';
import { updateClientFields } from './client-actions';
import { ClientDetailSidebar } from './ClientDetailSidebar';
import styles from './ClientDetailShell.module.css';

type TabKey =
  | 'overview' | 'properties' | 'meetings' | 'intelligence'
  | 'messaging' | 'documents' | 'billing' | 'settings';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview',     label: 'Overview'       },
  { key: 'properties',   label: 'Properties'     },
  { key: 'meetings',     label: 'Meetings'       },
  { key: 'intelligence', label: 'Intelligence'   },
  { key: 'messaging',    label: 'Communication'  },
  { key: 'documents',    label: 'Documents'      },
  { key: 'billing',      label: 'Billing'        },
  { key: 'settings',     label: 'Settings'       },
];

const TAB_KEYS = TABS.map((t) => t.key) as readonly string[];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatCurrency(n: number | null): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function stageDays(changedAt: string): string {
  if (!changedAt) return '—';
  try {
    const days = differenceInDays(new Date(), parseISO(changedAt));
    return days === 0 ? 'today' : `${days}d`;
  } catch { return '—'; }
}

function ClientDetailContent({
  client,
  admins,
  children,
}: {
  client: ClientDetail;
  admins: AdminProfile[];
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawTab = searchParams.get('tab');
  const activeTab: TabKey = rawTab && TAB_KEYS.includes(rawTab) ? (rawTab as TabKey) : 'overview';
  const [, startTransition] = useTransition();

  const displayName = [client.firstName, client.lastName].filter(Boolean).join(' ') || client.fullName;

  const followUpOverdue = client.nextFollowUpAt
    ? new Date(client.nextFollowUpAt) < new Date()
    : false;

  return (
    <div className={styles.shell}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.identity}>
            {client.avatarUrl ? (
              <img src={client.avatarUrl} alt={displayName} className={styles.avatar} />
            ) : (
              <div className={styles.avatarFallback}>{getInitials(displayName)}</div>
            )}
            <div className={styles.nameBlock}>
              <h1 className={styles.name}>{displayName}</h1>
              {client.companyName && <p className={styles.company}>{client.companyName}</p>}
              <div className={styles.contactRow}>
                {client.email && (
                  <button className={styles.contactChip} onClick={() => navigator.clipboard.writeText(client.email!)}>
                    <EnvelopeSimple size={11} weight="bold" />
                    {client.email}
                  </button>
                )}
                {client.phone && (
                  <button className={styles.contactChip} onClick={() => navigator.clipboard.writeText(client.phone!)}>
                    <Phone size={11} weight="bold" />
                    {client.phone}
                  </button>
                )}
              </div>
              {client.nextFollowUpAt && (
                <div className={styles.followUpChip} data-overdue={followUpOverdue}>
                  <CalendarBlank size={11} weight="bold" />
                  Follow up {format(parseISO(client.nextFollowUpAt), 'MMM d')}
                  {followUpOverdue && ' — overdue'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{client.properties.length}</span>
              <span className={styles.statLabel}>Properties</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{formatCurrency(client.lifetimeRevenue)}</span>
              <span className={styles.statLabel}>Lifetime revenue</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{stageDays(client.stageChangedAt)}</span>
              <span className={styles.statLabel}>In stage</span>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button
              className={styles.actionBtn}
              onClick={() => router.push(`?tab=messaging`, { scroll: false } as Parameters<typeof router.push>[1])}
            >
              <ChatCircle size={15} weight="bold" />
              Message
            </button>
            <button
              className={styles.actionBtn}
              onClick={() => router.push(`?tab=meetings`, { scroll: false } as Parameters<typeof router.push>[1])}
            >
              <CalendarBlank size={15} weight="bold" />
              Meeting
            </button>
          </div>
        </div>
      </header>

      {/* ── Tab bar ────────────────────────────────────────────────── */}
      <nav className={styles.tabBar} aria-label="Client sections">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`?tab=${tab.key}`}
            scroll={false}
            className={styles.tab}
            data-active={activeTab === tab.key ? 'true' : 'false'}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {/* ── Body: content + sidebar ────────────────────────────────── */}
      <div className={styles.body}>
        <main className={styles.content}>{children}</main>
        <ClientDetailSidebar client={client} admins={admins} />
      </div>
    </div>
  );
}

export function ClientDetailShell({
  client,
  admins,
  children,
}: {
  client: ClientDetail;
  admins: AdminProfile[];
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className={styles.shell} />}>
      <ClientDetailContent client={client} admins={admins}>{children}</ClientDetailContent>
    </Suspense>
  );
}
```

- [ ] **Step 3: Rewrite ClientDetailShell.module.css**

Replace the entire file with:

```css
/* ClientDetailShell.module.css */
.shell {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: var(--color-warm-gray-50);
}

/* ── Header ──────────────────────────────────────────────────────────── */
.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 28px 18px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-warm-gray-100);
  flex-shrink: 0;
  gap: 24px;
}

.headerLeft { display: flex; align-items: flex-start; min-width: 0; }
.headerRight {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  flex-shrink: 0;
}

.identity {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  min-width: 0;
}

:root {
  --avatar-shadow: 0 2px 4px color-mix(in srgb, var(--color-navy) 6%, transparent),
                   0 10px 24px -14px color-mix(in srgb, var(--color-brand-light) 40%, transparent);
}

.avatar, .avatarFallback {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  flex-shrink: 0;
  box-shadow: var(--avatar-shadow);
}

.avatar { object-fit: cover; }

.avatarFallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-brand-gradient);
  color: var(--color-white);
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.nameBlock {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.name {
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--color-text-primary);
  line-height: 1.2;
  margin: 0;
}

.company {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin: 0;
}

.contactRow {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.contactChip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px 2px 6px;
  border-radius: 6px;
  border: 1px solid var(--color-warm-gray-150);
  background: transparent;
  font-family: inherit;
  font-size: 11.5px;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.contactChip:hover { border-color: var(--color-warm-gray-300); color: var(--color-text-primary); }
.contactChip:active { transform: scale(0.98); }

.followUpChip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px 2px 6px;
  border-radius: 6px;
  background: color-mix(in srgb, #f59e0b 12%, transparent);
  color: #b45309;
  border: 1px solid color-mix(in srgb, #f59e0b 30%, transparent);
  width: fit-content;
}

.followUpChip[data-overdue="true"] {
  background: color-mix(in srgb, #ef4444 12%, transparent);
  color: #dc2626;
  border-color: color-mix(in srgb, #ef4444 30%, transparent);
}

/* Stats strip */
.stats {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
}

.statValue {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
  line-height: 1;
}

.statLabel {
  font-size: 10px;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.headerActions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.actionBtn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 12px;
  border: 1px solid var(--color-warm-gray-200);
  border-radius: 9px;
  background: var(--color-surface);
  color: var(--color-text-primary);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease, transform 120ms ease;
}

.actionBtn:hover {
  border-color: var(--color-warm-gray-400);
  background: var(--color-warm-gray-50);
}

.actionBtn:focus-visible { outline: 2px solid var(--color-brand); outline-offset: 2px; }
.actionBtn:active { transform: translateY(1px); }

/* ── Tab bar ─────────────────────────────────────────────────────────── */
.tabBar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 28px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-warm-gray-100);
  overflow-x: auto;
  flex-shrink: 0;
  scrollbar-width: none;
}

.tabBar::-webkit-scrollbar { display: none; }

.tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 11px 13px;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition: color 120ms ease;
  border-radius: 0;
}

.tab:hover { color: var(--color-text-primary); }
.tab:focus-visible { outline: 2px solid var(--color-brand); outline-offset: -2px; border-radius: 4px; }
.tab:active { opacity: 0.75; }
.tab[data-active="true"] { color: var(--color-brand); font-weight: 600; }
.tab[data-active="true"]::after {
  content: '';
  position: absolute;
  left: 9px; right: 9px; bottom: -1px;
  height: 2px;
  background: var(--color-brand);
  border-radius: 2px 2px 0 0;
}

/* ── Body ────────────────────────────────────────────────────────────── */
.body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 28px;
  min-width: 0;
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd apps/web && pnpm exec tsc --noEmit 2>&1 | grep -E "ClientDetailShell|ClientDetailSidebar" | head -15
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd apps/web && git add "src/app/(admin)/admin/clients/[id]/ClientDetailShell.tsx" "src/app/(admin)/admin/clients/[id]/ClientDetailShell.module.css" "src/app/(admin)/admin/clients/[id]/page.tsx" && git commit -m "feat(clients): redesign header with stats strip + wire persistent sidebar"
```

---

## Task 9: Remove ClientEditDrawer

**Files:**
- Delete: `apps/web/src/app/(admin)/admin/clients/[id]/ClientEditDrawer.tsx`
- Delete: `apps/web/src/app/(admin)/admin/clients/[id]/ClientEditDrawer.module.css`

- [ ] **Step 1: Delete the files**

```bash
rm "apps/web/src/app/(admin)/admin/clients/[id]/ClientEditDrawer.tsx"
rm "apps/web/src/app/(admin)/admin/clients/[id]/ClientEditDrawer.module.css"
```

- [ ] **Step 2: Verify nothing imports the drawer**

```bash
grep -r "ClientEditDrawer" apps/web/src/ --include="*.tsx" --include="*.ts"
```

Expected: no output. If any results appear, remove those imports before continuing.

- [ ] **Step 3: Verify build passes**

```bash
cd apps/web && pnpm exec tsc --noEmit 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
cd apps/web && git add -A && git commit -m "chore(clients): remove ClientEditDrawer — editing moved to inline sidebar"
```

---

## Task 10: Screenshot Verification

**Files:** No code changes — visual verification only.

- [ ] **Step 1: Start dev server if not running**

```bash
cd apps/web && doppler run -- next dev -p 4000
```

- [ ] **Step 2: Navigate to any client detail page**

```bash
open "http://localhost:4000/admin/clients"
```

Click any client card to open the detail page.

- [ ] **Step 3: Take a baseline screenshot**

```bash
cd /Users/johanannunez/workspace/parcel && node screenshot.mjs "http://localhost:4000/admin/clients/[REPLACE_WITH_REAL_ID]" "client-detail-baseline" --update-baseline
```

- [ ] **Step 4: Verify sidebar has no scroll**

Visually confirm all four sidebar sections (Contact, Pipeline, Contract, Owner) are fully visible without scrolling. If any section is cut off, reduce section padding in `ClientDetailSidebar.module.css` (try `padding-bottom: 8px` on `.section`).

- [ ] **Step 5: Verify stage popover works**

Click the stage pill in the sidebar. The popover should open inline, show all stage options, and close when you click a stage or click outside. No drawer should open.

- [ ] **Step 6: Verify header stats show**

Confirm Properties count, Lifetime Revenue, and In Stage days all show correct values (or "—" for nulls). Confirm follow-up chip only appears when `nextFollowUpAt` is set.

- [ ] **Step 7: Verify address autocomplete**

Click the Address field in the sidebar. Type a partial address (e.g. "123 main"). Confirm suggestions dropdown appears. Select a suggestion. Confirm the formatted address appears in the field after selection.

- [ ] **Step 8: Final commit**

```bash
cd apps/web && git add -A && git commit -m "feat(clients): client detail redesign complete — persistent sidebar, header stats, inline edit"
```
