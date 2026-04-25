# Entity-First Architecture: Phase 1 — Data Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every contact own an entity from the moment it is created, change the client detail route to use entity IDs, and redirect old contact-ID URLs.

**Architecture:** Add `entity_id` (FK to `entities`) directly to the `contacts` table. Modify `createContact` to insert an entity first, then link the contact. Backfill all existing contacts that have no entity. Change the `/admin/clients/[id]` page to resolve by entity ID, with a redirect when the ID belongs to a contact instead.

**Tech Stack:** Next.js 15 App Router, Supabase (Postgres), TypeScript, `@supabase/supabase-js`

**Design doc:** `docs/plans/2026-04-25-entity-first-client-architecture-design.md`

**Sequence:** This is Phase 1. Do NOT start Phase 2 (header), Phase 3 (sidebar), or Phase 4 (tabs) until this plan is complete and verified.

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `supabase/migrations/20260425_contacts_entity_id.sql` | DDL: add entity_id to contacts, entity_type to entities |
| Modify | `apps/web/src/lib/admin/contact-actions.ts` | Auto-create entity in createContact |
| Modify | `apps/web/src/lib/admin/client-detail.ts` | fetchClientByEntityId replacing fetchClientDetail |
| Modify | `apps/web/src/app/(admin)/admin/clients/[id]/page.tsx` | Resolve entity ID, redirect contact IDs |
| Modify | `apps/web/src/components/admin/chrome/create-forms/ContactForm.tsx` | Redirect to entity URL after creation |

---

## Task 1: Migration — add entity_id to contacts and entity_type to entities

**Files:**
- Create: `supabase/migrations/20260425_contacts_entity_id.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260425_contacts_entity_id.sql

-- 1. Add entity_type to entities (if not already present)
ALTER TABLE entities
  ADD COLUMN IF NOT EXISTS type text
  CHECK (type IN ('individual', 'llc', 's_corp', 'c_corp', 'trust', 'partnership'))
  DEFAULT 'individual';

-- 2. Add entity_id FK to contacts
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS entity_id uuid REFERENCES entities(id) ON DELETE SET NULL;

-- 3. Index for fast entity→contacts lookups
CREATE INDEX IF NOT EXISTS idx_contacts_entity_id ON contacts(entity_id);
```

- [ ] **Step 2: Apply via Supabase MCP**

Use the Supabase MCP `apply_migration` tool with:
- `project_id`: `pwoxwpryummqeqsxdgyc`
- `name`: `contacts_entity_id`
- `query`: paste the SQL above

Expected: success response with no errors.

- [ ] **Step 3: Verify columns exist**

Use Supabase MCP `execute_sql`:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'contacts' AND column_name = 'entity_id';
```
Expected: one row, `data_type = uuid`, `is_nullable = YES`.

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'entities' AND column_name = 'type';
```
Expected: one row, `data_type = text`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260425_contacts_entity_id.sql
git commit -m "db: add entity_id to contacts, entity_type to entities"
```

---

## Task 2: Backfill — create entities for all contacts that have none

**Files:**
- Create: `supabase/migrations/20260425_backfill_contact_entities.sql`

- [ ] **Step 1: Write the backfill migration**

```sql
-- supabase/migrations/20260425_backfill_contact_entities.sql

-- For each contact with no entity_id, create an entity and link it.
-- Entity name = company_name if set, otherwise full_name.
-- Entity type defaults to 'individual'.
DO $$
DECLARE
  rec RECORD;
  new_entity_id uuid;
BEGIN
  FOR rec IN
    SELECT id, full_name, company_name
    FROM contacts
    WHERE entity_id IS NULL
  LOOP
    INSERT INTO entities (name, type)
    VALUES (
      COALESCE(NULLIF(TRIM(rec.company_name), ''), rec.full_name),
      'individual'
    )
    RETURNING id INTO new_entity_id;

    UPDATE contacts
    SET entity_id = new_entity_id
    WHERE id = rec.id;
  END LOOP;
