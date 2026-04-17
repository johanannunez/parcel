'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { applyAllDefaultTemplatesToProperty } from './template-actions';

export async function markPropertyLive(propertyId: string): Promise<{ applied: number }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('properties')
    .update({ setup_status: 'live' })
    .eq('id', propertyId);
  if (error) throw error;

  const result = await applyAllDefaultTemplatesToProperty(propertyId);
  revalidatePath(`/admin/properties/${propertyId}`);
  revalidatePath('/admin/properties');
  return result;
}
