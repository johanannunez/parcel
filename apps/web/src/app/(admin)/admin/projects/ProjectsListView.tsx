'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { ProjectRow, ProjectSavedView } from '@/lib/admin/project-types';
import {
  PROJECT_STATUS_LABEL,
  PROJECT_TYPE_EMOJI,
  PROJECT_TYPE_LABEL,
} from '@/lib/admin/project-types';
import styles from './ProjectsListView.module.css';

const STATUS_PILL_CLASS: Record<string, string> = {
  not_started: styles.pillGray,
  in_progress: styles.pillBlue,
  blocked: styles.pillRed,
  done: styles.pillGreen,
  archived: styles.pillGray,
};

function SavedViewTabs({ views }: { views: ProjectSavedView[] }) {
  const sp = useSearchParams();
  const active = sp?.get('view') ?? 'all-projects';
  return (
    <nav className={styles.views} aria-label="Saved views">
      {views.map((v) => {
        const isActive = v.key === active;
        const href = v.key === 'all-projects' ? '/admin/projects' : `/admin/projects?view=${v.key}`;
        return (
          <Link
            key={v.key}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
          >
            {v.name}
            <span className={`${styles.count} ${isActive ? styles.countActive : ''}`}>
              {v.count}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function ProjectsListView({
  rows,
  views,
}: {
  rows: ProjectRow[];
  views: ProjectSavedView[];
}) {
  return (
    <div className={styles.page}>
      <SavedViewTabs views={views} />

      <div className={styles.tableWrap}>
        <div className={styles.rowHead}>
          <div>Project</div>
          <div>Linked</div>
          <div>Owner</div>
          <div>Target</div>
          <div>Progress</div>
          <div>Status</div>
          <div />
        </div>

        {rows.map((p) => {
          const progress =
            p.taskCount > 0 ? Math.round((p.taskDoneCount / p.taskCount) * 100) : 0;
          return (
            <Link
              key={p.id}
              href={`/admin/projects/${p.id}`}
              className={styles.row}
            >
              <div className={styles.projectCell}>
                <span className={styles.emoji}>
                  {p.emoji ?? PROJECT_TYPE_EMOJI[p.projectType]}
                </span>
                <div>
                  <div className={styles.name}>{p.name}</div>
                  <div className={styles.sub}>{PROJECT_TYPE_LABEL[p.projectType]}</div>
                </div>
              </div>
              <div className={styles.linked}>
                {p.linkedContactName
                  ? <span className={styles.linkTag}>● {p.linkedContactName}</span>
                  : p.linkedPropertyName
                    ? <span className={styles.linkTag}>● {p.linkedPropertyName}</span>
                    : <span className={styles.muted}>—</span>}
              </div>
              <div className={styles.owner}>
                {p.ownerUserName
                  ? (
                    <span className={styles.ownerInitials}>
                      {p.ownerUserName.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                    </span>
                  )
                  : <span className={styles.muted}>—</span>}
              </div>
              <div className={styles.mono}>
                {p.targetDate
                  ? new Date(p.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                  : '—'}
              </div>
              <div className={styles.progressCell}>
                <span className={styles.progressText}>
                  {p.taskDoneCount} / {p.taskCount || 0}
                </span>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div>
                <span className={`${styles.pill} ${STATUS_PILL_CLASS[p.status] ?? styles.pillGray}`}>
                  {PROJECT_STATUS_LABEL[p.status]}
                </span>
              </div>
              <div className={styles.chevron}>›</div>
            </Link>
          );
        })}

        {rows.length === 0 ? (
          <div className={styles.empty}>No projects in this view yet.</div>
        ) : null}
      </div>
    </div>
  );
}
