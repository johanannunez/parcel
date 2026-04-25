# Premium Dashboard V2 Design
**Date:** 2026-04-23
**Status:** Approved — building

## Problem
Current dashboard has 3-4 large scrolling sections (tasks, guest intelligence, property health). No KPI metrics. No lead pipeline visibility. No financial health. No owner activity. Zero AI synthesis layer beyond a raw insight dump. Feels like three long lists, not a command center.

## Vision
A scientific-data-style bento widget dashboard. Opening it gives you total business state in one scan. AI synthesizes a daily briefing. Twelve modular widgets cover every domain. Widgets are togglable. Some rows click to a detail modal before the full page; others navigate directly.

## Aesthetic: "Precision Instrument"
- **Background:** `#0a0b0e` (dark, warm not cold)
- **Surfaces:** `#111318` with `1px` solid `#1e2028` border, `12px` radius
- **Typography:** IBM Plex Mono (numbers/data), Onest (UI labels) — both from Google Fonts
- **Accent system (semantic):** amber=pipeline, violet=AI/intelligence, blue=ops, green=financial, teal=health
- **Motion:** Only the AI Briefing card has animation (gradient border cycling, fade-in text reveal). All other widgets are static and precise.
- **The unforgettable thing:** The AI Daily Briefing card — full-width at top, animated gradient border, 3-5 ranked priority items synthesized by Claude from all data domains.

## Layout: 4 Zones

### Zone A: Command Strip
7 KPI chips in one horizontal bar below the page header. Read-only, updates on page load.
Chips: Overdue Tasks | Pipeline Value | Cold Leads | Stuck Items | Open Invoices | AI Warnings | Pending Invitations

### Zone B: AI Daily Briefing (full-width hero)
Claude synthesizes all domains into 3-5 ranked priority items with brief explanations. Cached 15 min (revalidate). Manual refresh button. Graceful fallback if API unavailable.

### Zone C: Bento Widget Grid (4 columns)
Row 1: Pipeline Pulse (2col) | Owner Activity (1col) | Cold Leads (1col)
Row 2: Today's Schedule (2col) | Onboarding Progress (2col)
Row 3: AI Risk Digest (2col) | Allocation Health (1col) | Open Invoices (1col)
Row 4: Recurring Maintenance (2col) | Project Board (1col) | Winback Queue (1col)

### Zone D: Property Health Grid (full-width, denser)
Compact cards: smaller photo (60px), tighter rows, inline AI risk dot per property.

## Widget Roster

| Widget | Size | Data Source | Click Behavior |
|--------|------|-------------|----------------|
| Pipeline Pulse | 2col | contacts lifecycle stages + estimated_mrr | → /admin/contacts?view=lead-pipeline |
| Owner Activity | 1col | contacts.last_activity_at + profiles status | Modal → /admin/owners |
| Cold Leads Alert | 1col | lifecycle_stage = 'lead_cold' | Modal with re-engage actions |
| Today's Schedule | 2col | tasks due today + task_type call/meeting | → /admin/tasks |
| Onboarding Progress | 2col | onboarding contacts + checklist % | → contact detail |
| AI Risk Digest | 2col | ai_insights severity warning/critical | Slide-in InsightDetailPanel |
| Allocation Health | 1col | treasury calculateAllocationHealth() | → /admin/treasury |
| Open Invoices | 1col | invoices status open/draft | → owner detail |
| Recurring Maintenance | 2col | property_task_templates.next_due_at | Modal → /admin/tasks |
| Project Board | 1col | projects by status | → /admin/projects |
| Winback Queue | 1col | winback_agent insights + paused/churned | Modal → contact detail |
| Property Health Grid | full | property_checklist_items | → /admin/properties/[id] |

## Interaction Model
- **List widgets** (cold leads, schedule, maintenance, winback): click row → slide-in detail modal → "Open full page" secondary link inside modal
- **Metric widgets** (allocation health, pipeline pulse): click card → navigate directly to full page
- **AI widgets** (risk digest, briefing): click insight → InsightDetailPanel (already built) → dismiss or navigate to property

## Widget Customization
"Customize" button (top right) opens an overlay with toggle switches for each of the 12 widgets. Default: all on. Preference saved to localStorage key `parcel:dashboard:widgets`. Phase 2: migrate to Supabase user_preferences.

## New Files
- `src/lib/admin/dashboard-v2.ts` — all new data fetchers
- `src/lib/admin/dashboard-briefing.ts` — AI briefing generation
- `src/app/(admin)/admin/WidgetShell.tsx` + `.module.css` — shared card wrapper
- `src/app/(admin)/admin/CommandStrip.tsx` + `.module.css`
- `src/app/(admin)/admin/AIBriefingCard.tsx` + `.module.css`
- `src/app/(admin)/admin/PipelinePulse.tsx` + `.module.css`
- `src/app/(admin)/admin/ColdLeadsWidget.tsx` + `.module.css`
- `src/app/(admin)/admin/OwnerActivityWidget.tsx` + `.module.css`
- `src/app/(admin)/admin/TodayScheduleWidget.tsx` + `.module.css`
- `src/app/(admin)/admin/OnboardingProgressWidget.tsx` + `.module.css`
- `src/app/(admin)/admin/AIRiskDigest.tsx` + `.module.css`
- `src/app/(admin)/admin/AllocationHealthWidget.tsx` + `.module.css`
- `src/app/(admin)/admin/OpenInvoicesWidget.tsx` + `.module.css`
- `src/app/(admin)/admin/RecurringMaintenanceWidget.tsx` + `.module.css`
- `src/app/(admin)/admin/ProjectBoardWidget.tsx` + `.module.css`
- `src/app/(admin)/admin/WinbackQueueWidget.tsx` + `.module.css`
- `src/app/(admin)/admin/DashboardCustomizer.tsx` + `.module.css`
- `src/app/(admin)/admin/page.tsx` — complete rewrite
- `src/app/(admin)/admin/page.module.css` — complete rewrite
