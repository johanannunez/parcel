# Unified Clients Hub — Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire all six remaining tabs in the Clients Hub — Meetings, Settings, Intelligence, Billing, Documents, and Messaging — with full, correct data flows and production-quality UI for each.

**Architecture:** Each tab gets its own dedicated data-fetch function in `lib/admin/`, its own component in `clients/[id]/`, and is wired into the existing `clients/[id]/page.tsx` server component. The page already fetches `client: ClientDetail` and `ownerData: OwnerDetailData | null` — new tab data is fetched in parallel in the page. Phase 1 shell, list, PropertiesTab, stage pill, and edit drawer are complete and untouched.

**Tech Stack:** Next.js 16 App Router, Supabase, TypeScript strict, CSS Modules, Phosphor Icons (`@phosphor-icons/react`), Anthropic API via OpenRouter (`anthropic/claude-haiku-4-5`), Stripe SDK, BoldSign REST API

---

## Codebase Context (read before writing any task)

- `apps/web/src/app/(admin)/admin/clients/[id]/page.tsx` — the server page that dispatches tabs. Modify this in every task.
- `apps/web/src/lib/admin/client-detail.ts` — `ClientDetail` type. `client.profileId` is the `profiles.id` used as FK in `owner_meetings.owner_id`, `invoices.owner_id`, `signed_documents.user_id`, `stripe_customers.profile_id`.
- `apps/web/src/lib/admin/owner-detail.ts` — `fetchOwnerDetail(entityId)` returns `OwnerDetailData` with `data.primaryMember.id` (same as `profileId`), `data.primaryMember.fullName`, `data.primaryMember.email`, `data.properties`, `data.contactId`.
- `apps/web/src/lib/admin/ai-insights.ts` — `fetchInsightsByParent(parentType, parentIds)` returns `Record<string, Insight[]>`.
- `apps/web/src/lib/stripe.ts` — `listInvoicesForOwner(ownerId)` where `ownerId` is `profiles.id`. `isStripeConfigured()`. `InvoiceRow` type.
- `apps/web/src/lib/signing/boldsign.ts` — `createDocumentFromTemplate(opts)`. `BOLDSIGN_API_KEY` env var.
- `apps/web/src/app/(admin)/admin/owners/[entityId]/MeetingsTab.tsx` — `MeetingsTabProps = { ownerId: string; ownerFirstName: string; ownerEmail: string; meetings: Meeting[]; properties: Property[] }`. The `Meeting` and `Property` types are defined locally inside this file.
- `apps/web/src/app/(admin)/admin/owners/[entityId]/SettingsTab.tsx` — `SettingsTabProps = { data: OwnerDetailData; activeSection: SettingsSection; profileExtras; internalNote; sessions; connections; entityDetail }`. `switchSection` hardcodes `/admin/owners/${entity.id}` — must add `basePath` prop.
- `owner_meetings` table: `owner_id` references `profiles.id`.
- `invoices` table: `owner_id` references `profiles.id`. Columns: `amount_cents`, `status` (draft|open|paid|uncollectible|void), `due_at`, `paid_at`, `hosted_invoice_url`, `kind` (onboarding_fee|tech_fee|adhoc).
- `payouts` table: `property_id` FK. Columns: `net_payout`, `gross_revenue`, `fees`, `period_start`, `period_end`, `paid_at`.
- `signed_documents` table: `user_id` references `profiles.id`. Columns: `boldsign_document_id`, `template_name`, `status`, `signed_at`, `signed_pdf_url`, `property_id`.
- `stripe_customers` table: `profile_id` references `profiles.id`. Column: `stripe_customer_id`.
- No `client_messages` table yet — Task 7 creates it.
- No `management_fee_percent` on contacts yet — Task 5 adds it via migration.
- CSS pattern: all rgba/shadows use `color-mix(in srgb, var(--token) N%, transparent)`. Never hardcode `rgba()`. Amber exceptions only when no token exists.
- Icon import pattern: `import { IconName } from "@phosphor-icons/react/dist/ssr"` for server components, `from "@phosphor-icons/react"` for client components.

---

## File Map

**Create:**
- `apps/web/src/lib/admin/client-meetings.ts` — `fetchClientMeetings(profileId)`
- `apps/web/src/lib/admin/client-intelligence.ts` — `generateClientIntelligence(contactId)`, `fetchClientInsights(contactId)`
- `apps/web/src/lib/admin/client-billing.ts` — `fetchClientBilling(profileId, propertyIds)`
- `apps/web/src/lib/admin/client-documents.ts` — `fetchClientDocuments(profileId)`
- `apps/web/src/lib/admin/client-messages.ts` — `fetchClientMessages(contactId)`
- `apps/web/src/app/(admin)/admin/clients/[id]/IntelligenceTab.tsx`
- `apps/web/src/app/(admin)/admin/clients/[id]/IntelligenceTab.module.css`
- `apps/web/src/app/(admin)/admin/clients/[id]/client-intelligence-actions.ts`
- `apps/web/src/app/(admin)/admin/clients/[id]/BillingTab.tsx`
- `apps/web/src/app/(admin)/admin/clients/[id]/BillingTab.module.css`
- `apps/web/src/app/(admin)/admin/clients/[id]/DocumentsTab.tsx`
- `apps/web/src/app/(admin)/admin/clients/[id]/DocumentsTab.module.css`
- `apps/web/src/app/(admin)/admin/clients/[id]/MessagingTab.tsx`
- `apps/web/src/app/(admin)/admin/clients/[id]/MessagingTab.module.css`
- `apps/web/src/app/(admin)/admin/clients/[id]/messaging-actions.ts`
- `apps/web/supabase/migrations/20260424_client_messages.sql`

**Modify:**
- `apps/web/src/app/(admin)/admin/owners/[entityId]/SettingsTab.tsx` — add `basePath` prop to `SettingsTabProps` and `switchSection`
- `apps/web/src/app/(admin)/admin/clients/[id]/page.tsx` — wire all 6 tabs (replace every TabPlaceholder for meetings, settings, intelligence, billing, documents, messaging)
- `apps/web/src/lib/stripe.ts` — add `fetchPaymentMethod(profileId)` and export `StripePaymentMethod` type

---

## Task 1: Meetings Tab — fetchClientMeetings + Wire

**Files:**
- Create: `apps/web/src/lib/admin/client-meetings.ts`
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/page.tsx`

- [ ] **Step 1: Understand the existing MeetingsTab props**

```bash
head -80 apps/web/src/app/\(admin\)/admin/owners/\[entityId\]/MeetingsTab.tsx
```

Verify that `MeetingsTabProps` matches:
```typescript
{ ownerId: string; ownerFirstName: string; ownerEmail: string; meetings: Meeting[]; properties: Property[] }
```
where `Meeting` has `id, title, scheduled_at, duration_minutes, meet_link, status, transcript, ai_summary, action_items, notes, visibility, property_id, propertyLabel, created_at` and `Property` has `id, label`.

- [ ] **Step 2: Create fetchClientMeetings**

```typescript
// apps/web/src/lib/admin/client-meetings.ts
import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ClientMeeting = {
  id: string;
  title: string;
  scheduled_at: string | null;
  duration_minutes: number | null;
  meet_link: string | null;
  status: string;
  transcript: string | null;
  ai_summary: string | null;
  action_items: Array<{ id: string; text: string; completed: boolean; assignedTo: string | null }>;
  notes: string | null;
  visibility: string;
  property_id: string | null;
  propertyLabel: string | null;
  created_at: string;
};

export async function fetchClientMeetings(profileId: string): Promise<ClientMeeting[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("owner_meetings")
    .select(`
      id, title, scheduled_at, duration_minutes, meet_link,
      status, transcript, ai_summary, action_items, notes, visibility,
      property_id, created_at,
      property:properties(address_line_1, city, state)
    `)
    .eq("owner_id", profileId)
    .order("scheduled_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("[client-meetings] fetch error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const prop = row.property as { address_line_1: string | null; city: string | null; state: string | null } | null;
    const propertyLabel = prop
      ? [prop.address_line_1, prop.city, prop.state].filter(Boolean).join(", ")
      : null;
    const rawItems = Array.isArray(row.action_items) ? row.action_items : [];
    return {
      id: row.id,
      title: row.title,
      scheduled_at: row.scheduled_at,
      duration_minutes: row.duration_minutes,
      meet_link: row.meet_link,
      status: row.status,
      transcript: row.transcript,
      ai_summary: row.ai_summary,
      action_items: rawItems.map((item: Record<string, unknown>) => ({
        id: String(item.id ?? ""),
        text: String(item.text ?? ""),
        completed: Boolean(item.completed),
        assignedTo: item.assignedTo != null ? String(item.assignedTo) : null,
      })),
      notes: row.notes,
      visibility: row.visibility,
      property_id: row.property_id,
      propertyLabel,
      created_at: row.created_at,
    };
  });
}
```

- [ ] **Step 3: Wire MeetingsTab in the clients page**

Read the current `apps/web/src/app/(admin)/admin/clients/[id]/page.tsx` in full, then make these changes:

Add imports at the top:
```typescript
import { MeetingsTab } from "@/app/(admin)/admin/owners/[entityId]/MeetingsTab";
import { fetchClientMeetings } from "@/lib/admin/client-meetings";
```

In `ClientDetailPage`, fetch meetings in parallel with other data:
```typescript
const [client, meetings] = await Promise.all([
  fetchClientDetail(id),
  // Will be filtered below — fetch only when profileId exists
  Promise.resolve([] as Awaited<ReturnType<typeof fetchClientMeetings>>),
]);
if (!client) notFound();

