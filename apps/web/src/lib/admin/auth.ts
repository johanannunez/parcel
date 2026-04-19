import { createClient } from '@/lib/supabase/server';

/**
 * Ensures the current request comes from an authenticated admin.
 * Throws a tagged Error that server actions and route handlers can
 * surface as a generic failure. Returns the user on success.
 */
export async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('not authenticated');
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role !== 'admin') {
    throw new Error('forbidden: admins only');
  }
  return { supabase, user };
}
