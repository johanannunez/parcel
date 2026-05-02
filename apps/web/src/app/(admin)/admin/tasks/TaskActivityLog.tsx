'use client';

import { useState, useEffect } from 'react';
import { CaretDown, CaretUp } from '@phosphor-icons/react';
import type { TaskActivityEntry } from '@/lib/admin/task-types';
import styles from './TaskActivityLog.module.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function buildSentence(entry: TaskActivityEntry): string {
  const actor = entry.actorName ?? 'Someone';
  if (entry.field === 'comment') return `${actor} added a comment`;
  const field = entry.field.replace(/_/g, ' ');
  const from = entry.oldValue ? `"${entry.oldValue}"` : 'none';
  const to = entry.newValue ? `"${entry.newValue}"` : 'none';
  return `${actor} changed ${field} from ${from} to ${to}`;
}

// ─── Props ───────────────────────────────────────────────────────────────────

type Props = {
  taskId: string;
};

// ─── Component ───────────────────────────────────────────────────────────────

export function TaskActivityLog({ taskId }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [entries, setEntries] = useState<TaskActivityEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  // Fetch when first expanded
  useEffect(() => {
    if (!expanded || fetched) return;
    setLoading(true);
    fetch(`/api/tasks/${taskId}/activity`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: unknown) => {
        setEntries(Array.isArray(data) ? data : []);
        setFetched(true);
      })
      .catch(() => {
        setEntries([]);
        setFetched(true);
      })
      .finally(() => setLoading(false));
  }, [expanded, fetched, taskId]);

  return (
    <div className={styles.section}>
      {/* Section header */}
      <button
        type="button"
        className={styles.header}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span>Activity</span>
        {expanded ? <CaretUp size={13} /> : <CaretDown size={13} />}
      </button>

      {/* Entries */}
      {expanded && (
        <div className={styles.list}>
          {loading && (
            <div className={styles.emptyState}>Loading…</div>
          )}
          {!loading && entries.length === 0 && (
            <div className={styles.emptyState}>No activity yet.</div>
          )}
          {!loading && entries.map((entry) => (
            <div key={entry.id} className={styles.row}>
              {/* Actor avatar */}
              {entry.actorAvatarUrl ? (
                <img
                  src={entry.actorAvatarUrl}
                  alt={entry.actorName ?? 'User'}
                  className={styles.avatar}
                />
              ) : (
                <div className={styles.avatarFallback}>
                  {(entry.actorName ?? 'U').charAt(0).toUpperCase()}
                </div>
              )}
              {/* Sentence + timestamp */}
              <span className={styles.sentence}>
                {buildSentence(entry)}
                <span className={styles.timestamp}>{relativeTime(entry.createdAt)}</span>
              </span>
            </div>
          ))}
          {entries.length >= 20 && (
            <span className={styles.loadMore}>Showing up to 50 entries</span>
          )}
        </div>
      )}
    </div>
  );
}
