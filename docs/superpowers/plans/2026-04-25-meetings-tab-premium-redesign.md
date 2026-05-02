# Meetings Tab Premium Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current inline-expand Meetings tab with a two-panel layout (left: calendar + meeting list, right: detail panel), add Google Drive recording auto-attachment, and build a Share with Owner preview modal with editable summary before sending.

**Architecture:** Left panel (280px fixed) holds the MeetingsMiniCal, three stats, New Meeting button, and a compact scrollable meeting list. Clicking a row loads full detail into the right panel via local state (no navigation). `MeetingsDetailPanel` is a new focused component containing all per-meeting actions. `ShareRecapModal` is a new component for the preview-and-edit flow before sending a recap to the owner.

**Tech Stack:** Next.js App Router, React server actions, Supabase, Phosphor Icons, CSS Modules, Google Drive API (files.list), Resend + OpenPhone for notifications.

---

## File Map

| Action | File |
|--------|------|
| Migrate | Supabase: `owner_meetings` add `recording_url text` |
| Modify | `src/lib/admin/client-meetings.ts` — add `recording_url` to type + select |
| Modify | `src/app/(admin)/admin/owners/[entityId]/meetings-actions.ts` — add `shareRecap`, `updateMeetingRecording`, `searchAndAttachRecording` |
| Modify | `src/lib/admin/google-calendar.ts` — add `searchDriveRecording` |
| Modify | `src/app/api/auth/google-calendar/route.ts` — add `drive.readonly` scope |
| Modify | `src/app/(admin)/admin/owners/[entityId]/MeetingsMiniCal.tsx` — accept `compact` prop, expose stats via separate export |
| Rewrite | `src/app/(admin)/admin/owners/[entityId]/MeetingsTab.tsx` — two-panel shell |
| Create | `src/app/(admin)/admin/owners/[entityId]/MeetingsTab.module.css` |
| Create | `src/app/(admin)/admin/owners/[entityId]/MeetingsDetailPanel.tsx` |
| Create | `src/app/(admin)/admin/owners/[entityId]/MeetingsDetailPanel.module.css` |
| Create | `src/app/(admin)/admin/owners/[entityId]/ShareRecapModal.tsx` |
| Create | `src/app/(admin)/admin/owners/[entityId]/ShareRecapModal.module.css` |

---

## Task 1: DB migration + data layer

**Files:**
- Supabase migration (apply via MCP `apply_migration`)
- Modify: `src/lib/admin/client-meetings.ts`
- Modify: `src/app/(admin)/admin/owners/[entityId]/MeetingsTab.tsx` (type only, no layout change yet)

- [ ] **Step 1: Apply DB migration**

Via Supabase MCP `apply_migration` on project `pwoxwpryummqeqsxdgyc`:

```sql
ALTER TABLE owner_meetings
  ADD COLUMN IF NOT EXISTS recording_url text;
```

- [ ] **Step 2: Add `recording_url` to `ClientMeeting` type and select**

In `src/lib/admin/client-meetings.ts`, add `recording_url: string | null` to the `ClientMeeting` type:

```typescript
export type ClientMeeting = {
  id: string;
  title: string;
  scheduled_at: string | null;
  duration_minutes: number | null;
  meet_link: string | null;
  status: string;
  transcript: string | null;
  ai_summary: string | null;
  action_items: Array<{ id: string; text: string; completed: boolean; assignedTo: string | null; pushed?: boolean }>;
  notes: string | null;
  visibility: string;
  property_id: string | null;
  propertyLabel: string | null;
  created_at: string;
  meeting_type: "phone_call" | "video_call" | "in_person";
  calendar_event_id: string | null;
  attendee_ids: string[] | null;
  recording_url: string | null;   // ← add this
};
```

In `fetchClientMeetings`, add `recording_url` to the `.select()` string:

```typescript
const { data, error } = await (supabase as any)
  .from("owner_meetings")
  .select(`
    id, title, scheduled_at, duration_minutes, meet_link,
    status, transcript, ai_summary, action_items, notes, visibility,
    property_id, created_at, meeting_type, calendar_event_id, attendee_ids,
    recording_url,
    property:properties(address_line1, city, state)
  `)
```

In the `.map()` callback, add:
```typescript
recording_url: (row.recording_url as string | null) ?? null,
```

- [ ] **Step 3: Update `Meeting` type in `MeetingsTab.tsx`**

The local `Meeting` type at the top of `MeetingsTab.tsx` (around line 49) must include `recording_url`:

```typescript
type Meeting = {
  id: string;
  title: string;
  scheduled_at: string | null;
  duration_minutes: number | null;
  meet_link: string | null;
  status: string;
  transcript: string | null;
  ai_summary: string | null;
  action_items: ActionItem[];
  notes: string | null;
  visibility: string;
  property_id: string | null;
  propertyLabel: string | null;
  created_at: string;
  meeting_type: "phone_call" | "video_call" | "in_person";
  calendar_event_id: string | null;
  attendee_ids: string[] | null;
  recording_url: string | null;   // ← add this
};
```

Also update the `NewMeeting` type inside `CreateMeetingModal.tsx` to include `recording_url: string | null` and ensure `handleCreated` in `MeetingsTab.tsx` sets `recording_url: null` on newly created meetings.

- [ ] **Step 4: Verify TypeScript**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit 2>&1 | head -30
```

Expected: no output (clean).

- [ ] **Step 5: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/lib/admin/client-meetings.ts \
        apps/web/src/app/\(admin\)/admin/owners/\[entityId\]/MeetingsTab.tsx \
        apps/web/src/app/\(admin\)/admin/owners/\[entityId\]/CreateMeetingModal.tsx
git commit -m "feat(meetings): add recording_url column and data layer"
```

---

## Task 2: Google Drive recording search + OAuth scope

**Files:**
- Modify: `src/lib/admin/google-calendar.ts`
- Modify: `src/app/api/auth/google-calendar/route.ts`

- [ ] **Step 1: Add `drive.readonly` scope to OAuth route**

In `src/app/api/auth/google-calendar/route.ts`, update the `SCOPES` constant:

```typescript
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
].join(" ");
```

Note: Admins who previously connected Google Calendar will need to reconnect via Settings to grant the new Drive scope. The existing token without `drive.readonly` will silently return no results from the Drive search — it will not error out or break existing calendar functionality.

- [ ] **Step 2: Add `searchDriveRecording` to `google-calendar.ts`**

Append this function to the end of `src/lib/admin/google-calendar.ts`:

```typescript
export type DriveRecording = {
  fileId: string;
  fileName: string;
  webViewLink: string;
  durationMs: number | null;
};

/**
 * Searches Google Drive for a Meet recording created within 4 hours of
 * the meeting's scheduled start time. Returns the best match or null.
 * Requires drive.readonly scope on the access token.
 */
export async function searchDriveRecording(
  accessToken: string,
  scheduledAt: string,
  _title: string,
): Promise<DriveRecording | null> {
  const scheduled = new Date(scheduledAt);
  // Search window: 30 min before to 4 hours after scheduled start
  const windowStart = new Date(scheduled.getTime() - 30 * 60 * 1000).toISOString();
  const windowEnd = new Date(scheduled.getTime() + 4 * 60 * 60 * 1000).toISOString();

  const q = [
    `(mimeType='video/mp4' or mimeType='video/webm')`,
    `createdTime >= '${windowStart}'`,
    `createdTime <= '${windowEnd}'`,
  ].join(" and ");

  const params = new URLSearchParams({
    q,
    fields: "files(id,name,webViewLink,videoMediaMetadata)",
    orderBy: "createdTime desc",
    pageSize: "5",
  });

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) return null;

  const json = (await res.json()) as {
    files?: Array<{
      id: string;
      name: string;
      webViewLink: string;
      videoMediaMetadata?: { durationMillis?: string };
    }>;
  };

  const files = json.files ?? [];
  if (files.length === 0) return null;

  // Prefer files with "Meet" or "Recording" in the name
  const best =
    files.find((f) =>
      /meet|recording/i.test(f.name),
    ) ?? files[0];

  return {
    fileId: best.id,
    fileName: best.name,
    webViewLink: best.webViewLink,
    durationMs: best.videoMediaMetadata?.durationMillis
      ? parseInt(best.videoMediaMetadata.durationMillis, 10)
      : null,
  };
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit 2>&1 | head -20
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/lib/admin/google-calendar.ts \
        apps/web/src/app/api/auth/google-calendar/route.ts
git commit -m "feat(meetings): add Drive recording search + drive.readonly OAuth scope"
```

