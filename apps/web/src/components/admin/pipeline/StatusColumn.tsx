'use client';

import { StatusCard } from './StatusCard';
import { ContactStatusCard } from './ContactStatusCard';
import type { ColumnState, StatusColumnData } from './pipeline-types';
import styles from './StatusColumn.module.css';

// Solid / gradient per column color. Darker, compact, similar to featured tile.
const HEAD_BG: Record<string, string> = {
  blue:   'linear-gradient(135deg, #02AAEB 0%, #1B77BE 100%)',
  violet: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
  green:  'linear-gradient(135deg, #10B981 0%, #047857 100%)',
  amber:  'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
  red:    'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
  gray:   'linear-gradient(135deg, #64748B 0%, #334155 100%)',
};

type Props = {
  data: StatusColumnData;
  state: ColumnState;
  onStateChange: (next: ColumnState) => void;
};

export function StatusColumn({ data, state, onStateChange }: Props) {
  const bg = HEAD_BG[data.stage.color] ?? HEAD_BG.gray;

  if (state === 'collapsed') {
    return (
      <button
        type="button"
        className={styles.rail}
        style={{ background: bg }}
        onClick={() => onStateChange('shown')}
        aria-label={`Expand ${data.stage.label}`}
        title={`Expand ${data.stage.label}`}
      >
        <span className={styles.railCount}>{data.cards.length}</span>
        <span className={styles.railLabel}>{data.stage.label}</span>
      </button>
    );
  }

  return (
    <div className={styles.col}>
      <header className={styles.head} style={{ background: bg }}>
        <div className={styles.topRow}>
          <span className={styles.name}>{data.stage.label}</span>
          <span className={styles.headActions}>
            <span className={styles.count}>{data.cards.length}</span>
            <button
              type="button"
              className={styles.collapseBtn}
              onClick={() => onStateChange('collapsed')}
              aria-label={`Collapse ${data.stage.label}`}
              title="Collapse column"
            >
              ›
            </button>
          </span>
        </div>
        {data.stage.totalLabel ? (
          <div className={styles.total}>{data.stage.totalLabel}</div>
        ) : null}
        {data.stage.sublabel ? (
          <div className={styles.sub}>{data.stage.sublabel}</div>
        ) : null}
      </header>
      <div className={styles.cards}>
        {data.cards.map((c) =>
          c.cardVariant === 'person' ? (
            <ContactStatusCard key={c.id} card={c} />
          ) : (
            <StatusCard key={c.id} card={c} />
          ),
        )}
      </div>
    </div>
  );
}
