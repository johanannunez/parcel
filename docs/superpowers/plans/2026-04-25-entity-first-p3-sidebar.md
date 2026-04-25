# Entity-First Phase 3: Sidebar Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild ClientDetailSidebar with entity-first layout: person chips at top, entity name + type badge, person-level fields, entity-level fields, social links modal with 5 networks, and no scroll ever.

**Architecture:** Three new props (entityInfo, members, activeContactId) are threaded from ClientDetailShell into the sidebar. Person chips fire router.replace with `?person=` — same pattern as the header chips from Phase 2. The existing SocialRow (3-link inline edit per field) is replaced with a 5-icon row that opens a single SocialLinksModal. The sidebar layout is restructured into person-level and entity-level sections. No new files are created.

**Tech Stack:** Next.js App Router, TypeScript, CSS Modules, Phosphor Icons (XLogo, Globe added), useRouter/useSearchParams from next/navigation.

---

## File Map

| File | Change |
|------|--------|
| `apps/web/src/lib/admin/client-detail.ts` | Add `x` and `website` to SocialLinks type |
| `apps/web/src/app/(admin)/admin/clients/[id]/client-actions.ts` | Add `whatsapp` to UpdateClientFields.preferredContactMethod union |
| `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailSidebar.tsx` | Add entity props + person chips + entity section + social modal + layout restructure |
| `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailSidebar.module.css` | Person chip/entity section CSS, social modal CSS, no-scroll enforcement |
| `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailShell.tsx` | Pass entityInfo + members + activeContactId to sidebar |

---

## Context (from Phase 1 + Phase 2, already in the codebase)

- `EntityInfo = { id: string; name: string; type: string | null }` exported from `client-detail.ts`
- `EntityMember = { id, fullName, firstName, lastName, email, phone, avatarUrl, portalAccess }` exported from `client-detail.ts`
- `ClientDetailShell` `ClientDetailContent` function already has `entityInfo`, `members`, `activeContactId` in scope
- `updateEntityFields(entityId, { name?, type? })` exists in `client-actions.ts`
- `ENTITY_TYPE_LABELS` constant already exists in `ClientDetailShell.tsx` — duplicate it in the sidebar
- Person chip navigation pattern: `router.replace(`?tab=${activeTab}&person=${m.id}${sectionSuffix}`, { scroll: false })`
- `useSearchParams` and `useRouter` are both available from `next/navigation`
- Sidebar `.copyBtn` is already always-visible (no opacity:0 in current CSS — confirmed)
- `ClientDetailSidebar` is rendered at line 830 of `ClientDetailShell.tsx` with these current props: `client`, `adminProfiles`, `onNameChange`, `onNameEditStart`, `onNameEditEnd`

---

## Task 1: Extend types + thread entity props into sidebar

