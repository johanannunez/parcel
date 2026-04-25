# Entity-First Phase 2: Header Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the `ClientDetailShell` header to show entity name + type badge as the primary identity, person chips for multi-owner switching, and a lightweight inline status line replacing the bordered-cell strip.

**Architecture:** Entity props (`entityInfo`, `members`, `activeContactId`) are threaded from `page.tsx` through `ClientDetailShell` to `ClientDetailContent`. The `contactBlock` is updated to show entity identity first, then active-person name + email + phone below. `StripCell`/`FollowUpCell` are removed and replaced with a single `StatusLine` component that renders a single inline text line with interactive follow-up state.

**Tech Stack:** Next.js App Router, TypeScript, CSS Modules, Phosphor Icons, date-fns (already installed), React hooks.

---

## File Map

| File | Change |
|------|--------|
| `apps/web/src/app/(admin)/admin/clients/[id]/page.tsx` | Pass `entityInfo`, `members`, `activeContactId` to `ClientDetailShell` |
| `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailShell.tsx` | Update props, replace contactBlock, add `StatusLine`, remove `StripCell`/`FollowUpCell` |
| `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailShell.module.css` | Add entity/chip/status-line CSS, remove all `.strip*` CSS |

---

## Context: What already exists (Phase 1 complete)

- `fetchEntityInfo(entityId)` and `fetchEntityMembers(entityId)` are exported from `apps/web/src/lib/admin/client-detail.ts`
- `EntityInfo = { id, name, type }` and `EntityMember = { id, fullName, firstName, lastName, email, phone, avatarUrl, portalAccess }`
- `page.tsx` already computes `entityInfo`, `members`, `activeContactId` — just not passed to `ClientDetailShell` yet
- `ClientDetailShell.tsx` already has the 40/60 CSS grid layout (`.headerGrid`), `.contactBlock`, `.pillsRow`, and `.strip` — only the content inside changes
- `NextMeeting` type is `{ id, title, scheduledAt } | null` (already nullable in the type definition)

---

### Task 1: Thread entity props from page.tsx into ClientDetailShell

No visible UI change. Wires the already-computed `entityInfo`, `members`, and `activeContactId` from the server component into the client shell so Task 2 and 3 can use them.

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailShell.tsx`
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/page.tsx`

- [ ] **Step 1: Update the import in ClientDetailShell.tsx**

At the top of the file (line 23), find:

```tsx
import type { ClientDetail } from "@/lib/admin/client-detail";
```

Replace with:

```tsx
import type { ClientDetail, EntityInfo, EntityMember } from "@/lib/admin/client-detail";
```

- [ ] **Step 2: Update `ClientDetailContent` function signature**

Find the `ClientDetailContent` function declaration (around line 672). Replace the entire props destructure and type annotation:

```tsx
function ClientDetailContent({
  client,
  adminProfiles,
  nextMeeting,
  children,
}: {
  client: ClientDetail;
  adminProfiles: AdminProfile[];
  nextMeeting: NextMeeting;
  children: React.ReactNode;
}) {
```

With:

```tsx
function ClientDetailContent({
  client,
  adminProfiles,
  nextMeeting,
  entityInfo,
  members,
  activeContactId,
  children,
}: {
  client: ClientDetail;
  adminProfiles: AdminProfile[];
  nextMeeting: NextMeeting;
  entityInfo: EntityInfo;
  members: EntityMember[];
  activeContactId: string;
  children: React.ReactNode;
}) {
```

The function body is unchanged — the new props are not yet used. TypeScript will not complain about unused destructured variables.

- [ ] **Step 3: Update `ClientDetailShell` export function**

Find `export function ClientDetailShell` (around line 875). Replace the props destructure, type annotation, and the inner `ClientDetailContent` JSX:

```tsx
export function ClientDetailShell({
  client,
  adminProfiles,
  nextMeeting,
  entityInfo,
  members,
  activeContactId,
  children,
}: {
  client: ClientDetail;
  adminProfiles: AdminProfile[];
  nextMeeting: NextMeeting;
  entityInfo: EntityInfo;
  members: EntityMember[];
  activeContactId: string;
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className={styles.shell} />}>
      <ClientDetailContent
        client={client}
        adminProfiles={adminProfiles}
        nextMeeting={nextMeeting}
        entityInfo={entityInfo}
        members={members}
        activeContactId={activeContactId}
      >
        {children}
      </ClientDetailContent>
    </Suspense>
  );
}
```

