'use client';

import styles from './RecurrencePicker.module.css';
import type { RecurrenceFreq, RecurrenceRule } from './DatePickerDropdown';

type Props = {
  value: RecurrenceRule | null;
  onChange: (rule: RecurrenceRule | null) => void;
};

type Option = {
  label: string;
  freq: RecurrenceFreq | null;
  interval: number;
};

const OPTIONS: Option[] = [
  { label: 'None', freq: null, interval: 0 },
  { label: 'Daily', freq: 'daily', interval: 1 },
  { label: 'Weekly', freq: 'weekly', interval: 1 },
  { label: 'Biweekly', freq: 'biweekly', interval: 2 },
  { label: 'Monthly', freq: 'monthly', interval: 1 },
  { label: 'Quarterly', freq: 'quarterly', interval: 3 },
  { label: 'Yearly', freq: 'yearly', interval: 1 },
];

export function RecurrencePicker({ value, onChange }: Props) {
  function isActive(opt: Option): boolean {
    if (opt.freq === null) return value === null;
    return value?.freq === opt.freq;
  }

  function handleClick(opt: Option) {
    if (opt.freq === null) {
      onChange(null);
    } else {
      onChange({ freq: opt.freq, interval: opt.interval });
    }
  }

  return (
    <div className={styles.list}>
      {OPTIONS.map((opt) => (
        <button
          key={opt.label}
          type="button"
          className={`${styles.optRow} ${isActive(opt) ? styles.optRowActive : ''}`}
          onClick={() => handleClick(opt)}
        >
          <span className={styles.optLabel}>{opt.label}</span>
          {isActive(opt) && <span className={styles.optCheck}>✓</span>}
        </button>
      ))}
    </div>
  );
}