**Files:**
- Modify: `apps/web/src/lib/admin/client-detail.ts` (lines 28-32)
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/client-actions.ts` (UpdateClientFields type)
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailSidebar.tsx` (props interface ~line 1003, imports line 25)
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailShell.tsx` (sidebar render ~line 830)

- [ ] **Step 1: Update SocialLinks type in client-detail.ts**

Find lines 28-32:
```typescript
export type SocialLinks = {
  linkedin?: string | null;
  instagram?: string | null;
  facebook?: string | null;
};
```

Replace with:
```typescript
export type SocialLinks = {
  linkedin?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  x?: string | null;
  website?: string | null;
};
```

- [ ] **Step 2: Add whatsapp to preferredContactMethod in client-actions.ts**

Open `apps/web/src/app/(admin)/admin/clients/[id]/client-actions.ts`. Find the `UpdateClientFields` type (around line 42-60). Find the `preferredContactMethod` field. It currently reads something like:
```typescript
preferredContactMethod?: 'email' | 'phone' | 'text' | null;
```

Change it to:
```typescript
preferredContactMethod?: 'email' | 'phone' | 'text' | 'whatsapp' | null;
```

The `social` field is a JSONB column and already stores as pass-through — no change needed for the new social keys.

- [ ] **Step 3: Update ClientDetailSidebar imports + props interface**

In `ClientDetailSidebar.tsx`:

a) Change line 25 import:
```typescript
// Before:
import type { ClientDetail, AddressComponents } from "@/lib/admin/client-detail";
// After:
import type { ClientDetail, AddressComponents, EntityInfo, EntityMember } from "@/lib/admin/client-detail";
```

b) Add `useRouter` and `useSearchParams` to existing React navigation import. Near the top, add a new import line:
```typescript
import { useRouter, useSearchParams } from "next/navigation";
```

c) Find `export function ClientDetailSidebar({` (~line 1003). Replace the full props destructure + type:
```typescript
export function ClientDetailSidebar({
  client,
  adminProfiles,
  entityInfo,
  members,
  activeContactId,
  onNameChange,
  onNameEditStart,
  onNameEditEnd,
}: {
  client: ClientDetail;
  adminProfiles: AdminProfile[];
  entityInfo: EntityInfo;
  members: EntityMember[];
  activeContactId: string;
  onNameChange?: (first: string, last: string) => void;
  onNameEditStart?: (part: "first" | "last") => void;
  onNameEditEnd?: () => void;
}) {
```

d) Inside the function body, after the existing state variables (around line 1036, after `const markSaved = useCallback...`), add:
```typescript
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab") ?? "overview";
  const rawSection = searchParams.get("section");
```

- [ ] **Step 4: Pass new props in ClientDetailShell.tsx**

Find the `<ClientDetailSidebar` render (~line 830):
```tsx
      <ClientDetailSidebar
        client={client}
        adminProfiles={adminProfiles}
        onNameChange={handleNameChange}
        onNameEditStart={handleNameEditStart}
        onNameEditEnd={handleNameEditEnd}
      />
```

Replace with:
```tsx
      <ClientDetailSidebar
        client={client}
        adminProfiles={adminProfiles}
        entityInfo={entityInfo}
        members={members}
        activeContactId={activeContactId}
        onNameChange={handleNameChange}
        onNameEditStart={handleNameEditStart}
        onNameEditEnd={handleNameEditEnd}
      />
```

- [ ] **Step 5: TypeScript check**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web && pnpm exec tsc --noEmit 2>&1 | head -40
```

Expected: zero errors. If SocialLinks changes cause errors in other files (e.g., places that spread social objects), fix them by adding the new keys as optional.

- [ ] **Step 6: Commit**

```bash
cd /Users/johanannunez/workspace/parcel && git add \
  apps/web/src/lib/admin/client-detail.ts \
  "apps/web/src/app/(admin)/admin/clients/[id]/client-actions.ts" \
  "apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailSidebar.tsx" \
  "apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailShell.tsx" \
  && git commit -m "feat(entity-first p3): extend SocialLinks type, add whatsapp, thread entity props into sidebar"
```

---

## Task 2: Person chips + entity section at top of sidebar

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailSidebar.tsx`
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailSidebar.module.css`

- [ ] **Step 1: Add ENTITY_TYPE_LABELS constant**

Near the top of `ClientDetailSidebar.tsx`, after the existing helpers (around line 70), add:

```typescript
const ENTITY_TYPE_LABELS: Record<string, string> = {
  individual: 'Individual',
  llc: 'LLC',
  s_corp: 'S Corp',
  c_corp: 'C Corp',
  trust: 'Trust',
  partnership: 'Partnership',
};
```

- [ ] **Step 2: Add person chips + entity section to sidebar JSX**

In the sidebar `return` JSX, find the opening `<aside ref={sidebarRef} className={styles.sidebar}>` and the first element after it (currently `<SectionHeader label="Contact" />`). Insert the person chips block and entity section BEFORE the existing content:

```tsx
      {/* ── Person chips (multi-member only) ─────────────────────────────── */}
      {members.length > 1 && (
        <div className={styles.personChipsSection}>
          {members.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`${styles.sidebarChip} ${m.id === activeContactId ? styles.sidebarChipActive : ''}`}
              onClick={() => {
                const sectionSuffix = rawSection ? `&section=${rawSection}` : "";
                router.replace(`?tab=${rawTab}&person=${m.id}${sectionSuffix}`, { scroll: false });
              }}
            >
              {m.avatarUrl ? (
                <img src={m.avatarUrl} alt={m.fullName} className={styles.sidebarChipAvatar} />
              ) : (
                <span className={styles.sidebarChipInitials}>
                  {(m.firstName ? m.firstName[0] : m.fullName[0] ?? '?').toUpperCase()}
                </span>
              )}
              <span>{m.firstName ?? m.fullName.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Entity section ────────────────────────────────────────────────── */}
      <div className={styles.entitySection}>
        <div className={styles.entitySectionRow}>
          <span className={styles.entitySectionName}>{entityInfo.name}</span>
          {entityInfo.type && (
            <span className={styles.entitySectionBadge}>
              {ENTITY_TYPE_LABELS[entityInfo.type] ?? entityInfo.type}
            </span>
          )}
        </div>
      </div>
      <div className={styles.divider} />
```

- [ ] **Step 3: Add CSS for person chips and entity section**

In `ClientDetailSidebar.module.css`, add after the `.sidebar` block (after line 15):

```css
/* ── Sidebar person chips ───────────────────────────────────────────────── */

.personChipsSection {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 10px 14px 8px;
}

.sidebarChip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px 3px 4px;
  border-radius: 20px;
  border: 1px solid var(--color-warm-gray-200);
  background: transparent;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: inherit;
  transition: background 100ms ease, border-color 100ms ease, color 100ms ease;
}

.sidebarChip:hover {
  background: var(--color-warm-gray-50);
  color: var(--color-text-primary);
}

.sidebarChip:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
}

.sidebarChipActive {
  background: var(--color-brand);
  border-color: var(--color-brand);
  color: #fff;
}

.sidebarChipActive:hover {
  background: var(--color-brand);
  border-color: var(--color-brand);
  color: #fff;
}

.sidebarChipAvatar {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.sidebarChipInitials {
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

/* ── Entity section ─────────────────────────────────────────────────────── */

.entitySection {
  padding: 8px 14px 10px;
}

.entitySectionRow {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.entitySectionName {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.015em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.entitySectionBadge {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--color-warm-gray-100);
  border: 1px solid var(--color-warm-gray-200);
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  flex-shrink: 0;
}
```

- [ ] **Step 4: TypeScript check**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web && pnpm exec tsc --noEmit 2>&1 | head -40
```

Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/johanannunez/workspace/parcel && git add \
  "apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailSidebar.tsx" \
  "apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailSidebar.module.css" \
  && git commit -m "feat(entity-first p3): person chips and entity section in sidebar"
```

---

## Task 3: Social links modal (5 networks)

Replaces the existing `SocialRow` component (3-link inline-edit-per-field) with a 5-icon row that opens a modal for editing all links at once.

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailSidebar.tsx`
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailSidebar.module.css`

- [ ] **Step 1: Add new Phosphor icon imports**

In `ClientDetailSidebar.tsx`, the existing Phosphor import block (lines 13-23) currently imports: `EnvelopeSimple, LinkedinLogo, InstagramLogo, FacebookLogo, Phone, ChatCentered, CheckCircle, XCircle, CopySimple, Check`.

Add `XLogo`, `Globe`, and `X as XIcon` to the import:
```typescript
import {
  EnvelopeSimple,
  LinkedinLogo,
  InstagramLogo,
  FacebookLogo,
  XLogo,
  Globe,
  X as XIcon,
  Phone,
  ChatCentered,
  CheckCircle,
  XCircle,
  CopySimple,
  Check,
} from "@phosphor-icons/react";
```

- [ ] **Step 2: Update SocialKey type and SOCIAL_CONFIG**

Find `type SocialKey = "linkedin" | "instagram" | "facebook";` (~line 642).

Replace the type and the entire `SOCIAL_CONFIG` array with:

```typescript
type SocialKey = keyof SocialLinks;

const SOCIAL_FIELDS: Array<{
  key: SocialKey;
  label: string;
  placeholder: string;
  Icon: React.ElementType;
  color: string;
}> = [
  { key: 'linkedin',  label: 'LinkedIn',  placeholder: 'https://linkedin.com/in/…', Icon: LinkedinLogo,  color: '#0077b5' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/…',   Icon: InstagramLogo, color: '#e1306c' },
  { key: 'x',         label: 'X',         placeholder: 'https://x.com/…',            Icon: XLogo,         color: '#000000' },
  { key: 'facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/…',    Icon: FacebookLogo,  color: '#1877f2' },
  { key: 'website',   label: 'Website',   placeholder: 'https://…',                 Icon: Globe,         color: 'var(--color-brand)' },
];
```

Add this import at the top of the file (with the other imports):
```typescript
import type { SocialLinks } from "@/lib/admin/client-detail";
```
(This was already imported via `ClientDetail` but the explicit type is needed here.)

- [ ] **Step 3: Delete SocialRow, write SocialIconRow + SocialLinksModal**

Delete the entire `SocialRow` function (lines ~655-736). Replace it with two new components:

```typescript
// ---------------------------------------------------------------------------
// Social links (icon row + modal)
// ---------------------------------------------------------------------------

function SocialIconRow({
  social,
  onOpenModal,
}: {
  social: SocialLinks;
  onOpenModal: () => void;
}) {
  return (
    <div className={styles.socialIconRow}>
      {SOCIAL_FIELDS.map(({ key, label, Icon, color }) => {
        const hasValue = !!(social[key]);
        return (
          <button
            key={key}
            type="button"
            title={label}
            className={styles.socialIconBtn}
            style={hasValue ? { color } : undefined}
            onClick={onOpenModal}
            aria-label={`${label}${hasValue ? ': set' : ': not set'}`}
          >
            <Icon size={16} weight={hasValue ? 'fill' : 'regular'} />
          </button>
        );
      })}
    </div>
  );
}

function SocialLinksModal({
  social,
  onSave,
  onClose,
}: {
  social: SocialLinks;
  onSave: (updated: SocialLinks) => Promise<void>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<SocialLinks>({ ...social });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.socialModalOverlay} onClick={onClose}>
      <div
        className={styles.socialModal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Social links"
      >
        <div className={styles.socialModalHeader}>
          <span className={styles.socialModalTitle}>Social Links</span>
          <button type="button" className={styles.socialModalClose} onClick={onClose} aria-label="Close">
            <XIcon size={16} />
          </button>
        </div>
        <div className={styles.socialModalFields}>
          {SOCIAL_FIELDS.map(({ key, label, placeholder, Icon, color }) => (
            <div key={key} className={styles.socialModalField}>
              <label className={styles.socialModalFieldLabel}>
                <Icon size={13} style={{ color: draft[key] ? color : 'var(--color-text-tertiary)' }} />
                {label}
              </label>
              <input
                type="url"
                className={styles.socialModalInput}
                placeholder={placeholder}
                value={draft[key] ?? ''}
                onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value || null }))}
              />
            </div>
          ))}
        </div>
        <div className={styles.socialModalFooter}>
          <button type="button" className={styles.socialModalCancel} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.socialModalSave}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add socialModalOpen state + update saveSocial**

In the sidebar function body:

a) Add state variable (after other state vars):
```typescript
  const [socialModalOpen, setSocialModalOpen] = useState(false);
```

b) Find `saveSocial` (~line 1097). It currently takes `(key: SocialKey, url: string | null)`. Replace it with a new version that accepts the full SocialLinks object:
```typescript
  const saveSocial = async (updated: SocialLinks) => {
    setSocial(updated);
    await save({ social: updated });
    markSaved("social");
  };
```

- [ ] **Step 5: Replace SocialRow usage in JSX**

Find `<SocialRow` in the sidebar JSX (~line 1212):
```tsx
      <SocialRow
        social={social}
        onSave={saveSocial}
        isSaved={savedFields.has("social")}
      />
```

Replace with:
```tsx
      <div className={styles.fieldRow}>
        <span className={styles.fieldLabel}>
          Social
          <SavedBadge visible={savedFields.has("social")} />
        </span>
        <div className={styles.fieldValue}>
          <SocialIconRow social={social} onOpenModal={() => setSocialModalOpen(true)} />
        </div>
      </div>
      {socialModalOpen && (
        <SocialLinksModal
          social={social}
          onSave={saveSocial}
          onClose={() => setSocialModalOpen(false)}
        />
      )}
```

- [ ] **Step 6: Add social modal CSS**

In `ClientDetailSidebar.module.css`, replace the existing `/* ── Social icons ─── */` section (look for `.socialIcons`, `.socialBtn`, `.socialBtnActive`, `.socialBtnEmpty`, `.socialEditRow`) with the new CSS below. Delete those old rules first, then add:

```css
/* ── Social icon row ─────────────────────────────────────────────────────── */

.socialIconRow {
  display: flex;
  gap: 4px;
  align-items: center;
}

.socialIconBtn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-warm-gray-200);
  border-radius: 7px;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: background 100ms ease, border-color 100ms ease;
}

.socialIconBtn:hover {
  background: var(--color-warm-gray-50);
  border-color: var(--color-warm-gray-300, #d4d0c8);
}

.socialIconBtn:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
}

/* ── Social links modal ──────────────────────────────────────────────────── */

.socialModalOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
}

