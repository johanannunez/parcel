'use client';

import { createClient } from '@/lib/supabase/client';

export type UploadedAttachment = {
  storagePath: string;
  filename: string;
  mimeType: string | null;
  sizeBytes: number | null;
};

export type AttachmentScope = {
  parentType: 'contact' | 'property' | 'project';
  parentId: string;
};

export async function uploadTaskAttachment(
  file: File,
  scope: AttachmentScope | null,
): Promise<UploadedAttachment> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('not authenticated');

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const prefix = scope ? `${scope.parentType}/${scope.parentId}` : 'standalone';
  const path = `${prefix}/${user.id}/${Date.now()}_${safeName}`;

  const { error } = await supabase.storage
    .from('task-attachments')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;

  return {
    storagePath: path,
    filename: file.name,
    mimeType: file.type || null,
    sizeBytes: file.size,
  };
}

export async function removeUploadedAttachment(storagePath: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from('task-attachments')
    .remove([storagePath]);
  if (error) {
    console.warn('storage remove failed', error);
  }
}

export async function signedUrlForAttachment(
  storagePath: string,
  expiresIn = 60 * 30,
): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.storage
    .from('task-attachments')
    .createSignedUrl(storagePath, expiresIn);
  return data?.signedUrl ?? null;
}
