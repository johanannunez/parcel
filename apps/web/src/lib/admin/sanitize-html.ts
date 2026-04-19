import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
  'blockquote', 'h1', 'h2', 'h3', 'ul', 'ol', 'li',
  'a', 'img', 'span', 'mark',
];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'class', 'src', 'alt', 'title'];

/**
 * Server-side fallback sanitizer. DOMPurify needs a DOM, which Node lacks
 * without extra deps. We strip the most dangerous vectors: script/style/iframe
 * blocks, inline event handlers, and javascript:/data: URLs. This is a
 * defense-in-depth layer; the server should generally treat this as plain text
 * and rely on the client's DOMPurify pass for rich content rendering.
 */
function stripDangerousServerSide(dirty: string): string {
  return dirty
    // Drop whole script/style/iframe/object/embed blocks (greedy-safe).
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    // Drop self-closing variants of the same set.
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*\/?>/gi, '')
    // Strip inline event handlers like onclick="...".
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
    // Neutralize javascript: and data: URLs in href/src.
    .replace(/(href|src)\s*=\s*"(?:\s*javascript:|\s*data:)[^"]*"/gi, '$1="#"')
    .replace(/(href|src)\s*=\s*'(?:\s*javascript:|\s*data:)[^']*'/gi, "$1='#'");
}

export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') {
    return stripDangerousServerSide(dirty);
  }
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS, ALLOWED_ATTR });
}
