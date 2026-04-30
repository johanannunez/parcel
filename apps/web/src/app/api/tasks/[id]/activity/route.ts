import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { data, error } = await (supabase as any)
    .from('task_activity')
    .select('id, field, old_value, new_value, created_at, actor:profiles!task_activity_actor_id_fkey(full_name, avatar_url)')
    .eq('task_id', id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const entries = (data ?? []).map((a: any) => {
    const actor = Array.isArray(a.actor) ? a.actor[0] : a.actor;
    return {
      id: a.id,
      field: a.field,
      oldValue: a.old_value,
      newValue: a.new_value,
      actorName: actor?.full_name ?? null,
      actorAvatarUrl: actor?.avatar_url ?? null,
      createdAt: a.created_at,
    };
  });

  return NextResponse.json(entries);
}
