# Entity-First Phase 4: Communication Filter + Settings People

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an All/Person filter to the Communication tab (unified timeline for all entity members) and add a People sub-section to Settings where admins can add or remove contacts from an entity.

**Architecture:** Two independent feature areas. The Communication tab receives all entity member messages via a new `fetchEntityMessages` function and filters client-side. The Settings People section adds "people" to SETTINGS_SECTIONS, a new PeopleSection component, and two new server actions (addPersonToEntity, removePersonFromEntity) in client-actions.ts.

**Tech Stack:** Next.js App Router (Server/Client components), TypeScript, CSS Modules, Phosphor Icons, Supabase.

---

## File Map

| File | Change |
|------|--------|
| `apps/web/src/lib/admin/client-messages.ts` | Add `fetchEntityMessages(contactIds: string[])` |
| `apps/web/src/app/(admin)/admin/clients/[id]/MessagingTab.tsx` | Add filter bar + multi-contact rendering |
| `apps/web/src/app/(admin)/admin/clients/[id]/MessagingTab.module.css` | Add filter bar, contact label, compose target CSS |
| `apps/web/src/app/(admin)/admin/clients/[id]/page.tsx` | Fetch entity messages on messaging tab; pass members+activeContactId to MessagingTab and adminMembers+adminEntityId to SettingsTab |
| `apps/web/src/app/(admin)/admin/owners/[entityId]/settings-sections.ts` | Add `"people"` to SETTINGS_SECTIONS |
| `apps/web/src/app/(admin)/admin/owners/[entityId]/SettingsTab.tsx` | Add People to SECTION_LABEL, PLACEHOLDER_TEASERS, nav, props, conditional render |
| `apps/web/src/app/(admin)/admin/clients/[id]/client-actions.ts` | Add `addPersonToEntity` + `removePersonFromEntity` server actions |
| `apps/web/src/app/(admin)/admin/owners/[entityId]/settings/SettingsShared.module.css` | Add missing utility classes: `.addLink`, `.dangerLink`, `.primaryBtn`, `.secondaryBtn`, `.errorMsg` |
| Create: `apps/web/src/app/(admin)/admin/owners/[entityId]/settings/PeopleSection.tsx` | List members, add person form, remove person with ConfirmModal |

---

## Context (already in codebase from Phases 1-3)

- `EntityMember = { id, fullName, firstName, lastName, email, phone, avatarUrl, portalAccess }` exported from `client-detail.ts`
- `EntityInfo = { id, name, type }` exported from `client-detail.ts`
- `fetchEntityMembers(entityId)` in `client-detail.ts` — returns `EntityMember[]`
- `ClientMessage = { id, contactId, senderType, senderName, body, channel, pinned, readAt, createdAt }` exported from `client-messages.ts`
- `members` and `entityInfo` are already in scope in `page.tsx` (fetched at top of `ClientDetailPage`)
- `updateEntityFields(entityId, { name?, type? })` exists in `client-actions.ts`
- `ConfirmModal` at `src/components/admin/ConfirmModal.tsx` — props: `open`, `title`, `description`, `confirmLabel?`, `variant?`, `onConfirm`, `onCancel`
- SettingsTab nav items are rendered with `renderNavItem(key, activeSection, switchSection)` — must add "people" to nav explicitly
- `PLACEHOLDER_TEASERS` in `SettingsTab.tsx` is `Record<Exclude<SettingsSection, "personal">, string>` — must include "people" when added to SETTINGS_SECTIONS

---

## Task 1: Multi-contact message fetching

**Files:**
- Modify: `apps/web/src/lib/admin/client-messages.ts`

- [ ] **Step 1: Add fetchEntityMessages**

Open `apps/web/src/lib/admin/client-messages.ts`. After the existing `fetchClientMessages` function, add:

