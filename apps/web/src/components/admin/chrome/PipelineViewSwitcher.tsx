'use client';

import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Kanban, List } from '@phosphor-icons/react';
import { useSetTopBarSlots } from './TopBarSlotsContext';
import styles from './PipelineViewSwitcher.module.css';

export type PipelineViewMode = 'compact' | 'status';

type TabDef = { key: PipelineViewMode; label: string; icon: React.ReactNode };

const TABS: TabDef[] = [
  { key: 'status',  label: 'Status',  icon: <Kanban  size={14} weight="duotone" /> },
  { key: 'compact', label: 'List',    icon: <List    size={14} weight="duotone" /> },
];

function Switcher({ activeKey }: { activeKey: PipelineViewMode }) {
  const router = useRouter();
  const sp = useSearchParams();
  const shellRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<CSSProperties>({ opacity: 0 });

  useLayoutEffect(() => {
    if (!shellRef.current) return;
    const active = shellRef.current.querySelector<HTMLElement>(`[data-key="${activeKey}"]`);
    if (!active) { setIndicator((p) => ({ ...p, opacity: 0 })); return; }
    const parentRect = shellRef.current.getBoundingClientRect();
    const rect = active.getBoundingClientRect();
    setIndicator({
      transform: `translateX(${rect.left - parentRect.left}px)`,
      width: `${rect.width}px`,
      opacity: 1,
    });
  }, [activeKey]);

  function navigate(mode: PipelineViewMode) {
    const params = new URLSearchParams(sp?.toString() ?? '');
    params.set('mode', mode);
    router.push(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div ref={shellRef} className={styles.switcher} role="tablist" aria-label="View mode">
      <span className={styles.indicator} style={indicator} aria-hidden />
      {TABS.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            data-key={tab.key}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            onClick={() => navigate(tab.key)}
          >
            <span className={styles.icon} aria-hidden>{tab.icon}</span>
            <span className={styles.label}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Injects a Status/List view switcher into the admin top bar center slot.
 * Render inside the page or layout that owns the switcher; it self-clears on unmount.
 */
export function PipelineViewSwitcher({ defaultMode = 'compact' }: { defaultMode?: PipelineViewMode }) {
  const sp = useSearchParams();
  const mode = (sp?.get('mode') as PipelineViewMode | null) ?? defaultMode;

  useSetTopBarSlots(
    () => ({
      centerSlot: <Switcher activeKey={mode} />,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode],
  );

  return null;
}