.socialModal {
  background: var(--color-surface, #fff);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xl);
  width: 360px;
  max-width: calc(100vw - 32px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.socialModalHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--color-warm-gray-100);
}

.socialModalTitle {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
}

.socialModalClose {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: background 100ms ease;
}

.socialModalClose:hover {
  background: var(--color-warm-gray-100);
}

.socialModalClose:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
}

.socialModalFields {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px;
}

.socialModalField {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.socialModalFieldLabel {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.socialModalInput {
  font-family: inherit;
  font-size: 12.5px;
  color: var(--color-text-primary);
  background: var(--color-warm-gray-50);
  border: 1px solid var(--color-warm-gray-200);
  border-radius: var(--radius-sm);
  padding: 7px 10px;
  outline: none;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

.socialModalInput:focus {
  border-color: var(--color-brand);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-brand) 12%, transparent);
}

.socialModalFooter {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px 16px;
  border-top: 1px solid var(--color-warm-gray-100);
}

.socialModalCancel {
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

.socialModalCancel:hover {
  background: var(--color-warm-gray-50);
}

.socialModalCancel:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
}

.socialModalSave {
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

.socialModalSave:hover {
  opacity: 0.88;
}

.socialModalSave:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.socialModalSave:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
}
```

- [ ] **Step 7: TypeScript check**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web && pnpm exec tsc --noEmit 2>&1 | head -40
```

Expected: zero errors. Common issues:
- If `SocialKey = keyof SocialLinks` causes issues because SocialLinks keys are optional, the type is still `"linkedin" | "instagram" | "facebook" | "x" | "website"` which is correct.
- If `Icon: React.ElementType` conflicts with Phosphor prop types, use `Icon: React.ComponentType<{ size?: number; weight?: string; style?: React.CSSProperties }>` instead.

- [ ] **Step 8: Commit**

```bash
cd /Users/johanannunez/workspace/parcel && git add \
  "apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailSidebar.tsx" \
  "apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailSidebar.module.css" \
  && git commit -m "feat(entity-first p3): social links modal with 5 networks (linkedin, instagram, x, facebook, website)"
```

---

## Task 4: Sidebar layout restructure + no-scroll

Reorganizes field sections into person-level and entity-level groups. Removes company name and newsletter fields. Enforces no-scroll. Updates contact method to show WhatsApp.

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailSidebar.tsx`
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailSidebar.module.css`

- [ ] **Step 1: Update ContactMethod type and CONTACT_METHODS**

Find `type ContactMethod = "email" | "phone" | "text";` (~line 810). Replace:
```typescript
type ContactMethod = "email" | "phone" | "text" | "whatsapp";
```

Find the `CONTACT_METHODS` array (~line 812). Replace with a version that shows WhatsApp and relabels "text" as "SMS":
```typescript
const CONTACT_METHODS: { key: ContactMethod; label: string }[] = [
  { key: "email",    label: "Email"    },
  { key: "phone",    label: "Phone"    },
  { key: "text",     label: "SMS"      },
  { key: "whatsapp", label: "WhatsApp" },
];
```

Remove the `Icon` field from CONTACT_METHODS since the new design uses text-only method buttons. Find the `CONTACT_METHODS.map` in the JSX and update it to remove the Icon:
```tsx
<div className={styles.contactMethodRow}>
  {CONTACT_METHODS.map(({ key, label }) => (
    <button
      key={key}
      type="button"
      aria-label={label}
      aria-pressed={contactMethod === key}
      className={`${styles.methodBtn} ${contactMethod === key ? styles.methodBtnActive : ""}`}
      onClick={() => saveContactMethod(key)}
    >
      {label}
    </button>
  ))}
</div>
```

Also remove the unused icon imports (`EnvelopeSimple`, `Phone`, `ChatCentered`) if they are only used by the old CONTACT_METHODS mapping and not elsewhere in the file. Check by searching for each import name before deleting.

- [ ] **Step 2: Remove company name state + handler + JSX**

a) Delete state: `const [company, setCompany] = useState(client.companyName ?? "");` (~line 1022)

