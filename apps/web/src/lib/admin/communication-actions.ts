'use server';
import { createClient } from '@/lib/supabase/server';
import { normalizePhone } from './normalize-phone';

export type AssignEntityType = 'owner' | 'contact' | 'vendor';

export async function assignUnknownCaller(
  rawPhone: string,
  entityType: AssignEntityType,
  entityId: string
): Promise<{ updated: number }> {
  const phone = normalizePhone(rawPhone);
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from('communication_events')
    .update({ entity_type: entityType, entity_id: entityId })
    .eq('phone_from', phone)
    .eq('entity_type', 'unknown')
    .select('id');
  if (error) throw new Error(error.message);
  return { updated: (data ?? []).length };
}
