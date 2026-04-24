# Quo Communication Intelligence — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Quo (OpenPhone) so every inbound call and SMS is captured, attributed to the right person (owner, contact, or vendor) via a unified resolver, analyzed by Claude, and surfaced on the admin dashboard and each entity's detail page.

**Architecture:** A Quo webhook handler captures every event into a `communication_events` table and returns 200 immediately. A 15-minute Vercel cron groups events by entity, runs Claude via OpenRouter, writes tiers and summaries back to the event rows, and upserts action-required/FYI items into `ai_insights`. A shared `CommunicationsTab` component renders history on owner, contact, and vendor detail pages.

**Tech Stack:** Next.js App Router, Supabase (service client for webhook/cron), OpenRouter `anthropic/claude-haiku-4-5`, Vercel cron, TypeScript, CSS Modules.

---

## File Map

**New files:**
- `apps/web/supabase/migrations/20260424_vendors.sql`
- `apps/web/supabase/migrations/20260424_communication_events.sql`
- `apps/web/supabase/migrations/20260424_ai_insights_vendor.sql`
- `apps/web/src/lib/admin/normalize-phone.ts`
- `apps/web/src/lib/admin/resolve-phone.ts`
- `apps/web/src/lib/admin/communication-types.ts`
- `apps/web/src/lib/admin/communication-intelligence.ts`
- `apps/web/src/app/api/webhooks/quo/route.ts`
- `apps/web/src/app/api/cron/communication-intelligence/route.ts`
- `apps/web/src/lib/admin/communication-actions.ts`
- `apps/web/src/components/admin/CommunicationsTab.tsx`
- `apps/web/src/components/admin/CommunicationsTab.module.css`
- `apps/web/src/components/admin/CommunicationsPanel.tsx`
- `apps/web/src/components/admin/CommunicationsPanel.module.css`
- `apps/web/src/app/(admin)/admin/vendors/page.tsx`
- `apps/web/src/app/(admin)/admin/vendors/VendorsList.tsx`
- `apps/web/src/app/(admin)/admin/vendors/VendorsList.module.css`
- `apps/web/src/app/(admin)/admin/vendors/CreateVendorModal.tsx`
- `apps/web/src/app/(admin)/admin/vendors/CreateVendorModal.module.css`
- `apps/web/src/lib/admin/vendor-actions.ts`
- `apps/web/src/lib/admin/vendors-list.ts`

**Modified files:**
- `apps/web/src/lib/admin/ai-insights.ts` — add `'owner'` and `'vendor'` to `Insight.parentType`
- `apps/web/src/lib/admin/insight-types.ts` — add `CommunicationInsightPayload` type
- `apps/web/vercel.json` — add communication-intelligence cron
- `apps/web/src/app/(admin)/admin/owners/[entityId]/page.tsx` — add `communications` tab
- `apps/web/src/app/(admin)/admin/contacts/[id]/page.tsx` — add `communications` tab
- `apps/web/src/app/(admin)/admin/page.tsx` — add `CommunicationsPanel`
- `apps/web/src/components/admin/chrome/AdminSidebar.tsx` (or equivalent nav file) — add Vendors nav item

---

## Task 1: DB Migration — Vendors + Vendor Properties

**Files:**
- Create: `apps/web/supabase/migrations/20260424_vendors.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- apps/web/supabase/migrations/20260424_vendors.sql

create table if not exists public.vendors (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references public.profiles(id) on delete cascade,
  full_name      text not null,
  company_name   text,
  phone          text,
  email          text,
  trade          text,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists vendors_phone_idx on public.vendors (phone);
create index if not exists vendors_profile_id_idx on public.vendors (profile_id);

create table if not exists public.vendor_properties (
  vendor_id    uuid not null references public.vendors(id) on delete cascade,
  property_id  uuid not null references public.properties(id) on delete cascade,
  primary key (vendor_id, property_id)
);

alter table public.vendors enable row level security;
alter table public.vendor_properties enable row level security;

create policy "Admins can manage vendors"
  on public.vendors
  for all
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can manage vendor_properties"
  on public.vendor_properties
  for all
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
```

- [ ] **Step 2: Apply migration via Supabase MCP**

Use the `mcp__claude_ai_Supabase__apply_migration` tool with:
- `project_id`: `pwoxwpryummqeqsxdgyc`
- `name`: `20260424_vendors`
- `query`: the SQL above

- [ ] **Step 3: Verify in Supabase**

Use `mcp__claude_ai_Supabase__execute_sql` with:
```sql
select table_name from information_schema.tables
where table_schema = 'public' and table_name in ('vendors', 'vendor_properties');
```
Expected: 2 rows returned.

- [ ] **Step 4: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/supabase/migrations/20260424_vendors.sql
git commit -m "feat: add vendors and vendor_properties tables"
```

---

## Task 2: DB Migration — Communication Events

**Files:**
- Create: `apps/web/supabase/migrations/20260424_communication_events.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- apps/web/supabase/migrations/20260424_communication_events.sql

create table if not exists public.communication_events (
  id                 uuid primary key default gen_random_uuid(),
  profile_id         uuid not null references public.profiles(id) on delete cascade,
  quo_id             text unique not null,
  channel            text not null check (channel in ('call', 'sms')),
  direction          text not null check (direction in ('inbound', 'outbound')),
  phone_from         text not null,
  phone_to           text not null,
  raw_transcript     text,
  duration_seconds   int,
  entity_type        text check (entity_type in ('owner', 'contact', 'vendor', 'unknown')),
  entity_id          uuid,
  process_after      timestamptz,
  processed_at       timestamptz,
  tier               text check (tier in ('action_required', 'fyi', 'noise')),
  claude_summary     text,
  created_at         timestamptz not null default now()
);

-- Only index rows that still need processing
create index if not exists communication_events_pipeline_idx
  on public.communication_events (process_after)
  where processed_at is null;

create index if not exists communication_events_entity_idx
  on public.communication_events (entity_type, entity_id);

create index if not exists communication_events_phone_from_idx
  on public.communication_events (phone_from);

alter table public.communication_events enable row level security;

create policy "Admins can manage communication_events"
  on public.communication_events
  for all
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
```

- [ ] **Step 2: Apply migration via Supabase MCP**

Use `mcp__claude_ai_Supabase__apply_migration` with:
- `project_id`: `pwoxwpryummqeqsxdgyc`
- `name`: `20260424_communication_events`
- `query`: the SQL above

- [ ] **Step 3: Verify**

```sql
select column_name, data_type from information_schema.columns
where table_name = 'communication_events' order by ordinal_position;
```
Expected: 15 columns including `tier` and `claude_summary`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/supabase/migrations/20260424_communication_events.sql
git commit -m "feat: add communication_events table"
```

---

## Task 3: DB Migration — Extend ai_insights for Owner and Vendor

**Files:**
- Create: `apps/web/supabase/migrations/20260424_ai_insights_vendor.sql`
- Modify: `apps/web/src/lib/admin/ai-insights.ts`

