export type DueBucket = 'overdue' | 'today' | 'this_week' | 'later' | 'no_date';

export function bucketForDue(iso: string | null, now: Date = new Date()): DueBucket {
  if (!iso) return 'no_date';
  const due = new Date(iso);
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endToday = new Date(startToday.getTime() + 86400_000 - 1);
  if (due < startToday) return 'overdue';
  if (due <= endToday) return 'today';
  const dow = now.getDay(); // 0=Sun
  const daysToEndOfWeek = 7 - dow;
  const endOfWeek = new Date(endToday.getTime() + daysToEndOfWeek * 86400_000);
  if (due <= endOfWeek) return 'this_week';
  return 'later';
}

export const BUCKET_ORDER: DueBucket[] = [
  'overdue', 'today', 'this_week', 'later', 'no_date',
];

export const BUCKET_LABEL: Record<DueBucket, string> = {
  overdue: 'Overdue',
  today: 'Today',
  this_week: 'This Week',
  later: 'Later',
  no_date: 'No Date',
};
