"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import {
  Phone,
  VideoCamera,
  MapPin,
  X,
  Check,
  Warning,
  CalendarBlank,
  Clock,
} from "@phosphor-icons/react";
import type { AdminProfile } from "@/app/(admin)/admin/clients/[id]/client-actions";
import { createOwnerMeeting } from "./meetings-actions";
import styles from "./CreateMeetingModal.module.css";

type MeetingType = "phone_call" | "video_call" | "in_person";

type Property = { id: string; label: string };

type NewMeeting = {
  id: string;
  title: string;
  scheduled_at: string | null;
  duration_minutes: number | null;
  meet_link: string | null;
  status: string;
  transcript: null;
  ai_summary: null;
  action_items: [];
  notes: string | null;
  visibility: "shared" | "private";
  property_id: string | null;
  propertyLabel: string | null;
  created_at: string;
  meeting_type: MeetingType;
  calendar_event_id: string | null;
  attendee_ids: string[] | null;
  recording_url: string | null;
};

type Props = {
  ownerId: string;
  ownerFirstName: string;
  ownerEmail: string;
  properties: Property[];
  adminProfiles: AdminProfile[];
  onClose: () => void;
  onCreated: (meeting: NewMeeting) => void;
};

const TYPE_CONFIG: Record<MeetingType, { label: string; icon: React.ReactNode; defaultTitle: (name: string) => string }> = {
  phone_call: {
    label: "Phone Call",
    icon: <Phone size={18} weight="fill" />,
    defaultTitle: (name) => `Phone call with ${name}`,
  },
  video_call: {
    label: "Video Call",
    icon: <VideoCamera size={18} weight="fill" />,
    defaultTitle: (name) => `Video call with ${name}`,
  },
  in_person: {
    label: "In Person",
    icon: <MapPin size={18} weight="fill" />,
    defaultTitle: (name) => `In-person meeting with ${name}`,
  },
};

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120] as const;