- [ ] **Step 1: Write the migration SQL**

```sql
-- apps/web/supabase/migrations/20260424_ai_insights_vendor.sql

alter table public.ai_insights
  drop constraint if exists ai_insights_parent_type_check,
  add constraint ai_insights_parent_type_check
    check (parent_type in ('contact', 'property', 'project', 'vendor', 'owner'));
```

- [ ] **Step 2: Apply migration via Supabase MCP**

Use `mcp__claude_ai_Supabase__apply_migration` with:
- `project_id`: `pwoxwpryummqeqsxdgyc`
- `name`: `20260424_ai_insights_vendor`
- `query`: the SQL above

- [ ] **Step 3: Update the Insight type in ai-insights.ts**

Read `apps/web/src/lib/admin/ai-insights.ts`. Find the `Insight` type and update `parentType`:

```typescript
export type Insight = {
  id: string;
  parentType: 'contact' | 'property' | 'project' | 'vendor' | 'owner';
  parentId: string;
  agentKey: string;
  severity: InsightSeverity;
  title: string;
  body: string;
  actionLabel: string | null;
  createdAt: string;
};
```

Update both `Insight` and the cast inside `fetchInsightsByParent` and `fetchInsightsByParentWithPayload` — change:
```typescript
parentType: r.parent_type as Insight['parentType'],
```
(The cast already works since it's typed against the updated union.)

- [ ] **Step 4: Commit**

```bash
git add apps/web/supabase/migrations/20260424_ai_insights_vendor.sql apps/web/src/lib/admin/ai-insights.ts
git commit -m "feat: extend ai_insights parent_type to support owner and vendor"
```

---

## Task 4: Phone Normalizer + Communication Types

**Files:**
- Create: `apps/web/src/lib/admin/normalize-phone.ts`
- Create: `apps/web/src/lib/admin/communication-types.ts`

- [ ] **Step 1: Write normalize-phone.ts**

```typescript
// apps/web/src/lib/admin/normalize-phone.ts

/**
 * Normalize a phone number string to E.164 format (+15095551234).
 * Handles US numbers only. Returns the original string if it cannot
 * be parsed to a 10 or 11-digit number.
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (raw.startsWith('+')) return raw;
  return raw;
}
```

- [ ] **Step 2: Write communication-types.ts**

```typescript
// apps/web/src/lib/admin/communication-types.ts

export type ResolvedEntity =
  | { type: 'owner';   entityId: string; displayName: string; propertyIds: string[] }
  | { type: 'contact'; entityId: string; displayName: string; propertyIds: string[] }
  | { type: 'vendor';  entityId: string; displayName: string; propertyIds: string[] }
  | { type: 'unknown'; phone: string };

export type CommunicationEvent = {
  id: string;
  quoId: string;
  channel: 'call' | 'sms';
  direction: 'inbound' | 'outbound';
  phoneFrom: string;
  phoneTo: string;
  rawTranscript: string | null;
  durationSeconds: number | null;
  entityType: 'owner' | 'contact' | 'vendor' | 'unknown' | null;
  entityId: string | null;
  processAfter: string | null;
  processedAt: string | null;
  tier: 'action_required' | 'fyi' | 'noise' | null;
  claudeSummary: string | null;
  createdAt: string;
};

export type CommunicationInsightPayload = {
  bucket: 'communication';
  tier: 'action_required' | 'fyi';
  actionItems: string[];
  sentiment: 'positive' | 'neutral' | 'concerned';
  eventIds: string[];
  channel: 'call' | 'sms' | 'mixed';
};
```

- [ ] **Step 3: Add CommunicationInsightPayload to insight-types.ts**

Read `apps/web/src/lib/admin/insight-types.ts`. Add the export at the bottom:

```typescript
export type { CommunicationInsightPayload } from './communication-types';
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit 2>&1 | head -30
```
Expected: no errors related to the new files.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/admin/normalize-phone.ts apps/web/src/lib/admin/communication-types.ts apps/web/src/lib/admin/insight-types.ts
git commit -m "feat: add phone normalizer and communication type definitions"
```

---

## Task 5: Contact Resolver

**Files:**
- Create: `apps/web/src/lib/admin/resolve-phone.ts`

- [ ] **Step 1: Write resolve-phone.ts**

```typescript
// apps/web/src/lib/admin/resolve-phone.ts
import 'server-only';
import { createServiceClient } from '@/lib/supabase/service';
import { normalizePhone } from './normalize-phone';
import type { ResolvedEntity } from './communication-types';

/**
 * Resolve a phone number to an entity in priority order:
 * owner (profiles) > contact (contacts) > vendor (vendors) > unknown.
 *
 * All three queries run in parallel. First match by priority wins.
 * Phone is normalized to E.164 before lookup.
 */
export async function resolvePhone(rawPhone: string): Promise<ResolvedEntity> {
  const phone = normalizePhone(rawPhone);
  const supabase = createServiceClient();

  const [ownerResult, contactResult, vendorResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('phone', phone)
      .eq('role', 'owner')
      .maybeSingle(),
    supabase
      .from('contacts')
      .select('id, full_name, display_name')
      .eq('phone', phone)
      .maybeSingle(),
    supabase
      .from('vendors')
      .select('id, full_name')
      .eq('phone', phone)
      .maybeSingle(),
  ]);

  if (ownerResult.data) {
    const { data: propData } = await supabase
      .from('property_owners')
      .select('property_id')
      .eq('owner_id', ownerResult.data.id);
    return {
      type: 'owner',
      entityId: ownerResult.data.id,
      displayName: ownerResult.data.full_name ?? phone,
      propertyIds: (propData ?? []).map((r) => r.property_id),
    };
  }

  if (contactResult.data) {
    return {
      type: 'contact',
      entityId: contactResult.data.id,
      displayName:
        contactResult.data.display_name ??
        contactResult.data.full_name ??
        phone,
      propertyIds: [],
    };
  }

  if (vendorResult.data) {
    const { data: vpData } = await supabase
      .from('vendor_properties')
      .select('property_id')
      .eq('vendor_id', vendorResult.data.id);
    return {
      type: 'vendor',
      entityId: vendorResult.data.id,
      displayName: vendorResult.data.full_name ?? phone,
      propertyIds: (vpData ?? []).map((r) => r.property_id),
    };
  }

  return { type: 'unknown', phone };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit 2>&1 | head -20
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/admin/resolve-phone.ts
git commit -m "feat: add contact resolver resolvePhone()"
```

---

## Task 6: Quo Webhook Handler

**Files:**
- Create: `apps/web/src/app/api/webhooks/quo/route.ts`

The webhook receives three event types from Quo (OpenPhone):
- `call.transcription.completed`: inbound call with transcript
- `message.received`: inbound SMS
- `message.delivered`: outbound SMS (context only, no processing trigger)

Quo signs requests with HMAC-SHA256. The signature is sent in the `x-openphone-signature` header over the raw request body, using `QUO_WEBHOOK_SECRET`.

- [ ] **Step 1: Write the webhook handler**

```typescript
// apps/web/src/app/api/webhooks/quo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { createServiceClient } from '@/lib/supabase/service';
import { resolvePhone } from '@/lib/admin/resolve-phone';
import { normalizePhone } from '@/lib/admin/normalize-phone';

export const dynamic = 'force-dynamic';

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  return expected === signature;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.QUO_WEBHOOK_SECRET;
  const rawBody = await req.text();

  if (secret) {
    const sig = req.headers.get('x-openphone-signature') ?? '';
    if (!verifySignature(rawBody, sig, secret)) {
      console.warn('[quo-webhook] invalid signature');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = payload.type as string | undefined;
  const data = payload.data as Record<string, unknown> | undefined;

  if (!event || !data) {
    return NextResponse.json({ ok: true, skipped: 'missing event or data' });
  }

  if (
    event !== 'call.transcription.completed' &&
    event !== 'message.received' &&
    event !== 'message.delivered'
  ) {
    return NextResponse.json({ ok: true, skipped: event });
  }

  const quoId = (data.id ?? data.callId ?? data.messageId) as string | undefined;
  if (!quoId) {
    return NextResponse.json({ ok: true, skipped: 'no id' });
  }

  const phoneFrom = normalizePhone(
    (event === 'message.delivered'
      ? (data.from as string | undefined)
      : (data.from as string | undefined)) ?? ''
  );
  const phoneTo = normalizePhone((data.to as string | undefined) ?? '');

  if (!phoneFrom) {
    return NextResponse.json({ ok: true, skipped: 'no phone_from' });
  }

  const isInbound = event !== 'message.delivered';
  const channel: 'call' | 'sms' = event === 'call.transcription.completed' ? 'call' : 'sms';
  const direction: 'inbound' | 'outbound' = isInbound ? 'inbound' : 'outbound';

  const rawTranscript =
    channel === 'call'
      ? ((data.transcript as string | undefined) ?? null)
      : ((data.body ?? data.text) as string | undefined) ?? null;

  const durationSeconds =
    channel === 'call' ? ((data.duration as number | undefined) ?? null) : null;

  const resolved = isInbound ? await resolvePhone(phoneFrom) : null;

  const supabase = createServiceClient();

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle();

  if (!adminProfile) {
    console.error('[quo-webhook] no admin profile found');
    return NextResponse.json({ ok: true, skipped: 'no admin profile' });
  }

  const processAfter = isInbound
    ? new Date(Date.now() + 25 * 60 * 1000).toISOString()
    : null;

  const { error } = await supabase.from('communication_events').upsert(
    {
      profile_id: adminProfile.id,
      quo_id: quoId,
      channel,
      direction,
      phone_from: phoneFrom,
      phone_to: phoneTo,
      raw_transcript: rawTranscript,
      duration_seconds: durationSeconds,
      entity_type: resolved?.type ?? null,
      entity_id: resolved && resolved.type !== 'unknown' ? resolved.entityId : null,
      process_after: processAfter,
    },
    { onConflict: 'quo_id', ignoreDuplicates: true }
  );

  if (error) {
    console.error('[quo-webhook] insert error:', error.code, error.message);
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/api/webhooks/quo/route.ts
git commit -m "feat: add Quo webhook handler with HMAC validation and contact resolution"
```

---

## Task 7: Communication Intelligence Library

**Files:**
- Create: `apps/web/src/lib/admin/communication-intelligence.ts`

This library is called by the cron. It finds all unprocessed communication events, groups them by entity, calls Claude via OpenRouter, writes tiers and summaries back to the event rows, and upserts insights.

- [ ] **Step 1: Write communication-intelligence.ts**

```typescript
// apps/web/src/lib/admin/communication-intelligence.ts
import 'server-only';
import { createServiceClient } from '@/lib/supabase/service';
import type { CommunicationInsightPayload } from './communication-types';

const OPENROUTER_MODEL = 'anthropic/claude-haiku-4-5';

type EventRow = {
  id: string;
  channel: 'call' | 'sms';
  direction: 'inbound' | 'outbound';
  phone_from: string;
  raw_transcript: string | null;
  duration_seconds: number | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
};

type ClaudeAnalysis = {
  tier: 'action_required' | 'fyi' | 'noise';
  summary: string;
  actionItems: string[];
  sentiment: 'positive' | 'neutral' | 'concerned';
};

type EntityGroup = {
  entityType: 'owner' | 'contact' | 'vendor' | 'unknown';
  entityId: string | null;
  phoneFrom: string;
  events: EventRow[];
};

async function callClaude(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<ClaudeAnalysis | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        max_tokens: 1000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenRouter error ${res.status}: ${body}`);
    }
    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const text = data.choices[0]?.message?.content ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as ClaudeAnalysis;
  } catch (err) {
    console.error('[comm-intel] claude error:', err);
    return null;
  }
}

function buildSystemPrompt(): string {
  return `You are an AI assistant for a short-term rental property management company. Your job is to analyze a communication thread (calls and/or texts) between the property manager and one of their contacts, and classify the conversation.

Return a JSON object with exactly these fields:
{
  "tier": "action_required" | "fyi" | "noise",
  "summary": "One clear paragraph summarizing what was discussed.",
  "actionItems": ["string", ...],
  "sentiment": "positive" | "neutral" | "concerned"
}

Tier definitions:
- "action_required": The contact wants something, mentioned a problem, referenced an invoice or date/deadline, or the conversation needs a follow-up decision.
- "fyi": Informational update, confirmation, or check-in. Worth logging but no action needed.
- "noise": Purely social ("thanks", "sounds good", "on my way") with no substance. Do NOT surface this.

If tier is "noise", actionItems must be an empty array.
Always return valid JSON. No markdown, no explanation outside the JSON object.`;
}

function buildUserPrompt(group: EntityGroup, entityContext: string): string {
  const lines: string[] = [
    `Contact: ${entityContext}`,
    `Communication window:`,
  ];
  for (const ev of group.events) {
    const direction = ev.direction === 'inbound' ? 'THEM' : 'YOU';
    const type = ev.channel === 'call' ? `[CALL ${ev.duration_seconds ?? '?'}s]` : '[SMS]';
    lines.push(`${type} ${direction}: ${ev.raw_transcript ?? '(no content)'}`);
  }
  return lines.join('\n');
}

async function getEntityContext(
  supabase: ReturnType<typeof createServiceClient>,
  group: EntityGroup
): Promise<string> {
  if (!group.entityId || group.entityType === 'unknown') {
    return `Unknown caller (${group.phoneFrom})`;
  }
  if (group.entityType === 'owner') {
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', group.entityId)
      .maybeSingle();
    return data?.full_name ? `Owner: ${data.full_name}` : `Owner (${group.phoneFrom})`;
  }
  if (group.entityType === 'contact') {
    const { data } = await supabase
      .from('contacts')
      .select('full_name, display_name, lifecycle_stage')
      .eq('id', group.entityId)
      .maybeSingle();
    const name = data?.display_name ?? data?.full_name ?? group.phoneFrom;
    return `Contact: ${name} (${data?.lifecycle_stage ?? 'unknown stage'})`;
  }
  if (group.entityType === 'vendor') {
    const { data } = await supabase
      .from('vendors')
      .select('full_name, trade, company_name')
      .eq('id', group.entityId)
      .maybeSingle();
    const name = data?.full_name ?? group.phoneFrom;
    const trade = data?.trade ?? data?.company_name ?? 'vendor';
    return `Vendor: ${name} (${trade})`;
  }
  return group.phoneFrom;
}

export async function runCommunicationIntelligenceSync(): Promise<{
  processed: number;
  skipped: number;
  errors: number;
}> {
  const supabase = createServiceClient();
  const apiKey = process.env.OPENROUTER_API_PARCEL;
  if (!apiKey) throw new Error('OPENROUTER_API_PARCEL is not set');

  const now = new Date().toISOString();
  const { data: events, error } = await supabase
    .from('communication_events')
    .select(
      'id, channel, direction, phone_from, raw_transcript, duration_seconds, entity_type, entity_id, created_at'
    )
    .lte('process_after', now)
    .is('processed_at', null)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`[comm-intel] query error: ${error.message}`);
  if (!events || events.length === 0) return { processed: 0, skipped: 0, errors: 0 };

  const groupMap = new Map<string, EntityGroup>();
  for (const ev of events as EventRow[]) {
    const key =
      ev.entity_id && ev.entity_type && ev.entity_type !== 'unknown'
        ? `${ev.entity_type}:${ev.entity_id}`
        : `unknown:${ev.phone_from}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        entityType: (ev.entity_type as EntityGroup['entityType']) ?? 'unknown',
        entityId: ev.entity_id,
        phoneFrom: ev.phone_from,
        events: [],
      });
    }
    groupMap.get(key)!.events.push(ev);
  }

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const [, group] of groupMap) {
    const hasContent = group.events.some((e) => e.raw_transcript);
    if (!hasContent) {
      const ids = group.events.map((e) => e.id);
      await supabase
        .from('communication_events')
        .update({ processed_at: now, tier: 'noise' })
        .in('id', ids);
      skipped++;
      continue;
    }

    const entityContext = await getEntityContext(supabase, group);
    const analysis = await callClaude(
      apiKey,
      buildSystemPrompt(),
      buildUserPrompt(group, entityContext)
    );

    if (!analysis) {
      errors++;
      continue;
    }

    const eventIds = group.events.map((e) => e.id);
    const channel: CommunicationInsightPayload['channel'] =
      group.events.every((e) => e.channel === 'call')
        ? 'call'
        : group.events.every((e) => e.channel === 'sms')
        ? 'sms'
        : 'mixed';

    await supabase
      .from('communication_events')
      .update({
        processed_at: now,
        tier: analysis.tier,
        claude_summary: analysis.summary,
      })
      .in('id', eventIds);

    if (
      analysis.tier !== 'noise' &&
      group.entityType !== 'unknown' &&
      group.entityId
    ) {
      const hourKey = now.slice(0, 13).replace('T', ':');
      const agentKey = `communication:${hourKey}`;
      const payload: CommunicationInsightPayload = {
        bucket: 'communication',
        tier: analysis.tier,
        actionItems: analysis.actionItems,
        sentiment: analysis.sentiment,
        eventIds,
        channel,
      };

      await supabase.from('ai_insights').upsert(
        {
          parent_type: group.entityType,
          parent_id: group.entityId,
          agent_key: agentKey,
          severity: analysis.tier === 'action_required' ? 'recommendation' : 'info',
          title:
            analysis.tier === 'action_required'
              ? `Action needed: ${analysis.actionItems[0] ?? 'follow up'}`
              : `Update from ${entityContext.split(':')[1]?.trim() ?? 'contact'}`,
          body: analysis.summary,
          action_payload: payload,
          dismissed_at: null,
        },
        { onConflict: 'parent_type,parent_id,agent_key' }
      );
    }

    processed++;
  }

  return { processed, skipped, errors };
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit 2>&1 | head -30
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/admin/communication-intelligence.ts
git commit -m "feat: add communication intelligence pipeline"
```

---

## Task 8: Communication Intelligence Cron Route

**Files:**
- Create: `apps/web/src/app/api/cron/communication-intelligence/route.ts`
- Modify: `apps/web/vercel.json`

- [ ] **Step 1: Write the cron route**

```typescript
// apps/web/src/app/api/cron/communication-intelligence/route.ts
import { NextResponse } from 'next/server';
import { runCommunicationIntelligenceSync } from '@/lib/admin/communication-intelligence';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const result = await runCommunicationIntelligenceSync();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[communication-intelligence] sync error:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 2: Add cron entry to vercel.json**

