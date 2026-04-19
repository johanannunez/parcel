'use client';

import { useSearchParams } from 'next/navigation';
import {
  PipelineViewSwitcher,
  type PipelineViewMode,
} from '@/components/admin/chrome/PipelineViewSwitcher';

/**
 * Per-board supported view modes. Each contact board declares the views it
 * makes sense to render. Boards with a single supported mode show no switcher.
 */
const BOARD_SUPPORTED: Record<string, PipelineViewMode[]> = {
  'lead-pipeline': ['status', 'compact', 'map'], // kanban + list + map (property pins)
  'onboarding':    ['status', 'compact', 'map'], // kanban + list + map
  'active-owners': ['status', 'compact', 'map'], // grid + list + map
  'archived':      ['status', 'compact'],        // kanban by state (cold/paused/churned)
};

const BOARD_DEFAULT: Record<string, PipelineViewMode> = {
  'lead-pipeline': 'status',
  'onboarding':    'status',
  'active-owners': 'status', // 'status' renders the Active Owners grid
  'archived':      'status',
};

export function ContactsViewSwitcher() {
  const sp = useSearchParams();
  const viewKey = sp?.get('view') ?? 'lead-pipeline';
  const supported = BOARD_SUPPORTED[viewKey] ?? ['status', 'compact'];
  const defaultMode = BOARD_DEFAULT[viewKey] ?? 'compact';

  return (
    <PipelineViewSwitcher
      supported={supported}
      defaultMode={defaultMode}
    />
  );
}
