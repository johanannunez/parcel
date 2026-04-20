'use client';

import styles from './LayerToggleBar.module.css';

export type LayerKey = 'owners' | 'properties' | 'projects' | 'tasks';

export type LayerState = Record<LayerKey, boolean>;

const LAYER_CONFIG: { key: LayerKey; label: string; color: string }[] = [
  { key: 'owners',     label: 'Owners',     color: '#10B981' },
  { key: 'properties', label: 'Properties', color: '#02AAEB' },
  { key: 'projects',   label: 'Projects',   color: '#8B5CF6' },
  { key: 'tasks',      label: 'Tasks',      color: '#F59E0B' },
];

type Props = {
  layers: LayerState;
  onToggle: (key: LayerKey) => void;
};

export function LayerToggleBar({ layers, onToggle }: Props) {
  return (
    <div className={styles.bar}>
      {LAYER_CONFIG.map(({ key, label, color }) => {
        const active = layers[key];
        return (
          <button
            key={key}
            type="button"
            className={`${styles.chip} ${active ? styles.chipActive : styles.chipInactive}`}
            style={active ? { background: color, borderColor: color } : undefined}
            onClick={() => onToggle(key)}
            aria-pressed={active}
            aria-label={`${active ? 'Hide' : 'Show'} ${label}`}
          >
            <span
              className={styles.dot}
              style={{ background: active ? 'rgba(255,255,255,0.8)' : color }}
            />
            {label}
          </button>
        );
      })}
    </div>
  );
}