Read `apps/web/vercel.json`. Add the new entry to the `crons` array:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-deleted-accounts",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/guest-intelligence",
      "schedule": "0 13 * * *"
    },
    {
      "path": "/api/cron/communication-intelligence",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/api/cron/communication-intelligence/route.ts apps/web/vercel.json
git commit -m "feat: add communication-intelligence cron (every 15 min)"
```

---

## Task 9: Retroactive Linking Server Action

When an unknown caller is later assigned to an existing entity, this server action retroactively links all their past `communication_events`.

**Files:**
- Create: `apps/web/src/lib/admin/communication-actions.ts`

- [ ] **Step 1: Write communication-actions.ts**

```typescript
// apps/web/src/lib/admin/communication-actions.ts
'use server';
import { createClient } from '@/lib/supabase/server';
import { normalizePhone } from './normalize-phone';

export type AssignEntityType = 'owner' | 'contact' | 'vendor';

export async function assignUnknownCaller(
  rawPhone: string,
  entityType: AssignEntityType,
  entityId: string
): Promise<{ updated: number }> {
  const phone = normalizePhone(rawPhone);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('communication_events')
    .update({ entity_type: entityType, entity_id: entityId })
    .eq('phone_from', phone)
    .eq('entity_type', 'unknown')
    .select('id');
  if (error) throw new Error(error.message);
  return { updated: (data ?? []).length };
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/admin/communication-actions.ts
git commit -m "feat: add assignUnknownCaller server action for retroactive linking"
```

---

## Task 10: CommunicationsTab Shared Component

Renders the full communication history for any entity — owners, contacts, or vendors. Used on all three detail pages.

**Files:**
- Create: `apps/web/src/components/admin/CommunicationsTab.tsx`
- Create: `apps/web/src/components/admin/CommunicationsTab.module.css`

- [ ] **Step 1: Write CommunicationsTab.tsx**

```typescript
// apps/web/src/components/admin/CommunicationsTab.tsx
'use client';
import { useState } from 'react';
import { PhoneCall, ChatText, CaretDown, CaretUp, Lightning } from '@phosphor-icons/react';
import type { CommunicationEvent } from '@/lib/admin/communication-types';
import styles from './CommunicationsTab.module.css';

type Props = {
  events: CommunicationEvent[];
  latestSummary: string | null;
  actionItems: string[];
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function EventRow({ event }: { event: CommunicationEvent }) {
  const [expanded, setExpanded] = useState(false);
  const hasContent = Boolean(event.rawTranscript);
  const Icon = event.channel === 'call' ? PhoneCall : ChatText;

  return (
    <div className={styles.eventRow}>
      <div className={styles.eventHeader} onClick={() => hasContent && setExpanded((v) => !v)}>
        <div className={styles.eventMeta}>
          <Icon size={16} weight="duotone" className={styles.channelIcon} />
          <span className={styles.eventLabel}>
            {event.channel === 'call' ? 'Call' : 'SMS'}{' '}
            {event.direction === 'inbound' ? 'received' : 'sent'}
            {event.durationSeconds ? ` (${formatDuration(event.durationSeconds)})` : ''}
          </span>
          <span className={styles.eventDate}>{formatDate(event.createdAt)}</span>
        </div>
        {hasContent && (
          <button className={styles.expandBtn} aria-label="Toggle transcript">
            {expanded ? <CaretUp size={14} /> : <CaretDown size={14} />}
          </button>
        )}
      </div>
      {expanded && event.rawTranscript && (
        <div className={styles.transcript}>{event.rawTranscript}</div>
      )}
    </div>
  );
}

export function CommunicationsTab({ events, latestSummary, actionItems }: Props) {
  if (events.length === 0) {
    return (
      <div className={styles.empty}>
        <ChatText size={32} weight="duotone" />
        <p>No communications yet.</p>
        <p className={styles.emptyHint}>Calls and texts from this contact will appear here after they come in through Quo.</p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {latestSummary && (
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <Lightning size={16} weight="fill" />
            Latest summary
          </div>
          <p className={styles.summaryBody}>{latestSummary}</p>
          {actionItems.length > 0 && (
            <ul className={styles.actionItems}>
              {actionItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className={styles.eventList}>
        {events.map((ev) => (
          <EventRow key={ev.id} event={ev} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write CommunicationsTab.module.css**

```css
/* apps/web/src/components/admin/CommunicationsTab.module.css */
.root {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px 0;
}

.summaryCard {
  background: color-mix(in srgb, var(--color-accent-primary) 8%, var(--surface-elevated));
  border: 1px solid color-mix(in srgb, var(--color-accent-primary) 20%, transparent);
  border-radius: 12px;
  padding: 16px 20px;
}

.summaryHeader {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-accent-primary);
  margin-bottom: 8px;
}

.summaryBody {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-primary);
  margin: 0 0 12px;
}

.actionItems {
  margin: 0;
  padding: 0 0 0 16px;
  list-style: disc;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.7;
}

.eventList {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.eventRow {
  background: var(--surface-elevated);
  border-radius: 8px;
  overflow: hidden;
}

.eventHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
}

.eventHeader:hover {
  background: color-mix(in srgb, var(--text-primary) 4%, transparent);
}

.eventMeta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.channelIcon {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.eventLabel {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.eventDate {
  font-size: 12px;
  color: var(--text-tertiary);
}

.expandBtn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-tertiary);
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.expandBtn:hover {
  color: var(--text-secondary);
  background: color-mix(in srgb, var(--text-primary) 8%, transparent);
}

.transcript {
  padding: 0 16px 16px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-secondary);
  white-space: pre-wrap;
  border-top: 1px solid var(--border-subtle);
  margin-top: -1px;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px 24px;
  color: var(--text-tertiary);
  text-align: center;
}

.emptyHint {
  font-size: 13px;
  color: var(--text-tertiary);
  max-width: 320px;
  line-height: 1.5;
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/admin/CommunicationsTab.tsx apps/web/src/components/admin/CommunicationsTab.module.css
git commit -m "feat: add CommunicationsTab shared component"
```

---

## Task 11: Wire CommunicationsTab into Owner Detail Page

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/owners/[entityId]/page.tsx`
- Create: `apps/web/src/lib/admin/fetch-communications.ts`

- [ ] **Step 1: Write the data fetcher**

```typescript
// apps/web/src/lib/admin/fetch-communications.ts
import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { CommunicationEvent } from './communication-types';
import type { CommunicationInsightPayload } from './communication-types';
import { fetchInsightsByParentWithPayload } from './ai-insights';

type CommunicationsData = {
  events: CommunicationEvent[];
  latestSummary: string | null;
  actionItems: string[];
};

function mapRow(r: Record<string, unknown>): CommunicationEvent {
  return {
    id: r.id as string,
    quoId: r.quo_id as string,
    channel: r.channel as 'call' | 'sms',
    direction: r.direction as 'inbound' | 'outbound',
    phoneFrom: r.phone_from as string,
    phoneTo: r.phone_to as string,
    rawTranscript: (r.raw_transcript as string | null) ?? null,
    durationSeconds: (r.duration_seconds as number | null) ?? null,
    entityType: (r.entity_type as CommunicationEvent['entityType']) ?? null,
    entityId: (r.entity_id as string | null) ?? null,
    processAfter: (r.process_after as string | null) ?? null,
    processedAt: (r.processed_at as string | null) ?? null,
    tier: (r.tier as CommunicationEvent['tier']) ?? null,
    claudeSummary: (r.claude_summary as string | null) ?? null,
    createdAt: r.created_at as string,
  };
}

export async function fetchCommunications(
  entityType: 'owner' | 'contact' | 'vendor',
  entityId: string
): Promise<CommunicationsData> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('communication_events')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[fetch-communications] error:', error.message);
    return { events: [], latestSummary: null, actionItems: [] };
  }

  const events = (data ?? []).map(mapRow);

  const insightMap = await fetchInsightsByParentWithPayload(entityType, [entityId]);
  const insights = insightMap[entityId] ?? [];
  const commInsight = insights.find((i) => i.agentKey.startsWith('communication:'));
  const payload = commInsight?.actionPayload as CommunicationInsightPayload | undefined;

  return {
    events,
    latestSummary: commInsight?.body ?? null,
    actionItems: payload?.actionItems ?? [],
  };
}
```

- [ ] **Step 2: Add the communications tab to owner detail page**

Read `apps/web/src/app/(admin)/admin/owners/[entityId]/page.tsx`.

Add `'communications'` to the `TabKey` union and `KNOWN_TABS` array:

```typescript
type TabKey =
  | "overview"
  | "tasks"
  | "properties"
  | "financials"
  | "activity"
  | "files"
  | "communications"
  | "settings";

const KNOWN_TABS: readonly TabKey[] = [
  "overview",
  "tasks",
  "properties",
  "financials",
  "activity",
  "files",
  "communications",
  "settings",
];
```

Add the import at the top of the file:
```typescript
import { CommunicationsTab } from "@/components/admin/CommunicationsTab";
import { fetchCommunications } from "@/lib/admin/fetch-communications";
```

Add a data fetch alongside the existing ones (after the `data` fetch):
```typescript
const communicationsData =
  tab === "communications"
    ? await fetchCommunications("owner", entityId)
    : null;
```

Inside the JSX where tabs are rendered, add the communications case. Find the existing tab switch/conditional and add:
```typescript
{tab === "communications" && communicationsData && (
  <CommunicationsTab
    events={communicationsData.events}
    latestSummary={communicationsData.latestSummary}
    actionItems={communicationsData.actionItems}
  />
)}
```

Also find where the `OwnerDetailShell` (or tab nav component) receives its tab list and add `{ key: "communications", label: "Communications" }` to the tabs array.

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/admin/fetch-communications.ts apps/web/src/app/\(admin\)/admin/owners/\[entityId\]/page.tsx
git commit -m "feat: add Communications tab to owner detail page"
```

---

## Task 12: Wire CommunicationsTab into Contact Detail Page

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/contacts/[id]/page.tsx`

- [ ] **Step 1: Read the contact detail page**

Read `apps/web/src/app/(admin)/admin/contacts/[id]/page.tsx` to understand the tab structure.

- [ ] **Step 2: Add the communications tab**

Following the same pattern as Task 11:

1. Add `'communications'` to whatever tab key union/list exists.
2. Add the import:
```typescript
import { CommunicationsTab } from "@/components/admin/CommunicationsTab";
import { fetchCommunications } from "@/lib/admin/fetch-communications";
```
3. Fetch data when the tab is active:
```typescript
const communicationsData =
  tab === "communications"
    ? await fetchCommunications("contact", id)
    : null;
```
4. Render the tab:
```typescript
{tab === "communications" && communicationsData && (
  <CommunicationsTab
    events={communicationsData.events}
    latestSummary={communicationsData.latestSummary}
    actionItems={communicationsData.actionItems}
  />
)}
```
5. Add the tab label to the nav.

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add "apps/web/src/app/(admin)/admin/contacts/[id]/page.tsx"
git commit -m "feat: add Communications tab to contact detail page"
```

---

## Task 13: CommunicationsPanel Dashboard Widget

**Files:**
- Create: `apps/web/src/components/admin/CommunicationsPanel.tsx`
- Create: `apps/web/src/components/admin/CommunicationsPanel.module.css`
- Modify: `apps/web/src/app/(admin)/admin/page.tsx`

- [ ] **Step 1: Write the dashboard data fetcher**

Add a function `fetchCommunicationsDashboard` to `apps/web/src/lib/admin/fetch-communications.ts`:

```typescript
export type UnresolvedCaller = {
  phone: string;
  claudeSummary: string | null;
  createdAt: string;
};

export type CommunicationsDashboardData = {
  recentActionItems: Array<{
    id: string;
    title: string;
    body: string;
    entityType: string;
    entityId: string;
    createdAt: string;
  }>;
  unresolvedCallers: UnresolvedCaller[];
};

export async function fetchCommunicationsDashboard(): Promise<CommunicationsDashboardData> {
  const supabase = await createClient();

  const [insightsResult, unresolvedResult] = await Promise.all([
    supabase
      .from('ai_insights')
      .select('id, parent_type, parent_id, title, body, created_at')
      .like('agent_key', 'communication:%')
      .eq('severity', 'recommendation')
      .is('dismissed_at', null)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('communication_events')
      .select('phone_from, claude_summary, created_at')
      .eq('entity_type', 'unknown')
      .not('tier', 'eq', 'noise')
      .not('processed_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const recentActionItems = (insightsResult.data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    entityType: r.parent_type,
    entityId: r.parent_id,
    createdAt: r.created_at,
  }));

  const seenPhones = new Set<string>();
  const unresolvedCallers: UnresolvedCaller[] = [];
  for (const r of unresolvedResult.data ?? []) {
    if (!seenPhones.has(r.phone_from)) {
      seenPhones.add(r.phone_from);
      unresolvedCallers.push({
        phone: r.phone_from,
        claudeSummary: r.claude_summary,
        createdAt: r.created_at,
      });
    }
  }

  return { recentActionItems, unresolvedCallers };
}
```

- [ ] **Step 2: Write CommunicationsPanel.tsx**

```typescript
// apps/web/src/components/admin/CommunicationsPanel.tsx
import { Lightning, PhoneSlash, UserPlus } from '@phosphor-icons/react/dist/ssr';
import type { CommunicationsDashboardData } from '@/lib/admin/fetch-communications';
import styles from './CommunicationsPanel.module.css';

type Props = {
  data: CommunicationsDashboardData;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export function CommunicationsPanel({ data }: Props) {
  const hasContent =
    data.recentActionItems.length > 0 || data.unresolvedCallers.length > 0;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <Lightning size={16} weight="fill" className={styles.headerIcon} />
        <span className={styles.headerTitle}>Communications</span>
        {data.unresolvedCallers.length > 0 && (
          <span className={styles.badge}>{data.unresolvedCallers.length} unresolved</span>
        )}
      </div>

      {!hasContent && (
        <div className={styles.empty}>No recent communications.</div>
      )}

      {data.unresolvedCallers.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Unresolved callers</div>
          {data.unresolvedCallers.map((caller) => (
            <div key={caller.phone} className={styles.unresolvedRow}>
              <PhoneSlash size={14} weight="duotone" className={styles.unknownIcon} />
              <div className={styles.unresolvedContent}>
                <span className={styles.phone}>{caller.phone}</span>
                {caller.claudeSummary && (
                  <p className={styles.summary}>{caller.claudeSummary}</p>
                )}
                <span className={styles.date}>{formatDate(caller.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {data.recentActionItems.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Action required</div>
          {data.recentActionItems.map((item) => (
            <div key={item.id} className={styles.actionRow}>
              <UserPlus size={14} weight="duotone" className={styles.actionIcon} />
              <div className={styles.actionContent}>
                <span className={styles.actionTitle}>{item.title}</span>
                <p className={styles.actionBody}>{item.body}</p>
                <span className={styles.date}>{formatDate(item.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Write CommunicationsPanel.module.css**

```css
/* apps/web/src/components/admin/CommunicationsPanel.module.css */
.panel {
  background: var(--surface-elevated);
  border-radius: 16px;
  border: 1px solid var(--border-subtle);
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
}

.headerIcon {
  color: var(--color-accent-primary);
}

.headerTitle {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

.badge {
  font-size: 11px;
  font-weight: 700;
  background: color-mix(in srgb, var(--color-warning) 15%, transparent);
  color: var(--color-warning);
  border-radius: 100px;
  padding: 2px 8px;
}

.empty {
  padding: 24px 20px;
  font-size: 13px;
  color: var(--text-tertiary);
  text-align: center;
}

.section {
  padding: 12px 0;
  border-bottom: 1px solid var(--border-subtle);
}

.section:last-child {
  border-bottom: none;
}

.sectionLabel {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  padding: 0 20px 8px;
}

.unresolvedRow,
.actionRow {
  display: flex;
  gap: 10px;
  padding: 8px 20px;
  align-items: flex-start;
}

.unresolvedRow:hover,
.actionRow:hover {
  background: color-mix(in srgb, var(--text-primary) 3%, transparent);
}

.unknownIcon {
  color: var(--color-warning);
  flex-shrink: 0;
  margin-top: 2px;
}

.actionIcon {
  color: var(--color-accent-primary);
  flex-shrink: 0;
  margin-top: 2px;
}

.unresolvedContent,
.actionContent {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.phone {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: monospace;
}

.actionTitle {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.summary,
.actionBody {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.date {
  font-size: 11px;
  color: var(--text-tertiary);
}
```

- [ ] **Step 4: Add CommunicationsPanel to the dashboard**

Read `apps/web/src/app/(admin)/admin/page.tsx`. Add:

```typescript
import { CommunicationsPanel } from "@/components/admin/CommunicationsPanel";
import { fetchCommunicationsDashboard } from "@/lib/admin/fetch-communications";
```

Fetch data at the top of the page component (alongside other data fetches):

```typescript
const communicationsDashboard = await fetchCommunicationsDashboard();
```

Render the panel in the dashboard layout (alongside `AttentionQueue` or `GuestIntelligence`):

```typescript
<CommunicationsPanel data={communicationsDashboard} />
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 6: Commit**

```bash
git add \
  apps/web/src/components/admin/CommunicationsPanel.tsx \
  apps/web/src/components/admin/CommunicationsPanel.module.css \
  apps/web/src/lib/admin/fetch-communications.ts \
  "apps/web/src/app/(admin)/admin/page.tsx"
git commit -m "feat: add CommunicationsPanel to dashboard with action items and unresolved queue"
```

---

## Task 14: Vendor List Page and Create Form

**Files:**
- Create: `apps/web/src/lib/admin/vendors-list.ts`
- Create: `apps/web/src/lib/admin/vendor-actions.ts`
- Create: `apps/web/src/app/(admin)/admin/vendors/page.tsx`
- Create: `apps/web/src/app/(admin)/admin/vendors/VendorsList.tsx`
- Create: `apps/web/src/app/(admin)/admin/vendors/VendorsList.module.css`
- Create: `apps/web/src/app/(admin)/admin/vendors/CreateVendorModal.tsx`
- Create: `apps/web/src/app/(admin)/admin/vendors/CreateVendorModal.module.css`

- [ ] **Step 1: Write vendors-list.ts**

```typescript
// apps/web/src/lib/admin/vendors-list.ts
import 'server-only';
import { createClient } from '@/lib/supabase/server';

export type VendorRow = {
  id: string;
  fullName: string;
  companyName: string | null;
  phone: string | null;
  email: string | null;
  trade: string | null;
  notes: string | null;
  createdAt: string;
};

export async function fetchVendors(): Promise<VendorRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('vendors')
    .select('id, full_name, company_name, phone, email, trade, notes, created_at')
    .order('full_name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    fullName: r.full_name,
    companyName: r.company_name,
    phone: r.phone,
    email: r.email,
    trade: r.trade,
    notes: r.notes,
    createdAt: r.created_at,
  }));
}
```

- [ ] **Step 2: Write vendor-actions.ts**

```typescript
// apps/web/src/lib/admin/vendor-actions.ts
'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type CreateVendorInput = {
  fullName: string;
  companyName?: string;
  phone?: string;
  email?: string;
  trade?: string;
  notes?: string;
};

export async function createVendor(input: CreateVendorInput): Promise<{ id: string }> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .maybeSingle();
  if (!profile) throw new Error('No admin profile');

  const { data, error } = await supabase
    .from('vendors')
    .insert({
      profile_id: profile.id,
      full_name: input.fullName,
      company_name: input.companyName ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      trade: input.trade ?? null,
      notes: input.notes ?? null,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/vendors');
  return { id: data.id };
}
```

- [ ] **Step 3: Write the vendors page**

```typescript
// apps/web/src/app/(admin)/admin/vendors/page.tsx
import type { Metadata } from 'next';
import { fetchVendors } from '@/lib/admin/vendors-list';
import { VendorsList } from './VendorsList';

export const metadata: Metadata = { title: 'Vendors' };
export const dynamic = 'force-dynamic';

export default async function VendorsPage() {
  const vendors = await fetchVendors();
  return <VendorsList vendors={vendors} />;
}
```

- [ ] **Step 4: Write VendorsList.tsx**

```typescript
// apps/web/src/app/(admin)/admin/vendors/VendorsList.tsx
'use client';
import { useState } from 'react';
import { Plus, Wrench, Phone, Envelope } from '@phosphor-icons/react';
import type { VendorRow } from '@/lib/admin/vendors-list';
import { CreateVendorModal } from './CreateVendorModal';
import styles from './VendorsList.module.css';

export function VendorsList({ vendors }: { vendors: VendorRow[] }) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Vendors</h1>
          <p className={styles.subtitle}>{vendors.length} vendor{vendors.length !== 1 ? 's' : ''}</p>
        </div>
        <button className={styles.addBtn} onClick={() => setCreateOpen(true)}>
          <Plus size={16} weight="bold" />
          Add vendor
        </button>
      </div>

      {vendors.length === 0 ? (
        <div className={styles.empty}>
          <Wrench size={32} weight="duotone" />
          <p>No vendors yet. Add your first vendor to start tracking communication and work.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {vendors.map((v) => (
            <div key={v.id} className={styles.row}>
              <div className={styles.rowMain}>
                <span className={styles.name}>{v.fullName}</span>
                {v.trade && <span className={styles.trade}>{v.trade}</span>}
                {v.companyName && <span className={styles.company}>{v.companyName}</span>}
              </div>
              <div className={styles.rowMeta}>
                {v.phone && (
                  <span className={styles.metaItem}>
                    <Phone size={12} /> {v.phone}
                  </span>
                )}
                {v.email && (
                  <span className={styles.metaItem}>
                    <Envelope size={12} /> {v.email}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {createOpen && <CreateVendorModal onClose={() => setCreateOpen(false)} />}
    </div>
  );
}
```

- [ ] **Step 5: Write VendorsList.module.css**

```css
/* apps/web/src/app/(admin)/admin/vendors/VendorsList.module.css */
.root { padding: 32px; max-width: 900px; }

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
}

.title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px;
}

.subtitle {
  font-size: 13px;
  color: var(--text-tertiary);
  margin: 0;
}

.addBtn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--color-accent-primary);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.addBtn:hover { opacity: 0.9; }

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px;
  background: var(--surface-elevated);
  border-radius: 16px;
  color: var(--text-tertiary);
  text-align: center;
  font-size: 13px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: var(--surface-elevated);
  border-radius: 10px;
}

.row:hover { background: color-mix(in srgb, var(--text-primary) 4%, var(--surface-elevated)); }

.rowMain { display: flex; align-items: center; gap: 10px; }

.name { font-size: 14px; font-weight: 600; color: var(--text-primary); }

.trade {
  font-size: 12px;
  background: color-mix(in srgb, var(--color-accent-primary) 12%, transparent);
  color: var(--color-accent-primary);
  border-radius: 100px;
  padding: 2px 8px;
}

.company { font-size: 13px; color: var(--text-secondary); }

.rowMeta { display: flex; gap: 16px; }

.metaItem {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-tertiary);
}
```

- [ ] **Step 6: Write CreateVendorModal.tsx**

```typescript
// apps/web/src/app/(admin)/admin/vendors/CreateVendorModal.tsx
'use client';
import { useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { X } from '@phosphor-icons/react';
import { createVendor } from '@/lib/admin/vendor-actions';
import styles from './CreateVendorModal.module.css';

type Props = { onClose: () => void };

export function CreateVendorModal({ onClose }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      try {
        await createVendor({
          fullName: fd.get('fullName') as string,
          companyName: (fd.get('companyName') as string) || undefined,
          phone: (fd.get('phone') as string) || undefined,
          email: (fd.get('email') as string) || undefined,
          trade: (fd.get('trade') as string) || undefined,
          notes: (fd.get('notes') as string) || undefined,
        });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create vendor');
      }
    });
  }

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Add vendor</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.field}>
            <span className={styles.label}>Full name *</span>
            <input name="fullName" required className={styles.input} placeholder="John Smith" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Trade</span>
            <input name="trade" className={styles.input} placeholder="Plumber, Electrician, Cleaner…" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Company</span>
            <input name="companyName" className={styles.input} placeholder="Smith Plumbing LLC" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Phone</span>
            <input name="phone" className={styles.input} placeholder="+15095551234" type="tel" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Email</span>
            <input name="email" className={styles.input} placeholder="john@smithplumbing.com" type="email" />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Notes</span>
            <textarea name="notes" className={styles.textarea} rows={3} placeholder="Any notes about this vendor…" />
          </label>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={isPending}>
              {isPending ? 'Saving…' : 'Add vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
```

- [ ] **Step 7: Write CreateVendorModal.module.css**

```css
/* apps/web/src/app/(admin)/admin/vendors/CreateVendorModal.module.css */
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--surface-elevated);
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  border: 1px solid var(--border-subtle);
  overflow: hidden;
}

.modalHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border-subtle);
}

.modalTitle {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.closeBtn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-tertiary);
  padding: 4px;
  border-radius: 6px;
  display: flex;
}

.closeBtn:hover { color: var(--text-primary); background: color-mix(in srgb, var(--text-primary) 8%, transparent); }

.form { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }

.field { display: flex; flex-direction: column; gap: 4px; }

.label { font-size: 12px; font-weight: 600; color: var(--text-secondary); }

.input, .textarea {
  background: var(--surface-base);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  color: var(--text-primary);
  font-family: inherit;
}

.input:focus, .textarea:focus {
  outline: none;
  border-color: var(--color-accent-primary);
}

.textarea { resize: vertical; }

.error { font-size: 13px; color: var(--color-error); }

.actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; }

.cancelBtn {
  background: none;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
}

.cancelBtn:hover { background: color-mix(in srgb, var(--text-primary) 5%, transparent); }

.submitBtn {
  background: var(--color-accent-primary);
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: white;
  cursor: pointer;
}

.submitBtn:hover { opacity: 0.9; }
.submitBtn:disabled { opacity: 0.5; cursor: default; }
```

- [ ] **Step 8: Add Vendors to the admin sidebar nav**

Find the admin sidebar nav file. Search for it:

```bash
grep -r "Contacts\|contacts\|href.*admin" /Users/johanannunez/workspace/parcel/apps/web/src/components/admin/chrome/ --include="*.tsx" -l | head -5
```

In the nav file, find where "Contacts" or "Owners" is listed and add a Vendors entry below it:

```typescript
{ href: '/admin/vendors', label: 'Vendors', icon: <Wrench size={18} weight="duotone" /> }
```

Import `Wrench` from `@phosphor-icons/react`.

- [ ] **Step 9: Verify TypeScript and build**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 10: Commit**

```bash
git add \
  apps/web/src/lib/admin/vendors-list.ts \
  apps/web/src/lib/admin/vendor-actions.ts \
  "apps/web/src/app/(admin)/admin/vendors/" \
  apps/web/src/components/admin/chrome/
git commit -m "feat: add vendors list page, create form, and sidebar nav entry"
```

---

## Task 15: Environment Variables and Webhook Registration (Manual Steps)

These steps cannot be automated and must be done by Johan.

- [ ] **Step 1: Add env vars to Doppler**

Run these commands to add the two new secrets to Doppler under the `parcel` project:

```bash
doppler secrets set QUO_WEBHOOK_SECRET --project parcel --config prd
# paste the signing secret from Quo Settings > API > Webhooks

doppler secrets set QUO_API_KEY --project parcel --config prd
# paste the API key from Quo Settings > API
```

Also add to local `.env.local` for testing:
```
QUO_WEBHOOK_SECRET=<value>
QUO_API_KEY=<value>
```

- [ ] **Step 2: Deploy to Vercel**

```bash
cd /Users/johanannunez/workspace/parcel
git push origin HEAD
```

Wait for the Vercel deployment to complete before registering the webhook.

- [ ] **Step 3: Register the webhook in Quo**

1. Go to **my.quo.com/settings/webhooks** (you have this open in your browser already)
2. Click **Add webhook**
3. URL: `https://www.theparcelco.com/api/webhooks/quo`
4. Select these events:
   - `call.transcription.completed`
   - `message.received`
   - `message.delivered`
5. Copy the **signing secret** Quo generates and add it to Doppler as `QUO_WEBHOOK_SECRET` (Step 1 above)
6. Click **Save**

- [ ] **Step 4: Verify the webhook fires**

Make a test call to your Parcel number. Then run:

```sql
select id, channel, direction, entity_type, phone_from, tier, created_at
from communication_events
order by created_at desc
limit 5;
```

via `mcp__claude_ai_Supabase__execute_sql`. Expected: a row with `channel = 'call'` and `direction = 'inbound'`.

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| vendors table | Task 1 |
| vendor_properties junction | Task 1 |
| communication_events table | Task 2 |
| ai_insights constraint update | Task 3 |
| normalizePhone utility | Task 4 |
| CommunicationEvent / ResolvedEntity types | Task 4 |
| resolvePhone() resolver | Task 5 |
| Quo webhook handler + HMAC | Task 6 |
| Communication intelligence pipeline | Task 7 |
| 15-min cron route | Task 8 |
| vercel.json cron entry | Task 8 |
| Retroactive linking server action | Task 9 |
| CommunicationsTab shared component | Task 10 |
| Wire tab into owner detail | Task 11 |
| Wire tab into contact detail | Task 12 |
| Dashboard CommunicationsPanel | Task 13 |
| Unresolved callers queue | Task 13 |
| Vendor list page | Task 14 |
| Create vendor form | Task 14 |
| Vendors nav entry | Task 14 |
| Env vars + webhook registration | Task 15 |

All spec requirements are covered.
