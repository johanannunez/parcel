'use client';

import { useId } from 'react';
import type { RecurrenceFreq, RecurrenceRule } from '@/lib/admin/recurrence';
import { humanizeRule } from '@/lib/admin/recurrence';
import styles from './RecurrenceField.module.css';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAY_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const FREQ_OPTIONS: { value: RecurrenceFreq; label: string }[] = [
  { value: 'daily',   label: 'Daily' },
  { value: 'weekly',  label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly',  label: 'Yearly' },
];

type NotifyPreset = { label: string; hours: number };
const NOTIFY_PRESETS: NotifyPreset[] = [
  { label: '1 day',  hours: 24 },
  { label: '3 days', hours: 72 },
  { label: '1 week', hours: 168 },
  { label: '2 weeks', hours: 336 },
  { label: '1 month', hours: 720 },
];

function defaultRule(): RecurrenceRule {
  return { freq: 'weekly', interval: 1 };
}

type Props = {
  value: RecurrenceRule | null;
  onChange: (next: RecurrenceRule | null) => void;
  preNotifyHours: number | null;
  onPreNotifyChange: (next: number | null) => void;
  disabled?: boolean;
};

export function RecurrenceField({
  value,
  onChange,
  preNotifyHours,
  onPreNotifyChange,
  disabled = false,
}: Props) {
  const toggleId = useId();
  const active = value !== null;
  const rule = value ?? defaultRule();

  function toggleActive() {
    if (disabled) return;
    if (active) {
      onChange(null);
      onPreNotifyChange(null);
    } else {
      onChange(defaultRule());
    }
  }

  function patch(partial: Partial<RecurrenceRule>) {
    if (disabled) return;
    onChange({ ...rule, ...partial });
  }

  function setFreq(freq: RecurrenceFreq) {
    // Reset freq-specific fields when switching
    const next: RecurrenceRule = {
      freq,
      interval: rule.interval,
      ends_on: rule.ends_on,
      notes: rule.notes,
    };
    onChange(next);
  }

  function toggleWeekday(day: number) {
    if (disabled) return;
    const current = rule.by_weekday ?? [];
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort((a, b) => a - b);
    patch({ by_weekday: next.length > 0 ? next : undefined });
  }

  return (
    <div className={styles.root}>
      {/* Active toggle */}
      <div className={styles.toggleRow}>
        <label htmlFor={toggleId} className={styles.toggleLabel}>
          {active ? 'Repeats' : 'Does not repeat'}
        </label>
        <label className={styles.toggle}>
          <input
            id={toggleId}
            type="checkbox"
            checked={active}
            onChange={toggleActive}
            disabled={disabled}
          />
          <span className={styles.toggleTrack} />
          <span className={styles.toggleThumb} />
        </label>
      </div>

      {active && (
        <div className={styles.panel}>
          {/* Frequency segmented control */}
          <div className={styles.freqRow}>
            {FREQ_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={disabled}
                className={`${styles.freqBtn}${rule.freq === opt.value ? ` ${styles.freqBtnActive}` : ''}`}
                onClick={() => setFreq(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Interval */}
          <div className={styles.intervalRow}>
            <span className={styles.intervalLabel}>Every</span>
            <input
              type="number"
              min={1}
              max={999}
              className={styles.intervalInput}
              value={rule.interval}
              disabled={disabled}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (!isNaN(n) && n >= 1) patch({ interval: n });
              }}
            />
            <span className={styles.intervalLabel}>
              {rule.interval === 1
                ? rule.freq === 'daily' ? 'day'
                : rule.freq === 'weekly' ? 'week'
                : rule.freq === 'monthly' ? 'month'
                : 'year'
                : rule.freq === 'daily' ? 'days'
                : rule.freq === 'weekly' ? 'weeks'
                : rule.freq === 'monthly' ? 'months'
                : 'years'}
            </span>
          </div>

          {/* Weekly: day-of-week checkboxes */}
          {rule.freq === 'weekly' && (
            <div className={styles.weekdays}>
              {WEEKDAY_LABELS.map((label, idx) => {
                const isActive = (rule.by_weekday ?? []).includes(idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={disabled}
                    title={WEEKDAY_FULL[idx]}
                    className={`${styles.weekdayBtn}${isActive ? ` ${styles.weekdayBtnActive}` : ''}`}
                    onClick={() => toggleWeekday(idx)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Monthly: day-of-month */}
          {rule.freq === 'monthly' && (
            <div className={styles.monthDayRow}>
              <span className={styles.monthDayLabel}>Day of month</span>
              <input
                type="number"
                min={1}
                max={31}
                className={styles.monthDayInput}
                value={rule.by_month_day ?? ''}
                disabled={disabled}
                placeholder="1"
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  if (!isNaN(n) && n >= 1 && n <= 31) patch({ by_month_day: n });
                  else if (e.target.value === '') patch({ by_month_day: undefined });
                }}
              />
            </div>
          )}

          {/* Ends on */}
          <div className={styles.endsRow}>
            <span className={styles.endsLabel}>Ends</span>
            <div className={styles.endsToggle}>
              <button
                type="button"
                disabled={disabled}
                className={`${styles.endsBtn}${!rule.ends_on ? ` ${styles.endsBtnActive}` : ''}`}
                onClick={() => patch({ ends_on: null })}
              >
                Never
              </button>
              <button
                type="button"
                disabled={disabled}
                className={`${styles.endsBtn}${rule.ends_on ? ` ${styles.endsBtnActive}` : ''}`}
                onClick={() => {
                  if (!rule.ends_on) {
                    // Default to ~3 months from today
                    const d = new Date();
                    d.setMonth(d.getMonth() + 3);
                    patch({ ends_on: d.toISOString().split('T')[0] });
                  }
                }}
              >
                On date
              </button>
            </div>
            {rule.ends_on && (
              <input
                type="date"
                className={styles.endsDateInput}
                value={rule.ends_on}
                disabled={disabled}
                onChange={(e) => patch({ ends_on: e.target.value || null })}
              />
            )}
          </div>

          {/* Preview */}
          <p className={styles.preview}>{humanizeRule(rule)}</p>

          {/* Pre-notify */}
          <div className={styles.notifySection}>
            <span className={styles.notifyLabel}>Notify before due</span>
            <div className={styles.notifyPills}>
              <button
                type="button"
                disabled={disabled}
                className={`${styles.notifyPill}${preNotifyHours === null ? ` ${styles.notifyPillActive}` : ''}`}
                onClick={() => onPreNotifyChange(null)}
              >
                None
              </button>
              {NOTIFY_PRESETS.map((p) => (
                <button
                  key={p.hours}
                  type="button"
                  disabled={disabled}
                  className={`${styles.notifyPill}${preNotifyHours === p.hours ? ` ${styles.notifyPillActive}` : ''}`}
                  onClick={() => onPreNotifyChange(p.hours)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
