'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { DashboardCustomizer, useWidgetPrefs, type WidgetKey } from './DashboardCustomizer';
import styles from './DashboardClientShell.module.css';

export function DashboardClientShell({ children }: { children: ReactNode }) {
  const { prefs, toggle } = useWidgetPrefs();
  const gridRef = useRef<HTMLDivElement>(null);

  // Apply visibility to all [data-widget] sections based on prefs
  useEffect(() => {
    const allWidgetEls = document.querySelectorAll<HTMLElement>('[data-widget]');
    allWidgetEls.forEach((el) => {
      const key = el.getAttribute('data-widget') as WidgetKey;
      el.style.display = key && prefs[key] === false ? 'none' : '';
    });
    // Hide the bento grid container itself when every bento widget is hidden
    const grid = document.getElementById('dashboard-grid');
    if (grid) {
      const bentoCells = grid.querySelectorAll<HTMLElement>('[data-widget]');
      const allOff = Array.from(bentoCells).every((cell) => {
        const key = cell.getAttribute('data-widget') as WidgetKey;
        return key && prefs[key] === false;
      });
      grid.style.display = allOff && bentoCells.length > 0 ? 'none' : '';
    }
  }, [prefs]);

  return (
    <div ref={gridRef} className={styles.shell}>
      <div className={styles.customizerAnchor}>
        <DashboardCustomizer prefs={prefs} onToggle={toggle} />
      </div>
      {children}
    </div>
  );
}