b) Delete handler:
```typescript
  const saveCompany = async (val: string) => {
    setCompany(val);
    await save({ companyName: val });
    markSaved("company");
  };
```

c) Delete JSX:
```tsx
      <EditableField
        label="Company"
        value={company}
        placeholder="Company name"
        copyValue={company || undefined}
        onSave={saveCompany}
        isSaved={savedFields.has("company")}
      />
```

- [ ] **Step 3: Remove newsletter state + handler + JSX**

a) Delete state: `const [newsletter, setNewsletter] = useState(client.newsletterSubscribed);`

b) Delete handler:
```typescript
  const saveNewsletter = async () => {
    const next = !newsletter;
    setNewsletter(next);
    await save({ newsletterSubscribed: next });
  };
```

c) Delete the newsletter half of the Portal+Newsletter `fieldRowPair`. The Portal field should remain as a standalone `fieldRow`. Replace the current `fieldRowPair` block:
```tsx
      <div className={styles.fieldRowPair}>
        <div className={styles.fieldPairItem}>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Portal</span>
            ...
          </div>
        </div>
        <div className={styles.fieldPairItem}>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Newsletter</span>
            ...
          </div>
        </div>
      </div>
```

With just the portal field:
```tsx
      <div className={styles.fieldRow}>
        <span className={styles.fieldLabel}>Portal</span>
        <div className={styles.fieldValue}>
          <span className={`${styles.portalStatus} ${hasPortal ? styles.portalStatusActive : styles.portalStatusNone}`}>
            {hasPortal ? (
              <><CheckCircle size={13} weight="fill" /> Has access</>
            ) : (
              <><XCircle size={13} weight="regular" /> No access</>
            )}
          </span>
        </div>
      </div>
```

