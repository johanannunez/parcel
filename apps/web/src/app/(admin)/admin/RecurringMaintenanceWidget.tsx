// apps/web/src/app/(admin)/admin/RecurringMaintenanceWidget.tsx
import Link from 'next/link';
import type { RecurringMaintenanceData, MaintenanceTask } from '@/lib/admin/dashboard-v2';
import { WidgetShell } from './WidgetShell';
import styles from './RecurringMaintenanceWidget.module.css';

function formatDueChip(task: MaintenanceTask): { label: string; cls: string } {
  if (task.isOverdue) {
    const days = Math.abs(task.daysUntilDue);
    return { label: `${days}d late`, cls: styles.dueOverdue };
  }
  if (task.daysUntilDue === 0) {
    return { label: 'Today', cls: styles.dueSoon };
  }
  if (task.daysUntilDue === 1) {
    return { label: 'Tomorrow', cls: styles.dueSoon };
  }
  if (task.daysUntilDue <= 7) {
    return { label: `${task.daysUntilDue}d`, cls: styles.dueUpcoming };
  }
  // 8-30 days: date string
  const date = new Date(task.nextDueAt);
  const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { label, cls: styles.dueMuted };
}

function TaskRow({ task }: { task: MaintenanceTask }) {
  const chip = formatDueChip(task);

  return (
    <Link
      href="/admin/tasks"
      className={`${styles.taskRow} ${task.isOverdue ? styles.taskRowOverdue : ''}`}
    >
      <span className={`${styles.dueChip} ${chip.cls}`}>{chip.label}</span>
      <div className={styles.taskMeta}>
        <span className={styles.taskName}>{task.templateName}</span>
        <span className={styles.propName}>{task.propertyName}</span>
      </div>
      {task.estimatedMinutes !== null && (
        <span className={styles.durationChip}>~{task.estimatedMinutes}min</span>
      )}
    </Link>
  );
}

type Props = {
  data: RecurringMaintenanceData;
};

export function RecurringMaintenanceWidget({ data }: Props) {
  const { tasks, overdueCount, dueSoonCount } = data;
  const upcomingCount = tasks.length - overdueCount - dueSoonCount;

  // Sort: overdue first, then due soon, then upcoming
  const sorted = [...tasks].sort((a, b) => {
    const rankA = a.isOverdue ? 0 : a.daysUntilDue <= 7 ? 1 : 2;
    const rankB = b.isOverdue ? 0 : b.daysUntilDue <= 7 ? 1 : 2;
    if (rankA !== rankB) return rankA - rankB;
    return a.daysUntilDue - b.daysUntilDue;
  });

  return (
    <WidgetShell
      label="Maintenance"
      count={tasks.length > 0 ? tasks.length : undefined}
      href="/admin/tasks"
      hrefLabel="View all tasks"
    >
      {tasks.length === 0 ? (
        <div className={styles.empty}>No scheduled maintenance in the next 30 days</div>
      ) : (
        <>
          <div className={styles.summaryRow}>
            {overdueCount > 0 && (
              <span className={`${styles.badge} ${styles.badgeRed}`}>
                {overdueCount} overdue
              </span>
            )}
            {dueSoonCount > 0 && (
              <span className={`${styles.badge} ${styles.badgeAmber}`}>
                {dueSoonCount} due soon
              </span>
            )}
            {upcomingCount > 0 && (
              <span className={`${styles.badge} ${styles.badgeMuted}`}>
                {upcomingCount} upcoming
              </span>
            )}
          </div>
          <div className={styles.list}>
            {sorted.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        </>
      )}
    </WidgetShell>
  );
}
