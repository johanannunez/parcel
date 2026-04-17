'use client';
import type { StatusBoardProps } from './pipeline-types';
import { StatusColumn } from './StatusColumn';
import styles from './StatusBoard.module.css';

export function StatusBoard({ columns, emptyMessage }: StatusBoardProps) {
  if (columns.length === 0) {
    return <div className={styles.empty}>{emptyMessage ?? 'No data.'}</div>;
  }
  return (
    <div className={styles.board}>
      {columns.map((col) => (
        <StatusColumn key={col.stage.key} data={col} />
      ))}
    </div>
  );
}