- [ ] **Step 4: Reorder fields into final layout**

The final sidebar JSX order (from top to bottom) must be:

```
<aside>
  [person chips — Task 2]
  [entity section + divider — Task 2]

  <SectionHeader label="Contact" />
  EditableFieldPair (First + Last name)
  EmailField
  EditableField (Phone)
  AddressField
  SocialIconRow + SocialLinksModal (Task 3)
  fieldRow (Prefers / contact method)
  fieldRow (Portal)
  <div className={styles.divider} />

  <SectionHeader label="Pipeline" />
  fieldRowPair (Source readonly + AssignedField)
  <div className={styles.divider} />

  <SectionHeader label="Contract" />
  DateFieldPair (Start + End)
  EditableField (Mgmt fee)
</aside>
```

In the current code the order is: name → email → phone → company → address → social → prefers → portal+newsletter. After this task: name → email → phone → address → social → prefers → portal. Move social (SocialIconRow) to be after AddressField and before the Prefers row.

- [ ] **Step 5: Enforce no-scroll in sidebar CSS**

In `ClientDetailSidebar.module.css`, find `.sidebar` (~line 3). Add `overflow: hidden`:

```css
.sidebar {
  width: 288px;
  min-width: 288px;
  background: var(--color-surface);
  border-left: 1px solid var(--color-warm-gray-100);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
}
```

