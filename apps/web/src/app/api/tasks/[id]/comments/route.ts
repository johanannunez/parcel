import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { data, error } = await (supabase as any)
    .from('task_comments')
    .select('id, task_id, author_id, body, created_at, updated_at, author:profiles!task_comments_author_id_fkey(full_name, avatar_url)')
    .eq('task_id', id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const comments = (data ?? []).map((c: any) => {
    const author = Array.isArray(c.author) ? c.author[0] : c.author;
    return {
      id: c.id,
      taskId: c.task_id,
      authorId: c.author_id,
      authorName: author?.full_name ?? 'Unknown',
      authorAvatarUrl: author?.avatar_url ?? null,
      body: c.body,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    };
  });

  return NextResponse.json(comments);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { body } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: 'Body required' }, { status: 400 });

  const { data, error } = await (supabase as any)
    .from('task_comments')
    .insert({ task_id: id, author_id: user.id, body: body.trim() })
    .select('id, task_id, author_id, body, created_at, updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await (supabase as any).from('task_activity').insert({
    task_id: id, actor_id: user.id, field: 'comment', old_value: null, new_value: 'added',
  });

  const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single();

  return NextResponse.json({
    id: data.id,
    taskId: data.task_id,
    authorId: data.author_id,
    authorName: profile?.full_name ?? 'Unknown',
    authorAvatarUrl: profile?.avatar_url ?? null,
    body: data.body,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }, { status: 201 });
}