```typescript
export async function fetchEntityMessages(contactIds: string[]): Promise<ClientMessage[]> {
  if (contactIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from("client_messages")
    .select(`
      id, contact_id, sender_type, sender_id, body, channel, pinned, read_at, created_at,
      sender:profiles(full_name)
    `)
    .in("contact_id", contactIds)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[client-messages] fetchEntityMessages error:", error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const sender = row.sender as { full_name: string } | null;
    return {
      id: row.id as string,
      contactId: row.contact_id as string,
      senderType: row.sender_type as "admin" | "client",
      senderId: row.sender_id as string,
      senderName: sender?.full_name ?? "Unknown",
      body: row.body as string,
      channel: row.channel as "in_app" | "email",
      pinned: row.pinned as boolean,
      readAt: (row.read_at as string | null) ?? null,
      createdAt: row.created_at as string,
    };
  });
}
```

Note: `fetchEntityMessages` orders only by `created_at` ascending (no pinned sort) because the All view is a flat chronological timeline across all contacts.

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web && pnpm exec tsc --noEmit 2>&1 | head -20
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/johanannunez/workspace/parcel && git add apps/web/src/lib/admin/client-messages.ts && git commit -m "feat(entity-first p4): add fetchEntityMessages for multi-contact timeline"
```

---

## Task 2: Communication tab All/Person filter

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/MessagingTab.tsx`
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/MessagingTab.module.css`
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/page.tsx`

### Step-by-step

- [ ] **Step 1: Update MessagingTab Props type**

Open `apps/web/src/app/(admin)/admin/clients/[id]/MessagingTab.tsx`.

Add import for `EntityMember` after the existing import line:
```typescript
import type { ClientMessage } from "@/lib/admin/client-messages";
import type { EntityMember } from "@/lib/admin/client-detail";
```

Replace the `Props` type:
```typescript
type Props = {
  contactId: string;
  messages: ClientMessage[];
  members: EntityMember[];
  activeContactId: string;
};
```

Update the function signature:
```typescript
export function MessagingTab({ contactId, messages: initialMessages, members, activeContactId }: Props) {
```

- [ ] **Step 2: Add filter state**

Inside the `MessagingTab` function, after the existing `localMessages` state, add:

```typescript
const [filterContactId, setFilterContactId] = useState<string | "all">(activeContactId);

useEffect(() => {
  setFilterContactId(activeContactId);
}, [activeContactId]);
```

- [ ] **Step 3: Replace pinned/thread derivations and add compose target**

Remove the existing `const pinned = ...` and `const thread = ...` lines. Replace with:

```typescript
const filteredMessages =
  filterContactId === "all"
    ? localMessages
    : localMessages.filter((m) => m.contactId === filterContactId);

const pinned = filteredMessages.filter((m) => m.pinned);
const thread = filteredMessages.filter((m) => !m.pinned);

const composeContactId = filterContactId === "all" ? activeContactId : filterContactId;
const composeContact = members.find((m) => m.id === composeContactId);
```

- [ ] **Step 4: Update MessageBubble to accept contactLabel**

Find the `MessageBubble` component. Update its props type to add an optional `contactLabel`:

```typescript
function MessageBubble({
  message,
  contactLabel,
  onPin,
}: {
  message: ClientMessage;
  contactLabel?: string;
  onPin: (id: string, messageContactId: string, currentlyPinned: boolean) => void;
}) {
```

In the `handlePin` function inside `MessageBubble`, update the `onPin` call:
```typescript
function handlePin() {
  startPinTransition(async () => {
    onPin(message.id, message.contactId, message.pinned);
  });
}
```

In the bubble JSX, add the contact label before the sender name (inside `bubbleHeader`):
```tsx
<div className={styles.bubbleHeader}>
  {contactLabel && (
    <span className={styles.contactLabel}>{contactLabel}</span>
  )}
  <span className={styles.senderName}>
    {/* existing sender name content unchanged */}
  </span>
  <span className={styles.timestamp}>{formatTime(message.createdAt)}</span>
  {/* existing pin button unchanged */}
</div>
```

- [ ] **Step 5: Update handlePin signature in MessagingTab**

The `handlePin` function in `MessagingTab` currently has signature `(messageId: string, currentlyPinned: boolean)`. Update it to:

