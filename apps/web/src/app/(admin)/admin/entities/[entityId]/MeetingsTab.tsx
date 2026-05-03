"use client";

import { useState } from "react";
import { VideoCamera, Phone, MapPin, Plus } from "@phosphor-icons/react";
import type { AdminProfile } from "@/app/(admin)/admin/entities/[entityId]/entity-person-actions";
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
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const ROW_ICONS: Record<
  string,
  { icon: React.ReactNode; rowIconClass: string; selectedClass: string }
> = {
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

  void adminProfiles;

  return (
    <div className={styles.root}>
      {/* LEFT PANEL */}
      <div className={styles.leftPanel}>
        <div className={styles.calWrapper}>
          <MeetingsMiniCal
            meetings={meetings}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        </div>

        <div className={styles.statsStrip}>
          <div className={styles.stat}>
            <span className={styles.statVal}>{meetings.length}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
          <div className={styles.stat}>
            <span className={[styles.statVal, styles.statValBlue].join(" ")}>
              {upcomingCount}
            </span>
            <span className={styles.statLabel}>Upcoming</span>
          </div>
          <div className={styles.stat}>
            <span className={[styles.statVal, styles.statValGreen].join(" ")}>
              {completedCount}
            </span>
            <span className={styles.statLabel}>Done</span>
          </div>
        </div>

        <button className={styles.newBtn} onClick={() => setShowModal(true)}>
          <Plus size={12} weight="bold" />
          New meeting
        </button>

        <div className={styles.meetingList}>
          {upcoming.length > 0 && (
            <>
              <div className={styles.listSection}>
                Upcoming{" "}
                <span className={styles.listCount}>{upcoming.length}</span>
              </div>
              {upcoming.map((m) => {
                const cfg = ROW_ICONS[m.meeting_type] ?? ROW_ICONS.video_call;
                const isSelected = m.id === selectedId;
                return (
                  <div
                    key={m.id}
                    className={[
                      styles.meetingRow,
                      isSelected ? cfg.selectedClass : "",
                    ].join(" ")}
                    onClick={() => setSelectedId(m.id)}
                  >
                    <div className={[styles.rowIcon, cfg.rowIconClass].join(" ")}>
                      {cfg.icon}
                    </div>
                    <div className={styles.rowBody}>
                      <div className={styles.rowTitle}>{m.title}</div>
                      <div className={styles.rowMeta}>
                        <span
                          className={[
                            styles.statusPill,
                            styles.statusUpcoming,
                          ].join(" ")}
                        >
                          Upcoming
                        </span>
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
              <div
                className={styles.listSection}
                style={{ marginTop: upcoming.length ? 8 : 0 }}
              >
                Past <span className={styles.listCount}>{past.length}</span>
              </div>
              {past.map((m) => {
                const cfg = ROW_ICONS[m.meeting_type] ?? ROW_ICONS.video_call;
                const isSelected = m.id === selectedId;
                const statusClass =
                  m.status === "completed"
                    ? styles.statusCompleted
                    : styles.statusCancelled;
                const statusLabel =
                  m.status === "completed" ? "Done" : "Cancelled";
                return (
                  <div
                    key={m.id}
                    className={[
                      styles.meetingRow,
                      isSelected ? cfg.selectedClass : "",
                    ].join(" ")}
                    onClick={() => setSelectedId(m.id)}
                  >
                    <div
                      className={[styles.rowIcon, cfg.rowIconClass].join(" ")}
                      style={{ opacity: 0.6 }}
                    >
                      {cfg.icon}
                    </div>
                    <div className={styles.rowBody}>
                      <div
                        className={styles.rowTitle}
                        style={{ opacity: 0.75 }}
                      >
                        {m.title}
                      </div>
                      <div className={styles.rowMeta}>
                        <span
                          className={[styles.statusPill, statusClass].join(" ")}
                        >
                          {statusLabel}
                        </span>
                        {m.scheduled_at && shortDate(m.scheduled_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {meetings.length === 0 && (
            <div
              style={{
                padding: "20px 12px",
                fontSize: "12px",
                color: "var(--color-text-tertiary)",
                textAlign: "center",
              }}
            >
              No meetings yet.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className={styles.rightPanel}>
        {meetings.length === 0 ? (
          <div className={styles.emptyRoot}>
            <VideoCamera size={36} weight="thin" style={{ opacity: 0.3 }} />
            <div className={styles.emptyTitle}>No meetings yet</div>
            <div className={styles.emptyBody}>
              Schedule your first meeting with {ownerFirstName} to track
              conversations, share recaps, and stay aligned.
            </div>
            <button
              className={styles.emptyNewBtn}
              onClick={() => setShowModal(true)}
            >
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
