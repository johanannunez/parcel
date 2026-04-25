# Unified Clients Hub — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse the Leads and Owners admin sections into a single "Clients" hub — one nav entry, one list page, one unified detail shell — covering all lifecycle stages from first contact through archived.

**Architecture:** New `/admin/clients/` route reuses `fetchAdminContactsList` for the list and adds a new `fetchClientDetail` that merges contact + owner data. The detail shell is a new `ClientDetailShell` adapted from `OwnerDetailShell`. Existing tab components (OverviewTab, MeetingsTab, FinancialsTab, SettingsTab, TasksTab) wire into the new shell via `entityId`/`contactId`. Tabs with no Phase 1 content use the existing `TabPlaceholder`.

**Tech Stack:** Next.js App Router, Supabase, TypeScript strict, CSS Modules, Framer Motion, Phosphor Icons (`@phosphor-icons/react`)

---

## File Map

**Create:**
- `apps/web/src/lib/admin/client-detail.ts` — `ClientDetail` type + `fetchClientDetail(contactId)`
- `apps/web/src/app/(admin)/admin/clients/layout.tsx` — pass-through layout
- `apps/web/src/app/(admin)/admin/clients/page.tsx` — list page
- `apps/web/src/app/(admin)/admin/clients/[id]/layout.tsx` — pass-through
- `apps/web/src/app/(admin)/admin/clients/[id]/page.tsx` — tab router
- `apps/web/src/app/(admin)/admin/clients/[id]/client-actions.ts` — server actions for edit drawer
- `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailShell.tsx` — unified shell
- `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailShell.module.css`
- `apps/web/src/app/(admin)/admin/clients/[id]/ClientStagePill.tsx`
- `apps/web/src/app/(admin)/admin/clients/[id]/ClientStagePill.module.css`
- `apps/web/src/app/(admin)/admin/clients/[id]/ClientEditDrawer.tsx`
- `apps/web/src/app/(admin)/admin/clients/[id]/ClientEditDrawer.module.css`
- `apps/web/src/app/(admin)/admin/clients/[id]/PropertiesTab.tsx`
- `apps/web/src/app/(admin)/admin/clients/[id]/PropertiesTab.module.css`

**Modify:**
- `apps/web/src/components/admin/AdminSidebar.tsx` — replace Leads + Owners with Clients
- `apps/web/src/app/(admin)/admin/contacts/page.tsx` — fix double Archived tab bug (or wherever the tab list is defined — check layout.tsx too)

---

## Task 1: Fix the Double Archived Tab

**Files:**
- Investigate: `apps/web/src/app/(admin)/admin/contacts/layout.tsx` and `page.tsx`
- Investigate: wherever `fetchContactSavedViewsWithCounts` is defined

- [ ] **Step 1: Find the tab definition**

```bash
grep -r "Archived" apps/web/src/app/\(admin\)/admin/contacts/ --include="*.tsx" -n
grep -r "owners-archived\|archived" apps/web/src/lib/admin/ --include="*.ts" -n | head -30
```

Look for an array of view keys or tab labels. It will look like:
```typescript
const TABS = [
  { key: 'lead-pipeline', label: 'Lead Pipeline' },
  // ...
  { key: 'archived', label: 'Archived' },
  { key: 'owners-archived', label: 'Archived' }, // <-- duplicate label
];
```

- [ ] **Step 2: Remove the duplicate entry**

Keep whichever `archived` view key covers all archived contacts (leads + owners). Remove the redundant one. If both are needed for data reasons, merge them by passing both view keys to `fetchAdminContactsList`.

- [ ] **Step 3: Verify visually**

```bash
open http://localhost:4000/admin/contacts
```

Count the tabs. Should be exactly 5: Lead Pipeline, Onboarding, Active Owners, Offboarding, Archived.

- [ ] **Step 4: Commit**

```bash
git -C /Users/johanannunez/workspace/parcel add -p
git -C /Users/johanannunez/workspace/parcel commit -m "fix: remove duplicate Archived tab from contacts list"
```

---

## Task 2: Update AdminSidebar Navigation

**Files:**
- Modify: `apps/web/src/components/admin/AdminSidebar.tsx`

- [ ] **Step 1: Read the nav entries array**

```bash
grep -n "Leads\|Owners\|navEntries" apps/web/src/components/admin/AdminSidebar.tsx | head -20
```

- [ ] **Step 2: Replace Leads + Owners with Clients**

Find this block (around line 66-76 per codebase research):
```typescript
{ kind: "item", href: "/admin/leads", label: "Leads", icon: <Funnel size={18} weight="duotone" />, matchPrefix: "/admin/leads" },
{ kind: "item", href: "/admin/owners", label: "Owners", icon: <Handshake size={18} weight="duotone" />, matchPrefix: "/admin/owners" },
```

Replace with:
```typescript
{ kind: "item", href: "/admin/clients", label: "Clients", icon: <Users size={18} weight="duotone" />, matchPrefix: "/admin/clients" },
```

Add `Users` to the Phosphor import at the top of the file:
```typescript
import { ..., Users } from '@phosphor-icons/react';
```

- [ ] **Step 3: Verify nav renders**

```bash
open http://localhost:4000/admin
```

Confirm sidebar shows "Clients" between Calendar/Projects and Properties. Confirm Leads and Owners are gone.

- [ ] **Step 4: Commit**

```bash
git -C /Users/johanannunez/workspace/parcel add apps/web/src/components/admin/AdminSidebar.tsx
git -C /Users/johanannunez/workspace/parcel commit -m "feat: replace Leads + Owners nav with unified Clients entry"
```

