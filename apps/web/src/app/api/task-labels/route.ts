import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await (supabase as any)
    .from('task_labels')
    .select('id, name, color, sort_order')
    .order('sort_order');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((data ?? []).map((l: any) => ({
    id: l.id,
    name: l.name,
    color: l.color,
    sortOrder: l.sort_order,
  })));
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as { name?: string; color?: string };
  const name = (body.name ?? '').trim();
  const color = (body.color ?? '#6b7280').trim();

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const { data, error } = await (supabase as any)
    .from('task_labels')
    .insert({ name, color })
    .select('id, name, color, sort_order')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    id: data.id,
    name: data.name,
    color: data.color,
    sortOrder: data.sort_order,
  }, { status: 201 });
}
