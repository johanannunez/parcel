// Edge-compatible. Uses Web Crypto API only -- no Node.js deps.

export async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyApiToken(
  providedToken: string,
  supabaseClient: { from: Function },
): Promise<{ profileId: string; tokenId: string } | null> {
  const hash = await hashToken(providedToken);
  const { data } = await (supabaseClient as any)
    .from('api_tokens')
    .select('id, profile_id')
    .eq('token_hash', hash)
    .single();
  if (!data) return null;

  // Fire-and-forget last_used_at update
  void (supabaseClient as any)
    .from('api_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id);

  return { profileId: data.profile_id, tokenId: data.id };
}
