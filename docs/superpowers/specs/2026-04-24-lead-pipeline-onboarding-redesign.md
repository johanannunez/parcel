# Lead Pipeline + Onboarding Redesign

**Date:** 2026-04-24
**Status:** Approved — ready for implementation

---

## Problem

The current Clients board mixes lead management and owner onboarding into the same pipeline view. The Onboarding tab uses time-based buckets (Fresh/Active/Stalled/Cold) that say nothing about real progress. The lead pipeline has too many stages (In Talks, Onboarding column) and the wrong label ("Inquiry" instead of "Contacted"). There is no "Mark as Signed" trigger to graduate a lead to owner.

---

## Design Decisions

### 1. Lead Pipeline — Kanban, 4 columns

Columns in order:

| Column | DB stage | Color |
|---|---|---|
| Contacted | `lead_new` | Parcel Blue |
| Qualified | `qualified` | Parcel Blue |
| Contract Sent | `contract_sent` | Violet |
| Cold | `lead_cold` | Gray (collapsed by default) |

**Changes from current:**
- "Inquiry" label renamed to "Contacted" (label change only, no DB migration needed)
- "In Talks" column removed from this view (stage preserved in DB for existing data, hidden from pipeline)
- "Onboarding" column removed from lead pipeline — onboarding is a separate view

**Mark as Signed action:**
A green "Mark as Signed" button appears on every card in the Contract Sent column. Clicking it:
1. Updates `lifecycle_stage` to `onboarding` and sets `stage_changed_at`
2. If the contact already has a `profile_id`, no profile action needed. If `profile_id` is null, the action logs the gap and proceeds — profile creation requires an auth invite flow that is out of scope here. Onboarding tasks still seed against any properties already linked to the contact.
3. Seeds the 32-task onboarding checklist for every property linked to the contact (via `owner_id` on `properties` and `property_owners` junction)
4. Removes the card from the lead pipeline immediately (revalidates the contacts page)
5. The contact now appears in the Onboarding phase board

This is a manual trigger for now. BoldSign webhook integration will automate it later — same action, fired by the signature event.

**Cold re-engagement:**
No separate "Warm" column. When a cold lead re-engages, drag them back to Contacted. The contact record preserves full history. A "Re-engaged" tag can be added later as a filter for tracking winback attempts, but it does not require a pipeline column.

---

### 2. Onboarding — Phase Board, auto-advancing

Replaces the current time-bucketed Onboarding view entirely.

**Three columns, sequential:**

