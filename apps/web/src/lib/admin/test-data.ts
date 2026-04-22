'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function getShowTestData(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('profiles')
    .select('show_test_data')
    .eq('id', user.id)
    .single();

  return data?.show_test_data ?? false;
}

export async function toggleShowTestDataAction(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data } = await supabase
    .from('profiles')
    .select('show_test_data')
    .eq('id', user.id)
    .single();

  const next = !(data?.show_test_data ?? false);

  await supabase
    .from('profiles')
    .update({ show_test_data: next })
    .eq('id', user.id);

  revalidatePath('/admin', 'layout');
}
