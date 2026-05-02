"use client";

import { CheckCircle } from "@phosphor-icons/react";
import type { AppNotification } from "@/lib/admin/task-types";
import styles from "./NotificationFeed.module.css";

type Props = {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onOpenTask?: (taskId: string) => void;
  onClose: () => void;
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationFeed({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onOpenTask,
  onClose,
}: Props) {
  const hasUnread = notifications.some((n) => n.readAt === null);

  const sorted = [...notifications].sort((a, b) => {
    if ((a.readAt === null) !== (b.readAt === null)) {
      return a.readAt === null ? -1 : 1;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  function handleItemClick(n: AppNotification) {
    if (n.readAt === null) {
      onMarkRead(n.id);
    }
    if (n.data?.taskId) {
      onOpenTask?.(n.data.taskId);
    }
    onClose();
  }

  return (
    <div className={styles.panel} role="dialog" aria-label="Notifications">
      <div className={styles.header}>
        <span className={styles.title}>Notifications</span>
        {hasUnread && (
          <button
            type="button"
            className={styles.markAllBtn}
            onClick={onMarkAllRead}
          >
            Mark all read
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <CheckCircle size={20} weight="duotone" />
          </div>
          <span className={styles.emptyText}>You&apos;re all caught up.</span>
        </div>
      ) : (
        <div className={styles.list}>
          {sorted.map((n) => {
            const isUnread = n.readAt === null;
            return (
              <button
                key={n.id}
                type="button"
                className={`${styles.item} ${isUnread ? styles.itemUnread : ""}`}
                onClick={() => handleItemClick(n)}
              >
                <span className={`${styles.dot} ${isUnread ? "" : styles.dotRead}`} />
                <span className={styles.itemContent}>
                  <span
                    className={`${styles.itemTitle} ${isUnread ? styles.itemTitleUnread : ""}`}
                  >
                    {n.title}
                  </span>
                  {n.body ? (
                    <span className={styles.itemBody}>{n.body}</span>
                  ) : null}
                  <span className={styles.itemTime}>{relativeTime(n.createdAt)}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
