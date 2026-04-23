// apps/web/src/lib/admin/dashboard-data.ts
import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { ChecklistStatus, ChecklistCategory } from '@/lib/checklist';

export type CategoryHealth = {
  done: number;
  total: number;
  worst: ChecklistStatus | null; // null means all completed
};

export type PropertyHealthCard = {
  id: string;
  name: string;
  city: string;
  state: string;
  coverPhotoUrl: string | null;
  href: string;
  documents: CategoryHealth;
  finances: CategoryHealth;
  listings: CategoryHealth;
  worstOverall: 'green' | 'amber' | 'red';
};

export type AttentionItem = {
  propertyId: string;
  propertyName: string;
  propertyHref: string;
  category: ChecklistCategory;
  itemLabel: string;
  status: 'pending_owner' | 'stuck' | 'in_progress';
  daysInStatus: number;
};

const CATEGORY_TOTALS: Record<ChecklistCategory, number> = {
  documents: 10,
  finances: 6,
  listings: 16,
};

const STATUS_RANK: Record<ChecklistStatus, number> = {
  completed: -1,
  not_started: 0,
  in_progress: 1,
  pending_owner: 2,
  stuck: 3,
};

function worstStatus(statuses: ChecklistStatus[]): ChecklistStatus | null {
  const active = statuses.filter((s) => s !== 'completed');
  if (active.length === 0) return null;
  return active.reduce((a, b) => (STATUS_RANK[b] > STATUS_RANK[a] ? b : a));
}

function worstColor(status: ChecklistStatus | null): 'green' | 'amber' | 'red' {
  if (!status) return 'green';
  if (status === 'stuck') return 'red';
  return 'amber';
}

function overallColor(colors: Array<'green' | 'amber' | 'red'>): 'green' | 'amber' | 'red' {
  if (colors.includes('red')) return 'red';
  if (colors.includes('amber')) return 'amber';
  return 'green';
}

export async function fetchDashboardData(): Promise<{
  propertyCards: PropertyHealthCard[];
  attentionItems: AttentionItem[];
}> {
  const supabase = await createClient();

  const [{ data: properties }, { data: items }] = await Promise.all([
    supabase
      .from('properties')
      .select('id, name, address_line1, city, state, cover_photo_url')
      .eq('active', true)
      .order('name', { ascending: true, nullsFirst: false }),
    supabase
      .from('property_checklist_items')
      .select('property_id, category, item_key, label, status, updated_at'),
  ]);

  if (!properties?.length) return { propertyCards: [], attentionItems: [] };

  const propIds = new Set(properties.map((p) => p.id));

  // Group items by property
  const byProp = new Map<string, typeof items>();
  for (const item of items ?? []) {
    if (!propIds.has(item.property_id)) continue;
    if (!byProp.has(item.property_id)) byProp.set(item.property_id, []);
    byProp.get(item.property_id)!.push(item);
  }

  const propertyCards: PropertyHealthCard[] = [];
  const attentionItems: AttentionItem[] = [];

  for (const p of properties) {
    const all = byProp.get(p.id) ?? [];
    const name = p.name?.trim() || p.address_line1 || '(unnamed property)';

    const cats: ChecklistCategory[] = ['documents', 'finances', 'listings'];
    const catHealth: Record<ChecklistCategory, CategoryHealth> = {} as Record<ChecklistCategory, CategoryHealth>;

    for (const cat of cats) {
      const catItems = all.filter((i) => i.category === cat);
      const worst = worstStatus(catItems.map((i) => i.status as ChecklistStatus));
      catHealth[cat] = {
        done: catItems.filter((i) => i.status === 'completed').length,
        total: CATEGORY_TOTALS[cat],
        worst,
      };
    }

    const colors = cats.map((c) => worstColor(catHealth[c].worst));
    propertyCards.push({
      id: p.id,
      name,
      city: p.city,
      state: p.state,
      coverPhotoUrl: p.cover_photo_url ?? null,
      href: `/admin/properties/${p.id}?view=launchpad`,
      documents: catHealth.documents,
      finances: catHealth.finances,
      listings: catHealth.listings,
      worstOverall: overallColor(colors),
    });

    // Collect attention items
    const nonDone = all.filter((i) =>
      ['pending_owner', 'stuck', 'in_progress'].includes(i.status),
    );
    for (const item of nonDone) {
      const days = Math.floor(
        (Date.now() - new Date(item.updated_at).getTime()) / 86_400_000,
      );
      attentionItems.push({
        propertyId: p.id,
        propertyName: name,
        propertyHref: `/admin/properties/${p.id}?view=launchpad`,
        category: item.category as ChecklistCategory,
        itemLabel: item.label,
        status: item.status as 'pending_owner' | 'stuck' | 'in_progress',
        daysInStatus: Math.max(0, days),
      });
    }
  }

  // Sort attention: stuck first, then pending_owner, then in_progress; within each by days desc
  const ORDER = { stuck: 0, pending_owner: 1, in_progress: 2 };
  attentionItems.sort((a, b) =>
    ORDER[a.status] !== ORDER[b.status]
      ? ORDER[a.status] - ORDER[b.status]
      : b.daysInStatus - a.daysInStatus,
  );

  return { propertyCards, attentionItems };
}