const ownerData = client.entityId ? await fetchOwnerDetail(client.entityId) : null;
// Fetch meetings only when the client has a linked profile (owner_meetings.owner_id = profiles.id)
const clientMeetings = client.profileId
  ? await fetchClientMeetings(client.profileId)
  : [];
```

Replace the `meetings` case in `renderTab()`:
```typescript
case "meetings":
  if (!client.profileId) {
    return (
      <TabPlaceholder
        title="Meetings"
        body="Available once the client begins onboarding."
      />
    );
  }
  return (
    <MeetingsTab
      ownerId={client.profileId}
      ownerFirstName={client.fullName.split(" ")[0] ?? client.fullName}
      ownerEmail={client.email ?? ""}
      meetings={clientMeetings}
      properties={client.properties.map((p) => ({
        id: p.id,
        label: [p.addressLine1, p.city, p.state].filter(Boolean).join(", ") || p.id,
      }))}
    />
  );
```

- [ ] **Step 4: Verify meetings-actions.ts uses ownerId correctly**

```bash
head -40 apps/web/src/app/\(admin\)/admin/owners/\[entityId\]/meetings-actions.ts
```

Confirm that `createOwnerMeeting(ownerId, ...)` uses `ownerId` as `owner_id` when inserting into `owner_meetings`. If so, MeetingsTab will create/edit/delete meetings using `client.profileId` correctly — no changes needed to meetings-actions.ts.

- [ ] **Step 5: Test the meetings tab**

Navigate to `http://localhost:4000/admin/clients/[id-of-owner-with-meetings]?tab=meetings`.
- For a contact with `profileId`, the MeetingsTab should render (empty state or meetings list).
- For a contact without `profileId`, the TabPlaceholder should render.
- Creating a meeting should persist — verify in Supabase that `owner_meetings.owner_id = client.profileId`.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/admin/client-meetings.ts apps/web/src/app/\(admin\)/admin/clients/\[id\]/page.tsx
git commit -m "feat: wire MeetingsTab in clients hub via fetchClientMeetings"
```

---

## Task 2: Settings Tab — Add basePath Prop + Wire

**Files:**
- Modify: `apps/web/src/app/(admin)/admin/owners/[entityId]/SettingsTab.tsx`
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/page.tsx`

- [ ] **Step 1: Read SettingsTab to understand switchSection**

```bash
sed -n '72,130p' apps/web/src/app/\(admin\)/admin/owners/\[entityId\]/SettingsTab.tsx
```

Confirm `switchSection` does:
```typescript
router.replace(`/admin/owners/${entity.id}?${params.toString()}`, { scroll: false });
```

- [ ] **Step 2: Add basePath prop to SettingsTabProps**

In `apps/web/src/app/(admin)/admin/owners/[entityId]/SettingsTab.tsx`, modify the `SettingsTabProps` type:

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
  /** Override the base path used in section navigation links. Defaults to /admin/owners/[entityId]. */
  basePath?: string;
};
```

Modify `SettingsTab` to accept and use `basePath`:
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
}: SettingsTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { primaryMember, entity } = data;
  const resolvedBasePath = basePath ?? `/admin/owners/${entity.id}`;

  function switchSection(next: SettingsSection) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("tab", "settings");
    params.set("section", next);
    router.replace(`${resolvedBasePath}?${params.toString()}`, { scroll: false });
  }
  // ... rest of component unchanged
```

- [ ] **Step 3: Verify the owners page still passes no basePath**

```bash
grep -n "SettingsTab" apps/web/src/app/\(admin\)/admin/owners/\[entityId\]/page.tsx
```

The owners page does NOT pass `basePath`, so it uses the default `/admin/owners/${entity.id}` — no change needed there.

- [ ] **Step 4: Fetch settings data in clients page**

In `apps/web/src/app/(admin)/admin/clients/[id]/page.tsx`, add the same conditional data fetches the owners page does for settings. Add these imports:

```typescript
import { createClient } from "@/lib/supabase/server";
import { fetchInternalNote } from "@/lib/admin/owner-facts-actions";
import { SETTINGS_SECTIONS, type SettingsSection } from "@/app/(admin)/admin/owners/[entityId]/settings-sections";
import { SettingsTab } from "@/app/(admin)/admin/owners/[entityId]/SettingsTab";
import type { SessionRow } from "@/app/(admin)/admin/owners/[entityId]/settings/AccountSecuritySection";
import type { ConnectionRow } from "@/app/(admin)/admin/owners/[entityId]/settings/DataPrivacySection";
```

In `ClientDetailPage`, add the section param and settings data fetch:

```typescript
export default async function ClientDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab: tabParam, section: sectionParam } = await searchParams;

  const tab: TabKey = (KNOWN_TABS as readonly string[]).includes(tabParam ?? "")
    ? (tabParam as TabKey)
    : "overview";

  const section: SettingsSection = (SETTINGS_SECTIONS as readonly string[]).includes(
    sectionParam ?? ""
  )
    ? (sectionParam as SettingsSection)
    : "personal";

  const CONTACT_METHODS = ["email", "sms", "phone", "whatsapp"] as const;
  type StoredContactMethod = "email" | "sms" | "phone" | "whatsapp" | null;

  const client = await fetchClientDetail(id);
  if (!client) notFound();

  const ownerData = client.entityId ? await fetchOwnerDetail(client.entityId) : null;
  const clientMeetings = client.profileId && tab === "meetings"
    ? await fetchClientMeetings(client.profileId)
    : [];

  let profileExtras: { preferredName: string | null; contactMethod: StoredContactMethod; timezone: string | null } =
    { preferredName: null, contactMethod: null, timezone: null };
  let internalNote: { text: string; updatedAt: string; createdByName: string | null } | null = null;
  let sessions: SessionRow[] = [];
  let connections: ConnectionRow[] = [];
  let entityDetail: { id: string; name: string; type: string | null; ein: string | null; notes: string | null } | null = null;

  if (tab === "settings" && ownerData) {
    const supabase = await createClient();
    const profileId = ownerData.primaryMember.id;

    const [{ data: extras }, fetchedNote, { data: rawSessions }, { data: rawConnections }] =
      await Promise.all([
        supabase.from("profiles").select("preferred_name, contact_method, timezone").eq("id", profileId).maybeSingle(),
        fetchInternalNote(profileId),
        supabase.from("session_log").select("id, logged_in_at, device_type, browser, os, city, country").eq("profile_id", profileId).order("logged_in_at", { ascending: false }).limit(10),
        supabase.from("oauth_connections").select("id, provider, connected_at").eq("profile_id", profileId),
      ]);

    const rawContact = extras?.contact_method ?? null;
    profileExtras = {
      preferredName: extras?.preferred_name ?? null,
      contactMethod: rawContact && (CONTACT_METHODS as readonly string[]).includes(rawContact)
        ? (rawContact as StoredContactMethod)
        : null,
      timezone: extras?.timezone ?? null,
    };
    internalNote = fetchedNote;
    sessions = (rawSessions ?? []) as SessionRow[];
    connections = (rawConnections ?? []) as ConnectionRow[];

    if (ownerData.entity) {
      const { data: entityRow } = await supabase
        .from("entities")
        .select("id, name, type, ein, notes")
        .eq("id", ownerData.entity.id)
        .maybeSingle();
      entityDetail = entityRow ?? null;
    }
  }
  // ... rest of function
```

- [ ] **Step 5: Wire SettingsTab in renderTab()**

Replace the `settings` case:
```typescript
case "settings":
  if (!ownerData) {
    return (
      <TabPlaceholder
        title="Settings"
        body="Settings are available once the client completes onboarding."
      />
    );
  }
  return (
    <SettingsTab
      data={ownerData}
      activeSection={section}
      profileExtras={profileExtras}
      internalNote={internalNote}
      sessions={sessions}
      connections={connections}
      entityDetail={entityDetail}
      basePath={`/admin/clients/${client.id}`}
    />
  );
```

- [ ] **Step 6: Test settings tab**

Navigate to `http://localhost:4000/admin/clients/[id-of-active-owner]?tab=settings`.
- All 10 sections should render in the sidebar.
- Clicking a section should navigate to `?tab=settings&section=X` on the clients route, NOT the owners route.
- Verify the URL stays `/admin/clients/[id]` when switching sections.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/\(admin\)/admin/owners/\[entityId\]/SettingsTab.tsx \
        apps/web/src/app/\(admin\)/admin/clients/\[id\]/page.tsx
git commit -m "feat: wire SettingsTab in clients hub with basePath override"
```

---

## Task 3: Intelligence Tab — Fetch Existing Insights + Display Component

**Files:**
- Create: `apps/web/src/app/(admin)/admin/clients/[id]/IntelligenceTab.tsx`
- Create: `apps/web/src/app/(admin)/admin/clients/[id]/IntelligenceTab.module.css`
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/page.tsx`

This task builds the display shell. Task 4 adds the AI generation.

