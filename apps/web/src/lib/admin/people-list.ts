import { createClient } from '@/lib/supabase/server';
import { getShowTestData } from './test-data';
import type {
  ContactProperty,
  ContactRow,
  ContactSavedView,
  ContactViewMode,
  LifecycleStage,
} from './contact-types';
import { CONTACT_VIEW_MODES } from './contact-types';
type DbLifecycleStage = LifecycleStage;

type QueryError = { code?: string; message: string };
type QueryResult<T> = { data: T | null; error: QueryError | null };
type QueryBuilder<T> = PromiseLike<QueryResult<T>> & {
  select(columns: string): QueryBuilder<T>;
  not(column: string, operator: string, value: string): QueryBuilder<T>;
  in(column: string, values: string[]): QueryBuilder<T>;
  or(filter: string): QueryBuilder<T>;
  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }): QueryBuilder<T>;
};
type UntypedDatabaseClient = {
  from<T = unknown>(table: string): QueryBuilder<T>;
};

function untypedDatabase(client: unknown): UntypedDatabaseClient {
  return client as UntypedDatabaseClient;
}

type FetchOptions = {
  viewKey?: string;
  search?: string | null;
  sources?: string[] | null;
  assigneeIds?: string[] | null;
};

export type ContactFilterOptions = {
  sources: Array<{ slug: string; label: string }>;
  assignees: Array<{ id: string; name: string }>;
};

type RawContactRow = {
  id: string;
  entity_id: string | null;
  profile_id: string | null;
  full_name: string;
  display_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  source: string | null;
  source_detail: string | null;
  lifecycle_stage: LifecycleStage;
  stage_changed_at: string;
  assigned_to: string | null;
  estimated_mrr: number | string | null;
  last_activity_at: string | null;
  created_at: string;
  assigned_profile: { full_name?: string } | Array<{ full_name?: string }> | null;
  property_count: Array<{ count: number }> | number | null;
  properties: Array<{
    id: unknown;
    address_line1: unknown;
    city: unknown;
    state: unknown;
    latitude: unknown;
    longitude: unknown;
  }> | null;
};