---

## Task 3: ClientDetail Type and fetchClientDetail

**Files:**
- Create: `apps/web/src/lib/admin/client-detail.ts`

- [ ] **Step 1: Create the file**

```typescript
// apps/web/src/lib/admin/client-detail.ts
import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { LifecycleStage } from "@/lib/admin/contact-types";

export type ClientProperty = {
  id: string;
  label: string;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  setupStatus: string;
  active: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  createdAt: string;
};

export type ClientDetail = {
  // Contact fields (always present)
  id: string;
  fullName: string;
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

  // Owner fields (null when contact is a pre-profile lead)
  profileId: string | null;
  entityId: string | null;
  onboardingCompletedAt: string | null;
  properties: ClientProperty[];
  lifetimeRevenue: number | null;
};

export async function fetchClientDetail(contactId: string): Promise<ClientDetail | null> {
  const supabase = await createClient();

  const { data: contact, error } = await supabase
    .from("contacts")
    .select(
      `id, profile_id, full_name, display_name, company_name,
       email, phone, avatar_url, source, lifecycle_stage,
       stage_changed_at, estimated_mrr, assigned_to, created_at`
    )
    .eq("id", contactId)
    .single();

  if (error || !contact) return null;

  let profileId: string | null = contact.profile_id ?? null;
  let entityId: string | null = null;
  let onboardingCompletedAt: string | null = null;
  let properties: ClientProperty[] = [];
  let lifetimeRevenue: number | null = null;
  let assignedToName: string | null = null;

  // Resolve assigned_to name
  if (contact.assigned_to) {
    const { data: assignee } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", contact.assigned_to)
      .single();
    assignedToName = assignee?.full_name ?? null;
  }

  // Resolve owner data if profile exists
  if (profileId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("entity_id, onboarding_completed_at")
      .eq("id", profileId)
      .single();

    if (profile?.entity_id) {
      entityId = profile.entity_id;
      onboardingCompletedAt = profile.onboarding_completed_at ?? null;

      const { data: props } = await supabase
        .from("properties")
        .select(
          "id, name, address_line1, city, state, setup_status, active, bedrooms, bathrooms, created_at"
        )
        .eq("owner_id", entityId);

      properties = (props ?? []).map((p) => ({
        id: p.id,
        label: p.name ?? p.address_line1 ?? "Unnamed Property",
        addressLine1: p.address_line1 ?? null,
        city: p.city ?? null,
        state: p.state ?? null,
        setupStatus: p.setup_status ?? "not_started",
        active: p.active ?? false,
        bedrooms: p.bedrooms ?? null,
        bathrooms: p.bathrooms ?? null,
        createdAt: p.created_at,
      }));

      // Lifetime revenue: sum payouts for this entity's properties
      const propertyIds = properties.map((p) => p.id);
      if (propertyIds.length > 0) {
        const { data: payouts } = await supabase
          .from("payouts")
          .select("amount")
          .in("property_id", propertyIds)
          .eq("status", "paid");
        lifetimeRevenue =
          (payouts ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0) || null;
      }
    }
  }

  return {
    id: contact.id,
    fullName: contact.full_name,
    displayName: contact.display_name ?? null,
    companyName: contact.company_name ?? null,
    email: contact.email ?? null,
    phone: contact.phone ?? null,
    avatarUrl: contact.avatar_url ?? null,
    source: contact.source ?? null,
    lifecycleStage: contact.lifecycle_stage as LifecycleStage,
    stageChangedAt: contact.stage_changed_at,
    estimatedMrr: contact.estimated_mrr ?? null,
    assignedTo: contact.assigned_to ?? null,
    assignedToName,
    createdAt: contact.created_at,
    profileId,
    entityId,
    onboardingCompletedAt,
    properties,
    lifetimeRevenue,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/johanannunez/workspace/parcel && pnpm exec tsc --noEmit 2>&1 | head -30
```

Fix any type errors before proceeding.

- [ ] **Step 3: Commit**

```bash
git -C /Users/johanannunez/workspace/parcel add apps/web/src/lib/admin/client-detail.ts
git -C /Users/johanannunez/workspace/parcel commit -m "feat: add ClientDetail type and fetchClientDetail"
```

---

## Task 4: Client Server Actions

**Files:**
- Create: `apps/web/src/app/(admin)/admin/clients/[id]/client-actions.ts`

- [ ] **Step 1: Create the file**

