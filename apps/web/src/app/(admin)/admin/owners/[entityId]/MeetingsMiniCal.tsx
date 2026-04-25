"use client";

import { useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import type { ClientMeeting } from "@/lib/admin/client-meetings";
import styles from "./MeetingsMiniCal.module.css";

type Props = {
  meetings: ClientMeeting[];
  selectedDate: string | null;
  onDateSelect: (isoDate: string | null) => void;
};

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toLocalIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function MeetingsMiniCal({ meetings, selectedDate, onDateSelect }: Props) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const meetingsByDate = new Map<string, { upcoming: number; past: number }>();
  for (const m of meetings) {
    if (!m.scheduled_at) continue;
    const d = new Date(m.scheduled_at);
    const key = toLocalIso(d);
    const existing = meetingsByDate.get(key) ?? { upcoming: 0, past: 0 };
    if (m.status === "scheduled") existing.upcoming++;
    else existing.past++;
    meetingsByDate.set(key, existing);
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayIso = toLocalIso(today);

  const cells: Array<number | null> = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  function handleDayClick(day: number) {
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onDateSelect(selectedDate === iso ? null : iso);
  }

  const thisMonthMeetings = meetings.filter((m) => {
    if (!m.scheduled_at) return false;
    const d = new Date(m.scheduled_at);
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
  });
  const upcomingCount = meetings.filter((m) => m.status === "scheduled").length;
  const completedCount = meetings.filter((m) => m.status === "completed").length;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <button className={styles.navBtn} onClick={prevMonth} aria-label="Previous month">
          <CaretLeft size={12} weight="bold" />
        </button>
        <span className={styles.monthLabel}>{MONTHS[viewMonth]} {viewYear}</span>
        <button className={styles.navBtn} onClick={nextMonth} aria-label="Next month">
          <CaretRight size={12} weight="bold" />
        </button>
      </div>

      <div className={styles.grid}>
        {DAYS.map((d) => (
          <div key={d} className={styles.dayName}>{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const info = meetingsByDate.get(iso);
          const isToday = iso === todayIso;
          const isSelected = iso === selectedDate;
          return (
            <button
              key={iso}
              className={[
                styles.dayCell,
                isToday ? styles.today : "",
                isSelected ? styles.selected : "",
                info ? styles.hasMeeting : "",
              ].filter(Boolean).join(" ")}
              onClick={() => handleDayClick(day)}
            >
              <span className={styles.dayNum}>{day}</span>
              {info && (
                <span
                  className={[
                    styles.dot,
                    info.upcoming > 0 ? styles.dotUpcoming : styles.dotPast,
                  ].join(" ")}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className={styles.stats}>
        <span><strong>{thisMonthMeetings.length}</strong> this month</span>
        <span className={styles.statSep}>·</span>
        <span><strong>{upcomingCount}</strong> upcoming</span>
        <span className={styles.statSep}>·</span>
        <span><strong>{completedCount}</strong> completed</span>
      </div>
    </div>
  );
}
