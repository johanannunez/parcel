// apps/web/src/app/(admin)/admin/ProjectBoardWidget.tsx
import Link from 'next/link';
import type { ProjectBoardData } from '@/lib/admin/dashboard-v2';
import { WidgetShell } from './WidgetShell';
import styles from './ProjectBoardWidget.module.css';

type StatusCellProps = {
  label: string;
  count: number;
  countCls: string;
  cellCls?: string;
};

function StatusCell({ label, count, countCls, cellCls }: StatusCellProps) {
  return (
    <div className={`${styles.statusCell} ${cellCls ?? ''}`}>
      <span className={styles.statusLabel}>{label}</span>
      <span className={`${styles.statusCount} ${countCls}`}>{count}</span>
    </div>
  );
}

type Props = {
  data: ProjectBoardData;
};

export function ProjectBoardWidget({ data }: Props) {
  const { notStarted, inProgress, blocked, done, blockedProjects, total } = data;

  return (
    <WidgetShell
      label="Projects"
      count={total > 0 ? total : undefined}
      href="/admin/projects"
      hrefLabel="View all"
    >
      {total === 0 ? (
        <div className={styles.empty}>No active projects</div>
      ) : (
        <>
          <div className={styles.statusGrid}>
            <StatusCell
              label="Not Started"
              count={notStarted}
              countCls={styles.statusCountMuted}
            />
            <StatusCell
              label="In Progress"
              count={inProgress}
              countCls={styles.statusCountBlue}
            />
            <StatusCell
              label="Blocked"
              count={blocked}
              countCls={styles.statusCountRed}
              cellCls={blocked > 0 ? styles.statusCellBlocked : undefined}
            />
            <StatusCell
              label="Done"
              count={done}
              countCls={styles.statusCountGreen}
            />
          </div>

          {blockedProjects.length > 0 && (
            <div className={styles.blockedList}>
              {blockedProjects.map((proj) => (
                <Link
                  key={proj.id}
                  href="/admin/projects"
                  className={styles.blockedRow}
                >
                  {proj.emoji && (
                    <span className={styles.blockedEmoji}>{proj.emoji}</span>
                  )}
                  <span className={styles.blockedName}>{proj.name}</span>
                  <span className={styles.blockedDays}>
                    {proj.daysSinceUpdate}d blocked
                  </span>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </WidgetShell>
  );
}