```typescript
// apps/web/src/app/(admin)/admin/clients/[id]/client-actions.ts
"use server";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { LifecycleStage } from "@/lib/admin/contact-types";

type UpdateClientFields = Partial<{
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  estimatedMrr: number | null;
  assignedTo: string | null;
  lifecycleStage: LifecycleStage;
}>;

export async function updateClientFields(
  contactId: string,
  fields: UpdateClientFields
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const supabase = await createClient();

  const update: Record<string, unknown> = {};
  if (fields.fullName !== undefined) update.full_name = fields.fullName;
  if (fields.email !== undefined) update.email = fields.email;
  if (fields.phone !== undefined) update.phone = fields.phone;
  if (fields.companyName !== undefined) update.company_name = fields.companyName;
  if (fields.estimatedMrr !== undefined) update.estimated_mrr = fields.estimatedMrr;
  if (fields.assignedTo !== undefined) update.assigned_to = fields.assignedTo;
  if (fields.lifecycleStage !== undefined) {
    update.lifecycle_stage = fields.lifecycleStage;
    update.stage_changed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("contacts")
    .update(update)
    .eq("id", contactId);

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/admin/clients/${contactId}`);
  revalidatePath("/admin/clients");
  return { ok: true, message: "Saved" };
}
```

- [ ] **Step 2: Check that `requireAdmin` import path is correct**

```bash
grep -r "requireAdmin" apps/web/src/lib/admin/ --include="*.ts" -l
```

Update the import path if it differs.

- [ ] **Step 3: Compile check**

```bash
cd /Users/johanannunez/workspace/parcel && pnpm exec tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git -C /Users/johanannunez/workspace/parcel add apps/web/src/app/\(admin\)/admin/clients/
git -C /Users/johanannunez/workspace/parcel commit -m "feat: add updateClientFields server action"
```

---

## Task 5: ClientStagePill Component

**Files:**
- Create: `apps/web/src/app/(admin)/admin/clients/[id]/ClientStagePill.tsx`
- Create: `apps/web/src/app/(admin)/admin/clients/[id]/ClientStagePill.module.css`

- [ ] **Step 1: Create the component**

```typescript
// ClientStagePill.tsx
import type { LifecycleStage } from "@/lib/admin/contact-types";
import styles from "./ClientStagePill.module.css";

const STAGE_CONFIG: Record<LifecycleStage, { label: string; variant: string }> = {
  lead_new:      { label: "New Lead",      variant: "gray"   },
  qualified:     { label: "Qualified",     variant: "gray"   },
  in_discussion: { label: "In Discussion", variant: "gray"   },
  contract_sent: { label: "Contract Sent", variant: "gray"   },
  onboarding:    { label: "Onboarding",    variant: "amber"  },
  active_owner:  { label: "Active Owner",  variant: "green"  },
  offboarding:   { label: "Offboarding",   variant: "orange" },
  lead_cold:     { label: "Cold Lead",     variant: "slate"  },
  paused:        { label: "Paused",        variant: "slate"  },
  churned:       { label: "Churned",       variant: "slate"  },
};

export function ClientStagePill({ stage }: { stage: LifecycleStage }) {
  const config = STAGE_CONFIG[stage] ?? { label: stage, variant: "gray" };
  return (
    <span className={`${styles.pill} ${styles[config.variant]}`}>
      {config.label}
    </span>
  );
}
```

- [ ] **Step 2: Create the CSS**

```css
/* ClientStagePill.module.css */
.pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  white-space: nowrap;
}