Also remove the `scrollTop = 0` effect in the sidebar function body (~line 1144):
```typescript
  useEffect(() => {
    if (sidebarRef.current) {
      sidebarRef.current.scrollTop = 0;
    }
  }, [client.id]);
```
This effect reset scroll on client change — with no-scroll it's a no-op and can be deleted.

- [ ] **Step 6: TypeScript check**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web && pnpm exec tsc --noEmit 2>&1 | head -40
```

Expected: zero errors. Common issues:
- Unused `EnvelopeSimple`, `Phone`, `ChatCentered` imports: check if they're used anywhere else in the file before deleting
- If `saveContactMethod` has a type conflict with new ContactMethod union: the `UpdateClientFields.preferredContactMethod` type was expanded in Task 1 to include `whatsapp`, so this should type-check

- [ ] **Step 7: Commit**

```bash
cd /Users/johanannunez/workspace/parcel && git add \
  "apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailSidebar.tsx" \
  "apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailSidebar.module.css" \
  && git commit -m "feat(entity-first p3): restructure sidebar layout, remove company/newsletter, enforce no-scroll"
```

---

## Verification (run after all 4 tasks are committed)

1. `cd /Users/johanannunez/workspace/parcel/apps/web && pnpm exec tsc --noEmit` — zero errors
2. Start dev: `cd apps/web && doppler run -- next dev -p 4000`
3. Open `http://localhost:4000/admin/clients/[any-entity-id]`
4. **Entity section:** Entity name (bold, 13px) and type badge are visible at top of sidebar
5. **Solo entity:** No person chips shown
6. **Multi-member entity:** Person chips appear above entity section; clicking a chip changes `?person=` in URL; person-level fields (name, email, phone) update to the new contact
7. **Person chips:** Active chip has filled brand background; focus-visible outline works on keyboard tab
8. **Social icons:** 5 icons shown (LinkedIn, Instagram, X, Facebook, Website); colored icons for set links, gray for unset
9. **Social modal:** Clicking any social icon opens the modal; all 5 URL inputs show; editing a URL and clicking Save updates the icon row immediately
10. **Modal overlay:** Clicking outside the modal closes it; Escape key does not need to work (not in spec)
11. **Preferred contact method:** 4 buttons: Email, Phone, SMS, WhatsApp; active button has brand background
12. **No scroll:** Sidebar does not scroll at 1440×900 viewport with all fields visible
13. **No company field:** Company name is not in the sidebar
14. **No newsletter toggle:** Newsletter subscription is not in the sidebar
15. **Portal field:** Single row showing "Has access" (green) or "No access" (gray)
