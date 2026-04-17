import styles from './ActivityTab.module.css';

// Activity tab — timeline_events table does not exist yet (ships in a future plan).
// Shows a placeholder with recent task status changes scoped to this project.

type Props = { projectId: string };

export function ActivityTab({ projectId: _projectId }: Props) {
  return (
    <div className={styles.wrap}>
      <div className={styles.empty}>
        <span className={styles.icon}>📋</span>
        <p className={styles.heading}>Activity coming soon</p>
        <p className={styles.sub}>
          The timeline system will surface project activity here in a future update.
        </p>
      </div>
    </div>
  );
}
