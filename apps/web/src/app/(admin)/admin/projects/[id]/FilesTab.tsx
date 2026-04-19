// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck -- attachments table not yet in generated Supabase types
import { createClient } from '@/lib/supabase/server';
import styles from './FilesTab.module.css';

type Props = { projectId: string };

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function FilesTab({ projectId }: Props) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('attachments')
    .select('id, filename, mime_type, size_bytes, created_at')
    .eq('parent_type', 'project')
    .eq('parent_id', projectId)
    .order('created_at', { ascending: false });

  const files = data ?? [];

  return (
    <div className={styles.wrap}>
      {files.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.icon}>📎</span>
          <p className={styles.heading}>No files yet</p>
          <p className={styles.sub}>File uploads are coming in a future update.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {files.map((f) => (
            <div key={f.id} className={styles.fileRow}>
              <span className={styles.filename}>{f.filename}</span>
              <span className={styles.meta}>
                {f.size_bytes != null ? formatBytes(f.size_bytes) : ''}
                {' · '}
                {new Date(f.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