- [ ] **Step 1: Check what agent keys the generation will use**

The generation (Task 4) will write to `ai_insights` with:
- `parent_type = 'contact'`
- `parent_id = contactId`
- `agent_key` values: `client_intelligence:relationship_summary`, `client_intelligence:risk_signals`, `client_intelligence:sentiment`, `client_intelligence:recommendations`, `client_intelligence:conversation_themes`

The display component reads all insights where `parent_type = 'contact'` and `parent_id = contactId`, then groups by `agent_key`.

- [ ] **Step 2: Create IntelligenceTab.tsx**

```typescript
// apps/web/src/app/(admin)/admin/clients/[id]/IntelligenceTab.tsx
"use client";

import { useTransition } from "react";
import {
  Brain,
  Warning,
  Smiley,
  LightbulbFilament,
  ChatCircleText,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import { regenerateClientIntelligence } from "./client-intelligence-actions";
import type { Insight } from "@/lib/admin/ai-insights";
import styles from "./IntelligenceTab.module.css";

type Props = {
  contactId: string;
  insights: Insight[];
  generatedAt: string | null;
};

const SECTION_META: Record<string, { label: string; icon: React.ElementType; description: string }> = {
  "client_intelligence:relationship_summary": {
    label: "Relationship summary",
    icon: Brain,
    description: "Where the relationship stands and communication patterns.",
  },
  "client_intelligence:risk_signals": {
    label: "Risk signals",
    icon: Warning,
    description: "Flags that may indicate churn risk or relationship strain.",
  },
  "client_intelligence:sentiment": {
    label: "Owner sentiment",
    icon: Smiley,
    description: "Current sentiment based on recent interactions.",
  },
  "client_intelligence:recommendations": {
    label: "Recommended actions",
    icon: LightbulbFilament,
    description: "Specific next steps for this relationship.",
  },
  "client_intelligence:conversation_themes": {
    label: "Conversation themes",
    icon: ChatCircleText,
    description: "Recurring topics across meetings and messages.",
  },
};

const SECTION_ORDER = [
  "client_intelligence:relationship_summary",
  "client_intelligence:risk_signals",
  "client_intelligence:sentiment",
  "client_intelligence:recommendations",
  "client_intelligence:conversation_themes",
];

const SEVERITY_CLASS: Record<string, string> = {
  info: styles.severityInfo,
  recommendation: styles.severityRecommendation,
  warning: styles.severityWarning,
  success: styles.severitySuccess,
};

export function IntelligenceTab({ contactId, insights, generatedAt }: Props) {
  const [isPending, startTransition] = useTransition();

  const byKey = new Map<string, Insight[]>();
  for (const insight of insights) {
    const list = byKey.get(insight.agentKey) ?? [];
    list.push(insight);
    byKey.set(insight.agentKey, list);
  }

  function handleRefresh() {
    startTransition(async () => {
      await regenerateClientIntelligence(contactId);
    });
  }

  const hasInsights = insights.length > 0;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>Relationship Intelligence</h2>
          {generatedAt ? (
            <p className={styles.timestamp}>
              Last generated{" "}
              {new Date(generatedAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          ) : (
            <p className={styles.timestamp}>Not yet generated</p>
          )}
        </div>
        <button
          className={styles.refreshBtn}
          onClick={handleRefresh}
          disabled={isPending}
          aria-label="Regenerate intelligence"
        >
          <ArrowsClockwise size={15} className={isPending ? styles.spinning : undefined} />
          {isPending ? "Generating…" : "Refresh"}
        </button>
      </div>

      {!hasInsights ? (
        <div className={styles.emptyState}>
          <Brain size={32} weight="duotone" className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>No intelligence yet</p>
          <p className={styles.emptyBody}>
            Click Refresh to generate AI insights for this relationship.
            Parcel analyzes communication events, meetings, and contact history.
          </p>
        </div>
      ) : (
        <div className={styles.sections}>
          {SECTION_ORDER.map((key) => {
            const meta = SECTION_META[key];
            if (!meta) return null;
            const sectionInsights = byKey.get(key) ?? [];
            if (sectionInsights.length === 0) return null;
            const Icon = meta.icon;

            return (
              <div key={key} className={styles.section}>
                <div className={styles.sectionHeader}>
                  <Icon size={16} weight="duotone" className={styles.sectionIcon} />
                  <h3 className={styles.sectionTitle}>{meta.label}</h3>
                </div>
                {sectionInsights.map((insight) => (
                  <div
                    key={insight.id}
                    className={`${styles.insightCard} ${SEVERITY_CLASS[insight.severity] ?? ""}`}
                  >
                    <p className={styles.insightTitle}>{insight.title}</p>
                    <p className={styles.insightBody}>{insight.body}</p>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create IntelligenceTab.module.css**

```css
/* apps/web/src/app/(admin)/admin/clients/[id]/IntelligenceTab.module.css */
.root {
  padding: 24px;
  max-width: 720px;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;
}

.headerLeft { display: flex; flex-direction: column; gap: 4px; }

.title {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.timestamp {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin: 0;
}

.refreshBtn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  cursor: pointer;
  white-space: nowrap;
  transition: background 120ms ease, border-color 120ms ease;
  flex-shrink: 0;
}
.refreshBtn:hover:not(:disabled) { background: var(--color-bg-hover); }
.refreshBtn:disabled { opacity: 0.5; cursor: not-allowed; }

@keyframes spin { to { transform: rotate(360deg); } }
.spinning { animation: spin 600ms linear infinite; }

.emptyState {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 64px 24px;
  text-align: center;
}

.emptyIcon { color: var(--color-text-muted); opacity: 0.5; }

