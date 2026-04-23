# Operational Dashboard Design

**Date:** 2026-04-22
**Status:** Approved

## Goal

Replace the current admin dashboard (4 stat cards + timeline feed) with an operational command center focused on three things: property health, task urgency, and AI-generated guest intelligence. Built first as an isolated preview in a git worktree on a secondary localhost port before merging to main.

---

## Layout

Single scrollable page, four sections stacked vertically. No tabs. Everything visible without drilling in.

---

## Section 1: Property Health Grid

A responsive grid of compact property cards, one per property.

**Each card shows:**
- Property cover photo (or gradient fallback)
- Property name and city/state
- Three category indicators: Documents (X/10), Finances (X/6), Listings (X/16)
- Each indicator is color-coded by worst-case status within that category:
  - Green: all items completed
  - Amber: at least one item is `pending_owner` or `in_progress`
  - Red: at least one item is `stuck`
- The card border/accent reflects the worst-case color across all three categories
- Clicking navigates to that property's launchpad (`/admin/properties/[id]?view=launchpad`)

**Data source:** `property_checklist_items` table, joined to `properties`. No Hospitable API call needed for this section.

---

## Section 2: Attention Queue

A prioritized list of every non-completed checklist item across all properties, grouped into three labeled buckets:

| Bucket | Status | Color |
|--------|--------|-------|
| Owner needs to act | `pending_owner` | Amber |
| Stuck / blocked | `stuck` | Red |
| In progress | `in_progress` | Blue |

**Each row shows:**
- Property name (links to property launchpad)
- Category badge (Documents / Finances / Listings)
- Item label (e.g. "VRBO Payout & Taxes")
- Days in current status (derived from `updated_at`)
- Arrow link to the specific checklist item

Empty state: "All items are clear" with a green checkmark.

---

## Section 3: Task Surface

A compact task list scoped to urgent tasks only. Not a full task manager — just the dashboard signal.

**Filter tabs:** All · Overdue · Due Today · Payouts · Maintenance

**Each task row shows:**
- Task title (truncated at ~60 chars)
- Due date. If the task has a time component, show date + time. If date only, show date. Overdue = red. Due today = amber.
- Assignee avatar: small circle with initials, tooltip on hover showing full name. If unassigned, show a neutral grey circle with "—".
- Linked property name in muted text below the title
- Click navigates to the full task in `/admin/tasks`

**Footer:** "View all tasks →" link to `/admin/tasks`.

**Data source:** Existing `tasks` table via `fetchAdminTasksList`. For the dashboard, scope to `status != 'done'` and `due_at <= now + 24h` for the default view.

Payout tasks = tasks where `parent_type = 'property'` and title or category matches finance-related keywords (or a dedicated `task_category` flag if added). Maintenance = tasks tagged or titled with maintenance-related terms.

---

## Section 4: Guest Intelligence

### Background Job (Trigger.dev)

A regular `task()` called `guestIntelligenceSync` holds all the logic. A `schedules.task()` wrapper fires it at `0 5,15 * * *` (5:00 AM and 3:00 PM daily). A manual "Refresh" button on the dashboard triggers the same underlying task on demand.

**Job flow:**
1. Fetch all active properties from Supabase
2. For each property, fetch from Hospitable API:
   - Guest reviews (new endpoint to add to `hospitable.ts`)
   - Recent guest messages (new endpoint to add to `hospitable.ts`)
3. Batch all review + message text per property into a single Claude prompt
4. Claude returns structured JSON with two arrays per property:
   - `ownerUpdates[]`: things worth communicating to the owner
   - `houseActionItems[]`: maintenance or quality issues for the property
5. Each item in both arrays includes:
   - `title`: one-line summary
   - `body`: full synthesis in plain language
   - `severity`: `info | recommendation | warning | critical`
   - `severityReason`: one sentence explaining why Claude assigned this severity
   - `sourceCount`: number of distinct reviews/messages that contributed
   - `sourceExcerpts[]`: relevant quote, source type (review/message), approximate date
   - `suggestedFixes[]`: 2–3 concrete actionable steps
6. Write results to the existing `ai_insights` table with:
   - `parent_type = 'property'`
   - `agent_key = 'guest_intelligence'`
   - `severity` mapped from Claude output
   - `title`, `body`, `action_label = null` (actions are UI-driven)
   - A new `metadata` JSONB column (or use existing if present) to store `severity_reason`, `source_count`, `source_excerpts`, `suggested_fixes`, `bucket` (owner_update or house_action)
7. Delete previous `guest_intelligence` insights for the same property before writing new ones (full refresh, not append)

**Severity logic Claude uses:**
- Frequency is a signal but not the rule. Three guests mentioning a scratchy towel = `info`. One guest mentioning a smoke detector chirping = `warning`. One guest mentioning no working smoke detector = `critical`.
- Safety and security issues are always `warning` or `critical` regardless of count.
- Consistent praise worth relaying to an owner = `info` or `recommendation`.

### Dashboard Display

Two columns side by side (stacked on mobile): **Owner Updates** and **House Action Items**.

**Insight card (summary view):**
- Severity badge (color-coded: blue=info, teal=recommendation, amber=warning, red=critical)
- Title (Claude-generated one-liner)
- Source count ("3 mentions" or "1 mention")
- Property name
- Dismiss button (sets `dismissed_at`, hides card immediately)
- Click anywhere else opens the detail panel

**Insight detail (slide-in panel or modal):**
Four sections:
1. **The issue** — Claude's full plain-language synthesis
2. **Why this severity** — Claude's one-sentence reasoning (e.g. "Mentioned by 3 guests over 6 weeks, one describing it as preventing the door from locking — security concern.")
3. **Sources** — List of contributing excerpts. Each shows: source type badge (Review / Message), approximate date, quote text. Guest anonymized to first name only.
4. **Suggested fixes** — Claude's 2–3 concrete steps specific to the issue

**Action buttons at bottom of detail:**
- **Create task** — Creates a parent task linked to the property, titled from the insight. If Claude's suggested fixes have multiple steps, each becomes a subtask with no due date. Opens the new task for immediate assignment/dating.
- **Send to owner** — Drafts a message using the Owner Update framing (opens inbox compose or copies draft)
- **Dismiss** — Same as card dismiss

### Create Task logic

- Single-step issue → parent task only, description = Claude's body + suggested fix
- Multi-step issue → parent task + one subtask per suggested fix step
- All tasks: `parent_type = 'property'`, `parent_id = property.id`, `status = 'todo'`, `assignee_id = null` (assign after creation)
- Task system already supports `parent_task_id` for subtasks

---

## Data Sources Summary

| Section | Source |
|---------|--------|
| Property Health Grid | `property_checklist_items` + `properties` (Supabase) |
| Attention Queue | `property_checklist_items` (Supabase) |
| Task Surface | `tasks` table (Supabase) |
| Guest Intelligence cards | `ai_insights` table (written by Trigger.dev job) |
| Guest Intelligence job | Hospitable API (reviews + messages) + Claude API |

---

## Preview Strategy

Build in an isolated git worktree at a secondary localhost port (4001 or next available). The main codebase is not touched until the preview is approved. Once approved, the worktree changes are merged to main.

---

## What Is Not In Scope

- Revenue or occupancy metrics (Mission Control handles that)
- Full task management (exists at `/admin/tasks`)
- Historical insight archive (only current non-dismissed insights shown)
- Guest identity or PII beyond first name in excerpts
