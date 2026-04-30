'use client';

import { useState } from 'react';
import { CaretLeft, CaretRight, Repeat } from '@phosphor-icons/react';
import styles from './DatePickerDropdown.module.css';
import { RecurrencePicker } from './RecurrencePicker';

// ─── Recurrence types ────────────────────────────────────────────────────────

export type RecurrenceFreq = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
export type RecurrenceRule = { freq: RecurrenceFreq; interval: number };

// ─── Props ───────────────────────────────────────────────────────────────────

type Props = {
  value: string | null;
  onChange: (iso: string | null) => void;
  onClose: () => void;
  showRepeat?: boolean;
  onRepeatChange?: (rule: RecurrenceRule | null) => void;
  repeatValue?: RecurrenceRule | null;
};

// ─── Date helpers ────────────────────────────────────────────────────────────

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fromISO(s: string): Date {
  const parts = s.split('T')[0].split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function humanLabel(iso: string | null): string {
  if (!iso) return 'No date';
  const today = new Date();
  const todayISO = toISO(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const tomorrowDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const tomorrowISO = toISO(tomorrowDate);
  if (iso === todayISO) return 'Today';
  if (iso === tomorrowISO) return 'Tomorrow';
  const d = fromISO(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getDaysInMonth(year: number, month: number): Date[] {
  const count = new Date(year, month + 1, 0).getDate();
  const days: Date[] = [];
  for (let i = 1; i <= count; i++) {
    days.push(new Date(year, month, i));
  }
  return days;
}

function getWeekOffset(firstDay: Date): number {
  return firstDay.getDay(); // 0 = Sunday
}

function getNextWeekday(dayOfWeek: number): Date {
  const today = new Date();
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = ((dayOfWeek - base.getDay() + 7) % 7) || 7;
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + diff);
}

function recurrenceLabel(rule: RecurrenceRule | null): string {
  if (!rule) return 'No repeat';
  const labels: Record<RecurrenceFreq, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    biweekly: 'Biweekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
  };
  return labels[rule.freq];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DAY_HEADERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Component ───────────────────────────────────────────────────────────────

export function DatePickerDropdown({
  value,
  onChange,
  onClose,
  showRepeat = false,
  onRepeatChange,
  repeatValue,
}: Props) {
  const initDate = value ? fromISO(value) : new Date();
  const [calYear, setCalYear] = useState(initDate.getFullYear());
  const [calMonth, setCalMonth] = useState(initDate.getMonth());
  const [showRepeatPicker, setShowRepeatPicker] = useState(false);

  const today = new Date();
  const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayISO = toISO(todayNorm);

  const tomorrow = new Date(todayNorm.getFullYear(), todayNorm.getMonth(), todayNorm.getDate() + 1);
  const tomorrowISO = toISO(tomorrow);
  const nextSat = getNextWeekday(6);
  const nextMon = getNextWeekday(1);

  const presets = [
    { label: 'Today', iso: todayISO, right: SHORT_DAY_NAMES[todayNorm.getDay()] },
    { label: 'Tomorrow', iso: tomorrowISO, right: SHORT_DAY_NAMES[tomorrow.getDay()] },
    {
      label: 'This weekend',
      iso: toISO(nextSat),
      right: `Sat ${nextSat.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
    },
    {
      label: 'Next week',
      iso: toISO(nextMon),
      right: `Mon ${nextMon.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
    },
    { label: 'No date', iso: null as string | null, right: '' },
  ];

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else { setCalMonth(m => m - 1); }
  }

  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else { setCalMonth(m => m + 1); }
  }

  // Build calendar grid cells
  const firstDay = new Date(calYear, calMonth, 1);
  const offset = getWeekOffset(firstDay);
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const prevMonthDayCount = new Date(calYear, calMonth, 0).getDate();

  type Cell = { iso: string; day: number; otherMonth: boolean };
  const cells: Cell[] = [];

  for (let i = offset - 1; i >= 0; i--) {
    const d = new Date(calYear, calMonth - 1, prevMonthDayCount - i);
    cells.push({ iso: toISO(d), day: prevMonthDayCount - i, otherMonth: true });
  }

  for (const d of daysInMonth) {
    cells.push({ iso: toISO(d), day: d.getDate(), otherMonth: false });
  }

  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(calYear, calMonth + 1, i);
    cells.push({ iso: toISO(d), day: i, otherMonth: true });
  }

  return (
    <div className={styles.panel}>
      {/* Section 1: Selected chip */}
      {value && (
        <div className={styles.chipRow}>
          <span className={styles.chip}>
            {humanLabel(value)}
            <button
              type="button"
              className={styles.chipClear}
              onClick={() => onChange(null)}
              aria-label="Clear date"
            >
              ×
            </button>
          </span>
        </div>
      )}

      {/* Section 2: Presets */}
      <div className={styles.presets}>
        {presets.map(({ label, iso, right }) => (
          <button
            key={label}
            type="button"
            className={styles.presetRow}
            onClick={() => { onChange(iso); onClose(); }}
          >
            <span className={value && iso === value ? styles.presetLabelActive : styles.presetLabel}>
              {label}
            </span>
            {right && <span className={styles.presetRight}>{right}</span>}
          </button>
        ))}
      </div>

      <hr className={styles.divider} />

      {/* Section 3: Mini calendar */}
      <div className={styles.calHeader}>
        <button type="button" className={styles.calNavBtn} onClick={prevMonth} aria-label="Previous month">
          <CaretLeft size={13} weight="bold" />
        </button>
        <span className={styles.calMonthLabel}>
          {MONTH_NAMES[calMonth]} {calYear}
        </span>
        <button type="button" className={styles.calNavBtn} onClick={nextMonth} aria-label="Next month">
          <CaretRight size={13} weight="bold" />
        </button>
      </div>

      <div className={styles.calDayHeaders}>
        {DAY_HEADERS.map((h, i) => (
          <div key={i} className={styles.calDayHeader}>{h}</div>
        ))}
      </div>

      <div className={styles.calGrid}>
        {cells.map(({ iso, day, otherMonth }) => {
          const isToday = iso === todayISO;
          const isSelected = iso === value;
          let cls = styles.calCell;
          if (otherMonth) cls += ` ${styles.calCellOther}`;
          if (isToday && !isSelected) cls += ` ${styles.calCellToday}`;
          if (isSelected) cls += ` ${styles.calCellSelected}`;
          return (
            <button
              key={iso}
              type="button"
              className={cls}
              onClick={() => { onChange(iso); onClose(); }}
              aria-label={iso}
              aria-pressed={isSelected}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Section 4: Repeat row */}
      {showRepeat && (
        <>
          <hr className={styles.divider} />
          <button
            type="button"
            className={styles.repeatRow}
            onClick={() => setShowRepeatPicker(v => !v)}
          >
            <span className={styles.repeatIcon}>
              <Repeat size={14} />
            </span>
            <span className={styles.repeatLabel}>Repeat</span>
            <span className={styles.repeatValue}>
              {recurrenceLabel(repeatValue ?? null)}
            </span>
          </button>
          {showRepeatPicker && (
            <RecurrencePicker
              value={repeatValue ?? null}
              onChange={(rule) => {
                onRepeatChange?.(rule);
                setShowRepeatPicker(false);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