| Column | DB phase tag | Color | Who does the work |
|---|---|---|---|
| Documents | `onboarding:documents` | Orange (#F59E0B / #B45309) | Owner provides |
| Finances | `onboarding:finances` | Violet (#8B5CF6 / #6D28D9) | Admin (Johan) |
| Listings | `onboarding:listings` | Parcel Blue (#02AAEB / #1B77BE) | Admin, owner has visibility |

**Auto-advance rules:**
- Owner card lives in the column matching their current active phase
- When Documents hits 10/10 completed tasks, card moves to Finances
- When Finances hits 6/6, card moves to Listings
- When Listings hits 16/16, contact `lifecycle_stage` updates to `active_owner`
- Movement is driven by task completion — no manual dragging between phases

**Card design:**
Every card shows all three phase bars regardless of which column it is in:
- Active phase: full color bar with fraction (e.g., "4/6")
- Completed phases: faded, green bar with checkmark ("Docs ✓")
- Future phases: ghosted at low opacity (25%) with empty bar

**Sequential lock:**
Documents must reach 100% before Finances unlocks. Finances must reach 100% before Listings unlocks. The system enforces this — completing Finance or Listing tasks while Documents is incomplete does not advance the card.

**Visibility:**
- Documents: owner-facing tasks, visible in owner portal
- Finances: admin-only tasks, not shown to owner
- Listings: visible to both admin and owner — creates accountability ("your property is now live on Airbnb")

---

### 3. Onboarding Task Checklist — Updated to Real Workflow

Replaces the previous placeholder task list. Exact 32 tasks from Johan's onboarding process:

**Documents (10) — Owner provides:**
1. Host Rental Agreement
2. Paid Initial Onboarding Fee
3. ACH Authorization Form
4. Card Authorization Form
5. W9 Form
6. Identity Verification
7. Property Setup Form
8. Wi-Fi Account Information
9. Recommendations for Guidebook
10. Block Dates on the Calendar

**Finances (6) — Admin sets up:**
1. Technology Fee
2. Airbnb (Payout & Taxes)
3. Hospitable (Payouts)
4. Price Labs (Pricing)
5. VRBO (Payout & Taxes)
6. Owner Card on Turno

**Listings (16) — Admin creates, owner sees:**
1. Client Account
2. Airbnb
3. VRBO
4. Hospitable
5. Turno
6. Booking.com
7. Furnished Finder
8. Turbo Tenant
9. ALE Solutions
10. CRS Temporary Housing
11. Sedgwick
12. TaCares
13. The Link Housing
14. Alacrity
15. Build MP
16. CHBO

**`ONBOARDING_PHASE_TOTALS` update:** `{ documents: 10, finances: 6, listings: 16 }`

---

### 4. Active Owners — List + Map, no Kanban

No changes to the existing `ActiveOwnersGrid` component or map view. Active Owners is not a Kanban — these are managed relationships, not things being processed. List view is sortable and filterable. Map view shows property pins.

---

## Architecture Notes

### Files to create or modify

| File | Change |
|---|---|
| `src/lib/admin/lifecycle-stage.ts` | Rename `lead_new` label from "Inquiry" to "Contacted" |
| `src/lib/admin/pipeline-adapters/contact-status.ts` | Remove "In Talks" and "Onboarding" from `STAGE_COLUMNS_LEAD_PIPELINE`; replace `buildOnboardingMilestoneBoard` with `buildOnboardingPhaseBoard` using phase-based columns in the new colors |
| `src/lib/admin/onboarding-templates.ts` | Replace all 32 tasks with the real checklist; update `ONBOARDING_PHASE_TOTALS` to `{ documents: 10, finances: 6, listings: 16 }` |
| `src/app/(admin)/admin/contacts/ContactsKanbanBoard.tsx` | Add "Mark as Signed" button to Contract Sent cards; wire to a new server action |
| `src/app/(admin)/admin/contacts/actions.ts` | Add `markContractSigned` server action: update stage, create profile if needed, seed tasks, revalidate |
| `src/components/admin/pipeline/ContactStatusCard.tsx` | Conditionally render "Mark as Signed" button when card is in `contract_sent` stage |

### Phase auto-advance logic

Auto-advance runs in the same server action that marks a task complete. After any task update:
1. Resolve all property IDs linked to the contact (via `properties.owner_id` and `property_owners` junction)
2. Count completed tasks tagged `onboarding:documents` across ALL those properties (tasks are `parent_type = 'property'`, so you must sum across the full property set)
3. Count total tasks tagged `onboarding:documents` across the same properties
4. If completed equals total and current `lifecycle_stage` is `onboarding` and no finance tasks are done yet, advance to finances phase (this is a UI phase — `lifecycle_stage` stays `onboarding`, the board determines which column via task completion counts)
5. Same check for finances → listings
6. When all listing tasks are done across all properties, set `lifecycle_stage = 'active_owner'`

The phase board determines column placement by computing task completion counts per phase at query time — there is no separate "current phase" field on the contact. The contact stays in `lifecycle_stage = onboarding` until fully complete.

This can be a shared utility: `checkAndAdvanceOnboardingPhase(contactId)` called after any onboarding task completion.

### No DB migration needed

`lead_new` label change is UI-only. `in_discussion` stays in the enum for historical data, just hidden from the pipeline view. The `onboarding` stage and all task tags already exist.

---

## Out of Scope (this sprint)

- BoldSign webhook integration (same `markContractSigned` action, wired to webhook later)
- Re-engaged / Winback tag on Contacted cards
- Owner portal view of onboarding progress (portal sprint)
- Offboarding and Archived views (unchanged)
