// apps/web/src/app/(admin)/admin/TodayScheduleWidget.tsx
import Link from 'next/link';
import type { TodayScheduleData, ScheduleItem } from '@/lib/admin/dashboard-v2';
import { WidgetShell } from './WidgetShell';
import styles from './TodayScheduleWidget.module.css';

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  const min = m.toString().padStart(2, '0');
  return `${hour}:${min} ${ampm}`;
}

function getDotClass(taskType: string): string {
  switch (taskType) {
    case 'call':      return styles.dotCall;
    case 'meeting':   return styles.dotMeeting;
    case 'email':     return styles.dotEmail;
    case 'milestone': return styles.dotMilestone;
    default:          return styles.dotTodo;
  }
}

function ScheduleRow({ item }: { item: ScheduleItem }) {
  const subLabel = item.propertyName ?? item.contactName ?? item.assigneeName;

  return (
    <div className={`${styles.item} ${item.isOverdue ? styles.itemOverdue : ''}`}>
      <div className={styles.timeCol}>
        <span className={`${styles.timeText} ${item.isOverdue ? styles.timeOverdue : ''}`}>
          {item.isOverdue ? 'OVERDUE' : formatTime(item.dueAt)}
        </span>
      </div>
      <div className={styles.dotCol}>
        <span className={`${styles.dot} ${getDotClass(item.taskType)}`} />
      </div>
      <div className={styles.content}>
        <span className={`${styles.title} ${item.isOverdue ? styles.titleOverdue : ''}`}>
          {item.title}
        </span>
        {subLabel && <span className={styles.sub}>{subLabel}</span>}
      </div>
    </div>
  );
}

type Props = {
  data: TodayScheduleData;
};

export function TodayScheduleWidget({ data }: Props) {
  const { items, overdueCount } = data;

  return (
    <WidgetShell
      label="Today's Schedule"
      count={items.length > 0 ? items.length : undefined}
      href="/admin/tasks"
      hrefLabel="View all tasks"
    >
      {items.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyCheck}>✓</span>
          <span>Clear schedule today</span>
        </div>
      ) : (
        <div className={styles.timeline}>
          <div className={styles.line} />
          {items.map((item) => (
            <ScheduleRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </WidgetShell>
  );
}
