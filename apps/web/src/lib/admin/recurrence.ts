export type RecurrenceFreq = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type RecurrenceRule = {
  freq: RecurrenceFreq;
  interval: number;           // every N (N >= 1)
  by_weekday?: number[];      // 0=Sun..6=Sat; only for weekly
  by_month_day?: number;      // 1..31; only for monthly
  ends_on?: string | null;    // ISO date; null = forever
  notes?: string;
};

export function nextOccurrence(from: Date, rule: RecurrenceRule): Date | null {
  if (rule.ends_on) {
    const end = new Date(rule.ends_on);
    if (from >= end) return null;
  }
  const next = new Date(from);
  const step = Math.max(1, rule.interval);

  switch (rule.freq) {
    case 'daily':
      next.setDate(next.getDate() + step);
      break;
    case 'weekly': {
      if (rule.by_weekday?.length) {
        // Find the next day that matches any by_weekday within the N-week window.
        let found = false;
        for (let i = 1; i <= 7 * step; i++) {
          next.setDate(from.getDate() + i);
          if (rule.by_weekday.includes(next.getDay())) { found = true; break; }
        }
        if (!found) {
          next.setTime(from.getTime());
          next.setDate(next.getDate() + step * 7);
        }
      } else {
        next.setDate(next.getDate() + step * 7);
      }
      break;
    }
    case 'monthly':
      next.setMonth(next.getMonth() + step);
      if (rule.by_month_day) {
        next.setDate(Math.min(rule.by_month_day, daysInMonth(next)));
      }
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + step);
      break;
  }

  if (rule.ends_on && next > new Date(rule.ends_on)) return null;
  return next;
}

function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export function humanizeRule(rule: RecurrenceRule | null): string {
  if (!rule) return 'Does not repeat';
  const every = rule.interval > 1 ? `every ${rule.interval}` : 'every';
  switch (rule.freq) {
    case 'daily':
      return `Repeats ${every} ${rule.interval > 1 ? 'days' : 'day'}`;
    case 'weekly': {
      const days = rule.by_weekday
        ?.map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d])
        .join(', ');
      return `Repeats ${every} ${rule.interval > 1 ? 'weeks' : 'week'}${days ? ` on ${days}` : ''}`;
    }
    case 'monthly': {
      const dom = rule.by_month_day ? ` on day ${rule.by_month_day}` : '';
      return `Repeats ${every} ${rule.interval > 1 ? 'months' : 'month'}${dom}`;
    }
    case 'yearly':
      return `Repeats ${every} ${rule.interval > 1 ? 'years' : 'year'}`;
  }
}
