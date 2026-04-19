'use client';

import { useMemo } from 'react';
import type { ColumnState, StatusBoardProps } from './pipeline-types';
import { StatusColumn } from './StatusColumn';
import { useColumnStates } from './useColumnStates';
import styles from './StatusBoard.module.css';

export function StatusBoard({ columns, emptyMessage, boardKey }: StatusBoardProps) {
  const defaults = useMemo<Record<string, ColumnState>>(() => {
    const m: Record<string, ColumnState> = {};
    for (const c of columns) {
      m[c.stage.key] = c.collapsed ? 'collapsed' : 'shown';
    }
    return m;
  }, [columns]);

  const { stateOf, setState } = useColumnStates(boardKey, defaults);

  if (columns.length === 0) {
    return <div className={styles.empty}>{emptyMessage ?? 'No data.'}</div>;
  }

  return (
    <div className={styles.board}>
      {columns.map((col) => {
        const state = stateOf(col.stage.key);
        if (state === 'hidden') return null;
        return (
          <div
            key={col.stage.key}
            className={state === 'collapsed' ? styles.colCollapsed : styles.col}
          >
            <StatusColumn
              data={col}
              state={state}
              onStateChange={(next) => setState(col.stage.key, next)}
            />
          </div>
        );
      })}
    </div>
  );
}
