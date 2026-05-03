import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle,
  Clock,
  Handshake,
  HouseLine,
  NotePencil,
  Sparkle,
  UserCircle,
  VideoCamera,
} from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Meetings",
};

export const dynamic = "force-dynamic";

type ActionItem = {
  id: string;
  text: string;
  completed: boolean;
};

type MeetingCard = {
  id: string;
  ownerId: string;
  workspaceId: string | null;
  title: string;
  scheduledAt: string | null;
  durationMinutes: number | null;
  meetLink: string | null;
  status: string;
  visibility: string;
  aiSummary: string | null;
  actionItems: ActionItem[];
  ownerName: string;
  ownerEmail: string | null;
  propertyName: string | null;
};

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function firstRecord(value: unknown): UnknownRecord {
  return Array.isArray(value) ? asRecord(value[0]) : asRecord(value);
}

function textValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

function propertyNameFromRecord(property: UnknownRecord): string | null {
  const parts = [
    textValue(property.address_line1),
    textValue(property.address_line2),
    textValue(property.city),
    textValue(property.state),
    textValue(property.postal_code),
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(", ") : null;
}

function parseActionItems(value: unknown): ActionItem[] {
  const raw = Array.isArray(value) ? value : [];
  return raw
    .map((item) => {
      const row = asRecord(item);
      const text = textValue(row.text);
      if (!text) return null;
      return {
        id: textValue(row.id) ?? text,
        text,
        completed: Boolean(row.completed),
      };
    })
    .filter((item): item is ActionItem => item !== null);
}

function formatDateParts(iso: string | null): {
  month: string;
  day: string;
  time: string;
  full: string;
} {
  if (!iso) {
    return { month: "TBD", day: "Set", time: "No time", full: "Date not set" };
  }
  const date = new Date(iso);
  return {
    month: date.toLocaleDateString("en-US", { month: "short" }),
    day: date.toLocaleDateString("en-US", { day: "2-digit" }),
    time: date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
    full: date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
  };
}

function durationLabel(minutes: number | null): string {
  if (!minutes) return "Duration not set";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours} hr ${remaining} min` : `${hours} hr`;
}

function visibilityLabel(visibility: string): string {
  if (visibility === "shared") return "Owner visible";
  if (visibility === "private") return "Internal";
  return visibility.charAt(0).toUpperCase() + visibility.slice(1);
}

function shortDateLabel(iso: string | null): string {
  if (!iso) return "Not scheduled";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function completedDateTimeLabel(iso: string): string {
  const date = formatDateParts(iso);
  return `${date.full} at ${date.time}`;
}

function statusLabel(status: string): string {
  if (status === "completed") return "Recapped";
  if (status === "cancelled") return "Cancelled";
  return "Scheduled";
}

function statusClass(status: string): string {
  if (status === "completed") return styles.statusCompleted;
  if (status === "cancelled") return styles.statusCancelled;
  return styles.statusScheduled;
}

function ownerMeetingHref(meeting: MeetingCard): string {
  return meeting.workspaceId
    ? `/admin/workspaces/${meeting.workspaceId}?tab=meetings`
    : "/admin/workspaces?view=active-owners";
}

function recapSummary(meeting: MeetingCard): string {
  return meeting.aiSummary ?? "Summary will appear once the meeting recap is ready.";
}

async function fetchMeetings(): Promise<MeetingCard[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("owner_meetings")
    .select(`
      id,
      owner_id,
      title,
      scheduled_at,
      duration_minutes,
      meet_link,
      status,
      visibility,
      ai_summary,
      action_items,
      profiles!owner_meetings_owner_id_fkey(full_name, email, workspace_id),
      properties!owner_meetings_property_id_fkey(address_line1, address_line2, city, state, postal_code)
    `)
    .order("scheduled_at", { ascending: true, nullsFirst: false })
    .limit(80);

  if (error) {
    console.error("[admin-meetings] fetch error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const record = asRecord(row);
    const owner = firstRecord(record.profiles);
    const property = firstRecord(record.properties);
    const ownerName =
      textValue(owner.full_name) ?? textValue(owner.email) ?? "Owner";
    const propertyName =
      Object.keys(property).length > 0 ? propertyNameFromRecord(property) : null;

    return {
      id: textValue(record.id) ?? "",
      ownerId: textValue(record.owner_id) ?? "",
      workspaceId: textValue(owner.workspace_id),
      title: textValue(record.title) ?? "Owner meeting",
      scheduledAt: textValue(record.scheduled_at),
      durationMinutes: numberValue(record.duration_minutes),
      meetLink: textValue(record.meet_link),
      status: textValue(record.status) ?? "scheduled",
      visibility: textValue(record.visibility) ?? "private",
      aiSummary: textValue(record.ai_summary),
      actionItems: parseActionItems(record.action_items),
      ownerName,
      ownerEmail: textValue(owner.email),
      propertyName,
    };
  });
}

export default async function AdminMeetingsPage() {
  const meetings = await fetchMeetings();
  const now = new Date().getTime();
  const upcoming = meetings
    .filter(
      (meeting) =>
        meeting.status === "scheduled" &&
        (!meeting.scheduledAt || new Date(meeting.scheduledAt).getTime() >= now),
    )
    .slice(0, 8);
  const completed = meetings
    .filter((meeting) => meeting.status === "completed")
    .slice(0, 6);
  const nextMeeting = upcoming[0] ?? null;
  const sharedCount = meetings.filter(
    (meeting) => meeting.visibility === "shared",
  ).length;
  const actionItemCount = meetings.reduce(
    (total, meeting) =>
      total + meeting.actionItems.filter((item) => !item.completed).length,
    0,
  );
  const recappedCount = meetings.filter((meeting) => meeting.aiSummary).length;
  const latestRecap = meetings
    .filter((meeting) => meeting.status === "completed" && meeting.scheduledAt)
    .sort(
      (first, second) =>
        new Date(second.scheduledAt ?? "").getTime() -
        new Date(first.scheduledAt ?? "").getTime(),
    )[0];
  const nextMeetingDate = nextMeeting
    ? formatDateParts(nextMeeting.scheduledAt)
    : null;

  return (
    <main className={styles.shell}>
      <div className={styles.inner}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div>
              <div className={styles.eyebrow}>
                <Handshake size={14} weight="duotone" />
                Owner relationships
              </div>
              <h1 className={styles.title}>Meetings that keep owners close.</h1>
              <p className={styles.subtitle}>
                A focused command center for scheduled conversations, recaps,
                recordings, and the follow-ups that protect every relationship.
              </p>
              <div className={styles.heroStats}>
                <div className={styles.heroStat}>
                  <div className={styles.statHeader}>
                    <span className={styles.statValue}>{upcoming.length}</span>
                    <span className={styles.statLabel}>Upcoming</span>
                  </div>
                  <span className={styles.statNote}>
                    {nextMeeting
                      ? `Next on ${shortDateLabel(nextMeeting.scheduledAt)}`
                      : "No owner touchpoint queued"}
                  </span>
                </div>
                <div className={styles.heroStat}>
                  <div className={styles.statHeader}>
                    <span className={styles.statValue}>{recappedCount}</span>
                    <span className={styles.statLabel}>With recaps</span>
                  </div>
                  <span className={styles.statNote}>
                    {meetings.length > 0
                      ? `${recappedCount} of ${meetings.length} summarized`
                      : "Summaries will appear here"}
                  </span>
                </div>
                <div className={styles.heroStat}>
                  <div className={styles.statHeader}>
                    <span className={styles.statValue}>{actionItemCount}</span>
                    <span className={styles.statLabel}>Open items</span>
                  </div>
                  <span className={styles.statNote}>
                    {actionItemCount === 1
                      ? "1 relationship follow-up"
                      : `${actionItemCount} relationship follow-ups`}
                  </span>
                </div>
              </div>
              <div className={styles.heroBrief}>
                <div>
                  <span>Owner visibility</span>
                  <strong>{sharedCount} shared</strong>
                </div>
                <div>
                  <span>Last recap</span>
                  <strong>{latestRecap ? shortDateLabel(latestRecap.scheduledAt) : "None yet"}</strong>
                </div>
                <div>
                  <span>Meeting link</span>
                  <strong>{nextMeeting?.meetLink ? "Ready" : "Needed"}</strong>
                </div>
              </div>
            </div>

            <div className={styles.nextCard}>
              <div className={styles.nextLabel}>
                <CalendarCheck size={14} weight="duotone" />
                Next meeting
              </div>
              {nextMeeting ? (
                <>
                  <h2 className={styles.nextTitle}>{nextMeeting.title}</h2>
                  <div className={styles.nextMeta}>
                    <div className={styles.nextMetaRow}>
                      <UserCircle size={15} weight="duotone" />
                      {nextMeeting.ownerName}
                    </div>
                    <div className={styles.nextMetaRow}>
                      <Clock size={15} weight="duotone" />
                      {nextMeetingDate?.full} at {nextMeetingDate?.time}
                    </div>
                    {nextMeeting.propertyName ? (
                      <div className={styles.nextMetaRow}>
                        <HouseLine size={15} weight="duotone" />
                        {nextMeeting.propertyName}
                      </div>
                    ) : null}
                  </div>
                  <div className={styles.nextDetails}>
                    <div>
                      <span>Duration</span>
                      <strong>{durationLabel(nextMeeting.durationMinutes)}</strong>
                    </div>
                    <div>
                      <span>Visibility</span>
                      <strong>{visibilityLabel(nextMeeting.visibility)}</strong>
                    </div>
                    <div>
                      <span>Link</span>
                      <strong>{nextMeeting.meetLink ? "Ready" : "Needed"}</strong>
                    </div>
                    <div>
                      <span>Contact</span>
                      <strong>{nextMeeting.ownerEmail ?? "Email not set"}</strong>
                    </div>
                  </div>
                  <div className={styles.nextActions}>
                    <Link
                      className={styles.primaryAction}
                      href={ownerMeetingHref(nextMeeting)}
                      prefetch={false}
                    >
                      Open relationship
                      <ArrowRight size={13} weight="bold" />
                    </Link>
                    {nextMeeting.meetLink ? (
                      <a
                        className={styles.secondaryAction}
                        href={nextMeeting.meetLink}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Join meeting
                      </a>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <h2 className={styles.nextTitle}>No meetings scheduled</h2>
                  <p className={styles.subtitle}>
                    Create the next owner touchpoint from a Workspace meeting tab.
                  </p>
                  <div className={styles.nextActions}>
                    <Link
                      className={styles.primaryAction}
                      href="/admin/workspaces"
                      prefetch={false}
                    >
                      Find a Workspace
                      <ArrowRight size={13} weight="bold" />
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <section className={styles.grid}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>
                <CalendarCheck size={18} weight="duotone" />
                Relationship agenda
              </h2>
              <span className={styles.panelNote}>{meetings.length} total</span>
            </div>
            {upcoming.length > 0 ? (
              <div className={styles.agenda}>
                {upcoming.map((meeting) => {
                  const date = formatDateParts(meeting.scheduledAt);
                  return (
                    <div
                      key={meeting.id}
                      className={styles.agendaRow}
                    >
                      <div className={styles.dateBlock}>
                        <span className={styles.dateMonth}>{date.month}</span>
                        <span className={styles.dateDay}>{date.day}</span>
                        <span className={styles.dateTime}>{date.time}</span>
                      </div>
                      <div className={styles.meetingDetails}>
                        <h3 className={styles.meetingTitle}>{meeting.title}</h3>
                        <div className={styles.meetingMeta}>
                          <span className={styles.metaChip}>
                            <UserCircle size={13} weight="duotone" />
                            {meeting.ownerName}
                          </span>
                          <span className={styles.metaChip}>
                            <Clock size={13} weight="duotone" />
                            {durationLabel(meeting.durationMinutes)}
                          </span>
                          {meeting.propertyName ? (
                            <span className={styles.metaChip}>
                              <HouseLine size={13} weight="duotone" />
                              {meeting.propertyName}
                            </span>
                          ) : null}
                        </div>
                        <div className={styles.attendeeStrip}>
                          <span className={styles.attendeeLabel}>Meeting with</span>
                          <span className={styles.attendeeName}>
                            <UserCircle size={14} weight="duotone" />
                            {meeting.ownerName}
                          </span>
                          {meeting.ownerEmail ? (
                            <span className={styles.attendeeEmail}>
                              {meeting.ownerEmail}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className={styles.agendaActions}>
                        <span
                          className={`${styles.statusPill} ${statusClass(
                            meeting.status,
                          )}`}
                        >
                          {statusLabel(meeting.status)}
                        </span>
                        <div className={styles.agendaButtons}>
                          {meeting.meetLink ? (
                            <a
                              className={styles.joinAction}
                              href={meeting.meetLink}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <VideoCamera size={13} weight="duotone" />
                              Join
                            </a>
                          ) : (
                            <span className={styles.missingLink}>No link yet</span>
                          )}
                          <Link
                            className={styles.openAction}
                            href={ownerMeetingHref(meeting)}
                            prefetch={false}
                          >
                            Open
                            <ArrowRight size={12} weight="bold" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="No upcoming owner meetings"
                copy="The agenda will fill in as meetings are scheduled from Workspace pages."
              />
            )}
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>
                <Sparkle size={18} weight="duotone" />
                Meeting health
              </h2>
              <span className={styles.panelNote}>Relationship signals</span>
            </div>
            <div className={styles.insightGrid}>
              <InsightCard
                icon={<VideoCamera size={16} weight="duotone" />}
                value={String(sharedCount)}
                label="Shared"
                text="Visible touchpoints owners can see from their portal."
              />
              <InsightCard
                icon={<NotePencil size={16} weight="duotone" />}
                value={String(completed.length)}
                label="Completed"
                text="Finished conversations ready for review or follow-up."
              />
              <InsightCard
                icon={<CheckCircle size={16} weight="duotone" />}
                value={String(actionItemCount)}
                label="Follow-ups"
                text="Action items still waiting for completion."
              />
              <InsightCard
                icon={<Sparkle size={16} weight="duotone" />}
                value={String(recappedCount)}
                label="Recapped"
                text="Meetings with a summary already attached."
              />
            </div>
          </div>
        </section>

        <section className={`${styles.panel} ${styles.recentList}`}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>
              <CheckCircle size={18} weight="duotone" />
              Recent recaps
            </h2>
            <span className={styles.panelNote}>{completed.length} shown</span>
          </div>
          {completed.length > 0 ? (
            <div className={styles.recentItems}>
              {completed.map((meeting) => (
                <Link
                  key={meeting.id}
                  className={styles.recentItem}
                  href={ownerMeetingHref(meeting)}
                  prefetch={false}
                >
                  <div className={styles.recapMain}>
                    <h3 className={styles.recentTitle}>{meeting.title}</h3>
                    <p className={styles.recentMeta}>{recapSummary(meeting)}</p>
                  </div>
                  <div className={styles.recapFacts}>
                    <span className={styles.recapFact}>
                      <UserCircle size={13} weight="duotone" />
                      <span>With</span>
                      <strong>{meeting.ownerName}</strong>
                    </span>
                    {meeting.propertyName ? (
                      <span className={styles.recapFact}>
                        <HouseLine size={13} weight="duotone" />
                        <span>Property</span>
                        <strong>{meeting.propertyName}</strong>
                      </span>
                    ) : null}
                    {meeting.scheduledAt ? (
                      <span className={styles.recapFact}>
                        <CalendarCheck size={13} weight="duotone" />
                        <span>Completed</span>
                        <strong>{completedDateTimeLabel(meeting.scheduledAt)}</strong>
                      </span>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No recaps yet"
              copy="Completed meetings with summaries will appear here."
            />
          )}
        </section>
      </div>
    </main>
  );
}

function InsightCard({
  icon,
  value,
  label,
  text,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  text: string;
}) {
  return (
    <div className={styles.insight} aria-label={`${label}: ${value}. ${text}`}>
      <div className={styles.insightTopline}>
        <span className={styles.insightIcon}>{icon}</span>
        <span className={styles.insightNumber}>{value}</span>
      </div>
      <div className={styles.insightLabel}>{label}</div>
    </div>
  );
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <div className={styles.empty}>
      <div>
        <span className={styles.emptyIcon}>
          <Handshake size={24} weight="duotone" />
        </span>
        <h3 className={styles.emptyTitle}>{title}</h3>
        <p className={styles.emptyCopy}>{copy}</p>
      </div>
    </div>
  );
}
