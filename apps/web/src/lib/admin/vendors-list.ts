// apps/web/src/lib/admin/vendors-list.ts
import 'server-only';
import { createClient } from '@/lib/supabase/server';

export type VendorRow = {
  id: string;
  fullName: string;
  companyName: string | null;
  phone: string | null;
  email: string | null;
  trade: string | null;
  notes: string | null;
  createdAt: string;
};

export async function fetchVendors(): Promise<VendorRow[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from('vendors')
    .select('id, full_name, company_name, phone, email, trade, notes, created_at')
    .order('full_name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    fullName: r.full_name as string,
    companyName: (r.company_name as string | null) ?? null,
    phone: (r.phone as string | null) ?? null,
    email: (r.email as string | null) ?? null,
    trade: (r.trade as string | null) ?? null,
    notes: (r.notes as string | null) ?? null,
    createdAt: r.created_at as string,
  }));
}