END $$;
```

- [ ] **Step 2: Apply via Supabase MCP**

Use `apply_migration` with:
- `project_id`: `pwoxwpryummqeqsxdgyc`
- `name`: `backfill_contact_entities`
- `query`: paste the SQL above

- [ ] **Step 3: Verify backfill**

Use `execute_sql`:
```sql
SELECT COUNT(*) AS contacts_without_entity
FROM contacts
WHERE entity_id IS NULL;
```
Expected: `0`.

```sql
SELECT COUNT(*) AS total_contacts,
       COUNT(entity_id) AS with_entity
FROM contacts;
```
Expected: both counts are equal.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260425_backfill_contact_entities.sql
git commit -m "db: backfill entity records for all existing contacts"
```

---

## Task 3: Auto-create entity in createContact

**Files:**
- Modify: `apps/web/src/lib/admin/contact-actions.ts`

- [ ] **Step 1: Read the current file**

Read `apps/web/src/lib/admin/contact-actions.ts` lines 1–49 to confirm current insert structure.

- [ ] **Step 2: Update createContact to insert entity first**

Replace the `createContact` function body (lines 21–48) with:

```typescript
export async function createContact(
  input: CreateContactInput,
): Promise<{ id: string; entityId: string }> {
  const { supabase, user } = await requireAdminUser();

  // Entity name: company name if provided, otherwise full name
  const entityName = input.companyName?.trim() || input.fullName.trim();

  const { data: entity, error: entityError } = await supabase
    .from('entities')
    .insert({ name: entityName, type: 'individual' })
    .select('id')
    .single();

  if (entityError) throw entityError;

  const metadata = input.notes?.trim()
    ? { notes: input.notes.trim() }
    : {};

  const { data, error } = await supabase
    .from('contacts')
    .insert({
      full_name: input.fullName.trim(),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      company_name: input.companyName?.trim() || null,
      source: input.source?.trim() || null,
      estimated_mrr: input.estimatedMrr ?? null,
      lifecycle_stage: (input.lifecycleStage ?? 'lead_new') as DbLifecycleStage,
      metadata,
      assigned_to: user.id,
      entity_id: entity.id,
    })
    .select('id')
    .single();

  if (error) throw error;
  revalidatePath('/admin/contacts');
  return { id: data.id as string, entityId: entity.id as string };
}
```

- [ ] **Step 3: Type-check**

```bash
cd /Users/johanannunez/workspace/parcel && pnpm exec tsc --noEmit 2>&1 | head -40
```
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/admin/contact-actions.ts
git commit -m "feat: auto-create entity when contact is created"
```

---

## Task 4: Update ContactForm to redirect to entity URL

**Files:**
- Modify: `apps/web/src/components/admin/chrome/create-forms/ContactForm.tsx`

- [ ] **Step 1: Update the redirect after createContact**

In `ContactForm.tsx` line 56, change:
```typescript
router.push(`/admin/contacts/${result.id}`);
```
to:
```typescript
router.push(`/admin/clients/${result.entityId}`);
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/johanannunez/workspace/parcel && pnpm exec tsc --noEmit 2>&1 | head -20
```
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/admin/chrome/create-forms/ContactForm.tsx
git commit -m "feat: redirect to entity page after contact creation"
```

---

## Task 5: Add fetchClientByEntityId and entity-member helpers

**Files:**
- Modify: `apps/web/src/lib/admin/client-detail.ts`

This task adds a new fetch function alongside the existing `fetchClientDetail`. The existing function stays intact for now (Phase 2 will migrate all call sites). We add two new exports: `fetchClientByEntityId` and `fetchEntityMembers`.

- [ ] **Step 1: Read the current ClientDetail type and fetchClientDetail**

Read `apps/web/src/lib/admin/client-detail.ts` lines 1–80 to understand the `ClientDetail` type shape.

- [ ] **Step 2: Add EntityMember type and fetchEntityMembers**

Append to `apps/web/src/lib/admin/client-detail.ts`:

