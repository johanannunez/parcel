# Quo Communication Intelligence — Design Spec

**Date:** 2026-04-24
**Status:** Approved

---

## Overview

Integrate Quo (OpenPhone) with Parcel so that every inbound call and SMS from an owner, contact, vendor, or unknown caller is captured, attributed to the right person, and analyzed by Claude. Intelligence surfaces on the entity's detail page and on the admin dashboard. The system never drops a message, even from numbers not yet in the system.

---

## Goals

1. Capture every call transcript and SMS from Quo automatically.
2. Identify who is communicating using a unified contact resolver across owners, contacts, and vendors.
3. Analyze communication content with Claude and tier it by urgency: action required, FYI, or noise.
4. Surface action-required items on the dashboard and full history on each entity's detail page.
5. Handle unknown callers gracefully: capture the transcript, queue for manual assignment, retroactively link once assigned.

---

## Out of Scope

- Vendor detail pages (full vendor UI is a follow-on phase).
- Invoice tracking and project management for vendors.
- Outbound call intelligence (inbound only for this phase).
- SMS sending from within Parcel (read-only integration for now).

---

## Layer 1: Data Model

### New table: `vendors`

```sql
create table public.vendors (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references profiles(id),
  full_name      text not null,
  company_name   text,
  phone          text,
  email          text,
  trade          text,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index on vendors (phone);
create index on vendors (profile_id);
```

### New table: `vendor_properties` (junction)

```sql
create table public.vendor_properties (
  vendor_id    uuid not null references vendors(id) on delete cascade,
  property_id  uuid not null references properties(id) on delete cascade,
  primary key (vendor_id, property_id)
);
```

### New table: `communication_events`

Stores every inbound call transcript and SMS body from Quo. The intelligence pipeline reads from this table on a 15-minute cron.

```sql
create table public.communication_events (
  id                 uuid primary key default gen_random_uuid(),
  profile_id         uuid not null references profiles(id),
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

-- process_after is only set on inbound events. Outbound events are captured
-- for thread context but never trigger the intelligence pipeline themselves.

create index on communication_events (process_after) where processed_at is null;
create index on communication_events (entity_type, entity_id);
create index on communication_events (phone_from);
```

### Modified: `ai_insights`

Add `vendor` to the `parent_type` check constraint:

```sql
alter table ai_insights
  drop constraint ai_insights_parent_type_check,
  add constraint ai_insights_parent_type_check
    check (parent_type in ('contact', 'property', 'project', 'vendor'));
```

### No changes to `profiles` or `contacts`

Both tables already have a `phone` text column. No migration needed.

---

## Layer 2: Contact Resolver

**File:** `apps/web/src/lib/admin/resolve-phone.ts`

A single server-side function that takes an E.164 phone number and returns the matching entity across all three entity types, or marks it as unknown.

```typescript
export type ResolvedEntity =
  | { type: 'owner';   entityId: string; displayName: string; propertyIds: string[] }
  | { type: 'contact'; entityId: string; displayName: string; propertyIds: string[] }
  | { type: 'vendor';  entityId: string; displayName: string; propertyIds: string[] }
  | { type: 'unknown'; phone: string };
```

**Resolution order:** All three queries run in parallel. First match wins, in priority order: owner > contact > vendor. Phone numbers are normalized to E.164 before lookup.

**Retroactive linking:** When an unknown caller is later assigned to an entity (owner, contact, or vendor), a server action updates all `communication_events` rows with that phone number, setting `entity_type` and `entity_id`. Past transcripts are now linked.

---

## Layer 3: Quo Webhook Handler

**File:** `apps/web/src/app/api/webhooks/quo/route.ts`

**Quo events handled:**

| Event | Action |
|---|---|
| `call.transcription.completed` | Save full transcript to `communication_events` |
| `message.received` | Save inbound SMS body to `communication_events` |
| `message.delivered` | Save outbound SMS body (context for thread reconstruction) |

**Handler flow per event:**

1. Validate HMAC-SHA256 signature using `QUO_WEBHOOK_SECRET` env var. Reject with 401 if invalid.
2. Deduplicate using `quo_id` — if the row already exists, return 200 and skip.
3. Call `resolvePhone(phone_from)` to identify the caller.
4. Insert into `communication_events` with:
   - `entity_type` and `entity_id` from resolver result.
   - `process_after = now() + 25 minutes` for inbound events only. Outbound events (`message.delivered`) are inserted with `process_after = null` and are never processed as triggers — they exist only to provide thread context when an inbound event's batch is processed.
5. Return `{ ok: true }` immediately. Never block the webhook on Claude.

**Environment variables needed:**

- `QUO_WEBHOOK_SECRET` — signing secret from Quo settings
- `QUO_API_KEY` — for fetching transcripts if not included in webhook payload