```typescript
function handlePin(messageId: string, messageContactId: string, currentlyPinned: boolean) {
  setLocalMessages((prev) =>
    prev.map((m) => (m.id === messageId ? { ...m, pinned: !currentlyPinned } : m)),
  );
  togglePinMessage(messageId, messageContactId, currentlyPinned).catch(() => {
    setLocalMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, pinned: currentlyPinned } : m)),
    );
  });
}
```

- [ ] **Step 6: Update handleSend to use composeContactId**

Find `handleSend`. Change the `sendClientMessage` call from `sendClientMessage(contactId, body)` to:
```typescript
const result = await sendClientMessage(composeContactId, body);
```

(`composeContactId` is already derived in Step 3.)

- [ ] **Step 7: Add filter bar to JSX**

In the return statement, add the filter bar as the FIRST element inside `<div className={styles.root}>`:

```tsx
{members.length > 1 && (
  <div className={styles.filterBar}>
    <button
      type="button"
      className={`${styles.filterBtn} ${filterContactId === "all" ? styles.filterBtnActive : ""}`}
      onClick={() => setFilterContactId("all")}
    >
      All
    </button>
    {members.map((m) => (
      <button
        key={m.id}
        type="button"
        className={`${styles.filterBtn} ${filterContactId === m.id ? styles.filterBtnActive : ""}`}
        onClick={() => setFilterContactId(m.id)}
      >
        {m.firstName ?? m.fullName.split(" ")[0]}
      </button>
    ))}
  </div>
)}
```

- [ ] **Step 8: Add contactLabel to bubble rendering + compose target label**

In the `pinned.map(...)` and `thread.map(...)` render calls, add `contactLabel`:

```tsx
{thread.map((m) => {
  const contact =
    filterContactId === "all"
      ? members.find((mem) => mem.id === m.contactId)
      : undefined;
  return (
    <MessageBubble
      key={m.id}
      message={m}
      contactLabel={contact ? (contact.firstName ?? contact.fullName.split(" ")[0]) : undefined}
      onPin={handlePin}
    />
  );
})}
```

Apply the same pattern to `pinned.map(...)`.

In the compose section, add a label ABOVE the `{error && ...}` line:
```tsx
<div className={styles.compose}>
  {filterContactId === "all" && composeContact && (
    <div className={styles.composeTarget}>
      Sending to {composeContact.firstName ?? composeContact.fullName.split(" ")[0]}
    </div>
  )}
  {error && <p className={styles.composeError}>{error}</p>}
  {/* rest unchanged */}
</div>
```

- [ ] **Step 9: Add CSS to MessagingTab.module.css**

In `apps/web/src/app/(admin)/admin/clients/[id]/MessagingTab.module.css`, append after existing rules:

```css
/* ── Filter bar ─────────────────────────────────────────────────────────── */

.filterBar {
  display: flex;
  gap: 6px;
  padding: 12px 20px 4px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.filterBtn {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid var(--color-warm-gray-200);
  background: transparent;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 100ms ease, color 100ms ease, border-color 100ms ease;
}

.filterBtn:hover {
  background: var(--color-warm-gray-50);
  color: var(--color-text-primary);
}

.filterBtn:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
}

.filterBtnActive {
  background: var(--color-brand);
  border-color: var(--color-brand);
  color: #fff;
}

.filterBtnActive:hover {
  background: var(--color-brand);
  color: #fff;
}

/* ── Contact label (in All view) ────────────────────────────────────────── */

.contactLabel {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-brand);
  background: color-mix(in srgb, var(--color-brand) 10%, transparent);
  border-radius: 3px;
  padding: 1px 4px;
  margin-right: 4px;
  flex-shrink: 0;
}

/* ── Compose target label ────────────────────────────────────────────────── */

.composeTarget {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  padding: 0 0 6px;
}
```

- [ ] **Step 10: Update page.tsx to fetch entity messages + pass new props**

Open `apps/web/src/app/(admin)/admin/clients/[id]/page.tsx`.

