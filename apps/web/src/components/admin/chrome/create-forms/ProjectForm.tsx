'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createProject } from '@/lib/admin/project-actions';
import {
  PROJECT_TYPE_LABEL,
  PROJECT_TYPE_EMOJI,
  type ProjectType,
} from '@/lib/admin/project-types';
import styles from './ProjectForm.module.css';

const TYPES: ProjectType[] = [
  'idea',
  'feature_build',
  'employee_onboarding',
  'cleaner_onboarding',
  'vendor_onboarding',
  'internal',
];

export function ProjectForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('idea');
  const [targetDate, setTargetDate] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submit = () => {
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await createProject({
          name,
          description: description || undefined,
          projectType,
          targetDate: targetDate || undefined,
        });
        router.push(`/admin/projects/${result.id}`);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
    });
  };

  return (
    <form
      className={styles.form}
      onSubmit={(e) => { e.preventDefault(); submit(); }}
    >
      <div className={styles.field}>
        <label className={styles.label} htmlFor="proj-name">Name</label>
        <input
          id="proj-name"
          className={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Q3 Vendor Onboarding"
          autoFocus
          required
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="proj-type">Type</label>
        <select
          id="proj-type"
          className={styles.select}
          value={projectType}
          onChange={(e) => setProjectType(e.target.value as ProjectType)}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {PROJECT_TYPE_EMOJI[t]} {PROJECT_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="proj-target">Target date</label>
        <input
          id="proj-target"
          type="date"
          className={styles.input}
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="proj-desc">Description</label>
        <textarea
          id="proj-desc"
          className={styles.textarea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Optional — what is this project about?"
        />
      </div>

      {error ? (
        <div className={styles.error}>{error}</div>
      ) : null}

      <div className={styles.actions}>
        <button type="button" className={styles.btnSecondary} onClick={onClose}>
          Cancel
        </button>
        <button
          type="submit"
          className={styles.btnPrimary}
          disabled={!name.trim() || isPending}
        >
          {isPending ? 'Creating...' : 'Create project'}
        </button>
      </div>
    </form>
  );
}