---

## Layer 4: Intelligence Pipeline

**File:** `apps/web/src/app/api/cron/communication-intelligence/route.ts`

**Schedule:** Every 15 minutes via Vercel cron (`apps/web/vercel.json`).

**Processing flow:**

1. Query `communication_events` where `process_after <= now()` and `processed_at IS NULL`.
2. Group by `(entity_type, entity_id)` for known entities, or by `phone_from` for unknowns.
3. For each group, build a Claude prompt containing:
   - Entity context: name, associated properties, any recent ai_insights for that entity.
   - All transcripts and SMS bodies in the window, in chronological order.
4. Claude returns structured JSON:
   ```json
   {
     "tier": "action_required | fyi | noise",
     "summary": "One paragraph summary of the communication.",
     "actionItems": ["Follow up on invoice", "Schedule inspection at 524 Sycamore"],
     "sentiment": "positive | neutral | concerned"
   }
   ```
5. Write `tier` and `claude_summary` back to every `communication_events` row in the batch.
6. For known entities, if `tier` is `action_required` or `fyi`: upsert into `ai_insights` with:
   - `parent_type`: entity type
   - `parent_id`: entity ID
   - `agent_key`: `communication:YYYY-MM-DD:HH` (one insight per entity per hour, upsert overwrites)
   - `severity`: `recommendation` for action_required, `info` for fyi
7. If `tier` is `noise`: no insight written, but `tier` is still stored on the event row.
8. For unknown entities: skip `ai_insights` entirely. The dashboard queries `communication_events` directly where `entity_type = 'unknown'` and `tier != 'noise'` to build the unresolved queue.
9. Mark all processed events with `processed_at = now()`.

---

## Layer 5: UI Surfaces

### 5a: Dashboard panel

A new "Recent Communications" card on the admin dashboard (`apps/web/src/app/(admin)/admin/page.tsx`).

**Contents:**
- Action-required items from `ai_insights` where `agent_key` starts with `communication:`, ordered by recency.
- An "Unresolved" count badge: calls/SMS from unknown numbers not yet assigned.
- Quick-assign flow for unknown callers: shows caller phone, transcript summary, and three buttons — "Owner," "Contact," "Vendor" — to assign to an existing record or create a new one.

### 5b: Entity Communications tab

A new "Communications" tab on owner, contact, and vendor detail pages.

**Contents (per entity):**
- Most recent Claude summary at the top (action items highlighted).
- Chronological list of all `communication_events` for that entity.
- Each event is expandable to show the full transcript or SMS thread.
- Call events show duration and a playback link if Quo provides a recording URL.

**Shared component:** `CommunicationsTab` used across all three entity detail pages to keep behavior consistent.

---

## Vendor Management (minimal for this phase)

Vendors need to exist in the system so the resolver can find them. For this phase:

- Basic create/edit form: name, phone, email, company, trade, associated properties.
- Vendor records surfaced in a new "Vendors" section under admin nav (list view only, no detail page yet).
- No lifecycle stages — vendors are not leads.

Full vendor detail pages (communications history, invoices, project log) are a follow-on phase.

---

## Processing Timing

- **Webhook fires** when Quo call ends or SMS arrives.
- **25-minute window** opens. Any follow-up texts from the same number within this window are captured before Claude runs.
- **Cron runs** every 15 minutes and processes anything past its `process_after` timestamp.
- **Maximum latency** from call end to insight on dashboard: ~40 minutes (25-min window + up to 15-min cron gap).

---

## Error Handling

- Webhook failures return 200 whenever possible to prevent Quo retry storms. Log errors internally.
- If Claude API call fails, leave `processed_at` null. Cron will retry on next run.
- If resolver returns unknown, capture the event anyway. Never drop a transcript.
- HMAC validation failure returns 401 and logs the attempt.

---

## New Environment Variables

| Variable | Purpose |
|---|---|
| `QUO_WEBHOOK_SECRET` | HMAC signing secret from Quo API settings |
| `QUO_API_KEY` | Quo REST API key for fetching recordings/transcripts |

Both go in Doppler under the `parcel` project.

---

## Build Sequence

1. DB migrations: `vendors`, `vendor_properties`, `communication_events`, alter `ai_insights` constraint.
2. `resolvePhone()` utility + tests.
3. Quo webhook handler.
4. Intelligence cron.
5. Dashboard "Recent Communications" panel.
6. `CommunicationsTab` shared component.
7. Wire tab into owner detail page.
8. Wire tab into contact detail page.
9. Vendor list view + create form.
10. Quo webhook registration in Quo settings (manual step).
11. Add `QUO_WEBHOOK_SECRET` and `QUO_API_KEY` to Doppler + Vercel.