Add `fetchEntityMessages` to the import:
```typescript
import { fetchClientMessages, fetchEntityMessages } from "@/lib/admin/client-messages";
```

Find these lines (~136-138):
```typescript
const clientMessages = tab === "messaging" || isOverview
  ? await fetchClientMessages(activeContactId)
  : [];
```

Replace with:
```typescript
const messagingContactIds = members.map((m) => m.id);
const allEntityMessages = tab === "messaging"
  ? await fetchEntityMessages(messagingContactIds)
  : [];
const overviewMessages = isOverview
  ? await fetchClientMessages(activeContactId)
  : [];
```

In `renderTab()`, update the `messaging` case:
```typescript
case "messaging":
  return (
    <MessagingTab
      contactId={activeContactId}
      messages={allEntityMessages}
      members={members}
      activeContactId={activeContactId}
    />
  );
```

Update the `overview` case to use `overviewMessages` (replace `clientMessages` with `overviewMessages`):
```typescript
case "overview":
  return (
    <ClientOverviewTab
      client={client!}
      documents={clientDocuments}
      messages={overviewMessages}
      insights={insightList}
      openTasks={openTasks}
      activityLog={ownerData?.activity ?? []}
    />
  );
```

Remove any remaining references to the old `clientMessages` variable.

- [ ] **Step 11: TypeScript check**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web && pnpm exec tsc --noEmit 2>&1 | head -40
```

Expected: zero errors. Common issue: `togglePinMessage` in `messaging-actions.ts` may expect `(messageId: string, contactId: string, pinned: boolean)` — check that signature matches.

- [ ] **Step 12: Commit**

```bash
cd /Users/johanannunez/workspace/parcel && git add \
  "apps/web/src/app/(admin)/admin/clients/[id]/MessagingTab.tsx" \
  "apps/web/src/app/(admin)/admin/clients/[id]/MessagingTab.module.css" \
  "apps/web/src/app/(admin)/admin/clients/[id]/page.tsx" \
  && git commit -m "feat(entity-first p4): communication tab All/Person filter with unified entity message timeline"
