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
  phone_call: {
    label: "Phone Call",
    icon: <Phone size={11} weight="fill" />,
    pillClass: styles.typePillPhone,
  },
  video_call: {
    label: "Video Call",
    icon: <VideoCamera size={11} weight="fill" />,
    pillClass: styles.typePillVideo,
  },
  in_person: {
    label: "In Person",
    icon: <MapPin size={11} weight="fill" />,
    pillClass: styles.typePillInPerson,
  },
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "No date set";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function durationLabel(mins: number | null): string {
  if (!mins) return "";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function countdownLabel(
  scheduledAt: string | null,
): { text: string; cls: string } | null {
  if (!scheduledAt) return null;
  const diff = new Date(scheduledAt).getTime() - Date.now();
  if (diff < 0) return null;
  const hours = diff / 3600000;
  const days = Math.floor(diff / 86400000);
  if (hours < 2) return { text: "Starting soon", cls: styles.countdownNow };
  if (hours < 24)
    return { text: `In ${Math.round(hours)}h`, cls: styles.countdownSoon };
  return {
    text: `In ${days} day${days !== 1 ? "s" : ""}`,
    cls: styles.countdownUpcoming,
  };
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
  const [transcriptDraft, setTranscriptDraft] = useState(
    meeting?.transcript ?? "",
  );
  const [transcriptDirty, setTranscriptDirty] = useState(false);
  const [tasksPushed, setTasksPushed] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(meeting?.title ?? "");
  const [addingRecording, setAddingRecording] = useState(false);
  const [recordingDraft, setRecordingDraft] = useState("");

  void isPending;

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

  // Rebind as non-null so TypeScript tracks the narrowing inside closures below.
  const m = meeting;

  const typeConfig = TYPE_CONFIG[m.meeting_type];
  const countdown = countdownLabel(m.scheduled_at);
  const isUpcoming = m.status === "scheduled";
  const hasRecording = !!m.recording_url;
  const canGenerate = !!(m.transcript?.trim());

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
    if (!trimmed || trimmed === m.title) {
      setEditingTitle(false);
      setTitleDraft(m.title);
      return;
    }
    doAction("title", async () => {
      const res = await updateOwnerMeeting(m.id, ownerId, {
        title: trimmed,
      });
      if (!res.ok) {
        setError(res.message);
        setTitleDraft(m.title);
      } else onUpdated({ id: m.id, title: trimmed });
      setEditingTitle(false);
    });
  }

  function handleNotesSave() {
    const trimmed = notesDraft.trim();
    if (trimmed === (m.notes ?? "")) return;
    doAction("notes", async () => {
      const res = await updateOwnerMeeting(m.id, ownerId, {
        notes: trimmed || null,
      });
      if (!res.ok) setError(res.message);
      else onUpdated({ id: m.id, notes: trimmed || null });
    });
  }

  function handleTranscriptSave() {
    doAction("transcript", async () => {
      const res = await updateOwnerMeeting(m.id, ownerId, {
        transcript: transcriptDraft.trim() || null,
      });
      if (!res.ok) setError(res.message);
      else {
        onUpdated({
          id: m.id,
          transcript: transcriptDraft.trim() || null,
        });
        setTranscriptDirty(false);
      }
    });
  }

  function handleStatusToggle() {
    const newStatus = isUpcoming ? "completed" : "scheduled";
    doAction("status", async () => {
      const res = await updateOwnerMeeting(m.id, ownerId, {
        status: newStatus as "scheduled" | "completed",
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      onUpdated({ id: m.id, status: newStatus });
      if (
        newStatus === "completed" &&
        m.calendar_event_id &&
        m.scheduled_at
      ) {
        const rec = await searchAndAttachRecording(
          m.id,
          ownerId,
          m.scheduled_at,
          m.title,
        );
        if (rec.recordingUrl)
          onUpdated({ id: m.id, recording_url: rec.recordingUrl });
      }
    });
  }

  function handleDelete() {
    doAction("delete", async () => {
      const res = await deleteOwnerMeeting(m.id, ownerId);
      if (!res.ok) {
        setError(res.message);
        setDeleteConfirm(false);
      } else onDeleted(m.id);
    });
  }

  function handleGenerateSummary() {
    doAction("summary", async () => {
      const res = await generateMeetingSummary(m.id, ownerId);
      if (!res.ok) setError(res.message);
      else
        onUpdated({
          id: m.id,
          ai_summary: res.summary ?? null,
          action_items: res.actionItems ?? m.action_items,
        });
    });
  }

  function handleToggleItem(itemId: string, completed: boolean) {
    doAction(`item-${itemId}`, async () => {
      const res = await toggleActionItem(m.id, ownerId, itemId, completed);
      if (!res.ok) setError(res.message);
      else {
        const updated = m.action_items.map((a) =>
          a.id === itemId ? { ...a, completed } : a,
        );
        onUpdated({ id: m.id, action_items: updated });
      }
    });
  }

  function handlePushTasks() {
    if (!contactId) return;
    doAction("tasks", async () => {
      const res = await pushMeetingTasksToContact(
        m.id,
        ownerId,
        contactId,
      );
      if (!res.ok) setError(res.message);
      else setTasksPushed(true);
    });
  }

  function handleAddRecording() {
    const url = recordingDraft.trim();
    if (!url) return;
    doAction("recording", async () => {
      const res = await updateMeetingRecording(m.id, ownerId, url);
      if (!res.ok) setError(res.message);
      else {
        onUpdated({ id: m.id, recording_url: url });
        setAddingRecording(false);
        setRecordingDraft("");
      }
    });
  }

  const uncompleted = m.action_items.filter((a) => !a.completed);

  return (
    <>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            {editingTitle ? (
              <input
                className={styles.titleInput}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSave();
                  if (e.key === "Escape") {
                    setEditingTitle(false);
                    setTitleDraft(m.title);
                  }
                }}
                autoFocus
              />
            ) : (
              <h2 className={styles.title}>{m.title}</h2>
            )}
            <div className={styles.actionGroup}>
              <button
                className={styles.iconBtn}
                title={isUpcoming ? "Mark complete" : "Mark as upcoming"}
                onClick={handleStatusToggle}
                disabled={actionPending === "status"}
              >
                {isUpcoming ? (
                  <Circle size={14} weight="regular" />
                ) : (
                  <CheckCircle
                    size={14}
                    weight="fill"
                    style={{ color: "#059669" }}
                  />
                )}
              </button>
              <button
                className={styles.iconBtn}
                title="Edit title"
                onClick={() => {
                  setEditingTitle(true);
                  setTitleDraft(m.title);
                }}
              >
                <NotePencil size={14} weight="regular" />
              </button>
              {deleteConfirm ? (
                <button
                  className={[styles.iconBtn, styles.confirm].join(" ")}
                  title="Confirm delete"
                  onClick={handleDelete}
                  disabled={actionPending === "delete"}
                >
                  <Trash size={14} weight="fill" />
                </button>
              ) : (
                <button
                  className={[styles.iconBtn, styles.danger].join(" ")}
                  title="Delete meeting"
                  onClick={() => setDeleteConfirm(true)}
                >
                  <Trash size={14} weight="regular" />
                </button>
              )}
            </div>
          </div>

          <div className={styles.metaRow}>
            <div
              className={[styles.typePill, typeConfig.pillClass].join(" ")}
            >
              {typeConfig.icon}
              {typeConfig.label}
            </div>
            {m.scheduled_at && (
              <>
                <div className={styles.metaDot} />
                <span className={styles.metaChip}>
                  {formatDateTime(m.scheduled_at)}
                </span>
              </>
            )}
            {m.duration_minutes && (
              <>
                <div className={styles.metaDot} />
                <span className={styles.metaChip}>
                  {durationLabel(m.duration_minutes)}
                </span>
              </>
            )}
            <div className={styles.metaDot} />
            <span
              className={
                m.visibility === "shared"
                  ? styles.sharedBadge
                  : styles.privateBadge
              }
            >
              {m.visibility === "shared" ? "Shared" : "Private"}
            </span>
            {countdown && (
              <span className={[styles.countdown, countdown.cls].join(" ")}>
                {countdown.text}
              </span>
            )}
          </div>

          <div className={styles.ctaRow}>
            {m.meet_link ? (
              <a
                href={m.meet_link}
                target="_blank"
                rel="noreferrer"
                className={styles.joinBtn}
              >
                <ArrowSquareOut size={12} weight="bold" />
                Join meeting
              </a>
            ) : (
              <div />
            )}
            <div className={styles.notifRow}>
              {m.visibility === "shared" && (
                <>
                  <span className={styles.notifChip}>
                    <Envelope size={10} weight="fill" />
                    Email sent
                  </span>
                  {ownerPhone && (
                    <span className={styles.notifChip}>
                      <DeviceMobile size={10} weight="fill" />
                      SMS sent
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {hasRecording ? (
            <div className={styles.recordingRow}>
              <div className={styles.recordingThumb}>
                <VideoCamera size={14} weight="fill" />
              </div>
              <div className={styles.recordingInfo}>
                <div className={styles.recordingName}>
                  {m.recording_url}
                </div>
                <div className={styles.recordingMeta}>
                  Google Drive · Auto-attached
                </div>
              </div>
              <a
                href={m.recording_url!}
                target="_blank"
                rel="noreferrer"
                className={styles.recordingWatch}
              >
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
                  <button
                    className={styles.addRecordingBtn}
                    onClick={handleAddRecording}
                    disabled={actionPending === "recording"}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <button
                  className={styles.addRecordingLink}
                  onClick={() => setAddingRecording(true)}
                >
                  + Add recording URL
                </button>
              )}
            </>
          )}
        </div>

        <div className={styles.body}>
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

          <div>
            <div className={styles.sectionLabel}>Meeting transcript</div>
            <textarea
              className={styles.transcriptArea}
              value={transcriptDraft}
              onChange={(e) => {
                setTranscriptDraft(e.target.value);
                setTranscriptDirty(true);
              }}
              placeholder="Paste the meeting transcript after the call…"
            />
            {transcriptDirty && (
              <button
                className={styles.saveTranscriptBtn}
                onClick={handleTranscriptSave}
                disabled={actionPending === "transcript"}
              >
                {actionPending === "transcript" ? "Saving…" : "Save transcript"}
              </button>
            )}
          </div>

          <div>
            <div className={styles.aiBox}>
              <div className={styles.aiHeader}>
                <div className={styles.aiLabel}>
                  <Sparkle size={12} weight="fill" />
                  AI Recap
                </div>
                {m.ai_summary ? (
                  <button
                    className={styles.aiRegen}
                    onClick={handleGenerateSummary}
                    disabled={!canGenerate || actionPending === "summary"}
                  >
                    {actionPending === "summary"
                      ? "Generating…"
                      : "Regenerate"}
                  </button>
                ) : (
                  <span className={styles.aiHint}>
                    {canGenerate
                      ? "Ready to generate"
                      : "Paste transcript above"}
                  </span>
                )}
              </div>

              {m.ai_summary ? (
                <>
                  <div className={styles.aiSummaryText}>
                    {m.ai_summary}
                  </div>
                  {m.action_items.length > 0 && (
                    <>
                      <div className={styles.sectionLabel}>Action items</div>
                      <div className={styles.actionItems}>
                        {m.action_items.map((item) => (
                          <label
                            key={item.id}
                            className={[
                              styles.actionItem,
                              item.completed ? styles.actionItemDone : "",
                            ].join(" ")}
                          >
                            <input
                              type="checkbox"
                              checked={item.completed}
                              onChange={(e) =>
                                handleToggleItem(item.id, e.target.checked)
                              }
                              disabled={!!actionPending}
                            />
                            {item.text}
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                  {m.visibility === "shared" && (
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
                  {actionPending === "summary"
                    ? "Generating…"
                    : "Generate recap from transcript"}
                </button>
              )}
            </div>
            {error && <div className={styles.errorText}>{error}</div>}
          </div>
        </div>

        <div className={styles.footer}>
          <button
            className={[
              styles.shareBtn,
              m.visibility === "shared" ? styles.shareBtnShared : "",
            ].join(" ")}
            onClick={() => setShowShareModal(true)}
            disabled={!m.ai_summary}
          >
            {m.visibility === "shared" ? (
              <>
                <Check size={13} weight="bold" />
                Recap shared with {ownerFirstName}
              </>
            ) : (
              <>Preview &amp; share with {ownerFirstName}</>
            )}
          </button>
          {contactId && (
            <button
              className={styles.tasksBtn}
              onClick={handlePushTasks}
              disabled={
                tasksPushed ||
                uncompleted.length === 0 ||
                actionPending === "tasks"
              }
            >
              <Check size={13} weight="bold" />
              {tasksPushed
                ? "Tasks pushed"
                : `Push ${uncompleted.length} to tasks`}
            </button>
          )}
        </div>
      </div>

      {showShareModal && m.ai_summary && (
        <ShareRecapModal
          meetingId={m.id}
          ownerId={ownerId}
          ownerFirstName={ownerFirstName}
          title={m.title}
          scheduledAt={m.scheduled_at}
          aiSummary={m.ai_summary}
          actionItems={m.action_items}
          phone={ownerPhone}
          onClose={() => setShowShareModal(false)}
          onShared={(updatedSummary) => {
            onUpdated({
              id: m.id,
              visibility: "shared",
              ai_summary: updatedSummary,
            });
            setShowShareModal(false);
          }}
        />
      )}
    </>
  );
}
