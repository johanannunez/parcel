// Client-safe types and filter logic for the dashboard task surface.
// No server imports — safe to use in 'use client' components.
import type { Task } from '@/lib/admin/task-types';

export type DashboardTask = Task & {
  propertyName: string | null;
};

export type DashboardTaskFilter = 'all' | 'overdue' | 'today' | 'payouts' | 'maintenance';

const PAYOUT_KEYWORDS = ['payout', 'payment', 'pay out', 'transfer', 'disbursement', 'airbnb', 'vrbo', 'hospitable'];
const MAINTENANCE_KEYWORDS = ['maintenance', 'repair', 'fix', 'replace', 'broken', 'cleaning', 'hvac', 'plumbing', 'electrical', 'lawn', 'pest'];

function matchesKeywords(title: string, keywords: string[]): boolean {
  const lower = title.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

export function filterDashboardTasks(
  tasks: DashboardTask[],
  filter: DashboardTaskFilter,
): DashboardTask[] {
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  switch (filter) {
    case 'overdue':
      return tasks.filter((t) => t.dueAt && new Date(t.dueAt) < now);
    case 'today':
      return tasks.filter((t) => {
        if (!t.dueAt) return false;
        const due = new Date(t.dueAt);
        return due >= now && due <= endOfToday;
      });
    case 'payouts':
      return tasks.filter((t) => matchesKeywords(t.title, PAYOUT_KEYWORDS));
    case 'maintenance':
      return tasks.filter((t) => matchesKeywords(t.title, MAINTENANCE_KEYWORDS));
    default:
      return tasks;
  }
}
