// apps/web/src/lib/admin/vendor-actions.ts
'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type CreateVendorInput = {
  fullName: string;
  companyName?: string;
  phone?: string;
  email?: string;
  trade?: string;
  notes?: string;
};

export async function createVendor(input: CreateVendorInput): Promise<{ id: string }> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .maybeSingle();
  if (!profile) throw new Error('No admin profile');

  const { data, error } = await (supabase as any)
    .from('vendors')
    .insert({
      profile_id: profile.id,
      full_name: input.fullName,
      company_name: input.companyName ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      trade: input.trade ?? null,
      notes: input.notes ?? null,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/vendors');
  return { id: data.id };
}
