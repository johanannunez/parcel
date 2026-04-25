# Unified Clients Hub: Design Document

**Date:** 2026-04-24
**Status:** Approved, ready for implementation planning

---

## Problem

The admin currently has two overlapping sections for managing people: `/admin/contacts/` (full pipeline, lead through archived) and `/admin/owners/` (active owners only). Clicking a contact opens one shell; clicking an owner opens a completely different shell. The stage pipeline in the contact view takes up too much space. There is no consistent experience from first contact to offboarding.

---

## Decision: Unified Clients Hub

Collapse contacts and owners into a single unified person record under `/admin/clients/[id]`. The underlying data model uses a `type` field on the contacts/profiles table. "Clients" covers the owner track (lead through archived). "Vendors" will be a future separate nav item using the same shell with different tabs.

**Nav change:**
- Remove: Leads, Owners
- Add: Clients (covers all lifecycle stages)
- Future: Vendors (same shell, different tab set)

---

## URL Structure

```
/admin/clients                      — list view
/admin/clients/[id]?tab=overview    — detail view (default tab)
/admin/clients/[id]?tab=properties
/admin/clients/[id]?tab=meetings
/admin/clients/[id]?tab=intelligence
/admin/clients/[id]?tab=messaging
/admin/clients/[id]?tab=documents
/admin/clients/[id]?tab=billing
/admin/clients/[id]?tab=settings
```

---

## List View

One unified list replacing both `/admin/contacts` and `/admin/owners`.

**Stage filter tabs:** All | Lead Pipeline | Onboarding | Active | Offboarding | Archived

**View modes:** Kanban | List | Map (existing pattern)

**Health indicators on cards:** Healthy | Needs Attention | At Risk (only shown for Active stage)

**Bug fix:** Remove duplicate "Archived" tab from contacts list.

---

## Client Hub Shell

The header is fixed and consistent across all tabs and all lifecycle stages.

```
[ Avatar ] [ Full Name ]           [ Stage Pill ]   [ Edit  ··· ]
           [ Company · email ]     small, colored   [ drawer btn ]
```

Stage pill colors:
- Lead Pipeline: gray
- Onboarding: amber
- Active Owner: green
- At Risk: red
- Offboarding: orange
- Archived: slate

**Edit drawer:** Slides in from the right. Never navigates away. Editable fields: name, email, phone, company, source, estimated MRR, assigned to, stage. Stage changes that are major jumps (e.g., Lead to Active Owner) require a confirmation prompt.

---

## Tabs

All 8 tabs are always shown for all stages. Tabs that are not relevant at an early stage show a clean empty state with a prompt rather than disappearing.

### 1. Overview

Read-only dashboard. Content adapts by stage.

**Lead:**
- Stage position (compact visual timeline, not a full block)
- Internal note
- Next meeting
- Source, estimated MRR, assigned to
- Last activity

**Onboarding:**
- Checklist progress bar
- Properties in setup
- Documents pending signature
- Next meeting

**Active Owner:**
- Relationship health score
- Properties snapshot (cover photos, health status)
- Open tasks
- Last conversation date
- Top AI insight (from Intelligence tab)
- Next invoice

**Offboarding and Archived:**
- Summary stats: time as owner, total revenue collected (lifetime across all properties), properties managed
- What triggered offboarding (reason field)
- Recent activity

### 2. Properties

Dedicated properties view for this owner's portfolio.

**View toggle:** Grid | Table (same pattern as main Properties page)

**Grid:** Property cards with cover photo, address, health status, current occupancy, last booking date.

**Table:** Sortable columns — address, health, occupancy rate, last booking, monthly revenue.

**Stats bar at top:** total properties, healthy count, attention needed count.

**Actions:** Link existing property, create new property.

**Empty state (leads):** "No properties linked yet" with a link action.

### 3. Meetings

Already built. No structural changes needed.

Current features: meeting list with CRUD, per-meeting title/date/duration/Meet link/transcript/AI summary, action items with status toggle, notes with visibility controls.

**Future enhancement:** Create Google Calendar invite directly from the meeting form.

### 4. Intelligence

Admin-only. Never visible to the owner. AI-generated relationship intelligence.

Sections:
- **Relationship summary:** AI paragraph on where the relationship stands, communication pattern, sentiment trend
- **Risk signals:** flags (no response in 14 days, late payments, mentioned competitor)
- **Owner sentiment:** happy / neutral / churn risk
- **Recommendations:** 2-3 specific next actions for Johan
- **Conversation themes:** recurring topics across meetings and messages

Refresh button to regenerate. Timestamped so staleness is visible.

Architecture: Same pattern as Guest Intelligence (Anthropic API, `ai_insights` table with `parent_type = 'contact'`, `agent_key` prefixed `client_intelligence:`).

### 5. Messaging

Direct owner-to-Johan communication thread. Not guest messaging (that stays in Hospitable/Inbox).

Sections:
- Chronological message thread
- Compose bar at bottom with document attachment support (pull from Documents tab)
- Message status: sent / delivered / read
- Channel indicator (email vs. in-app)
- Pinned messages at top for important links or outstanding asks

**Note:** Messaging requires new infrastructure (message table, send/receive pipeline). This is the largest build in this feature set and should be scoped as a separate phase.

### 6. Documents

All owner documents in one place.

**Categories:**
- Legal: Management agreement, addendums
- Financial: W9, ACH authorization form
- Property-specific: documents tied to a specific property

**Per document:** name, category, status pill (Pending Signature / Signed / Expired), date, download button.

**Actions:** Send for Signature (BoldSign), Upload (non-signature docs).

**Filters:** by status, by category.

### 7. Billing

**Summary bar at top:**
- Total collected across all properties combined (lifetime)
- Next invoice date

**Fee structure section:**
- Per-property management fee rate
- Multi-property discount (e.g., "3 properties — 10% discount applied")
- Effective blended rate
- No "plan" language

**Invoice history table:**
- Status pills: Paid / Open / Draft / Overdue
- Amount, billing period, download button per row

**Payment method:**
- Card or ACH on file
- Expiration detector: flag cards expiring within 30 days
- Automated message to owner when expiration is approaching (future feature, phase 2)

### 8. Settings

Already built. 10 sections: personal info, account security, business entity, notifications, payments and payout, property defaults, region and language, app preferences, data privacy, danger zone.

---

## Data Model Notes

- The underlying record is a contact. `contact_type` field distinguishes client vs. vendor.
- An owner is always a contact; a contact is not always an owner.
- The `lifecycle_stage` field drives stage pill rendering and Overview content selection.
- Intelligence uses `ai_insights` table with `parent_type = 'contact'`.
- Documents use `signed_documents` table (BoldSign) plus a future general `documents` table.
- Messaging requires a new `owner_messages` table.

---

## Build Phases

**Phase 1 (core shell and data):**
- Merge contacts + owners nav into Clients
- Unified detail shell with header, stage pill, edit drawer
- Fix double Archived tab bug
- Wire all existing tabs (Overview, Meetings, Financials/Billing, Settings) into new shell
- Properties tab: grid + table view

**Phase 2 (new content):**
- Intelligence tab (Anthropic API, ai_insights)
- Documents tab (BoldSign + file upload)
- Billing tab full build (fee structure, multi-property discount, expiration detector)

**Phase 3 (messaging infrastructure):**
- Messaging tab (new table, send/receive pipeline, channel routing)
- Card expiration automated message trigger
