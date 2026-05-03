'use server';
import { createClient } from '@/lib/supabase/server';
import { normalizePhone } from './normalize-phone';

export type AssignTargetType = 'owner' | 'contact' | 'vendor';

type CommunicationEventsTable = {
  update(values: Record<string, unknown>): CommunicationEventsTable;
  eq(column: string, value: unknown): CommunicationEventsTable;
  select(columns: string): Promise<{ data: Array<{ id: string }> | null; error: { message: string } | null }>;
};

type CommunicationSupabase = {
  from(table: 'communication_events'): CommunicationEventsTable;
};

export async function assignUnknownCaller(
  rawPhone: string,
  targetType: AssignTargetType,
  targetId: string
): Promise<{ updated: number }> {
  const phone = normalizePhone(rawPhone);
  const supabase = await createClient();
  const db = supabase as unknown as CommunicationSupabase;
  const { data, error } = await db
    .from('communication_events')
    .update({ entity_type: targetType, entity_id: targetId })
    .eq('phone_from', phone)
    .eq('entity_type', 'unknown')
    .select('id');
  if (error) throw new Error(error.message);
  return { updated: (data ?? []).length };
}