.emptyTitle {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.emptyBody {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  max-width: 400px;
  margin: 0;
  line-height: 1.6;
}

.sections { display: flex; flex-direction: column; gap: 24px; }

.section { display: flex; flex-direction: column; gap: 10px; }

.sectionHeader {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.sectionIcon { color: var(--color-brand); }

.sectionTitle {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0;
}

.insightCard {
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.insightTitle {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.insightBody {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.55;
}

.severityWarning { border-left: 3px solid #b45309; }
.severityInfo { border-left: 3px solid var(--color-brand); }
.severityRecommendation { border-left: 3px solid #6366f1; }
.severitySuccess { border-left: 3px solid #059669; }
```

- [ ] **Step 4: Add IntelligenceTab to the clients page**

Add imports:
```typescript
import { IntelligenceTab } from "./IntelligenceTab";
import { fetchInsightsByParent } from "@/lib/admin/ai-insights";
```

In `ClientDetailPage`, fetch insights:
```typescript
const contactInsights = tab === "intelligence"
  ? await fetchInsightsByParent("contact", [id])
  : {};
const insightList = contactInsights[id] ?? [];
const generatedAt = insightList[0]?.createdAt ?? null;
```

Replace the `intelligence` case in `renderTab()`:
```typescript
case "intelligence":
  return (
    <IntelligenceTab
      contactId={id}
      insights={insightList}
      generatedAt={generatedAt}
    />
  );
```

- [ ] **Step 5: Test display (without generation)**

Navigate to `?tab=intelligence`. The empty state should show with the Brain icon and "Not yet generated" text. The Refresh button should render (it will fail until Task 4 creates the action — that's expected).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/\(admin\)/admin/clients/\[id\]/IntelligenceTab.tsx \
        apps/web/src/app/\(admin\)/admin/clients/\[id\]/IntelligenceTab.module.css \
        apps/web/src/app/\(admin\)/admin/clients/\[id\]/page.tsx
git commit -m "feat: add IntelligenceTab display shell for client hub"
```

---

## Task 4: Intelligence Generation — Anthropic API + Refresh Action

**Files:**
- Create: `apps/web/src/lib/admin/client-intelligence.ts`
- Create: `apps/web/src/app/(admin)/admin/clients/[id]/client-intelligence-actions.ts`

- [ ] **Step 1: Read guest-intelligence.ts for the AI call pattern**

```bash
sed -n '1,60p' apps/web/src/lib/admin/guest-intelligence.ts
```

Confirm:
- `OPENROUTER_MODEL = 'anthropic/claude-haiku-4-5'`
- `OPENROUTER_API_KEY` env var used via `fetch` to `https://openrouter.ai/api/v1/chat/completions`
- Response parsed as JSON, then each insight upserted into `ai_insights` via `supabase.from('ai_insights').upsert(rows, { onConflict: 'parent_type,parent_id,agent_key' })`

```bash
grep -n "OPENROUTER\|openrouter\|fetch.*chat" apps/web/src/lib/admin/guest-intelligence.ts | head -10
```

Capture the exact fetch call pattern and env var name.

- [ ] **Step 2: Create client-intelligence.ts**

```typescript
// apps/web/src/lib/admin/client-intelligence.ts
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const OPENROUTER_MODEL = "anthropic/claude-haiku-4-5";

const SYSTEM_PROMPT = `You are a property management CRM assistant analyzing a client relationship for Johan, a short-term rental property manager. You will receive context about a client — their contact history, meetings, and communications — and return a structured JSON analysis.

Return ONLY valid JSON matching this exact schema:
{
  "relationship_summary": {
    "title": "string (max 80 chars)",
    "body": "string (3-5 sentences synthesizing the relationship health, communication pattern, and trajectory)"
  },
  "risk_signals": [
    { "title": "string (max 60 chars)", "body": "string (1-2 sentences explaining the signal)", "severity": "info" | "recommendation" | "warning" }
  ],
  "sentiment": {
    "title": "string — one of: Happy, Neutral, Mildly Concerned, At Risk",
    "body": "string (2-3 sentences explaining the sentiment reading)"
  },
  "recommendations": [
    { "title": "string (max 60 chars)", "body": "string (1-2 sentences — specific, actionable)" }
  ],
  "conversation_themes": [
    { "title": "string (max 60 chars)", "body": "string (1 sentence describing the recurring theme)" }
  ]
}

risk_signals: 0-4 items. Only flag real signals. Flag: no recent contact (>14 days), overdue invoices, mentions of leaving/selling, lack of engagement.
recommendations: exactly 2-3 items. Specific to this client — not generic advice.
conversation_themes: 0-5 items. Topics that appear in 2+ interactions.

If data is sparse, return what you can confidently derive. Do not invent signals.`;

type IntelligenceResult = {
  relationship_summary: { title: string; body: string };
  risk_signals: Array<{ title: string; body: string; severity: "info" | "recommendation" | "warning" }>;
  sentiment: { title: string; body: string };
  recommendations: Array<{ title: string; body: string }>;
  conversation_themes: Array<{ title: string; body: string }>;
};

async function callClaude(userPrompt: string): Promise<IntelligenceResult | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("[client-intelligence] OPENROUTER_API_KEY not set");
    return null;
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    console.error("[client-intelligence] Claude call failed:", await res.text());
    return null;
  }

  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  const raw = data.choices[0]?.message?.content ?? "";
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned) as IntelligenceResult;
  } catch {
    console.error("[client-intelligence] JSON parse failed:", raw.slice(0, 200));
    return null;
  }
}

function buildPrompt(context: {
  contactName: string;
  lifecycleStage: string;
  daysSinceCreated: number;
  daysSinceLastActivity: number | null;
  estimatedMrr: number | null;
  source: string | null;
  meetings: Array<{ title: string; scheduledAt: string | null; notes: string | null; aiSummary: string | null }>;
  communications: Array<{ channel: string; direction: string; summary: string | null; createdAt: string }>;
}): string {
  const parts: string[] = [`Client: ${context.contactName}`, `Stage: ${context.lifecycleStage.replace(/_/g, " ")}`, `Days as contact: ${context.daysSinceCreated}`];
  if (context.daysSinceLastActivity != null) parts.push(`Days since last activity: ${context.daysSinceLastActivity}`);
  if (context.estimatedMrr != null) parts.push(`Estimated MRR: $${context.estimatedMrr}`);
  if (context.source) parts.push(`Source: ${context.source}`);

  if (context.meetings.length > 0) {
    parts.push("\nMeetings:");
    for (const m of context.meetings) {
      parts.push(`- ${m.title} (${m.scheduledAt ? new Date(m.scheduledAt).toLocaleDateString() : "no date"})`);
      if (m.aiSummary) parts.push(`  Summary: ${m.aiSummary}`);
      if (m.notes) parts.push(`  Notes: ${m.notes.slice(0, 200)}`);
    }
  } else {
    parts.push("\nMeetings: none");
  }

  if (context.communications.length > 0) {
    parts.push("\nCommunication events:");
    for (const c of context.communications.slice(0, 20)) {
      parts.push(`- [${c.channel}/${c.direction}] ${new Date(c.createdAt).toLocaleDateString()}: ${c.summary ?? "(no summary)"}`);
    }
  } else {
    parts.push("\nCommunication events: none");
  }

  return parts.join("\n");
}

export async function generateClientIntelligence(contactId: string): Promise<void> {
  const supabase = await createClient();
  const serviceClient = await createServiceClient();

  const [{ data: contact }, { data: meetings }, { data: communications }] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, full_name, lifecycle_stage, estimated_mrr, source, last_activity_at, created_at, profile_id")
      .eq("id", contactId)
      .maybeSingle(),
    supabase
      .from("owner_meetings")
      .select("title, scheduled_at, notes, ai_summary")
      .eq("owner_id", (await supabase.from("contacts").select("profile_id").eq("id", contactId).maybeSingle()).data?.profile_id ?? "")
      .order("scheduled_at", { ascending: false })
      .limit(10),
    supabase
      .from("communication_events")
      .select("channel, direction, claude_summary, quo_summary, created_at")
      .eq("entity_id", contactId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (!contact) {
    console.error("[client-intelligence] contact not found:", contactId);
    return;
  }

  const now = new Date();
  const daysSinceCreated = Math.floor((now.getTime() - new Date(contact.created_at).getTime()) / 86400000);
  const daysSinceLastActivity = contact.last_activity_at
    ? Math.floor((now.getTime() - new Date(contact.last_activity_at).getTime()) / 86400000)
    : null;

  const prompt = buildPrompt({
    contactName: contact.full_name,
    lifecycleStage: contact.lifecycle_stage,
    daysSinceCreated,
    daysSinceLastActivity,
    estimatedMrr: contact.estimated_mrr,
    source: contact.source,
    meetings: (meetings ?? []).map((m) => ({
      title: m.title,
      scheduledAt: m.scheduled_at,
      notes: m.notes,
      aiSummary: m.ai_summary,
    })),
    communications: (communications ?? []).map((c) => ({
      channel: c.channel,
      direction: c.direction,
      summary: c.claude_summary ?? c.quo_summary,
      createdAt: c.created_at,
    })),
  });

  const result = await callClaude(prompt);
  if (!result) return;

  const now8601 = now.toISOString();

  type InsightRow = {
    parent_type: string;
    parent_id: string;
    agent_key: string;
    severity: "info" | "recommendation" | "warning" | "success";
    title: string;
    body: string;
    action_label: null;
    action_payload: null;
    created_at: string;
  };

  const rows: InsightRow[] = [];

  rows.push({
    parent_type: "contact",
    parent_id: contactId,
    agent_key: "client_intelligence:relationship_summary",
    severity: "info",
    title: result.relationship_summary.title,
    body: result.relationship_summary.body,
    action_label: null,
    action_payload: null,
    created_at: now8601,
  });

  rows.push({
    parent_type: "contact",
    parent_id: contactId,
    agent_key: "client_intelligence:sentiment",
    severity: "info",
    title: result.sentiment.title,
    body: result.sentiment.body,
    action_label: null,
    action_payload: null,
    created_at: now8601,
  });

  for (const signal of result.risk_signals) {
    rows.push({
      parent_type: "contact",
      parent_id: contactId,
      agent_key: "client_intelligence:risk_signals",
      severity: signal.severity === "warning" ? "warning" : signal.severity === "recommendation" ? "recommendation" : "info",
      title: signal.title,
      body: signal.body,
      action_label: null,
      action_payload: null,
      created_at: now8601,
    });
  }

  for (const rec of result.recommendations) {
    rows.push({
      parent_type: "contact",
      parent_id: contactId,
      agent_key: "client_intelligence:recommendations",
      severity: "recommendation",
      title: rec.title,
      body: rec.body,
      action_label: null,
      action_payload: null,
      created_at: now8601,
    });
  }

  for (const theme of result.conversation_themes) {
    rows.push({
      parent_type: "contact",
      parent_id: contactId,
      agent_key: "client_intelligence:conversation_themes",
      severity: "info",
      title: theme.title,
      body: theme.body,
      action_label: null,
      action_payload: null,
      created_at: now8601,
    });
  }

  if (rows.length === 0) return;

  // Delete old insights for this contact before inserting fresh ones.
  // The unique constraint on (parent_type, parent_id, agent_key) would conflict
  // because risk_signals/recommendations/themes can have multiple rows per key.
  await serviceClient
    .from("ai_insights")
    .delete()
    .eq("parent_type", "contact")
    .eq("parent_id", contactId)
    .like("agent_key", "client_intelligence:%");

  const { error } = await serviceClient.from("ai_insights").insert(rows);
  if (error) {
    console.error("[client-intelligence] insert error:", error.message);
  }
}
```

- [ ] **Step 3: Create client-intelligence-actions.ts**

```typescript
// apps/web/src/app/(admin)/admin/clients/[id]/client-intelligence-actions.ts
"use server";
import { revalidatePath } from "next/cache";
import { generateClientIntelligence } from "@/lib/admin/client-intelligence";

export async function regenerateClientIntelligence(contactId: string): Promise<void> {
  await generateClientIntelligence(contactId);
  revalidatePath(`/admin/clients/${contactId}`);
}
```

- [ ] **Step 4: Test the full intelligence flow**

Navigate to `?tab=intelligence`. Click Refresh.
- Should spin for a few seconds, then reload with insights.
- Verify in Supabase: `SELECT * FROM ai_insights WHERE parent_type = 'contact' AND parent_id = '[contactId]';`
- Should see rows with agent_keys prefixed `client_intelligence:`.
- Clicking Refresh again should delete old rows and insert fresh ones.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/admin/client-intelligence.ts \
        apps/web/src/app/\(admin\)/admin/clients/\[id\]/client-intelligence-actions.ts
git commit -m "feat: add client intelligence generation with Anthropic via OpenRouter"
```

---

## Task 5: Billing Tab — Full Rebuild

**Files:**
- Create migration: `apps/web/supabase/migrations/20260424_contacts_management_fee.sql`
- Create: `apps/web/src/lib/admin/client-billing.ts`
- Create: `apps/web/src/app/(admin)/admin/clients/[id]/BillingTab.tsx`
- Create: `apps/web/src/app/(admin)/admin/clients/[id]/BillingTab.module.css`
- Modify: `apps/web/src/lib/stripe.ts`
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/page.tsx`

- [ ] **Step 1: Apply the management_fee_percent migration**

Using the Supabase MCP tool with project_id `pwoxwpryummqeqsxdgyc`:

```sql
-- 20260424_contacts_management_fee.sql
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS management_fee_percent NUMERIC(5,2) DEFAULT NULL;
```

Apply this migration. Verify: `SELECT column_name FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'management_fee_percent';`

- [ ] **Step 2: Add fetchPaymentMethod to stripe.ts**

Read `apps/web/src/lib/stripe.ts` in full. Add this function after `listInvoicesForOwner`:

```typescript
export type StripePaymentMethod = {
  id: string;
  type: "card" | "us_bank_account" | "other";
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  isExpiringSoon: boolean;
};

export async function fetchPaymentMethod(profileId: string): Promise<StripePaymentMethod | null> {
  if (!isStripeConfigured()) return null;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const supabase = (await createClient()) as any;
  const { data: customer } = await supabase
    .from("stripe_customers")
    .select("stripe_customer_id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!customer?.stripe_customer_id) return null;

  try {
    const paymentMethods = await stripe.customers.listPaymentMethods(customer.stripe_customer_id, { limit: 1 });
    const pm = paymentMethods.data[0];
    if (!pm) return null;

    const now = new Date();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    if (pm.type === "card" && pm.card) {
      const expYear = pm.card.exp_year;
      const expMonth = pm.card.exp_month;
      const expiryDate = new Date(expYear, expMonth - 1, 1);
      const isExpiringSoon = expiryDate.getTime() - now.getTime() < thirtyDaysMs;
      return {
        id: pm.id,
        type: "card",
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth,
        expYear,
        isExpiringSoon,
      };
    }

    if (pm.type === "us_bank_account" && pm.us_bank_account) {
      return {
        id: pm.id,
        type: "us_bank_account",
        brand: pm.us_bank_account.bank_name ?? null,
        last4: pm.us_bank_account.last4,
        expMonth: null,
        expYear: null,
        isExpiringSoon: false,
      };
    }

    return { id: pm.id, type: "other", brand: null, last4: null, expMonth: null, expYear: null, isExpiringSoon: false };
  } catch (err) {
    console.error("[stripe] fetchPaymentMethod error:", err);
    return null;
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
```

- [ ] **Step 3: Create client-billing.ts**

```typescript
// apps/web/src/lib/admin/client-billing.ts
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { listInvoicesForOwner, fetchPaymentMethod, type InvoiceRow, type StripePaymentMethod } from "@/lib/stripe";

export type ClientBilling = {
  totalCollectedCents: number;
  nextInvoice: { amountCents: number; dueAt: string } | null;
  invoices: InvoiceRow[];
  managementFeePercent: number | null;
  propertyCount: number;
  paymentMethod: StripePaymentMethod | null;
};

export async function fetchClientBilling(
  profileId: string,
  contactId: string,
  propertyCount: number,
): Promise<ClientBilling> {
  const supabase = await createClient();

  const [invoices, { data: contactRow }, paymentMethod] = await Promise.all([
    listInvoicesForOwner(profileId),
    supabase
      .from("contacts")
      .select("management_fee_percent")
      .eq("id", contactId)
      .maybeSingle(),
    fetchPaymentMethod(profileId),
  ]);

  const totalCollectedCents = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.amount_cents, 0);

  const openInvoices = invoices
    .filter((inv) => (inv.status === "open" || inv.status === "draft") && inv.due_at)
    .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime());
  const nextInvoice = openInvoices[0]
    ? { amountCents: openInvoices[0].amount_cents, dueAt: openInvoices[0].due_at! }
    : null;

  return {
    totalCollectedCents,
    nextInvoice,
    invoices,
    managementFeePercent: (contactRow?.management_fee_percent as number | null) ?? null,
    propertyCount,
    paymentMethod,
  };
}
```

- [ ] **Step 4: Create BillingTab.tsx**

```typescript
// apps/web/src/app/(admin)/admin/clients/[id]/BillingTab.tsx
import {
  CurrencyDollar,
  CalendarBlank,
  CreditCard,
  Bank,
  Warning,
  ArrowSquareOut,
  Buildings,
} from "@phosphor-icons/react/dist/ssr";
import type { ClientBilling } from "@/lib/admin/client-billing";
import styles from "./BillingTab.module.css";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  open: "Open",
  paid: "Paid",
  uncollectible: "Uncollectible",
  void: "Void",
};
const STATUS_CLASS: Record<string, string> = {
  draft: styles.pillDraft,
  open: styles.pillOpen,
  paid: styles.pillPaid,
  uncollectible: styles.pillUncollectible,
  void: styles.pillVoid,
};
const KIND_LABEL: Record<string, string> = {
  onboarding_fee: "Onboarding",
  tech_fee: "Tech fee",
  adhoc: "Ad hoc",
};

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function computeEffectiveRate(feePercent: number, propertyCount: number): { effectiveRate: number; discountApplied: boolean; discountPercent: number } {
  const discountApplied = propertyCount >= 3;
  const discountPercent = discountApplied ? 10 : 0;
  const effectiveRate = feePercent * (1 - discountPercent / 100);
  return { effectiveRate, discountApplied, discountPercent };
}

export async function BillingTab({ billing }: { billing: ClientBilling }) {
  const { totalCollectedCents, nextInvoice, invoices, managementFeePercent, propertyCount, paymentMethod } = billing;

  return (
    <div className={styles.root}>
      {/* Summary bar */}
      <div className={styles.summaryBar}>
        <div className={styles.summaryItem}>
          <CurrencyDollar size={18} weight="duotone" className={styles.summaryIcon} />
          <div>
            <div className={styles.summaryValue}>{formatCents(totalCollectedCents)}</div>
            <div className={styles.summaryLabel}>Total collected (lifetime)</div>
          </div>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <CalendarBlank size={18} weight="duotone" className={styles.summaryIcon} />
          <div>
            <div className={styles.summaryValue}>
              {nextInvoice ? formatDate(nextInvoice.dueAt) : "No upcoming invoice"}
            </div>
            <div className={styles.summaryLabel}>
              {nextInvoice ? `${formatCents(nextInvoice.amountCents)} due` : "Next invoice date"}
            </div>
          </div>
        </div>
      </div>

      {/* Fee structure */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>
          <Buildings size={16} weight="duotone" className={styles.cardTitleIcon} />
          Fee structure
        </h3>
        {managementFeePercent == null ? (
          <p className={styles.noFee}>No management fee rate set. Edit the client to add one.</p>
        ) : (() => {
          const { effectiveRate, discountApplied, discountPercent } = computeEffectiveRate(managementFeePercent, propertyCount);
          return (
            <div className={styles.feeRows}>
              <div className={styles.feeRow}>
                <span className={styles.feeLabel}>Base rate</span>
                <span className={styles.feeValue}>{managementFeePercent}%</span>
              </div>
              {discountApplied && (
                <div className={styles.feeRow}>
                  <span className={styles.feeLabel}>
                    Multi-property discount ({propertyCount} properties)
                  </span>
                  <span className={styles.feeDiscount}>-{discountPercent}%</span>
                </div>
              )}
              <div className={`${styles.feeRow} ${styles.feeTotal}`}>
                <span className={styles.feeLabel}>Effective blended rate</span>
                <span className={styles.feeValue}>{effectiveRate.toFixed(2)}%</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Invoice history */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>
          <CurrencyDollar size={16} weight="duotone" className={styles.cardTitleIcon} />
          Invoice history
        </h3>
        {invoices.length === 0 ? (
          <p className={styles.emptyText}>No invoices yet.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Type</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>{KIND_LABEL[inv.kind] ?? inv.kind}</td>
                  <td>
                    <span className={`${styles.pill} ${STATUS_CLASS[inv.status] ?? ""}`}>
                      {STATUS_LABEL[inv.status] ?? inv.status}
                    </span>
                  </td>
                  <td>{formatCents(inv.amount_cents)}</td>
                  <td>{inv.paid_at ? formatDate(inv.paid_at) : inv.due_at ? formatDate(inv.due_at) : "—"}</td>
                  <td>
                    {inv.hosted_invoice_url ? (
                      <a
                        href={inv.hosted_invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.invoiceLink}
                        aria-label="Open invoice"
                      >
                        <ArrowSquareOut size={14} />
                      </a>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payment method */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>
          <CreditCard size={16} weight="duotone" className={styles.cardTitleIcon} />
          Payment method
        </h3>
        {!paymentMethod ? (
          <p className={styles.emptyText}>No payment method on file.</p>
        ) : paymentMethod.type === "card" ? (
          <div className={styles.paymentRow}>
            <CreditCard size={18} weight="duotone" className={styles.paymentIcon} />
            <div>
              <div className={styles.paymentMain}>
                {paymentMethod.brand
                  ? paymentMethod.brand.charAt(0).toUpperCase() + paymentMethod.brand.slice(1)
                  : "Card"}{" "}
                ending {paymentMethod.last4}
              </div>
              <div className={`${styles.paymentSub} ${paymentMethod.isExpiringSoon ? styles.paymentExpiring : ""}`}>
                {paymentMethod.isExpiringSoon && <Warning size={13} weight="fill" />}
                Expires {paymentMethod.expMonth}/{paymentMethod.expYear}
                {paymentMethod.isExpiringSoon ? " — expiring soon" : ""}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.paymentRow}>
            <Bank size={18} weight="duotone" className={styles.paymentIcon} />
            <div>
              <div className={styles.paymentMain}>
                {paymentMethod.brand ?? "Bank account"} ending {paymentMethod.last4}
              </div>
              <div className={styles.paymentSub}>ACH / bank transfer</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create BillingTab.module.css**

```css
/* apps/web/src/app/(admin)/admin/clients/[id]/BillingTab.module.css */
.root {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 760px;
}

.summaryBar {
  display: flex;
  align-items: stretch;
  gap: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
}

.summaryItem {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  flex: 1;
}

.summaryIcon { color: var(--color-brand); flex-shrink: 0; }

.summaryValue {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.summaryLabel {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.summaryDivider {
  width: 1px;
  background: var(--color-border);
  flex-shrink: 0;
}

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cardTitle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.cardTitleIcon { color: var(--color-brand); }

.noFee, .emptyText {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin: 0;
}

.feeRows { display: flex; flex-direction: column; gap: 8px; }

.feeRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9375rem;
  color: var(--color-text-secondary);
  padding: 6px 0;
  border-bottom: 1px solid var(--color-border);
}
.feeRow:last-child { border-bottom: none; }

.feeLabel { color: var(--color-text-secondary); }
.feeValue { font-weight: 600; color: var(--color-text-primary); }
.feeDiscount { font-weight: 600; color: #059669; }
.feeTotal .feeLabel { font-weight: 700; color: var(--color-text-primary); }
.feeTotal .feeValue { font-size: 1.0625rem; }

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.table th {
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0 8px 10px;
  border-bottom: 1px solid var(--color-border);
}
.table td {
  padding: 12px 8px;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}
.table tr:last-child td { border-bottom: none; }

.pill {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}
.pillDraft { background: color-mix(in srgb, var(--color-text-muted) 12%, transparent); color: var(--color-text-muted); }
.pillOpen { background: color-mix(in srgb, #6366f1 15%, transparent); color: #6366f1; }
.pillPaid { background: color-mix(in srgb, #059669 15%, transparent); color: #059669; }
.pillUncollectible { background: color-mix(in srgb, var(--color-text-muted) 12%, transparent); color: var(--color-text-muted); }
.pillVoid { background: color-mix(in srgb, var(--color-text-muted) 12%, transparent); color: var(--color-text-muted); }

.invoiceLink {
  display: inline-flex;
  align-items: center;
  color: var(--color-brand);
  padding: 4px;
  border-radius: 4px;
  transition: background 120ms ease;
}
.invoiceLink:hover { background: color-mix(in srgb, var(--color-brand) 12%, transparent); }

.paymentRow {
  display: flex;
  align-items: center;
  gap: 12px;
}
.paymentIcon { color: var(--color-brand); flex-shrink: 0; }
.paymentMain { font-size: 0.9375rem; font-weight: 600; color: var(--color-text-primary); }
.paymentSub {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  margin-top: 2px;
}
.paymentExpiring { color: #b45309; }
```

- [ ] **Step 6: Wire BillingTab in the clients page**

Add imports:
```typescript
import { BillingTab } from "./BillingTab";
import { fetchClientBilling } from "@/lib/admin/client-billing";
```

Fetch billing data:
```typescript
const billingData = tab === "billing" && client.profileId
  ? await fetchClientBilling(client.profileId, client.id, client.properties.length)
  : null;
```

Replace the `billing` case:
```typescript
case "billing":
  if (!client.profileId || !billingData) {
    return (
      <TabPlaceholder
        title="Billing"
        body="Billing is available once the client completes onboarding."
      />
    );
  }
  return <BillingTab billing={billingData} />;
```

- [ ] **Step 7: Test billing tab**

Navigate to `?tab=billing` for an active owner.
- Summary bar shows total collected and next invoice date.
- Fee structure shows rate (or "No management fee rate set").
- Invoice table lists all invoices with correct status pills.
- Payment method card shows card or ACH (or "No payment method on file").
- If Stripe not configured: summary and fee still render; invoices may be empty.

- [ ] **Step 8: Commit**

```bash
git add apps/web/supabase/migrations/20260424_contacts_management_fee.sql \
        apps/web/src/lib/admin/client-billing.ts \
        apps/web/src/lib/stripe.ts \
        apps/web/src/app/\(admin\)/admin/clients/\[id\]/BillingTab.tsx \
        apps/web/src/app/\(admin\)/admin/clients/\[id\]/BillingTab.module.css \
        apps/web/src/app/\(admin\)/admin/clients/\[id\]/page.tsx
git commit -m "feat: add full BillingTab — fee structure, invoice history, payment method expiration"
```

---

## Task 6: Documents Tab

**Files:**
- Create: `apps/web/src/lib/admin/client-documents.ts`
- Create: `apps/web/src/app/(admin)/admin/clients/[id]/DocumentsTab.tsx`
- Create: `apps/web/src/app/(admin)/admin/clients/[id]/DocumentsTab.module.css`
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/page.tsx`

The `signed_documents` table schema:
- `id`, `user_id` (profiles.id), `property_id` (nullable), `boldsign_document_id`, `template_name`, `status` (string), `signed_at` (nullable), `signed_pdf_url` (nullable), `created_at`

- [ ] **Step 1: Create client-documents.ts**

```typescript
// apps/web/src/lib/admin/client-documents.ts
import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ClientDocument = {
  id: string;
  templateName: string;
  category: "legal" | "financial" | "property";
  status: string;
  signedAt: string | null;
  signedPdfUrl: string | null;
  propertyId: string | null;
  propertyLabel: string | null;
  createdAt: string;
};

function deriveCategory(templateName: string): ClientDocument["category"] {
  const lower = templateName.toLowerCase();
  if (lower.includes("agreement") || lower.includes("addendum") || lower.includes("contract")) return "legal";
  if (lower.includes("w9") || lower.includes("w-9") || lower.includes("ach") || lower.includes("tax")) return "financial";
  return "property";
}

export async function fetchClientDocuments(profileId: string): Promise<ClientDocument[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("signed_documents")
    .select(`
      id, template_name, status, signed_at, signed_pdf_url, property_id, created_at,
      property:properties(address_line_1, city, state)
    `)
    .eq("user_id", profileId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[client-documents] fetch error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const prop = row.property as { address_line_1: string | null; city: string | null; state: string | null } | null;
    const propertyLabel = prop
      ? [prop.address_line_1, prop.city, prop.state].filter(Boolean).join(", ")
      : null;
    return {
      id: row.id,
      templateName: row.template_name,
      category: deriveCategory(row.template_name),
      status: row.status,
      signedAt: row.signed_at,
      signedPdfUrl: row.signed_pdf_url,
      propertyId: row.property_id,
      propertyLabel,
      createdAt: row.created_at,
    };
  });
}
```

- [ ] **Step 2: Create DocumentsTab.tsx**

```typescript
// apps/web/src/app/(admin)/admin/clients/[id]/DocumentsTab.tsx
import {
  FileText,
  FilePdf,
  Scales,
  Wallet,
  Buildings,
  CheckCircle,
  Clock,
  XCircle,
  DownloadSimple,
} from "@phosphor-icons/react/dist/ssr";
import type { ClientDocument } from "@/lib/admin/client-documents";
import styles from "./DocumentsTab.module.css";

const CATEGORY_META: Record<ClientDocument["category"], { label: string; icon: React.ElementType }> = {
  legal: { label: "Legal", icon: Scales },
  financial: { label: "Financial", icon: Wallet },
  property: { label: "Property-specific", icon: Buildings },
};

function StatusPill({ status }: { status: string }) {
  if (status === "completed" || status === "signed") {
    return (
      <span className={`${styles.pill} ${styles.pillSigned}`}>
        <CheckCircle size={12} weight="fill" />
        Signed
      </span>
    );
  }
  if (status === "expired" || status === "declined") {
    return (
      <span className={`${styles.pill} ${styles.pillExpired}`}>
        <XCircle size={12} weight="fill" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }
  return (
    <span className={`${styles.pill} ${styles.pillPending}`}>
      <Clock size={12} weight="fill" />
      Pending
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function DocumentsTab({ documents }: { documents: ClientDocument[] }) {
  const byCategory = new Map<ClientDocument["category"], ClientDocument[]>();
  for (const doc of documents) {
    const list = byCategory.get(doc.category) ?? [];
    list.push(doc);
    byCategory.set(doc.category, list);
  }

  const categoryOrder: ClientDocument["category"][] = ["legal", "financial", "property"];

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.title}>Documents</h2>
        <p className={styles.subtitle}>Agreements, tax forms, and property-specific documents.</p>
      </div>

      {documents.length === 0 ? (
        <div className={styles.emptyState}>
          <FilePdf size={32} weight="duotone" className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>No documents yet</p>
          <p className={styles.emptyBody}>
            Documents sent for signature via BoldSign will appear here automatically.
          </p>
        </div>
      ) : (
        <div className={styles.categories}>
          {categoryOrder.map((cat) => {
            const docs = byCategory.get(cat);
            if (!docs || docs.length === 0) return null;
            const { label, icon: Icon } = CATEGORY_META[cat];

            return (
              <div key={cat} className={styles.category}>
                <div className={styles.categoryHeader}>
                  <Icon size={15} weight="duotone" className={styles.categoryIcon} />
                  <h3 className={styles.categoryTitle}>{label}</h3>
                  <span className={styles.categoryCount}>{docs.length}</span>
                </div>
                <div className={styles.docList}>
                  {docs.map((doc) => (
                    <div key={doc.id} className={styles.docRow}>
                      <FileText size={16} weight="duotone" className={styles.docIcon} />
                      <div className={styles.docMain}>
                        <div className={styles.docName}>{doc.templateName}</div>
                        <div className={styles.docMeta}>
                          {doc.propertyLabel ? (
                            <span className={styles.docProperty}>{doc.propertyLabel}</span>
                          ) : null}
                          <span className={styles.docDate}>
                            {doc.signedAt
                              ? `Signed ${formatDate(doc.signedAt)}`
                              : `Sent ${formatDate(doc.createdAt)}`}
                          </span>
                        </div>
                      </div>
                      <StatusPill status={doc.status} />
                      {doc.signedPdfUrl ? (
                        <a
                          href={doc.signedPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.downloadBtn}
                          aria-label={`Download ${doc.templateName}`}
                        >
                          <DownloadSimple size={15} />
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create DocumentsTab.module.css**

```css
/* apps/web/src/app/(admin)/admin/clients/[id]/DocumentsTab.module.css */
.root { padding: 24px; max-width: 720px; }

.header { margin-bottom: 24px; }
.title { font-size: 1.0625rem; font-weight: 700; color: var(--color-text-primary); margin: 0 0 4px; }
.subtitle { font-size: 0.875rem; color: var(--color-text-muted); margin: 0; }

.emptyState { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 64px 24px; text-align: center; }
.emptyIcon { color: var(--color-text-muted); opacity: 0.4; }
.emptyTitle { font-size: 1rem; font-weight: 600; color: var(--color-text-primary); margin: 0; }
.emptyBody { font-size: 0.875rem; color: var(--color-text-muted); max-width: 380px; margin: 0; line-height: 1.6; }

.categories { display: flex; flex-direction: column; gap: 20px; }

.category {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
}

.categoryHeader {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  background: color-mix(in srgb, var(--color-border) 30%, transparent);
  border-bottom: 1px solid var(--color-border);
}

.categoryIcon { color: var(--color-brand); }

.categoryTitle {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
  flex: 1;
}

.categoryCount {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  background: color-mix(in srgb, var(--color-border) 60%, transparent);
  padding: 2px 8px;
  border-radius: 9999px;
}

.docList { display: flex; flex-direction: column; }

.docRow {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
  transition: background 120ms ease;
}
.docRow:last-child { border-bottom: none; }
.docRow:hover { background: color-mix(in srgb, var(--color-brand) 4%, transparent); }

.docIcon { color: var(--color-text-muted); flex-shrink: 0; }

.docMain { flex: 1; min-width: 0; }

.docName {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.docMeta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}

.docProperty {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.docDate {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}
.pillPending { background: color-mix(in srgb, #6366f1 15%, transparent); color: #6366f1; }
.pillSigned { background: color-mix(in srgb, #059669 15%, transparent); color: #059669; }
.pillExpired { background: color-mix(in srgb, #dc2626 12%, transparent); color: #dc2626; }

.downloadBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  color: var(--color-brand);
  text-decoration: none;
  transition: background 120ms ease;
  flex-shrink: 0;
}
.downloadBtn:hover { background: color-mix(in srgb, var(--color-brand) 10%, transparent); }
```

- [ ] **Step 4: Wire DocumentsTab in the clients page**

Add imports:
```typescript
import { DocumentsTab } from "./DocumentsTab";
import { fetchClientDocuments } from "@/lib/admin/client-documents";
```

Fetch documents:
```typescript
const clientDocuments = tab === "documents" && client.profileId
  ? await fetchClientDocuments(client.profileId)
  : [];
```

Replace the `documents` case:
```typescript
case "documents":
  if (!client.profileId) {
    return (
      <TabPlaceholder
        title="Documents"
        body="Documents are available once the client begins onboarding."
      />
    );
  }
  return <DocumentsTab documents={clientDocuments} />;
```

- [ ] **Step 5: Test documents tab**

Navigate to `?tab=documents`.
- For a client with no documents: empty state with FilePdf icon.
- For a client who went through onboarding (signed a host agreement): document appears in Legal category with status pill.
- Verify download link renders for docs with `signed_pdf_url`.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/admin/client-documents.ts \
        apps/web/src/app/\(admin\)/admin/clients/\[id\]/DocumentsTab.tsx \
        apps/web/src/app/\(admin\)/admin/clients/\[id\]/DocumentsTab.module.css \
        apps/web/src/app/\(admin\)/admin/clients/\[id\]/page.tsx
git commit -m "feat: add DocumentsTab showing BoldSign documents grouped by category"
```

---

## Task 7: Messaging Tab — Migration + Infrastructure + UI

**Files:**
- Create: `apps/web/supabase/migrations/20260424_client_messages.sql`
- Create: `apps/web/src/lib/admin/client-messages.ts`
- Create: `apps/web/src/app/(admin)/admin/clients/[id]/MessagingTab.tsx`
- Create: `apps/web/src/app/(admin)/admin/clients/[id]/MessagingTab.module.css`
- Create: `apps/web/src/app/(admin)/admin/clients/[id]/messaging-actions.ts`
- Modify: `apps/web/src/app/(admin)/admin/clients/[id]/page.tsx`

- [ ] **Step 1: Apply the migration**

Using the Supabase MCP tool with project_id `pwoxwpryummqeqsxdgyc`:

```sql
-- 20260424_client_messages.sql
CREATE TABLE IF NOT EXISTS public.client_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('admin', 'client')),
  sender_id uuid NOT NULL REFERENCES public.profiles(id),
  body text NOT NULL,
  channel text NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email')),
  pinned boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_messages_contact_idx ON public.client_messages (contact_id, created_at DESC);

ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all client messages"
  ON public.client_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

Verify: `SELECT table_name FROM information_schema.tables WHERE table_name = 'client_messages';`

- [ ] **Step 2: Create client-messages.ts**

```typescript
// apps/web/src/lib/admin/client-messages.ts
import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ClientMessage = {
  id: string;
  contactId: string;
  senderType: "admin" | "client";
  senderId: string;
  senderName: string;
  body: string;
  channel: "in_app" | "email";
  pinned: boolean;
  readAt: string | null;
  createdAt: string;
};

export async function fetchClientMessages(contactId: string): Promise<ClientMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("client_messages")
    .select(`
      id, contact_id, sender_type, sender_id, body, channel, pinned, read_at, created_at,
      sender:profiles(full_name)
    `)
    .eq("contact_id", contactId)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[client-messages] fetch error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const sender = row.sender as { full_name: string } | null;
    return {
      id: row.id,
      contactId: row.contact_id,
      senderType: row.sender_type as "admin" | "client",
      senderId: row.sender_id,
      senderName: sender?.full_name ?? "Unknown",
      body: row.body,
      channel: row.channel as "in_app" | "email",
      pinned: row.pinned,
      readAt: row.read_at,
      createdAt: row.created_at,
    };
  });
}
```

- [ ] **Step 3: Create messaging-actions.ts**

```typescript
// apps/web/src/app/(admin)/admin/clients/[id]/messaging-actions.ts
"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function sendClientMessage(
  contactId: string,
  body: string,
): Promise<{ ok: boolean; message: string }> {
  if (!body.trim()) return { ok: false, message: "Message cannot be empty." };

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const adminId = authData.user?.id;
  if (!adminId) return { ok: false, message: "Not authenticated." };

  const { error } = await supabase.from("client_messages").insert({
    contact_id: contactId,
    sender_type: "admin",
    sender_id: adminId,
    body: body.trim(),
    channel: "in_app",
  });

  if (error) {
    console.error("[messaging] send error:", error.message);
    return { ok: false, message: "Failed to send. Please try again." };
  }

  revalidatePath(`/admin/clients/${contactId}`);
  return { ok: true, message: "Sent." };
}

export async function togglePinMessage(
  messageId: string,
  contactId: string,
  pinned: boolean,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("client_messages")
    .update({ pinned: !pinned })
    .eq("id", messageId);

  if (error) return { ok: false };
  revalidatePath(`/admin/clients/${contactId}`);
  return { ok: true };
}
```

- [ ] **Step 4: Create MessagingTab.tsx**

```typescript
// apps/web/src/app/(admin)/admin/clients/[id]/MessagingTab.tsx
"use client";

import { useRef, useState, useTransition } from "react";
import { PaperPlaneRight, PushPin, User, Buildings } from "@phosphor-icons/react";
import { sendClientMessage, togglePinMessage } from "./messaging-actions";
import type { ClientMessage } from "@/lib/admin/client-messages";
import styles from "./MessagingTab.module.css";

type Props = {
  contactId: string;
  messages: ClientMessage[];
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function MessageBubble({
  message,
  contactId,
}: {
  message: ClientMessage;
  contactId: string;
}) {
  const [isPinning, startPinTransition] = useTransition();
  const isAdmin = message.senderType === "admin";

  function handlePin() {
    startPinTransition(async () => {
      await togglePinMessage(message.id, contactId, message.pinned);
    });
  }

  return (
    <div className={`${styles.bubble} ${isAdmin ? styles.bubbleAdmin : styles.bubbleClient}`}>
      <div className={styles.bubbleHeader}>
        <span className={styles.senderName}>
          {isAdmin ? (
            <><Buildings size={12} className={styles.senderIcon} /> {message.senderName}</>
          ) : (
            <><User size={12} className={styles.senderIcon} /> {message.senderName}</>
          )}
        </span>
        <span className={styles.timestamp}>{formatTime(message.createdAt)}</span>
        <button
          className={`${styles.pinBtn} ${message.pinned ? styles.pinBtnActive : ""}`}
          onClick={handlePin}
          disabled={isPinning}
          title={message.pinned ? "Unpin" : "Pin message"}
          aria-label={message.pinned ? "Unpin" : "Pin"}
        >
          <PushPin size={12} weight={message.pinned ? "fill" : "regular"} />
        </button>
      </div>
      <p className={styles.bubbleBody}>{message.body}</p>
    </div>
  );
}

export function MessagingTab({ contactId, messages }: Props) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const pinned = messages.filter((m) => m.pinned);
  const thread = messages.filter((m) => !m.pinned);

  function handleSend() {
    if (!body.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await sendClientMessage(contactId, body);
      if (result.ok) {
        setBody("");
        textareaRef.current?.focus();
      } else {
        setError(result.message);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className={styles.root}>
      {pinned.length > 0 && (
        <div className={styles.pinnedSection}>
          <div className={styles.pinnedLabel}>
            <PushPin size={13} weight="fill" />
            Pinned
          </div>
          {pinned.map((m) => (
            <MessageBubble key={m.id} message={m} contactId={contactId} />
          ))}
        </div>
      )}

      <div className={styles.thread}>
        {thread.length === 0 && pinned.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>No messages yet</p>
            <p className={styles.emptyBody}>
              Messages sent here are private notes and in-app communications with this client.
            </p>
          </div>
        ) : (
          thread.map((m) => (
            <MessageBubble key={m.id} message={m} contactId={contactId} />
          ))
        )}
      </div>

      <div className={styles.compose}>
        {error && <p className={styles.composeError}>{error}</p>}
        <div className={styles.composeRow}>
          <textarea
            ref={textareaRef}
            className={styles.composeInput}
            placeholder="Write a message… (Cmd+Enter to send)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            disabled={isPending}
          />
          <button
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={isPending || !body.trim()}
            aria-label="Send message"
          >
            <PaperPlaneRight size={18} weight="fill" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create MessagingTab.module.css**

```css
/* apps/web/src/app/(admin)/admin/clients/[id]/MessagingTab.module.css */
.root {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: calc(100vh - 180px);
  overflow: hidden;
}

.pinnedSection {
  padding: 12px 24px;
  background: color-mix(in srgb, #b45309 8%, transparent);
  border-bottom: 1px solid color-mix(in srgb, #b45309 20%, transparent);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pinnedLabel {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #92600a;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.thread {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  scrollbar-width: thin;
}

.emptyState {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  gap: 8px;
}

.emptyTitle {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.emptyBody {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  max-width: 360px;
  margin: 0;
  line-height: 1.6;
}

.bubble {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bubbleAdmin {
  align-self: flex-end;
  background: var(--color-brand);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.bubbleClient {
  align-self: flex-start;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-bottom-left-radius: 4px;
}

.bubbleHeader {
  display: flex;
  align-items: center;
  gap: 6px;
}

.senderName {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  opacity: 0.8;
  flex: 1;
}

.senderIcon { opacity: 0.7; }

.timestamp {
  font-size: 0.6875rem;
  opacity: 0.65;
  white-space: nowrap;
}

.pinBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  opacity: 0.5;
  transition: opacity 120ms ease;
  color: inherit;
  flex-shrink: 0;
}
.pinBtn:hover { opacity: 1; }
.pinBtnActive { opacity: 1; }

.bubbleBody {
  font-size: 0.9375rem;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.compose {
  border-top: 1px solid var(--color-border);
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.composeError {
  font-size: 0.8125rem;
  color: #dc2626;
  margin: 0;
}

.composeRow {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.composeInput {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-bg);
  font-size: 0.9375rem;
  color: var(--color-text-primary);
  resize: none;
  outline: none;
  line-height: 1.5;
  font-family: inherit;
  transition: border-color 120ms ease;
}
.composeInput:focus { border-color: var(--color-brand); }
.composeInput::placeholder { color: var(--color-text-muted); }
.composeInput:disabled { opacity: 0.6; }

.sendBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  border: none;
  background: var(--color-brand);
  color: #fff;
  cursor: pointer;
  transition: background 120ms ease, opacity 120ms ease;
  flex-shrink: 0;
}
.sendBtn:hover:not(:disabled) { opacity: 0.88; }
.sendBtn:disabled { opacity: 0.4; cursor: not-allowed; }
```

- [ ] **Step 6: Wire MessagingTab in the clients page**

Add imports:
```typescript
import { MessagingTab } from "./MessagingTab";
import { fetchClientMessages } from "@/lib/admin/client-messages";
```

Fetch messages:
```typescript
const clientMessages = tab === "messaging"
  ? await fetchClientMessages(id)
  : [];
```

Replace the `messaging` case:
```typescript
case "messaging":
  return <MessagingTab contactId={id} messages={clientMessages} />;
```

- [ ] **Step 7: Test the messaging tab**

Navigate to `?tab=messaging`.
- Empty state renders with the correct messaging description.
- Type a message and send (Cmd+Enter or button).
- Message appears in the thread as a blue admin bubble.
- Verify in Supabase: `SELECT * FROM client_messages WHERE contact_id = '[id]';`
- Pin a message: it moves to the pinned section at the top.
- Unpin: moves back to thread.

- [ ] **Step 8: Commit**

```bash
git add apps/web/supabase/migrations/20260424_client_messages.sql \
        apps/web/src/lib/admin/client-messages.ts \
        apps/web/src/app/\(admin\)/admin/clients/\[id\]/MessagingTab.tsx \
        apps/web/src/app/\(admin\)/admin/clients/\[id\]/MessagingTab.module.css \
        apps/web/src/app/\(admin\)/admin/clients/\[id\]/messaging-actions.ts \
        apps/web/src/app/\(admin\)/admin/clients/\[id\]/page.tsx
git commit -m "feat: add MessagingTab with client_messages table, thread UI, pin/unpin"
```

---

## Self-Review

### 1. Spec coverage check

| Design doc requirement | Task | Status |
|---|---|---|
| Meetings: full wiring with MeetingsTab | Task 1 | ✅ |
| Settings: section navigation stays on clients route | Task 2 | ✅ |
| Intelligence: relationship summary, risk signals, sentiment, recommendations, themes | Task 4 | ✅ |
| Intelligence: Refresh button, timestamped | Task 3 | ✅ |
| Intelligence: Anthropic API, ai_insights table, parent_type='contact' | Task 4 | ✅ |
| Billing: summary bar (total collected, next invoice) | Task 5 | ✅ |
| Billing: fee structure (base rate, multi-property discount, blended rate) | Task 5 | ✅ |
| Billing: invoice history with status pills and download | Task 5 | ✅ |
| Billing: payment method with expiration detector | Task 5 | ✅ |
| Documents: categories (Legal, Financial, Property-specific) | Task 6 | ✅ |
| Documents: status pills (Pending/Signed/Expired), download | Task 6 | ✅ |
| Messaging: chronological thread, compose bar | Task 7 | ✅ |
| Messaging: pinned messages at top | Task 7 | ✅ |
| Messaging: new owner_messages table (named client_messages here) | Task 7 | ✅ |
| All 8 tabs always visible (TabPlaceholder for unavailable) | All tasks | ✅ |

### 2. Placeholder scan

No TBD, TODO, "fill in details", or "similar to Task N" in any step. Every step has exact code or exact commands.

### 3. Type consistency

- `ClientMeeting` in `client-meetings.ts` matches what `MeetingsTab` expects for the `meetings` prop (same field names).
- `ClientBilling` in `client-billing.ts` passed directly to `BillingTab` as `billing` prop.
- `ClientDocument` in `client-documents.ts` passed directly to `DocumentsTab` as `documents` prop.
- `ClientMessage` in `client-messages.ts` passed to `MessagingTab` as `messages` prop.
- `IntelligenceTab` receives `Insight[]` from `fetchInsightsByParent` — types match `ai-insights.ts`.
- `fetchPaymentMethod` returns `StripePaymentMethod | null` — used in `client-billing.ts` and `BillingTab`.
- `SettingsTabProps.basePath` is `string | undefined` — consistent in both the type definition and all call sites.
