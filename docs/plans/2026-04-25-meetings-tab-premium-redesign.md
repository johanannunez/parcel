# Meetings Tab: Premium Redesign

**Date:** 2026-04-25
**Status:** Approved, ready for implementation

---

## What We're Building

A full replacement of the current inline-expand Meetings tab with a two-panel split layout, Google Meet recording auto-attachment, a Share with Owner preview modal, and a complete post-meeting intelligence workflow.

---

## Layout

Two panels, always side by side. No third column.

**Left panel (280px, fixed, scrollable):**
- Mini calendar (month view, dot indicators by type, today ring, selected date filter)
- Stats strip: 0 / 1 / 3 for This Month / Upcoming / Done
- New Meeting button (full width, brand blue)
- Scrollable meeting list: Upcoming section header + rows, Past section header + rows

**Right panel (fills remaining width):**
- Full meeting detail: title, type pill, date/time/duration, badges, CTA row
- Scrollable body: Notes, Transcript, AI Recap, Action Items
- Fixed footer: Preview & Share + Push to Tasks

Nothing expands inline. Clicking a meeting row in the left panel loads its detail into the right panel. No modals except Share with Owner preview and New Meeting.

---

## Meeting List Rows (left panel)

Each row is compact: icon + title (truncated) + status badge + date. No body text.

Colored left border by meeting type:
- Video call: `#1B77BE` (brand blue)
- Phone call: `#059669` (emerald)
- In person: `#C97820` (amber)

Selected state: matching light background tint + thicker left border.

---

## Detail Panel Anatomy

### Header (fixed, no scroll)

```
[Meeting Title — large, 18px semibold]          [Edit] [Delete]
[Type pill] · [Date/Time] · [Duration] · [Shared|Private] [Countdown]
[Join button]                            [Email sent] [SMS sent]
```

- **Type pill:** colored icon + label, same color system as list border
- **Countdown:** "In 13 days" in blue, "In 2 hours" in amber, "Starting now" pulsing
- **Email/SMS sent:** small green chips shown only if notification was fired
- **Recording row:** replaces or sits beside Join when a recording exists. Shows Drive file name, duration, "Watch" link. Auto-attached (see below).

### Body (scrollable)

1. **Notes & Agenda** — editable textarea, saves on blur
2. **Meeting Transcript** — monospace textarea, placeholder "Paste transcript after the call"
3. **AI Recap box** — gradient blue/warm background, border
   - If no summary: "Generate recap from transcript" button (disabled if no transcript)
   - If summary exists: summary text + action item checklist + Regenerate button
   - After generation: "Intelligence updated" green confirmation chip

### Footer (fixed)

- **Preview & share with [Owner First Name]** — opens Share Recap Modal
- **Push to tasks** — creates one task per uncompleted action item, disables button after

---

## Share with Owner: Preview Modal

Triggered by "Preview & share" button. Opens a centered modal (max 600px wide).

**Sections (top to bottom):**
1. "What Johanan will receive" label
2. Rendered email preview (the actual template HTML, scaled inside an iframe or accurate replica)
3. Editable summary field — pre-filled with `ai_summary`, admin can trim/edit before sending
4. Action items with checkboxes — admin can uncheck items to exclude from the recap
5. Personal note field — optional short message prepended to the email ("Great chatting today!")
6. SMS preview — 1-2 sentence chip showing exactly what the text will say
7. Two buttons: "Send recap" (fires email + SMS, sets visibility=shared) and "Cancel"

After Send: modal closes, "Recap shared with Johanan" chip appears in detail footer, Share button turns green.

---

## Google Meet Recording Auto-Attach

When a meeting has a `calendar_event_id` and is marked complete:

1. Check if the admin has a valid Google Drive token (reuse the existing `google_calendar` connection, which already has Drive scope requested)
2. Call Drive API: `files.list` with query `name contains '[meeting title]' and mimeType='video/mp4' and createdTime > '[scheduledAt minus 30min]'`
3. If a match is found, store the Drive file URL in a new `recording_url` column on `owner_meetings`
4. If no match, silently no-op. Admin can paste a URL manually.
5. Recording row in the detail header renders automatically when `recording_url` is set.

**Drive scope:** Add `https://www.googleapis.com/auth/drive.readonly` to the Google OAuth flow. This requires re-authorization from any admin who has already connected (prompt them in the Settings connect button).

**Manual fallback:** A small "Add recording URL" link below the header for meetings without a recording, opens a 1-field inline input.

---

## Database Changes

```sql
ALTER TABLE owner_meetings
  ADD COLUMN IF NOT EXISTS recording_url text;
```

---

## New Server Actions

- `updateMeetingRecording(meetingId, url)` — stores recording_url, returns updated meeting
- `searchDriveRecording(adminProfileId, scheduledAt, title)` — calls Drive API, returns URL or null
- `shareRecap(meetingId, ownerId, adminId, summaryOverride, excludedActionItemIds, personalNote)` — updates ai_summary if override provided, sets visibility=shared, fires notifyMeetingRecapShared

---

## Modified Files

| File | Change |
|------|--------|
| `MeetingsTab.tsx` | Full rewrite: two-panel layout, left panel with list, right panel with detail |
| `MeetingsTab.module.css` | New layout CSS |
| `MeetingsMiniCal.tsx` | Minor: stats now inline below cal grid, not a separate strip |
| `meetings-actions.ts` | Add `updateMeetingRecording`, `shareRecap`, `searchDriveRecording` |
| `google-calendar.ts` | Add `searchDriveRecording` function, add drive.readonly to OAuth scope |
| `google-calendar/route.ts` | Add drive.readonly scope |
| `client-meetings.ts` | Add `recording_url` to select + ClientMeeting type |

**New files:**
| File | Purpose |
|------|---------|
| `ShareRecapModal.tsx` | Preview + edit modal before sharing with owner |
| `ShareRecapModal.module.css` | Modal styles |

---

## What Is Not Changing

- `CreateMeetingModal.tsx` — already built and working
- `MeetingsMiniCal.tsx` — calendar logic unchanged, minor layout tweak only
- `meeting-emails.ts` — templates unchanged
- `meeting-notifications.ts` — notification logic unchanged
- `toggleActionItem`, `generateMeetingSummary`, `deleteOwnerMeeting` — unchanged

---

## Success Criteria

1. Left panel scrolls independently; right panel scrolls independently
2. Clicking any meeting row loads its detail without page reload
3. Recording row appears automatically on meetings with `recording_url` set
4. "Generate recap" button is disabled until transcript has content
5. Share modal renders editable summary and live SMS preview
6. After sharing: Share button turns green, "Recap shared" chip visible
7. "Push to tasks" creates tasks and disables itself
8. TypeScript passes clean (`pnpm exec tsc --noEmit`)
9. No inline expansion anywhere in the tab
