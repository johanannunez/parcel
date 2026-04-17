import type { ReactNode } from 'react';
import type { Insight } from '@/lib/admin/ai-insights';

export type StageColor =
  | 'blue' | 'violet' | 'green' | 'amber' | 'red' | 'gray';

export type StageDef = {
  key: string;             // stable key (e.g., 'onboarding')
  label: string;           // display ("Onboarding")
  color: StageColor;       // header gradient
  sublabel?: string;       // e.g., "avg 8d in stage"
  totalLabel?: string;     // e.g., "$5,200 /mo"
};

export type StatusCardData = {
  id: string;
  href: string;
  coverUrl: string | null;      // real photo (properties)
  coverGradient: string | null; // fallback gradient (contacts/projects)
  coverEmoji: string | null;    // optional emoji on gradient covers
  statusPill: { label: string; tone: 'live' | 'onb' | 'review' | 'stuck' | 'paused' | 'info' } | null;
  stageBadge: string | null;    // e.g., "Day 5" in top-right
  name: string;
  subline: string | null;       // company or address
  stats: Array<{ label: string; value: string; fillPct?: number; tone?: 'ok' | 'warn' | 'bad' }>;
  assigneeAvatars: Array<{ src: string | null; initials: string; label?: string }>;
  dueTag: { label: string; tone: 'bad' | 'warn' | 'calm' | 'green' } | null;
  insight: Insight | null;
};

export type StatusColumnData = {
  stage: StageDef;
  cards: StatusCardData[];
};

export type StatusBoardProps = {
  columns: StatusColumnData[];
  emptyMessage?: ReactNode;
};
