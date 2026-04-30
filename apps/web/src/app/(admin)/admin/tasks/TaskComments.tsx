'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { PaperPlaneTilt } from '@phosphor-icons/react';
import type { TaskComment } from '@/lib/admin/task-types';
import styles from './TaskComments.module.css';

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

// ─── Comment item ─────────────────────────────────────────────────────────────

type CommentItemProps = {
  comment: TaskComment;
  isOwn: boolean;
  taskId: string;
  onUpdated: (updated: TaskComment) => void;
  onDeleted: (id: string) => void;
};

function CommentItem({ comment, isOwn, taskId, onUpdated, onDeleted }: CommentItemProps) {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(comment.body);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus();
      editRef.current.selectionStart = editRef.current.value.length;
    }
  }, [editing]);

  const handleEditSave = useCallback(async () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === comment.body) {
      setEditing(false);
      setEditValue(comment.body);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments/${comment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: trimmed }),
      });
      if (!res.ok) throw new Error('Failed to update');
      const data = await res.json();
      onUpdated({ ...comment, body: data.body, updatedAt: data.updated_at ?? comment.updatedAt });
      setEditing(false);
    } catch {
      // Restore original on failure
      setEditValue(comment.body);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }, [editValue, comment, taskId, onUpdated]);

  const handleDelete = useCallback(async () => {
    // Optimistic removal
    onDeleted(comment.id);
    try {
      await fetch(`/api/tasks/${taskId}/comments/${comment.id}`, { method: 'DELETE' });
    } catch {
      // Already removed from UI; silently ignore
    }
  }, [comment.id, taskId, onDeleted]);

  return (
    <div
      className={styles.commentItem}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setConfirmDelete(false);
      }}
    >
      {/* Avatar */}
      {comment.authorAvatarUrl ? (
        <img
          src={comment.authorAvatarUrl}
          alt={comment.authorName}
          className={styles.avatar}
        />
      ) : (
        <div className={styles.avatarFallback}>
          {comment.authorName.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Content */}
      <div className={styles.commentContent}>
        <div className={styles.commentMeta}>
          <span className={styles.authorName}>{comment.authorName}</span>
          <span className={styles.timestamp}>{relativeTime(comment.createdAt)}</span>
          {isOwn && hovered && !editing && (
            <div className={styles.commentActions}>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => { setEditing(true); setEditValue(comment.body); setConfirmDelete(false); }}
              >
                Edit
              </button>
              {confirmDelete ? (
                <>
                  <span className={styles.actionText}>Delete?</span>
                  <button type="button" className={styles.actionBtnDanger} onClick={handleDelete}>
                    Yes
                  </button>
                  <button type="button" className={styles.actionBtn} onClick={() => setConfirmDelete(false)}>
                    No
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        {editing ? (
          <textarea
            ref={editRef}
            className={styles.editTextarea}
            value={editValue}
            disabled={saving}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSave(); }
              if (e.key === 'Escape') { setEditing(false); setEditValue(comment.body); }
            }}
            rows={2}
          />
        ) : (
          <p className={styles.commentBody}>{comment.body}</p>
        )}
      </div>
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

type Props = {
  taskId: string;
  currentUserId: string | null;
  currentUserName: string | null;
  currentUserAvatarUrl: string | null;
};

// ─── Main component ───────────────────────────────────────────────────────────

export function TaskComments({ taskId, currentUserId, currentUserName, currentUserAvatarUrl }: Props) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerValue, setComposerValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  // Fetch on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/tasks/${taskId}/comments`)
      .then((r) => r.json())
      .then((data: TaskComment[]) => {
        if (!cancelled) setComments(data);
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [taskId]);

  const handleUpdated = useCallback((updated: TaskComment) => {
    setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, []);

  const handleDeleted = useCallback((id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = composerValue.trim();
    if (!trimmed || submitting) return;

    // Optimistic append
    const optimisticId = `optimistic-${Date.now()}`;
    const optimistic: TaskComment = {
      id: optimisticId,
      taskId,
      authorId: currentUserId ?? '',
      authorName: currentUserName ?? 'You',
      authorAvatarUrl: currentUserAvatarUrl ?? null,
      body: trimmed,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setComments((prev) => [...prev, optimistic]);
    setComposerValue('');

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: trimmed }),
      });
      if (!res.ok) throw new Error('Failed to post comment');
      const created: TaskComment = await res.json();
      // Replace optimistic entry with real one
      setComments((prev) => prev.map((c) => (c.id === optimisticId ? created : c)));
    } catch {
      // Remove optimistic entry on failure
      setComments((prev) => prev.filter((c) => c.id !== optimisticId));
      setComposerValue(trimmed);
    } finally {
      setSubmitting(false);
    }
  }, [composerValue, submitting, taskId, currentUserId, currentUserName, currentUserAvatarUrl]);

  if (loading) {
    return <div className={styles.emptyState}>Loading…</div>;
  }

  return (
    <div className={styles.thread}>
      {/* Comment list */}
      {comments.length === 0 ? (
        <div className={styles.emptyState}>No comments yet.</div>
      ) : (
        comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            isOwn={comment.authorId === currentUserId}
            taskId={taskId}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
          />
        ))
      )}

      {/* Add comment area */}
      <div className={styles.addCommentArea}>
        {currentUserAvatarUrl ? (
          <img
            src={currentUserAvatarUrl}
            alt={currentUserName ?? 'You'}
            className={styles.avatar}
          />
        ) : (
          <div className={styles.avatarFallback}>
            {(currentUserName ?? 'Y').charAt(0).toUpperCase()}
          </div>
        )}
        <div className={styles.composerWrap}>
          <textarea
            ref={composerRef}
            className={styles.composerTextarea}
            placeholder="Write a comment…"
            value={composerValue}
            disabled={submitting}
            onChange={(e) => setComposerValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            rows={1}
          />
          {composerValue.trim().length > 0 && (
            <button
              type="button"
              className={styles.sendBtn}
              onClick={handleSubmit}
              disabled={submitting}
              aria-label="Send comment"
            >
              <PaperPlaneTilt size={15} weight="fill" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
