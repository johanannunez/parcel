import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
  'blockquote', 'h1', 'h2', 'h3', 'ul', 'ol', 'li',
  'a', 'img', 'span', 'mark',
];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'class', 'src', 'alt', 'title'];

export function sanitizeHtml(dirty: string): string {
  // DOMPurify is browser-only; return the original string on the server (SSR).
  if (typeof window === 'undefined') return dirty;
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS, ALLOWED_ATTR });
}
