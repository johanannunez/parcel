"use client";

import { useState, useTransition, useRef } from "react";
import {
  VideoCamera,
  Phone,
  MapPin,
  Plus,
  CalendarBlank,
  Clock,
  Link as LinkIcon,
  X,
  Check,
  Trash,
  Eye,
  EyeSlash,
  Sparkle,
  ArrowSquareOut,
  CheckCircle,
  Circle,
  NotePencil,
  CaretDown,
  Buildings,
  Warning,
  ArrowUpRight,
} from "@phosphor-icons/react";
import type { AdminProfile } from "@/app/(admin)/admin/clients/[id]/client-actions";
import {
  updateOwnerMeeting,
  deleteOwnerMeeting,
  generateMeetingSummary,
  toggleActionItem,
  pushMeetingTasksToContact,
} from "./meetings-actions";
import { MeetingsMiniCal } from "./MeetingsMiniCal";
import { CreateMeetingModal } from "./CreateMeetingModal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionItem = {
  id: string;
  text: string;
  completed: boolean;
  assignedTo: string | null;
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
};

type Property = { id: string; label: string };

type MeetingsTabProps = {
  ownerId: string;
  ownerFirstName: string;
  ownerEmail: string;
  meetings: Meeting[];
  properties: Property[];
  contactId?: string;
  adminProfiles?: AdminProfile[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------


function formatDateTime(iso: string | null): string {
  if (!iso) return "No date set";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
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

// ---------------------------------------------------------------------------
// Create Meeting Form — removed, replaced by CreateMeetingModal
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Meeting Card
// ---------------------------------------------------------------------------

type MeetingCardProps = {
  meeting: Meeting;
  ownerId: string;
  ownerEmail: string;
  properties: Property[];
  contactId?: string;
  muted?: boolean;
  onUpdated: (updated: Partial<Meeting> & { id: string }) => void;
  onDeleted: (id: string) => void;
};

function MeetingCard({
  meeting,
  ownerId,
  ownerEmail: _ownerEmail,
  properties: _properties,
  contactId,
  muted = false,
  onUpdated,
  onDeleted,
}: MeetingCardProps) {
  const [isPending, startTransition] = useTransition();
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteState, setDeleteState] = useState<"idle" | "confirming">("idle");

  const [notesOpen, setNotesOpen] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(!!meeting.ai_summary);
  const [tasksPushed, setTasksPushed] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(meeting.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [notesDraft, setNotesDraft] = useState(meeting.notes ?? "");
  const [transcriptDraft, setTranscriptDraft] = useState(
    meeting.transcript ?? "",
  );
  const [transcriptDirty, setTranscriptDirty] = useState(false);

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
    if (!trimmed || trimmed === meeting.title) {
      setEditingTitle(false);
      setTitleDraft(meeting.title);
      return;
    }
    doAction("title", async () => {
      const res = await updateOwnerMeeting(meeting.id, ownerId, {
        title: trimmed,
      });
      if (!res.ok) {
        setError(res.message);
        setTitleDraft(meeting.title);
      } else {
        onUpdated({ id: meeting.id, title: trimmed });
      }
      setEditingTitle(false);
    });
  }

  function handleNotesSave() {
    const trimmed = notesDraft.trim();
    if (trimmed === (meeting.notes ?? "")) return;
    doAction("notes", async () => {
      const res = await updateOwnerMeeting(meeting.id, ownerId, {
        notes: trimmed || null,
      });
      if (!res.ok) setError(res.message);
      else onUpdated({ id: meeting.id, notes: trimmed || null });
    });
  }

  function handleTranscriptSave() {
    const trimmed = transcriptDraft.trim();
    doAction("transcript", async () => {
      const res = await updateOwnerMeeting(meeting.id, ownerId, {
        transcript: trimmed || null,
      });
      if (!res.ok) setError(res.message);
      else {
        onUpdated({ id: meeting.id, transcript: trimmed || null });
        setTranscriptDirty(false);
      }
    });
  }

  function handleStatusToggle() {
    const newStatus =
      meeting.status === "scheduled" ? "completed" : "scheduled";
    doAction("status", async () => {
      const res = await updateOwnerMeeting(meeting.id, ownerId, {
        status: newStatus as "scheduled" | "completed",
      });
      if (!res.ok) setError(res.message);
      else {
        onUpdated({ id: meeting.id, status: newStatus });
        if (newStatus === "completed") setSummaryOpen(true);
      }
    });
  }

  function handleVisibilityToggle() {
    const newVis =
      meeting.visibility === "shared" ? "private" : "shared";
    doAction("visibility", async () => {
      const res = await updateOwnerMeeting(meeting.id, ownerId, {
        visibility: newVis as "shared" | "private",
      });
      if (!res.ok) setError(res.message);
      else onUpdated({ id: meeting.id, visibility: newVis });
    });
  }

  function handleDelete() {
    if (deleteState === "idle") { setDeleteState("confirming"); return; }
    doAction("delete", async () => {
      const res = await deleteOwnerMeeting(meeting.id, ownerId);
      if (!res.ok) { setError(res.message); setDeleteState("idle"); }
      else onDeleted(meeting.id);
    });
  }

  function handlePushTasks() {
    if (!contactId) return;
    doAction("push", async () => {
      const res = await pushMeetingTasksToContact(meeting.id, ownerId, contactId);
      if (!res.ok) setPushError(res.message);
      else setTasksPushed(true);
    });
  }

  function handleGenerateSummary() {
    doAction("ai", async () => {
      const res = await generateMeetingSummary(meeting.id, ownerId);
      if (!res.ok) {
        setError(res.message);
      } else {
        onUpdated({
          id: meeting.id,
          ai_summary: res.summary ?? null,
          action_items: res.actionItems ?? meeting.action_items,
        });
        setSummaryOpen(true);
      }
    });
  }

  function handleToggleActionItem(itemId: string, completed: boolean) {
    doAction(`action-${itemId}`, async () => {
      const res = await toggleActionItem(meeting.id, ownerId, itemId, completed);
      if (!res.ok) {
        setError(res.message);
      } else {
        const updated = meeting.action_items.map((ai) =>
          ai.id === itemId ? { ...ai, completed } : ai,
        );
        onUpdated({ id: meeting.id, action_items: updated });
      }
    });
  }

  const isLoading = (key: string) =>
    isPending && actionPending === key;

  const statusBadge = {
    scheduled: {
      label: "Upcoming",
      bg: "rgba(27, 119, 190, 0.08)",
      color: "#1B77BE",
    },
    completed: {
      label: "Completed",
      bg: "rgba(22, 163, 74, 0.08)",
      color: "var(--color-success)",
    },
    cancelled: {
      label: "Cancelled",
      bg: "rgba(107, 114, 128, 0.08)",
      color: "var(--color-text-tertiary)",
    },
  }[meeting.status] ?? {
    label: meeting.status,
    bg: "rgba(107, 114, 128, 0.08)",
    color: "var(--color-text-tertiary)",
  };

  return (
    <div
      style={{
        background: "var(--color-white)",
        border: "1px solid var(--color-warm-gray-200)",
        borderRadius: "16px",
        padding: "16px",
        opacity: muted ? 0.75 : 1,
        transition: "box-shadow 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 4px 16px rgba(0,0,0,0.06)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Top row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          marginBottom: "10px",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "10px",
            background: muted ? "var(--color-warm-gray-200)" : "var(--color-brand)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {meeting.meeting_type === "phone_call" ? (
            <Phone size={17} color="#fff" weight="fill" />
          ) : meeting.meeting_type === "in_person" ? (
            <MapPin size={17} color="#fff" weight="fill" />
          ) : (
            <VideoCamera size={17} color="#fff" weight="fill" />
          )}
        </div>

        {/* Title + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {editingTitle ? (
            <input
              ref={titleInputRef}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSave();
                if (e.key === "Escape") {
                  setEditingTitle(false);
                  setTitleDraft(meeting.title);
                }
              }}
              autoFocus
              style={{
                ...inputStyle,
                padding: "2px 6px",
                fontSize: "14px",
                fontWeight: 600,
                width: "100%",
              }}
            />
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              style={{
                background: "none",
                border: "none",
                cursor: "text",
                padding: 0,
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                letterSpacing: "-0.01em",
                textAlign: "left",
                width: "100%",
              }}
            >
              {meeting.title}
            </button>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginTop: "4px",
              flexWrap: "wrap",
            }}
          >
            {/* Status badge */}
            <span
              style={{
                padding: "2px 8px",
                borderRadius: "20px",
                background: statusBadge.bg,
                color: statusBadge.color,
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {statusBadge.label}
            </span>

            {/* Date/time */}
            {meeting.scheduled_at && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11px",
                  color: "var(--color-text-secondary)",
                }}
              >
                <CalendarBlank size={11} />
                {formatDateTime(meeting.scheduled_at)}
              </span>
            )}

            {/* Duration */}
            {meeting.duration_minutes && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11px",
                  color: "var(--color-text-tertiary)",
                }}
              >
                <Clock size={11} />
                {durationLabel(meeting.duration_minutes)}
              </span>
            )}

            {/* Property badge */}
            {meeting.propertyLabel && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  fontSize: "10px",
                  color: "var(--color-text-tertiary)",
                  background: "var(--color-warm-gray-50)",
                  padding: "2px 7px",
                  borderRadius: "20px",
                  border: "1px solid var(--color-warm-gray-200)",
                }}
              >
                <Buildings size={10} />
                {meeting.propertyLabel}
              </span>
            )}

            {/* Visibility badge */}
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "3px",
                fontSize: "10px",
                color:
                  meeting.visibility === "private"
                    ? "var(--color-text-tertiary)"
                    : "var(--color-success)",
              }}
            >
              {meeting.visibility === "private" ? (
                <EyeSlash size={10} />
              ) : (
                <Eye size={10} />
              )}
              {meeting.visibility === "private" ? "Private" : "Shared"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
          {/* Status toggle */}
          <button
            onClick={handleStatusToggle}
            disabled={isPending}
            title={
              meeting.status === "scheduled"
                ? "Mark as complete"
                : "Reopen meeting"
            }
            style={{
              ...iconButtonStyle,
              color:
                meeting.status === "scheduled"
                  ? "var(--color-success)"
                  : "var(--color-text-tertiary)",
            }}
          >
            {isLoading("status") ? (
              <SpinnerIcon size={14} />
            ) : meeting.status === "scheduled" ? (
              <CheckCircle size={16} />
            ) : (
              <Circle size={16} />
            )}
          </button>

          {/* Visibility toggle */}
          <button
            onClick={handleVisibilityToggle}
            disabled={isPending}
            title={
              meeting.visibility === "shared"
                ? "Make private"
                : "Share with owner"
            }
            style={iconButtonStyle}
          >
            {isLoading("visibility") ? (
              <SpinnerIcon size={14} />
            ) : meeting.visibility === "shared" ? (
              <Eye size={16} />
            ) : (
              <EyeSlash size={16} />
            )}
          </button>

          {/* Edit title shortcut */}
          <button
            onClick={() => setEditingTitle(true)}
            title="Edit title"
            style={iconButtonStyle}
          >
            <NotePencil size={16} />
          </button>

          {/* Delete */}
          {deleteState === "confirming" ? (
            <>
              <button
                onClick={handleDelete}
                disabled={isPending}
                style={{
                  ...ghostButtonStyle,
                  fontSize: "10px",
                  padding: "3px 8px",
                  color: "var(--color-error)",
                  borderColor: "var(--color-error)",
                }}
              >
                {isLoading("delete") ? <SpinnerIcon size={10} /> : "Delete"}
              </button>
              <button
                onClick={() => setDeleteState("idle")}
                style={{ ...iconButtonStyle }}
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <button
              onClick={handleDelete}
              disabled={isPending}
              title="Delete meeting"
              style={{ ...iconButtonStyle, color: "var(--color-error)" }}
            >
              <Trash size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Meet link */}
      {meeting.meet_link && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "10px",
          }}
        >
          <LinkIcon
            size={13}
            color="var(--color-brand)"
          />
          <a
            href={meeting.meet_link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "12px",
              color: "var(--color-brand)",
              textDecoration: "none",
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
            }}
          >
            {meeting.meet_link}
          </a>
          <a
            href={meeting.meet_link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "8px",
              background: "var(--color-brand)",
              color: "#fff",
              fontSize: "11px",
              fontWeight: 600,
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            Join
            <ArrowSquareOut size={11} />
          </a>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "10px",
            color: "var(--color-error)",
            fontSize: "11px",
          }}
        >
          <Warning size={13} weight="fill" />
          {error}
        </div>
      )}

      {/* Expandable sections row */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        <ExpandToggle
          label="Notes"
          open={notesOpen}
          onToggle={() => setNotesOpen((p) => !p)}
        />
        <ExpandToggle
          label="Transcript"
          open={transcriptOpen}
          onToggle={() => setTranscriptOpen((p) => !p)}
        />
        <ExpandToggle
          label={meeting.ai_summary ? "AI Summary" : "AI Summary"}
          open={summaryOpen}
          onToggle={() => setSummaryOpen((p) => !p)}
          accent={!!meeting.ai_summary}
        />
      </div>

      {/* Notes panel */}
      {notesOpen && (
        <div style={{ marginTop: "12px" }}>
          <label style={labelStyle}>Notes</label>
          <textarea
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            onBlur={handleNotesSave}
            rows={3}
            placeholder="Add meeting notes..."
            style={{ ...inputStyle, resize: "vertical" }}
          />
          {isLoading("notes") && (
            <span
              style={{
                fontSize: "10px",
                color: "var(--color-text-tertiary)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                marginTop: "4px",
              }}
            >
              <SpinnerIcon size={10} />
              Saving...
            </span>
          )}
        </div>
      )}

      {/* Transcript panel */}
      {transcriptOpen && (
        <div style={{ marginTop: "12px" }}>
          <label style={labelStyle}>Meeting transcript</label>
          <textarea
            value={transcriptDraft}
            onChange={(e) => {
              setTranscriptDraft(e.target.value);
              setTranscriptDirty(true);
            }}
            rows={6}
            placeholder="Paste the meeting transcript here..."
            style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: "11px" }}
          />
          {transcriptDirty && (
            <button
              onClick={handleTranscriptSave}
              disabled={isPending}
              style={{ ...primaryButtonStyle, marginTop: "8px", opacity: isLoading("transcript") ? 0.7 : 1 }}
            >
              {isLoading("transcript") ? <SpinnerIcon /> : <Check size={13} weight="bold" />}
              Save transcript
            </button>
          )}
        </div>
      )}

      {/* AI Summary panel */}
      {summaryOpen && (
        <div style={{ marginTop: "12px" }}>
          {meeting.ai_summary ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--color-brand)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  <Sparkle size={12} weight="fill" />
                  AI Summary
                </span>
                <button
                  onClick={handleGenerateSummary}
                  disabled={!meeting.transcript || isPending}
                  style={{
                    ...ghostButtonStyle,
                    fontSize: "10px",
                    padding: "3px 8px",
                    opacity:
                      !meeting.transcript || isPending ? 0.5 : 1,
                    cursor:
                      !meeting.transcript || isPending
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {isLoading("ai") ? <SpinnerIcon size={10} /> : null}
                  Regenerate
                </button>
              </div>

              <p
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.6,
                  marginBottom: "12px",
                  padding: "10px 12px",
                  background: "var(--color-warm-gray-50)",
                  borderRadius: "10px",
                  border: "1px solid var(--color-warm-gray-200)",
                }}
              >
                {meeting.ai_summary}
              </p>

              {/* Action items */}
              {meeting.action_items && meeting.action_items.length > 0 && (
                <div>
                  <p
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--color-text-tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: "8px",
                    }}
                  >
                    Action items
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {meeting.action_items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <button
                          onClick={() =>
                            handleToggleActionItem(item.id, !item.completed)
                          }
                          disabled={isPending}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            color: item.completed
                              ? "var(--color-success)"
                              : "var(--color-warm-gray-400)",
                            flexShrink: 0,
                          }}
                          aria-label={item.completed ? "Mark incomplete" : "Mark complete"}
                        >
                          {isLoading(`action-${item.id}`) ? (
                            <SpinnerIcon size={14} />
                          ) : item.completed ? (
                            <CheckCircle size={16} weight="fill" />
                          ) : (
                            <Circle size={16} />
                          )}
                        </button>
                        <span
                          style={{
                            fontSize: "12px",
                            color: item.completed
                              ? "var(--color-text-tertiary)"
                              : "var(--color-text-primary)",
                            textDecoration: item.completed ? "line-through" : "none",
                            flex: 1,
                          }}
                        >
                          {item.text}
                        </span>
                        {(item as any).pushed && (
                          <span style={{ fontSize: "9px", color: "var(--color-success)", fontWeight: 600 }}>
                            Added
                          </span>
                        )}
                        {item.assignedTo && (
                          <span style={{ fontSize: "10px", color: "var(--color-text-tertiary)" }}>
                            {item.assignedTo}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Recap action row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                    {contactId && !tasksPushed && (
                      <button
                        onClick={handlePushTasks}
                        disabled={isPending}
                        style={{
                          ...ghostButtonStyle,
                          fontSize: "11px",
                          padding: "5px 12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          opacity: isPending && actionPending === "push" ? 0.6 : 1,
                        }}
                      >
                        {isLoading("push") ? <SpinnerIcon size={11} /> : <ArrowUpRight size={12} weight="bold" />}
                        Push all to Tasks
                      </button>
                    )}
                    {tasksPushed && (
                      <span style={{ fontSize: "11px", color: "var(--color-success)", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                        <Check size={12} weight="bold" />
                        Tasks added to contact
                      </span>
                    )}
                    {pushError && (
                      <span style={{ fontSize: "11px", color: "var(--color-error)" }}>{pushError}</span>
                    )}
                    {meeting.visibility !== "shared" && (
                      <button
                        onClick={handleVisibilityToggle}
                        disabled={isPending}
                        style={{
                          ...ghostButtonStyle,
                          fontSize: "11px",
                          padding: "5px 12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <Eye size={12} />
                        Share recap with owner
                      </button>
                    )}
                    {meeting.visibility === "shared" && (
                      <span style={{ fontSize: "11px", color: "var(--color-success)", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                        <Eye size={12} weight="fill" />
                        Shared with owner
                      </span>
                    )}
                    <span style={{ fontSize: "10px", color: "var(--color-text-tertiary)", marginLeft: "auto", display: "flex", alignItems: "center", gap: "3px" }}>
                      <Sparkle size={10} weight="fill" />
                      Intelligence updated
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "16px",
                background: "var(--color-warm-gray-50)",
                borderRadius: "12px",
                border: "1px solid var(--color-warm-gray-200)",
                gap: "10px",
                textAlign: "center",
              }}
            >
              <Sparkle
                size={22}
                color="var(--color-brand)"
                weight="fill"
              />
              <div>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    marginBottom: "3px",
                  }}
                >
                  Generate AI summary
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--color-text-tertiary)",
                  }}
                >
                  {meeting.transcript
                    ? "Summarize the transcript and extract action items."
                    : "Add a transcript first to enable AI summarization."}
                </p>
              </div>
              <button
                onClick={handleGenerateSummary}
                disabled={!meeting.transcript || isPending}
                style={{
                  ...primaryButtonStyle,
                  opacity: !meeting.transcript || isPending ? 0.5 : 1,
                  cursor:
                    !meeting.transcript || isPending
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {isLoading("ai") ? (
                  <SpinnerIcon />
                ) : (
                  <Sparkle size={13} weight="fill" />
                )}
                {isLoading("ai") ? "Generating..." : "Generate summary"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Expand toggle pill
// ---------------------------------------------------------------------------

function ExpandToggle({
  label,
  open,
  onToggle,
  accent = false,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "3px 9px",
        borderRadius: "20px",
        border: `1px solid ${
          open
            ? accent
              ? "var(--color-brand)"
              : "var(--color-warm-gray-400)"
            : "var(--color-warm-gray-200)"
        }`,
        background: open ? (accent ? "var(--color-brand)" : "var(--color-warm-gray-100)") : "transparent",
        color: open
          ? accent
            ? "#fff"
            : "var(--color-text-primary)"
          : "var(--color-text-tertiary)",
        fontSize: "10px",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.12s",
      }}
    >
      {accent && <Sparkle size={10} weight="fill" />}
      {label}
      <CaretDown
        size={9}
        style={{
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.15s",
        }}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionHeader({
  label,
  count,
  accent,
}: {
  label: string;
  count: number;
  accent?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "12px",
      }}
    >
      <div
        style={{
          width: 3,
          height: 14,
          borderRadius: "2px",
          background: accent ?? "var(--color-warm-gray-400)",
        }}
      />
      <span
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: accent ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          padding: "1px 7px",
          borderRadius: "20px",
          background: "var(--color-warm-gray-100)",
          fontSize: "10px",
          fontWeight: 600,
          color: "var(--color-text-tertiary)",
        }}
      >
        {count}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({
  ownerFirstName,
  onCreateClick,
}: {
  ownerFirstName: string;
  onCreateClick: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: "16px",
          background: "rgba(27, 119, 190, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <VideoCamera size={24} color="var(--color-brand)" weight="fill" />
      </div>
      <div>
        <p
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            marginBottom: "6px",
          }}
        >
          No meetings yet with {ownerFirstName}
        </p>
        <p
          style={{
            fontSize: "13px",
            color: "var(--color-text-tertiary)",
            maxWidth: "280px",
          }}
        >
          Schedule a check-in to stay aligned on their property and performance goals.
        </p>
      </div>
      <button onClick={onCreateClick} style={primaryButtonStyle}>
        <Plus size={14} weight="bold" />
        Schedule first meeting
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tiny spinner
// ---------------------------------------------------------------------------

function SpinnerIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      style={{
        animation: "spin 0.7s linear infinite",
        flexShrink: 0,
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Shared style tokens
// ---------------------------------------------------------------------------

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "10px",
  fontWeight: 700,
  color: "var(--color-text-tertiary)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: "5px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  borderRadius: "8px",
  border: "1px solid var(--color-warm-gray-200)",
  background: "var(--color-warm-gray-50)",
  fontSize: "13px",
  color: "var(--color-text-primary)",
  outline: "none",
  boxSizing: "border-box",
};

const primaryButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "7px 14px",
  borderRadius: "10px",
  background: "var(--color-brand)",
  color: "#fff",
  fontSize: "12px",
  fontWeight: 600,
  border: "none",
  cursor: "pointer",
  transition: "opacity 0.12s",
};

const ghostButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  padding: "7px 12px",
  borderRadius: "10px",
  background: "transparent",
  color: "var(--color-text-secondary)",
  fontSize: "12px",
  fontWeight: 500,
  border: "1px solid var(--color-warm-gray-200)",
  cursor: "pointer",
  transition: "background 0.12s",
};

const iconButtonStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "5px",
  borderRadius: "7px",
  color: "var(--color-text-tertiary)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background 0.12s, color 0.12s",
};

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function MeetingsTab({
  ownerId,
  ownerFirstName,
  ownerEmail,
  meetings: initialMeetings,
  properties,
  contactId,
  adminProfiles = [],
}: MeetingsTabProps) {
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const filtered = selectedDate
    ? meetings.filter((m) => {
        if (!m.scheduled_at) return false;
        const d = new Date(m.scheduled_at);
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return iso === selectedDate;
      })
    : meetings;

  const upcoming = filtered.filter((m) => m.status === "scheduled");
  const past = filtered.filter(
    (m) => m.status === "completed" || m.status === "cancelled",
  );

  function handleCreated(meeting: Meeting) {
    setMeetings((prev) => [meeting, ...prev]);
    setShowModal(false);
  }

  function handleUpdated(updated: Partial<Meeting> & { id: string }) {
    setMeetings((prev) =>
      prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)),
    );
  }

  function handleDeleted(id: string) {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
  }

  const isEmpty = meetings.length === 0;

  return (
    <div style={{ maxWidth: "900px" }}>
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          marginBottom: "16px",
        }}
      >
        <button onClick={() => setShowModal(true)} style={primaryButtonStyle}>
          <Plus size={13} weight="bold" />
          New meeting
        </button>
      </div>

      {/* Modal */}
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

      {/* Empty state */}
      {isEmpty && !showModal && (
        <EmptyState
          ownerFirstName={ownerFirstName}
          onCreateClick={() => setShowModal(true)}
        />
      )}

      {/* Two-column layout */}
      {!isEmpty && (
        <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
          {/* Left: mini calendar */}
          <div style={{ flexShrink: 0, position: "sticky", top: "20px" }}>
            <MeetingsMiniCal
              meetings={meetings}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </div>

          {/* Right: meeting list */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {selectedDate && filtered.length === 0 && (
              <div
                style={{
                  padding: "20px",
                  textAlign: "center",
                  color: "var(--color-text-tertiary)",
                  fontSize: "12px",
                }}
              >
                No meetings on this date.
              </div>
            )}

            {/* Upcoming section */}
            {upcoming.length > 0 && (
              <div style={{ marginBottom: "28px" }}>
                <SectionHeader label="Upcoming" count={upcoming.length} accent="#1B77BE" />
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {upcoming.map((m) => (
                    <MeetingCard
                      key={m.id}
                      meeting={m}
                      ownerId={ownerId}
                      ownerEmail={ownerEmail}
                      properties={properties}
                      contactId={contactId}
                      onUpdated={handleUpdated}
                      onDeleted={handleDeleted}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past section */}
            {past.length > 0 && (
              <div>
                <SectionHeader label="Past meetings" count={past.length} />
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {past.map((m) => (
                    <MeetingCard
                      key={m.id}
                      meeting={m}
                      ownerId={ownerId}
                      ownerEmail={ownerEmail}
                      properties={properties}
                      contactId={contactId}
                      muted
                      onUpdated={handleUpdated}
                      onDeleted={handleDeleted}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
