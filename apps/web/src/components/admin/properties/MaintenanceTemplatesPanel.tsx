'use client';

import { useState, useTransition } from 'react';
import { applyTemplateToProperty, type TaskTemplate } from '@/lib/admin/template-actions';
import styles from './MaintenanceTemplatesPanel.module.css';

export function MaintenanceTemplatesPanel({
  propertyId,
  templates,
  alreadyAppliedIds,
}: {
  propertyId: string;
  templates: TaskTemplate[];
  alreadyAppliedIds: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusKind, setStatusKind] = useState<'success' | 'error' | null>(null);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const apply = () => {
    const ids = Array.from(selected);
    const total = ids.length;
    startTransition(async () => {
      setStatusMessage(null);
      setStatusKind(null);
      const failures: string[] = [];
      let successes = 0;
      try {
        for (const id of ids) {
          try {
            await applyTemplateToProperty({ templateId: id, propertyId });
            successes++;
          } catch (err) {
            const name = templates.find((t) => t.id === id)?.name ?? id;
            failures.push(name);
            console.error('[MaintenanceTemplatesPanel] apply failed', id, err);
          }
        }
        if (failures.length === 0) {
          setStatusMessage(`Applied ${successes} of ${total}.`);
          setStatusKind('success');
        } else {
          setStatusMessage(
            `${successes} of ${total} applied. ${failures.length} failed: ${failures.join(', ')}.`,
          );
          setStatusKind('error');
        }
      } finally {
        setSelected(new Set());
      }
    });
  };

  if (templates.length === 0) {
    return (
      <section className={styles.panel}>
        <header className={styles.header}>
          <h3 className={styles.title}>Maintenance templates</h3>
        </header>
        <p className={styles.empty}>No property templates available.</p>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <h3 className={styles.title}>Maintenance templates</h3>
        <p className={styles.sub}>
          Apply recurring maintenance tasks. The first occurrence starts today; next ones auto-spawn when you mark one done.
        </p>
      </header>
      {statusMessage ? (
        <div
          role={statusKind === 'error' ? 'alert' : 'status'}
          style={{
            padding: '8px 12px',
            marginBottom: 12,
            borderRadius: 6,
            fontSize: 13,
            color: statusKind === 'error' ? '#9b1c1c' : '#0f5132',
            background: statusKind === 'error' ? '#fde2e2' : '#d1f0df',
            border: `1px solid ${statusKind === 'error' ? '#f5b1b1' : '#a5dfc0'}`,
          }}
        >
          {statusMessage}
        </div>
      ) : null}
      <ul className={styles.list}>
        {templates.map((t) => {
          const applied = alreadyAppliedIds.includes(t.id);
          const checked = selected.has(t.id);
          return (
            <li key={t.id} className={applied ? styles.itemApplied : styles.item}>
              <label className={styles.label}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  disabled={applied || pending}
                  checked={checked}
                  onChange={() => toggle(t.id)}
                />
                <span className={styles.name}>{t.name}</span>
                {t.tags.length > 0 ? (
                  <span className={styles.tags}>
                    {t.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>#{tag}</span>
                    ))}
                  </span>
                ) : null}
                {applied ? <span className={styles.appliedBadge}>Applied</span> : null}
              </label>
              {t.description ? <p className={styles.desc}>{t.description}</p> : null}
            </li>
          );
        })}
      </ul>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.apply}
          disabled={selected.size === 0 || pending}
          onClick={apply}
        >
          {pending ? 'Applying...' : `Apply ${selected.size > 0 ? selected.size : ''} selected`.trim()}
        </button>
      </div>
    </section>
  );
}