```typescript
// ---------------------------------------------------------------------------
// Entity-first types
// ---------------------------------------------------------------------------

export type EntityMember = {
  id: string;           // contact id
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  portalAccess: boolean;
  preferredContactMethod: string | null;
};

export type EntityInfo = {
  id: string;
  name: string;
  type: string | null;
};

// ---------------------------------------------------------------------------
// Fetch all contacts belonging to an entity
// ---------------------------------------------------------------------------

export async function fetchEntityMembers(entityId: string): Promise<EntityMember[]> {
  const supabase = await createServiceClient();

  const { data, error } = await (supabase as any)
    .from('contacts')
    .select('id, full_name, first_name, last_name, email, phone, avatar_url, profile_id')
    .eq('entity_id', entityId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return (data as any[]).map((c) => ({
    id: c.id as string,
    fullName: c.full_name as string,
    firstName: (c.first_name as string | null) ?? null,
    lastName: (c.last_name as string | null) ?? null,
    email: (c.email as string | null) ?? null,
    phone: (c.phone as string | null) ?? null,
    avatarUrl: (c.avatar_url as string | null) ?? null,
    portalAccess: !!c.profile_id,
  }));
}

// ---------------------------------------------------------------------------
// Fetch entity info by entity ID
// ---------------------------------------------------------------------------

export async function fetchEntityInfo(entityId: string): Promise<EntityInfo | null> {
  const supabase = await createServiceClient();

  const { data, error } = await (supabase as any)
    .from('entities')
    .select('id, name, type')
    .eq('id', entityId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id as string,
    name: data.name as string,
    type: (data.type as string | null) ?? null,
  };
}

// ---------------------------------------------------------------------------
// Fetch the primary contact for an entity (first created, or first alphabetically)
// ---------------------------------------------------------------------------

export async function fetchPrimaryContactIdForEntity(entityId: string): Promise<string | null> {
  const supabase = await createServiceClient();

  const { data, error } = await (supabase as any)
    .from('contacts')
    .select('id')
    .eq('entity_id', entityId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data.id as string;
}
```

- [ ] **Step 3: Verify createServiceClient is already imported**

Check line 1–10 of `apps/web/src/lib/admin/client-detail.ts` for `createServiceClient` import. If it uses `createClient` instead, add:
```typescript
import { createServiceClient } from "@/lib/supabase/service";
```

- [ ] **Step 4: Type-check**

```bash
cd /Users/johanannunez/workspace/parcel && pnpm exec tsc --noEmit 2>&1 | head -40
```
Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/admin/client-detail.ts
git commit -m "feat: add fetchEntityMembers, fetchEntityInfo, fetchPrimaryContactIdForEntity"
```

---

## Task 6: Change the client detail page to resolve by entity ID with contact-ID redirect

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/page.tsx`

The `[id]` param now accepts EITHER an entity ID (primary, new behavior) OR a contact ID (legacy, redirects). The page checks which it is and redirects if needed.

- [ ] **Step 1: Read the current page.tsx top section**

Read `apps/web/src/app/(admin)/admin/clients/[id]/page.tsx` lines 1–80 to understand current imports and the fetchClientDetail call.

- [ ] **Step 2: Add entity-resolution logic at the top of the page function**

Add these imports at the top of the file (after existing imports):
```typescript
import { fetchEntityInfo, fetchEntityMembers, fetchPrimaryContactIdForEntity } from "@/lib/admin/client-detail";
import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
```

Replace the beginning of `ClientDetailPage` (the `const { id } = await params;` block and the `fetchClientDetail` call) with:

```typescript
export default async function ClientDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab: tabParam, section: sectionParam, person: personParam } = await searchParams;

  // Determine whether [id] is an entity ID or a legacy contact ID.
  // Try entity first (new behavior), then fall back to contact lookup.
  const entityInfo = await fetchEntityInfo(id);

  if (!entityInfo) {
    // [id] might be a contact ID — look up its entity and redirect
    const svc = createServiceClient();
    const { data: contact } = await (svc as any)
      .from('contacts')
      .select('entity_id')
      .eq('id', id)
      .maybeSingle();

    if (contact?.entity_id) {
      redirect(`/admin/clients/${contact.entity_id}${tabParam ? `?tab=${tabParam}` : ''}`);
    }
    notFound();
  }

  // Resolve the active contact: prefer ?person= param, else first member
  const members = await fetchEntityMembers(id);
  const activeContactId = (personParam && members.find(m => m.id === personParam))
    ? personParam
    : members[0]?.id ?? null;

  if (!activeContactId) notFound();

  const [client, adminProfiles] = await Promise.all([
    fetchClientDetail(activeContactId),
    fetchAdminProfiles(),
  ]);
  if (!client) notFound();
  
  // ... rest of the function continues unchanged
```

- [ ] **Step 3: Add `person` to the searchParams type**

