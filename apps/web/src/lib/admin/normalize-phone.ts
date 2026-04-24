// apps/web/src/lib/admin/normalize-phone.ts

/**
 * Normalize a phone number string to E.164 format (+15095551234).
 * Handles US numbers only. Returns the original string if it cannot
 * be parsed to a 10 or 11-digit number.
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (raw.startsWith('+')) return raw;
  return raw;
}
