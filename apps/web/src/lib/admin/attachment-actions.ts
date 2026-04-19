'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type AttachmentParentType = 'contact' | 'property' | 'project' | 'task';

export type AttachmentUploadInput = {
  parentType: AttachmentParentType;
  parentId: string;
  filename: string;
  storagePath: string;
  mimeType: string | null;
  sizeBytes: number | null;
};

export async function createAttachmentRecord(
  input: AttachmentUploadInput,
): Promise<{ id: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('not authenticated');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('attachments')
    .insert({
      parent_type: input.parentType,
      parent_id: input.parentId,
      filename: input.filename,
      storage_path: input.storagePath,
      mime_type: input.mimeType,
      size_bytes: input.sizeBytes,
      uploaded_by: user.id,
    })
    .select('id')
    .single();

  if (error) throw error;
  revalidatePath('/admin/tasks');
  return { id: data.id };
}

export async function deleteAttachmentRecord(
  id: string,
  storagePath: string,
): Promise<void> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: dbError } = await (supabase as any)
    .from('attachments')
    .delete()
    .eq('id', id);
  if (dbError) throw dbError;

  const { error: storageError } = await supabase.storage
    .from('task-attachments')
    .remove([storagePath]);
  if (storageError) {
    // Swallow so DB stays clean even if storage cleanup lags.
    console.warn('storage remove failed', storageError);
  }
  revalidatePath('/admin/tasks');
}
