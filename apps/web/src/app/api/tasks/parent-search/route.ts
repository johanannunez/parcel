import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const q = searchParams.get('q') ?? '';

  if (!type || !['property', 'contact', 'project'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  let results: { id: string; label: string }[] = [];

  if (type === 'property') {
    const { data } = await supabase
      .from('properties')
      .select('id, name, address_line1')
      .ilike('name', `%${q}%`)
      .limit(10);
    results = (data ?? []).map((r: any) => ({ id: r.id, label: r.name ?? r.address_line1 ?? 'Property' }));
  } else if (type === 'contact') {
    const { data } = await supabase
      .from('contacts')
      .select('id, full_name, company_name')
      .ilike('full_name', `%${q}%`)
      .limit(10);
    results = (data ?? []).map((r: any) => ({ id: r.id, label: r.full_name ?? r.company_name ?? 'Contact' }));
  } else if (type === 'project') {
    const { data } = await (supabase as any)
      .from('projects')
      .select('id, name')
      .ilike('name', `%${q}%`)
      .limit(10)
      .catch(() => ({ data: [] }));
    results = (data ?? []).map((r: any) => ({ id: r.id, label: r.name ?? 'Project' }));
  }

  return NextResponse.json(results);
}
