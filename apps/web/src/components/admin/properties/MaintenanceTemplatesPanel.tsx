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

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const apply = () => {
    startTransition(async () => {
      for (const id of selected) {
        await applyTemplateToProperty({ templateId: id, propertyId });
      }
      setSelected(new Set());
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