---

## Task 3: New server actions

**Files:**
- Modify: `src/app/(admin)/admin/owners/[entityId]/meetings-actions.ts`

Add three new exports after the existing `deleteOwnerMeeting` function.

- [ ] **Step 1: Add `updateMeetingRecording` action**

```typescript
export async function updateMeetingRecording(
  meetingId: string,
  ownerId: string,
  recordingUrl: string | null,
): Promise<{ ok: boolean; message: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };

  const { error } = await (supabase as any)
    .from("owner_meetings")
    .update({ recording_url: recordingUrl, updated_at: new Date().toISOString() })
    .eq("id", meetingId)
    .eq("owner_id", ownerId);

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/admin/owners/${ownerId}`);
  return { ok: true, message: "Recording attached." };
}
```

- [ ] **Step 2: Add `searchAndAttachRecording` action**

```typescript
export async function searchAndAttachRecording(
  meetingId: string,
  ownerId: string,
  scheduledAt: string,
  title: string,
): Promise<{ ok: boolean; recordingUrl: string | null; message: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, recordingUrl: null, message: authError };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, recordingUrl: null, message: "Not signed in." };

  try {
    const { getValidAccessToken, searchDriveRecording } = await import(
      "@/lib/admin/google-calendar"
    );
    const accessToken = await getValidAccessToken(user.id);
    if (!accessToken) return { ok: true, recordingUrl: null, message: "No calendar connection." };

    const recording = await searchDriveRecording(accessToken, scheduledAt, title);
    if (!recording) return { ok: true, recordingUrl: null, message: "No recording found." };

    await (supabase as any)
      .from("owner_meetings")
      .update({ recording_url: recording.webViewLink, updated_at: new Date().toISOString() })
      .eq("id", meetingId)
      .eq("owner_id", ownerId);

    revalidatePath(`/admin/owners/${ownerId}`);
    return { ok: true, recordingUrl: recording.webViewLink, message: "Recording attached." };
  } catch {
    return { ok: true, recordingUrl: null, message: "Recording search failed silently." };
  }
}
```

- [ ] **Step 3: Add `shareRecap` action**

This replaces the manual flow of toggling visibility and separately firing a notification. It updates the summary (if an override is provided), sets visibility to shared, and fires the recap notification with the exact summary the admin approved.

```typescript
export async function shareRecap(
  meetingId: string,
  ownerId: string,
  opts: {
    summaryOverride?: string;
    excludedItemIds?: string[];
    personalNote?: string;
  },
): Promise<{ ok: boolean; message: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { ok: false, message: authError };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  // Fetch current meeting for notification data
  const { data: meeting, error: fetchError } = await (supabase as any)
    .from("owner_meetings")
    .select("title, scheduled_at, ai_summary, action_items, visibility")
    .eq("id", meetingId)
    .eq("owner_id", ownerId)
    .single();

  if (fetchError || !meeting) return { ok: false, message: "Meeting not found." };

  const finalSummary: string = opts.summaryOverride ?? (meeting.ai_summary as string) ?? "";
  const allItems: ActionItem[] = Array.isArray(meeting.action_items)
    ? (meeting.action_items as ActionItem[])
    : [];
  const includedItems = opts.excludedItemIds?.length
    ? allItems.filter((item) => !opts.excludedItemIds!.includes(item.id))
    : allItems;

  const patch: Record<string, unknown> = {
    visibility: "shared",
    updated_at: new Date().toISOString(),
  };
  if (opts.summaryOverride !== undefined) patch.ai_summary = opts.summaryOverride;

  const { error } = await (supabase as any)
    .from("owner_meetings")
    .update(patch)
    .eq("id", meetingId)
    .eq("owner_id", ownerId);

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/admin/owners/${ownerId}`);
  revalidatePath("/portal/meetings");

  notifyMeetingRecapShared(ownerId, user.id, {
    title: meeting.title as string,
    scheduledAt: (meeting.scheduled_at as string | null) ?? null,
    aiSummary: finalSummary,
    actionItems: includedItems,
    personalNote: opts.personalNote,
  }).catch(() => {});

  return { ok: true, message: "Recap shared." };
}
```

- [ ] **Step 4: Add `personalNote` to `MeetingRecapData` in `meeting-emails.ts`**

In `src/lib/admin/meeting-emails.ts`, update the `MeetingRecapData` type to accept an optional `personalNote`:

```typescript
export type MeetingRecapData = {
  ownerFirstName: string;
  title: string;
  scheduledAt: string | null;
  aiSummary: string;
  actionItems: Array<{ text: string; completed: boolean }>;
  personalNote?: string;   // ← add
};
```

In `buildMeetingRecapEmail`, render the personal note above the summary block when present. Find the section that renders the greeting and add after `greeting()`:

```typescript
// Inside buildMeetingRecapEmail, before the summary section:
const noteBlock = data.personalNote
  ? `<p style="font-size:15px;line-height:1.6;color:#3D3B38;margin:0 0 16px;">${data.personalNote}</p>`
  : "";
```

Then include `noteBlock` before the `<p>` that renders `data.aiSummary` in the HTML template.

Also update `notifyMeetingRecapShared` in `meeting-notifications.ts` to pass `personalNote` through to `buildMeetingRecapEmail`:

```typescript
// In notifyMeetingRecapShared signature:
data: Omit<MeetingRecapData, "ownerFirstName">
// personalNote is already part of MeetingRecapData so it flows through automatically
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit 2>&1 | head -30
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/app/\(admin\)/admin/owners/\[entityId\]/meetings-actions.ts \
        apps/web/src/lib/admin/meeting-emails.ts \
        apps/web/src/lib/admin/meeting-notifications.ts
git commit -m "feat(meetings): add shareRecap, updateMeetingRecording, searchAndAttachRecording actions"
```

---

## Task 4: ShareRecapModal component

**Files:**
- Create: `src/app/(admin)/admin/owners/[entityId]/ShareRecapModal.tsx`
- Create: `src/app/(admin)/admin/owners/[entityId]/ShareRecapModal.module.css`

- [ ] **Step 1: Create `ShareRecapModal.module.css`**

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(28, 26, 24, 0.45);
  backdrop-filter: blur(2px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.modal {
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18), 0 4px 16px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 580px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--color-warm-gray-100);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.headerTitle {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.closeBtn {
  width: 28px;
  height: 28px;
  border: 1px solid var(--color-warm-gray-200);
  border-radius: 6px;
  background: var(--color-warm-gray-50);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
}

.closeBtn:hover {
  background: var(--color-warm-gray-100);
  color: var(--color-text-primary);
}

.body {
  flex: 1;
  overflow-y: auto;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sectionLabel {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  margin-bottom: 6px;
}

/* Email preview */
.emailPreview {
  border: 1px solid var(--color-warm-gray-200);
  border-radius: 10px;
  overflow: hidden;
  background: #f8f7f5;
}

.emailPreviewHeader {
  background: var(--color-brand);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.emailPreviewLogo {
  font-size: 13px;
  font-weight: 800;
  color: white;
  letter-spacing: -0.02em;
}

.emailPreviewLabel {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255,255,255,0.7);
  background: rgba(255,255,255,0.15);
  padding: 2px 8px;
  border-radius: 20px;
}

.emailPreviewBody {
  padding: 16px 20px;
}

.emailPreviewGreeting {
  font-size: 13px;
  color: #3D3B38;
  margin-bottom: 8px;
}

.emailPreviewNote {
  font-size: 12px;
  color: #5C5955;
  font-style: italic;
  margin-bottom: 10px;
  padding: 8px 12px;
  background: #EFF6FF;
  border-radius: 6px;
  border-left: 3px solid var(--color-brand);
}

.emailPreviewSummary {
  font-size: 12px;
  color: #5C5955;
  line-height: 1.6;
  margin-bottom: 10px;
}

.emailPreviewItem {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 11px;
  color: #5C5955;
  margin-bottom: 4px;
}

.emailPreviewItemDot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  border: 1.5px solid var(--color-brand);
  margin-top: 3px;
  flex-shrink: 0;
}

/* Editable fields */
.summaryArea {
  width: 100%;
  border: 1px solid var(--color-warm-gray-200);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  font-family: inherit;
  color: var(--color-text-primary);
  resize: none;
  line-height: 1.55;
  background: var(--color-warm-gray-50);
  transition: border-color 0.15s;
}

.summaryArea:focus {
  outline: none;
  border-color: var(--color-brand);
  background: #ffffff;
}

.noteArea {
  width: 100%;
  border: 1px solid var(--color-warm-gray-200);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  font-family: inherit;
  color: var(--color-text-primary);
  resize: none;
  line-height: 1.55;
  background: var(--color-warm-gray-50);
  transition: border-color 0.15s;
}

.noteArea:focus {
  outline: none;
  border-color: var(--color-brand);
  background: #ffffff;
}

/* Action items toggle list */
.actionList {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.actionToggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-text-primary);
  cursor: pointer;
  padding: 4px 0;
}

.actionToggle input[type="checkbox"] {
  width: 13px;
  height: 13px;
  accent-color: var(--color-brand);
  flex-shrink: 0;
  cursor: pointer;
}

.actionToggle.excluded {
  color: var(--color-text-tertiary);
  text-decoration: line-through;
}

/* SMS preview */
.smsPreview {
  background: var(--color-warm-gray-100);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.smsBubble {
  display: inline-block;
  background: #1B77BE;
  color: white;
  border-radius: 14px 14px 4px 14px;
  padding: 8px 12px;
  font-size: 12px;
  max-width: 90%;
  line-height: 1.5;
}

/* Error */
.errorRow {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #DC2626;
  padding: 8px 12px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 7px;
}

/* Footer */
.footer {
  padding: 14px 20px;
  border-top: 1px solid var(--color-warm-gray-100);
  display: flex;
  gap: 8px;
}

.cancelBtn {
  padding: 9px 18px;
  border: 1px solid var(--color-warm-gray-200);
  border-radius: 8px;
  background: white;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: inherit;
}

.cancelBtn:hover {
  background: var(--color-warm-gray-50);
}

.sendBtn {
  flex: 1;
  padding: 9px 18px;
  background: var(--color-brand);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background 0.15s;
}

.sendBtn:hover:not(:disabled) {
  background: #155F9E;
}

.sendBtn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.divider {
  height: 1px;
  background: var(--color-warm-gray-100);
}
```

- [ ] **Step 2: Create `ShareRecapModal.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import { X, Check, Warning, PaperPlaneRight } from "@phosphor-icons/react";
import { shareRecap } from "./meetings-actions";
import styles from "./ShareRecapModal.module.css";

type ActionItem = {
  id: string;
  text: string;
  completed: boolean;
  assignedTo: string | null;
};

type Props = {
  meetingId: string;
  ownerId: string;
  ownerFirstName: string;
  title: string;
  scheduledAt: string | null;
  aiSummary: string;
  actionItems: ActionItem[];
  phone: string | null;
  onClose: () => void;
  onShared: (updatedSummary: string) => void;
};

function formatDateShort(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function ShareRecapModal({
  meetingId,
  ownerId,
  ownerFirstName,
  title,
  scheduledAt,
  aiSummary,
  actionItems,
  phone,
  onClose,
  onShared,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState(aiSummary);
  const [personalNote, setPersonalNote] = useState("");
  const [excludedIds, setExcludedIds] = useState<string[]>([]);

  function toggleItem(id: string) {
    setExcludedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  const includedItems = actionItems.filter((a) => !excludedIds.includes(a.id));

  const smsPreview = (() => {
    const suffix = " - Parcel";
    const dateStr = scheduledAt ? ` from ${formatDateShort(scheduledAt)}` : "";
    const body = `Hi ${ownerFirstName}! Your meeting recap${dateStr} is ready. ${summary.slice(0, 80)}${summary.length > 80 ? "…" : ""}`;
    const max = 155 - suffix.length;
    return (body.length > max ? body.slice(0, max - 1) + "…" : body) + suffix;
  })();

  function handleSend() {
    setError(null);
    startTransition(async () => {
      const res = await shareRecap(meetingId, ownerId, {
        summaryOverride: summary !== aiSummary ? summary : undefined,
        excludedItemIds: excludedIds.length > 0 ? excludedIds : undefined,
        personalNote: personalNote.trim() || undefined,
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      onShared(summary);
    });
  }

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.headerTitle}>Preview recap for {ownerFirstName}</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={14} weight="bold" />
          </button>
        </div>

        <div className={styles.body}>
          {/* Email preview */}
          <div>
            <div className={styles.sectionLabel}>Email preview</div>
            <div className={styles.emailPreview}>
              <div className={styles.emailPreviewHeader}>
                <span className={styles.emailPreviewLogo}>Parcel</span>
                <span className={styles.emailPreviewLabel}>Meeting Recap</span>
              </div>
              <div className={styles.emailPreviewBody}>
                <div className={styles.emailPreviewGreeting}>
                  Hi {ownerFirstName},
                </div>
                {personalNote.trim() && (
                  <div className={styles.emailPreviewNote}>{personalNote}</div>
                )}
                <div className={styles.emailPreviewSummary}>
                  {summary || <em style={{ color: "var(--color-text-tertiary)" }}>No summary yet</em>}
                </div>
                {includedItems.length > 0 && (
                  <div>
                    {includedItems.map((item) => (
                      <div key={item.id} className={styles.emailPreviewItem}>
                        <div className={styles.emailPreviewItemDot} />
                        {item.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Edit summary */}
          <div>
            <div className={styles.sectionLabel}>Edit summary before sending</div>
            <textarea
              className={styles.summaryArea}
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          {/* Personal note */}
          <div>
            <div className={styles.sectionLabel}>Personal note (optional)</div>
            <textarea
              className={styles.noteArea}
              rows={2}
              value={personalNote}
              onChange={(e) => setPersonalNote(e.target.value)}
              placeholder={`Great catching up, ${ownerFirstName}! Here's a recap of what we covered…`}
            />
          </div>

          {/* Action items toggle */}
          {actionItems.length > 0 && (
            <div>
              <div className={styles.sectionLabel}>Include action items</div>
              <div className={styles.actionList}>
                {actionItems.map((item) => {
                  const excluded = excludedIds.includes(item.id);
                  return (
                    <label key={item.id} className={[styles.actionToggle, excluded ? styles.excluded : ""].join(" ")}>
                      <input
                        type="checkbox"
                        checked={!excluded}
                        onChange={() => toggleItem(item.id)}
                      />
                      {item.text}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className={styles.divider} />

          {/* SMS preview */}
          {phone && (
            <div>
              <div className={styles.sectionLabel}>SMS preview ({phone})</div>
              <div className={styles.smsPreview}>
                <div className={styles.smsBubble}>{smsPreview}</div>
              </div>
            </div>
          )}

          {error && (
            <div className={styles.errorRow}>
              <Warning size={13} weight="fill" />
              {error}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={isPending || !summary.trim()}
          >
            <PaperPlaneRight size={13} weight="fill" />
            {isPending ? "Sending…" : `Send recap to ${ownerFirstName}`}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit 2>&1 | head -20
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/app/\(admin\)/admin/owners/\[entityId\]/ShareRecapModal.tsx \
        apps/web/src/app/\(admin\)/admin/owners/\[entityId\]/ShareRecapModal.module.css
git commit -m "feat(meetings): add ShareRecapModal with editable summary, action items, SMS preview"
```

---

## Task 5: MeetingsDetailPanel component

**Files:**
- Create: `src/app/(admin)/admin/owners/[entityId]/MeetingsDetailPanel.tsx`
- Create: `src/app/(admin)/admin/owners/[entityId]/MeetingsDetailPanel.module.css`

This component replaces the old `MeetingCard` inline-expand pattern. It takes the selected meeting and owns all per-meeting actions.

- [ ] **Step 1: Create `MeetingsDetailPanel.module.css`**

```css
.panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  overflow: hidden;
}

/* Empty state */
.empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--color-warm-gray-300);
}

.emptyIcon {
  opacity: 0.4;
}

.emptyText {
  font-size: 13px;
  color: var(--color-text-tertiary);
}

/* Header */
.header {
  padding: 18px 22px 14px;
  border-bottom: 1px solid var(--color-warm-gray-100);
  flex-shrink: 0;
}

.titleRow {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.3;
  flex: 1;
  min-width: 0;
}

.titleInput {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.3;
  flex: 1;
  min-width: 0;
  border: 1px solid var(--color-brand);
  border-radius: 6px;
  padding: 2px 6px;
  font-family: inherit;
  background: #ffffff;
  outline: none;
}

.actionGroup {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.iconBtn {
  width: 30px;
  height: 30px;
  border: 1px solid var(--color-warm-gray-200);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text-tertiary);
  background: #ffffff;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}

.iconBtn:hover {
  border-color: var(--color-warm-gray-300);
  color: var(--color-text-primary);
  background: var(--color-warm-gray-50);
}

.iconBtn.danger:hover {
  border-color: #FCA5A5;
  color: #DC2626;
  background: #FEF2F2;
}

.iconBtn.confirm {
  border-color: #FCA5A5;
  color: #DC2626;
  background: #FEF2F2;
}

/* Meta row */
.metaRow {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.typePill {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.typePillVideo {
  background: #EFF6FF;
  color: var(--color-brand);
}

.typePillPhone {
  background: #ECFDF5;
  color: #059669;
}

.typePillInPerson {
  background: #FEF9EC;
  color: #C97820;
}

.metaDot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--color-warm-gray-300);
  flex-shrink: 0;
}

.metaChip {
  font-size: 11px;
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
  gap: 3px;
}

.sharedBadge {
  font-size: 10px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 20px;
  background: #EFF6FF;
  color: var(--color-brand);
  border: 1px solid #DBEAFE;
}

.privateBadge {
  font-size: 10px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 20px;
  background: var(--color-warm-gray-100);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-warm-gray-200);
}

.countdown {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
}

.countdownUpcoming {
  background: #EFF6FF;
  color: var(--color-brand);
}

.countdownSoon {
  background: #FEF9EC;
  color: #C97820;
}

.countdownNow {
  background: var(--color-brand);
  color: white;
}

/* CTA row */
.ctaRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.joinBtn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--color-brand);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  text-decoration: none;
  transition: background 0.15s;
}

.joinBtn:hover {
  background: #155F9E;
}

.notifRow {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.notifChip {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 20px;
  background: #F0FDF4;
  color: #059669;
  border: 1px solid #BBF7D0;
}

/* Recording */
.recordingRow {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  background: var(--color-warm-gray-50);
  border: 1px solid var(--color-warm-gray-200);
  border-radius: 8px;
  margin-top: 10px;
}

.recordingThumb {
  width: 40px;
  height: 28px;
  background: #12100E;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: rgba(255,255,255,0.6);
}

.recordingInfo {
  flex: 1;
  min-width: 0;
}

.recordingName {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recordingMeta {
  font-size: 10px;
  color: var(--color-text-tertiary);
  margin-top: 1px;
}

.recordingWatch {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-brand);
  border: 1px solid #DBEAFE;
  padding: 4px 10px;
  border-radius: 6px;
  background: #EFF6FF;
  white-space: nowrap;
  text-decoration: none;
  flex-shrink: 0;
}

.recordingWatch:hover {
  background: #DBEAFE;
}

.addRecordingLink {
  font-size: 11px;
  color: var(--color-text-tertiary);
  text-decoration: underline;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  margin-top: 8px;
  display: inline-block;
}

.addRecordingInput {
  margin-top: 8px;
  display: flex;
  gap: 6px;
}

.addRecordingField {
  flex: 1;
  border: 1px solid var(--color-warm-gray-200);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  font-family: inherit;
  color: var(--color-text-primary);
  background: var(--color-warm-gray-50);
}

.addRecordingField:focus {
  outline: none;
  border-color: var(--color-brand);
  background: #ffffff;
}

.addRecordingBtn {
  padding: 6px 12px;
  background: var(--color-brand);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

/* Body */
.body {
  flex: 1;
  overflow-y: auto;
  padding: 18px 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sectionLabel {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  margin-bottom: 6px;
}

.notesArea {
  width: 100%;
  border: 1px solid var(--color-warm-gray-200);
  border-radius: 8px;
  padding: 10px 13px;
  font-size: 13px;
  font-family: inherit;
  color: var(--color-text-primary);
  resize: none;
  line-height: 1.55;
  background: var(--color-warm-gray-50);
  transition: border-color 0.15s, background 0.15s;
}

.notesArea:focus {
  outline: none;
  border-color: var(--color-brand);
  background: #ffffff;
}

.transcriptArea {
  width: 100%;
  border: 1px solid var(--color-warm-gray-200);
  border-radius: 8px;
  padding: 10px 13px;
  font-size: 12px;
  font-family: 'Courier New', monospace;
  color: var(--color-text-secondary);
  resize: none;
  line-height: 1.65;
  background: var(--color-warm-gray-50);
  height: 110px;
  transition: border-color 0.15s, background 0.15s;
}

.transcriptArea:focus {
  outline: none;
  border-color: var(--color-brand);
  background: #ffffff;
}

.saveTranscriptBtn {
  margin-top: 6px;
  padding: 5px 12px;
  background: var(--color-brand);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

/* AI Recap box */
.aiBox {
  background: linear-gradient(135deg, #F0F9FF 0%, #F8F7F5 100%);
  border: 1px solid #BAE6FD;
  border-radius: 10px;
  padding: 13px 15px;
}

.aiHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.aiLabel {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-brand);
  letter-spacing: 0.02em;
}

.aiRegen {
  font-size: 10px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 2px 7px;
  border: 1px solid var(--color-warm-gray-200);
  border-radius: 4px;
  background: white;
  font-family: inherit;
}

.aiRegen:hover {
  color: var(--color-brand);
  border-color: #DBEAFE;
}

.aiHint {
  font-size: 10px;
  color: var(--color-text-tertiary);
  font-style: italic;
}

.aiSummaryText {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.65;
  margin-bottom: 12px;
}

.aiGenerateBtn {
  width: 100%;
  padding: 9px;
  border: 1px dashed #DBEAFE;
  border-radius: 7px;
  background: transparent;
  font-size: 12px;
  color: var(--color-brand);
  cursor: pointer;
  font-family: inherit;
  font-weight: 500;
}

.aiGenerateBtn:hover:not(:disabled) {
  background: #EFF6FF;
}

.aiGenerateBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.actionItems {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 10px;
}

.actionItem {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-text-primary);
}

.actionItem input[type="checkbox"] {
  width: 13px;
  height: 13px;
  accent-color: var(--color-brand);
  flex-shrink: 0;
}

.actionItemDone {
  color: var(--color-text-tertiary);
  text-decoration: line-through;
}

.intelligenceTag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: #059669;
  padding: 3px 8px;
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  border-radius: 20px;
  margin-top: 6px;
}

.errorText {
  font-size: 11px;
  color: #DC2626;
  margin-top: 4px;
}

.divider {
  height: 1px;
  background: var(--color-warm-gray-100);
}

/* Footer */
.footer {
  padding: 13px 22px;
  border-top: 1px solid var(--color-warm-gray-100);
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.shareBtn {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid var(--color-warm-gray-200);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  background: white;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}

.shareBtn:hover {
  border-color: var(--color-brand);
  color: var(--color-brand);
  background: #EFF6FF;
}

.shareBtnShared {
  border-color: #BBF7D0;
  color: #059669;
  background: #F0FDF4;
}

.shareBtnShared:hover {
  border-color: #059669;
  color: #059669;
  background: #DCFCE7;
}

.tasksBtn {
  flex: 1;
  padding: 10px 16px;
  background: var(--color-text-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  transition: background 0.15s;
}

.tasksBtn:hover:not(:disabled) {
  background: var(--color-warm-gray-700);
}

.tasksBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

- [ ] **Step 2: Create `MeetingsDetailPanel.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import {
  VideoCamera,
  Phone,
  MapPin,
  ArrowSquareOut,
  Sparkle,
  Check,
  Trash,
  NotePencil,
  CheckCircle,
  Circle,
  Envelope,
  DeviceMobile,
} from "@phosphor-icons/react";
import type { AdminProfile } from "@/app/(admin)/admin/clients/[id]/client-actions";
import {
  updateOwnerMeeting,
  deleteOwnerMeeting,
  generateMeetingSummary,
  toggleActionItem,
  pushMeetingTasksToContact,
  searchAndAttachRecording,
  updateMeetingRecording,
} from "./meetings-actions";
import { ShareRecapModal } from "./ShareRecapModal";
import styles from "./MeetingsDetailPanel.module.css";

type ActionItem = {
  id: string;
  text: string;
  completed: boolean;
  assignedTo: string | null;
  pushed?: boolean;
};

type Meeting = {
  id: string;
  title: string;
  scheduled_at: string | null;
  duration_minutes: number | null;
  meet_link: string | null;
  status: string;
  transcript: string | null;
  ai_summary: string | null;
  action_items: ActionItem[];
  notes: string | null;
  visibility: string;
  property_id: string | null;
  propertyLabel: string | null;
  created_at: string;
  meeting_type: "phone_call" | "video_call" | "in_person";
  calendar_event_id: string | null;
  attendee_ids: string[] | null;
  recording_url: string | null;
};

type Props = {
  meeting: Meeting | null;
  ownerId: string;
  ownerFirstName: string;
  ownerPhone: string | null;
  contactId?: string;
  adminProfiles?: AdminProfile[];
  onUpdated: (partial: Partial<Meeting> & { id: string }) => void;
  onDeleted: (id: string) => void;
};

const TYPE_CONFIG = {
  phone_call: { label: "Phone Call", icon: <Phone size={11} weight="fill" />, pillClass: styles.typePillPhone },
  video_call: { label: "Video Call", icon: <VideoCamera size={11} weight="fill" />, pillClass: styles.typePillVideo },
  in_person: { label: "In Person", icon: <MapPin size={11} weight="fill" />, pillClass: styles.typePillInPerson },
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "No date set";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function durationLabel(mins: number | null): string {
  if (!mins) return "";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function countdownLabel(scheduledAt: string | null): { text: string; cls: string } | null {
  if (!scheduledAt) return null;
  const diff = new Date(scheduledAt).getTime() - Date.now();
  if (diff < 0) return null;
  const hours = diff / 3600000;
  const days = Math.floor(diff / 86400000);
  if (hours < 2) return { text: "Starting soon", cls: styles.countdownNow };
  if (hours < 24) return { text: `In ${Math.round(hours)}h`, cls: styles.countdownSoon };
  return { text: `In ${days} day${days !== 1 ? "s" : ""}`, cls: styles.countdownUpcoming };
}

export function MeetingsDetailPanel({
  meeting,
  ownerId,
  ownerFirstName,
  ownerPhone,
  contactId,
  onUpdated,
  onDeleted,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [notesDraft, setNotesDraft] = useState(meeting?.notes ?? "");
  const [transcriptDraft, setTranscriptDraft] = useState(meeting?.transcript ?? "");
  const [transcriptDirty, setTranscriptDirty] = useState(false);
  const [tasksPushed, setTasksPushed] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(meeting?.title ?? "");
  const [addingRecording, setAddingRecording] = useState(false);
  const [recordingDraft, setRecordingDraft] = useState("");

  // Reset local draft state when meeting changes (handled via key={meeting.id} on parent)

  if (!meeting) {
    return (
      <div className={styles.panel}>
        <div className={styles.empty}>
          <VideoCamera size={32} weight="thin" className={styles.emptyIcon} />
          <p className={styles.emptyText}>Select a meeting to view details</p>
        </div>
      </div>
    );
  }

  const typeConfig = TYPE_CONFIG[meeting.meeting_type];
  const countdown = countdownLabel(meeting.scheduled_at);
  const isUpcoming = meeting.status === "scheduled";
  const hasRecording = !!meeting.recording_url;
  const canGenerate = !!(meeting.transcript?.trim());

  function doAction(key: string, fn: () => Promise<void>) {
    setActionPending(key);
    setError(null);
    startTransition(async () => {
      await fn();
      setActionPending(null);
    });
  }

  function handleTitleSave() {
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === meeting.title) { setEditingTitle(false); setTitleDraft(meeting.title); return; }
    doAction("title", async () => {
      const res = await updateOwnerMeeting(meeting.id, ownerId, { title: trimmed });
      if (!res.ok) { setError(res.message); setTitleDraft(meeting.title); }
      else onUpdated({ id: meeting.id, title: trimmed });
      setEditingTitle(false);
    });
  }

  function handleNotesSave() {
    const trimmed = notesDraft.trim();
    if (trimmed === (meeting.notes ?? "")) return;
    doAction("notes", async () => {
      const res = await updateOwnerMeeting(meeting.id, ownerId, { notes: trimmed || null });
      if (!res.ok) setError(res.message);
      else onUpdated({ id: meeting.id, notes: trimmed || null });
    });
  }

  function handleTranscriptSave() {
    doAction("transcript", async () => {
      const res = await updateOwnerMeeting(meeting.id, ownerId, { transcript: transcriptDraft.trim() || null });
      if (!res.ok) setError(res.message);
      else { onUpdated({ id: meeting.id, transcript: transcriptDraft.trim() || null }); setTranscriptDirty(false); }
    });
  }

  function handleStatusToggle() {
    const newStatus = isUpcoming ? "completed" : "scheduled";
    doAction("status", async () => {
      const res = await updateOwnerMeeting(meeting.id, ownerId, { status: newStatus as "scheduled" | "completed" });
      if (!res.ok) { setError(res.message); return; }
      onUpdated({ id: meeting.id, status: newStatus });
      // Auto-search for recording when marking complete
      if (newStatus === "completed" && meeting.calendar_event_id && meeting.scheduled_at) {
        const rec = await searchAndAttachRecording(meeting.id, ownerId, meeting.scheduled_at, meeting.title);
        if (rec.recordingUrl) onUpdated({ id: meeting.id, recording_url: rec.recordingUrl });
      }
    });
  }

  function handleDelete() {
    doAction("delete", async () => {
      const res = await deleteOwnerMeeting(meeting.id, ownerId);
      if (!res.ok) { setError(res.message); setDeleteConfirm(false); }
      else onDeleted(meeting.id);
    });
  }

  function handleGenerateSummary() {
    doAction("summary", async () => {
      const res = await generateMeetingSummary(meeting.id, ownerId);
      if (!res.ok) setError(res.message);
      else onUpdated({ id: meeting.id, ai_summary: res.summary ?? null, action_items: res.actionItems ?? meeting.action_items });
    });
  }

  function handleToggleItem(itemId: string, completed: boolean) {
    doAction(`item-${itemId}`, async () => {
      const res = await toggleActionItem(meeting.id, ownerId, itemId, completed);
      if (!res.ok) setError(res.message);
      else {
        const updated = meeting.action_items.map((a) => a.id === itemId ? { ...a, completed } : a);
        onUpdated({ id: meeting.id, action_items: updated });
      }
    });
  }

  function handlePushTasks() {
    if (!contactId) return;
    doAction("tasks", async () => {
      const res = await pushMeetingTasksToContact(meeting.id, ownerId, contactId);
      if (!res.ok) setError(res.message);
      else setTasksPushed(true);
    });
  }

  function handleAddRecording() {
    const url = recordingDraft.trim();
    if (!url) return;
    doAction("recording", async () => {
      const res = await updateMeetingRecording(meeting.id, ownerId, url);
      if (!res.ok) setError(res.message);
      else { onUpdated({ id: meeting.id, recording_url: url }); setAddingRecording(false); setRecordingDraft(""); }
    });
  }

  const uncompleted = meeting.action_items.filter((a) => !a.completed);

  return (
    <>
      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleRow}>
            {editingTitle ? (
              <input
                className={styles.titleInput}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => { if (e.key === "Enter") handleTitleSave(); if (e.key === "Escape") { setEditingTitle(false); setTitleDraft(meeting.title); } }}
                autoFocus
              />
            ) : (
              <h2 className={styles.title}>{meeting.title}</h2>
            )}
            <div className={styles.actionGroup}>
              <button
                className={styles.iconBtn}
                title={isUpcoming ? "Mark complete" : "Mark as upcoming"}
                onClick={handleStatusToggle}
                disabled={actionPending === "status"}
              >
                {isUpcoming ? <Circle size={14} weight="regular" /> : <CheckCircle size={14} weight="fill" style={{ color: "#059669" }} />}
              </button>
              <button className={styles.iconBtn} title="Edit title" onClick={() => { setEditingTitle(true); setTitleDraft(meeting.title); }}>
                <NotePencil size={14} weight="regular" />
              </button>
              {deleteConfirm ? (
                <button className={[styles.iconBtn, styles.confirm].join(" ")} title="Confirm delete" onClick={handleDelete} disabled={actionPending === "delete"}>
                  <Trash size={14} weight="fill" />
                </button>
              ) : (
                <button className={[styles.iconBtn, styles.danger].join(" ")} title="Delete meeting" onClick={() => setDeleteConfirm(true)}>
                  <Trash size={14} weight="regular" />
                </button>
              )}
            </div>
          </div>

          {/* Meta row */}
          <div className={styles.metaRow}>
            <div className={[styles.typePill, typeConfig.pillClass].join(" ")}>
              {typeConfig.icon}
              {typeConfig.label}
            </div>
            {meeting.scheduled_at && (
              <>
                <div className={styles.metaDot} />
                <span className={styles.metaChip}>{formatDateTime(meeting.scheduled_at)}</span>
              </>
            )}
            {meeting.duration_minutes && (
              <>
                <div className={styles.metaDot} />
                <span className={styles.metaChip}>{durationLabel(meeting.duration_minutes)}</span>
              </>
            )}
            <div className={styles.metaDot} />
            <span className={meeting.visibility === "shared" ? styles.sharedBadge : styles.privateBadge}>
              {meeting.visibility === "shared" ? "Shared" : "Private"}
            </span>
            {countdown && (
              <span className={[styles.countdown, countdown.cls].join(" ")}>{countdown.text}</span>
            )}
          </div>

          {/* CTA row */}
          <div className={styles.ctaRow}>
            {meeting.meet_link ? (
              <a href={meeting.meet_link} target="_blank" rel="noreferrer" className={styles.joinBtn}>
                <ArrowSquareOut size={12} weight="bold" />
                Join meeting
              </a>
            ) : <div />}
            <div className={styles.notifRow}>
              {meeting.visibility === "shared" && (
                <>
                  <span className={styles.notifChip}><Envelope size={10} weight="fill" />Email sent</span>
                  {ownerPhone && <span className={styles.notifChip}><DeviceMobile size={10} weight="fill" />SMS sent</span>}
                </>
              )}
            </div>
          </div>

          {/* Recording */}
          {hasRecording ? (
            <div className={styles.recordingRow}>
              <div className={styles.recordingThumb}>
                <VideoCamera size={14} weight="fill" />
              </div>
              <div className={styles.recordingInfo}>
                <div className={styles.recordingName}>{meeting.recording_url}</div>
                <div className={styles.recordingMeta}>Google Drive · Auto-attached</div>
              </div>
              <a href={meeting.recording_url!} target="_blank" rel="noreferrer" className={styles.recordingWatch}>
                Watch ↗
              </a>
            </div>
          ) : (
            <>
              {addingRecording ? (
                <div className={styles.addRecordingInput}>
                  <input
                    className={styles.addRecordingField}
                    type="url"
                    placeholder="https://drive.google.com/…"
                    value={recordingDraft}
                    onChange={(e) => setRecordingDraft(e.target.value)}
                  />
                  <button className={styles.addRecordingBtn} onClick={handleAddRecording} disabled={actionPending === "recording"}>
                    Save
                  </button>
                </div>
              ) : (
                <button className={styles.addRecordingLink} onClick={() => setAddingRecording(true)}>
                  + Add recording URL
                </button>
              )}
            </>
          )}
        </div>

        {/* Scrollable body */}
        <div className={styles.body}>
          {/* Notes */}
          <div>
            <div className={styles.sectionLabel}>Notes & agenda</div>
            <textarea
              className={styles.notesArea}
              rows={3}
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={handleNotesSave}
              placeholder="Agenda items, context, talking points…"
            />
          </div>

          <div className={styles.divider} />

          {/* Transcript */}
          <div>
            <div className={styles.sectionLabel}>Meeting transcript</div>
            <textarea
              className={styles.transcriptArea}
              value={transcriptDraft}
              onChange={(e) => { setTranscriptDraft(e.target.value); setTranscriptDirty(true); }}
              placeholder="Paste the meeting transcript after the call…"
            />
            {transcriptDirty && (
              <button className={styles.saveTranscriptBtn} onClick={handleTranscriptSave} disabled={actionPending === "transcript"}>
                {actionPending === "transcript" ? "Saving…" : "Save transcript"}
              </button>
            )}
          </div>

          {/* AI Recap */}
          <div>
            <div className={styles.aiBox}>
              <div className={styles.aiHeader}>
                <div className={styles.aiLabel}>
                  <Sparkle size={12} weight="fill" />
                  AI Recap
                </div>
                {meeting.ai_summary ? (
                  <button className={styles.aiRegen} onClick={handleGenerateSummary} disabled={!canGenerate || actionPending === "summary"}>
                    {actionPending === "summary" ? "Generating…" : "Regenerate"}
                  </button>
                ) : (
                  <span className={styles.aiHint}>{canGenerate ? "Ready to generate" : "Paste transcript above"}</span>
                )}
              </div>

              {meeting.ai_summary ? (
                <>
                  <div className={styles.aiSummaryText}>{meeting.ai_summary}</div>
                  {meeting.action_items.length > 0 && (
                    <>
                      <div className={styles.sectionLabel}>Action items</div>
                      <div className={styles.actionItems}>
                        {meeting.action_items.map((item) => (
                          <label key={item.id} className={[styles.actionItem, item.completed ? styles.actionItemDone : ""].join(" ")}>
                            <input
                              type="checkbox"
                              checked={item.completed}
                              onChange={(e) => handleToggleItem(item.id, e.target.checked)}
                              disabled={!!actionPending}
                            />
                            {item.text}
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                  {meeting.visibility === "shared" && (
                    <div className={styles.intelligenceTag}>
                      <Check size={10} weight="bold" />
                      Intelligence updated · Recap shared with {ownerFirstName}
                    </div>
                  )}
                </>
              ) : (
                <button
                  className={styles.aiGenerateBtn}
                  onClick={handleGenerateSummary}
                  disabled={!canGenerate || actionPending === "summary"}
                >
                  {actionPending === "summary" ? "Generating…" : "Generate recap from transcript"}
                </button>
              )}
            </div>
            {error && <div className={styles.errorText}>{error}</div>}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            className={[styles.shareBtn, meeting.visibility === "shared" ? styles.shareBtnShared : ""].join(" ")}
            onClick={() => setShowShareModal(true)}
            disabled={!meeting.ai_summary}
          >
            {meeting.visibility === "shared" ? (
              <><Check size={13} weight="bold" />Recap shared with {ownerFirstName}</>
            ) : (
              <>Preview &amp; share with {ownerFirstName}</>
            )}
          </button>
          {contactId && (
            <button
              className={styles.tasksBtn}
              onClick={handlePushTasks}
              disabled={tasksPushed || uncompleted.length === 0 || actionPending === "tasks"}
            >
              <Check size={13} weight="bold" />
              {tasksPushed ? "Tasks pushed" : `Push ${uncompleted.length} to tasks`}
            </button>
          )}
        </div>
      </div>

      {showShareModal && meeting.ai_summary && (
        <ShareRecapModal
          meetingId={meeting.id}
          ownerId={ownerId}
          ownerFirstName={ownerFirstName}
          title={meeting.title}
          scheduledAt={meeting.scheduled_at}
          aiSummary={meeting.ai_summary}
          actionItems={meeting.action_items}
          phone={ownerPhone}
          onClose={() => setShowShareModal(false)}
          onShared={(updatedSummary) => {
            onUpdated({ id: meeting.id, visibility: "shared", ai_summary: updatedSummary });
            setShowShareModal(false);
          }}
        />
      )}
    </>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit 2>&1 | head -30
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/app/\(admin\)/admin/owners/\[entityId\]/MeetingsDetailPanel.tsx \
        apps/web/src/app/\(admin\)/admin/owners/\[entityId\]/MeetingsDetailPanel.module.css
git commit -m "feat(meetings): add MeetingsDetailPanel component"
```

---

## Task 6: MeetingsTab rewrite — two-panel layout

**Files:**
- Rewrite: `src/app/(admin)/admin/owners/[entityId]/MeetingsTab.tsx`
- Create: `src/app/(admin)/admin/owners/[entityId]/MeetingsTab.module.css`

This is a full rewrite of MeetingsTab.tsx. The old `MeetingCard`, `SectionHeader`, `EmptyState`, and all inline styles are removed. The new shell just manages selected state and delegates rendering to existing components.

- [ ] **Step 1: Create `MeetingsTab.module.css`**

```css
.root {
  display: flex;
  height: 100%;
  overflow: hidden;
}

/* LEFT PANEL */
.leftPanel {
  width: 280px;
  flex-shrink: 0;
  background: #ffffff;
  border-right: 1px solid var(--color-warm-gray-200);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Mini-cal wrapper — remove card border from MeetingsMiniCal */
.calWrapper {
  flex-shrink: 0;
  padding: 0;
}

.calWrapper > * {
  border: none !important;
  border-radius: 0 !important;
  width: 100% !important;
  padding-bottom: 0 !important;
}

/* Stats strip */
.statsStrip {
  display: flex;
  border-top: 1px solid var(--color-warm-gray-100);
  border-bottom: 1px solid var(--color-warm-gray-100);
  flex-shrink: 0;
}

.stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 7px 0;
  gap: 1px;
}

.stat + .stat {
  border-left: 1px solid var(--color-warm-gray-100);
}

.statVal {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1;
}

.statValBlue { color: var(--color-brand); }
.statValGreen { color: #059669; }

.statLabel {
  font-size: 9px;
  color: var(--color-text-tertiary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* New meeting button */
.newBtn {
  margin: 10px 12px;
  padding: 9px 14px;
  background: var(--color-brand);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: inherit;
  flex-shrink: 0;
  transition: background 0.15s;
}

.newBtn:hover {
  background: #155F9E;
}

/* Meeting list */
.meetingList {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 16px;
}

.listSection {
  padding: 8px 12px 3px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
  gap: 5px;
}

.listCount {
  background: var(--color-warm-gray-200);
  color: var(--color-text-secondary);
  border-radius: 10px;
  padding: 0 5px;
  font-size: 9px;
  font-weight: 700;
}

/* Meeting rows */
.meetingRow {
  padding: 8px 12px;
  cursor: pointer;
  border-left: 3px solid transparent;
  display: flex;
  align-items: center;
  gap: 9px;
  transition: background 0.1s;
}

.meetingRow:hover {
  background: var(--color-warm-gray-50);
}

.meetingRowSelected {
  background: #EFF6FF;
  border-left-color: var(--color-brand);
}

.meetingRowSelectedPhone {
  background: #F0FDF4;
  border-left-color: #059669;
}

.meetingRowSelectedInPerson {
  background: #FFFBEB;
  border-left-color: #C97820;
}

.rowIcon {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rowIconVideo { background: #EFF6FF; color: var(--color-brand); }
.rowIconPhone { background: #ECFDF5; color: #059669; }
.rowIconInPerson { background: #FEF9EC; color: #C97820; }

.rowBody {
  flex: 1;
  min-width: 0;
}

.rowTitle {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.35;
}

.rowMeta {
  font-size: 10px;
  color: var(--color-text-tertiary);
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.statusPill {
  font-size: 9px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 10px;
}

.statusUpcoming { background: #EFF6FF; color: var(--color-brand); }
.statusCompleted { background: #ECFDF5; color: #059669; }
.statusCancelled { background: var(--color-warm-gray-100); color: var(--color-text-tertiary); }

/* RIGHT PANEL */
.rightPanel {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Empty state */
.emptyRoot {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 12px;
  color: var(--color-text-tertiary);
  padding: 40px;
}

.emptyTitle {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.emptyBody {
  font-size: 13px;
  color: var(--color-text-tertiary);
  text-align: center;
  max-width: 280px;
  line-height: 1.5;
}

.emptyNewBtn {
  margin-top: 8px;
  padding: 10px 20px;
  background: var(--color-brand);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 7px;
}

.emptyNewBtn:hover {
  background: #155F9E;
}
```

- [ ] **Step 2: Rewrite `MeetingsTab.tsx`**

Replace the entire file contents with:

```tsx
"use client";

import { useState } from "react";
import { VideoCamera, Phone, MapPin, Plus } from "@phosphor-icons/react";
import type { AdminProfile } from "@/app/(admin)/admin/clients/[id]/client-actions";
import { MeetingsMiniCal } from "./MeetingsMiniCal";
import { MeetingsDetailPanel } from "./MeetingsDetailPanel";
import { CreateMeetingModal } from "./CreateMeetingModal";
import styles from "./MeetingsTab.module.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionItem = {
  id: string;
  text: string;
  completed: boolean;
  assignedTo: string | null;
  pushed?: boolean;
};

type Meeting = {
  id: string;
  title: string;
  scheduled_at: string | null;
  duration_minutes: number | null;
  meet_link: string | null;
  status: string;
  transcript: string | null;
  ai_summary: string | null;
  action_items: ActionItem[];
  notes: string | null;
  visibility: string;
  property_id: string | null;
  propertyLabel: string | null;
  created_at: string;
  meeting_type: "phone_call" | "video_call" | "in_person";
  calendar_event_id: string | null;
  attendee_ids: string[] | null;
  recording_url: string | null;
};

type Property = { id: string; label: string };

type MeetingsTabProps = {
  ownerId: string;
  ownerFirstName: string;
  ownerEmail: string;
  ownerPhone?: string | null;
  meetings: Meeting[];
  properties: Property[];
  contactId?: string;
  adminProfiles?: AdminProfile[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shortDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const ROW_ICONS: Record<string, { icon: React.ReactNode; rowIconClass: string; selectedClass: string }> = {
  video_call: {
    icon: <VideoCamera size={13} weight="fill" />,
    rowIconClass: styles.rowIconVideo,
    selectedClass: styles.meetingRowSelected,
  },
  phone_call: {
    icon: <Phone size={13} weight="fill" />,
    rowIconClass: styles.rowIconPhone,
    selectedClass: styles.meetingRowSelectedPhone,
  },
  in_person: {
    icon: <MapPin size={13} weight="fill" />,
    rowIconClass: styles.rowIconInPerson,
    selectedClass: styles.meetingRowSelectedInPerson,
  },
};

// ---------------------------------------------------------------------------
// MeetingsTab
// ---------------------------------------------------------------------------

export function MeetingsTab({
  ownerId,
  ownerFirstName,
  ownerEmail,
  ownerPhone = null,
  meetings: initialMeetings,
  properties,
  contactId,
  adminProfiles = [],
}: MeetingsTabProps) {
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialMeetings[0]?.id ?? null,
  );
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const filtered = selectedDate
    ? meetings.filter((m) => m.scheduled_at?.startsWith(selectedDate))
    : meetings;

  const upcoming = filtered.filter((m) => m.status === "scheduled");
  const past = filtered.filter((m) => m.status !== "scheduled");

  const selectedMeeting = meetings.find((m) => m.id === selectedId) ?? null;

  const upcomingCount = meetings.filter((m) => m.status === "scheduled").length;
  const completedCount = meetings.filter((m) => m.status === "completed").length;

  function handleUpdated(partial: Partial<Meeting> & { id: string }) {
    setMeetings((prev) =>
      prev.map((m) => (m.id === partial.id ? { ...m, ...partial } : m)),
    );
  }

  function handleDeleted(id: string) {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
    if (selectedId === id) {
      const remaining = meetings.filter((m) => m.id !== id);
      setSelectedId(remaining[0]?.id ?? null);
    }
  }

  function handleCreated(meeting: Meeting) {
    setMeetings((prev) => [meeting, ...prev]);
    setSelectedId(meeting.id);
    setShowModal(false);
  }

  return (
    <div className={styles.root}>
      {/* LEFT PANEL */}
      <div className={styles.leftPanel}>
        {/* Mini calendar — override card styles via wrapper */}
        <div className={styles.calWrapper}>
          <MeetingsMiniCal
            meetings={meetings}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        </div>

        {/* Stats */}
        <div className={styles.statsStrip}>
          <div className={styles.stat}>
            <span className={styles.statVal}>{meetings.length}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
          <div className={styles.stat}>
            <span className={[styles.statVal, styles.statValBlue].join(" ")}>{upcomingCount}</span>
            <span className={styles.statLabel}>Upcoming</span>
          </div>
          <div className={styles.stat}>
            <span className={[styles.statVal, styles.statValGreen].join(" ")}>{completedCount}</span>
            <span className={styles.statLabel}>Done</span>
          </div>
        </div>

        {/* New meeting button */}
        <button className={styles.newBtn} onClick={() => setShowModal(true)}>
          <Plus size={12} weight="bold" />
          New meeting
        </button>

        {/* Meeting list */}
        <div className={styles.meetingList}>
          {upcoming.length > 0 && (
            <>
              <div className={styles.listSection}>
                Upcoming <span className={styles.listCount}>{upcoming.length}</span>
              </div>
              {upcoming.map((m) => {
                const cfg = ROW_ICONS[m.meeting_type] ?? ROW_ICONS.video_call;
                const isSelected = m.id === selectedId;
                return (
                  <div
                    key={m.id}
                    className={[styles.meetingRow, isSelected ? cfg.selectedClass : ""].join(" ")}
                    onClick={() => setSelectedId(m.id)}
                  >
                    <div className={[styles.rowIcon, cfg.rowIconClass].join(" ")}>{cfg.icon}</div>
                    <div className={styles.rowBody}>
                      <div className={styles.rowTitle}>{m.title}</div>
                      <div className={styles.rowMeta}>
                        <span className={[styles.statusPill, styles.statusUpcoming].join(" ")}>Upcoming</span>
                        {m.scheduled_at && shortDate(m.scheduled_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {past.length > 0 && (
            <>
              <div className={styles.listSection} style={{ marginTop: upcoming.length ? 8 : 0 }}>
                Past <span className={styles.listCount}>{past.length}</span>
              </div>
              {past.map((m) => {
                const cfg = ROW_ICONS[m.meeting_type] ?? ROW_ICONS.video_call;
                const isSelected = m.id === selectedId;
                const statusClass = m.status === "completed" ? styles.statusCompleted : styles.statusCancelled;
                const statusLabel = m.status === "completed" ? "Done" : "Cancelled";
                return (
                  <div
                    key={m.id}
                    className={[styles.meetingRow, isSelected ? cfg.selectedClass : ""].join(" ")}
                    onClick={() => setSelectedId(m.id)}
                  >
                    <div className={[styles.rowIcon, cfg.rowIconClass].join(" ")} style={{ opacity: 0.6 }}>{cfg.icon}</div>
                    <div className={styles.rowBody}>
                      <div className={styles.rowTitle} style={{ opacity: 0.75 }}>{m.title}</div>
                      <div className={styles.rowMeta}>
                        <span className={[styles.statusPill, statusClass].join(" ")}>{statusLabel}</span>
                        {m.scheduled_at && shortDate(m.scheduled_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {meetings.length === 0 && (
            <div style={{ padding: "20px 12px", fontSize: "12px", color: "var(--color-text-tertiary)", textAlign: "center" }}>
              No meetings yet.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className={styles.rightPanel}>
        {meetings.length === 0 && !showModal ? (
          <div className={styles.emptyRoot}>
            <VideoCamera size={36} weight="thin" style={{ opacity: 0.3 }} />
            <div className={styles.emptyTitle}>No meetings yet</div>
            <div className={styles.emptyBody}>
              Schedule your first meeting with {ownerFirstName} to track conversations,
              share recaps, and stay aligned.
            </div>
            <button className={styles.emptyNewBtn} onClick={() => setShowModal(true)}>
              <Plus size={14} weight="bold" />
              Schedule a meeting
            </button>
          </div>
        ) : (
          <MeetingsDetailPanel
            key={selectedMeeting?.id ?? "none"}
            meeting={selectedMeeting}
            ownerId={ownerId}
            ownerFirstName={ownerFirstName}
            ownerPhone={ownerPhone ?? null}
            contactId={contactId}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
          />
        )}
      </div>

      {/* Create modal */}
      {showModal && (
        <CreateMeetingModal
          ownerId={ownerId}
          ownerFirstName={ownerFirstName}
          ownerEmail={ownerEmail}
          properties={properties}
          adminProfiles={adminProfiles}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Thread `ownerPhone` into the page that renders `MeetingsTab`**

In `src/app/(admin)/admin/clients/[id]/page.tsx`, find where `MeetingsTab` is rendered and add `ownerPhone`:

The page already fetches the contact. Add a phone lookup from the contact data and pass it:

```tsx
// In the page, after fetching contact data (it likely comes from fetchEntityInfo or similar):
// Find the primary contact's phone from the contacts array or entity info
// Pass it as ownerPhone prop:
<MeetingsTab
  ownerId={...}
  ownerFirstName={...}
  ownerEmail={...}
  ownerPhone={contact?.phone ?? null}   // ← add
  meetings={meetings}
  properties={properties}
  contactId={...}
  adminProfiles={adminProfiles}
/>
```

Look at what data is already available on the page — the contact's phone is in the `contacts` table. If it is already fetched (via `fetchEntityMembers` or `fetchEntityInfo`), use it directly. If not, read the existing page code to find where contact fields are accessed and pull `phone` from there.

- [ ] **Step 4: Verify TypeScript**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit 2>&1 | head -30
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add apps/web/src/app/\(admin\)/admin/owners/\[entityId\]/MeetingsTab.tsx \
        apps/web/src/app/\(admin\)/admin/owners/\[entityId\]/MeetingsTab.module.css \
        apps/web/src/app/\(admin\)/admin/clients/\[id\]/page.tsx
git commit -m "feat(meetings): two-panel layout with compact list + detail panel"
```

---

## Task 7: Visual verification + TypeScript clean

- [ ] **Step 1: Start dev server and open meetings tab**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
doppler run -- next dev -p 4000
```

Navigate to `http://localhost:4000/admin/clients/407fd1f1-b544-4ed6-93cb-46f8a0da159a?tab=meetings`

- [ ] **Step 2: Screenshot at 1440px**

```bash
B=~/.claude/skills/gstack/browse/dist/browse
$B goto "http://localhost:4000/admin/clients/407fd1f1-b544-4ed6-93cb-46f8a0da159a?tab=meetings"
$B viewport 1440x900
$B screenshot /tmp/meetings-final-1440.png
```

Read the screenshot. Verify:
- Two panels visible (left list, right detail)
- Selected meeting shows detail on the right
- Calendar + stats + New Meeting button in left panel
- Colored left border on selected row
- Type pill, meta row, and CTA row in detail header

- [ ] **Step 3: Screenshot at 375px (mobile)**

```bash
$B viewport 375x812
$B screenshot /tmp/meetings-final-375.png
```

Read the screenshot. If the layout is broken at mobile, add a media query to `MeetingsTab.module.css`:

```css
@media (max-width: 700px) {
  .root {
    flex-direction: column;
  }
  .leftPanel {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--color-warm-gray-200);
    max-height: 300px;
  }
}
```

- [ ] **Step 4: Click through key flows**

In the browser:
1. Click a past meeting row — verify detail updates on right
2. Click Notes textarea — verify it's editable, saves on blur
3. Click "Generate recap" (if transcript exists) — verify loading state + result appears
4. Click footer Share button — verify ShareRecapModal opens with email preview
5. Edit summary in modal, click Send — verify recap shared confirmation
6. Close modal — verify footer button turns green

- [ ] **Step 5: Final TypeScript check**

```bash
cd /Users/johanannunez/workspace/parcel/apps/web
pnpm exec tsc --noEmit 2>&1
```

Expected: empty output.

- [ ] **Step 6: Final commit**

```bash
cd /Users/johanannunez/workspace/parcel
git add -A
git commit -m "feat(meetings): premium two-panel redesign — detail panel, recording auto-attach, share recap modal"
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|-------------|------|
| Two-panel layout (left list, right detail) | Task 6 |
| Mini calendar with stats + New Meeting button | Task 6 |
| Compact meeting rows with colored left border | Task 6 |
| Detail panel: title, type pill, meta, join, notif chips | Task 5 |
| Notes editable textarea (save on blur) | Task 5 |
| Transcript editable textarea | Task 5 |
| AI Recap with generate / regenerate | Task 5 |
| Action items checklist | Task 5 |
| "Push to tasks" footer button | Task 5 |
| Recording auto-attach on mark-complete | Task 5 |
| Manual "Add recording URL" fallback | Task 5 |
| Share with Owner preview modal | Task 4 |
| Editable summary in modal | Task 4 |
| Personal note field | Task 4 |
| Action item toggles in modal | Task 4 |
| SMS preview in modal | Task 4 |
| `recording_url` DB column | Task 1 |
| `searchDriveRecording` Drive API function | Task 2 |
| `drive.readonly` OAuth scope | Task 2 |
| `shareRecap` server action | Task 3 |
| `updateMeetingRecording` server action | Task 3 |
| `searchAndAttachRecording` server action | Task 3 |
| `personalNote` in email template | Task 3 |
| TypeScript clean | Tasks 1-7 |

**Placeholder scan:** No TBD, TODO, or "similar to Task N" patterns found.

**Type consistency:**
- `Meeting` type is defined once in `MeetingsTab.tsx` and imported via inline types in `MeetingsDetailPanel.tsx`. Both definitions match.
- `ActionItem` type is consistent across all files.
- `shareRecap` in `meetings-actions.ts` matches the call in `ShareRecapModal.tsx`.
- `searchAndAttachRecording` return `{ ok, recordingUrl, message }` matches usage in `MeetingsDetailPanel.tsx`.
