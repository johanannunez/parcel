'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { ProjectRow } from '@/lib/admin/project-types';
import {
  PROJECT_STATUS_LABEL,
  PROJECT_TYPE_EMOJI,
  PROJECT_TYPE_LABEL,
} from '@/lib/admin/project-types';
import type { ReactNode } from 'react';
import styles from './ProjectDetailShell.module.css';

const TABS = ['overview', 'tasks', 'files', 'settings'] as const;
type Tab = typeof TABS[number];

const TAB_LABEL: Record<Tab, string> = {
  overview: 'Overview',
  tasks: 'Tasks',
  files: 'Files',
  settings: 'Settings',
};

export function ProjectDetailShell({
  project,
  children,
}: {
  project: ProjectRow;
  children: ReactNode;
}) {
  const sp = useSearchParams();
  const active: Tab = (sp?.get('tab') as Tab) ?? 'overview';

  return (
    <div className={styles.shell}>
      <header className={styles.band}>
        <div className={styles.emoji}>
          {project.emoji ?? PROJECT_TYPE_EMOJI[project.projectType]}
        </div>
        <div className={styles.info}>
          <h1 className={styles.name}>{project.name}</h1>
          <p className={styles.sub}>
            {PROJECT_TYPE_LABEL[project.projectType]}
            {project.linkedContactName ? ` · ${project.linkedContactName}` : ''}
            {project.linkedPropertyName ? ` · ${project.linkedPropertyName}` : ''}
            {project.targetDate
              ? ` · target ${new Date(project.targetDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}`
              : ''}
          </p>
        </div>
        <span className={`${styles.pill} ${styles[`status_${project.status}`]}`}>
          {PROJECT_STATUS_LABEL[project.status]}
        </span>
      </header>

      <nav className={styles.tabs} aria-label="Project sections">
        {TABS.map((t) => (
          <Link
            key={t}
            href={
              t === 'overview'
                ? `/admin/projects/${project.id}`
                : `/admin/projects/${project.id}?tab=${t}`
            }
            aria-current={t === active ? 'page' : undefined}
            className={`${styles.tab} ${t === active ? styles.tabActive : ''}`}
          >
            {TAB_LABEL[t]}
          </Link>
        ))}
      </nav>

      <div className={styles.content}>{children}</div>
    </div>
  );
}
