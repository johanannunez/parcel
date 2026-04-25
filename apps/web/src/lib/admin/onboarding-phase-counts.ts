import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { ContactRow } from './contact-types';
import { ONBOARDING_PHASE_TOTALS } from './onboarding-templates';

export type PhaseCounts = {
  documents: { done: number; total: number };
  finances:  { done: number; total: number };
  listings:  { done: number; total: number };
};

type TaskRow = {
  parent_id: string;
  tags: string[];
  status: string;
};

type PropertyOwnerRow = {
  property_id: string;
  owner_id: string;
};

type DirectPropertyRow = {
  id: string;
  owner_id: string;
};

export async function fetchOnboardingPhaseCounts(
  rows: ContactRow[],
): Promise<Record<string, PhaseCounts>> {
  if (rows.length === 0) return {};

  const supabase = await createClient();

  // Build profileId → contactId map (one contact per profile)
  const profileToContact: Record<string, string> = {};
  const profileIds: string[] = [];
  for (const r of rows) {
    if (r.profileId) {
      profileToContact[r.profileId] = r.id;
      profileIds.push(r.profileId);
    }
  }

  if (profileIds.length === 0) {
    return Object.fromEntries(rows.map((r) => [r.id, emptyPhaseCounts()]));
  }

  // Fetch properties via direct ownership
  const { data: directProps } = await supabase
    .from('properties')
    .select('id, owner_id')
    .in('owner_id', profileIds) as { data: DirectPropertyRow[] | null };

  // Fetch properties via co-ownership junction
  const { data: coProps } = await (supabase as any)
    .from('property_owners')
    .select('property_id, owner_id')
    .in('owner_id', profileIds) as { data: PropertyOwnerRow[] | null };

  // Build profileId → propertyIds map
  const profileToProperties: Record<string, Set<string>> = {};
  for (const p of directProps ?? []) {
    if (!profileToProperties[p.owner_id]) profileToProperties[p.owner_id] = new Set();
    profileToProperties[p.owner_id].add(p.id);
  }
  for (const p of coProps ?? []) {
    if (!profileToProperties[p.owner_id]) profileToProperties[p.owner_id] = new Set();
    profileToProperties[p.owner_id].add(p.property_id);
  }

  // Collect all property IDs across all contacts
  const allPropertyIds = Array.from(
    new Set(Object.values(profileToProperties).flatMap((s) => Array.from(s))),
  );

  if (allPropertyIds.length === 0) {
    return Object.fromEntries(rows.map((r) => [r.id, emptyPhaseCounts()]));
  }

  // Fetch all onboarding tasks for those properties
  const { data: taskRows } = await (supabase as any)
    .from('tasks')
    .select('parent_id, tags, status')
    .eq('parent_type', 'property')
    .in('parent_id', allPropertyIds)
    .not('tags', 'is', null) as { data: TaskRow[] | null };

  const tasks = (taskRows ?? []).filter((t) =>
    (t.tags ?? []).includes('onboarding'),
  );

  // Build propertyId → tasks map
  const tasksByProperty: Record<string, TaskRow[]> = {};
  for (const t of tasks) {
    if (!tasksByProperty[t.parent_id]) tasksByProperty[t.parent_id] = [];
    tasksByProperty[t.parent_id].push(t);
  }

  // Compute phase counts per contact
  const result: Record<string, PhaseCounts> = {};

  for (const row of rows) {
    if (!row.profileId) {
      result[row.id] = emptyPhaseCounts();
      continue;
    }
    const propertyIds = Array.from(profileToProperties[row.profileId] ?? new Set());
    const contactTasks = propertyIds.flatMap((pid) => tasksByProperty[pid] ?? []);

    const phaseTag = (phase: string) => `onboarding:${phase}`;
    const countPhase = (phase: string) => {
      const phaseTasks = contactTasks.filter((t) => t.tags.includes(phaseTag(phase)));
      const done = phaseTasks.filter((t) => t.status === 'done').length;
      const total = phaseTasks.length || ONBOARDING_PHASE_TOTALS[phase as keyof typeof ONBOARDING_PHASE_TOTALS];
      return { done, total };
    };

    result[row.id] = {
      documents: countPhase('documents'),
      finances:  countPhase('finances'),
      listings:  countPhase('listings'),
    };
  }

  return result;
}

function emptyPhaseCounts(): PhaseCounts {
  return {
    documents: { done: 0, total: ONBOARDING_PHASE_TOTALS.documents },
    finances:  { done: 0, total: ONBOARDING_PHASE_TOTALS.finances },
    listings:  { done: 0, total: ONBOARDING_PHASE_TOTALS.listings },
  };
}
