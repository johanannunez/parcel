'use client';

import { useState, useEffect, useRef, useCallback, DragEvent } from 'react';
import { File, Image, FilePdf, PaperclipHorizontal, Trash, ArrowSquareOut } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';
import styles from './TaskAttachments.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type Attachment = {
  id: string;
  filename: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const STORAGE_BUCKET = 'task-attachments';

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <Image size={16} weight="regular" />;
  if (mimeType === 'application/pdf') return <FilePdf size={16} weight="regular" />;
  return <File size={16} weight="regular" />;
}

// ─── Props ───────────────────────────────────────────────────────────────────

type Props = {
  taskId: string;
};

// ─── Component ───────────────────────────────────────────────────────────────

export function TaskAttachments({ taskId }: Props) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/tasks/${taskId}/attachments`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: unknown) => {
        if (!cancelled) setAttachments(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setAttachments([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [taskId]);

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'bin';
      const safeName = file.name
        .replace(/\.[^.]+$/, '')
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .slice(0, 60);
      const path = `tasks/${taskId}/${Date.now()}-${safeName}.${ext}`;

      const bytes = await file.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, Buffer.from(bytes), {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw new Error(uploadError.message);

      // Insert row into attachments table
      const { data: row, error: insertError } = await (supabase as any)
        .from('attachments')
        .insert({
          parent_type: 'task',
          parent_id: taskId,
          filename: file.name,
          storage_path: path,
          mime_type: file.type,
          size_bytes: file.size,
        })
        .select('id, filename, storage_path, mime_type, size_bytes, created_at')
        .single();

      if (insertError) throw new Error(insertError.message);

      const newAttachment: Attachment = {
        id: row.id,
        filename: row.filename,
        storagePath: row.storage_path,
        mimeType: row.mime_type,
        sizeBytes: row.size_bytes,
        createdAt: row.created_at,
      };
      setAttachments((prev) => [newAttachment, ...prev]);
    } catch {
      // Silently ignore; user can retry
    } finally {
      setUploading(false);
    }
  }, [taskId]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  }, [uploadFile]);

  const handleDelete = useCallback(async (id: string, storagePath: string) => {
    // Optimistic removal
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    setConfirmDeleteId(null);
    try {
      const supabase = createClient();
      await (supabase as any).from('attachments').delete().eq('id', id);
      await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    } catch {
      // Already removed from UI; silently ignore
    }
  }, []);

  // Drag and drop
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const getPublicUrl = useCallback((storagePath: string): string => {
    const supabase = createClient();
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
    return data.publicUrl;
  }, []);

  if (loading) {
    return <div className={styles.emptyState}>Loading…</div>;
  }

  return (
    <div
      className={`${styles.container} ${dragging ? styles.containerDragging : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Attachment list */}
      {attachments.length === 0 && !uploading ? (
        <div className={styles.emptyDropZone}>
          <PaperclipHorizontal size={20} weight="regular" className={styles.emptyIcon} />
          <span className={styles.emptyText}>No attachments yet. Drag files here.</span>
        </div>
      ) : (
        <div className={styles.list}>
          {attachments.map((a) => (
            <div key={a.id} className={styles.row}>
              <span className={styles.fileIcon}>{getFileIcon(a.mimeType)}</span>
              <span className={styles.filename}>{a.filename}</span>
              <span className={styles.size}>{formatBytes(a.sizeBytes)}</span>

              <a
                href={getPublicUrl(a.storagePath)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.actionIconBtn}
                aria-label="Download"
              >
                <ArrowSquareOut size={14} />
              </a>

              {confirmDeleteId === a.id ? (
                <div className={styles.inlineConfirm}>
                  <span className={styles.confirmText}>Delete?</span>
                  <button
                    type="button"
                    className={styles.confirmYes}
                    onClick={() => handleDelete(a.id, a.storagePath)}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    className={styles.confirmNo}
                    onClick={() => setConfirmDeleteId(null)}
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.actionIconBtn}
                  aria-label="Delete attachment"
                  onClick={() => setConfirmDeleteId(a.id)}
                >
                  <Trash size={14} />
                </button>
              )}
            </div>
          ))}

          {uploading && (
            <div className={styles.uploadingRow}>Uploading…</div>
          )}
        </div>
      )}

      {/* Upload button */}
      <button
        type="button"
        className={styles.uploadBtn}
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        <PaperclipHorizontal size={14} />
        {uploading ? 'Uploading…' : 'Attach file'}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        className={styles.hiddenInput}
        onChange={handleFileInputChange}
      />
    </div>
  );
}