- [ ] **Step 4: Update page.tsx to pass the new props**

In `apps/web/src/app/(admin)/admin/clients/[id]/page.tsx`, find the return statement at the bottom (around line 319). Replace:

```tsx
return (
  <ClientDetailShell client={client} adminProfiles={adminProfiles} nextMeeting={nextMeeting}>
    {renderTab()}
  </ClientDetailShell>
);
```

With:

```tsx
return (
  <ClientDetailShell
    client={client}
    adminProfiles={adminProfiles}
    nextMeeting={nextMeeting}
    entityInfo={entityInfo}
    members={members}
    activeContactId={activeContactId as string}
  >
    {renderTab()}
  </ClientDetailShell>
);
```

The `as string` cast is needed because TypeScript sees `activeContactId` as `string | null` even after the `notFound()` guard above it.

- [ ] **Step 5: TypeScript check**

```bash
cd /Users/johanannunez/workspace/parcel && pnpm exec tsc --noEmit 2>&1 | head -60
```

Expected: zero errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/johanannunez/workspace/parcel && git add apps/web/src/app/\(admin\)/admin/clients/\[id\]/page.tsx apps/web/src/app/\(admin\)/admin/clients/\[id\]/ClientDetailShell.tsx && git commit -m "feat(entity-first p2): thread entityInfo/members/activeContactId into ClientDetailShell"
```

---

### Task 2: Entity name, type badge, and person chips in the header identity block

Replaces the old contactBlock content (company eyebrow + person name) with the entity-first layout: entity name + type badge first, then optional person chips, then active person's name and contact info.

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailShell.tsx`
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailShell.module.css`

- [ ] **Step 1: Add `ENTITY_TYPE_LABELS` constant to ClientDetailShell.tsx**

After the `TAB_KEYS` line (around line 59), insert:

```tsx
const ENTITY_TYPE_LABELS: Record<string, string> = {
  individual: 'Individual',
  llc: 'LLC',
  s_corp: 'S Corp',
  c_corp: 'C Corp',
  trust: 'Trust',
  partnership: 'Partnership',
};
```

- [ ] **Step 2: Replace the `contactBlock` JSX in `ClientDetailContent`**

In `ClientDetailContent`, find the block starting at `<div className={styles.contactBlock}>` and ending at its closing `</div>` (approximately lines 751-791). Replace the entire block with:

```tsx
<div className={styles.contactBlock}>
  {displayAvatarUrl ? (
    <img src={displayAvatarUrl} alt={client.fullName} className={styles.avatar} />
  ) : (
    <div className={styles.avatarFallback}>
      {getInitials((displayFirst || displayLast) ? `${displayFirst} ${displayLast}`.trim() : client.fullName)}
    </div>
  )}
  <div className={styles.identityBlock}>
    <div className={styles.entityRow}>
      <span className={styles.entityName}>{entityInfo.name}</span>
      {entityInfo.type && (
        <span className={styles.entityTypeBadge}>
          {ENTITY_TYPE_LABELS[entityInfo.type] ?? entityInfo.type}
        </span>
      )}
    </div>
    {members.length > 1 && (
      <div className={styles.personChipsRow}>
        {members.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`${styles.personChip} ${m.id === activeContactId ? styles.personChipActive : ''}`}
            onClick={() => router.replace(`?tab=${activeTab}&person=${m.id}`, { scroll: false })}
          >
            {m.avatarUrl ? (
              <img src={m.avatarUrl} alt={m.fullName} className={styles.personChipAvatar} />
            ) : (
              <span className={styles.personChipInitials}>
                {getInitials(m.fullName).slice(0, 1)}
              </span>
            )}
            <span>{m.firstName ?? m.fullName.split(' ')[0]}</span>
          </button>
        ))}
      </div>
    )}
    <h1 className={styles.name}>
      {(displayFirst || displayLast) ? (
        <>
          {displayFirst && (
            <span className={editingNamePart === "first" ? styles.namePartEditing : ""}>
              {displayFirst}
            </span>
          )}
          {displayFirst && displayLast && " "}
          {displayLast && (
            <span className={editingNamePart === "last" ? styles.namePartEditing : ""}>
              {displayLast}
            </span>
          )}
        </>
      ) : (
        client.fullName || "—"
      )}
    </h1>
    <div className={styles.contactStack}>
      {client.email && (
        <span className={styles.contactItem}>
          <span className={styles.contactValue}>{client.email}</span>
          <CopyButton value={client.email} />
        </span>
      )}
      {client.phone && (
        <span className={styles.contactItem}>
          <span className={styles.contactValue}>{formatPhone(client.phone) ?? client.phone}</span>
          <CopyButton value={client.phone} />
        </span>
      )}
    </div>
  </div>
