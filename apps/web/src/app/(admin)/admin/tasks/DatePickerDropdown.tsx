'use client';

import { useState, useEffect, useRef } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import styles from './DatePickerDropdown.module.css';

export type DatePickerDropdownProps = {
  value: string | null;
  onChange: (iso: string | null) => void;
  onClose: () => void;
};

const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toLocalMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseISODate(iso: string): Date {
  const parts = iso.split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function formatChipDate(iso: string): string {
  const d = parseISODate(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getNextWeekday(dayOfWeek: number): Date {
  const today = toLocalMidnight(new Date());
  const diff = ((dayOfWeek - today.getDay() + 7) % 7) || 7;
  const result = new Date(today);
  result.setDate(today.getDate() + diff);
  return result;
}

type CalendarState = {
  year: number;
  month: number;
};

type MonthCalendarProps = {
  calState: CalendarState;
  onPrev: () => void;
  onNext: () => void;
  selected: string | null;
  onSelect: (iso: string) => void;
};

function MonthCalendar({ calState, onPrev, onNext, selected, onSelect }: MonthCalendarProps) {
  const today = toLocalMidnight(new Date());
  const todayISO = toISODate(today);

  const firstDay = new Date(calState.year, calState.month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(calState.year, calState.month + 1, 0).getDate();
  const daysInPrevMonth = new Date(calState.year, calState.month, 0).getDate();

  const cells: Array<{ iso: string; day: number; otherMonth: boolean }> = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(calState.year, calState.month - 1, daysInPrevMonth - i);
    cells.push({ iso: toISODate(d), day: daysInPrevMonth - i, otherMonth: true });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(calState.year, calState.month, d);
    cells.push({ iso: toISODate(date), day: d, otherMonth: false });
  }

  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(calState.year, calState.month + 1, d);
    cells.push({ iso: toISODate(date), day: d, otherMonth: true });
  }

  return (
    <>
      <div className={styles.calHeader}>
        <button type="button" className={styles.calNavBtn} onClick={onPrev} aria-label="Previous month">
          <CaretLeft size={14} weight="bold" />
        </button>
        <span className={styles.calMonthLabel}>
          {MONTH_NAMES[calState.month]} {calState.year}
        </span>
        <button type="button" className={styles.calNavBtn} onClick={onNext} aria-label="Next month">
          <CaretRight size={14} weight="bold" />
        </button>
      </div>

      <div className={styles.calDayNames}>
        {DAY_NAMES.map((name, idx) => (
          <div key={idx} className={styles.calDayName}>{name}</div>
        ))}
      </div>

      <div className={styles.calGrid}>
        {cells.map(({ iso, day, otherMonth }) => {
          const isToday = iso === todayISO;
          const isSelected = iso === selected;
          let cellClass = styles.calCell;
          if (otherMonth) cellClass += ` ${styles.calCellOtherMonth}`;
          if (isToday) cellClass += ` ${styles.calCellToday}`;
          if (isSelected && !isToday) cellClass += ` ${styles.calCellSelected}`;
          return (
            <button
              key={iso}
              type="button"
              className={cellClass}
              onClick={() => onSelect(iso)}
              aria-label={iso}
              aria-pressed={isSelected}
            >
              {day}
            </button>
          );
        })}
      </div>
    </>
  );
}

export function DatePickerDropdown({ value, onChange, onClose }: DatePickerDropdownProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const initDate = value ? parseISODate(value) : new Date();
  const [calDisplay, setCalDisplay] = useState<CalendarState>({
    year: initDate.getFullYear(),
    month: initDate.getMonth(),
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const today = toLocalMidnight(new Date());
  const todayISO = toISODate(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowISO = toISODate(tomorrow);
  const nextSat = getNextWeekday(6);
  const nextMon = getNextWeekday(1);

  function prevMonth() {
    setCalDisplay((prev) => {
      let m = prev.month - 1;
      let y = prev.year;
      if (m < 0) { m = 11; y--; }
      return { year: y, month: m };
    });
  }

  function nextMonth() {
    setCalDisplay((prev) => {
      let m = prev.month + 1;
      let y = prev.year;
      if (m > 11) { m = 0; y++; }
      return { year: y, month: m };
    });
  }

  const presets = [
    {
      label: 'Today',
      iso: todayISO,
      right: SHORT_DAY_NAMES[today.getDay()],
    },
    {
      label: 'Tomorrow',
      iso: tomorrowISO,
      right: SHORT_DAY_NAMES[tomorrow.getDay()],
    },
    {
      label: 'This weekend',
      iso: toISODate(nextSat),
      right: `Sat ${nextSat.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
    },
    {
      label: 'Next week',
      iso: toISODate(nextMon),
      right: `Mon ${nextMon.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
    },
    { label: 'No date', iso: null, right: '' },
  ];

  return (
    <div ref={panelRef} className={styles.panel}>
      {value && (
        <div className={styles.chipRow}>
          <span className={styles.chip}>
            {formatChipDate(value)}
            <button
              type="button"
              className={styles.chipClear}
              onClick={() => { onChange(null); onClose(); }}
              aria-label="Clear date"
            >
              ×
            </button>
          </span>
        </div>
      )}

      <div>
        {presets.map(({ label, iso, right }) => (
          <button
            key={label}
            type="button"
            className={styles.presetBtn}
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

      <MonthCalendar
        calState={calDisplay}
        onPrev={prevMonth}
        onNext={nextMonth}
        selected={value}
        onSelect={(iso) => { onChange(iso); onClose(); }}
      />

      <div className={styles.timeRow}>
        <span className={styles.timeLabel}>Time</span>
        <span className={styles.timePlaceholder}>
          {value && value.includes('T') && value.length > 10
            ? new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
            : '—'}
        </span>
      </div>
    </div>
  );
}