Update the `Props` type:
```typescript
type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; section?: string; person?: string }>;
};
```

- [ ] **Step 4: Type-check**

```bash
cd /Users/johanannunez/workspace/parcel && pnpm exec tsc --noEmit 2>&1 | head -40
```
Expected: zero errors or only pre-existing errors unrelated to these changes.

- [ ] **Step 5: Test redirect manually**

Start dev server: `doppler run -- next dev -p 4000` from `apps/web/`.

Navigate to `http://localhost:4000/admin/clients/[any-existing-contact-id]` — should redirect to the entity page.

Navigate to `http://localhost:4000/admin/clients/[entity-id]` — should load normally.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/(admin)/admin/clients/[id]/page.tsx
git commit -m "feat: resolve client detail page by entity ID, redirect legacy contact URLs"
```

---

## Task 7: Update clients list links to use entity IDs

**Files:**
- Identify and modify the clients list page that renders contact rows.

- [ ] **Step 1: Find the clients list component**

```bash
grep -rl "admin/clients\|/clients/" /Users/johanannunez/workspace/parcel/apps/web/src/app/\(admin\)/admin/clients --include="*.tsx" --include="*.ts" | grep -v "\[id\]"
```

- [ ] **Step 2: Fetch entity_id in the list data query**

In the list data fetch, ensure `entity_id` is selected alongside contact fields. In the component, link each row to `/admin/clients/${contact.entity_id ?? contact.id}` — fall back to contact ID only if entity_id is somehow null (should not happen after backfill).

- [ ] **Step 3: Type-check and verify**

```bash
cd /Users/johanannunez/workspace/parcel && pnpm exec tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: link clients list rows to entity pages"
```

---

## Task 8: Add entity_id to sidebar update actions

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/client-actions.ts`

The sidebar will need to update entity name and entity type. Add two server actions.

- [ ] **Step 1: Read current client-actions.ts**

Read `apps/web/src/app/(admin)/admin/clients/[id]/client-actions.ts` to understand existing action patterns.

- [ ] **Step 2: Add updateEntityFields action**

Append to `client-actions.ts`:

```typescript
export async function updateEntityFields(
  entityId: string,
  fields: { name?: string; type?: string },
): Promise<void> {
  const supabase = await createClient();
  const updates: Record<string, unknown> = {};
  if (fields.name !== undefined) updates.name = fields.name.trim();
  if (fields.type !== undefined) updates.type = fields.type;
  if (Object.keys(updates).length === 0) return;
  const { error } = await supabase.from('entities').update(updates).eq('id', entityId);
  if (error) throw error;
}
```

- [ ] **Step 3: Type-check**

```bash
cd /Users/johanannunez/workspace/parcel && pnpm exec tsc --noEmit 2>&1 | head -20
```
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/(admin)/admin/clients/[id]/client-actions.ts
git commit -m "feat: add updateEntityFields server action"
```

---

## Phase 1 Verification

Run all of these before declaring Phase 1 done:

- [ ] `pnpm exec tsc --noEmit` — zero errors
- [ ] Every contact in `contacts` table has a non-null `entity_id`:
  ```sql
  SELECT COUNT(*) FROM contacts WHERE entity_id IS NULL;
  -- Expected: 0
  ```
- [ ] Creating a new contact via the admin UI creates an entity and redirects to `/admin/clients/[entity-id]`
- [ ] Visiting `/admin/clients/[old-contact-id]` redirects to `/admin/clients/[entity-id]`
- [ ] Visiting `/admin/clients/[entity-id]` loads the page normally
- [ ] Clients list rows link to entity URLs

---

## What Comes Next

- **Phase 2** (`2026-04-25-entity-first-p2-header.md`): Rebuild the `ClientDetailShell` header with entity name, entity type badge, person chips for multi-owner, and the lightweight inline status line replacing the bordered strip.
- **Phase 3** (`2026-04-25-entity-first-p3-sidebar.md`): Rebuild `ClientDetailSidebar` with no-scroll layout, always-visible copy buttons, inline click-to-edit, and the social links modal.
- **Phase 4** (`2026-04-25-entity-first-p4-tabs.md`): Update all tab data fetching to be entity-scoped, build the Communication unified timeline, and add the Settings People sub-section.