export async function fetchContactFilterOptions(): Promise<ContactFilterOptions> {
  const supabase = await createClient();

  const [sourcesRes, assigneesRes] = await Promise.all([
    supabase
      .from('contact_sources')
      .select('label, slug')
      .eq('active', true)
      .order('sort_order'),
    supabase
      .from('contacts')
      .select('assigned_to, assigned_profile:profiles!contacts_assigned_to_fkey(id, full_name)')
      .not('assigned_to', 'is', null),
  ]);

  const assigneeMap = new Map<string, string>();
  for (const row of assigneesRes.data ?? []) {
    const ap = Array.isArray(row.assigned_profile)
      ? row.assigned_profile[0]
      : (row.assigned_profile as { id?: string; full_name?: string } | null);
    if (ap?.id) {
      assigneeMap.set(ap.id, ap.full_name ?? 'Unknown');
    }
  }

  return {
    sources: (sourcesRes.data ?? []).map((r) => ({ slug: r.slug, label: r.label })),
    assignees: Array.from(assigneeMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export async function fetchContactSavedViews(): Promise<ContactSavedView[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  let query = supabase
    .from('saved_views')
    .select('id, key, name, filter_jsonb, sort, view_mode, sort_order, is_shared, owner_user_id, icon_id, icon_color')
    .eq('entity_type', 'contact');

  if (userId) {
    query = query.or(`is_shared.eq.true,owner_user_id.eq.${userId}`);
  } else {
    query = query.eq('is_shared', true);
  }

  const { data, error } = await query.order('sort_order');
  if (error) {
    console.error('[people-list] saved_views fetch error:', error.code, error.message);
    return [];
  }

  const views: ContactSavedView[] = [];
  for (const row of data ?? []) {
    const filter = (row.filter_jsonb ?? {}) as {
      stages?: LifecycleStage[];
      last_activity_older_than_days?: number;
      search_params?: Record<string, string>;
    };
    const isPersonal = !row.is_shared;
    const searchParams = filter.search_params
      ? ({
          view: filter.search_params.view,
          mode: filter.search_params.mode,
          source: filter.search_params.source,
          assignee: filter.search_params.assignee,
          q: filter.search_params.q,
        } as const)
      : null;
    views.push({
      id: row.id,
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
      count: isPersonal ? null : 0,
      isPersonal,
      searchParams,
      iconId: row.icon_id ?? null,
      iconColor: row.icon_color ?? null,
    });
  }
  return views;
}

export async function fetchContactSavedViewsWithCounts(): Promise<ContactSavedView[]> {
  const supabase = await createClient();
  const showTestData = await getShowTestData();
  const views = await fetchContactSavedViews();

  // Kick off all per-view count queries in parallel plus one total-count query.
  let totalQ = supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true });
  if (!showTestData) {
    totalQ = totalQ.not('id', 'like', '0000%');
  }
  const totalP = totalQ;

  const perViewP = views.map((v) => {
    if (v.isPersonal) {
      return Promise.resolve<number | null>(null);
    }
    if (v.filterStages.length === 0) {
      return totalP.then((r) => r.count ?? 0);
    }
    let countQuery = supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .in('lifecycle_stage', v.filterStages as DbLifecycleStage[]);
    if (!showTestData) {
      countQuery = countQuery.not('id', 'like', '0000%');
    }
    return countQuery.then((r) => r.count ?? 0);
  });

  const counts = await Promise.all(perViewP);
  views.forEach((v, i) => {
    v.count = counts[i];
  });
  return views;
}

export async function fetchAdminContactsList({
  viewKey = 'lead-pipeline',
  search = null,
  sources = null,
  assigneeIds = null,
}: FetchOptions = {}): Promise<{
  rows: ContactRow[];
  views: ContactSavedView[];
  activeView: ContactSavedView;
}> {
  const supabase = await createClient();
  const showTestData = await getShowTestData();
  const views = await fetchContactSavedViews();
  const activeView =
    views.find((v) => v.key === viewKey) ??
    views.find((v) => v.key === 'lead-pipeline') ??
    views[0];

  if (!activeView) {
    throw new Error('No saved views found for entity contact');
  }

  let query = untypedDatabase(supabase)
    .from<RawContactRow[]>('contacts')
    .select(
      `id, entity_id, profile_id, full_name, display_name, company_name, email, phone,
       avatar_url, source, source_detail, lifecycle_stage, stage_changed_at,
       assigned_to, estimated_mrr, last_activity_at, created_at,
       assigned_profile:profiles!contacts_assigned_to_fkey(full_name),
       property_count:properties!properties_contact_id_fkey(count),
       properties!properties_contact_id_fkey(id, address_line1, city, state, latitude, longitude)`,
    );

  if (!showTestData) {
    query = query.not('id', 'like', '0000%');
  }

  if (activeView.filterStages.length > 0) {
    query = query.in('lifecycle_stage', activeView.filterStages as string[]);
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

  if (sources && sources.length > 0) {
    query = query.in('source', sources);
  }

  if (assigneeIds && assigneeIds.length > 0) {
    query = query.in('assigned_to', assigneeIds);
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
  if (error) {
    console.error('[people-list] contacts fetch error:', error.code, error.message);
    return { rows: [], views, activeView };
  }

  const rows: ContactRow[] = ((data ?? []) as RawContactRow[]).map((r) => {
    const assignedProfile =
      Array.isArray(r.assigned_profile)
        ? r.assigned_profile[0]
        : (r.assigned_profile as { full_name?: string } | null);
    const propertyCount = Array.isArray(r.property_count)
      ? (r.property_count[0]?.count ?? 0)
      : (r.property_count as number | null) ?? 0;
    const properties: ContactProperty[] = Array.isArray(r.properties)
      ? r.properties.map((p) => ({
          id: p.id as string,
          addressLine1: p.address_line1 as string,
          city: (p.city as string | null) ?? null,
          state: (p.state as string | null) ?? null,
          latitude:
            p.latitude == null ? null : Number(p.latitude),
          longitude:
            p.longitude == null ? null : Number(p.longitude),
        }))
      : [];
    return {
      id: r.id,
      entityId: (r.entity_id as string | null) ?? null,
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
      properties,
      lastActivityAt: r.last_activity_at,
      createdAt: r.created_at,
    };
  });

  return { rows, views, activeView };
}