function durationLabel(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function CreateMeetingModal({
  ownerId,
  ownerFirstName,
  ownerEmail,
  properties,
  adminProfiles,
  onClose,
  onCreated,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [meetingType, setMeetingType] = useState<MeetingType>("video_call");
  const [title, setTitle] = useState(TYPE_CONFIG.video_call.defaultTitle(ownerFirstName));
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState<number>(30);
  const [propertyId, setPropertyId] = useState("");
  const [meetLink, setMeetLink] = useState("");
  const [notes, setNotes] = useState("");
  const [visibility, setVisibility] = useState<"shared" | "private">("shared");
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);

  const titleRef = useRef<HTMLInputElement>(null);
  const userChangedTitle = useRef(false);

  useEffect(() => {
    if (!userChangedTitle.current) {
      setTitle(TYPE_CONFIG[meetingType].defaultTitle(ownerFirstName));
    }
  }, [meetingType, ownerFirstName]);

  function handleTypeSelect(type: MeetingType) {
    setMeetingType(type);
    userChangedTitle.current = false;
  }

  function toggleAttendee(id: string) {
    setAttendeeIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  }

  function handleSubmit() {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setError(null);

    const scheduledAt = date && time ? new Date(`${date}T${time}`).toISOString() : null;

    startTransition(async () => {
      const result = await createOwnerMeeting(ownerId, {
        title: title.trim(),
        scheduledAt,
        durationMinutes: duration,
        meetLink: meetLink.trim() || null,
        propertyId: propertyId || null,
        notes: notes.trim() || null,
        visibility,
        meetingType,
        attendeeIds: attendeeIds.length > 0 ? attendeeIds : null,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      const propertyObj = properties.find((p) => p.id === propertyId);
      onCreated({
        id: result.id ?? crypto.randomUUID(),
        title: title.trim(),
        scheduled_at: scheduledAt,
        duration_minutes: duration,
        meet_link: result.meetLink ?? (meetLink.trim() || null),
        status: "scheduled",
        transcript: null,
        ai_summary: null,
        action_items: [],
        notes: notes.trim() || null,
        visibility,
        property_id: propertyId || null,
        propertyLabel: propertyObj?.label ?? null,
        created_at: new Date().toISOString(),
        meeting_type: meetingType,
        calendar_event_id: result.calendarEventId ?? null,
        attendee_ids: attendeeIds.length > 0 ? attendeeIds : null,
        recording_url: null,
      });
    });
  }

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.headerTitle}>New meeting with {ownerFirstName}</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Meeting type picker */}
        <div className={styles.typeRow}>
          {(Object.entries(TYPE_CONFIG) as [MeetingType, typeof TYPE_CONFIG[MeetingType]][]).map(([type, config]) => (
            <button
              key={type}
              className={[styles.typeBtn, meetingType === type ? styles.typeBtnActive : ""].join(" ")}
              onClick={() => handleTypeSelect(type)}
            >
              <span className={styles.typeIcon}>{config.icon}</span>
              <span className={styles.typeLabel}>{config.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.body}>
          {/* Title */}
          <div className={styles.field}>
            <label className={styles.label}>Title</label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); userChangedTitle.current = true; }}
              className={styles.input}
              placeholder="Meeting title"
            />
          </div>

          {/* Date + Time + Duration */}
          <div className={styles.row3}>
            <div className={styles.field}>
              <label className={styles.label}>
                <CalendarBlank size={10} weight="bold" style={{ marginRight: 3 }} />
                Date
              </label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={styles.input} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>
                <Clock size={10} weight="bold" style={{ marginRight: 3 }} />
                Time
              </label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={styles.input} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Duration</label>
              <select value={duration} onChange={(e) => setDuration(parseInt(e.target.value, 10))} className={styles.input}>
                {DURATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>{durationLabel(d)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Attendees */}
          {adminProfiles.length > 0 && (
            <div className={styles.field}>
              <label className={styles.label}>Internal attendees</label>
              <div className={styles.attendeeList}>
                {adminProfiles.map((p) => {
                  const selected = attendeeIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleAttendee(p.id)}
                      className={[styles.attendeeChip, selected ? styles.attendeeChipActive : ""].join(" ")}
                    >
                      <div className={[styles.attendeeAvatar, selected ? styles.attendeeAvatarActive : ""].join(" ")}>
                        {p.avatarUrl
                          ? <img src={p.avatarUrl} alt={p.fullName} className={styles.avatarImg} />
                          : initials(p.fullName)
                        }
                      </div>
                      <span>{p.fullName}</span>
                      {selected && <Check size={10} weight="bold" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Meet link (only for video calls) */}
          {meetingType === "video_call" && (
            <div className={styles.field}>
              <label className={styles.label}>Google Meet link</label>
              <input
                type="url"
                value={meetLink}
                onChange={(e) => setMeetLink(e.target.value)}
                placeholder="https://meet.google.com/... (auto-filled if calendar connected)"
                className={styles.input}
              />
              <p className={styles.hint}>
                If your Google Calendar is connected, the Meet link will be created automatically when you save.
              </p>
            </div>
          )}

          {/* Property */}
          {properties.length > 0 && (
            <div className={styles.field}>
              <label className={styles.label}>Property</label>
              <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className={styles.input}>
                <option value="">No specific property</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div className={styles.field}>
            <label className={styles.label}>Notes / Agenda</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Agenda items, context, talking points..."
              className={styles.textarea}
            />
          </div>

          {/* Visibility */}
          <div className={styles.field}>
            <label className={styles.label}>Visibility</label>
            <div className={styles.visRow}>
              {(["shared", "private"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVisibility(v)}
                  className={[styles.visBtn, visibility === v ? styles.visBtnActive : ""].join(" ")}
                >
                  {v === "shared" ? "Shared with owner" : "Private (admin only)"}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className={styles.errorRow}>
              <Warning size={13} weight="fill" />
              {error}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button onClick={onClose} className={styles.cancelBtn}>Cancel</button>
          <button onClick={handleSubmit} disabled={isPending} className={styles.createBtn}>
            <Check size={13} weight="bold" />
            {isPending ? "Creating…" : "Create meeting"}
          </button>
        </div>
      </div>
    </div>
  );
}
