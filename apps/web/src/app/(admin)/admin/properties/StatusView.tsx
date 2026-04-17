import { createClient } from '@/lib/supabase/server';
import { shortenStreet, normalizeUnit } from '@/lib/address';
import { StatusBoard } from '@/components/admin/pipeline/StatusBoard';
import { MetricsBar, type MetricTile } from '@/components/admin/pipeline/MetricsBar';
import { fetchInsightsByParent } from '@/lib/admin/ai-insights';
import {
  buildPropertyStatusBoard,
  type PropertyStatusRow,
} from '@/lib/admin/pipeline-adapters/property-status';

async function fetchPropertyStatusRows(): Promise<PropertyStatusRow[]> {
  const supabase = await createClient();
  const { data: properties, error } = await supabase
    .from('properties')
    .select(
      `id, name, address_line1, address_line2, city, state,
       cover_photo_url, setup_status, active,
       bedrooms, bathrooms, created_at,
       financial_baseline,
       owner:profiles!properties_owner_id_fkey(full_name)`,
    )
    .order('created_at', { ascending: true });
  if (error) throw error;

  return (properties ?? []).map((p) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ownerProfile = (p as any).owner as { full_name?: string | null } | null;
    const ownerNames = ownerProfile?.full_name ? [ownerProfile.full_name] : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fb = (p as any).financial_baseline as { estimated_monthly_revenue?: number } | null;
    const estimatedMrr = fb?.estimated_monthly_revenue ?? null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const line2 = (p as any).address_line2 as string | null;

    return {
      id: p.id,
      nickname: p.name ?? null,
      street: shortenStreet(p.address_line1),
      unit: line2 ? normalizeUnit(line2) : null,
      city: p.city,
      state: p.state,
      coverPhotoUrl: p.cover_photo_url ?? null,
      setupStatus: p.setup_status ?? null,
      active: p.active ?? false,
      estimatedMrr,
      ownerNames,
      bedrooms: p.bedrooms ?? null,
      bathrooms: p.bathrooms ?? null,
      createdAt: p.created_at,
    };
  });
}

export async function PropertiesStatusView() {
  const rows = await fetchPropertyStatusRows();
  const insightsMap = await fetchInsightsByParent('property', rows.map((r) => r.id));
  const columns = buildPropertyStatusBoard(rows, insightsMap);

  const liveRows = rows.filter((r) => r.active && r.setupStatus === 'published');
  const onboardingRows = rows.filter((r) => r.active && r.setupStatus !== 'published');
  const liveMrr = liveRows.reduce((s, r) => s + (r.estimatedMrr ?? 0), 0);
  const totalMrr = rows.reduce((s, r) => s + (r.estimatedMrr ?? 0), 0);

  const tiles: MetricTile[] = [
    { label: 'Pipeline value', value: `$${totalMrr.toLocaleString()} /mo`, featured: true },
    { label: 'Live revenue', value: `$${liveMrr.toLocaleString()} /mo` },
    { label: 'In onboarding', value: String(onboardingRows.length) },
    { label: 'Live homes', value: String(liveRows.length) },
    { label: 'Total homes', value: String(rows.length) },
  ];

  return (
    <div>
      <MetricsBar tiles={tiles} />
      <StatusBoard columns={columns} />
    </div>
  );
}
