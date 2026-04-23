import { createClient } from '@/lib/supabase/server';

export type ContactSource = {
  id: string;
  label: string;
  slug: string;
  sortOrder: number;
  active: boolean;
};

export async function fetchContactSources(activeOnly = false): Promise<ContactSource[]> {
  const supabase = await createClient();
  let query = supabase
    .from('contact_sources')
    .select('id, label, slug, sort_order, active')
    .order('sort_order');
  if (activeOnly) {
    query = query.eq('active', true);
  }
  const { data, error } = await query;
  if (error) {
    console.error('[contact-sources] fetch error:', error.code, error.message);
    return [];
  }
  return (data ?? []).map((r) => ({
    id: r.id,
    label: r.label,
    slug: r.slug,
    sortOrder: r.sort_order,
    active: r.active,
  }));
}