```

---

## Task 3: Add People to settings sections + SettingsTab wiring

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/owners/[entityId]/settings-sections.ts`
- Modify: `apps/web/src/app/(admin)/admin/owners/[entityId]/SettingsTab.tsx`
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/page.tsx`

- [ ] **Step 1: Add "people" to SETTINGS_SECTIONS**

Replace `apps/web/src/app/(admin)/admin/owners/[entityId]/settings-sections.ts` entirely:

```typescript
export const SETTINGS_SECTIONS = [
  "personal",
  "account",
  "business",
  "people",
  "notifications",
  "payments",
  "property_defaults",
  "region",
  "preferences",
  "privacy",
  "danger",
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];
```

- [ ] **Step 2: Update SECTION_LABEL in SettingsTab.tsx**

Open `apps/web/src/app/(admin)/admin/owners/[entityId]/SettingsTab.tsx`.

Find `SECTION_LABEL` (line 28). Add `people` entry after `business`:
```typescript
const SECTION_LABEL: Record<SettingsSection, string> = {
  personal: "Personal info",
  account: "Account & security",
  business: "Business entity",
  people: "People",
  notifications: "Notifications",
  payments: "Payments & payout",
  property_defaults: "Property defaults",
  region: "Region & language",
  preferences: "App preferences",
  privacy: "Data & privacy",
  danger: "Danger zone",
};
```

- [ ] **Step 3: Update PLACEHOLDER_TEASERS in SettingsTab.tsx**

Find `PLACEHOLDER_TEASERS` (line 41). Add `people` entry after `business`:
```typescript
const PLACEHOLDER_TEASERS: Record<Exclude<SettingsSection, "personal">, string> = {
  account: "Password, 2FA, active sessions, and email change.",
  business: "LLC / entity details, EIN, tax classification, and co-owners.",
  people: "Contacts linked to this entity. Add or remove people.",
  notifications: "Email and SMS preferences, digest cadence.",
  payments: "ACH details, W9, payout schedule, tax forms.",
  property_defaults:
    "Default cleaning fees, pricing rules, house rules across all properties.",
  region: "Time zone, locale, and currency preference.",
  preferences: "Dark mode, keyboard shortcuts, install as app.",
  privacy: "Export all data, connected services, third-party integrations.",
  danger:
    "Deactivate or delete owner. Destructive actions require re-confirmation.",
};
```

- [ ] **Step 4: Add adminMembers + adminEntityId to SettingsTabProps**

Find `SettingsTabProps` (line 72). Add two optional fields after `basePath`:
```typescript
export type SettingsTabProps = {
  data: OwnerDetailData;
  activeSection: SettingsSection;
  profileExtras: {
    preferredName: string | null;
    contactMethod: "email" | "sms" | "phone" | "whatsapp" | null;
    timezone: string | null;
  };
  internalNote: {
    text: string;
    updatedAt: string;
    createdByName: string | null;
  } | null;
  sessions: SessionRow[];
  connections: ConnectionRow[];
  entityDetail: {
    id: string;
    name: string;
    type: string | null;
    ein: string | null;
    notes: string | null;
  } | null;
  basePath?: string;
  adminMembers?: EntityMember[];
  adminEntityId?: string;
};
```

Add the `EntityMember` import at the top of the file:
```typescript
import type { EntityMember } from "@/lib/admin/client-detail";
```

Update the function destructuring to include the two new props:
```typescript
export function SettingsTab({
  data,
  activeSection,
  profileExtras,
  internalNote,
  sessions,
  connections,
  entityDetail,
  basePath,
  adminMembers,
  adminEntityId,
}: SettingsTabProps) {
```

- [ ] **Step 5: Add People nav item in SettingsTab JSX**

In the nav section (lines 138-155), add the people nav item after business:
```tsx
{renderNavItem("personal", activeSection, switchSection)}
{renderNavItem("account", activeSection, switchSection)}
{renderNavItem("business", activeSection, switchSection)}
{renderNavItem("people", activeSection, switchSection)}
{renderNavItem("notifications", activeSection, switchSection)}
{/* ... rest unchanged ... */}
```

- [ ] **Step 6: Add PeopleSection import and conditional render**

At the top of `SettingsTab.tsx`, add the import after the existing section imports:
```typescript
import { PeopleSection } from "./settings/PeopleSection";
```

In the content section (after the `{activeSection === "business" && ...}` block), add:
```tsx
{activeSection === "people" && (
  <PeopleSection
    entityId={adminEntityId ?? data.entity?.id ?? ""}
    members={adminMembers ?? []}
  />
)}
```

- [ ] **Step 7: Pass adminMembers + adminEntityId in page.tsx**

In `apps/web/src/app/(admin)/admin/clients/[id]/page.tsx`, find the `<SettingsTab` render in the settings case. Add the two new props:
```tsx
return (
  <SettingsTab
    data={ownerData}
    activeSection={section}
    profileExtras={profileExtras}
    internalNote={internalNote}
    sessions={sessions}
    connections={connections}
    entityDetail={entityDetail}
    basePath={`/admin/clients/${id}`}
    adminMembers={members}
    adminEntityId={entityInfo.id}
  />
);
```

- [ ] **Step 8: TypeScript check**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web && pnpm exec tsc --noEmit 2>&1 | head -40
```

Expected: zero errors. If `PLACEHOLDER_TEASERS` type errors appear, they are because TypeScript requires all `Exclude<SettingsSection, "personal">` keys — adding "people" to the record fixes this.

- [ ] **Step 9: Commit**

```bash
cd /Users/johanannunez/workspace/parcel && git add \
  "apps/web/src/app/(admin)/admin/owners/[entityId]/settings-sections.ts" \
  "apps/web/src/app/(admin)/admin/owners/[entityId]/SettingsTab.tsx" \
  "apps/web/src/app/(admin)/admin/clients/[id]/page.tsx" \
  && git commit -m "feat(entity-first p4): add People settings section wiring to SettingsTab"
```

---

## Task 4: PeopleSection + server actions

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/client-actions.ts`
- Modify: `apps/web/src/app/(admin)/admin/owners/[entityId]/settings/SettingsShared.module.css`
- Create: `apps/web/src/app/(admin)/admin/owners/[entityId]/settings/PeopleSection.tsx`

- [ ] **Step 1: Add addPersonToEntity server action**

Open `apps/web/src/app/(admin)/admin/clients/[id]/client-actions.ts`.

Check if `revalidatePath` is already imported. If not, add at the top:
```typescript
import { revalidatePath } from "next/cache";
```

Add this server action after the existing actions:

```typescript
export async function addPersonToEntity(
  entityId: string,
  input: { firstName: string; lastName: string; email?: string | null; phone?: string | null }
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  const fullName = `${input.firstName.trim()} ${input.lastName.trim()}`.trim();

  const { data, error } = await (supabase as any)
    .from("contacts")
    .insert({
      full_name: fullName,
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      email: input.email ?? null,
      phone: input.phone ?? null,
      entity_id: entityId,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[addPersonToEntity]", error.message);
    return { ok: false, error: "Failed to add person." };
  }

  revalidatePath("/admin/clients/[id]", "page");
  return { ok: true, id: data.id as string };
}
```

- [ ] **Step 2: Add removePersonFromEntity server action**

In the same `client-actions.ts`, add:

```typescript
export async function removePersonFromEntity(
  contactId: string,
  entityId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  const { count } = await (supabase as any)
    .from("contacts")
    .select("id", { count: "exact", head: true })
    .eq("entity_id", entityId);

  if ((count ?? 0) <= 1) {
    return { ok: false, error: "Cannot remove the only person in an entity." };
  }

  const { data: contact } = await (supabase as any)
    .from("contacts")
    .select("full_name")
    .eq("id", contactId)
    .maybeSingle();

  const { data: newEntity, error: entityError } = await (supabase as any)
    .from("entities")
    .insert({ name: contact?.full_name ?? "Unknown", type: "individual" })
    .select("id")
    .single();

  if (entityError) {
    console.error("[removePersonFromEntity] entity error:", entityError.message);
    return { ok: false, error: "Failed to create new entity for removed person." };
  }

  const { error: updateError } = await (supabase as any)
    .from("contacts")
    .update({ entity_id: newEntity.id })
    .eq("id", contactId);

  if (updateError) {
    console.error("[removePersonFromEntity] update error:", updateError.message);
    return { ok: false, error: "Failed to unlink person from entity." };
  }

  revalidatePath("/admin/clients/[id]", "page");
  return { ok: true };
}
```

- [ ] **Step 3: Add missing CSS to SettingsShared.module.css**

Open `apps/web/src/app/(admin)/admin/owners/[entityId]/settings/SettingsShared.module.css`.

The file currently has: `.select`, `.switch*`, `.list*`, `.pill*`, `.metric*`, `.dangerCard*`, `.shortcut*`, `.btnDanger`.

These classes are NOT currently in the file and must be added:

```css
/* ── People section utilities ────────────────────────────────────────────── */

.addLink {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-brand);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 0;
  transition: opacity 100ms ease;
}

.addLink:hover {
  opacity: 0.75;
}

.addLink:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
  border-radius: 3px;
}

