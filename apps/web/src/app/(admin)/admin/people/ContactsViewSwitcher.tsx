'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import {
  PipelineViewSwitcher,
  type PipelineViewMode,
} from '@/components/admin/chrome/PipelineViewSwitcher';

/**
 * Per-board supported view modes. Each contact board declares the views it
 * makes sense to render. Boards with a single supported mode show no switcher.
 */
const BOARD_SUPPORTED: Record<string, PipelineViewMode[]> = {
  'lead-pipeline':   ['status', 'compact', 'map'],
  'onboarding':      ['status', 'compact', 'map'],
  'active-owners':   ['status', 'compact', 'map'],
  'offboarding':     ['status', 'compact'],
  'archived':        ['status', 'compact'],
};

const BOARD_DEFAULT: Record<string, PipelineViewMode> = {
  'lead-pipeline':   'status',
  'onboarding':      'status',
  'active-owners':   'status',
  'offboarding':     'status',
  'archived':        'status',
};

export function ContactsViewSwitcher() {
  const sp = useSearchParams();
  const pathname = usePathname();
  const defaultViewKey = pathname?.startsWith('/admin/entities')
    ? 'active-owners'
    : 'lead-pipeline';
  const viewKey = sp?.get('view') ?? defaultViewKey;
  const supported = BOARD_SUPPORTED[viewKey] ?? ['status', 'compact'];
  const defaultMode = BOARD_DEFAULT[viewKey] ?? 'compact';

  return (
    <PipelineViewSwitcher
      supported={supported}
      defaultMode={defaultMode}
    />
  );
}
