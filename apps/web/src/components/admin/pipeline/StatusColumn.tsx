import { StatusCard } from './StatusCard';
import type { StatusColumnData } from './pipeline-types';
import styles from './StatusColumn.module.css';

const GRADIENTS: Record<string, string> = {
  blue:   'linear-gradient(135deg, #02AAEB 0%, #1B77BE 100%)',
  violet: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
  green:  'linear-gradient(135deg, #10B981 0%, #047857 100%)',
  amber:  'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
  red:    'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
  gray:   'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
};

export function StatusColumn({ data }: { data: StatusColumnData }) {
  const gradient = GRADIENTS[data.stage.color] ?? GRADIENTS.gray;
  return (
    <div className={styles.col}>
      <header
        className={styles.head}
        style={{ background: gradient }}
      >
        <div className={styles.topRow}>
          <span className={styles.name}>{data.stage.label.toUpperCase()}</span>
          <span className={styles.count}>{data.cards.length}</span>
        </div>
        {data.stage.totalLabel ? (
          <div className={styles.total}>{data.stage.totalLabel}</div>
        ) : null}
        {data.stage.sublabel ? (
          <div className={styles.sub}>{data.stage.sublabel.toUpperCase()}</div>
        ) : null}
      </header>
      <div className={styles.cards}>
        {data.cards.map((c) => (
          <StatusCard key={c.id} card={c} />
        ))}
      </div>
    </div>
  );
}