.dangerLink {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: none;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: color 100ms ease, background 100ms ease, border-color 100ms ease;
}

.dangerLink:hover {
  color: var(--color-danger, #e53e3e);
  background: color-mix(in srgb, var(--color-danger, #e53e3e) 8%, transparent);
  border-color: color-mix(in srgb, var(--color-danger, #e53e3e) 20%, transparent);
}

.dangerLink:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
}

.primaryBtn {
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  padding: 7px 16px;
  border-radius: var(--radius-sm);
  border: none;
  background: var(--color-brand);
  color: #fff;
  cursor: pointer;
  transition: opacity 100ms ease;
}

.primaryBtn:hover {
  opacity: 0.88;
}

.primaryBtn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.primaryBtn:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
}

.secondaryBtn {
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  padding: 7px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-warm-gray-200);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 100ms ease;
}

.secondaryBtn:hover {
  background: var(--color-warm-gray-50);
}

.secondaryBtn:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
}

.errorMsg {
  font-size: 12.5px;
  color: var(--color-danger, #e53e3e);
  margin: 0;
}

.metaValue {
  font-size: 13px;
  color: var(--color-text-secondary);
}
```

- [ ] **Step 4: Create PeopleSection.tsx**

Create `apps/web/src/app/(admin)/admin/owners/[entityId]/settings/PeopleSection.tsx`:

```typescript
"use client";

import { useState, useTransition } from "react";
import { UserPlus, Trash } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import s from "./PersonalInfoSection.module.css";
import x from "./SettingsShared.module.css";
import type { EntityMember } from "@/lib/admin/client-detail";
import { addPersonToEntity, removePersonFromEntity } from "@/app/(admin)/admin/clients/[id]/client-actions";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

type Props = {
  entityId: string;
  members: EntityMember[];
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

const EMPTY_FORM: FormState = { firstName: "", lastName: "", email: "", phone: "" };

export function PeopleSection({ entityId, members }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [addPending, startAddTransition] = useTransition();
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [removePending, startRemoveTransition] = useTransition();
  const [removeError, setRemoveError] = useState<string | null>(null);

  function handleAdd() {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setFormError("First and last name are required.");
      return;
    }
    setFormError(null);
    startAddTransition(async () => {
      const result = await addPersonToEntity(entityId, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
      });
      if (result.ok) {
        setForm(EMPTY_FORM);
        setShowForm(false);
        router.refresh();
      } else {
        setFormError(result.error);
      }
    });
  }

  function handleRemoveConfirm() {
    if (!confirmRemoveId) return;
    setRemoveError(null);
    startRemoveTransition(async () => {
      const result = await removePersonFromEntity(confirmRemoveId, entityId);
      setConfirmRemoveId(null);
      if (result.ok) {
        router.refresh();
      } else {
        setRemoveError(result.error);
      }
    });
  }

  const confirmTarget = members.find((m) => m.id === confirmRemoveId);

  return (
    <div>
      <header className={s.sectionHeader}>
        <h2 className={s.sectionTitle}>People</h2>
        <p className={s.sectionSubtitle}>
          Contacts linked to this entity. Each person gets their own portal access and communication thread.
        </p>
      </header>

      <section className={s.card}>
        <div className={s.cardHeader}>
          <span className={s.cardHeaderTitle}>Members</span>
          <span className={s.adminPill}>Admin only</span>
        </div>
        <div className={s.cardBody}>
          {removeError && <p className={x.errorMsg} style={{ marginBottom: "8px" }}>{removeError}</p>}

          {members.map((m, index) => (
            <div
              key={m.id}
              className={s.row}
              style={index < members.length - 1 ? { borderBottom: "1px solid var(--color-warm-gray-100)", paddingBottom: "10px", marginBottom: "10px" } : undefined}
            >
              <div className={s.labelCell}>
                <span className={s.label}>{m.fullName}</span>
                {index === 0 && <span className={s.labelHint}>Primary</span>}
              </div>
              <div className={s.fieldCell}>
                <span className={x.metaValue}>{m.email ?? "No email"}</span>
              </div>
              {members.length > 1 && (
                <div style={{ flex: "0 0 auto", display: "flex", alignItems: "center" }}>
                  <button
                    type="button"
                    className={x.dangerLink}
                    onClick={() => setConfirmRemoveId(m.id)}
                    disabled={removePending}
                    aria-label={`Remove ${m.fullName}`}
                  >
                    <Trash size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}

          {!showForm && (
            <div className={s.row} style={{ marginTop: "8px" }}>
              <button
                type="button"
                className={x.addLink}
                onClick={() => setShowForm(true)}
              >
                <UserPlus size={14} />
                Add person
              </button>
            </div>
          )}

          {showForm && (
            <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <div className={s.fieldCell}>
                  <label className={s.label}>First name</label>
                  <input
                    className={s.input}
                    value={form.firstName}
                    onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                    placeholder="Jane"
                    autoFocus
                  />
                </div>
                <div className={s.fieldCell}>
                  <label className={s.label}>Last name</label>
                  <input
                    className={s.input}
                    value={form.lastName}
                    onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                    placeholder="Smith"
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <div className={s.fieldCell}>
                  <label className={s.label}>Email (optional)</label>
                  <input
                    className={s.input}
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="jane@example.com"
                  />
                </div>
                <div className={s.fieldCell}>
                  <label className={s.label}>Phone (optional)</label>
                  <input
                    className={s.input}
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+1 555 000 0000"
                  />
                </div>
              </div>
              {formError && <p className={x.errorMsg}>{formError}</p>}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className={x.primaryBtn}
                  onClick={handleAdd}
                  disabled={addPending}
                >
                  {addPending ? "Adding…" : "Add person"}
                </button>
                <button
                  type="button"
                  className={x.secondaryBtn}
                  onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError(null); }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <ConfirmModal
        open={!!confirmRemoveId}
        title="Remove person"
        description={`Remove ${confirmTarget?.fullName ?? "this person"} from the entity? They will be moved to their own standalone record.`}
        variant="danger"
        confirmLabel="Remove"
        onConfirm={handleRemoveConfirm}
        onCancel={() => setConfirmRemoveId(null)}
      />
    </div>
  );
}
```

- [ ] **Step 5: TypeScript check**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web && pnpm exec tsc --noEmit 2>&1 | head -40
```

Expected: zero errors. Common issues:
- `s.cardHeader`, `s.cardHeaderTitle`, `s.adminPill`: check `PersonalInfoSection.module.css` for the exact class names. If they differ, update the references.
- `s.input`: check if this class exists in `PersonalInfoSection.module.css`. If not, use `s.inlineInput` or whatever the input class is named.
- Import path for `client-actions`: `@/app/(admin)/admin/clients/[id]/client-actions` — the square brackets in the path are literal and Next.js handles this correctly with tsconfig path aliases.

- [ ] **Step 6: Commit**

```bash
cd /Users/johanannunez/workspace/parcel && git add \
  "apps/web/src/app/(admin)/admin/clients/[id]/client-actions.ts" \
  "apps/web/src/app/(admin)/admin/owners/[entityId]/settings/SettingsShared.module.css" \
  "apps/web/src/app/(admin)/admin/owners/[entityId]/settings/PeopleSection.tsx" \
  && git commit -m "feat(entity-first p4): PeopleSection with add/remove person server actions"
```

---

## Verification

1. `cd /Users/johanannunez/workspace/parcel/apps/web && pnpm exec tsc --noEmit` — zero errors
2. Open `http://localhost:4000/admin/clients/[any-entity-id]?tab=messaging`
3. **Single-member entity**: No filter bar. Messaging tab looks identical to before.
4. **Multi-member entity**: Filter bar shows "All" + one chip per member. Default is the active person.
5. **Switch to All**: All messages from all entity members appear in one timeline. Bubbles with messages from other contacts show a colored contact label.
6. **Compose in All view**: "Sending to [name]" label above textarea. Message sends to the active person.
7. **Pin in All view**: Pin/unpin works on any message regardless of filter state.
8. **Settings tab > People**: "People" nav item appears. Clicking it shows the PeopleSection.
9. **People section**: All entity members listed with name and email. First member labeled "Primary".
10. **Add person**: Fill first + last name (required). Click "Add person". On success, new person appears in the list.
11. **Add person — missing fields**: Submitting with empty first or last name shows validation error inline (no browser native alert).
12. **Remove person**: Trash icon visible only when >1 member. Clicking opens ConfirmModal. Confirming removes the person and refreshes the list.
13. **Remove last person**: Trash icon hidden when only 1 member. Server-side guard also returns an error if somehow attempted.
