'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ProjectRow, ProjectType, ProjectStatus } from '@/lib/admin/project-types';
import {
  PROJECT_TYPE_LABEL,
  PROJECT_TYPE_EMOJI,
  PROJECT_STATUS_LABEL,
} from '@/lib/admin/project-types';
import { updateProject, archiveProject } from '@/lib/admin/project-actions';
import ConfirmModal from '@/components/admin/ConfirmModal';
import styles from './SettingsTab.module.css';

const TYPES: ProjectType[] = [
  'idea',
  'feature_build',
  'employee_onboarding',
  'cleaner_onboarding',
  'vendor_onboarding',
  'internal',
];

const STATUSES: ProjectStatus[] = ['not_started', 'in_progress', 'blocked', 'done', 'archived'];

export function SettingsTab({ project }: { project: ProjectRow }) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');
  const [projectType, setProjectType] = useState<ProjectType>(project.projectType);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [targetDate, setTargetDate] = useState(project.targetDate ?? '');
  const [isPending, startTransition] = useTransition();
  const [isArchiving, startArchiveTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const router = useRouter();

  const handleSave = () => {
    if (!name.trim()) return;
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateProject(project.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          projectType,
          status,
          targetDate: targetDate || undefined,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed');
      }
    });
  };

  const handleArchive = () => {
    setShowArchiveConfirm(true);
  };

  const doArchive = () => {
    startArchiveTransition(async () => {
      try {
        await archiveProject(project.id);
        router.push('/admin/projects');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Archive failed');
      }
    });
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Project details</h2>

        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="settings-name">Name</label>
            <input
              id="settings-name"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="settings-type">Type</label>
            <select
              id="settings-type"
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
            <label className={styles.label} htmlFor="settings-status">Status</label>
            <select
              id="settings-status"
              className={styles.select}
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{PROJECT_STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="settings-target">Target date</label>
            <input
              id="settings-target"
              type="date"
              className={styles.input}
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label className={styles.label} htmlFor="settings-desc">Description</label>
            <textarea
              id="settings-desc"
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="What is this project about?"
            />
          </div>
        </div>

        {error ? <div className={styles.error}>{error}</div> : null}
        {saved ? <div className={styles.success}>Saved.</div> : null}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleSave}
            disabled={!name.trim() || isPending}
          >
            {isPending ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>

      <div className={`${styles.section} ${styles.dangerSection}`}>
        <h2 className={styles.sectionTitle}>Danger zone</h2>
        <p className={styles.dangerHint}>
          Archiving removes this project from active views. It can be found in the Archived view.
        </p>
        <button
          type="button"
          className={styles.btnDanger}
          onClick={handleArchive}
          disabled={isArchiving || project.status === 'archived'}
        >
          {isArchiving ? 'Archiving...' : 'Archive project'}
        </button>
      </div>

      <ConfirmModal
        open={showArchiveConfirm}
        title="Archive project?"
        description="This project will be hidden from active views. You can restore it later."
        confirmLabel="Archive"
        variant="danger"
        onConfirm={() => { setShowArchiveConfirm(false); doArchive(); }}
        onCancel={() => setShowArchiveConfirm(false)}
      />
    </div>
  );
}
