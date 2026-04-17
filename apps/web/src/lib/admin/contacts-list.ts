import { createClient } from '@/lib/supabase/server';
import type {
  ContactRow,
  ContactSavedView,
  ContactViewMode,
  LifecycleStage,
} from './contact-types';
import { CONTACT_VIEW_MODES } from './contact-types';

type FetchOptions = {
  viewKey?: string;
  search?: string | null;
};

export async function fetchContactSavedViews(): Promise<ContactSavedView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('saved_views')
    .select('key, name, filter_jsonb, sort, view_mode, sort_order')
    .eq('entity_type', 'contact')
    .eq('is_shared', true)
    .order('sort_order');
  if (error) throw error;

  const views: ContactSavedView[] = [];
  for (const row of data ?? []) {
    const filter = (row.filter_jsonb ?? {}) as {
      stages?: LifecycleStage[];
      last_activity_older_than_days?: number;
    };
    views.push({
      key: row.key,
      name: row.name,
      filterStages: filter.stages ?? [],
      lastActivityOlderThanDays: filter.last_activity_older_than_days,
      sort: (row.sort as ContactSavedView['sort']) ?? 'name_asc',
      viewMode: ((CONTACT_VIEW_MODES as readonly string[]).includes(
        row.view_mode as string,
      )
        ? (row.view_mode as ContactViewMode)
        : 'compact'),
      sortOrder: row.sort_order ?? 0,
      count: 0,
    });
  }
  return views;
}

export async function fetchAdminContactsList({
  viewKey = 'all-contacts',
  search = null,
}: FetchOptions = {}): Promise<{
  rows: ContactRow[];
  views: ContactSavedView[];
  activeView: ContactSavedView;
}> {
  const supabase = await createClient();
  const views = await fetchContactSavedViews();
  const activeView =
    views.find((v) => v.key === viewKey) ??
    views.find((v) => v.key === 'all-contacts') ??
    views[0];

  if (!activeView) {
    throw new Error('No saved views found for entity contact');
  }

  let query = supabase
    .from('contacts')
    .select(
      `id, profile_id, full_name, display_name, company_name, email, phone,
       avatar_url, source, source_detail, lifecycle_stage, stage_changed_at,
       assigned_to, estimated_mrr, last_activity_at, created_at,
       assigned_profile:profiles!contacts_assigned_to_fkey(full_name),
       property_count:properties!properties_contact_id_fkey(count)`,
    );

  if (activeView.filterStages.length > 0) {
    query = query.in('lifecycle_stage', activeView.filterStages);
  }

  if (activeView.lastActivityOlderThanDays) {
    const cutoff = new Date(
      Date.now() - activeView.lastActivityOlderThanDays * 86400_000,
    ).toISOString();
    query = query.or(`last_activity_at.lt.${cutoff},last_activity_at.is.null`);
  }

  if (search && search.trim().length > 0) {
    // Wrap the ilike value in double quotes so commas/parens/spaces in user
    // input do not break the PostgREST .or() filter grammar.
    const q = `"%${search.trim().replaceAll('"', '""')}%"`;
    query = query.or(
      `full_name.ilike.${q},company_name.ilike.${q},email.ilike.${q}`,
    );
  }

  switch (activeView.sort) {
    case 'name_asc':
      query = query.order('full_name', { ascending: true });
      break;
    case 'recent_activity':
      query = query
        .order('last_activity_at', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false });
      break;
    case 'stage_age':
      query = query.order('stage_changed_at', { ascending: true });
      break;
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows: ContactRow[] = (data ?? []).map((r) => {
    const assignedProfile =
      Array.isArray(r.assigned_profile)
        ? r.assigned_profile[0]
        : (r.assigned_profile as { full_name?: string } | null);
    const propertyCount = Array.isArray(r.property_count)
      ? (r.property_count[0]?.count ?? 0)
      : (r.property_count as number | null) ?? 0;
    return {
      id: r.id,
      profileId: r.profile_id,
      fullName: r.full_name,
      displayName: r.display_name,
      companyName: r.company_name,
      email: r.email,
      phone: r.phone,
      avatarUrl: r.avatar_url,
      source: r.source,
      sourceDetail: r.source_detail,
      lifecycleStage: r.lifecycle_stage,
      stageChangedAt: r.stage_changed_at,
      assignedTo: r.assigned_to,
      assignedToName: assignedProfile?.full_name ?? null,
      estimatedMrr:
        r.estimated_mrr == null ? null : Number(r.estimated_mrr),
      propertyCount,
      lastActivityAt: r.last_activity_at,
      createdAt: r.created_at,
    };
  });

  // Per-view counts for tab badges.
  const { count: totalCount } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true });

  for (const v of views) {
    if (v.filterStages.length === 0) {
      v.count = totalCount ?? 0;
    } else {
      const { count } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .in('lifecycle_stage', v.filterStages);
      v.count = count ?? 0;
    }
  }

  return { rows, views, activeView };
}