</div>
```

- [ ] **Step 3: Add CSS for entity identity elements to ClientDetailShell.module.css**

After the `.nameBlock` rule block (around line 84), insert:

```css
/* ── Identity block (entity-first header layout) ────────────────────────── */

.identityBlock {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.entityRow {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 2px;
}

.entityName {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--color-text-primary);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.entityTypeBadge {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 4px;
  background: var(--color-warm-gray-100);
  border: 1px solid var(--color-warm-gray-200);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
  white-space: nowrap;
}

/* ── Person chips (multi-member only) ─────────────────────────────────── */

.personChipsRow {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 3px;
}

.personChip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px 2px 4px;
  border-radius: 20px;
  border: 1px solid var(--color-warm-gray-200);
  background: transparent;
  font-size: 10.5px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: inherit;
  transition: background 100ms ease, border-color 100ms ease, color 100ms ease;
}

.personChip:hover {
  background: var(--color-warm-gray-50);
  border-color: var(--color-warm-gray-300, #d4d0c8);
  color: var(--color-text-primary);
}

.personChipActive {
  background: var(--color-brand);
  border-color: var(--color-brand);
  color: #fff;
}

.personChipActive:hover {
  background: var(--color-brand);
  border-color: var(--color-brand);
  color: #fff;
}

.personChipAvatar {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.personChipInitials {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-warm-gray-200);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 8px;
  font-weight: 700;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}
```

- [ ] **Step 4: Scale down `.name` to be secondary to entity name**

Find the `.name` rule in the CSS (around line 103). Change `font-size: 26px; font-weight: 800` to `font-size: 17px; font-weight: 600` so the person name reads as secondary to the entity name:

```css
.name {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.018em;
  color: var(--color-text-secondary);
  line-height: 1.2;
  margin: 0;
}
```

- [ ] **Step 5: Make copy buttons always visible (not hover-reveal)**

Find the `.copyBtn` rule in the CSS (around line 147). Change `opacity: 0` to `opacity: 1`:

```css
.copyBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  opacity: 1;
  transition: color 120ms ease, background 120ms ease;
}
```

Also remove the `.contactItem:hover .copyBtn` rule that was used for hover-reveal (around line 137-139), since the button is now always visible.

- [ ] **Step 6: TypeScript check**

```bash
cd /Users/johanannunez/workspace/parcel && pnpm exec tsc --noEmit 2>&1 | head -60
```

Expected: zero errors.

- [ ] **Step 7: Commit**

```bash
cd /Users/johanannunez/workspace/parcel && git add apps/web/src/app/\(admin\)/admin/clients/\[id\]/ClientDetailShell.tsx apps/web/src/app/\(admin\)/admin/clients/\[id\]/ClientDetailShell.module.css && git commit -m "feat(entity-first p2): entity name, type badge, person chips in header"
```

---

### Task 3: Replace bordered strip with inline status line

Removes `StripCell`, `FollowUpCell`, and the `.strip` CSS. Replaces with a new `StatusLine` component that renders one horizontal line of text with separators.

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailShell.tsx`
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailShell.module.css`

- [ ] **Step 1: Update `DatePickerPopover` anchorRef type to accept any HTMLElement**

In `DatePickerPopover` (around line 215), change the `anchorRef` parameter type from `React.RefObject<HTMLDivElement | null>` to `React.RefObject<HTMLElement | null>` so the component can receive a div ref from `StatusLine`:

```tsx
function DatePickerPopover({
  anchorRef,
  value,
  onSelect,
  onClose,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  value: string | null;
  onSelect: (iso: string) => void;
  onClose: () => void;
}) {
```

- [ ] **Step 2: Write the `StatusLine` component**

Insert this new component immediately before the `StripCell` component (around line 162), between the `CopyButton` component and `StripCell`:

```tsx
// ---------------------------------------------------------------------------
// Inline status line (replaces the bordered-cell strip)
// ---------------------------------------------------------------------------

function StatusLine({
  clientId,
  followUpAt,
  nextMeeting,
  lastActivityAt,
}: {
  clientId: string;
  followUpAt: string | null;
  nextMeeting: NextMeeting;
  lastActivityAt: string | null;
}) {
  const [picking, setPicking] = useState(false);
  const [current, setCurrent] = useState(followUpAt);
  const [, startTransition] = useTransition();
  const followUpAnchorRef = useRef<HTMLDivElement>(null);

  const save = (iso: string | null) => {
    setCurrent(iso);
    setPicking(false);
    startTransition(async () => {
      await updateClientFields(clientId, { nextFollowUpAt: iso });
    });
  };

  const overdue = current ? isOverdue(current) : false;
  const overdueDays = current && overdue ? daysOverdue(current) : 0;
  const hasMeeting = !!nextMeeting;
  const lastContactAgo = lastActivityAt ? relativeDays(lastActivityAt) : null;

  let followUpNode: React.ReactNode;
  if (current && overdue) {
    followUpNode = (
      <>
        <button
          type="button"
          className={styles.statusLineFollowUpBtn}
          data-state="overdue"
          onClick={() => setPicking(true)}
        >
          {formatShortDate(current)}
          {overdueDays > 0 && ` · ${overdueDays}d overdue`}
        </button>
        <button type="button" className={styles.statusLineDoneBtn} onClick={() => save(null)}>
          Done
        </button>
      </>
    );
  } else if (current) {
    followUpNode = (
      <button
        type="button"
        className={styles.statusLineFollowUpBtn}
        data-state="upcoming"
        onClick={() => setPicking(true)}
      >
        {formatShortDate(current)}
      </button>
    );
  } else if (hasMeeting) {
    followUpNode = (
      <>
        <span className={styles.statusLineMuted}>Meeting is next</span>
        <button type="button" className={styles.statusLineAddBtn} onClick={() => setPicking(true)}>
          Add reminder
        </button>
      </>
    );
  } else {
    followUpNode = (
      <button type="button" className={styles.statusLineSetBtn} onClick={() => setPicking(true)}>
        Set date
      </button>
    );
  }

  let nextMeetingNode: React.ReactNode;
  if (nextMeeting) {
    const meetingDays = Math.ceil(
      (new Date(nextMeeting.scheduledAt).getTime() - Date.now()) / 86400_000,
    );
    const meetingRel =
      meetingDays <= 0 ? "today" : meetingDays === 1 ? "tomorrow" : `in ${meetingDays}d`;
    const title =
      nextMeeting.title.length > 28
        ? nextMeeting.title.slice(0, 28) + "…"
        : nextMeeting.title;
    nextMeetingNode = (
      <span className={styles.statusLineMeetingText}>
        {title}
        {" · "}
        {meetingRel}
      </span>
    );
  } else {
    nextMeetingNode = <span className={styles.statusLineMuted}>None scheduled</span>;
  }

  return (
    <div className={`${styles.statusLine} ${overdue ? styles.statusLineOverdue : ""}`}>
      <span className={styles.statusLinePiece}>
        <span className={styles.statusLineLabel}>Last contact</span>
        <span className={styles.statusLineMuted}>{lastContactAgo ?? "No activity yet"}</span>
      </span>
      <span className={styles.statusLineSep} aria-hidden="true" />
      <div ref={followUpAnchorRef} className={styles.statusLinePiece}>
        <span className={styles.statusLineLabel}>Follow-up</span>
        {followUpNode}
      </div>
      <span className={styles.statusLineSep} aria-hidden="true" />
      <span className={styles.statusLinePiece}>
        <span className={styles.statusLineLabel}>Next meeting</span>
        {nextMeetingNode}
      </span>
      {picking && (
        <DatePickerPopover
          anchorRef={followUpAnchorRef}
          value={current}
          onSelect={save}
          onClose={() => setPicking(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Replace the strip JSX in `ClientDetailContent`**

Find the strip section in `ClientDetailContent` (approximately lines 807-824):

```tsx
<div className={`${styles.strip} ${hasOverdue ? styles.stripOverdue : ""}`}>
  <StripCell
    variant="neutral"
    icon={<Clock size={11} weight="regular" />}
    label="Last Contact"
    value={lastContactDate ?? "No activity yet"}
    sub={lastContactAgo && lastContactDate ? lastContactAgo : undefined}
  />
  <FollowUpCell clientId={client.id} followUpAt={client.nextFollowUpAt} nextMeeting={nextMeeting} />
  <StripCell
    variant={nextMeeting ? "green" : "neutral"}
    icon={<CalendarBlank size={11} weight={nextMeeting ? "duotone" : "regular"} />}
    label="Next Meeting"
    value={nextMeeting ? nextMeeting.title : "None scheduled"}
    sub={nextMeeting ? formatMeetingDate(nextMeeting.scheduledAt) : undefined}
    wide
  />
</div>
```

Replace with:

```tsx
<StatusLine
  clientId={client.id}
  followUpAt={client.nextFollowUpAt}
  nextMeeting={nextMeeting}
  lastActivityAt={client.lastActivityAt}
/>
```

- [ ] **Step 4: Remove computed variables no longer needed in `ClientDetailContent`**

Find and delete these four lines in `ClientDetailContent` (approximately lines 733-738):

```tsx
// Determine last contact display
const lastContactDate = client.lastActivityAt ? formatDateTimeWithDay(client.lastActivityAt) : null;
const lastContactAgo = client.lastActivityAt ? relativeDays(client.lastActivityAt) : null;

// Determine if strip has any overdue items
const hasOverdue = client.nextFollowUpAt ? isOverdue(client.nextFollowUpAt) : false;
```

- [ ] **Step 5: Delete the `StripCell` and `FollowUpCell` components**

Delete the `StripCell` component: find the line `type CellVariant = "neutral" | "blue" | "red" | "green" | "amber";` (around line 162) through the closing `}` of `StripCell` (around line 202). Delete the entire block.

Delete the `FollowUpCell` component: find `function FollowUpCell({` (now shifted up due to previous deletion) through its closing `}`. Delete the entire block.

- [ ] **Step 6: Remove unused helper functions**

Remove `formatDateTimeWithDay` (was only used for `lastContactDate` fed into `StripCell`):

```tsx
// "Mon, Apr 23 · 3:14 PM"
function formatDateTimeWithDay(iso: string | null): string {
  ...
}
```

Remove `formatMeetingDate` (was only used in the Next Meeting `StripCell`):

```tsx
// "Mon, May 5 · 2:00 PM" for next meeting sub-line
function formatMeetingDate(iso: string): string {
  ...
}
```

- [ ] **Step 7: Remove unused icon imports**

At the top of the file, update the Phosphor Icons import. Remove icons that were only used by `StripCell`/`FollowUpCell`:
- Remove: `Warning`, `Clock`, `CalendarBlank`, `CheckCircle`

Keep: `CopySimple` (CopyButton), `CaretLeft`, `CaretRight` (DatePickerPopover).

The updated import block:

```tsx
import {
  CopySimple,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
```

- [ ] **Step 8: Replace strip CSS with status line CSS**

In `ClientDetailShell.module.css`, find the `/* ── Relationship strip ───── */` section starting with `.strip {` (around line 222). Delete from `.strip {` through `.stripMiniBtnSolid:hover { ... }` (approximately lines 222-409).

Insert the following new status line CSS in place of everything removed:

```css
/* ── Inline status line (replaces bordered strip) ───────────────────────── */

.statusLine {
  grid-row: 2;
  grid-column: 2;
  display: flex;
  align-items: center;
  padding: 8px 18px;
  gap: 0;
  min-width: 0;
  overflow: hidden;
  transition: background 200ms ease;
}

.statusLineOverdue {
  background: color-mix(in srgb, #ef4444 5%, var(--color-warm-gray-50));
}

.statusLinePiece {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  min-width: 0;
}

.statusLineSep {
  display: inline-block;
  width: 1px;
  height: 12px;
  background: var(--color-warm-gray-200);
  margin: 0 12px;
  flex-shrink: 0;
}

.statusLineLabel {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  white-space: nowrap;
}

.statusLineMuted {
  font-size: 11px;
  color: var(--color-text-tertiary);
  white-space: nowrap;
}

.statusLineFollowUpBtn {
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 600;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  line-height: inherit;
  transition: opacity 100ms ease;
}

.statusLineFollowUpBtn:hover {
  opacity: 0.75;
}

.statusLineFollowUpBtn[data-state="overdue"] {
  color: #b91c1c;
}

.statusLineFollowUpBtn[data-state="upcoming"] {
  color: #b45309;
}

.statusLineDoneBtn {
  font-family: inherit;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 4px;
  border: 1px solid color-mix(in srgb, #ef4444 28%, transparent);
  background: transparent;
  color: #b91c1c;
  cursor: pointer;
  transition: background 100ms ease;
}

.statusLineDoneBtn:hover {
  background: color-mix(in srgb, #ef4444 8%, transparent);
}

.statusLineAddBtn,
.statusLineSetBtn {
  font-family: inherit;
  font-size: 10.5px;
  font-weight: 600;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-brand);
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: transparent;
  transition: text-decoration-color 100ms ease;
}

.statusLineAddBtn:hover,
.statusLineSetBtn:hover {
  text-decoration-color: var(--color-brand);
}

.statusLineMeetingText {
  font-size: 11.5px;
  font-weight: 500;
  color: #15803d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

- [ ] **Step 9: TypeScript check**

```bash
cd /Users/johanannunez/workspace/parcel && pnpm exec tsc --noEmit 2>&1 | head -60
```

Expected: zero errors. Common issues to fix if they appear:
- If TS complains about `followUpAnchorRef` type mismatch with `DatePickerPopover`: confirm Step 1 updated the type to `HTMLElement | null`
- If TS complains about unused vars in `ClientDetailContent`: confirm Steps 4 removed those lines

- [ ] **Step 10: Commit**

```bash
cd /Users/johanannunez/workspace/parcel && git add apps/web/src/app/\(admin\)/admin/clients/\[id\]/ClientDetailShell.tsx apps/web/src/app/\(admin\)/admin/clients/\[id\]/ClientDetailShell.module.css && git commit -m "feat(entity-first p2): replace bordered strip with inline StatusLine, remove StripCell/FollowUpCell"
```

---

## Verification (run after all 3 tasks are committed)

1. `pnpm exec tsc --noEmit` — zero errors
2. Start dev: `doppler run -- next dev -p 4000`
3. Open `http://localhost:4000/admin/clients/[any-entity-id]`
4. Header left block: entity name (large, bold) + type badge + person name (smaller, secondary) + email + phone stacked
5. Copy buttons next to email and phone are visible without hovering
6. Solo entity (one contact): no person chips visible
7. Multi-member entity: chips appear below entity row; active chip has filled brand background; clicking a chip changes `?person=` in URL and updates the identity block
8. Status line shows: "Last contact [relative] · Follow-up [date or state] · Next meeting [title or None scheduled]"
9. Follow-up overdue state: date text is red, "Done" button appears, entire status row has subtle red tint background
10. Follow-up upcoming state: date text is amber, clicking it opens the date picker popover
11. No follow-up + meeting exists: "Meeting is next" + "Add reminder" link
12. Clicking "Add reminder" or "Set date": date picker opens below the follow-up piece
13. Selecting a date from picker: follow-up updates optimistically (no page reload)
