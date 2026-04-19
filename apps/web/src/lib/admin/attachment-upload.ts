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

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

// Allowed MIME prefixes and exact types. `image/*` is captured via prefix match.
const ALLOWED_MIME_PREFIXES = ['image/'];
const ALLOWED_MIME_EXACT = new Set<string>([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
]);

// Extension allowlist used as a defense-in-depth check alongside file.type.
const ALLOWED_EXTENSIONS = new Set<string>([
  // images
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'heic', 'heif', 'bmp', 'tiff',
  // docs
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  // text
  'txt', 'csv',
]);

function isAllowedMime(type: string): boolean {
  if (!type) return false;
  if (ALLOWED_MIME_EXACT.has(type)) return true;
  return ALLOWED_MIME_PREFIXES.some((prefix) => type.startsWith(prefix));
}

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf('.');
  if (dot < 0 || dot === filename.length - 1) return '';
  return filename.slice(dot + 1).toLowerCase();
}

export async function uploadTaskAttachment(
  file: File,
  scope: AttachmentScope | null,
): Promise<UploadedAttachment> {
  // Size guard: reject files larger than 50 MB before hitting Supabase.
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error(
      `File is too large. Max size is ${MAX_SIZE_BYTES / (1024 * 1024)} MB.`,
    );
  }

  // MIME allowlist (both declared type and file extension must pass).
  const declaredType = file.type || '';
  const ext = extensionOf(file.name);
  if (!isAllowedMime(declaredType)) {
    throw new Error(
      `File type not allowed${declaredType ? ` (${declaredType})` : ''}. ` +
        `Upload images, PDFs, Office docs, or plain text / CSV.`,
    );
  }
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error(
      `File extension .${ext || '(missing)'} is not allowed.`,
    );
  }

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
