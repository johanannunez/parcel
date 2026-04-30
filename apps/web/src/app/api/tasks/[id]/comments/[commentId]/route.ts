import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { commentId } = await params;
  const { body } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: 'Body required' }, { status: 400 });
  const { data, error } = await (supabase as any)
    .from('task_comments')
    .update({ body: body.trim(), updated_at: new Date().toISOString() })
    .eq('id', commentId)
    .eq('author_id', user.id)
    .select('id, body, updated_at')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { commentId } = await params;
  const { error } = await (supabase as any)
    .from('task_comments')
    .delete()
    .eq('id', commentId)
    .eq('author_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
