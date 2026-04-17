'use client';

import { useCallback, useRef, useState } from 'react';
import {
  uploadTaskAttachment,
  removeUploadedAttachment,
} from '@/lib/admin/attachment-upload';
import type { UploadedAttachment, AttachmentScope } from '@/lib/admin/attachment-upload';
import styles from './AttachmentsField.module.css';

type PendingFile = {
  key: string;
  name: string;
  error: string | null;
};

type Props = {
  uploaded: UploadedAttachment[];
  onChange: (next: UploadedAttachment[]) => void;
  scope: AttachmentScope | null;
  disabled?: boolean;
};

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentsField({ uploaded, onChange, scope, disabled }: Props) {
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      const newPending: PendingFile[] = fileArray.map((f) => ({
        key: `${f.name}-${Date.now()}-${Math.random()}`,
        name: f.name,
        error: null,
      }));
      setPending((prev) => [...prev, ...newPending]);

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const key = newPending[i].key;
        try {
          const result = await uploadTaskAttachment(file, scope);
          onChange([...uploaded, result]);
          setPending((prev) => prev.filter((p) => p.key !== key));
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'Upload failed';
          setPending((prev) =>
            prev.map((p) => (p.key === key ? { ...p, error: message } : p)),
          );
        }
      }
    },
    [scope, uploaded, onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      processFiles(e.dataTransfer.files);
    },
    [disabled, processFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        processFiles(e.target.files);
        // Reset input so the same file can be re-uploaded if removed.
        e.target.value = '';
      }
    },
    [processFiles],
  );

  const handleRemove = useCallback(
    async (att: UploadedAttachment) => {
      if (disabled) return;
      // Optimistically remove from state first.
      onChange(uploaded.filter((a) => a.storagePath !== att.storagePath));
      // Best-effort delete from storage (file wasn't committed to DB yet).
      await removeUploadedAttachment(att.storagePath);
    },
    [disabled, uploaded, onChange],
  );

  const dismissPendingError = useCallback((key: string) => {
    setPending((prev) => prev.filter((p) => p.key !== key));
  }, []);

  return (
    <div className={styles.root}>
      {/* Drop zone */}
      <div
        className={`${styles.dropZone}${isDragOver ? ` ${styles.dropZoneOver}` : ''}${disabled ? ` ${styles.dropZoneDisabled}` : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        aria-label="Upload attachments"
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className={styles.hiddenInput}
          onChange={handleInputChange}
          disabled={disabled}
          accept="image/png,image/jpeg,image/gif,image/webp,application/pdf,text/plain,application/zip,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          tabIndex={-1}
        />
        <UploadIcon />
        <span className={styles.dropZoneText}>Drag files here or click to upload</span>
        <span className={styles.dropZoneHint}>PDF, image, Word, Excel, ZIP up to 50 MB</span>
      </div>

      {/* Pending uploads */}
      {pending.length > 0 && (
        <ul className={styles.fileList}>
          {pending.map((p) => (
            <li key={p.key} className={`${styles.chip}${p.error ? ` ${styles.chipError}` : ` ${styles.chipPending}`}`}>
              <span className={styles.chipName}>{p.name}</span>
              {p.error ? (
                <>
                  <span className={styles.chipErrorMsg}>{p.error}</span>
                  <button
                    type="button"
                    className={styles.chipRemove}
                    onClick={() => dismissPendingError(p.key)}
                    aria-label={`Dismiss error for ${p.name}`}
                  >
                    <XIcon />
                  </button>
                </>
              ) : (
                <span className={styles.chipSpinner} aria-label="uploading" />
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Uploaded files */}
      {uploaded.length > 0 && (
        <ul className={styles.fileList}>
          {uploaded.map((att) => (
            <li key={att.storagePath} className={styles.chip}>
              <FileIcon mimeType={att.mimeType} />
              <span className={styles.chipName}>{att.filename}</span>
              {att.sizeBytes ? (
                <span className={styles.chipSize}>{formatBytes(att.sizeBytes)}</span>
              ) : null}
              <button
                type="button"
                className={styles.chipRemove}
                onClick={() => handleRemove(att)}
                disabled={disabled}
                aria-label={`Remove ${att.filename}`}
              >
                <XIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 13V4m0 0L7 7m3-3l3 3M4 14.5A3.5 3.5 0 0 0 4 17.5h12a3.5 3.5 0 0 0 0-3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2 2l8 8M10 2l-8 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FileIcon({ mimeType }: { mimeType: string | null }) {
  const isImage = mimeType?.startsWith('image/');
  const isPdf = mimeType === 'application/pdf';
  if (isImage) {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="4.5" cy="4.5" r="1" fill="currentColor" />
        <path d="M1 10l3-3 2.5 2.5L9 7l4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (isPdf) {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M3 1h6l3 3v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.2" />
        <path d="M9 1v3h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="3" y="10.5" fontSize="4" fill="currentColor" fontFamily="sans-serif" fontWeight="700">PDF</text>
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3 1h6l3 3v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M9 1v3h3M4.5 7h5M4.5 9.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
