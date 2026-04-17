import type { ProjectRow } from '@/lib/admin/project-types';
import { PROJECT_STATUS_LABEL, PROJECT_TYPE_LABEL } from '@/lib/admin/project-types';
import styles from './OverviewTab.module.css';

export function OverviewTab({ project }: { project: ProjectRow }) {
  const pct =
    project.taskCount > 0
      ? Math.round((project.taskDoneCount / project.taskCount) * 100)
      : 0;

  return (
    <div className={styles.overview}>
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Progress</h2>
        <div className={styles.progressRow}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${pct}%` }} />
          </div>
          <span className={styles.pct}>{pct}%</span>
        </div>
        <p className={styles.meta}>
          {project.taskDoneCount} of {project.taskCount} tasks complete
        </p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Details</h2>
        <dl className={styles.dl}>
          <dt>Status</dt>
          <dd>{PROJECT_STATUS_LABEL[project.status]}</dd>
          <dt>Type</dt>
          <dd>{PROJECT_TYPE_LABEL[project.projectType]}</dd>
          {project.targetDate ? (
            <>
              <dt>Target date</dt>
              <dd>
                {new Date(project.targetDate).toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </dd>
            </>
          ) : null}
          {project.ownerUserName ? (
            <>
              <dt>Owner</dt>
              <dd>{project.ownerUserName}</dd>
            </>
          ) : null}
          {project.linkedContactName ? (
            <>
              <dt>Linked contact</dt>
              <dd>{project.linkedContactName}</dd>
            </>
          ) : null}
          {project.linkedPropertyName ? (
            <>
              <dt>Linked property</dt>
              <dd>{project.linkedPropertyName}</dd>
            </>
          ) : null}
        </dl>
      </div>

      {project.description ? (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Description</h2>
          <p className={styles.description}>{project.description}</p>
        </div>
      ) : null}
    </div>
  );
}
