import styles from './MetricsBar.module.css';

export type MetricTile = {
  label: string;
  value: string;
  delta?: { text: string; tone?: 'ok' | 'warn' | 'bad' };
  featured?: boolean;
};

export function MetricsBar({ tiles }: { tiles: MetricTile[] }) {
  if (tiles.length === 0) return null;
  return (
    <div className={styles.bar}>
      {tiles.map((t, i) => (
        <div
          key={i}
          className={`${styles.tile} ${t.featured ? styles.featured : ''}`}
        >
          <div className={styles.label}>{t.label}</div>
          <div className={styles.value}>{t.value}</div>
          {t.delta ? (
            <div
              className={`${styles.delta} ${
                t.delta.tone === 'warn'
                  ? styles.deltaWarn
                  : t.delta.tone === 'bad'
                  ? styles.deltaBad
                  : ''
              }`}
            >
              {t.delta.text}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