.gray   { background: #f1f3f5; color: #5c6370; }
.amber  { background: #fff3cd; color: #92600a; }
.green  { background: #d3f9d8; color: #1a6930; }
.orange { background: #ffe8cc; color: #8b4513; }
.slate  { background: #e9ecef; color: #495057; }
```

- [ ] **Step 3: Commit**

```bash
git -C /Users/johanannunez/workspace/parcel add apps/web/src/app/\(admin\)/admin/clients/
git -C /Users/johanannunez/workspace/parcel commit -m "feat: add ClientStagePill component"
```

---

## Task 6: ClientEditDrawer Component

**Files:**
- Create: `apps/web/src/app/(admin)/admin/clients/[id]/ClientEditDrawer.tsx`
- Create: `apps/web/src/app/(admin)/admin/clients/[id]/ClientEditDrawer.module.css`

- [ ] **Step 1: Create the drawer component**

```typescript
// ClientEditDrawer.tsx
"use client";
import { useState, useTransition } from "react";
import { X } from "@phosphor-icons/react";
import type { ClientDetail } from "@/lib/admin/client-detail";
import type { LifecycleStage } from "@/lib/admin/contact-types";
import { updateClientFields } from "./client-actions";
import { ClientStagePill } from "./ClientStagePill";
import styles from "./ClientEditDrawer.module.css";

const ALL_STAGES: LifecycleStage[] = [
  "lead_new", "qualified", "in_discussion", "contract_sent",
  "onboarding", "active_owner", "offboarding", "lead_cold", "paused", "churned",
];

const STAGE_LABELS: Record<LifecycleStage, string> = {
  lead_new: "New Lead", qualified: "Qualified", in_discussion: "In Discussion",
  contract_sent: "Contract Sent", onboarding: "Onboarding", active_owner: "Active Owner",
  offboarding: "Offboarding", lead_cold: "Cold Lead", paused: "Paused", churned: "Churned",
};

export function ClientEditDrawer({
  client,
  open,
  onClose,
}: {
  client: ClientDetail;
  open: boolean;
  onClose: () => void;
}) {
  const [fullName, setFullName] = useState(client.fullName);
  const [email, setEmail] = useState(client.email ?? "");
  const [phone, setPhone] = useState(client.phone ?? "");
  const [company, setCompany] = useState(client.companyName ?? "");
  const [mrr, setMrr] = useState(client.estimatedMrr?.toString() ?? "");
  const [stage, setStage] = useState<LifecycleStage>(client.lifecycleStage);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateClientFields(client.id, {
        fullName: fullName.trim() || client.fullName,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        companyName: company.trim() || undefined,
        estimatedMrr: mrr ? parseFloat(mrr) : null,
        lifecycleStage: stage,
      });
      if (!result.ok) { setError(result.message); return; }
      onClose();
    });
  }

  if (!open) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <aside className={styles.drawer}>
        <header className={styles.drawerHeader}>
          <h2 className={styles.drawerTitle}>Edit Client</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className={styles.drawerBody}>
          <div className={styles.field}>
            <label className={styles.label}>Full Name</label>
            <input className={styles.input} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input className={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Phone</label>
            <input className={styles.input} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Company</label>
            <input className={styles.input} value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Estimated MRR ($)</label>
            <input className={styles.input} type="number" min="0" value={mrr} onChange={(e) => setMrr(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Stage</label>
            <select
              className={styles.input}
              value={stage}
              onChange={(e) => setStage(e.target.value as LifecycleStage)}
            >
              {ALL_STAGES.map((s) => (
                <option key={s} value={s}>{STAGE_LABELS[s]}</option>
              ))}
            </select>
          </div>
          {error && <p className={styles.errorMsg}>{error}</p>}
        </div>

        <footer className={styles.drawerFooter}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={isPending}>
            Cancel
          </button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </footer>
      </aside>
    </>
  );
}
```

**Note on `<select>`:** The CLAUDE.md says never use native `<select>`. Check if there is a `CustomSelect` at `@/components/admin/CustomSelect` — if so, replace the stage select with that component. The pattern should be the same but using the custom component's API.

- [ ] **Step 2: Create the CSS**

```css
/* ClientEditDrawer.module.css */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 40;
  animation: fadeIn 120ms ease;
}

.drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 400px;
  max-width: 100vw;
  background: var(--color-surface, #fff);
  border-left: 1px solid var(--color-border, #e5e7eb);
  z-index: 41;
  display: flex;
  flex-direction: column;
  animation: slideIn 180ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.12);
}

@keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
@keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }

.drawerHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  flex-shrink: 0;
}

.drawerTitle {
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
  color: var(--color-text-primary, #111);
}

.closeBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--color-text-muted, #888);
  transition: background 120ms ease;
}
.closeBtn:hover { background: var(--color-bg-hover, #f3f4f6); }

.drawerBody {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field { display: flex; flex-direction: column; gap: 6px; }

.label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-secondary, #555);
}

.input {
  padding: 8px 12px;
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: 8px;
  font-size: 0.9375rem;
  color: var(--color-text-primary, #111);
  background: var(--color-bg, #fff);
  outline: none;
  transition: border-color 120ms ease;
  width: 100%;
  box-sizing: border-box;
}
.input:focus { border-color: var(--color-brand, #02AAEB); }

.errorMsg {
  font-size: 0.8125rem;
  color: #dc2626;
  margin: 0;
}

.drawerFooter {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--color-border, #e5e7eb);
  flex-shrink: 0;
}

.cancelBtn {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid var(--color-border, #d1d5db);
  background: transparent;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  color: var(--color-text-secondary, #555);
}
.cancelBtn:disabled { opacity: 0.5; cursor: default; }

.saveBtn {
  padding: 8px 20px;
  border-radius: 8px;
  border: none;
  background: var(--color-brand, #02AAEB);
  color: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 120ms ease;
}
.saveBtn:disabled { opacity: 0.6; cursor: default; }
```

- [ ] **Step 3: Compile check**

```bash
cd /Users/johanannunez/workspace/parcel && pnpm exec tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git -C /Users/johanannunez/workspace/parcel add apps/web/src/app/\(admin\)/admin/clients/
git -C /Users/johanannunez/workspace/parcel commit -m "feat: add ClientEditDrawer with slide-in animation"
```

---

## Task 7: ClientDetailShell Component

**Files:**
- Create: `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailShell.tsx`
- Create: `apps/web/src/app/(admin)/admin/clients/[id]/ClientDetailShell.module.css`

- [ ] **Step 1: Create the shell component**

```typescript
// ClientDetailShell.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PencilSimple } from "@phosphor-icons/react";
import type { ClientDetail } from "@/lib/admin/client-detail";
import { ClientStagePill } from "./ClientStagePill";
import { ClientEditDrawer } from "./ClientEditDrawer";
import styles from "./ClientDetailShell.module.css";

type TabKey =
  | "overview"
  | "properties"
  | "meetings"
  | "intelligence"
  | "messaging"
  | "documents"
  | "billing"
  | "settings";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview",      label: "Overview"      },
  { key: "properties",    label: "Properties"    },
  { key: "meetings",      label: "Meetings"      },
  { key: "intelligence",  label: "Intelligence"  },
  { key: "messaging",     label: "Messaging"     },
  { key: "documents",     label: "Documents"     },
  { key: "billing",       label: "Billing"       },
  { key: "settings",      label: "Settings"      },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function ClientDetailShell({
  client,
  children,
}: {
  client: ClientDetail;
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") ?? "overview") as TabKey;
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className={styles.shell}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.identity}>
          {client.avatarUrl ? (
            <img
              src={client.avatarUrl}
              alt={client.fullName}
              className={styles.avatar}
            />
          ) : (
            <div className={styles.avatarFallback}>
              {getInitials(client.fullName)}
            </div>
          )}
          <div className={styles.nameBlock}>
            <h1 className={styles.name}>{client.fullName}</h1>
            {client.companyName && (
              <p className={styles.company}>{client.companyName}</p>
            )}
            <div className={styles.contactRow}>
              {client.email && <span>{client.email}</span>}
              {client.email && client.phone && (
                <span className={styles.separator}>·</span>
              )}
              {client.phone && <span>{client.phone}</span>}
            </div>
          </div>
        </div>
        <div className={styles.headerActions}>
          <ClientStagePill stage={client.lifecycleStage} />
          <button
            className={styles.editBtn}
            onClick={() => setDrawerOpen(true)}
          >
            <PencilSimple size={15} weight="bold" />
            Edit
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <nav className={styles.tabBar} aria-label="Client tabs">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`?tab=${tab.key}`}
            className={styles.tab}
            data-active={activeTab === tab.key}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {/* Content */}
      <main className={styles.content}>{children}</main>

      {/* Edit drawer */}
      <ClientEditDrawer
        client={client}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create the CSS**

```css
/* ClientDetailShell.module.css */
.shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg, #f8f9fa);
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 28px 32px 20px;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  background: var(--color-surface, #fff);
  flex-shrink: 0;
  gap: 16px;
}

.identity {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.avatar,
.avatarFallback {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  flex-shrink: 0;
  object-fit: cover;
}

.avatarFallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-brand, #02AAEB);
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
}

.nameBlock { min-width: 0; }

.name {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-text-primary, #111);
  margin: 0 0 2px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.company {
  font-size: 0.875rem;
  color: var(--color-text-muted, #888);
  margin: 0 0 5px;
}

.contactRow {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  color: var(--color-text-secondary, #666);
  flex-wrap: wrap;
}

.separator { color: var(--color-text-muted, #bbb); }

.headerActions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  padding-top: 4px;
}

.editBtn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  border: 1px solid var(--color-border, #d1d5db);
  background: var(--color-surface, #fff);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-secondary, #555);
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease;
  white-space: nowrap;
}
.editBtn:hover {
  background: var(--color-bg-hover, #f3f4f6);
  border-color: var(--color-text-muted, #aaa);
}

.tabBar {
  display: flex;
  align-items: center;
  padding: 0 32px;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  background: var(--color-surface, #fff);
  flex-shrink: 0;
  overflow-x: auto;
  scrollbar-width: none;
}
.tabBar::-webkit-scrollbar { display: none; }

.tab {
  padding: 13px 16px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted, #888);
  border-bottom: 2px solid transparent;
  text-decoration: none;
  white-space: nowrap;
  transition: color 120ms ease, border-color 120ms ease;
  display: block;
}
.tab:hover { color: var(--color-text-primary, #111); }
.tab[data-active="true"] {
  color: var(--color-brand, #02AAEB);
  border-bottom-color: var(--color-brand, #02AAEB);
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}
```

- [ ] **Step 3: Compile check**

```bash
cd /Users/johanannunez/workspace/parcel && pnpm exec tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git -C /Users/johanannunez/workspace/parcel add apps/web/src/app/\(admin\)/admin/clients/
git -C /Users/johanannunez/workspace/parcel commit -m "feat: add ClientDetailShell with header, stage pill, and tab bar"
```

---

## Task 8: PropertiesTab with Grid and Table Toggle

**Files:**
- Create: `apps/web/src/app/(admin)/admin/clients/[id]/PropertiesTab.tsx`
- Create: `apps/web/src/app/(admin)/admin/clients/[id]/PropertiesTab.module.css`

- [ ] **Step 1: Create the component**

```typescript
// PropertiesTab.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { SquaresFour, ListBullets } from "@phosphor-icons/react";
import type { ClientProperty } from "@/lib/admin/client-detail";
import styles from "./PropertiesTab.module.css";

function PropertyStatusBadge({ active, setupStatus }: { active: boolean; setupStatus: string }) {
  if (!active) return <span className={`${styles.badge} ${styles.badgeInactive}`}>Inactive</span>;
  if (setupStatus !== "completed") return <span className={`${styles.badge} ${styles.badgeSetup}`}>In Setup</span>;
  return <span className={`${styles.badge} ${styles.badgeActive}`}>Active</span>;
}

function PropertyCard({ property }: { property: ClientProperty }) {
  return (
    <Link href={`/admin/properties/${property.id}`} className={styles.card}>
      <div className={styles.cardTop}>
        <p className={styles.cardAddress}>{property.addressLine1 ?? property.label}</p>
        <p className={styles.cardCity}>
          {[property.city, property.state].filter(Boolean).join(", ")}
        </p>
      </div>
      <div className={styles.cardBottom}>
        <PropertyStatusBadge active={property.active} setupStatus={property.setupStatus} />
        {property.bedrooms != null && (
          <span className={styles.cardMeta}>
            {property.bedrooms} bd / {property.bathrooms} ba
          </span>
        )}
      </div>
    </Link>
  );
}

function PropertyTable({ properties }: { properties: ClientProperty[] }) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th className={styles.th}>Address</th>
          <th className={styles.th}>Location</th>
          <th className={styles.th}>Status</th>
          <th className={styles.th}>Beds / Baths</th>
          <th className={styles.th}>Added</th>
        </tr>
      </thead>
      <tbody>
        {properties.map((p) => (
          <tr key={p.id} className={styles.tr}>
            <td className={styles.td}>
              <Link href={`/admin/properties/${p.id}`} className={styles.tableLink}>
                {p.addressLine1 ?? p.label}
              </Link>
            </td>
            <td className={styles.td}>
              {[p.city, p.state].filter(Boolean).join(", ") || "—"}
            </td>
            <td className={styles.td}>
              <PropertyStatusBadge active={p.active} setupStatus={p.setupStatus} />
            </td>
            <td className={styles.td}>
              {p.bedrooms != null ? `${p.bedrooms} / ${p.bathrooms}` : "—"}
            </td>
            <td className={styles.td}>
              {new Date(p.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function PropertiesTab({ properties }: { properties: ClientProperty[] }) {
  const [view, setView] = useState<"grid" | "table">("grid");

  if (properties.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>No properties linked yet.</p>
        <Link href="/admin/properties" className={styles.emptyLink}>
          Browse all properties
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <span className={styles.count}>
          {properties.length} {properties.length === 1 ? "property" : "properties"}
        </span>
        <div className={styles.viewToggle}>
          <button
            className={`${styles.toggleBtn} ${view === "grid" ? styles.toggleActive : ""}`}
            onClick={() => setView("grid")}
            aria-label="Grid view"
          >
            <SquaresFour size={16} weight={view === "grid" ? "fill" : "regular"} />
          </button>
          <button
            className={`${styles.toggleBtn} ${view === "table" ? styles.toggleActive : ""}`}
            onClick={() => setView("table")}
            aria-label="Table view"
          >
            <ListBullets size={16} weight={view === "table" ? "fill" : "regular"} />
          </button>
        </div>
      </div>

      {view === "grid" ? (
        <div className={styles.grid}>
          {properties.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <PropertyTable properties={properties} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create the CSS**

```css
/* PropertiesTab.module.css */
.container { display: flex; flex-direction: column; gap: 20px; }

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.count {
  font-size: 0.875rem;
  color: var(--color-text-muted, #888);
  font-weight: 500;
}

.viewToggle {
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--color-bg, #f3f4f6);
  border-radius: 8px;
  padding: 3px;
}

.toggleBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--color-text-muted, #888);
  transition: background 100ms ease, color 100ms ease;
}
.toggleBtn:hover { color: var(--color-text-primary, #111); }
.toggleActive { background: var(--color-surface, #fff); color: var(--color-text-primary, #111); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 12px;
  background: var(--color-surface, #fff);
  text-decoration: none;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}
.card:hover {
  border-color: var(--color-brand, #02AAEB);
  box-shadow: 0 2px 12px rgba(2, 170, 235, 0.08);
}

.cardTop { display: flex; flex-direction: column; gap: 3px; }
.cardAddress {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary, #111);
  margin: 0;
  line-height: 1.3;
}
.cardCity {
  font-size: 0.8125rem;
  color: var(--color-text-muted, #888);
  margin: 0;
}

.cardBottom { display: flex; align-items: center; justify-content: space-between; }
.cardMeta { font-size: 0.8125rem; color: var(--color-text-secondary, #666); }

.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}
.badgeActive   { background: #d3f9d8; color: #1a6930; }
.badgeSetup    { background: #fff3cd; color: #92600a; }
.badgeInactive { background: #e9ecef; color: #6c757d; }

.tableWrapper { overflow-x: auto; border-radius: 10px; border: 1px solid var(--color-border, #e5e7eb); }
.table { width: 100%; border-collapse: collapse; background: var(--color-surface, #fff); }
.th {
  text-align: left;
  padding: 11px 16px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-muted, #888);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  white-space: nowrap;
}
.tr:hover td { background: var(--color-bg-hover, #f9fafb); }
.td {
  padding: 12px 16px;
  font-size: 0.875rem;
  color: var(--color-text-primary, #111);
  border-bottom: 1px solid var(--color-border, #e5e7eb);
}
.tr:last-child .td { border-bottom: none; }
.tableLink {
  color: var(--color-text-primary, #111);
  text-decoration: none;
  font-weight: 500;
}
.tableLink:hover { color: var(--color-brand, #02AAEB); }

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 64px 32px;
  text-align: center;
}
.emptyText { font-size: 0.9375rem; color: var(--color-text-muted, #888); margin: 0; }
.emptyLink {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-brand, #02AAEB);
  text-decoration: none;
}
.emptyLink:hover { text-decoration: underline; }
```

- [ ] **Step 3: Compile check**

```bash
cd /Users/johanannunez/workspace/parcel && pnpm exec tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git -C /Users/johanannunez/workspace/parcel add apps/web/src/app/\(admin\)/admin/clients/
git -C /Users/johanannunez/workspace/parcel commit -m "feat: add PropertiesTab with grid and table view toggle"
```

---

## Task 9: Clients List Route

**Files:**
- Create: `apps/web/src/app/(admin)/admin/clients/layout.tsx`
- Create: `apps/web/src/app/(admin)/admin/clients/page.tsx`

- [ ] **Step 1: Create the layout**

```typescript
// apps/web/src/app/(admin)/admin/clients/layout.tsx
export default function ClientsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 2: Create the list page**

The clients list page reuses `fetchAdminContactsList` from the existing contacts data layer. Read that function's signature first:

```bash
grep -n "fetchAdminContactsList" apps/web/src/lib/admin/ -r --include="*.ts"
```

Then create the page. This adapts the contacts page but links to `/admin/clients/[id]` and fixes the tab list:

```typescript
// apps/web/src/app/(admin)/admin/clients/page.tsx
import { Suspense } from "react";
import { fetchAdminContactsList } from "@/lib/admin/contacts-list"; // verify exact import path
import { ContactsListView } from "@/app/(admin)/admin/contacts/ContactsListView"; // reuse existing

// These view keys map to lifecycle stage groups in fetchAdminContactsList.
// Verify these match what the function accepts.
const CLIENT_TABS = [
  { key: "all",          label: "All"           },
  { key: "lead-pipeline", label: "Lead Pipeline" },
  { key: "onboarding",   label: "Onboarding"    },
  { key: "active-owners", label: "Active"        },
  { key: "offboarding",  label: "Offboarding"   },
  { key: "archived",     label: "Archived"       },
] as const;

type ViewKey = typeof CLIENT_TABS[number]["key"];

interface Props {
  searchParams: Promise<{ view?: string; q?: string }>;
}

export default async function ClientsPage({ searchParams }: Props) {
  const { view, q } = await searchParams;
  const viewKey = (view ?? "all") as ViewKey;

  const { rows, activeView } = await fetchAdminContactsList({
    viewKey: viewKey === "all" ? undefined : viewKey, // pass undefined for "all" if supported
    search: q ?? null,
  });

  return (
    <div>
      {/* Page header */}
      <div style={{ padding: "24px 32px 0", borderBottom: "1px solid var(--color-border)" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 16px" }}>Clients</h1>
        {/* Stage tabs */}
        <nav style={{ display: "flex", gap: 0 }}>
          {CLIENT_TABS.map((tab) => (
            <a
              key={tab.key}
              href={`/admin/clients?view=${tab.key}${q ? `&q=${q}` : ""}`}
              style={{
                padding: "10px 16px",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: viewKey === tab.key ? "var(--color-brand)" : "var(--color-text-muted)",
                borderBottom: viewKey === tab.key ? "2px solid var(--color-brand)" : "2px solid transparent",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </a>
          ))}
        </nav>
      </div>

      {/* List — reuse existing ContactsListView but override the link target */}
      {/* IMPORTANT: ContactsListView links to /admin/contacts/[id]. Two options:
          A) Add a `basePath` prop to ContactsListView and default it to "/admin/contacts"
          B) Create a thin ClientsListView wrapper that maps rows to /admin/clients/[id]
          Choose option B if modifying ContactsListView would be risky. */}
      <Suspense fallback={<div style={{ padding: 32 }}>Loading…</div>}>
        <ContactsListView
          rows={rows}
          activeView={activeView}
          basePath="/admin/clients" // add this prop to ContactsListView if it doesn't exist
        />
      </Suspense>
    </div>
  );
}
```

**Important:** The `basePath` prop approach requires modifying `ContactsListView` to accept it. If that component is complex or risky to change, instead create a new `ClientsListView` that renders a simple table:

```typescript
// Fallback: simple list if basePath prop is not feasible
function ClientsListFallback({ rows }: { rows: ContactRow[] }) {
  return (
    <div style={{ padding: "16px 32px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "10px 12px", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Name</th>
            <th style={{ textAlign: "left", padding: "10px 12px", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Company</th>
            <th style={{ textAlign: "left", padding: "10px 12px", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Stage</th>
            <th style={{ textAlign: "left", padding: "10px 12px", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Email</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td style={{ padding: "12px 12px", borderTop: "1px solid var(--color-border)" }}>
                <a href={`/admin/clients/${row.id}`} style={{ fontWeight: 600, color: "var(--color-text-primary)", textDecoration: "none" }}>
                  {row.fullName}
                </a>
              </td>
              <td style={{ padding: "12px 12px", borderTop: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                {row.companyName ?? "—"}
              </td>
              <td style={{ padding: "12px 12px", borderTop: "1px solid var(--color-border)" }}>
                {row.lifecycleStage}
              </td>
              <td style={{ padding: "12px 12px", borderTop: "1px solid var(--color-border)", color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
                {row.email ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

Use the fallback if the `basePath` prop approach has friction. The list can be polished in a follow-up.

- [ ] **Step 3: Verify the page loads**

```bash
open http://localhost:4000/admin/clients
```

The page should load, show the tabs, and render a list of clients. Clicking a client should go to `/admin/clients/[id]` (which doesn't exist yet — that's Task 10).

- [ ] **Step 4: Commit**

```bash
git -C /Users/johanannunez/workspace/parcel add apps/web/src/app/\(admin\)/admin/clients/
git -C /Users/johanannunez/workspace/parcel commit -m "feat: add Clients list page with stage tabs"
```

---

## Task 10: Clients Detail Route — Page Router

**Files:**
- Create: `apps/web/src/app/(admin)/admin/clients/[id]/layout.tsx`
- Create: `apps/web/src/app/(admin)/admin/clients/[id]/page.tsx`

- [ ] **Step 1: Create the layout**

```typescript
// apps/web/src/app/(admin)/admin/clients/[id]/layout.tsx
export default function ClientDetailLayout({ children }: { children: React.ReactNode }) {
  return <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>{children}</div>;
}
```

- [ ] **Step 2: Find the imports you'll need**

Before writing page.tsx, verify the exact import paths:

```bash
# Where is fetchOwnerDetail defined?
grep -rn "export async function fetchOwnerDetail" apps/web/src/lib/ --include="*.ts"

# Where is OverviewTab?
find apps/web/src/app -name "OverviewTab.tsx"

# Where is MeetingsTab?
find apps/web/src/app -name "MeetingsTab.tsx"

# Where is FinancialsTab?
find apps/web/src/app -name "FinancialsTab.tsx"

# Where is TabPlaceholder?
find apps/web/src/app -name "TabPlaceholder.tsx"

# What props does FinancialsTab take?
head -20 apps/web/src/app/\(admin\)/admin/owners/\[entityId\]/FinancialsTab.tsx
```

Record the exact paths and prop signatures before writing the page.

- [ ] **Step 3: Create the detail page**

```typescript
// apps/web/src/app/(admin)/admin/clients/[id]/page.tsx
import { notFound } from "next/navigation";
import { fetchClientDetail } from "@/lib/admin/client-detail";
import { fetchOwnerDetail } from "@/lib/admin/owner-detail"; // verify path
import { ClientDetailShell } from "./ClientDetailShell";
import { PropertiesTab } from "./PropertiesTab";

// Existing tab components from the owner hub — reused as-is
import { OverviewTab } from "@/app/(admin)/admin/owners/[entityId]/OverviewTab";
import { MeetingsTab } from "@/app/(admin)/admin/owners/[entityId]/MeetingsTab";
import { FinancialsTab } from "@/app/(admin)/admin/owners/[entityId]/FinancialsTab";
import { SettingsTab } from "@/app/(admin)/admin/owners/[entityId]/SettingsTab";
import { TabPlaceholder } from "@/app/(admin)/admin/owners/[entityId]/TabPlaceholder";
import { TasksTab } from "@/components/admin/tasks/TasksTab"; // verify path

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; section?: string }>;
}

export default async function ClientDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab = "overview", section = "personal" } = await searchParams;

  const client = await fetchClientDetail(id);
  if (!client) notFound();

  // If this client has become an owner, fetch the full owner data
  // for tabs that were built against OwnerDetailData
  const ownerData = client.entityId
    ? await fetchOwnerDetail(client.entityId)
    : null;

  function renderTab() {
    switch (tab) {
      case "overview":
        if (ownerData) return <OverviewTab data={ownerData} />;
        // Lead-only overview: use a simple card until a dedicated LeadOverview is built
        return (
          <div style={{ maxWidth: 600 }}>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9375rem" }}>
              This contact is in the <strong>{client!.lifecycleStage.replace(/_/g, " ")}</strong> stage.
              Once they become an owner, the full overview will appear here.
            </p>
          </div>
        );

      case "properties":
        return <PropertiesTab properties={client!.properties} />;

      case "meetings":
        if (ownerData) return <MeetingsTab data={ownerData} />;
        return <TabPlaceholder label="Meetings" note="Available once onboarding begins." />;

      case "billing":
        // FinancialsTab takes ownerId which is the profile/member id
        if (ownerData?.primaryMember?.id) {
          return <FinancialsTab ownerId={ownerData.primaryMember.id} />;
        }
        return <TabPlaceholder label="Billing" note="Available once onboarding begins." />;

      case "settings":
        // SettingsTab fetches its own data internally via the entityId.
        // Pass through entityId if available.
        if (ownerData) return <SettingsTab />;
        return <TabPlaceholder label="Settings" note="Available once onboarding begins." />;

      case "intelligence":
        return <TabPlaceholder label="Intelligence" note="AI relationship insights — coming soon." />;

      case "messaging":
        return <TabPlaceholder label="Messaging" note="Direct messaging — coming soon." />;

      case "documents":
        return <TabPlaceholder label="Documents" note="Document management — coming soon." />;

      default:
        return <TabPlaceholder label="Not found" note="This tab does not exist." />;
    }
  }

  return (
    <ClientDetailShell client={client}>
      {renderTab()}
    </ClientDetailShell>
  );
}
```

**Note on SettingsTab:** The existing SettingsTab component in the owner hub likely reads `entityId` from the URL params via the parent page. Check if it does — if so, it will not work in the new route without modification. In that case, replace it with a `<TabPlaceholder>` for Phase 1 and add SettingsTab migration to a follow-up task.

- [ ] **Step 4: Fix any import errors**

```bash
cd /Users/johanannunez/workspace/parcel && pnpm exec tsc --noEmit 2>&1 | head -40
```

Work through any type mismatches. Common issues:
- `OverviewTab` expecting `OwnerDetailData` shape that differs from what `fetchOwnerDetail` returns — verify the type name matches what that function returns.
- `MeetingsTab` taking different props — read its signature and adapt.
- `TabPlaceholder` taking different props — read its signature.

- [ ] **Step 5: Verify the full flow**

```bash
open http://localhost:4000/admin/clients
```

1. Click any client in the list.
2. Confirm you land on `/admin/clients/[id]?tab=overview`.
3. Confirm the header shows name, company, email/phone, stage pill, Edit button.
4. Click Edit — confirm the drawer slides in.
5. Change a field and save — confirm the page revalidates.
6. Click each tab — confirm no crashes.
7. Click Properties tab — confirm grid view shows if the client has properties.
8. Toggle to table view — confirm table renders.

- [ ] **Step 6: Commit**

```bash
git -C /Users/johanannunez/workspace/parcel add apps/web/src/app/\(admin\)/admin/clients/
git -C /Users/johanannunez/workspace/parcel commit -m "feat: wire Clients detail page with full tab router and shell"
```

---

## Post-Phase-1 Checklist

Before calling Phase 1 done:

- [ ] `pnpm exec tsc --noEmit` passes with zero errors
- [ ] `pnpm build` succeeds (run in `apps/web/`)
- [ ] Nav shows "Clients", no "Leads" or "Owners"
- [ ] `/admin/clients` list loads with 5 stage tabs (no duplicate Archived)
- [ ] Clicking any client opens `/admin/clients/[id]?tab=overview`
- [ ] Header: avatar/initials, name, company, email, phone, stage pill, Edit button all render
- [ ] Edit drawer: slides in, saves, closes, page reflects changes
- [ ] Properties tab: grid/table toggle works, cards link to property detail
- [ ] Tabs with no Phase 1 content show TabPlaceholder (not crashes)
- [ ] Existing `/admin/contacts/` and `/admin/owners/` routes still work (no regressions)
